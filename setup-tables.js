/**
 * Script para crear las tablas necesarias para la automatización
 * Ejecutar: node setup-tables.js
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function setupTables() {
  console.log('🔧 Configurando tablas para automatización...\n');

  try {
    // 1. Verificar conexión
    console.log('1️⃣ Verificando conexión a Supabase...');
    const { data: test, error: testError } = await supabase
      .from('clients')
      .select('id')
      .limit(1);

    if (testError && testError.code !== 'PGRST116') {
      console.error('❌ Error de conexión:', testError.message);
      return;
    }
    console.log('   ✅ Conexión exitosa\n');

    // 2. Verificar tabla competitor_analysis
    console.log('2️⃣ Verificando tabla competitor_analysis...');

    // Intentar insertar un registro de prueba para verificar si la tabla existe
    const { error: insertAnalysisError } = await supabase
      .from('competitor_analysis')
      .insert({
        analysis_data: { test: true },
        statistics: { test: true }
      });

    if (insertAnalysisError && !insertAnalysisError.message.includes('already exists')) {
      console.log('   ⚠️ Tabla puede no existir, ejecuta el SQL manualmente');
    } else {
      console.log('   ✅ Tabla competitor_analysis lista\n');
      // Limpiar registro de prueba
      await supabase.from('competitor_analysis').delete().eq('analysis_data->test', true);
    }

    // 3. Crear tabla scheduled_content
    console.log('3️⃣ Creando tabla scheduled_content...');
    const { error: scheduledError } = await supabase
      .from('scheduled_content')
      .insert({
        content_type: 'post',
        topic: 'Test Setup',
        caption: 'Test caption',
        hashtags: ['#test'],
        status: 'draft',
        engagement_prediction: 'medium'
      });

    if (scheduledError && scheduledError.message.includes('does not exist')) {
      console.log('   ⚠️ Tabla scheduled_content NO existe');
      console.log('   📋 Ejecuta el siguiente SQL en Supabase Dashboard:\n');
      console.log(`
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
      `);
    } else {
      console.log('   ✅ Tabla scheduled_content lista');
      // Limpiar registro de prueba
      await supabase.from('scheduled_content').delete().eq('topic', 'Test Setup');
    }

    // 4. Verificar/agregar columna source a clients
    console.log('\n4️⃣ Verificando columna source en clients...');
    const { data: clientTest, error: clientError } = await supabase
      .from('clients')
      .select('source')
      .limit(1);

    if (clientError && clientError.message.includes('source')) {
      console.log('   ⚠️ Columna source NO existe en clients');
      console.log('   📋 Ejecuta: ALTER TABLE clients ADD COLUMN source VARCHAR(100) DEFAULT \'organico\';');
    } else {
      console.log('   ✅ Columna source existe');
    }

    // 5. Verificar competidores
    console.log('\n5️⃣ Verificando competidores activos...');
    const { data: competitors, error: compError } = await supabase
      .from('competitors')
      .select('instagram_username, is_active')
      .eq('is_active', true);

    if (compError) {
      console.log('   ⚠️ Error verificando competidores:', compError.message);
    } else {
      console.log(`   ✅ ${competitors?.length || 0} competidores activos encontrados`);
      if (competitors && competitors.length > 0) {
        competitors.forEach(c => console.log(`      - @${c.instagram_username}`));
      } else {
        console.log('   💡 Importa competidores desde /competidores para que funcione la automatización');
      }
    }

    // 6. Verificar posts de competidores
    console.log('\n6️⃣ Verificando posts de competidores...');
    const { data: posts, error: postsError } = await supabase
      .from('competitor_posts')
      .select('id')
      .limit(1);

    if (postsError) {
      console.log('   ⚠️ Error o tabla no existe:', postsError.message);
    } else {
      const { count } = await supabase
        .from('competitor_posts')
        .select('*', { count: 'exact', head: true });
      console.log(`   ✅ ${count || 0} posts de competidores en BD`);
    }

    // Resumen
    console.log('\n' + '='.repeat(60));
    console.log('\n📋 RESUMEN DE CONFIGURACIÓN:\n');
    console.log('Para completar la configuración:');
    console.log('1. Ve a Supabase Dashboard > SQL Editor');
    console.log('2. Ejecuta el archivo: setup-automation-tables.sql');
    console.log('3. Importa competidores en /competidores');
    console.log('4. Sincroniza algunos competidores (mínimo 3)');
    console.log('5. Ve a /contenido-programado y ejecuta el ciclo');
    console.log('\n' + '='.repeat(60));

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

setupTables();
