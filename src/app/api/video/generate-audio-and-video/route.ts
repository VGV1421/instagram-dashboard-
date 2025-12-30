/**
 * Endpoint SIMPLIFICADO: Recibe audio directo de n8n y genera video
 *
 * Ventajas:
 * - No necesita Google Drive OAuth
 * - Más rápido (sin subir/descargar de Drive)
 * - Funciona en Vercel
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getRandomUnusedAvatar, markAvatarAsUsed } from '@/lib/google-drive';
import { generatePrompt } from '@/utils/promptGenerators';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const postId = formData.get('postId') as string;
    const caption = formData.get('caption') as string;
    const audioFile = formData.get('audio') as Blob;

    console.log('🎬 Generación DIRECTA de video desde n8n');
    console.log(`   Post ID: ${postId}`);
    console.log(`   Audio size: ${Math.round(audioFile.size / 1024)}KB`);

    if (!postId || !caption || !audioFile) {
      return NextResponse.json(
        { error: 'Faltan parámetros: postId, caption, audio' },
        { status: 400 }
      );
    }

    const kieApiKey = process.env.KIE_API_KEY;
    if (!kieApiKey) {
      return NextResponse.json(
        { error: 'KIE_API_KEY no configurado' },
        { status: 500 }
      );
    }

    // PASO 1: Convertir audio a Buffer
    console.log('🎵 Paso 1: Procesando audio...');
    const audioBuffer = Buffer.from(await audioFile.arrayBuffer());

    // PASO 2: Subir audio a Kie.ai
    console.log('☁️  Paso 2: Subiendo audio a Kie.ai...');
    const audioBase64 = audioBuffer.toString('base64');
    const audioUrl = await uploadBase64ToKie(audioBase64, 'audio/mpeg', kieApiKey);
    console.log(`   ✅ Audio URL: ${audioUrl}`);

    // PASO 3: Obtener foto
    console.log('📸 Paso 3: Obteniendo foto de avatar...');
    const photoResult = await getRandomUnusedAvatar();

    if (!photoResult.success) {
      return NextResponse.json(
        { error: photoResult.error },
        { status: 500 }
      );
    }

    const photoFileId = photoResult.fileId!;
    const photoUrl = `https://drive.google.com/uc?export=download&id=${photoFileId}`;
    console.log(`   ✅ Foto: ${photoResult.filename}`);

    // PASO 4: Generar prompt optimizado
    console.log('✨ Paso 4: Generando prompt optimizado...');
    const promptBase = `Presentador profesional hablando sobre ${caption.substring(0, 50)}, gestos naturales de manos, expresión entusiasta`;

    const promptOptimizado = await generatePrompt(
      promptBase,
      'video-prompt-ai-generator'
    );

    console.log(`   ✅ Prompt generado`);

    // PASO 5: Generar video con Kling
    console.log('🎬 Paso 5: Generando video con Kling Avatar...');
    console.log('   ⏳ 3-5 minutos...');

    const videoResult = await generateKlingVideo(
      photoUrl,
      audioUrl,
      promptOptimizado,
      kieApiKey
    );

    if (!videoResult.success) {
      return NextResponse.json(
        {
          error: 'Error generando video',
          details: videoResult.error
        },
        { status: 500 }
      );
    }

    console.log(`   ✅ Video generado: ${videoResult.videoUrl}`);

    // PASO 6: Guardar en Supabase
    console.log('💾 Paso 6: Guardando en Supabase...');

    const { error: updateError } = await supabase
      .from('posts')
      .update({
        suggested_media: videoResult.videoUrl,
        status: 'ready',
        updated_at: new Date().toISOString()
      })
      .eq('id', postId);

    if (updateError) {
      console.error('Error actualizando Supabase:', updateError);
      return NextResponse.json(
        { error: 'Error guardando video', details: updateError },
        { status: 500 }
      );
    }

    // PASO 7: Mover foto a usadas
    console.log('📂 Paso 7: Moviendo foto...');
    await markAvatarAsUsed(photoFileId);

    console.log('✅ Proceso completado!\n');

    return NextResponse.json({
      success: true,
      postId,
      videoUrl: videoResult.videoUrl,
      taskId: videoResult.taskId,
      photoUsed: photoResult.filename,
      message: 'Video generado exitosamente'
    });

  } catch (error: any) {
    console.error('❌ Error:', error);

    return NextResponse.json(
      {
        error: 'Error interno',
        details: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

async function uploadBase64ToKie(
  base64Data: string,
  mimeType: string,
  apiKey: string
): Promise<string> {
  const response = await fetch('https://kieai.redpandaai.co/api/file-base64-upload', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      base64Data,
      mimeType,
      fileName: `audio-${Date.now()}.mp3`,
      uploadPath: 'audio/kling'
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Error subiendo a Kie.ai: ${error}`);
  }

  const data = await response.json();
  const url = data.data?.downloadUrl || data.downloadUrl || data.url || data.data?.url;

  if (!url) {
    throw new Error('No se recibió URL del archivo');
  }

  return url;
}

async function generateKlingVideo(
  imageUrl: string,
  audioUrl: string,
  prompt: string,
  apiKey: string
): Promise<{ success: boolean; videoUrl?: string; taskId?: string; error?: string }> {
  try {
    const createResponse = await fetch('https://api.kie.ai/api/v1/jobs/createTask', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'kling/v1-avatar-standard',
        input: {
          image_url: imageUrl,
          audio_url: audioUrl,
          prompt: prompt || "."
        }
      })
    });

    if (!createResponse.ok) {
      const error = await createResponse.text();
      return {
        success: false,
        error: `Kling API error (${createResponse.status}): ${error}`
      };
    }

    const createData = await createResponse.json();
    const taskId = createData.data?.taskId || createData.taskId;

    if (!taskId) {
      return {
        success: false,
        error: 'No se recibió task ID'
      };
    }

    console.log(`   🆔 Task ID: ${taskId}`);

    // Polling (máx 5 min)
    const maxAttempts = 60;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      await new Promise(resolve => setTimeout(resolve, 5000));

      const fetchResponse = await fetch(`https://api.kie.ai/api/v1/jobs/fetchTask/${taskId}`, {
        headers: {
          'Authorization': `Bearer ${apiKey}`
        }
      });

      if (!fetchResponse.ok) {
        continue;
      }

      const data = await fetchResponse.json();
      const status = data.data?.status || data.status;

      console.log(`   [${attempt}/${maxAttempts}] Estado: ${status}`);

      if (status === 'succeed' || status === 'completed') {
        const videoUrl = data.data?.url || data.data?.output?.url || data.url;

        if (!videoUrl) {
          return {
            success: false,
            error: 'Video generado pero sin URL'
          };
        }

        return {
          success: true,
          videoUrl,
          taskId
        };
      }

      if (status === 'failed' || status === 'error') {
        return {
          success: false,
          error: `Generación falló: ${data.data?.error || 'Unknown'}`
        };
      }
    }

    return {
      success: false,
      error: 'Timeout: 5 minutos'
    };

  } catch (error: any) {
    return {
      success: false,
      error: error.message
    };
  }
}
