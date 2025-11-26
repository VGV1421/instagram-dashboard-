import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/simple-client';
import { notifyVideoReady } from '@/lib/email/notifications';
import fs from 'fs/promises';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * POST /api/video/add-voice
 *
 * Añade voz a un video existente:
 * 1. Coge un video de "VIDEOS SIN VOZ"
 * 2. Genera audio con ElevenLabs (español)
 * 3. Combina video + audio con FFmpeg
 * 4. Guarda en "VIDEOS CON VOZ"
 * 5. Sube a Supabase Storage para URL pública
 *
 * Requiere:
 * - ELEVENLABS_API_KEY
 * - FFmpeg instalado
 */

// Carpetas del flujo de videos
const VIDEOS_BASE = 'C:\\Users\\Usuario\\CURSOR\\instagram-dashboard\\VIDEOS AVATAR SIN USAR SIN SONIDO';
const VIDEOS_SELECCIONADOS = 'C:\\Users\\Usuario\\CURSOR\\instagram-dashboard\\VIDEO SELECCIONADO PARA PONER VOZ';
const VIDEOS_FINALES = 'C:\\Users\\Usuario\\CURSOR\\instagram-dashboard\\VIDEOS FINALES';
const FFMPEG_PATH = 'C:\\Users\\Usuario\\AppData\\Local\\Microsoft\\WinGet\\Links\\ffmpeg.exe';

interface AddVoiceRequest {
  script: string;           // Texto a convertir en voz
  videoFilename?: string;   // Nombre del video (opcional, usa el primero disponible)
  voiceId?: string;         // ID de voz de ElevenLabs
  contentId?: string;       // ID para guardar en BD
}

export async function POST(request: Request) {
  try {
    const body: AddVoiceRequest = await request.json();
    const {
      script,
      videoFilename,
      voiceId = 'XB0fDUnXU5powFXDhCwa', // Charlotte - voz femenina española
      contentId
    } = body;

    if (!script) {
      return NextResponse.json({
        success: false,
        error: 'Se requiere el script (texto para la voz)'
      }, { status: 400 });
    }

    const elevenLabsKey = process.env.ELEVENLABS_API_KEY;

    if (!elevenLabsKey) {
      return NextResponse.json({
        success: false,
        error: 'Falta ELEVENLABS_API_KEY',
        instructions: {
          paso1: 'Crea cuenta en https://elevenlabs.io',
          paso2: 'Ve a Profile > API Keys',
          paso3: 'Copia tu API key',
          paso4: 'Añade a .env.local: ELEVENLABS_API_KEY=tu_key'
        }
      }, { status: 400 });
    }

    // PASO 1: Obtener video de "VIDEO SELECCIONADO PARA PONER VOZ"
    console.log('Buscando video seleccionado para poner voz...');
    const videoResult = await getVideoSeleccionado(videoFilename);

    if (!videoResult.success) {
      return NextResponse.json({
        success: false,
        error: 'No hay videos en "VIDEO SELECCIONADO PARA PONER VOZ"',
        path: VIDEOS_SELECCIONADOS,
        suggestion: 'Primero aprueba una propuesta para mover el video a esta carpeta'
      }, { status: 400 });
    }

    const videoPath = videoResult.path!;
    const videoName = videoResult.filename!;
    console.log(`   Video: ${videoName}`);

    // PASO 2: Generar audio con ElevenLabs
    console.log('Generando audio con ElevenLabs...');
    const audioResult = await generateAudioElevenLabs(script, voiceId, elevenLabsKey);

    if (!audioResult.success) {
      return NextResponse.json({
        success: false,
        error: `Error generando audio: ${audioResult.error}`
      }, { status: 500 });
    }

    const audioPath = audioResult.audioPath!;
    console.log(`   Audio generado: ${audioPath}`);

    // PASO 3: Combinar video + audio con FFmpeg
    console.log('Combinando video + audio...');
    const outputFilename = `final_${Date.now()}_${videoName}`;
    const outputPath = path.join(VIDEOS_FINALES, outputFilename);

    const combineResult = await combineVideoAudio(videoPath, audioPath, outputPath);

    if (!combineResult.success) {
      return NextResponse.json({
        success: false,
        error: `Error combinando: ${combineResult.error}`
      }, { status: 500 });
    }

    console.log(`   Video con voz: ${outputPath}`);

    // PASO 4: Subir a Supabase Storage
    console.log('Subiendo a Supabase Storage...');
    const uploadResult = await uploadToStorage(outputPath, outputFilename);

    // PASO 5: Mover video original a procesados (opcional)
    // await moveVideoToProcesados(videoName);

    // PASO 6: Guardar en BD si hay contentId
    if (contentId && uploadResult.success) {
      await supabaseAdmin
        .from('scheduled_content')
        .update({
          media_url: uploadResult.url,
          status: 'ready',
          metadata: {
            video_with_voice: true,
            original_video: videoName,
            voice_id: voiceId,
            generated_at: new Date().toISOString()
          }
        })
        .eq('id', contentId);
    }

    // PASO 7: Notificar por email
    if (uploadResult.success && uploadResult.url) {
      await notifyVideoReady(uploadResult.url, contentId, 'Video con voz generado');
    }

    // Limpiar audio temporal
    await fs.unlink(audioPath).catch(() => {});

    return NextResponse.json({
      success: true,
      data: {
        videoUrl: uploadResult.url || outputPath,
        localPath: outputPath,
        originalVideo: videoName,
        voiceId,
        message: 'Video con voz generado exitosamente!'
      }
    });

  } catch (error: any) {
    console.error('Error:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

// Obtener video de "VIDEO SELECCIONADO PARA PONER VOZ"
async function getVideoSeleccionado(specificFilename?: string): Promise<{ success: boolean; path?: string; filename?: string }> {
  try {
    const files = await fs.readdir(VIDEOS_SELECCIONADOS);
    const videoFiles = files.filter(f => /\.(mp4|mov|avi|webm)$/i.test(f));

    if (videoFiles.length === 0) {
      return { success: false };
    }

    let selectedFile: string;

    if (specificFilename && videoFiles.includes(specificFilename)) {
      selectedFile = specificFilename;
    } else {
      // Usar el primero disponible
      selectedFile = videoFiles[0];
    }

    const fullPath = path.join(VIDEOS_SELECCIONADOS, selectedFile);
    return { success: true, path: fullPath, filename: selectedFile };
  } catch (error) {
    return { success: false };
  }
}

// Obtener video base de "VIDEOS AVATAR SIN USAR SIN SONIDO"
async function getVideoBase(specificFilename?: string): Promise<{ success: boolean; path?: string; filename?: string }> {
  try {
    const files = await fs.readdir(VIDEOS_BASE);
    const videoFiles = files.filter(f => /\.(mp4|mov|avi|webm)$/i.test(f));

    if (videoFiles.length === 0) {
      return { success: false };
    }

    let selectedFile: string;

    if (specificFilename && videoFiles.includes(specificFilename)) {
      selectedFile = specificFilename;
    } else {
      // Usar el primero disponible
      selectedFile = videoFiles[0];
    }

    const fullPath = path.join(VIDEOS_BASE, selectedFile);
    return { success: true, path: fullPath, filename: selectedFile };
  } catch (error) {
    return { success: false };
  }
}

// Generar audio con ElevenLabs
async function generateAudioElevenLabs(
  text: string,
  voiceId: string,
  apiKey: string
): Promise<{ success: boolean; audioPath?: string; error?: string }> {
  try {
    // Limpiar texto - IMPORTANTE: máximo 400 caracteres para plan gratuito ElevenLabs
    // ~400 chars = ~30 segundos de audio
    const cleanText = text
      .replace(/\d+-\d+s?:\s*/gi, '') // Quitar timestamps como "0-5s:"
      .replace(/["'"]/g, '')          // Quitar comillas
      .replace(/\*\*/g, '')           // Quitar markdown bold
      .replace(/#{1,}/g, '')          // Quitar headers markdown
      .replace(/\(Hook\)|Hook:|Valor:|Ejemplo:|Llamada a accion:|Cierre:|Intro visual.*?\)/gi, '') // Quitar etiquetas
      .replace(/[\u{1F300}-\u{1F9FF}]/gu, '') // Quitar emojis
      .replace(/\n+/g, ' ')           // Newlines a espacios
      .replace(/\s+/g, ' ')           // Múltiples espacios a uno
      .trim()
      .slice(0, 400); // MAX 400 caracteres para plan gratuito

    console.log(`   Texto limpio (${cleanText.length} chars): ${cleanText.slice(0, 80)}...`);

    console.log(`   Texto: ${cleanText.slice(0, 100)}...`);

    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'xi-api-key': apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text: cleanText,
          model_id: 'eleven_multilingual_v2',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
            style: 0.5,
            use_speaker_boost: true
          }
        })
      }
    );

    if (!response.ok) {
      const error = await response.text();
      return { success: false, error };
    }

    const audioBuffer = await response.arrayBuffer();
    const audioFilename = `audio_${Date.now()}.mp3`;
    const audioPath = path.join(VIDEOS_FINALES, audioFilename);

    await fs.writeFile(audioPath, Buffer.from(audioBuffer));

    return { success: true, audioPath };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Combinar video + audio con FFmpeg
async function combineVideoAudio(
  videoPath: string,
  audioPath: string,
  outputPath: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Verificar FFmpeg usando ruta completa
    try {
      await execAsync(`"${FFMPEG_PATH}" -version`);
    } catch {
      // Intentar con ffmpeg en PATH
      try {
        await execAsync('ffmpeg -version');
      } catch {
        return {
          success: false,
          error: 'FFmpeg no está instalado. Instálalo con: winget install ffmpeg'
        };
      }
    }

    // Combinar: reemplazar audio del video con el nuevo audio
    // -y: sobrescribir si existe
    // -i: inputs (video y audio)
    // -c:v copy: copiar video sin recodificar
    // -c:a aac: codificar audio a AAC
    // -map 0:v:0: usar video del primer input
    // -map 1:a:0: usar audio del segundo input
    // -shortest: terminar cuando el más corto termine
    const command = `"${FFMPEG_PATH}" -y -i "${videoPath}" -i "${audioPath}" -c:v copy -c:a aac -map 0:v:0 -map 1:a:0 -shortest "${outputPath}"`;

    console.log(`   Ejecutando FFmpeg...`);
    const { stdout, stderr } = await execAsync(command);
    if (stderr) console.log(`   FFmpeg log: ${stderr.slice(0, 200)}`);

    // Verificar que se creó el archivo
    const stat = await fs.stat(outputPath).catch(() => null);
    if (!stat) {
      return { success: false, error: 'No se generó el archivo de salida' };
    }

    console.log(`   Video generado: ${outputPath}`);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Subir a Supabase Storage
async function uploadToStorage(
  filePath: string,
  filename: string
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    const fileBuffer = await fs.readFile(filePath);

    const { data, error } = await supabaseAdmin.storage
      .from('avatars') // Reutilizamos el bucket
      .upload(`videos/${filename}`, fileBuffer, {
        contentType: 'video/mp4',
        upsert: true
      });

    if (error) {
      console.error('Error subiendo:', error.message);
      return { success: false, error: error.message };
    }

    const { data: publicUrl } = supabaseAdmin.storage
      .from('avatars')
      .getPublicUrl(`videos/${filename}`);

    return { success: true, url: publicUrl.publicUrl };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// GET: Listar videos en cada etapa del flujo
export async function GET() {
  try {
    const baseFiles = await fs.readdir(VIDEOS_BASE).catch(() => []);
    const seleccionadosFiles = await fs.readdir(VIDEOS_SELECCIONADOS).catch(() => []);
    const finalesFiles = await fs.readdir(VIDEOS_FINALES).catch(() => []);

    const videosBase = baseFiles.filter(f => /\.(mp4|mov|avi|webm)$/i.test(f));
    const videosSeleccionados = seleccionadosFiles.filter(f => /\.(mp4|mov|avi|webm)$/i.test(f));
    const videosFinales = finalesFiles.filter(f => /\.(mp4|mov|avi|webm)$/i.test(f));

    const elevenLabsKey = process.env.ELEVENLABS_API_KEY;

    // Verificar FFmpeg usando ruta completa o PATH
    let ffmpegInstalled = false;
    try {
      await execAsync(`"${FFMPEG_PATH}" -version`);
      ffmpegInstalled = true;
    } catch {
      try {
        await execAsync('ffmpeg -version');
        ffmpegInstalled = true;
      } catch {}
    }

    return NextResponse.json({
      success: true,
      data: {
        flujo: {
          paso1_base: {
            cantidad: videosBase.length,
            videos: videosBase,
            descripcion: 'Videos sin voz disponibles para propuestas'
          },
          paso2_seleccionados: {
            cantidad: videosSeleccionados.length,
            videos: videosSeleccionados,
            descripcion: 'Videos aprobados listos para añadir voz'
          },
          paso3_finales: {
            cantidad: videosFinales.length,
            videos: videosFinales.slice(0, 10),
            descripcion: 'Videos con voz listos para publicar'
          }
        },
        config: {
          elevenlabs: !!elevenLabsKey,
          ffmpeg: ffmpegInstalled,
          ready: !!elevenLabsKey && ffmpegInstalled
        },
        paths: {
          base: VIDEOS_BASE,
          seleccionados: VIDEOS_SELECCIONADOS,
          finales: VIDEOS_FINALES
        },
        instructions: !ffmpegInstalled ? {
          message: 'FFmpeg no está instalado',
          install: 'winget install ffmpeg'
        } : null
      }
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message });
  }
}
