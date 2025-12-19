import { NextResponse } from 'next/server';

/**
 * ENDPOINT: Generar audio con ElevenLabs
 *
 * Convierte texto a voz usando ElevenLabs TTS
 * Por ahora usa voz predeterminada, después podrás clonar tu voz
 */
export async function POST(request: Request) {
  try {
    const { text, voiceId } = await request.json();

    if (!text) {
      return NextResponse.json(
        { success: false, error: 'Text is required' },
        { status: 400 }
      );
    }

    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: 'ElevenLabs API key not configured' },
        { status: 500 }
      );
    }

    // Voz en español latino (María - natural y profesional)
    // Puedes cambiar esto después de clonar tu voz
    const voice = voiceId || 'XrExE9yKIg1WjnnlVkGX'; // María (Multilingual)

    console.log('🎤 Generando audio con ElevenLabs...');
    console.log('  - Texto:', text.substring(0, 100) + '...');
    console.log('  - Voice ID:', voice);

    // Llamar a ElevenLabs TTS API
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voice}`,
      {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': apiKey,
        },
        body: JSON.stringify({
          text: text,
          model_id: 'eleven_multilingual_v2',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
            style: 0.5,
            use_speaker_boost: true,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.text();
      console.error('❌ Error de ElevenLabs:', errorData);
      return NextResponse.json(
        {
          success: false,
          error: 'Error al generar audio',
          details: errorData,
        },
        { status: response.status }
      );
    }

    // Convertir audio a base64 para retornar
    const audioBuffer = await response.arrayBuffer();
    const audioBase64 = Buffer.from(audioBuffer).toString('base64');
    const audioDataUrl = `data:audio/mpeg;base64,${audioBase64}`;

    console.log('✅ Audio generado exitosamente');
    console.log('  - Tamaño:', (audioBuffer.byteLength / 1024).toFixed(2), 'KB');

    return NextResponse.json({
      success: true,
      message: 'Audio generado exitosamente',
      data: {
        audio_url: audioDataUrl,
        audio_base64: audioBase64,
        size_kb: Math.round(audioBuffer.byteLength / 1024),
        format: 'audio/mpeg',
        voice_id: voice,
      },
    });

  } catch (error: any) {
    console.error('❌ Error en generate-audio:', error);
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
 * GET: Listar voces disponibles en ElevenLabs
 */
export async function GET() {
  try {
    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: 'ElevenLabs API key not configured' },
        { status: 500 }
      );
    }

    const response = await fetch('https://api.elevenlabs.io/v1/voices', {
      headers: {
        'xi-api-key': apiKey,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(
        {
          success: false,
          error: 'Error al obtener voces',
          details: errorData,
        },
        { status: response.status }
      );
    }

    const data = await response.json();

    // Filtrar solo voces en español
    const spanishVoices = data.voices.filter((v: any) =>
      v.labels?.language?.includes('es') ||
      v.labels?.language?.includes('spanish') ||
      v.name.includes('Maria') ||
      v.name.includes('Diego')
    );

    return NextResponse.json({
      success: true,
      voices: spanishVoices,
      total: spanishVoices.length,
      all_voices: data.voices.length,
    });

  } catch (error: any) {
    console.error('Error al listar voces:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Internal server error',
      },
      { status: 500 }
    );
  }
}
