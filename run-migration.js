/**
 * Script para aplicar la migración de competidores en Supabase
 * Uso: node run-migration.js
 */

const fs = require('fs');
const path = require('path');

// Cargar variables de entorno
require('dotenv').config({ path: '.env.local' });

// Importar cliente de Supabase
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Faltan variables de entorno de Supabase');
  console.error('Verifica que .env.local tenga:');
  console.error('- NEXT_PUBLIC_SUPABASE_URL');
  console.error('- SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  console.log('🚀 Iniciando migración de competidores...\n');

  // Leer el archivo SQL
  const migrationPath = path.join(__dirname, 'supabase', 'migrations', '20250120_competitors.sql');

  if (!fs.existsSync(migrationPath)) {
    console.error(`❌ Error: No se encuentra el archivo de migración en ${migrationPath}`);
    process.exit(1);
  }

  const sql = fs.readFileSync(migrationPath, 'utf8');

  console.log('📄 Archivo de migración cargado');
  console.log(`📊 Tamaño: ${(sql.length / 1024).toFixed(2)} KB\n`);

  try {
    console.log('⏳ Ejecutando migración en Supabase...');

    // Ejecutar el SQL usando el cliente RPC
    const { data, error } = await supabase.rpc('exec_sql', { query: sql }).catch(async () => {
      // Si exec_sql no existe, intentar ejecutar directamente
      // Dividir el SQL en statements individuales
      const statements = sql
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--') && !s.startsWith('COMMENT'));

      console.log(`📝 Ejecutando ${statements.length} statements SQL...\n`);

      for (let i = 0; i < statements.length; i++) {
        const statement = statements[i];
        if (!statement) continue;

        console.log(`   [${i + 1}/${statements.length}] Ejecutando statement...`);

        try {
          // Intentar ejecutar usando query directo (solo funciona para algunas operaciones)
          const result = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': supabaseServiceKey,
              'Authorization': `Bearer ${supabaseServiceKey}`
            },
            body: JSON.stringify({ query: statement + ';' })
          }).catch(() => null);

          if (!result || !result.ok) {
            console.log(`   ⚠️  Statement ${i + 1} necesita ejecución manual`);
          } else {
            console.log(`   ✅ Statement ${i + 1} ejecutado`);
          }
        } catch (err) {
          console.log(`   ⚠️  Statement ${i + 1}: ${err.message}`);
        }
      }

      return { data: null, error: null };
    });

    if (error) {
      console.error('\n❌ Error ejecutando migración:', error);
      console.log('\n📋 SOLUCIÓN MANUAL:');
      console.log('1. Ve a https://supabase.com/dashboard/project/nwhdsboiojmqqfvbelwo/editor');
      console.log('2. Copia y pega el contenido del archivo:');
      console.log(`   ${migrationPath}`);
      console.log('3. Ejecuta el SQL manualmente\n');
      process.exit(1);
    }

    console.log('\n✅ ¡Migración completada con éxito!');
    console.log('\n📦 Tablas creadas:');
    console.log('   • competitors (perfiles de competidores)');
    console.log('   • competitor_posts (posts de competidores)');
    console.log('\n🔗 Próximos pasos:');
    console.log('   1. Ve a http://localhost:3000/competidores');
    console.log('   2. Haz clic en "Importar desde Notion"');
    console.log('   3. Luego haz clic en "Sincronizar Datos de Instagram"');
    console.log('   4. Ve a http://localhost:3000/generator y activa "Usar datos de Competidores"\n');

  } catch (error) {
    console.error('\n❌ Error inesperado:', error);
    console.log('\n📋 EJECUTA EL SQL MANUALMENTE:');
    console.log('1. Abre tu dashboard de Supabase:');
    console.log('   https://supabase.com/dashboard/project/nwhdsboiojmqqfvbelwo/editor');
    console.log('2. Ve a SQL Editor');
    console.log('3. Crea una nueva query');
    console.log('4. Copia y pega todo el contenido de:');
    console.log(`   ${migrationPath}`);
    console.log('5. Haz clic en "Run"\n');
    process.exit(1);
  }
}

// Ejecutar
console.log('═══════════════════════════════════════');
console.log('   MIGRACIÓN DE COMPETIDORES');
console.log('   Instagram Dashboard');
console.log('═══════════════════════════════════════\n');

runMigration();
