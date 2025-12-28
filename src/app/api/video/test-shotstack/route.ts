import { NextRequest, NextResponse } from 'next/server';

/**
 * ENDPOINT DE PRUEBA: Aplica post-procesado de Shotstack a un video existente
 *
 * Uso:
 * POST /api/video/test-shotstack
 * Body: {
 *   "videoUrl": "https://url-del-video-ya-generado.mp4",
 *   "text": "Texto para los subtítulos palabra por palabra"
 * }
 *
 * Esto permite probar el post-procesado SIN gastar créditos de HeyGen
 */

export async function POST(request: NextRequest) {
  try {
    const { videoUrl, text } = await request.json();

    if (!videoUrl) {
      return NextResponse.json(
        { error: 'Se requiere videoUrl' },
        { status: 400 }
      );
    }

    if (!text) {
      return NextResponse.json(
        { error: 'Se requiere text para generar subtítulos' },
        { status: 400 }
      );
    }

    const shotstackKey = process.env.SHOTSTACK_API_KEY;

    if (!shotstackKey) {
      return NextResponse.json(
        { error: 'SHOTSTACK_API_KEY no configurada en .env.local' },
        { status: 400 }
      );
    }

    console.log('🎬 PRUEBA SHOTSTACK - Aplicando post-procesado...');
    console.log('   Video original:', videoUrl);
    console.log('   Texto:', text.substring(0, 50) + '...');

    const result = await postProcessWithShotstack(videoUrl, text, shotstackKey);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    console.log('✅ Post-procesado completado!');
    console.log('   Video procesado:', result.videoUrl);

    return NextResponse.json({
      success: true,
      originalVideo: videoUrl,
      processedVideo: result.videoUrl,
      message: 'Video procesado exitosamente con zooms y subtítulos'
    });

  } catch (error: any) {
    console.error('❌ Error en test-shotstack:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

/**
 * Post-procesa un video con Shotstack
 * - 4 segmentos con zoom alternado
 * - Subtítulos palabra por palabra estilo TikTok
 */
async function postProcessWithShotstack(
  videoUrl: string,
  text: string,
  apiKey: string
): Promise<{ success: boolean; videoUrl?: string; error?: string }> {
  try {
    console.log('   🎬 Iniciando post-procesado con Shotstack...');

    // Calcular duración estimada del video (basado en texto)
    const wordCount = text.split(/\s+/).length;
    const estimatedDuration = (wordCount / 2.5); // ~2.5 palabras por segundo
    const clipDuration = Math.max(5, estimatedDuration / 4); // Dividir en 4 segmentos mínimo

    console.log(`   📊 Palabras: ${wordCount}, Duración estimada: ${estimatedDuration.toFixed(1)}s`);
    console.log(`   📹 Creando ${4} segmentos de ${clipDuration.toFixed(1)}s cada uno`);

    // Crear segmentos con zoom alternado
    const segments = [];
    const zoomEffects = ['zoomIn', 'zoomOut', 'zoomInSlow', 'zoomOutSlow'];

    for (let i = 0; i < 4; i++) {
      segments.push({
        asset: {
          type: 'video',
          src: videoUrl
        },
        start: i * clipDuration,
        length: clipDuration,
        effect: zoomEffects[i % zoomEffects.length],
        transition: i > 0 ? {
          in: 'fade',
          out: 'fade'
        } : undefined
      });
    }

    // Crear subtítulos palabra por palabra (estilo TikTok)
    const words = text.split(/\s+/);
    const captionClips = words.map((word, index) => ({
      asset: {
        type: 'html',
        html: `<p style="font-family: Arial Black, sans-serif; font-size: 80px; font-weight: 900; color: #FFFFFF; text-align: center; text-shadow: 4px 4px 8px rgba(0,0,0,0.8); -webkit-text-stroke: 2px black; padding: 20px; background: linear-gradient(135deg, rgba(255,0,150,0.3), rgba(0,204,255,0.3)); backdrop-filter: blur(10px); border-radius: 20px;">${word.toUpperCase()}</p>`,
        css: 'body { margin: 0; display: flex; align-items: center; justify-content: center; height: 100%; }',
        width: 1080,
        height: 1920,
        background: 'transparent'
      },
      start: (index / 2.5), // ~2.5 palabras por segundo
      length: 0.4, // Cada palabra visible 0.4 segundos
      position: 'center',
      offset: {
        y: 0.3 // Posición inferior
      },
      transition: {
        in: 'slideUp',
        out: 'slideDown'
      }
    }));

    console.log(`   💬 Creando ${captionClips.length} subtítulos animados`);

    // Timeline de Shotstack
    const shotstackPayload = {
      timeline: {
        background: '#000000',
        tracks: [
          {
            clips: segments // Video con zooms
          },
          {
            clips: captionClips // Subtítulos animados
          }
        ]
      },
      output: {
        format: 'mp4',
        size: {
          width: 1080,
          height: 1920
        }
      }
    };

    console.log('   🚀 Enviando a Shotstack...');

    // Enviar render a Shotstack
    const renderResponse = await fetch('https://api.shotstack.io/edit/stage/render', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(shotstackPayload)
    });

    if (!renderResponse.ok) {
      const errorData = await renderResponse.json();
      console.error('   ❌ Shotstack render error:', errorData);
      return {
        success: false,
        error: `Shotstack render failed: ${JSON.stringify(errorData)}`
      };
    }

    const renderData = await renderResponse.json();
    const renderId = renderData.response.id;

    console.log(`   ⏳ Render iniciado: ${renderId}`);
    console.log('   ⏱️  Esperando renderizado (puede tomar 1-3 minutos)...');

    // Polling para esperar el render
    let attempts = 0;
    const maxAttempts = 60; // 5 minutos máximo
    let processedVideoUrl = null;

    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 5000)); // Esperar 5 segundos

      const statusResponse = await fetch(`https://api.shotstack.io/edit/stage/render/${renderId}`, {
        headers: {
          'x-api-key': apiKey
        }
      });

      if (!statusResponse.ok) {
        console.error('   ❌ Error checking render status');
        continue;
      }

      const statusData = await statusResponse.json();
      const status = statusData.response.status;

      attempts++;
      console.log(`   Status: ${status} (intento ${attempts}/${maxAttempts})`);

      if (status === 'done') {
        processedVideoUrl = statusData.response.url;
        console.log('   ✅ Render completado!');
        break;
      } else if (status === 'failed') {
        return {
          success: false,
          error: 'Shotstack render failed'
        };
      }
    }

    if (!processedVideoUrl) {
      return {
        success: false,
        error: 'Shotstack render timeout (5 minutos)'
      };
    }

    return {
      success: true,
      videoUrl: processedVideoUrl
    };

  } catch (error: any) {
    console.error('   ❌ Shotstack error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}
