const https = require('https');
const fs = require('fs');
const path = require('path');

// Cargar variables de entorno
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Faltan credenciales de Supabase en .env.local');
  process.exit(1);
}

// Leer el archivo SQL
const schemaPath = path.join(__dirname, 'schema.sql');
const schema = fs.readFileSync(schemaPath, 'utf8');

console.log('📊 EJECUTANDO MIGRACIÓN DE BASE DE DATOS\n');
console.log('📄 Schema cargado desde:', schemaPath);
console.log('📏 Tamaño:', schema.length, 'caracteres\n');

// Extraer el host de la URL
const url = new URL(supabaseUrl);
const host = url.hostname;

// Preparar las opciones para la petición HTTP
const options = {
  hostname: host,
  path: '/rest/v1/rpc',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'apikey': supabaseServiceKey,
    'Authorization': `Bearer ${supabaseServiceKey}`,
    'Prefer': 'return=minimal'
  }
};

console.log('🔗 Conectando a:', host);
console.log('⚠️  NOTA: Supabase REST API tiene limitaciones para DDL.\n');
console.log('📝 INSTRUCCIONES MANUALES:\n');
console.log('Por favor, ejecuta el SQL manualmente siguiendo estos pasos:\n');
console.log('1️⃣  Abre tu navegador y ve a:');
console.log('   https://supabase.com/dashboard/project/nwhdsboiojmqqfvbelwo/sql/new\n');
console.log('2️⃣  Copia TODO el contenido del archivo:');
console.log(`   ${schemaPath}\n`);
console.log('3️⃣  Pega el contenido en el editor SQL de Supabase\n');
console.log('4️⃣  Haz clic en el botón verde "RUN" (esquina inferior derecha)\n');
console.log('5️⃣  Espera a que termine (debería tardar 2-3 segundos)\n');
console.log('6️⃣  Verifica que no haya errores en el resultado\n');
console.log('7️⃣  Vuelve aquí y escribe "listo" para que verifique las tablas\n');
console.log('─'.repeat(70));
console.log('\n💡 ALTERNATIVA: Si prefieres, puedo abrir el archivo SQL para que lo copies:\n');

// Mostrar las primeras líneas del SQL para que el usuario vea qué contiene
const firstLines = schema.split('\n').slice(0, 10).join('\n');
console.log('📋 Primeras líneas del schema.sql:');
console.log('─'.repeat(70));
console.log(firstLines);
console.log('...');
console.log('─'.repeat(70));
console.log('\n✨ El archivo completo está en:');
console.log(`   ${schemaPath}\n`);
