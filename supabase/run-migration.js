const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Cargar variables de entorno
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

async function runMigration() {
  console.log('📊 EJECUTANDO MIGRACIÓN DE BASE DE DATOS\n');

  // Construir connection string de PostgreSQL desde la URL de Supabase
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) {
    console.error('❌ Error: NEXT_PUBLIC_SUPABASE_URL no encontrada en .env.local');
    process.exit(1);
  }

  // Extraer el project ref de la URL (nwhdsboiojmqqfvbelwo)
  const projectRef = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)[1];

  // Construir connection string de PostgreSQL
  // Necesitamos la contraseña de la base de datos
  console.log('⚠️  NECESITO LA CONTRASEÑA DE LA BASE DE DATOS POSTGRESQL\n');
  console.log('📝 Para obtenerla:\n');
  console.log('1️⃣  Ve a: https://supabase.com/dashboard/project/' + projectRef + '/settings/database');
  console.log('2️⃣  Busca la sección "Connection string"');
  console.log('3️⃣  Copia la "Connection pooling" string (la que tiene [YOUR-PASSWORD])');
  console.log('4️⃣  O mejor, busca "Database password" al inicio de la página\n');
  console.log('💡 ALTERNATIVA MÁS FÁCIL:\n');
  console.log('Voy a usar la REST API de Supabase en su lugar...\n');

  // Usar el método de Supabase cliente
  const { createClient } = require('@supabase/supabase-js');
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  // Leer el SQL
  const schemaPath = path.join(__dirname, 'schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf8');

  console.log('📄 Schema cargado:', schemaPath);
  console.log('📏 Tamaño:', schema.length, 'caracteres\n');

  // Dividir en statements individuales
  const statements = schema
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--') && !s.match(/^\/\*/));

  console.log(`📋 Encontrados ${statements.length} statements SQL\n`);
  console.log('⚠️  NOTA: La API REST de Supabase no soporta DDL directamente.\n');
  console.log('🔧 SOLUCIÓN: Voy a crear un script SQL que puedas ejecutar en el SQL Editor.\n');

  // Crear un script listo para copiar y pegar
  const readyScript = path.join(__dirname, 'EJECUTAR_ESTO_EN_SUPABASE.sql');
  fs.writeFileSync(readyScript, schema);

  console.log('✅ Script SQL creado en:');
  console.log(`   ${readyScript}\n`);
  console.log('📋 PASOS FINALES:\n');
  console.log('1️⃣  Abre: https://supabase.com/dashboard/project/' + projectRef + '/sql/new');
  console.log('2️⃣  Haz clic en "Import SQL" o simplemente copia el contenido del archivo:');
  console.log(`      ${readyScript}`);
  console.log('3️⃣  Pega en el editor y haz clic en "RUN"\n');

  console.log('💡 O MEJOR AÚN, déjame abrir el contenido para que lo copies:\n');
  console.log('═'.repeat(70));
  console.log(schema);
  console.log('═'.repeat(70));
  console.log('\n✨ Copia todo lo de arriba (desde CREATE EXTENSION hasta el final)');
  console.log('   y pégalo en el SQL Editor de Supabase.\n');
}

runMigration().catch(console.error);
