import { NextResponse } from 'next/server';
import OpenAI from 'openai';

export async function GET() {
  try {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return NextResponse.json({
        success: false,
        error: 'OPENAI_API_KEY no está configurada',
        env_keys: Object.keys(process.env).filter(k => k.includes('OPENAI'))
      });
    }

    console.log('API Key presente:', apiKey.substring(0, 10) + '...');

    const openai = new OpenAI({ apiKey });

    const start = Date.now();
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: 'Di solo: Funciono' }],
      max_tokens: 10
    });
    const duration = Date.now() - start;

    return NextResponse.json({
      success: true,
      response: completion.choices[0]?.message?.content,
      model: completion.model,
      duration_ms: duration,
      apiKey_preview: apiKey.substring(0, 10) + '...'
    });

  } catch (error: any) {
    console.error('Error OpenAI:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      error_type: error.constructor.name,
      error_code: error.code,
      error_status: error.status,
      full_error: JSON.stringify(error, null, 2)
    }, { status: 500 });
  }
}
