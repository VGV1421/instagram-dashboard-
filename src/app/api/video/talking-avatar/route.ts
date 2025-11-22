import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/simple-client';
import fs from 'fs/promises';
import path from 'path';

/**
 * POST /api/video/talking-avatar
 *
 * Genera un video de Reel AUTOMÁTICO con avatar hablando:
 * 1. Coge una foto de "FOTOS AVATAR SIN USAR"
 * 2. Genera audio del script (ElevenLabs)
 * 3. Crea video con avatar hablando (HeyGen - calidad profesional)
 * 4. Mueve la foto a "FOTOS AVAR USADAS"
 *
 * Requiere en .env.local:
 * - HEYGEN_API_KEY (o DID_API_KEY como alternativa)
 * - ELEVENLABS_API_KEY
 */

const AVATAR_UNUSED_PATH = 'C:\\Users\\Usuario\\CURSOR\\instagram-dashboard\\FOTOS AVATAR SIN USAR';
const AVATAR_USED_PATH = 'C:\\Users\\Usuario\\CURSOR\\instagram-dashboard\\FOTOS AVAR USADAS';

interface TalkingAvatarRequest {
  contentId?: string;
  script: string;
  voiceId?: string;
  quality?: 'high' | 'medium';
}

export async function POST(request: Request) {
  try {
    const body: TalkingAvatarRequest = await request.json();
    const {
      contentId,
      script,
      voiceId = 'EXAVITQu4vr4xnSDxMaL', // Sara - voz femenina española
      quality = 'high'
    } = body;

    // Verificar API keys
    const heygenKey = process.env.HEYGEN_API_KEY;
    const didKey = process.env.DID_API_KEY;
    const elevenLabsKey = process.env.ELEVENLABS_API_KEY;

    const videoProvider = heygenKey ? 'heygen' : (didKey ? 'did' : null);

    if (!videoProvider || !elevenLabsKey) {
      return NextResponse.json({
        success: false,
        error: 'Faltan API keys',
        missing: {
          HEYGEN_API_KEY: !heygenKey,
          DID_API_KEY: !didKey,
          ELEVENLABS_API_KEY: !elevenLabsKey
        },
        instructions: {
          paso1: 'Añade estas líneas a tu archivo .env.local:',
          keys: [
            'HEYGEN_API_KEY=tu_key_de_heygen',
            'ELEVENLABS_API_KEY=tu_key_de_elevenlabs'
          ],
          paso2: 'Reinicia el servidor: npm run dev',
          donde_obtenerlas: {
            heygen: 'https://www.heygen.com → Settings → API',
            elevenlabs: 'https://elevenlabs.io → Profile → API Keys'
          }
        }
      }, { status: 400 });
    }

    // PASO 1: Obtener foto de avatar sin usar
    console.log('📸 Buscando avatar disponible...');
    const avatarResult = await getUnusedAvatar();

    if (!avatarResult.success) {
      return NextResponse.json({
        success: false,
        error: 'No hay fotos de avatar disponibles',
        path: AVATAR_UNUSED_PATH,
        suggestion: 'Añade más fotos a la carpeta "FOTOS AVATAR SIN USAR"'
      }, { status: 400 });
    }

    const avatarPath = avatarResult.path!;
    const avatarFilename = avatarResult.filename!;
    console.log(`   ✅ Avatar: ${avatarFilename}`);

    // PASO 2: Generar audio con ElevenLabs
    console.log('🎙️ Generando audio...');
    const audioResult = await generateAudio(script, voiceId, elevenLabsKey);

    if (!audioResult.success) {
      return NextResponse.json({
        success: false,
        error: `Error generando audio: ${audioResult.error}`
      }, { status: 500 });
    }
    console.log('   ✅ Audio generado');

    // PASO 3: Crear video con avatar hablando
    console.log(`🎬 Creando video con ${videoProvider}...`);

    let videoResult;
    if (videoProvider === 'heygen') {
      videoResult = await createVideoWithHeyGen(avatarPath, audioResult.audioUrl!, heygenKey!);
    } else {
      videoResult = await createVideoWithDID(avatarPath, audioResult.audioUrl!, didKey!);
    }

    if (!videoResult.success) {
      return NextResponse.json({
        success: false,
        error: `Error creando video: ${videoResult.error}`
      }, { status: 500 });
    }
    console.log('   ✅ Video creado');

    // PASO 4: Mover avatar a "usadas"
    await moveAvatarToUsed(avatarFilename);
    console.log('   ✅ Avatar movido a "usadas"');

    // PASO 5: Guardar en BD
    if (contentId) {
      await supabaseAdmin
        .from('scheduled_content')
        .update({
          media_url: videoResult.videoUrl,
          status: 'ready',
          metadata: {
            video_generated: true,
            avatar_used: avatarFilename,
            video_id: videoResult.videoId,
            provider: videoProvider,
            generated_at: new Date().toISOString()
          }
        })
        .eq('id', contentId);
    }

    return NextResponse.json({
      success: true,
      data: {
        videoUrl: videoResult.videoUrl,
        videoId: videoResult.videoId,
        avatarUsed: avatarFilename,
        provider: videoProvider,
        status: videoResult.status,
        message: '¡Video generado exitosamente!'
      }
    });

  } catch (error: any) {
    console.error('❌ Error:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

// ============ FUNCIONES AUXILIARES ============

async function getUnusedAvatar(): Promise<{ success: boolean; path?: string; filename?: string }> {
  try {
    const files = await fs.readdir(AVATAR_UNUSED_PATH);
    const imageFiles = files.filter(f => /\.(png|jpg|jpeg|webp)$/i.test(f));

    if (imageFiles.length === 0) {
      return { success: false };
    }

    // Seleccionar aleatoriamente para variedad
    const randomIndex = Math.floor(Math.random() * imageFiles.length);
    const selectedFile = imageFiles[randomIndex];
    const fullPath = path.join(AVATAR_UNUSED_PATH, selectedFile);

    return { success: true, path: fullPath, filename: selectedFile };
  } catch (error) {
    return { success: false };
  }
}

async function moveAvatarToUsed(filename: string): Promise<void> {
  try {
    const sourcePath = path.join(AVATAR_UNUSED_PATH, filename);
    const destPath = path.join(AVATAR_USED_PATH, filename);
    await fs.rename(sourcePath, destPath);
  } catch (error) {
    console.error('Error moving avatar:', error);
  }
}

async function generateAudio(
  text: string,
  voiceId: string,
  apiKey: string
): Promise<{ success: boolean; audioUrl?: string; error?: string }> {
  try {
    // Limpiar texto
    const cleanText = text
      .replace(/\d+-\d+s?:\s*/gi, '')
      .replace(/["'"]/g, '')
      .replace(/\*\*/g, '')
      .replace(/#{1,}/g, '')
      .trim()
      .slice(0, 2500); // Límite ElevenLabs

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
    const audioFilename = `audio-${Date.now()}.mp3`;
    const tempDir = path.join(process.cwd(), 'public', 'temp');

    await fs.mkdir(tempDir, { recursive: true });
    await fs.writeFile(path.join(tempDir, audioFilename), Buffer.from(audioBuffer));

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    return { success: true, audioUrl: `${baseUrl}/temp/${audioFilename}` };

  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// HeyGen - Calidad profesional
async function createVideoWithHeyGen(
  imagePath: string,
  audioUrl: string,
  apiKey: string
): Promise<{ success: boolean; videoUrl?: string; videoId?: string; status?: string; error?: string }> {
  try {
    // Leer imagen y convertir a base64
    const imageBuffer = await fs.readFile(imagePath);
    const imageBase64 = imageBuffer.toString('base64');

    // Crear video con HeyGen
    const response = await fetch('https://api.heygen.com/v2/video/generate', {
      method: 'POST',
      headers: {
        'X-Api-Key': apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        video_inputs: [{
          character: {
            type: 'photo',
            photo_url: `data:image/png;base64,${imageBase64}`
          },
          voice: {
            type: 'audio',
            audio_url: audioUrl
          }
        }],
        dimension: {
          width: 1080,
          height: 1920
        },
        aspect_ratio: '9:16'
      })
    });

    if (!response.ok) {
      const error = await response.text();
      return { success: false, error };
    }

    const data = await response.json();
    const videoId = data.data?.video_id;

    if (!videoId) {
      return { success: false, error: 'No se recibió video_id' };
    }

    // Polling para obtener el video
    let videoUrl = '';
    let status = 'processing';
    let attempts = 0;

    while (status === 'processing' && attempts < 60) {
      await new Promise(resolve => setTimeout(resolve, 3000));

      const statusRes = await fetch(`https://api.heygen.com/v1/video_status.get?video_id=${videoId}`, {
        headers: { 'X-Api-Key': apiKey }
      });

      const statusData = await statusRes.json();
      status = statusData.data?.status || 'processing';

      if (status === 'completed') {
        videoUrl = statusData.data?.video_url;
        break;
      } else if (status === 'failed') {
        return { success: false, error: 'HeyGen falló al procesar el video' };
      }

      attempts++;
    }

    return {
      success: true,
      videoUrl: videoUrl || undefined,
      videoId,
      status: videoUrl ? 'completed' : 'processing'
    };

  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// D-ID - Alternativa más económica
async function createVideoWithDID(
  imagePath: string,
  audioUrl: string,
  apiKey: string
): Promise<{ success: boolean; videoUrl?: string; videoId?: string; status?: string; error?: string }> {
  try {
    const imageBuffer = await fs.readFile(imagePath);
    const imageBase64 = imageBuffer.toString('base64');
    const imageExt = path.extname(imagePath).slice(1);

    const response = await fetch('https://api.d-id.com/talks', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        source_url: `data:image/${imageExt};base64,${imageBase64}`,
        script: {
          type: 'audio',
          audio_url: audioUrl
        },
        config: {
          fluent: true,
          pad_audio: 0.5
        }
      })
    });

    if (!response.ok) {
      const error = await response.text();
      return { success: false, error };
    }

    const data = await response.json();
    const talkId = data.id;

    // Polling
    let videoUrl = '';
    let status = 'processing';
    let attempts = 0;

    while (status !== 'done' && attempts < 30) {
      await new Promise(resolve => setTimeout(resolve, 2000));

      const statusRes = await fetch(`https://api.d-id.com/talks/${talkId}`, {
        headers: { 'Authorization': `Basic ${apiKey}` }
      });

      const statusData = await statusRes.json();
      status = statusData.status;

      if (status === 'done') {
        videoUrl = statusData.result_url;
        break;
      }

      attempts++;
    }

    return {
      success: true,
      videoUrl: videoUrl || undefined,
      videoId: talkId,
      status: videoUrl ? 'done' : 'processing'
    };

  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// GET: Estado y avatares disponibles
export async function GET() {
  try {
    const unusedFiles = await fs.readdir(AVATAR_UNUSED_PATH).catch(() => []);
    const usedFiles = await fs.readdir(AVATAR_USED_PATH).catch(() => []);

    const unusedImages = unusedFiles.filter(f => /\.(png|jpg|jpeg|webp)$/i.test(f));
    const usedImages = usedFiles.filter(f => /\.(png|jpg|jpeg|webp)$/i.test(f));

    const heygenKey = process.env.HEYGEN_API_KEY;
    const didKey = process.env.DID_API_KEY;
    const elevenLabsKey = process.env.ELEVENLABS_API_KEY;

    return NextResponse.json({
      success: true,
      data: {
        avatarsDisponibles: unusedImages.length,
        avatarsUsados: usedImages.length,
        listaDisponibles: unusedImages.slice(0, 10),
        apiConfigured: {
          heygen: !!heygenKey,
          did: !!didKey,
          elevenlabs: !!elevenLabsKey,
          ready: (!!heygenKey || !!didKey) && !!elevenLabsKey
        },
        provider: heygenKey ? 'heygen' : (didKey ? 'did' : 'none'),
        instructions: (!heygenKey && !didKey) || !elevenLabsKey ? {
          message: 'Añade las API keys a .env.local:',
          keys: [
            'HEYGEN_API_KEY=tu_key (https://heygen.com)',
            'ELEVENLABS_API_KEY=tu_key (https://elevenlabs.io)'
          ]
        } : null
      }
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message });
  }
}
