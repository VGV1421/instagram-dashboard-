import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * POST /api/setup/create-tables
 * Crea las tablas necesarias usando el cliente de Supabase
 */
export async function POST() {
  const results: string[] = [];

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        db: { schema: 'public' },
        auth: { persistSession: false }
      }
    );

    // Test 1: Verificar scheduled_content
    results.push('Verificando scheduled_content...');
    const { error: scError } = await supabase
      .from('scheduled_content')
      .select('id')
      .limit(1);

    if (scError && scError.message.includes('does not exist')) {
      results.push('⚠️ scheduled_content NO EXISTE - Necesita crearse manualmente');
      results.push('SQL: CREATE TABLE scheduled_content (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), content_type VARCHAR(50), topic VARCHAR(500), caption TEXT, script TEXT, hashtags TEXT[], suggested_media TEXT, scheduled_for TIMESTAMPTZ, status VARCHAR(50) DEFAULT \'draft\', engagement_prediction VARCHAR(20), metadata JSONB, created_at TIMESTAMPTZ DEFAULT NOW());');
    } else {
      results.push('✅ scheduled_content existe');
    }

    // Test 2: Verificar competitor_analysis
    results.push('Verificando competitor_analysis...');
    const { error: caError } = await supabase
      .from('competitor_analysis')
      .select('id')
      .limit(1);

    if (caError && caError.message.includes('does not exist')) {
      results.push('⚠️ competitor_analysis NO EXISTE');
    } else {
      results.push('✅ competitor_analysis existe o se verificó');
    }

    // Test 3: Intentar insertar en scheduled_content para crear implícitamente
    results.push('Intentando crear registro de prueba...');
    const testInsert = await supabase
      .from('scheduled_content')
      .insert({
        content_type: 'post',
        topic: 'Test de configuración',
        caption: 'Este es un post de prueba que será eliminado.',
        hashtags: ['#test'],
        status: 'draft',
        engagement_prediction: 'low'
      })
      .select();

    if (testInsert.error) {
      results.push(`⚠️ Insert falló: ${testInsert.error.message}`);

      // La tabla no existe, dar instrucciones
      if (testInsert.error.message.includes('does not exist')) {
        return NextResponse.json({
          success: false,
          message: 'La tabla scheduled_content no existe. Debes crearla manualmente.',
          sqlToRun: `
-- Ejecuta esto en Supabase SQL Editor:
-- https://supabase.com/dashboard/project/nwhdsboiojmqqfvbelwo/sql/new

CREATE TABLE scheduled_content (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID,
  content_type VARCHAR(50) NOT NULL,
  topic VARCHAR(500),
  caption TEXT NOT NULL,
  script TEXT,
  hashtags TEXT[],
  suggested_media TEXT,
  scheduled_for TIMESTAMP WITH TIME ZONE,
  status VARCHAR(50) DEFAULT 'draft',
  engagement_prediction VARCHAR(20),
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE competitor_analysis (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  analysis_data JSONB NOT NULL,
  statistics JSONB,
  posts_analyzed INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
          `,
          results
        });
      }
    } else {
      results.push('✅ Insert exitoso - tabla funciona');

      // Limpiar registro de prueba
      if (testInsert.data?.[0]?.id) {
        await supabase
          .from('scheduled_content')
          .delete()
          .eq('id', testInsert.data[0].id);
        results.push('✅ Registro de prueba eliminado');
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Verificación completada',
      results
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
    instructions: 'POST a este endpoint para verificar/crear tablas',
    directLink: 'https://supabase.com/dashboard/project/nwhdsboiojmqqfvbelwo/sql/new'
  });
}
