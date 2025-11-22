import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * POST /api/setup/migrate
 * Crea las tablas necesarias para la automatización
 */
export async function POST() {
  const results: string[] = [];

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 1. Crear tabla scheduled_content
    results.push('Creando tabla scheduled_content...');

    // Intentar crear insertando y verificando error
    const { error: checkError } = await supabase
      .from('scheduled_content')
      .select('id')
      .limit(1);

    if (checkError && checkError.message.includes('does not exist')) {
      // La tabla no existe, intentar crearla via SQL RPC
      // Nota: Esto requiere que exista la función exec_sql en Supabase
      // Si no existe, el SQL debe ejecutarse manualmente

      results.push('⚠️ La tabla scheduled_content no existe.');
      results.push('Por favor, ejecuta el siguiente SQL en Supabase Dashboard:');
      results.push(`
CREATE TABLE scheduled_content (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID,
  content_type VARCHAR(50) NOT NULL,
  topic VARCHAR(500),
  caption TEXT NOT NULL,
  script TEXT,
  hashtags TEXT[],
  suggested_media TEXT,
  media_url TEXT,
  scheduled_for TIMESTAMP WITH TIME ZONE,
  published_at TIMESTAMP WITH TIME ZONE,
  status VARCHAR(50) DEFAULT 'draft',
  engagement_prediction VARCHAR(20),
  actual_engagement JSONB,
  metadata JSONB,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
      `);
    } else {
      results.push('✅ Tabla scheduled_content existe');
    }

    // 2. Verificar competitor_analysis
    const { error: analysisError } = await supabase
      .from('competitor_analysis')
      .select('id')
      .limit(1);

    if (analysisError && analysisError.message.includes('does not exist')) {
      results.push('⚠️ La tabla competitor_analysis no existe.');
      results.push(`
CREATE TABLE competitor_analysis (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  analysis_data JSONB NOT NULL,
  statistics JSONB,
  competitor_ids UUID[],
  posts_analyzed INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
      `);
    } else {
      results.push('✅ Tabla competitor_analysis existe');
    }

    // 3. Verificar automation_logs tiene los campos necesarios
    const { error: logsError } = await supabase
      .from('automation_logs')
      .select('content_generated')
      .limit(1);

    if (logsError) {
      results.push('⚠️ automation_logs puede necesitar columnas adicionales');
    } else {
      results.push('✅ Tabla automation_logs configurada');
    }

    // 4. Verificar competitors tiene los campos necesarios
    const { error: compError } = await supabase
      .from('competitors')
      .select('sync_priority')
      .limit(1);

    if (compError && compError.message.includes('sync_priority')) {
      results.push('⚠️ competitors necesita campos adicionales (sync_priority, last_analysis_at, etc.)');
    } else {
      results.push('✅ Tabla competitors configurada');
    }

    return NextResponse.json({
      success: true,
      results,
      message: 'Verificación completada. Si hay tablas faltantes, ejecuta el SQL manualmente en Supabase Dashboard.'
    });

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      results
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Usa POST para ejecutar la migración',
    instructions: [
      '1. POST /api/setup/migrate - Verifica y muestra SQL necesario',
      '2. Copia el SQL mostrado y ejecútalo en Supabase Dashboard > SQL Editor',
      '3. O usa el archivo setup-automation-tables.sql directamente'
    ]
  });
}
