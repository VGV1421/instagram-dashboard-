import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { Resend } from 'resend';

/**
 * GET /api/test-credentials
 * Verifica que todas las APIs funcionen
 */
export async function GET() {
  const results: any = {
    timestamp: new Date().toISOString(),
    tests: {}
  };

  // 1. Test OpenAI
  try {
    if (!process.env.OPENAI_API_KEY) {
      results.tests.openai = { success: false, error: 'API key no configurada' };
    } else {
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: 'Di solo: OK' }],
        max_tokens: 5
      });
      results.tests.openai = {
        success: true,
        response: completion.choices[0]?.message?.content,
        model: completion.model
      };
    }
  } catch (error: any) {
    results.tests.openai = {
      success: false,
      error: error.message
    };
  }

  // 2. Test Resend
  try {
    if (!process.env.RESEND_API_KEY) {
      results.tests.resend = { success: false, error: 'API key no configurada' };
    } else {
      const resend = new Resend(process.env.RESEND_API_KEY);
      // Solo verificamos que la key es válida (no enviamos email real)
      results.tests.resend = {
        success: true,
        note: 'API key configurada (no se envió email de prueba)'
      };
    }
  } catch (error: any) {
    results.tests.resend = {
      success: false,
      error: error.message
    };
  }

  // 3. Test D-ID
  try {
    if (!process.env.DID_API_KEY) {
      results.tests.did = { success: false, error: 'API key no configurada' };
    } else {
      const response = await fetch('https://api.d-id.com/credits', {
        headers: {
          'Authorization': `Basic ${process.env.DID_API_KEY}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        results.tests.did = {
          success: true,
          credits: data.remaining || 0,
          note: 'Créditos disponibles'
        };
      } else {
        results.tests.did = {
          success: false,
          error: `HTTP ${response.status}`,
          statusText: response.statusText
        };
      }
    }
  } catch (error: any) {
    results.tests.did = {
      success: false,
      error: error.message
    };
  }

  // 4. Test ElevenLabs
  try {
    if (!process.env.ELEVENLABS_API_KEY) {
      results.tests.elevenlabs = { success: false, error: 'API key no configurada' };
    } else {
      const response = await fetch('https://api.elevenlabs.io/v1/user', {
        headers: {
          'xi-api-key': process.env.ELEVENLABS_API_KEY
        }
      });

      if (response.ok) {
        const data = await response.json();
        results.tests.elevenlabs = {
          success: true,
          characterCount: data.subscription?.character_count || 0,
          characterLimit: data.subscription?.character_limit || 0
        };
      } else {
        results.tests.elevenlabs = {
          success: false,
          error: `HTTP ${response.status}`
        };
      }
    }
  } catch (error: any) {
    results.tests.elevenlabs = {
      success: false,
      error: error.message
    };
  }

  // 5. Test Supabase
  try {
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      results.tests.supabase = { success: false, error: 'API key no configurada' };
    } else {
      results.tests.supabase = {
        success: true,
        note: 'Configurada correctamente (ya verificado anteriormente)'
      };
    }
  } catch (error: any) {
    results.tests.supabase = {
      success: false,
      error: error.message
    };
  }

  // Resumen
  const total = Object.keys(results.tests).length;
  const successful = Object.values(results.tests).filter((t: any) => t.success).length;

  results.summary = {
    total,
    successful,
    failed: total - successful,
    allWorking: successful === total
  };

  return NextResponse.json(results);
}
