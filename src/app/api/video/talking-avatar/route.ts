import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/simple-client';
import { notifyVideoReady, notifyError } from '@/lib/email/notifications';
import fs from 'fs/promises';
import path from 'path';

/**
 * POST /api/video/talking-avatar
 *
 * Genera un video de Reel AUTOMATICO con avatar hablando:
 * 1. Coge una foto de "FOTOS AVATAR SIN USAR"
 * 2. Crea video con avatar hablando usando HeyGen (prioridad) o D-ID
 * 3. Mueve la foto a "FOTOS AVAR USADAS"
 *
 * PRIORIDAD DE PROVIDERS (de mejor a peor calidad):
 * 1. HeyGen - Mejor calidad, mas natural, sin marca de agua (de pago)
 * 2. D-ID + ElevenLabs - Buena calidad con voz espanola
 * 3. D-ID solo - Calidad basica, marca de agua en plan gratis
 *
 * Requiere en .env.local:
 * - HEYGEN_API_KEY (recomendado - https://heygen.com)
 * - DID_API_KEY (fallback - https://d-id.com)
 * - ELEVENLABS_API_KEY (opcional - para voz espanola con D-ID)
 */

const AVATAR_UNUSED_PATH = 'C:\\Users\\Usuario\\CURSOR\\instagram-dashboard\\FOTOS AVATAR SIN USAR';
const AVATAR_USED_PATH = 'C:\\Users\\Usuario\\CURSOR\\instagram-dashboard\\FOTOS AVAR USADAS';

interface TalkingAvatarRequest {
  contentId?: string;
  script: string;
  voiceId?: string; // ID de voz D-ID o ElevenLabs
  language?: string; // es, en, etc.
  quality?: 'high' | 'medium';
}

export async function POST(request: Request) {
  try {
    const body: TalkingAvatarRequest = await request.json();
    const {
      contentId,
      script,
      voiceId = 'es-ES-ElviraNeural', // Voz española femenina de Microsoft
      language = 'es',
      quality = 'high'
    } = body;

    // Verificar API keys - Prioridad: HeyGen > D-ID
    const heygenKey = process.env.HEYGEN_API_KEY;
    const didKey = process.env.DID_API_KEY;
    const elevenLabsKey = process.env.ELEVENLABS_API_KEY;

    if (!heygenKey && !didKey) {
      return NextResponse.json({
        success: false,
        error: 'Falta configurar un provider de video',
        instructions: {
          recomendado: {
            provider: 'HeyGen (mejor calidad)',
            paso1: 'Crea cuenta en https://heygen.com',
            paso2: 'Ve a Settings > API',
            paso3: 'Copia tu API key',
            paso4: 'Anade a .env.local: HEYGEN_API_KEY=tu_key'
          },
          alternativa: {
            provider: 'D-ID (calidad basica)',
            paso1: 'Crea cuenta en https://d-id.com',
            paso2: 'Ve a Settings > API',
            paso3: 'Anade a .env.local: DID_API_KEY=tu_key'
          }
        }
      }, { status: 400 });
    }

    const provider = heygenKey ? 'heygen' : 'did';
    console.log(`Provider seleccionado: ${provider.toUpperCase()}`);
    console.log(`ElevenLabs: ${elevenLabsKey ? 'SI' : 'NO'}`);

    // PASO 1: AGENTE SELECTOR - Seleccionar foto más adecuada según el tema
    console.log('🤖 Agente Selector analizando fotos disponibles...');
    const avatarResult = await selectBestAvatar(script);

    if (!avatarResult.success) {
      return NextResponse.json({
        success: false,
        error: 'No hay fotos de avatar disponibles',
        path: AVATAR_UNUSED_PATH,
        suggestion: 'Anade mas fotos a la carpeta "FOTOS AVATAR SIN USAR"'
      }, { status: 400 });
    }

    const avatarPath = avatarResult.path!;
    const avatarFilename = avatarResult.filename!;
    console.log(`✅ Avatar seleccionado: ${avatarFilename}`);
    console.log(`📝 Razón: ${avatarResult.reason}`);

    // PASO 2: AGENTE GENERADOR - Crear video profesional
    console.log('🎬 Agente Generador iniciando producción de video...');
    console.log(`   Provider: ${provider.toUpperCase()}`);
    let videoResult;

    if (provider === 'heygen' && heygenKey) {
      // HeyGen - Mejor calidad, mas profesional
      console.log('   Generando con HeyGen (calidad premium)...');

      // Primero generar audio con ElevenLabs para voz espanola
      if (elevenLabsKey) {
        console.log('   Generando audio con ElevenLabs...');
        const audioResult = await generateAudio(script, voiceId, elevenLabsKey);

        if (audioResult.success) {
          videoResult = await createVideoWithHeyGenAudio(avatarPath, audioResult.audioUrl!, heygenKey);
        } else {
          console.log('   ElevenLabs fallo, usando TTS de HeyGen');
          videoResult = await createVideoWithHeyGenText(avatarPath, script, heygenKey, language);
        }
      } else {
        videoResult = await createVideoWithHeyGenText(avatarPath, script, heygenKey, language);
      }
    } else if (didKey) {
      // D-ID - Fallback
      console.log('Creando video con D-ID...');

      if (elevenLabsKey) {
        console.log('   Usando voz ElevenLabs...');
        const audioResult = await generateAudio(script, voiceId, elevenLabsKey);

        if (!audioResult.success) {
          console.log('   ElevenLabs fallo, usando TTS nativo de D-ID');
          videoResult = await createVideoWithDIDText(avatarPath, script, didKey, language);
        } else {
          videoResult = await createVideoWithDIDAudio(avatarPath, audioResult.audioUrl!, didKey);
        }
      } else {
        console.log('   Usando TTS nativo de D-ID...');
        videoResult = await createVideoWithDIDText(avatarPath, script, didKey, language);
      }
    } else {
      return NextResponse.json({
        success: false,
        error: 'No hay provider de video configurado'
      }, { status: 400 });
    }

    if (!videoResult.success) {
      return NextResponse.json({
        success: false,
        error: `Error creando video: ${videoResult.error}`
      }, { status: 500 });
    }
    console.log('   Video creado!');

    // PASO 3: Mover avatar a "usadas"
    await moveAvatarToUsed(avatarFilename);
    console.log('   Avatar movido a "usadas"');

    // PASO 4: Guardar en BD
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
            provider: provider,
            generated_at: new Date().toISOString()
          }
        })
        .eq('id', contentId);
    }

    // PASO 5: Enviar notificacion por email
    if (videoResult.videoUrl) {
      try {
        await notifyVideoReady(videoResult.videoUrl);
        console.log('Email de video listo enviado');
      } catch (emailError) {
        console.error('Error enviando notificacion de video:', emailError);
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        videoUrl: videoResult.videoUrl,
        videoId: videoResult.videoId,
        avatarUsed: avatarFilename,
        provider: provider,
        status: videoResult.status,
        message: `Video generado exitosamente con ${provider === 'heygen' ? 'HeyGen (calidad profesional)' : 'D-ID'}!`
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

/**
 * AGENTE SELECTOR DE FOTO
 * Analiza todas las fotos disponibles con GPT-4 Vision y selecciona
 * la más adecuada según el tema y contenido del reel
 */
async function selectBestAvatar(script: string): Promise<{
  success: boolean;
  path?: string;
  filename?: string;
  reason?: string;
}> {
  try {
    const files = await fs.readdir(AVATAR_UNUSED_PATH);
    const imageFiles = files.filter(f => /\.(png|jpg|jpeg|webp)$/i.test(f));

    if (imageFiles.length === 0) {
      return { success: false };
    }

    console.log(`   Encontradas ${imageFiles.length} fotos para analizar`);

    // Si solo hay 1 foto, usarla directamente
    if (imageFiles.length === 1) {
      const fullPath = path.join(AVATAR_UNUSED_PATH, imageFiles[0]);
      return {
        success: true,
        path: fullPath,
        filename: imageFiles[0],
        reason: 'Única foto disponible'
      };
    }

    // ANALIZAR FOTOS CON GPT-4 VISION
    const OpenAI = (await import('openai')).default;
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    // Preparar imágenes en base64 (máximo 5 para no saturar)
    const photosToAnalyze = imageFiles.slice(0, 5);
    const imageDescriptions = await Promise.all(
      photosToAnalyze.map(async (filename, index) => {
        const imagePath = path.join(AVATAR_UNUSED_PATH, filename);
        const imageBuffer = await fs.readFile(imagePath);
        const base64Image = imageBuffer.toString('base64');
        const ext = filename.split('.').pop()?.toLowerCase();
        const mimeType = ext === 'png' ? 'image/png' : 'image/jpeg';

        return {
          filename,
          index: index + 1,
          data: `data:${mimeType};base64,${base64Image}`
        };
      })
    );

    // Llamar a GPT-4 Vision para seleccionar la mejor foto
    console.log('   Consultando a GPT-4 Vision para selección inteligente...');

    const prompt = `Eres un agente especialista en selección de avatares para videos de Instagram Reels.

TEMA DEL REEL:
${script.slice(0, 500)}

FOTOS DISPONIBLES:
${imageDescriptions.map(img => `Foto ${img.index}: ${img.filename}`).join('\n')}

TAREA:
Analiza cada foto y selecciona LA MEJOR para este reel considerando:
1. Expresión facial apropiada para el tema
2. Iluminación y calidad de imagen
3. Fondo profesional y no distractor
4. Conexión emocional con el mensaje
5. Calidad general de la foto

RESPONDE EN ESTE FORMATO JSON:
{
  "selected_index": <número de foto seleccionada (1-${imageDescriptions.length})>,
  "reason": "<razón breve en español de por qué esta foto es la mejor>"
}`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            ...imageDescriptions.map(img => ({
              type: 'image_url' as const,
              image_url: { url: img.data }
            }))
          ]
        }
      ],
      max_tokens: 300,
      temperature: 0.3
    });

    const response = completion.choices[0]?.message?.content || '{}';
    const selection = JSON.parse(response.match(/\{[\s\S]*\}/)?.[0] || '{}');

    const selectedIndex = selection.selected_index - 1;
    const selectedFile = imageDescriptions[selectedIndex]?.filename || imageFiles[0];
    const fullPath = path.join(AVATAR_UNUSED_PATH, selectedFile);

    console.log(`   ✅ Selección: ${selectedFile}`);
    console.log(`   📝 ${selection.reason}`);

    return {
      success: true,
      path: fullPath,
      filename: selectedFile,
      reason: selection.reason || 'Seleccionada por IA'
    };

  } catch (error: any) {
    console.error('Error en selección inteligente:', error.message);
    // Fallback: seleccionar primera foto disponible
    const files = await fs.readdir(AVATAR_UNUSED_PATH);
    const imageFiles = files.filter(f => /\.(png|jpg|jpeg|webp)$/i.test(f));

    if (imageFiles.length === 0) {
      return { success: false };
    }

    const fullPath = path.join(AVATAR_UNUSED_PATH, imageFiles[0]);
    return {
      success: true,
      path: fullPath,
      filename: imageFiles[0],
      reason: 'Fallback: primera foto disponible'
    };
  }
}

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
    // Limpiar texto para ~30 segundos de audio
    const cleanText = text
      .replace(/\d+-\d+s?:\s*/gi, '')
      .replace(/["'"]/g, '')
      .replace(/\*\*/g, '')
      .replace(/#{1,}/g, '')
      .replace(/\(Hook\)|Hook:|Valor:|Ejemplo:|Llamada a accion:|Cierre:/gi, '')
      .replace(/[\u{1F300}-\u{1F9FF}]/gu, '') // Remover emojis
      .replace(/\n+/g, ' ')
      .trim()
      .slice(0, 1500); // Texto para ~30 segundos

    // Voz española por defecto de ElevenLabs
    // "Antoni" es una voz masculina que soporta español via eleven_multilingual_v2
    // "Charlotte" es femenina y tambien soporta español
    const spanishVoiceId = voiceId || 'XB0fDUnXU5powFXDhCwa'; // Charlotte - femenina, español

    console.log(`   Generando audio con ElevenLabs (voz: ${spanishVoiceId})...`);
    console.log(`   Texto: ${cleanText.slice(0, 100)}...`);

    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${spanishVoiceId}`,
      {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'xi-api-key': apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text: cleanText,
          model_id: 'eleven_multilingual_v2', // Modelo multilenguaje para español
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
      console.error('   ElevenLabs error:', error);
      return { success: false, error };
    }

    console.log('   Audio generado, subiendo a Supabase Storage...');

    // Subir audio a Supabase Storage para URL publica (D-ID necesita URL accesible)
    const audioBuffer = await response.arrayBuffer();
    const audioFilename = `audio-${Date.now()}.mp3`;

    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('avatars') // Reutilizamos el bucket de avatars
      .upload(`audio/${audioFilename}`, Buffer.from(audioBuffer), {
        contentType: 'audio/mpeg',
        upsert: true
      });

    if (uploadError) {
      console.error('   Error subiendo audio a Storage:', uploadError.message);
      return { success: false, error: uploadError.message };
    }

    // Obtener URL publica
    const { data: publicUrl } = supabaseAdmin.storage
      .from('avatars')
      .getPublicUrl(`audio/${audioFilename}`);

    console.log(`   Audio subido: ${publicUrl.publicUrl}`);
    return { success: true, audioUrl: publicUrl.publicUrl };

  } catch (error: any) {
    console.error('   Error generando audio:', error.message);
    return { success: false, error: error.message };
  }
}

// HeyGen con audio externo (ElevenLabs) - Mejor calidad
async function createVideoWithHeyGenAudio(
  imagePath: string,
  audioUrl: string,
  apiKey: string
): Promise<{ success: boolean; videoUrl?: string; videoId?: string; status?: string; error?: string }> {
  try {
    // Subir imagen a Supabase Storage para URL publica
    const imageBuffer = await fs.readFile(imagePath);
    const imageFilename = `avatar-heygen-${Date.now()}.${path.extname(imagePath).slice(1) || 'png'}`;

    console.log('   Subiendo avatar a Supabase Storage...');
    const { error: uploadError } = await supabaseAdmin.storage
      .from('avatars')
      .upload(imageFilename, imageBuffer, {
        contentType: `image/${path.extname(imagePath).slice(1) === 'jpg' ? 'jpeg' : path.extname(imagePath).slice(1) || 'png'}`,
        upsert: true
      });

    let imageUrl: string;

    if (uploadError) {
      console.log(`   Error subiendo: ${uploadError.message}, usando base64...`);
      const imageBase64 = imageBuffer.toString('base64');
      imageUrl = `data:image/png;base64,${imageBase64}`;
    } else {
      const { data: publicUrl } = supabaseAdmin.storage
        .from('avatars')
        .getPublicUrl(imageFilename);
      imageUrl = publicUrl.publicUrl;
      console.log(`   Avatar subido: ${imageUrl}`);
    }

    console.log('   Creando video con HeyGen + audio externo...');
    console.log(`   Audio URL: ${audioUrl}`);

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
            type: 'talking_photo',
            talking_photo_url: imageUrl
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

// HeyGen con TTS nativo - Sin necesidad de ElevenLabs
async function createVideoWithHeyGenText(
  imagePath: string,
  text: string,
  apiKey: string,
  language: string = 'es'
): Promise<{ success: boolean; videoUrl?: string; videoId?: string; status?: string; error?: string }> {
  try {
    // Limpiar texto
    const cleanText = text
      .replace(/\d+-\d+s?:\s*/gi, '')
      .replace(/["'"]/g, '')
      .replace(/\*\*/g, '')
      .replace(/#{1,}/g, '')
      .replace(/\(Hook\)|Hook:|Valor:|Ejemplo:|Llamada a accion:|Cierre:/gi, '')
      .replace(/[\u{1F300}-\u{1F9FF}]/gu, '')
      .replace(/\n+/g, ' ')
      .trim()
      .slice(0, 1500);

    // Subir imagen a Supabase Storage
    const imageBuffer = await fs.readFile(imagePath);
    const imageFilename = `avatar-heygen-${Date.now()}.${path.extname(imagePath).slice(1) || 'png'}`;

    console.log('   Subiendo avatar a Supabase Storage...');
    const { error: uploadError } = await supabaseAdmin.storage
      .from('avatars')
      .upload(imageFilename, imageBuffer, {
        contentType: `image/${path.extname(imagePath).slice(1) === 'jpg' ? 'jpeg' : path.extname(imagePath).slice(1) || 'png'}`,
        upsert: true
      });

    let imageUrl: string;

    if (uploadError) {
      console.log(`   Error subiendo: ${uploadError.message}, usando base64...`);
      const imageBase64 = imageBuffer.toString('base64');
      imageUrl = `data:image/png;base64,${imageBase64}`;
    } else {
      const { data: publicUrl } = supabaseAdmin.storage
        .from('avatars')
        .getPublicUrl(imageFilename);
      imageUrl = publicUrl.publicUrl;
      console.log(`   Avatar subido: ${imageUrl}`);
    }

    console.log('   Creando video con HeyGen + TTS nativo...');

    // Voz espanola de HeyGen
    // Opciones: es-ES-ElviraNeural, es-ES-AlvaroNeural, es-MX-DaliaNeural
    const voiceId = language === 'es' ? 'es-ES-ElviraNeural' : 'en-US-JennyNeural';

    const response = await fetch('https://api.heygen.com/v2/video/generate', {
      method: 'POST',
      headers: {
        'X-Api-Key': apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        video_inputs: [{
          character: {
            type: 'talking_photo',
            talking_photo_url: imageUrl
          },
          voice: {
            type: 'text',
            input_text: cleanText,
            voice_id: voiceId
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
      console.error('HeyGen Error:', error);
      return { success: false, error: `HeyGen API error: ${response.status} - ${error}` };
    }

    const data = await response.json();
    const videoId = data.data?.video_id;

    if (!videoId) {
      return { success: false, error: 'No se recibio video_id de HeyGen' };
    }

    console.log(`   Video ID: ${videoId}`);

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

      console.log(`   Status: ${status} (intento ${attempts + 1})`);

      if (status === 'completed') {
        videoUrl = statusData.data?.video_url;
        break;
      } else if (status === 'failed') {
        return { success: false, error: 'HeyGen fallo al procesar el video' };
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

// D-ID con texto (TTS nativo) - No requiere ElevenLabs
async function createVideoWithDIDText(
  imagePath: string,
  text: string,
  apiKey: string,
  language: string = 'es'
): Promise<{ success: boolean; videoUrl?: string; videoId?: string; status?: string; error?: string }> {
  try {
    // Limpiar texto para video de ~30 segundos
    const cleanText = text
      .replace(/\d+-\d+s?:\s*/gi, '')
      .replace(/["'"]/g, '')
      .replace(/\*\*/g, '')
      .replace(/#{1,}/g, '')
      .replace(/\(Hook\)|Hook:|Valor:|Ejemplo:|Llamada a accion:|Cierre:/gi, '')
      .replace(/[\u{1F300}-\u{1F9FF}]/gu, '') // Remover emojis
      .replace(/\n+/g, ' ')
      .trim()
      .slice(0, 1500); // Texto mas largo para video de 30 segundos

    // D-ID requiere base64(apiKey:) para Basic auth
    const authKey = Buffer.from(`${apiKey}:`).toString('base64');

    // Subir imagen a Supabase Storage para obtener URL pública
    const imageBuffer = await fs.readFile(imagePath);
    const imageFilename = `avatar-${Date.now()}.${path.extname(imagePath).slice(1) || 'png'}`;

    console.log(`   Subiendo avatar a Supabase Storage...`);
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('avatars')
      .upload(imageFilename, imageBuffer, {
        contentType: `image/${path.extname(imagePath).slice(1) === 'jpg' ? 'jpeg' : path.extname(imagePath).slice(1) || 'png'}`,
        upsert: true
      });

    let imageUrl: string;

    if (uploadError) {
      console.log(`   Error subiendo a Storage: ${uploadError.message}`);
      console.log(`   Usando imagen alice de D-ID como fallback...`);
      // alice.jpg es la imagen que funciona con el plan gratuito de D-ID
      imageUrl = 'https://d-id-public-bucket.s3.us-west-2.amazonaws.com/alice.jpg';
    } else {
      // Obtener URL pública
      const { data: publicUrl } = supabaseAdmin.storage
        .from('avatars')
        .getPublicUrl(imageFilename);
      imageUrl = publicUrl.publicUrl;
      console.log(`   Avatar subido: ${imageUrl}`);
    }

    console.log(`   Texto limpio (${cleanText.length} chars): ${cleanText.slice(0, 100)}...`);
    console.log(`   Usando avatar: ${path.basename(imagePath)}`);

    // Crear video con avatar
    // NOTA: El plan gratuito de D-ID no soporta providers de voz personalizados
    // Por ahora usamos voz por defecto. Para voz española se necesita plan de pago.
    const requestBody = {
      source_url: imageUrl,
      script: {
        type: 'text',
        input: cleanText
        // Provider comentado - requiere plan de pago de D-ID
        // provider: { type: 'amazon', voice_id: 'Lucia' }
      },
      config: {
        fluent: true,
        pad_audio: 0.5
      }
    };

    console.log('   Voz: Por defecto de D-ID (ingles)')
    console.log('   NOTA: Para voz espanola se requiere plan de pago de D-ID');

    const response = await fetch('https://api.d-id.com/talks', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${authKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('D-ID Error:', errorText);
      return { success: false, error: `D-ID API error: ${response.status} - ${errorText}` };
    }

    const data = await response.json();
    const talkId = data.id;

    if (!talkId) {
      return { success: false, error: 'No se recibio talk_id de D-ID' };
    }

    console.log(`   Talk ID: ${talkId}`);

    // Polling para obtener el video
    return await pollDIDVideo(talkId, apiKey);

  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// D-ID con audio externo (ElevenLabs) - VOZ EN ESPAÑOL
async function createVideoWithDIDAudio(
  imagePath: string,
  audioUrl: string,
  apiKey: string
): Promise<{ success: boolean; videoUrl?: string; videoId?: string; status?: string; error?: string }> {
  try {
    // Subir imagen a Supabase Storage para obtener URL publica
    const imageBuffer = await fs.readFile(imagePath);
    const imageFilename = `avatar-${Date.now()}.${path.extname(imagePath).slice(1) || 'png'}`;

    console.log(`   Subiendo avatar a Supabase Storage...`);
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('avatars')
      .upload(imageFilename, imageBuffer, {
        contentType: `image/${path.extname(imagePath).slice(1) === 'jpg' ? 'jpeg' : path.extname(imagePath).slice(1) || 'png'}`,
        upsert: true
      });

    let imageUrl: string;

    if (uploadError) {
      console.log(`   Error subiendo a Storage: ${uploadError.message}`);
      console.log(`   Usando imagen alice de D-ID como fallback...`);
      imageUrl = 'https://d-id-public-bucket.s3.us-west-2.amazonaws.com/alice.jpg';
    } else {
      const { data: publicUrl } = supabaseAdmin.storage
        .from('avatars')
        .getPublicUrl(imageFilename);
      imageUrl = publicUrl.publicUrl;
      console.log(`   Avatar subido: ${imageUrl}`);
    }

    const authKey = Buffer.from(`${apiKey}:`).toString('base64');

    console.log(`   Creando video con D-ID + audio ElevenLabs...`);
    console.log(`   Audio URL: ${audioUrl}`);

    const response = await fetch('https://api.d-id.com/talks', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${authKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        source_url: imageUrl,
        script: {
          type: 'audio',
          audio_url: audioUrl
        },
        config: {
          fluent: true,
          pad_audio: 0.5,
          stitch: true
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('D-ID Error:', errorText);
      return { success: false, error: `D-ID API error: ${response.status} - ${errorText}` };
    }

    const data = await response.json();
    const talkId = data.id;

    if (!talkId) {
      return { success: false, error: 'No se recibio talk_id de D-ID' };
    }

    console.log(`   Talk ID: ${talkId}`);
    return await pollDIDVideo(talkId, apiKey);

  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Polling comun para D-ID
async function pollDIDVideo(
  talkId: string,
  apiKey: string
): Promise<{ success: boolean; videoUrl?: string; videoId?: string; status?: string; error?: string }> {
  let videoUrl = '';
  let status = 'created';
  let attempts = 0;
  const maxAttempts = 60; // 2 minutos max

  const authKey = Buffer.from(`${apiKey}:`).toString('base64');

  while (status !== 'done' && status !== 'error' && attempts < maxAttempts) {
    await new Promise(resolve => setTimeout(resolve, 2000));

    const statusRes = await fetch(`https://api.d-id.com/talks/${talkId}`, {
      headers: { 'Authorization': `Basic ${authKey}` }
    });

    if (!statusRes.ok) {
      attempts++;
      continue;
    }

    const statusData = await statusRes.json();
    status = statusData.status;

    console.log(`   Status: ${status} (intento ${attempts + 1})`);

    if (status === 'done') {
      videoUrl = statusData.result_url;
      break;
    } else if (status === 'error') {
      return { success: false, error: statusData.error?.message || 'D-ID processing failed' };
    }

    attempts++;
  }

  if (!videoUrl && status !== 'done') {
    return {
      success: true,
      videoId: talkId,
      status: 'processing',
      videoUrl: undefined
    };
  }

  return {
    success: true,
    videoUrl,
    videoId: talkId,
    status: 'done'
  };
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

    const activeProvider = heygenKey ? 'heygen' : didKey ? 'd-id' : 'none';

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
          ready: !!heygenKey || !!didKey
        },
        provider: activeProvider,
        providerInfo: activeProvider === 'heygen'
          ? 'HeyGen - Calidad profesional, sin marca de agua'
          : activeProvider === 'd-id'
            ? 'D-ID - Calidad basica' + (elevenLabsKey ? ' + voz espanola' : '')
            : 'Sin provider configurado',
        voiceMode: elevenLabsKey
          ? 'ElevenLabs (voz espanola personalizada)'
          : 'TTS nativo del provider',
        instructions: !heygenKey && !didKey ? {
          recomendado: {
            message: 'Configura HeyGen para videos profesionales:',
            pasos: [
              '1. Crea cuenta en https://heygen.com',
              '2. Ve a Settings > API Keys',
              '3. Genera una API key',
              '4. Anade a .env.local: HEYGEN_API_KEY=tu_key',
              '5. Reinicia: npm run dev'
            ]
          },
          alternativa: {
            message: 'O usa D-ID (calidad basica):',
            pasos: [
              '1. Crea cuenta en https://d-id.com',
              '2. Ve a Settings > API',
              '3. Anade a .env.local: DID_API_KEY=tu_key'
            ]
          }
        } : null,
        creditsInfo: {
          heygen: heygenKey ? 'Plan activo - Sin marca de agua' : null,
          did: didKey ? 'Plan activo' : null,
          tip: 'Cada video de ~30s consume ~0.5 creditos'
        }
      }
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message });
  }
}
