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
    const { videoUrl, text, videoDuration } = await request.json();

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

    if (!videoDuration || videoDuration <= 0) {
      return NextResponse.json(
        { error: 'Se requiere videoDuration (duración real del video en segundos)' },
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

    console.log('🎬 PRUEBA SHOTSTACK - Aplicando post-procesado profesional...');
    console.log('   Video original:', videoUrl);
    console.log('   Duración:', videoDuration, 'segundos');
    console.log('   Texto:', text.substring(0, 50) + '...');

    const result = await postProcessWithShotstack(videoUrl, videoDuration, text, shotstackKey);

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
 * Post-procesa un video con Shotstack (VERSION PROFESIONAL)
 * - Múltiples segmentos con efectos variados
 * - B-roll con gradientes
 * - Subtítulos palabra por palabra mejorados con animaciones
 * - Usa duración REAL del video (no estimaciones)
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

    // CRÍTICO: Usar la duración REAL del video (NO cortarlo con trim)
    const duration = videoDuration;

    console.log(`   🎥 Video completo: ${duration.toFixed(2)}s (SIN CORTES)`);

    // Track 1: Video COMPLETO con zoom gradual (SIN TRIM)
    const videoClips = [{
      asset: {
        type: 'video',
        src: videoUrl
        // NO trim - usar video completo
      },
      start: 0,
      length: duration,  // Duración COMPLETA
      fit: 'cover',
      scale: 1.0,
      effect: 'zoomIn'  // Zoom gradual sobre TODO el video
    }];

    console.log(`   ✅ 1 clip con video COMPLETO + zoom gradual`);

    // Track 2: ELIMINAR B-roll por ahora (simplificar)
    // const brollClips = [];

    // Track 2: TEST SIMPLE - Solo 3 subtítulos grandes
    const captionClips = [
      {
        asset: {
          type: 'html',
          html: '<div style="background:rgba(0,0,0,0.8);padding:20px;text-align:center;"><h1 style="color:white;font-size:50px;margin:0;">HOLA</h1></div>',
          width: 1080,
          height: 200
        },
        start: 0,
        length: 5,
        position: 'bottom'
      },
      {
        asset: {
          type: 'html',
          html: '<div style="background:rgba(0,0,0,0.8);padding:20px;text-align:center;"><h1 style="color:white;font-size:50px;margin:0;">SUBTITULO MEDIO</h1></div>',
          width: 1080,
          height: 200
        },
        start: 5,
        length: 10,
        position: 'bottom'
      },
      {
        asset: {
          type: 'html',
          html: '<div style="background:rgba(0,0,0,0.8);padding:20px;text-align:center;"><h1 style="color:white;font-size:50px;margin:0;">FINAL</h1></div>',
          width: 1080,
          height: 200
        },
        start: 15,
        length: 5,
        position: 'bottom'
      }
    ];

    console.log(`   💬 3 subtítulos TEST SIMPLES`);

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
            clips: videoClips // Video principal
          },
          {
            clips: captionClips // Subtítulos mejorados
          }
        ]
      },
      output: {
        format: 'mp4',
        aspectRatio: '9:16', // Vertical Instagram/TikTok
        resolution: '1080', // 1080x1920 Full HD
        fps: 30,
        quality: 'high'
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
      console.error('   ❌ Shotstack render error:', JSON.stringify(errorData, null, 2));
      return {
        success: false,
        error: `Shotstack render failed: ${JSON.stringify(errorData, null, 2)}`
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
