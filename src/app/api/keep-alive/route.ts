import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/simple-client';

/**
 * Keep-Alive Endpoint
 *
 * Este endpoint hace una query simple a Supabase para mantenerlo activo
 * y evitar que se pause después de 7 días sin uso.
 *
 * Configurar un servicio externo (UptimeRobot, cron-job.org) para
 * llamar a este endpoint cada 5-6 días.
 */
export async function GET() {
  try {
    console.log('🏓 Keep-alive ping:', new Date().toISOString());

    // Query simple para mantener Supabase activo
    const { data, error } = await supabaseAdmin
      .from('clients')
      .select('id')
      .limit(1);

    if (error) {
      console.error('❌ Keep-alive failed:', error.message);
      return NextResponse.json(
        {
          success: false,
          error: error.message,
          timestamp: new Date().toISOString()
        },
        { status: 500 }
      );
    }

    console.log('✅ Keep-alive successful');

    return NextResponse.json({
      success: true,
      message: 'Supabase is alive! 🚀',
      timestamp: new Date().toISOString(),
      hasData: (data && data.length > 0)
    });

  } catch (error: any) {
    console.error('❌ Keep-alive error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
