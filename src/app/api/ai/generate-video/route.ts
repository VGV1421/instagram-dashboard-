import { NextResponse } from 'next/server';

/**
 * ENDPOINT: Generar video con avatar usando D-ID
 *
 * Combina tu avatar (foto/video) + audio para crear video hablando
 * Optimizado para Reels de Instagram (15-30 segundos)
 */
export async function POST(request: Request) {
  try {
    const { audioUrl, text, avatarUrl } = await request.json();

    if (!audioUrl && !text) {
      return NextResponse.json(
        { success: false, error: 'Audio URL or text is required' },
        { status: 400 }
      );
    }

    const apiKey = process.env.DID_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: 'D-ID API key not configured' },
        { status: 500 }
      );
    }

    console.log('🎬 Generando video con D-ID...');

    // URL de tu avatar (imagen del assets)
    const sourceUrl = avatarUrl || 'https://instagram-dashboard-ten.vercel.app/avatars/avatar-default.png';

    // Preparar payload para D-ID
    const payload: any = {
      source_url: sourceUrl,
      script: {},
      config: {
        result_format: 'mp4',
        // Optimizado para Instagram Reels
        stitch: true, // Une clips
      },
    };

    // Usar audio existente o generar desde texto
    if (audioUrl) {
      payload.script.type = 'audio';
      payload.script.audio_url = audioUrl;
    } else {
      payload.script.type = 'text';
      payload.script.input = text;
      payload.script.provider = {
        type: 'microsoft',
        voice_id: 'es-MX-DaliaNeural', // Voz femenina mexicana
      };
    }

    console.log('  - Avatar:', sourceUrl);
    console.log('  - Tipo:', payload.script.type);

    // Crear talk (video) en D-ID
    const createResponse = await fetch('https://api.d-id.com/talks', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!createResponse.ok) {
      const errorData = await createResponse.json();
      console.error('❌ Error de D-ID:', errorData);
      return NextResponse.json(
        {
          success: false,
          error: 'Error al crear video',
          details: errorData,
        },
        { status: createResponse.status }
      );
    }

    const createData = await createResponse.json();
    const talkId = createData.id;

    console.log('✅ Video creado, ID:', talkId);
    console.log('⏳ Esperando procesamiento...');

    // Polling para esperar que el video esté listo
    let status = 'created';
    let videoUrl = null;
    let attempts = 0;
    const maxAttempts = 60; // 60 intentos = ~2 minutos max

    while (status !== 'done' && attempts < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, 2000)); // Esperar 2 segundos

      const statusResponse = await fetch(
        `https://api.d-id.com/talks/${talkId}`,
        {
          headers: {
            'Authorization': `Basic ${apiKey}`,
          },
        }
      );

      const statusData = await statusResponse.json();
      status = statusData.status;

      if (status === 'done') {
        videoUrl = statusData.result_url;
        console.log('✅ Video completado!');
        console.log('  - URL:', videoUrl);
      } else if (status === 'error' || status === 'rejected') {
        console.error('❌ Error en procesamiento:', statusData);
        return NextResponse.json(
          {
            success: false,
            error: 'Error en procesamiento de video',
            details: statusData,
          },
          { status: 500 }
        );
      }

      attempts++;
    }

    if (!videoUrl) {
      return NextResponse.json(
        {
          success: false,
          error: 'Timeout: El video tardó demasiado en procesarse',
          talk_id: talkId,
        },
        { status: 408 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Video generado exitosamente',
      data: {
        video_url: videoUrl,
        talk_id: talkId,
        duration_estimate: '15-30s',
        format: 'mp4',
        ready: true,
      },
    });

  } catch (error: any) {
    console.error('❌ Error en generate-video:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Internal server error',
      },
      { status: 500 }
    );
  }
}

/**
 * GET: Obtener status de un video por talk_id
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const talkId = searchParams.get('talk_id');

    if (!talkId) {
      return NextResponse.json(
        { success: false, error: 'talk_id parameter required' },
        { status: 400 }
      );
    }

    const apiKey = process.env.DID_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: 'D-ID API key not configured' },
        { status: 500 }
      );
    }

    const response = await fetch(`https://api.d-id.com/talks/${talkId}`, {
      headers: {
        'Authorization': `Basic ${apiKey}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(
        {
          success: false,
          error: 'Error al obtener status',
          details: errorData,
        },
        { status: response.status }
      );
    }

    const data = await response.json();

    return NextResponse.json({
      success: true,
      data: {
        talk_id: data.id,
        status: data.status,
        video_url: data.result_url || null,
        created_at: data.created_at,
      },
    });

  } catch (error: any) {
    console.error('Error al obtener status:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Internal server error',
      },
      { status: 500 }
    );
  }
}
