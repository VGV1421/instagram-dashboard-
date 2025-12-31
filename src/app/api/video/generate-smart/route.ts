// Simplified endpoint for Vercel deployment testing
// IMPORTANT: This is a temporary standalone version
// TODO: Restore full implementation after deployment works

export async function GET() {
  const kieKey = !!(process.env.KIE_AI_API_KEY || process.env.KIE_API_KEY);
  const openaiKey = !!process.env.OPENAI_API_KEY;
  const elevenLabsKey = !!process.env.ELEVENLABS_API_KEY;

  return Response.json({
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
      description: 'Genera videos inteligentemente usando Selector AI + Kie.ai (SIMPLIFIED VERSION)',
      note: 'Full implementation temporarily disabled for deployment testing'
    }
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    return Response.json({
      success: false,
      error: 'Endpoint temporarily simplified for deployment testing',
      message: 'Full video generation will be restored after deployment is confirmed working',
      receivedData: body
    }, { status: 503 });

  } catch (error: any) {
    return Response.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
