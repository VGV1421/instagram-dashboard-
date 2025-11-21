/**
 * Script para agregar columnas necesarias para las métricas de negocio
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

async function addMetricsColumns() {
  console.log('🔧 Agregando columnas para métricas de negocio...\n');

  try {
    // 1. Verificar estructura actual de clients
    console.log('📋 Verificando tabla clients...');

    const { data: clients, error: selectError } = await supabase
      .from('clients')
      .select('*')
      .limit(1);

    if (selectError) {
      console.error('Error al verificar tabla:', selectError.message);
      return;
    }

    console.log('Columnas actuales:', clients?.[0] ? Object.keys(clients[0]) : 'tabla vacía');

    // 2. Intentar agregar columna source si no existe
    console.log('\n🔧 Agregando columna source...');

    const { error: sourceError } = await supabase.rpc('exec_sql', {
      sql: `
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'clients' AND column_name = 'source'
          ) THEN
            ALTER TABLE clients ADD COLUMN source TEXT DEFAULT 'organico';
          END IF;
        END $$;
      `
    });

    if (sourceError) {
      // Si rpc no funciona, intentar con SQL directo
      console.log('Intentando método alternativo...');

      // Actualizar un cliente de prueba para verificar
      const { error: updateError } = await supabase
        .from('clients')
        .update({
          metadata: {
            source: 'organico',
            valor_total: 100,
            frecuencia_compra: 1
          }
        })
        .eq('id', clients?.[0]?.id);

      if (updateError) {
        console.log('⚠️  No se pudo actualizar metadata:', updateError.message);
      } else {
        console.log('✅ Metadata actualizada con campos de métricas');
      }
    } else {
      console.log('✅ Columna source agregada');
    }

    // 3. Mostrar instrucciones SQL para ejecutar manualmente si es necesario
    console.log('\n📝 Si las columnas no se agregaron automáticamente,');
    console.log('   ejecuta este SQL en Supabase Dashboard > SQL Editor:\n');
    console.log('   =========================================');
    console.log(`
-- Agregar columna source para tracking de canal de adquisición
ALTER TABLE clients ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'organico';

-- Agregar columna status para estado del cliente
ALTER TABLE clients ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';

-- Crear índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_clients_source ON clients(source);
CREATE INDEX IF NOT EXISTS idx_clients_status ON clients(status);
CREATE INDEX IF NOT EXISTS idx_clients_created_at ON clients(created_at);
    `);
    console.log('   =========================================\n');

    console.log('✅ Script completado');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

addMetricsColumns();
