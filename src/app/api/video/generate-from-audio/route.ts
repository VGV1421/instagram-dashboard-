/**
 * Endpoint para generar video con Kling Avatar desde audio generado en n8n
 *
 * Flujo:
 * 1. n8n genera audio con ElevenLabs
 * 2. n8n sube audio a Google Drive
 * 3. n8n llama a este endpoint con audioFileId
 * 4. Este endpoint genera el video con Kling Avatar
 * 5. Guarda resultado en Supabase
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { downloadDriveFile, getRandomUnusedAvatar, markAvatarAsUsed } from '@/lib/google-drive';
import { generatePrompt } from '@/utils/promptGenerators';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { postId, audioFileId, caption } = body;

    console.log('🎬 Iniciando generación de video desde n8n');
    console.log(`   Post ID: ${postId}`);
    console.log(`   Audio File ID: ${audioFileId}`);

    if (!postId || !audioFileId || !caption) {
      return NextResponse.json(
        { error: 'Faltan parámetros requeridos: postId, audioFileId, caption' },
        { status: 400 }
      );
    }

    // Verificar que existe Kie.ai API key
    const kieApiKey = process.env.KIE_API_KEY;
    if (!kieApiKey) {
      return NextResponse.json(
        { error: 'KIE_API_KEY no configurado' },
        { status: 500 }
      );
    }

    // PASO 1: Descargar audio de Google Drive
    console.log('📥 Paso 1: Descargando audio de Google Drive...');
    const audioBuffer = await downloadDriveFile(audioFileId);
    console.log(`   ✅ Audio descargado (${Math.round(audioBuffer.length / 1024)}KB)`);

    // PASO 2: Subir audio a Kie.ai
    console.log('☁️  Paso 2: Subiendo audio a Kie.ai...');
    const audioBase64 = audioBuffer.toString('base64');
    const audioUrl = await uploadBase64ToKie(audioBase64, 'audio/mpeg', kieApiKey);
    console.log(`   ✅ Audio URL: ${audioUrl}`);

    // PASO 3: Obtener foto aleatoria de Google Drive
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
    console.log(`   ✅ Foto seleccionada: ${photoResult.filename}`);

    // PASO 4: Generar prompt optimizado
    console.log('✨ Paso 4: Generando prompt optimizado...');
    const promptBase = `Presentador profesional hablando sobre ${caption.substring(0, 50)}, gestos naturales de manos, expresión entusiasta`;

    const promptOptimizado = await generatePrompt(
      promptBase,
      'video-prompt-ai-generator'
    );

    console.log(`   ✅ Prompt generado (${promptOptimizado.length} caracteres)`);

    // PASO 5: Generar video con Kling Avatar
    console.log('🎬 Paso 5: Generando video con Kling Avatar...');
    console.log('   ⏳ Esto tomará 3-5 minutos...');

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

    // PASO 6: Actualizar post en Supabase
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
        { error: 'Error guardando video en Supabase', details: updateError },
        { status: 500 }
      );
    }

    // PASO 7: Mover foto a carpeta de usadas
    console.log('📂 Paso 7: Moviendo foto a carpeta de usadas...');
    await markAvatarAsUsed(photoFileId);

    console.log('✅ Proceso completado exitosamente!\n');

    return NextResponse.json({
      success: true,
      postId,
      videoUrl: videoResult.videoUrl,
      taskId: videoResult.taskId,
      photoUsed: photoResult.filename,
      message: 'Video generado y guardado exitosamente'
    });

  } catch (error: any) {
    console.error('❌ Error en generate-from-audio:', error);

    return NextResponse.json(
      {
        error: 'Error interno del servidor',
        details: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

/**
 * Sube archivo Base64 a Kie.ai
 */
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
    throw new Error('No se recibió URL del archivo subido');
  }

  return url;
}

/**
 * Genera video con Kling Avatar via Kie.ai
 */
async function generateKlingVideo(
  imageUrl: string,
  audioUrl: string,
  prompt: string,
  apiKey: string
): Promise<{ success: boolean; videoUrl?: string; taskId?: string; error?: string }> {
  try {
    // Crear tarea
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
        error: 'No se recibió task ID de Kling',
      };
    }

    console.log(`   🆔 Task ID: ${taskId}`);

    // Polling del resultado (máximo 5 minutos)
    const maxAttempts = 60; // 60 intentos * 5 segundos = 5 minutos

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      await new Promise(resolve => setTimeout(resolve, 5000)); // 5 segundos

      const fetchResponse = await fetch(`https://api.kie.ai/api/v1/jobs/fetchTask/${taskId}`, {
        headers: {
          'Authorization': `Bearer ${apiKey}`
        }
      });

      if (!fetchResponse.ok) {
        continue; // Reintentar
      }

      const data = await fetchResponse.json();
      const status = data.data?.status || data.status;

      console.log(`   [${attempt}/${maxAttempts}] Estado: ${status}`);

      if (status === 'succeed' || status === 'completed') {
        const videoUrl = data.data?.url || data.data?.output?.url || data.url;

        if (!videoUrl) {
          return {
            success: false,
            error: 'Video generado pero no se recibió URL'
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
          error: `Generación falló: ${data.data?.error || 'Unknown error'}`
        };
      }
    }

    return {
      success: false,
      error: 'Timeout: Video no completado en 5 minutos'
    };

  } catch (error: any) {
    return {
      success: false,
      error: error.message
    };
  }
}
