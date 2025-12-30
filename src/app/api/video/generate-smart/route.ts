import { NextResponse } from 'next/server';
import { generateSmartVideo, GenerateSmartVideoRequest } from '@/lib/video/generate-smart';

/**
 * POST /api/video/generate-smart
 *
 * Genera videos inteligentemente usando:
 * 1. Selector AI (elige mejor proveedor)
 * 2. Kie.ai API (genera video)
 * 3. Auto-guarda en Supabase
 */
export async function POST(request: Request) {
  try {
    const body: GenerateSmartVideoRequest = await request.json();
    const result = await generateSmartVideo(body);

    if (result.success) {
      return NextResponse.json(result);
    } else {
      return NextResponse.json(result, { status: 500 });
    }

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      details: error.toString()
    }, { status: 500 });
  }
}

/**
 * GET: Info del sistema
 */
export async function GET() {
  const kieKey = !!(process.env.KIE_AI_API_KEY || process.env.KIE_API_KEY);
  const openaiKey = !!process.env.OPENAI_API_KEY;
  const elevenLabsKey = !!process.env.ELEVENLABS_API_KEY;

  return NextResponse.json({
    success: true,
    status: {
      kieAiConfigured: kieKey,
      openaiConfigured: openaiKey,
      elevenLabsConfigured: elevenLabsKey,
      ready: kieKey && openaiKey
    },
    info: {
      endpoint: '/api/video/generate-smart',
      method: 'POST',
      description: 'Genera videos inteligentemente usando Selector AI + Kie.ai',
      supportedTypes: [
        'talking_head (avatar hablando)',
        'dance (baile/coreografía)',
        'showcase (producto/demo)',
        'motion (movimiento)',
        'creative (efectos)',
        'cinematic (alta calidad)',
        'simple (básico)'
      ],
      providers: {
        avatar: ['kling/v1-avatar-standard', 'kling/v1-avatar-pro', 'infinitalk'],
        generative: ['kling/v2-6', 'veo3-1-fast', 'veo3-1-quality', 'runway/gen3-turbo', 'sora2', 'hailuo-standard', 'kling/v2-1-pro']
      }
    },
    instructions: !kieKey || !openaiKey ? {
      missing: [],
      steps: [
        ...(!kieKey ? ['1. Crear cuenta en https://kie.ai y obtener API key'] : []),
        ...(!kieKey ? ['2. Agregar KIE_AI_API_KEY en Vercel'] : []),
        ...(!openaiKey ? ['3. Agregar OPENAI_API_KEY en Vercel'] : []),
        ...(!elevenLabsKey ? ['4. (Opcional) Agregar ELEVENLABS_API_KEY para mejor audio'] : [])
      ]
    } : null
  });
}
