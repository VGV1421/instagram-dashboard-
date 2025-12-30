/**
 * Kling AI Avatar 2.0 - Generación de videos con lip sync perfecto
 *
 * Características:
 * - Sincronización labial perfecta
 * - Gestos naturales y movimiento corporal
 * - Alta calidad 1080p
 * - Foto + Audio → Video parlante realista
 *
 * Fuentes:
 * - https://www.pixazo.ai/blog/introducing-kling-ai-avatar-v2-pro-api
 * - https://docs.kie.ai/market/kling/image-to-video
 * - https://fal.ai/models/fal-ai/kling-video/ai-avatar/v2/pro
 */

interface KlingAvatarInput {
  imageUrl: string;  // URL pública de la imagen (JPEG, PNG, WebP)
  audioUrl: string;  // URL pública del audio (MP3, WAV, AAC)
  callbackUrl?: string;  // Webhook para recibir resultado
}

interface KlingAvatarResponse {
  success: boolean;
  taskId?: string;
  videoUrl?: string;
  error?: string;
}

/**
 * Genera autenticación para Kling AI
 */
function getKlingAuth(): string {
  const accessKey = process.env.KLING_ACCESS_KEY;
  const secretKey = process.env.KLING_SECRET_KEY;

  if (!accessKey || !secretKey) {
    throw new Error('KLING_ACCESS_KEY y KLING_SECRET_KEY deben estar configurados en .env.local');
  }

  // Crear token Bearer (concatenando access + secret)
  const token = Buffer.from(`${accessKey}:${secretKey}`).toString('base64');
  return `Bearer ${token}`;
}

/**
 * Crea un video con avatar parlante usando Kling AI Avatar 2.0
 *
 * @param imageUrl - URL pública de la imagen del avatar
 * @param audioUrl - URL pública del audio a sincronizar
 * @returns Task ID para polling del resultado
 */
export async function createKlingAvatar(
  input: KlingAvatarInput
): Promise<KlingAvatarResponse> {
  try {
    console.log('🎭 Generando video con Kling AI Avatar 2.0...');
    console.log(`   Imagen: ${input.imageUrl.substring(0, 60)}...`);
    console.log(`   Audio: ${input.audioUrl.substring(0, 60)}...`);

    const authToken = getKlingAuth();

    // Crear tarea en Kling AI
    const createResponse = await fetch('https://api.kie.ai/api/v1/jobs/createTask', {
      method: 'POST',
      headers: {
        'Authorization': authToken,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'kling-avatar-2.0',  // Modelo de avatar con lip sync
        callBackUrl: input.callbackUrl,
        input: {
          image_urls: [input.imageUrl],
          audio_url: input.audioUrl,
          duration: '15',  // Máximo 15 segundos
          resolution: '1080p'  // Alta calidad
        }
      })
    });

    if (!createResponse.ok) {
      const errorText = await createResponse.text();
      console.error('❌ Error de Kling AI:', errorText);
      return { success: false, error: `Kling API error: ${errorText}` };
    }

    const createData = await createResponse.json();
    const taskId = createData.data?.taskId || createData.taskId;

    if (!taskId) {
      console.error('❌ No se recibió taskId:', createData);
      return { success: false, error: 'No task ID received from Kling' };
    }

    console.log(`✅ Tarea creada: ${taskId}`);
    console.log('⏳ Esperando generación del video...');

    // Polling del resultado (máximo 5 minutos)
    const videoUrl = await pollKlingResult(taskId, authToken);

    if (!videoUrl) {
      return { success: false, error: 'Video generation timeout or failed' };
    }

    console.log(`✅ Video generado: ${videoUrl}`);

    return {
      success: true,
      taskId,
      videoUrl
    };

  } catch (error: any) {
    console.error('❌ Error en createKlingAvatar:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Hace polling del resultado de Kling AI
 * Espera hasta que el video esté listo (máx 5 minutos)
 */
async function pollKlingResult(
  taskId: string,
  authToken: string,
  maxAttempts: number = 60
): Promise<string | null> {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const response = await fetch(`https://api.kie.ai/api/v1/jobs/getTask/${taskId}`, {
        headers: {
          'Authorization': authToken
        }
      });

      if (!response.ok) {
        console.error(`   ❌ Error obteniendo estado (intento ${i + 1})`);
        await sleep(5000);
        continue;
      }

      const data = await response.json();
      const status = data.data?.status || data.status;
      const result = data.data?.result || data.result;

      console.log(`   ⏳ Estado: ${status} (intento ${i + 1}/${maxAttempts})`);

      if (status === 'completed' || status === 'success') {
        const videoUrl = result?.videos?.[0]?.url || result?.video_url || result?.url;
        if (videoUrl) {
          return videoUrl;
        }
      }

      if (status === 'failed' || status === 'error') {
        console.error('   ❌ Generación falló:', data);
        return null;
      }

      // Esperar 5 segundos antes del siguiente intento
      await sleep(5000);

    } catch (error: any) {
      console.error(`   ❌ Error en polling (intento ${i + 1}):`, error.message);
      await sleep(5000);
    }
  }

  console.error('   ❌ Timeout esperando resultado de Kling');
  return null;
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Obtiene información de costos de Kling AI Avatar 2.0
 */
export function getKlingPricing() {
  return {
    '720p': '$0.04 per second',
    '1080p': '$0.08 per second',
    'maxDuration': '15 seconds',
    'estimatedCost1080p': '$1.20 for 15 seconds'
  };
}
