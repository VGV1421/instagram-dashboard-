import { supabaseAdmin } from '@/lib/supabase/simple-client';
import { notifyVideoReady } from '@/lib/email/notifications';
import {
  getRandomUnusedAvatar,
  downloadDriveFile,
  markAvatarAsUsed
} from '@/lib/google-drive';
import { generateAudioWithOpenAI, generateAudioWithElevenLabs } from './audio-generation';
import { createKieTask, waitForKieVideo } from './kie-client';

export interface GenerateSmartVideoRequest {
  contentId: string;
  caption: string;
  duration?: 5 | 10 | 15;
  video_type?: 'talking_head' | 'dance' | 'showcase' | 'motion' | 'creative' | 'cinematic' | 'simple';
  objective?: 'natural_gestures' | 'body_movement' | 'visual_effects' | 'fast_generation' | 'high_quality' | 'budget' | 'creative';
  budget_priority?: 'low' | 'medium' | 'high';
  has_audio?: boolean;
}

export interface GenerateSmartVideoResult {
  success: boolean;
  data?: {
    videoUrl: string;
    provider: string;
    providerName: string;
    providerType: string;
    estimatedCost: number;
    duration: number;
    videoType: string;
    taskId: string;
    message: string;
  };
  error?: string;
  details?: string;
}

export async function generateSmartVideo(
  request: GenerateSmartVideoRequest
): Promise<GenerateSmartVideoResult> {
  try {
    const {
      contentId,
      caption,
      duration = 10,
      video_type = 'talking_head',
      objective = 'natural_gestures',
      budget_priority = 'medium',
      has_audio = true
    } = request;

    if (!contentId || !caption) {
      return {
        success: false,
        error: 'contentId y caption son requeridos'
      };
    }

    const kieApiKey = process.env.KIE_AI_API_KEY || process.env.KIE_API_KEY;
    const openaiKey = process.env.OPENAI_API_KEY;
    const elevenLabsKey = process.env.ELEVENLABS_API_KEY;

    if (!kieApiKey) {
      return {
        success: false,
        error: 'KIE_AI_API_KEY no configurado'
      };
    }

    if (!openaiKey) {
      return {
        success: false,
        error: 'OPENAI_API_KEY no configurado'
      };
    }

    console.log('🎬 === GENERACIÓN INTELIGENTE DE VIDEO ===');
    console.log(`📊 Tipo: ${video_type}, Duración: ${duration}s`);

    // PASO 1: Selector AI
    console.log('\n🤖 PASO 1: Consultando selector AI...');

    const selectorResponse = await fetch(
      `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/ai/provider-selector`,
      {
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
      }
    );

    if (!selectorResponse.ok) {
      throw new Error('Selector AI falló');
    }

    const { selection } = await selectorResponse.json();
    console.log(`✅ Proveedor: ${selection.provider_name}`);

    // PASO 2: Preparar inputs
    console.log('\n📦 PASO 2: Preparando inputs...');

    let kieInputs: any = {};

    if (selection.provider_type === 'avatar') {
      // Avatar: imagen + audio
      const avatarResult = await getRandomUnusedAvatar();
      if (!avatarResult.success) {
        return {
          success: false,
          error: 'No hay fotos disponibles en Google Drive'
        };
      }

      const avatarBuffer = await downloadDriveFile(avatarResult.fileId!);
      const avatarStoragePath = `avatars/avatar-${Date.now()}.png`;

      await supabaseAdmin.storage
        .from('avatars')
        .upload(avatarStoragePath, avatarBuffer, {
          contentType: 'image/png',
          upsert: true
        });

      const { data: avatarUrl } = supabaseAdmin.storage
        .from('avatars')
        .getPublicUrl(avatarStoragePath);

      console.log(`✅ Avatar URL: ${avatarUrl.publicUrl}`);

      // Generar audio
      let audioUrl: string | undefined;

      if (elevenLabsKey && has_audio) {
        console.log('🎵 Intentando ElevenLabs...');
        const audioResult = await generateAudioWithElevenLabs(caption, elevenLabsKey);
        if (audioResult.success) {
          audioUrl = audioResult.audioUrl;
        } else {
          console.log(`⚠️ ElevenLabs falló: ${audioResult.error}`);
        }
      }

      if (!audioUrl && openaiKey) {
        console.log('🎵 Intentando OpenAI TTS...');
        const audioResult = await generateAudioWithOpenAI(caption, openaiKey);
        if (audioResult.success) {
          audioUrl = audioResult.audioUrl;
        }
      }

      if (!audioUrl) {
        throw new Error('No se pudo generar audio');
      }

      kieInputs = {
        image_url: avatarUrl.publicUrl,
        audio_url: audioUrl,
        prompt: "Professional presenter speaking with confidence, natural facial expressions, and engaging gestures. Warm, friendly demeanor.",
        duration
      };

      await markAvatarAsUsed(avatarResult.fileId!);
      console.log(`✅ Avatar "${avatarResult.filename}" movido a USADAS`);

    } else {
      // Generativo: solo prompt
      kieInputs = {
        prompt: caption,
        duration,
        aspect_ratio: '9:16'
      };
    }

    // PASO 3: Crear tarea en Kie.ai
    console.log('\n🎬 PASO 3: Creando tarea en Kie.ai...');

    const taskResult = await createKieTask(selection.provider_id, kieInputs, kieApiKey);
    if (!taskResult.success) {
      throw new Error(taskResult.error);
    }

    console.log(`✅ Task ID: ${taskResult.taskId}`);
    console.log('⏳ Esperando generación...');

    // PASO 4: Esperar video
    const videoResult = await waitForKieVideo(taskResult.taskId!, kieApiKey);
    if (!videoResult.success) {
      throw new Error(videoResult.error);
    }

    console.log(`✅ Video generado: ${videoResult.videoUrl}`);

    // PASO 5: Guardar en Supabase
    console.log('\n💾 PASO 5: Guardando en Supabase...');

    const { data: currentContent } = await supabaseAdmin
      .from('scheduled_content')
      .select('metadata')
      .eq('id', contentId)
      .single();

    await supabaseAdmin
      .from('scheduled_content')
      .update({
        suggested_media: videoResult.videoUrl,
        status: 'ready',
        metadata: {
          ...currentContent?.metadata,
          video_generated: true,
          video_url: videoResult.videoUrl,
          provider: selection.provider_id,
          provider_type: selection.provider_type,
          estimated_cost: selection.estimated_cost,
          video_type,
          duration,
          generated_at: new Date().toISOString(),
          kie_task_id: taskResult.taskId
        }
      })
      .eq('id', contentId);

    console.log('✅ Guardado en Supabase');

    // PASO 6: Notificación
    try {
      await notifyVideoReady(videoResult.videoUrl!);
      console.log('✅ Email enviado');
    } catch (emailError) {
      console.error('⚠️ Error enviando email:', emailError);
    }

    console.log('\n✅ === VIDEO GENERADO EXITOSAMENTE ===\n');

    return {
      success: true,
      data: {
        videoUrl: videoResult.videoUrl!,
        provider: selection.provider_id,
        providerName: selection.provider_name,
        providerType: selection.provider_type,
        estimatedCost: selection.estimated_cost,
        duration,
        videoType: video_type,
        taskId: taskResult.taskId!,
        message: `Video ${video_type} generado con ${selection.provider_name}`
      }
    };

  } catch (error: any) {
    console.error('❌ Error:', error);
    return {
      success: false,
      error: error.message,
      details: error.toString()
    };
  }
}
