import { NextResponse } from 'next/server';

/**
 * ENDPOINT TODO-EN-UNO: Crear contenido completo
 *
 * Flujo automático:
 * 1. Generar script optimizado (OpenAI)
 * 2. Generar audio del script (ElevenLabs)
 * 3. Generar video con avatar (D-ID)
 * 4. Retornar video listo para publicar
 *
 * Optimizado para Tips Cortos de Instagram (15-30s)
 */
export async function POST(request: Request) {
  try {
    const {
      topic,        // Tema del contenido
      tone,         // professional, casual, motivational, educational
      format,       // reel (default), video, carousel, post
      avatarUrl,    // URL del avatar (opcional, usa default)
      voiceId,      // ID de voz ElevenLabs (opcional, usa default)
    } = await request.json();

    if (!topic) {
      return NextResponse.json(
        { success: false, error: 'Topic is required' },
        { status: 400 }
      );
    }

    console.log('🚀 Iniciando creación de contenido TODO-EN-UNO');
    console.log('  - Tema:', topic);
    console.log('  - Tono:', tone || 'professional');
    console.log('  - Formato:', format || 'reel');

    const progress = {
      step: 1,
      total: 3,
      current: 'Generando script...',
    };

    // ========================================
    // PASO 1: Generar Script (OpenAI)
    // ========================================
    console.log('📝 [1/3] Generando script con OpenAI...');

    const scriptResponse = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/ai/generate-script`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: topic,
          tone: tone || 'professional',
          format: format || 'reel',
        }),
      }
    );

    if (!scriptResponse.ok) {
      const error = await scriptResponse.json();
      throw new Error(error.error || 'Error generando script');
    }

    const scriptData = await scriptResponse.json();
    const script = scriptData.script;

    console.log('✅ Script generado:', script.substring(0, 100) + '...');

    // ========================================
    // PASO 2: Generar Audio (ElevenLabs)
    // ========================================
    console.log('🎤 [2/3] Generando audio con ElevenLabs...');

    const audioResponse = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/ai/generate-audio`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: script,
          voiceId: voiceId,
        }),
      }
    );

    if (!audioResponse.ok) {
      const error = await audioResponse.json();
      throw new Error(error.error || 'Error generando audio');
    }

    const audioData = await audioResponse.json();
    const audioUrl = audioData.data.audio_url;

    console.log('✅ Audio generado:', audioData.data.size_kb, 'KB');

    // ========================================
    // PASO 3: Generar Video (D-ID)
    // ========================================
    console.log('🎬 [3/3] Generando video con D-ID...');

    const videoResponse = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/ai/generate-video`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          audioUrl: audioUrl,
          avatarUrl: avatarUrl,
        }),
      }
    );

    if (!videoResponse.ok) {
      const error = await videoResponse.json();
      throw new Error(error.error || 'Error generando video');
    }

    const videoData = await videoResponse.json();

    console.log('✅ Video completado!');
    console.log('  - URL:', videoData.data.video_url);

    // ========================================
    // RETORNAR CONTENIDO COMPLETO
    // ========================================
    return NextResponse.json({
      success: true,
      message: 'Contenido creado exitosamente',
      data: {
        script: script,
        audio: {
          url: audioUrl,
          size_kb: audioData.data.size_kb,
          format: audioData.data.format,
        },
        video: {
          url: videoData.data.video_url,
          talk_id: videoData.data.talk_id,
          duration: videoData.data.duration_estimate,
          format: videoData.data.format,
        },
        metadata: {
          topic: topic,
          tone: tone || 'professional',
          format: format || 'reel',
          created_at: new Date().toISOString(),
        },
      },
    });

  } catch (error: any) {
    console.error('❌ Error en create-content:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Internal server error',
        step: 'Error en procesamiento',
      },
      { status: 500 }
    );
  }
}

/**
 * GET: Obtener plantillas predefinidas de contenido
 */
export async function GET() {
  const templates = [
    {
      id: 'tip-quick',
      name: 'Tip Rápido (15-30s)',
      topic: 'Comparte un tip específico sobre [TU TEMA]',
      tone: 'professional',
      format: 'reel',
      description: 'Perfecto para engagement rápido. Formato que mejor funciona en 2025.',
    },
    {
      id: 'tutorial-short',
      name: 'Tutorial Corto (60s)',
      topic: 'Explica paso a paso cómo [HACER ALGO] en 3 pasos simples',
      tone: 'educational',
      format: 'video',
      description: 'Mayor valor educativo, mejor posicionamiento como experta.',
    },
    {
      id: 'myth-buster',
      name: 'Desmintiendo Mitos',
      topic: 'El mito de [FALSA CREENCIA] sobre [TU TEMA] - la verdad es...',
      tone: 'casual',
      format: 'reel',
      description: 'Alto engagement, genera debate en comentarios.',
    },
    {
      id: 'trend-analysis',
      name: 'Análisis de Tendencia',
      topic: 'La nueva tendencia de [TEMA TRENDING] - esto es lo que debes saber',
      tone: 'professional',
      format: 'reel',
      description: 'Caso de éxito: 14M vistas. Reacciona a noticias/tendencias.',
    },
    {
      id: 'mistake-avoid',
      name: 'Errores a Evitar',
      topic: '3 errores que cometes con [TU TEMA] y cómo solucionarlos',
      tone: 'motivational',
      format: 'video',
      description: 'Conecta emocionalmente, posiciona como solución.',
    },
  ];

  return NextResponse.json({
    success: true,
    templates: templates,
    total: templates.length,
    recommendation: 'tip-quick', // El que mejor funciona en 2025
  });
}
