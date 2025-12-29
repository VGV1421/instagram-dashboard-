import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/simple-client';
import { notifyVideoReady } from '@/lib/email/notifications';
import {
  getRandomUnusedAvatar,
  downloadDriveFile,
  markAvatarAsUsed
} from '@/lib/google-drive';

/**
 * POST /api/video/generate-smart
 *
 * Genera videos inteligentemente usando:
 * 1. Asistente Selector AI (elige mejor proveedor según tipo de video)
 * 2. Kie.ai API (genera video con el proveedor elegido)
 * 3. Auto-guarda en Supabase
 * 4. Envía email de notificación
 *
 * SOPORTA:
 * - Talking Head (avatar hablando)
 * - Bailes/Danza (generativo con movimiento)
 * - Showcases (avatar o generativo según has_audio)
 * - Motion (generativo sin voz)
 * - Creative/Efectos (generativo alta calidad)
 *
 * PROVEEDORES (via Kie.ai):
 * - Avatar: Kling Avatar Standard, Kling Avatar Pro, Infinitalk
 * - Generativo: Kling 2.6, Veo 3.1, Runway Gen-3, Sora 2, Hailuo
 *
 * Variables requeridas en .env.local (Vercel):
 * - KIE_AI_API_KEY
 * - OPENAI_API_KEY (para el selector)
 * - ELEVENLABS_API_KEY (para audio de avatares)
 * - GOOGLE_SERVICE_ACCOUNT_EMAIL
 * - GOOGLE_PRIVATE_KEY
 * - GOOGLE_DRIVE_FOLDER_UNUSED
 */

interface GenerateSmartVideoRequest {
  contentId: string; // ID en Supabase
  caption: string;
  duration?: 5 | 10 | 15; // Duración en segundos
  video_type?: 'talking_head' | 'dance' | 'showcase' | 'motion' | 'creative' | 'cinematic' | 'simple';
  objective?: 'natural_gestures' | 'body_movement' | 'visual_effects' | 'fast_generation' | 'high_quality' | 'budget' | 'creative';
  budget_priority?: 'low' | 'medium' | 'high';
  has_audio?: boolean; // true = voz hablada, false = solo música/efectos
}

export async function POST(request: Request) {
  try {
    const body: GenerateSmartVideoRequest = await request.json();
    const {
      contentId,
      caption,
      duration = 10,
      video_type = 'talking_head',
      objective = 'natural_gestures',
      budget_priority = 'medium',
      has_audio = true
    } = body;

    // Validaciones
    if (!contentId || !caption) {
      return NextResponse.json({
        success: false,
        error: 'contentId y caption son requeridos'
      }, { status: 400 });
    }

    const kieApiKey = process.env.KIE_AI_API_KEY || process.env.KIE_API_KEY;
    const openaiKey = process.env.OPENAI_API_KEY;
    const elevenLabsKey = process.env.ELEVENLABS_API_KEY;

    if (!kieApiKey) {
      return NextResponse.json({
        success: false,
        error: 'KIE_AI_API_KEY o KIE_API_KEY no configurado',
        instructions: {
          paso1: 'Crea cuenta en https://kie.ai',
          paso2: 'Ve a Settings > API Keys',
          paso3: 'Copia tu API key',
          paso4: 'Agrégala en Vercel: Settings > Environment Variables > KIE_AI_API_KEY'
        }
      }, { status: 400 });
    }

    if (!openaiKey) {
      return NextResponse.json({
        success: false,
        error: 'OPENAI_API_KEY no configurado (necesario para el selector)'
      }, { status: 400 });
    }

    console.log('🎬 === GENERACIÓN INTELIGENTE DE VIDEO ===');
    console.log(`📊 Tipo: ${video_type}, Duración: ${duration}s, Objetivo: ${objective}`);
    console.log(`💰 Presupuesto: ${budget_priority}, Audio: ${has_audio ? 'Sí (voz)' : 'No (música)'}`);

    // ═══════════════════════════════════════════════════════
    // PASO 1: SELECTOR AI - Elegir mejor proveedor
    // ═══════════════════════════════════════════════════════

    console.log('\n🤖 PASO 1: Consultando asistente selector...');

    const selectorResponse = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/ai/provider-selector`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        duration,
        video_type,
        objective,
        budget_priority,
        caption,
        has_audio
      })
    });

    if (!selectorResponse.ok) {
      throw new Error('Selector AI falló');
    }

    const selectorResult = await selectorResponse.json();
    const { selection } = selectorResult;

    console.log(`✅ Proveedor seleccionado: ${selection.provider_name}`);
    console.log(`   Tipo: ${selection.provider_type.toUpperCase()}`);
    console.log(`   Costo estimado: $${selection.estimated_cost}`);
    console.log(`   Razón: ${selection.reason}`);

    // ═══════════════════════════════════════════════════════
    // PASO 2: PREPARAR INPUTS SEGÚN TIPO DE PROVEEDOR
    // ═══════════════════════════════════════════════════════

    console.log('\n📦 PASO 2: Preparando inputs...');

    let kieInputs: any = {};

    if (selection.provider_type === 'avatar') {
      // AVATAR: Necesita imagen + audio
      console.log('   Tipo AVATAR: Preparando imagen + audio...');

      // 2.1: Obtener foto de Google Drive
      const avatarResult = await getRandomUnusedAvatar();
      if (!avatarResult.success) {
        return NextResponse.json({
          success: false,
          error: 'No hay fotos disponibles en Google Drive'
        }, { status: 400 });
      }

      const avatarFileId = avatarResult.fileId!;
      const avatarFilename = avatarResult.filename!;
      console.log(`   ✅ Avatar: ${avatarFilename}`);

      // 2.2: Descargar avatar
      const avatarBuffer = await downloadDriveFile(avatarFileId);

      // 2.3: Subir a Supabase Storage para URL pública
      const avatarStoragePath = `avatars/avatar-${Date.now()}.png`;
      const { error: uploadError } = await supabaseAdmin.storage
        .from('avatars')
        .upload(avatarStoragePath, avatarBuffer, {
          contentType: 'image/png',
          upsert: true
        });

      if (uploadError) {
        console.error('   Error subiendo avatar:', uploadError.message);
        throw new Error('Error subiendo avatar a Storage');
      }

      const { data: avatarUrl } = supabaseAdmin.storage
        .from('avatars')
        .getPublicUrl(avatarStoragePath);

      console.log(`   ✅ Avatar URL: ${avatarUrl.publicUrl}`);

      // 2.4: Generar audio con ElevenLabs (si está configurado)
      let audioUrl: string | undefined;

      if (elevenLabsKey && has_audio) {
        console.log('   Generando audio con ElevenLabs...');
        const audioResult = await generateAudioWithElevenLabs(caption, elevenLabsKey);
        if (audioResult.success) {
          audioUrl = audioResult.audioUrl;
          console.log(`   ✅ Audio URL: ${audioUrl}`);
        } else {
          console.log(`   ⚠️  ElevenLabs falló: ${audioResult.error}`);
          console.log('   Usando TTS de Kie.ai como fallback');
        }
      }

      // Inputs para avatar
      kieInputs = {
        image_url: avatarUrl.publicUrl,
        ...(audioUrl ? { audio_url: audioUrl } : { text: caption }),
        duration
      };

      // Marcar avatar como usado
      await markAvatarAsUsed(avatarFileId);
      console.log(`   Avatar "${avatarFilename}" movido a carpeta USADAS`);

    } else {
      // GENERATIVO: Solo necesita prompt
      console.log('   Tipo GENERATIVO: Preparando prompt...');

      kieInputs = {
        prompt: caption,
        duration,
        aspect_ratio: '9:16' // Vertical para Instagram/TikTok
      };
    }

    // ═══════════════════════════════════════════════════════
    // PASO 3: GENERAR VIDEO CON KIE.AI
    // ═══════════════════════════════════════════════════════

    console.log('\n🎬 PASO 3: Generando video con Kie.ai...');
    console.log(`   Provider: ${selection.provider_id}`);

    const kieResponse = await fetch('https://api.kie.ai/v1/generate', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${kieApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        provider: selection.provider_id,
        inputs: kieInputs
      })
    });

    if (!kieResponse.ok) {
      const errorText = await kieResponse.text();
      console.error('   ❌ Kie.ai error:', errorText);
      throw new Error(`Kie.ai API error: ${kieResponse.status} - ${errorText}`);
    }

    const kieData = await kieResponse.json();
    const taskId = kieData.task_id || kieData.id;

    if (!taskId) {
      throw new Error('No se recibió task_id de Kie.ai');
    }

    console.log(`   ✅ Task ID: ${taskId}`);
    console.log('   ⏳ Esperando generación...');

    // ═══════════════════════════════════════════════════════
    // PASO 4: POLLING - Esperar video completado
    // ═══════════════════════════════════════════════════════

    let videoUrl = '';
    let status = 'processing';
    let attempts = 0;
    const maxAttempts = 120; // 10 minutos máximo (5s * 120)

    while (status !== 'completed' && status !== 'failed' && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 5000)); // 5 segundos

      const statusResponse = await fetch(`https://api.kie.ai/v1/tasks/${taskId}`, {
        headers: {
          'Authorization': `Bearer ${kieApiKey}`
        }
      });

      if (statusResponse.ok) {
        const statusData = await statusResponse.json();
        status = statusData.status;

        console.log(`   Status: ${status} (intento ${attempts + 1}/${maxAttempts})`);

        if (status === 'completed') {
          videoUrl = statusData.output?.video_url || statusData.result_url;
          break;
        } else if (status === 'failed') {
          throw new Error('Kie.ai falló al procesar el video');
        }
      }

      attempts++;
    }

    if (!videoUrl) {
      throw new Error('Timeout esperando video de Kie.ai');
    }

    console.log(`   ✅ Video generado: ${videoUrl}`);

    // ═══════════════════════════════════════════════════════
    // PASO 5: GUARDAR EN SUPABASE
    // ═══════════════════════════════════════════════════════

    console.log('\n💾 PASO 5: Guardando en Supabase...');

    const { data: currentContent } = await supabaseAdmin
      .from('scheduled_content')
      .select('metadata')
      .eq('id', contentId)
      .single();

    await supabaseAdmin
      .from('scheduled_content')
      .update({
        suggested_media: videoUrl,
        status: 'ready',
        metadata: {
          ...currentContent?.metadata,
          video_generated: true,
          video_url: videoUrl,
          provider: selection.provider_id,
          provider_type: selection.provider_type,
          estimated_cost: selection.estimated_cost,
          video_type,
          duration,
          generated_at: new Date().toISOString(),
          kie_task_id: taskId
        }
      })
      .eq('id', contentId);

    console.log('   ✅ Guardado en Supabase');

    // ═══════════════════════════════════════════════════════
    // PASO 6: NOTIFICACIÓN POR EMAIL
    // ═══════════════════════════════════════════════════════

    console.log('\n📧 PASO 6: Enviando notificación...');

    try {
      await notifyVideoReady(videoUrl);
      console.log('   ✅ Email enviado');
    } catch (emailError) {
      console.error('   ⚠️  Error enviando email:', emailError);
      // No fallar por esto
    }

    // ═══════════════════════════════════════════════════════
    // ÉXITO
    // ═══════════════════════════════════════════════════════

    console.log('\n✅ === VIDEO GENERADO EXITOSAMENTE ===\n');

    return NextResponse.json({
      success: true,
      data: {
        videoUrl,
        provider: selection.provider_id,
        providerName: selection.provider_name,
        providerType: selection.provider_type,
        estimatedCost: selection.estimated_cost,
        duration,
        videoType: video_type,
        taskId,
        message: `Video ${video_type} generado con ${selection.provider_name}`
      }
    });

  } catch (error: any) {
    console.error('❌ Error en generación inteligente:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      details: error.toString()
    }, { status: 500 });
  }
}

/**
 * Genera audio con ElevenLabs
 */
async function generateAudioWithElevenLabs(
  text: string,
  apiKey: string
): Promise<{ success: boolean; audioUrl?: string; error?: string }> {
  try {
    // Limpiar texto
    const cleanText = text
      .replace(/\d+-\d+s?:\s*/gi, '')
      .replace(/["'"]/g, '')
      .replace(/\*\*/g, '')
      .replace(/#{1,}/g, '')
      .replace(/[\u{1F300}-\u{1F9FF}]/gu, '')
      .replace(/\n+/g, '. ')
      .trim()
      .slice(0, 1500);

    // Voice ID de ElevenLabs (español)
    const voiceId = process.env.ELEVENLABS_VOICE_ID || 'XB0fDUnXU5powFXDhCwa'; // Charlotte

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
            stability: 0.55,
            similarity_boost: 0.75,
            style: 0.6,
            use_speaker_boost: true
          }
        })
      }
    );

    if (!response.ok) {
      const error = await response.text();
      return { success: false, error };
    }

    // Subir a Supabase Storage
    const audioBuffer = await response.arrayBuffer();
    const audioFilename = `audio/audio-${Date.now()}.mp3`;

    const { error: uploadError } = await supabaseAdmin.storage
      .from('avatars')
      .upload(audioFilename, Buffer.from(audioBuffer), {
        contentType: 'audio/mpeg',
        upsert: true
      });

    if (uploadError) {
      return { success: false, error: uploadError.message };
    }

    const { data: publicUrl } = supabaseAdmin.storage
      .from('avatars')
      .getPublicUrl(audioFilename);

    return { success: true, audioUrl: publicUrl.publicUrl };

  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * GET: Info del sistema
 */
export async function GET() {
  const kieKey = !!(process.env.KIE_AI_API_KEY || process.env.KIE_API_KEY);
  const openaiKey = !!process.env.OPENAI_API_KEY;
  const elevenLabsKey = !!process.env.ELEVENLABS_API_KEY;

  return NextResponse.json({
    success: true,
    status: {
      kieAiConfigured: kieKey,
      openaiConfigured: openaiKey,
      elevenLabsConfigured: elevenLabsKey,
      ready: kieKey && openaiKey
    },
    info: {
      endpoint: '/api/video/generate-smart',
      method: 'POST',
      description: 'Genera videos inteligentemente usando Selector AI + Kie.ai',
      supportedTypes: [
        'talking_head (avatar hablando)',
        'dance (baile/coreografía)',
        'showcase (producto/demo)',
        'motion (movimiento)',
        'creative (efectos)',
        'cinematic (alta calidad)',
        'simple (básico)'
      ],
      providers: {
        avatar: ['kling/v1-avatar-standard', 'kling/v1-avatar-pro', 'infinitalk'],
        generative: ['kling/v2-6', 'veo3-1-fast', 'veo3-1-quality', 'runway/gen3-turbo', 'sora2', 'hailuo-standard', 'kling/v2-1-pro']
      }
    },
    instructions: !kieKey || !openaiKey ? {
      missing: [],
      steps: [
        ...(!kieKey ? ['1. Crear cuenta en https://kie.ai y obtener API key'] : []),
        ...(!kieKey ? ['2. Agregar KIE_AI_API_KEY en Vercel'] : []),
        ...(!openaiKey ? ['3. Agregar OPENAI_API_KEY en Vercel'] : []),
        ...(!elevenLabsKey ? ['4. (Opcional) Agregar ELEVENLABS_API_KEY para mejor audio'] : [])
      ]
    } : null
  });
}
