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
          in: transitions[i % transitions.length],
          duration: 0.5
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
        size: {
          width: 1080,
          height: 1920
        },
        fps: 30,
        scaleTo: 'crop', // Mantener aspect ratio
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
