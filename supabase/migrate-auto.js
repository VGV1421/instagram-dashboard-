const https = require('https');
const fs = require('fs');
const path = require('path');

// Cargar variables de entorno
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Leer el schema SQL
const schemaPath = path.join(__dirname, 'schema.sql');
const schema = fs.readFileSync(schemaPath, 'utf8');

console.log('📊 EJECUTANDO MIGRACIÓN AUTOMÁTICA\n');
console.log('📄 Schema:', schemaPath);
console.log('📏 Tamaño:', schema.length, 'caracteres\n');

// Extraer project ref de la URL
const projectRef = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)[1];

console.log('🔗 Proyecto:', projectRef);
console.log('🌐 URL:', supabaseUrl + '\n');

// Función para hacer POST request
function makeRequest(url, data, headers) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);

    const postData = JSON.stringify(data);

    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || 443,
      path: urlObj.pathname + urlObj.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        ...headers
      }
    };

    const req = https.request(options, (res) => {
      let body = '';

      res.on('data', (chunk) => {
        body += chunk;
      });

      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            resolve(JSON.parse(body));
          } catch (e) {
            resolve(body);
          }
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${body}`));
        }
      });
    });

    req.on('error', (e) => {
      reject(e);
    });

    req.write(postData);
    req.end();
  });
}

async function executeSQLStatements() {
  // Dividir el SQL en statements
  const statements = schema
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.match(/^--/) && !s.match(/^\/\*/));

  console.log(`📋 ${statements.length} statements para ejecutar\n`);
  console.log('🚀 Ejecutando via PostgREST API...\n');

  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i];

    // Mostrar solo los primeros 60 caracteres del statement
    const preview = statement.substring(0, 60).replace(/\n/g, ' ') + '...';
    process.stdout.write(`[${i + 1}/${statements.length}] ${preview} `);

    try {
      // Intentar ejecutar usando el endpoint de query
      const response = await makeRequest(
        `${supabaseUrl}/rest/v1/rpc/exec`,
        { query: statement },
        {
          'apikey': serviceRoleKey,
          'Authorization': `Bearer ${serviceRoleKey}`,
          'Prefer': 'params=single-object'
        }
      );

      console.log('✅');
      successCount++;
    } catch (error) {
      // Muchos DDL statements darán error en la REST API, pero eso es esperado
      console.log('⚠️');
      errorCount++;
    }
  }

  console.log('\n' + '═'.repeat(70));
  console.log(`📊 Resultados: ${successCount} exitosos, ${errorCount} con warnings`);
  console.log('═'.repeat(70) + '\n');

  console.log('⚠️  IMPORTANTE:\n');
  console.log('La REST API de Supabase tiene limitaciones para ejecutar DDL.');
  console.log('Los "warnings" son normales para CREATE TABLE, CREATE FUNCTION, etc.\n');
  console.log('🔍 Voy a verificar si las tablas se crearon...\n');

  // Verificar las tablas
  await verifyTables();
}

async function verifyTables() {
  const { createClient } = require('@supabase/supabase-js');
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  const tables = ['clients', 'posts', 'account_stats', 'alerts', 'automation_logs'];

  console.log('🔍 VERIFICANDO TABLAS:\n');

  for (const table of tables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);

      if (error) {
        console.log(`❌ Tabla "${table}": NO EXISTE`);
        console.log(`   Error: ${error.message}\n`);
      } else {
        console.log(`✅ Tabla "${table}": OK ${data.length > 0 ? '(con datos)' : '(vacía)'}`);
      }
    } catch (e) {
      console.log(`❌ Tabla "${table}": ERROR`);
      console.log(`   ${e.message}\n`);
    }
  }

  console.log('\n' + '═'.repeat(70));
  console.log('📝 CONCLUSIÓN:\n');
  console.log('Si ves ❌ arriba, significa que necesitas ejecutar el SQL manualmente.');
  console.log('\n📋 MÉTODO MANUAL (RECOMENDADO):\n');
  console.log('1️⃣  Abre: https://supabase.com/dashboard/project/' + projectRef + '/sql/new');
  console.log('2️⃣  Copia el contenido de: supabase\\schema.sql');
  console.log('3️⃣  Pégalo en el editor SQL');
  console.log('4️⃣  Haz clic en "RUN" (botón verde)\n');
  console.log('═'.repeat(70) + '\n');
}

executeSQLStatements().catch(err => {
  console.error('\n❌ Error fatal:', err.message);
  console.log('\n📋 Por favor, ejecuta el SQL manualmente como se indicó arriba.\n');
});
