import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/simple-client';
import { notifyVideoReady, notifyError } from '@/lib/email/notifications';
import {
  getRandomUnusedAvatar,
  downloadDriveFile,
  markAvatarAsUsed,
  listDriveFiles
} from '@/lib/google-drive';

/**
 * POST /api/video/talking-avatar
 *
 * Genera un video de Reel AUTOMATICO con avatar hablando:
 * 1. Coge una foto de Google Drive "FOTOS AVATAR SIN USAR"
 * 2. Crea video con avatar hablando usando HeyGen (prioridad) o D-ID
 * 3. Mueve la foto a Google Drive "FOTOS AVAR USADAS"
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
 * - GOOGLE_SERVICE_ACCOUNT_EMAIL
 * - GOOGLE_PRIVATE_KEY
 * - GOOGLE_DRIVE_FOLDER_UNUSED
 * - GOOGLE_DRIVE_FOLDER_USED
 */

interface TalkingAvatarRequest {
  contentId?: string;
  script: string;
  voiceId?: string; // ID de voz D-ID o ElevenLabs
  language?: string; // es, en, etc.
  quality?: 'high' | 'medium';
  avatarFileId?: string; // Google Drive file ID específico (opcional)
  avatarFilename?: string; // Nombre del archivo (para logging)
}

export async function POST(request: Request) {
  try {
    const body: TalkingAvatarRequest = await request.json();
    const {
      contentId,
      script,
      voiceId, // Voz específica (se usará default según el provider)
      language = 'es',
      quality = 'high',
      avatarFileId, // Avatar específico pre-seleccionado
      avatarFilename
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

    // PASO 1: AGENTE SELECTOR - Seleccionar o usar foto específica de Google Drive
    let finalAvatarFileId: string;
    let finalAvatarFilename: string;

    if (avatarFileId) {
      // Usar avatar pre-seleccionado inteligentemente
      console.log('✅ Usando avatar pre-seleccionado:', avatarFilename || avatarFileId);
      finalAvatarFileId = avatarFileId;
      finalAvatarFilename = avatarFilename || 'avatar-pre-selected.png';
    } else {
      // Seleccionar avatar random
      console.log('🤖 Agente Selector obteniendo foto random de Google Drive...');
      const avatarResult = await getRandomUnusedAvatar();

      if (!avatarResult.success) {
        return NextResponse.json({
          success: false,
          error: 'No hay fotos de avatar disponibles en Google Drive',
          suggestion: 'Sube mas fotos a la carpeta "FOTOS AVATAR SIN USAR" en Google Drive'
        }, { status: 400 });
      }

      finalAvatarFileId = avatarResult.fileId!;
      finalAvatarFilename = avatarResult.filename!;
      console.log(`✅ Avatar seleccionado: ${finalAvatarFilename}`);
      console.log(`📊 Disponibles en Drive: ${avatarResult.totalAvailable}`);
    }

    // PASO 2: AGENTE GENERADOR - Crear video profesional
    console.log('🎬 Agente Generador iniciando producción de video...');
    console.log(`   Provider: ${provider.toUpperCase()}`);

    // Descargar avatar de Google Drive
    console.log('📥 Descargando avatar de Google Drive...');
    const avatarBuffer = await downloadDriveFile(finalAvatarFileId);
    console.log(`✅ Avatar descargado: ${avatarBuffer.length} bytes`);

    let videoResult;

    if (provider === 'heygen' && heygenKey) {
      // HeyGen - Mejor calidad, mas profesional
      console.log('   Generando con HeyGen Avatar IV (máxima calidad y movimiento natural)...');

      // Prioridad: Avatar IV para mejor movimiento y gestos
      // Si falla, hace fallback automático a talking photo estándar
      videoResult = await createVideoWithAvatarIV(avatarBuffer, finalAvatarFilename, script, heygenKey, language);
    } else if (didKey) {
      // D-ID - Fallback
      console.log('Creando video con D-ID...');

      if (elevenLabsKey) {
        console.log('   Usando voz ElevenLabs...');
        // Usar voiceId de ElevenLabs (NO confundir con Azure TTS)
        const elevenLabsVoiceId = voiceId || 'XB0fDUnXU5powFXDhCwa'; // Charlotte - voz femenina español
        const audioResult = await generateAudio(script, elevenLabsVoiceId, elevenLabsKey);

        if (!audioResult.success) {
          console.log('   ElevenLabs fallo, usando TTS nativo de D-ID');
          videoResult = await createVideoWithDIDText(avatarBuffer, finalAvatarFilename, script, didKey, language);
        } else {
          videoResult = await createVideoWithDIDAudio(avatarBuffer, finalAvatarFilename, audioResult.audioUrl!, didKey);
        }
      } else {
        console.log('   Usando TTS nativo de D-ID...');
        videoResult = await createVideoWithDIDText(avatarBuffer, finalAvatarFilename, script, didKey, language);
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
    console.log('   ✅ Video base creado!');

    // PASO 2.5: Post-procesado con Shotstack (si está configurado)
    const shotstackKey = process.env.SHOTSTACK_API_KEY;
    let finalVideoUrl = videoResult.videoUrl;

    if (shotstackKey && videoResult.videoUrl && videoResult.videoDuration) {
      console.log('   🎬 Aplicando post-procesado con Shotstack...');

      const postProcessResult = await postProcessWithShotstack(
        videoResult.videoUrl,
        videoResult.videoDuration,
        script,
        shotstackKey
      );

      if (postProcessResult.success && postProcessResult.videoUrl) {
        finalVideoUrl = postProcessResult.videoUrl;
        console.log('   ✅ Post-procesado completado! Video con zooms y subtítulos.');
      } else {
        console.log(`   ⚠️ Post-procesado falló: ${postProcessResult.error}`);
        console.log('   📹 Usando video original de HeyGen sin post-procesado.');
      }
    } else if (!shotstackKey) {
      console.log('   ℹ️ Shotstack no configurado - video sin post-procesado.');
      console.log('   💡 Agrega SHOTSTACK_API_KEY a .env.local para zooms y subtítulos.');
    }

    console.log('   ✅ Procesamiento de video completo!');

    // PASO 3: Mover avatar a carpeta "usadas" en Google Drive
    await markAvatarAsUsed(finalAvatarFileId);
    console.log(`   Avatar "${finalAvatarFilename}" movido a "FOTOS AVAR USADAS" en Google Drive`);

    // PASO 4: Guardar en BD
    if (contentId) {
      // Obtener metadata actual para no sobrescribirlo
      const { data: currentContent } = await supabaseAdmin
        .from('scheduled_content')
        .select('metadata')
        .eq('id', contentId)
        .single();

      await supabaseAdmin
        .from('scheduled_content')
        .update({
          suggested_media: videoResult.videoUrl, // Guardar URL del video aquí
          status: 'ready',
          metadata: {
            ...currentContent?.metadata, // Preservar metadata existente
            video_generated: true,
            video_url: videoResult.videoUrl, // También en metadata
            avatar_used: finalAvatarFilename,
            avatar_file_id: finalAvatarFileId,
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

// ============ SHOTSTACK POST-PROCESSING ============

/**
 * Post-procesa video con Shotstack para agregar:
 * - Zoom effects dinámicos (in/out)
 * - Subtítulos animados
 * - Transiciones suaves
 * - Múltiples "cortes virtuales" con zoom
 */
async function postProcessWithShotstack(
  videoUrl: string,
  videoDuration: number,
  text: string,
  apiKey: string
): Promise<{ success: boolean; videoUrl?: string; error?: string }> {
  try {
    console.log('   🎬 Iniciando post-procesado profesional con Shotstack...');
    console.log(`   ⏱️  Duración REAL del video: ${videoDuration.toFixed(2)}s`);

    // CRÍTICO: Usar la duración REAL del video (no estimaciones)
    const duration = videoDuration;
    const numSegments = Math.min(6, Math.ceil(duration / 3)); // Más segmentos para videos largos
    const segmentDuration = duration / numSegments;

    console.log(`   📹 Dividiendo en ${numSegments} segmentos de ${segmentDuration.toFixed(2)}s cada uno`);

    // Efectos profesionales variados
    const effects = [
      'zoomIn',
      'zoomOut',
      'slideLeft',
      'slideRight',
      'zoomInSlow',
      'zoomOutSlow'
    ];

    const transitions = [
      'fade',
      'fadeSlow',
      'reveal',
      'wipeLeft',
      'wipeRight',
      'zoom'
    ];

    // Track 1: Video principal con zooms y efectos
    const videoSegments = [];
    for (let i = 0; i < numSegments; i++) {
      videoSegments.push({
        asset: {
          type: 'video',
          src: videoUrl,
          trim: i * segmentDuration // Trim desde el punto correcto del video
        },
        start: i * segmentDuration,
        length: segmentDuration,
        effect: effects[i % effects.length],
        transition: i > 0 ? {
          in: transitions[i % transitions.length]
        } : undefined,
        opacity: 1
      });
    }

    // Track 2: B-roll con imágenes abstractas/gradientes
    const brollClips = [];
    const gradients = [
      'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(168,85,247,0.15))',
      'linear-gradient(135deg, rgba(236,72,153,0.15), rgba(239,68,68,0.15))',
      'linear-gradient(135deg, rgba(34,211,238,0.15), rgba(59,130,246,0.15))',
      'linear-gradient(135deg, rgba(251,191,36,0.15), rgba(249,115,22,0.15))'
    ];

    for (let i = 0; i < numSegments; i++) {
      const gradient = gradients[i % gradients.length];
      brollClips.push({
        asset: {
          type: 'html',
          html: `<div style="width: 100%; height: 100%; background: ${gradient};"></div>`,
          width: 1080,
          height: 1920,
          background: 'transparent'
        },
        start: i * segmentDuration,
        length: segmentDuration,
        opacity: 0.3, // Overlay sutil
        transition: {
          in: 'fade',
          out: 'fade'
        }
      });
    }

    // Track 3: Subtítulos palabra por palabra mejorados
    const words = text.split(/\s+/).filter(w => w.trim().length > 0);
    const wordDuration = duration / words.length; // Distribución exacta

    const captionClips = words.map((word, index) => {
      // Colores alternados para palabras clave
      const isKeyword = word.length > 6 || word.match(/[!?]/);
      const color = isKeyword ? '#FFD700' : '#FFFFFF'; // Dorado para keywords, blanco normal

      return {
        asset: {
          type: 'html',
          html: `
            <div style="
              font-family: 'Montserrat', 'Arial Black', sans-serif;
              font-size: 85px;
              font-weight: 900;
              color: ${color};
              text-align: center;
              text-shadow:
                3px 3px 0px #000,
                -3px -3px 0px #000,
                3px -3px 0px #000,
                -3px 3px 0px #000,
                5px 5px 15px rgba(0,0,0,0.9);
              padding: 25px 40px;
              background: linear-gradient(135deg, rgba(0,0,0,0.85), rgba(30,30,30,0.85));
              backdrop-filter: blur(15px);
              border-radius: 25px;
              border: 3px solid rgba(255,255,255,0.3);
              box-shadow: 0 10px 40px rgba(0,0,0,0.6);
              text-transform: uppercase;
              letter-spacing: 2px;
              animation: pulse 0.3s ease-in-out;
            ">
              ${word.replace(/[!?]/g, '').toUpperCase()}
            </div>
          `,
          css: `
            body {
              margin: 0;
              display: flex;
              align-items: center;
              justify-content: center;
              height: 100%;
            }
            @keyframes pulse {
              0%, 100% { transform: scale(1); }
              50% { transform: scale(1.05); }
            }
          `,
          width: 1080,
          height: 1920,
          background: 'transparent'
        },
        start: index * wordDuration,
        length: wordDuration + 0.1, // Pequeño overlap para continuidad
        position: 'center',
        offset: {
          y: 0.35 // Posición inferior
        },
        opacity: 1,
        transition: {
          in: 'carouselUp',
          out: 'carouselDown'
        }
      };
    });

    console.log(`   💬 Creando ${captionClips.length} subtítulos sincronizados (${wordDuration.toFixed(2)}s por palabra)`);

    // Timeline de Shotstack PROFESIONAL
    const shotstackPayload = {
      timeline: {
        background: '#000000',
        // soundtrack: {
        //   src: 'https://path-to-background-music.mp3',
        //   volume: 0.1
        // },
        tracks: [
          {
            clips: videoSegments // Video principal con efectos
          },
          {
            clips: brollClips // B-roll con gradientes
          },
          {
            clips: captionClips // Subtítulos mejorados
          }
        ]
      },
      output: {
        format: 'mp4',
        resolution: '1080', // Full HD vertical
        fps: 30,
        quality: 'high'
      }
    };

    console.log('   📤 Enviando video a Shotstack para renderizado...');

    // Render con Shotstack
    const renderResponse = await fetch('https://api.shotstack.io/edit/v1/render', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(shotstackPayload)
    });

    if (!renderResponse.ok) {
      const error = await renderResponse.text();
      console.error('   ❌ Shotstack render error:', error);
      return { success: false, error: `Shotstack render failed: ${error}` };
    }

    const renderData = await renderResponse.json();
    const renderId = renderData.response?.id;

    if (!renderId) {
      return { success: false, error: 'No render ID received from Shotstack' };
    }

    console.log(`   ⏳ Render ID: ${renderId} - Esperando procesamiento...`);

    // Polling para obtener el video procesado
    let finalVideoUrl = '';
    let status = 'queued';
    let attempts = 0;
    const maxAttempts = 60; // 5 minutos máximo

    while (status !== 'done' && status !== 'failed' && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 5000)); // 5 segundos

      const statusResponse = await fetch(`https://api.shotstack.io/edit/v1/render/${renderId}`, {
        headers: {
          'x-api-key': apiKey
        }
      });

      if (statusResponse.ok) {
        const statusData = await statusResponse.json();
        status = statusData.response?.status || 'queued';

        console.log(`   Status: ${status} (intento ${attempts + 1})`);

        if (status === 'done') {
          finalVideoUrl = statusData.response?.url;
          break;
        } else if (status === 'failed') {
          return { success: false, error: 'Shotstack processing failed' };
        }
      }

      attempts++;
    }

    if (!finalVideoUrl) {
      return { success: false, error: 'Shotstack processing timeout' };
    }

    console.log(`   ✅ Video procesado exitosamente: ${finalVideoUrl}`);

    return {
      success: true,
      videoUrl: finalVideoUrl
    };

  } catch (error: any) {
    console.error('   ❌ Error en post-procesado Shotstack:', error.message);
    return { success: false, error: error.message };
  }
}

// ============ FUNCIONES AUXILIARES ============

async function generateAudio(
  text: string,
  voiceId: string,
  apiKey: string
): Promise<{ success: boolean; audioUrl?: string; error?: string }> {
  try {
    // Limpiar y optimizar texto para máxima expresividad
    let cleanText = text
      .replace(/\d+-\d+s?:\s*/gi, '')
      .replace(/["'"]/g, '')
      .replace(/\*\*/g, '')
      .replace(/#{1,}/g, '')
      .replace(/\(Hook\)|Hook:|Valor:|Ejemplo:|Llamada a accion:|Cierre:/gi, '')
      .replace(/[\u{1F300}-\u{1F9FF}]/gu, '') // Remover emojis
      .replace(/\n+/g, '. ')  // Convertir saltos de línea en pausas
      .trim();

    // Agregar pausas estratégicas para naturalidad (frases cortas)
    // Dividir en oraciones y limitar longitud
    const sentences = cleanText.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const optimizedSentences = sentences.map(s => {
      const trimmed = s.trim();
      // Si la oración es muy larga, agregar pausas con comas
      if (trimmed.split(' ').length > 15) {
        return trimmed.replace(/(\s+(?:y|pero|porque|cuando|aunque)\s+)/gi, ', $1');
      }
      return trimmed;
    });

    cleanText = optimizedSentences.join('. ').slice(0, 1500); // Texto para ~30 segundos

    // voiceId ya viene como parámetro (ID de ElevenLabs, ej: XB0fDUnXU5powFXDhCwa)
    console.log(`   Generando audio con ElevenLabs (voz: ${voiceId})...`);
    console.log(`   Texto optimizado: ${cleanText.slice(0, 100)}...`);

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
          model_id: 'eleven_multilingual_v2', // Modelo multilenguaje para español
          voice_settings: {
            stability: 0.55,  // Ajustado para tono natural y variado (0.5-0.6)
            similarity_boost: 0.75,  // Mantener similitud con la voz (0.7-0.8)
            style: 0.6,  // Mayor expresividad
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
  imageBuffer: Buffer,
  originalFilename: string,
  audioUrl: string,
  apiKey: string
): Promise<{ success: boolean; videoUrl?: string; videoDuration?: number; videoId?: string; status?: string; error?: string }> {
  try {
    // Subir imagen a Supabase Storage para URL publica
    const ext = originalFilename.split('.').pop()?.toLowerCase() || 'png';
    const imageFilename = `avatar-heygen-${Date.now()}.${ext}`;

    console.log('   Subiendo avatar a Supabase Storage...');
    const contentType = ext === 'jpg' ? 'image/jpeg' : `image/${ext}`;
    const { error: uploadError } = await supabaseAdmin.storage
      .from('avatars')
      .upload(imageFilename, imageBuffer, {
        contentType,
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

    // Subir imagen a HeyGen como talking photo (usando raw binary data)
    const uploadResult = await uploadTalkingPhotoToHeyGen(imageBuffer, apiKey);

    if (!uploadResult.success) {
      return {
        success: false,
        error: `Error subiendo talking photo a HeyGen: ${uploadResult.error}`
      };
    }

    const talkingPhotoId = uploadResult.talking_photo_id!;
    console.log('   ✅ Talking Photo ID obtenido:', talkingPhotoId);

    // Crear video usando talking_photo_id + audio externo con parámetros de naturalidad
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
            talking_photo_id: talkingPhotoId,
            scale: 1.0,
            offset: { x: 0, y: 0 }
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
        aspect_ratio: '9:16',
        test: false,
        caption: false
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

// Obtener talking_photo_id de HeyGen (avatar ya creado en la cuenta)
async function getHeyGenTalkingPhotoId(apiKey: string): Promise<string | null> {
  try {
    const response = await fetch('https://api.heygen.com/v2/avatars', {
      method: 'GET',
      headers: {
        'X-Api-Key': apiKey
      }
    });

    if (!response.ok) {
      console.error('Error listando avatars de HeyGen:', await response.text());
      return null;
    }

    const data = await response.json();
    const avatars = data.data?.avatars || [];

    // Buscar el primer talking photo disponible
    const talkingPhoto = avatars.find((avatar: any) =>
      avatar.avatar_type === 'talking_photo' ||
      avatar.type === 'talking_photo'
    );

    if (talkingPhoto) {
      const photoId = talkingPhoto.talking_photo_id || talkingPhoto.avatar_id;
      console.log(`   ✅ Talking Photo encontrado: ${talkingPhoto.avatar_name || photoId}`);
      return photoId;
    }

    console.error('   ❌ No se encontraron Talking Photos en HeyGen');
    console.error('   Por favor crea un Photo Avatar manualmente en HeyGen Dashboard');
    return null;
  } catch (error: any) {
    console.error('Error obteniendo talking photos:', error.message);
    return null;
  }
}

// HeyGen Avatar IV con movimiento natural avanzado - RECOMENDADO
async function createVideoWithAvatarIV(
  imageBuffer: Buffer,
  originalFilename: string,
  text: string,
  apiKey: string,
  language: string = 'es'
): Promise<{ success: boolean; videoUrl?: string; videoDuration?: number; videoId?: string; status?: string; error?: string }> {
  try {
    // Limpiar y optimizar texto para máxima expresividad
    let cleanText = text
      .replace(/\d+-\d+s?:\s*/gi, '')
      .replace(/["'"]/g, '')
      .replace(/\*\*/g, '')
      .replace(/#{1,}/g, '')
      .replace(/\(Hook\)|Hook:|Valor:|Ejemplo:|Llamada a accion:|Cierre:/gi, '')
      .replace(/[\u{1F300}-\u{1F9FF}]/gu, '')
      .replace(/\n+/g, '. ')
      .trim();

    // Agregar pausas estratégicas
    const sentences = cleanText.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const optimizedSentences = sentences.map(s => {
      const trimmed = s.trim();
      if (trimmed.split(' ').length > 15) {
        return trimmed.replace(/(\s+(?:y|pero|porque|cuando|aunque)\s+)/gi, ', $1');
      }
      return trimmed;
    });

    cleanText = optimizedSentences.join('. ').slice(0, 1500);

    console.log('   Generando con Avatar IV (movimiento natural avanzado)...');

    // Subir imagen como asset para Avatar IV
    const uploadResult = await uploadAssetForAvatarIV(imageBuffer, apiKey, originalFilename);

    if (!uploadResult.success) {
      console.log('   ⚠️ Avatar IV upload falló, usando talking photo estándar...');
      // Fallback a talking photo estándar
      return await createVideoWithHeyGenText(imageBuffer, originalFilename, text, apiKey, language);
    }

    const imageKey = uploadResult.image_key!;
    console.log('   ✅ Image Key obtenido para Avatar IV:', imageKey);

    // Voice ID de HeyGen
    const heygenVoiceId = process.env.HEYGEN_VOICE_ID || '3a991e0f1c824228bba932cdf8b0768e';

    // Motion prompt para movimiento natural y gestos
    const motionPrompt = 'Professional speaker with natural hand gestures while talking, gentle head movements and nods for emphasis, expressive facial expressions including smiles and raised eyebrows, subtle body sway, occasional blinks, warm and engaging presence, soft natural lighting';

    console.log('   Creando video Avatar IV con motion prompt...');

    // Crear video con Avatar IV
    const response = await fetch('https://api.heygen.com/v2/video/av4/generate', {
      method: 'POST',
      headers: {
        'X-Api-Key': apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        image_key: imageKey,
        video_title: `Avatar Video ${Date.now()}`,
        script: cleanText,
        voice_id: heygenVoiceId,
        custom_motion_prompt: motionPrompt,
        enhance_custom_motion_prompt: true,
        aspect_ratio: '9:16'
      })
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Avatar IV Error:', error);
      console.log('   ⚠️ Avatar IV falló, usando talking photo estándar...');
      // Fallback a talking photo
      return await createVideoWithHeyGenText(imageBuffer, originalFilename, text, apiKey, language);
    }

    const data = await response.json();
    const videoId = data.data?.video_id;

    if (!videoId) {
      return { success: false, error: 'No se recibió video_id de Avatar IV' };
    }

    console.log(`   Video ID Avatar IV: ${videoId}`);

    // Polling para obtener el video
    let videoUrl = '';
    let status = 'processing';
    let attempts = 0;

    while (status === 'processing' && attempts < 60) {
      await new Promise(resolve => setTimeout(resolve, 5000)); // 5 segundos entre intentos

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
        return { success: false, error: 'Avatar IV falló al procesar el video' };
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
    console.error('   Error en Avatar IV:', error.message);
    // Fallback a talking photo
    return await createVideoWithHeyGenText(imageBuffer, originalFilename, text, apiKey, language);
  }
}

// HeyGen con TTS nativo - Sin necesidad de ElevenLabs
async function createVideoWithHeyGenText(
  imageBuffer: Buffer,
  originalFilename: string,
  text: string,
  apiKey: string,
  language: string = 'es'
): Promise<{ success: boolean; videoUrl?: string; videoDuration?: number; videoId?: string; status?: string; error?: string }> {
  try {
    // Limpiar y optimizar texto para máxima expresividad
    let cleanText = text
      .replace(/\d+-\d+s?:\s*/gi, '')
      .replace(/["'"]/g, '')
      .replace(/\*\*/g, '')
      .replace(/#{1,}/g, '')
      .replace(/\(Hook\)|Hook:|Valor:|Ejemplo:|Llamada a accion:|Cierre:/gi, '')
      .replace(/[\u{1F300}-\u{1F9FF}]/gu, '')
      .replace(/\n+/g, '. ')  // Convertir saltos de línea en pausas
      .trim();

    // Agregar pausas estratégicas para naturalidad (frases cortas)
    const sentences = cleanText.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const optimizedSentences = sentences.map(s => {
      const trimmed = s.trim();
      // Si la oración es muy larga, agregar pausas con comas
      if (trimmed.split(' ').length > 15) {
        return trimmed.replace(/(\s+(?:y|pero|porque|cuando|aunque)\s+)/gi, ', $1');
      }
      return trimmed;
    });

    cleanText = optimizedSentences.join('. ').slice(0, 1500);

    // Subir imagen a Supabase Storage
    const ext = originalFilename.split('.').pop()?.toLowerCase() || 'png';
    const imageFilename = `avatar-heygen-${Date.now()}.${ext}`;

    console.log('   Subiendo avatar a Supabase Storage...');
    const contentType = ext === 'jpg' ? 'image/jpeg' : `image/${ext}`;
    const { error: uploadError} = await supabaseAdmin.storage
      .from('avatars')
      .upload(imageFilename, imageBuffer, {
        contentType,
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

    // Subir imagen a HeyGen como talking photo (usando raw binary data)
    const uploadResult = await uploadTalkingPhotoToHeyGen(imageBuffer, apiKey);

    if (!uploadResult.success) {
      return {
        success: false,
        error: `Error subiendo talking photo a HeyGen: ${uploadResult.error}`
      };
    }

    const talkingPhotoId = uploadResult.talking_photo_id!;
    console.log('   ✅ Talking Photo ID obtenido:', talkingPhotoId);

    // Voz configurable desde .env.local (consultar voces disponibles en GET /v2/voices)
    const heygenVoiceId = process.env.HEYGEN_VOICE_ID || 'fb8c5c3f02854c57a4da182d4ed59467';

    // Crear video usando talking_photo_id con parámetros de naturalidad
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
            talking_photo_id: talkingPhotoId,
            scale: 1.0,
            offset: { x: 0, y: 0 }
          },
          voice: {
            type: 'text',
            input_text: cleanText,
            voice_id: heygenVoiceId,
            speed: 0.95,  // Más lento para pausas naturales y gestos
            emotion: 'Friendly'  // Expresividad facial natural
          }
        }],
        dimension: {
          width: 1080,
          height: 1920
        },
        aspect_ratio: '9:16',
        test: false,
        caption: false
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
    let videoDuration = 0;
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
        videoDuration = statusData.data?.duration || 0; // CRÍTICO: Capturar duración real
        console.log(`   ✅ Video completado - Duración real: ${videoDuration.toFixed(2)}s`);
        break;
      } else if (status === 'failed') {
        return { success: false, error: 'HeyGen fallo al procesar el video' };
      }

      attempts++;
    }

    return {
      success: true,
      videoUrl: videoUrl || undefined,
      videoDuration: videoDuration || undefined,
      videoId,
      status: videoUrl ? 'completed' : 'processing'
    };

  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// D-ID con texto (TTS nativo) - No requiere ElevenLabs
async function createVideoWithDIDText(
  imageBuffer: Buffer,
  originalFilename: string,
  text: string,
  apiKey: string,
  language: string = 'es'
): Promise<{ success: boolean; videoUrl?: string; videoDuration?: number; videoId?: string; status?: string; error?: string }> {
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
    const ext = originalFilename.split('.').pop()?.toLowerCase() || 'png';
    const imageFilename = `avatar-${Date.now()}.${ext}`;

    console.log(`   Subiendo avatar a Supabase Storage...`);
    const contentType = ext === 'jpg' ? 'image/jpeg' : `image/${ext}`;
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('avatars')
      .upload(imageFilename, imageBuffer, {
        contentType,
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
  imageBuffer: Buffer,
  originalFilename: string,
  audioUrl: string,
  apiKey: string
): Promise<{ success: boolean; videoUrl?: string; videoDuration?: number; videoId?: string; status?: string; error?: string }> {
  try {
    // Subir imagen a Supabase Storage para obtener URL publica
    const ext = originalFilename.split('.').pop()?.toLowerCase() || 'png';
    const imageFilename = `avatar-${Date.now()}.${ext}`;

    console.log(`   Subiendo avatar a Supabase Storage...`);
    const contentType = ext === 'jpg' ? 'image/jpeg' : `image/${ext}`;
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('avatars')
      .upload(imageFilename, imageBuffer, {
        contentType,
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
): Promise<{ success: boolean; videoUrl?: string; videoDuration?: number; videoId?: string; status?: string; error?: string }> {
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
    const folderUnused = process.env.GOOGLE_DRIVE_FOLDER_UNUSED;
    const folderUsed = process.env.GOOGLE_DRIVE_FOLDER_USED;

    const unusedImages = folderUnused ? await listDriveFiles(folderUnused).catch(() => []) : [];
    const usedImages = folderUsed ? await listDriveFiles(folderUsed).catch(() => []) : [];

    const heygenKey = process.env.HEYGEN_API_KEY;
    const didKey = process.env.DID_API_KEY;
    const elevenLabsKey = process.env.ELEVENLABS_API_KEY;

    const activeProvider = heygenKey ? 'heygen' : didKey ? 'd-id' : 'none';

    return NextResponse.json({
      success: true,
      data: {
        avatarsDisponibles: unusedImages.length,
        avatarsUsados: usedImages.length,
        listaDisponibles: unusedImages.slice(0, 10).map(f => f.name),
        source: 'Google Drive',
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

/**
 * Lista todos los photo avatars (talking photos) existentes en HeyGen
 */
async function listPhotoAvatars(apiKey: string): Promise<any[]> {
  try {
    const response = await fetch('https://api.heygen.com/v2/avatars', {
      method: 'GET',
      headers: {
        'X-Api-Key': apiKey  // HeyGen usa X-Api-Key con mayúsculas en algunos endpoints
      }
    });

    if (!response.ok) {
      console.error('   Error listando avatars:', await response.text());
      return [];
    }

    const data = await response.json();
    // La respuesta incluye data.talking_photos[] para photo avatars
    return data.data?.talking_photos || [];
  } catch (error: any) {
    console.error('   Error listando avatars:', error.message);
    return [];
  }
}

/**
 * Elimina un photo avatar por ID
 */
async function deletePhotoAvatar(avatarId: string, apiKey: string): Promise<boolean> {
  try {
    const response = await fetch(`https://api.heygen.com/v2/photo_avatar/${avatarId}`, {
      method: 'DELETE',
      headers: {
        'x-api-key': apiKey
      }
    });

    if (!response.ok) {
      console.error(`   Error eliminando avatar ${avatarId}:`, await response.text());
      return false;
    }

    console.log(`   ✅ Avatar ${avatarId} eliminado`);
    return true;
  } catch (error: any) {
    console.error(`   Error eliminando avatar ${avatarId}:`, error.message);
    return false;
  }
}

/**
 * Sube una imagen a HeyGen como asset para Avatar IV
 * API: https://upload.heygen.com/v1/asset
 * Retorna image_key necesario para Avatar IV
 */
async function uploadAssetForAvatarIV(
  imageBuffer: Buffer,
  apiKey: string,
  originalFilename: string
): Promise<{ success: boolean; image_key?: string; error?: string }> {
  try {
    console.log('   Subiendo asset para Avatar IV...');
    console.log('   Buffer length:', imageBuffer.length);

    // Detectar Content-Type basado en la extensión del archivo
    const ext = originalFilename.split('.').pop()?.toLowerCase() || 'png';
    const contentType = ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : 'image/png';
    console.log(`   Content-Type detectado: ${contentType}`);

    // Usar raw binary con el Content-Type correcto
    const response = await fetch('https://upload.heygen.com/v1/asset', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'Content-Type': contentType
      },
      body: imageBuffer
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('   ❌ Upload failed:', response.status, errorText);
      return {
        success: false,
        error: `Upload failed: ${response.status} - ${errorText}`
      };
    }

    const result = await response.json();
    console.log('   Asset response:', JSON.stringify(result));

    // Response incluye image_key o asset_id
    const imageKey = result.data?.image_key || result.data?.asset_id;

    if (imageKey) {
      console.log('   ✅ Image Key:', imageKey);
      return {
        success: true,
        image_key: imageKey
      };
    } else {
      console.error('   ❌ No image_key in response:', result);
      return {
        success: false,
        error: result.message || result.error?.message || 'No image_key received'
      };
    }
  } catch (error: any) {
    console.error('   ❌ Exception:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Sube una imagen a HeyGen como talking photo para obtener talking_photo_id
 * API: https://upload.heygen.com/v1/talking_photo
 * Usa raw binary data, NO multipart form data
 * NOTA: Límite de 3 photo avatars en plan básico - elimina antiguos si es necesario
 */
async function uploadTalkingPhotoToHeyGen(
  imageBuffer: Buffer,
  apiKey: string
): Promise<{ success: boolean; talking_photo_id?: string; error?: string }> {
  try {
    console.log('   Verificando límite de photo avatars...');

    // Listar photo avatars existentes
    const existingAvatars = await listPhotoAvatars(apiKey);
    console.log(`   Photo avatars existentes: ${existingAvatars.length}`);

    // Si ya hay 3 o más, eliminar el más antiguo
    if (existingAvatars.length >= 3) {
      console.log('   ⚠️ Límite alcanzado, eliminando avatar más antiguo...');
      const oldestAvatar = existingAvatars[0]; // El primero es el más antiguo
      const avatarId = oldestAvatar.photo_avatar_id || oldestAvatar.id || oldestAvatar.talking_photo_id;

      if (avatarId) {
        await deletePhotoAvatar(avatarId, apiKey);
      }
    }

    console.log('   Subiendo talking photo a HeyGen...');
    console.log('   Buffer length:', imageBuffer.length);

    // CORRECCIÓN: Usar raw binary data con Content-Type: image/jpeg
    // NO usar multipart/form-data
    const response = await fetch('https://upload.heygen.com/v1/talking_photo', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,  // Note: lowercase 'x-api-key' as per curl examples
        'Content-Type': 'image/jpeg'
      },
      body: imageBuffer
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('   ❌ Upload failed:', response.status, errorText);
      return {
        success: false,
        error: `Upload failed: ${response.status} - ${errorText}`
      };
    }

    const result = await response.json();
    console.log('   HeyGen response:', JSON.stringify(result));

    // Response includes talking_photo_id
    if (result.data && result.data.talking_photo_id) {
      console.log('   ✅ Talking Photo ID:', result.data.talking_photo_id);
      return {
        success: true,
        talking_photo_id: result.data.talking_photo_id
      };
    } else {
      console.error('   ❌ No talking_photo_id in response:', result);
      return {
        success: false,
        error: result.message || result.error?.message || 'No talking_photo_id received'
      };
    }
  } catch (error: any) {
    console.error('   ❌ Exception:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}
