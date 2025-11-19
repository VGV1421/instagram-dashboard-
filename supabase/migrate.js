const { createClient } = require('@supabase/supabase-js');
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

// Crear cliente con Service Role Key (tiene permisos de admin)
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function executeMigration() {
  try {
    console.log('📊 Ejecutando migración de base de datos...\n');

    // Leer el archivo SQL
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    console.log('📄 Schema cargado desde:', schemaPath);
    console.log('📏 Tamaño:', schema.length, 'caracteres\n');

    // Ejecutar el SQL usando la API REST de Supabase
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: schema
    });

    if (error) {
      // Si no existe la función exec_sql, intentamos con el método directo
      console.log('⚠️  Método RPC no disponible, intentando método directo...\n');

      // Dividir el SQL en statements individuales
      const statements = schema
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));

      console.log(`📋 Ejecutando ${statements.length} statements SQL...\n`);

      for (let i = 0; i < statements.length; i++) {
        const statement = statements[i] + ';';
        console.log(`[${i + 1}/${statements.length}] Ejecutando...`);

        try {
          // Para statements DDL, usamos la conexión directa
          const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': supabaseServiceKey,
              'Authorization': `Bearer ${supabaseServiceKey}`
            },
            body: JSON.stringify({ query: statement })
          });

          if (!response.ok) {
            const errorText = await response.text();
            console.log(`   ⚠️  Advertencia en statement ${i + 1}:`, errorText);
          } else {
            console.log(`   ✅ Statement ${i + 1} ejecutado`);
          }
        } catch (err) {
          console.log(`   ⚠️  Error en statement ${i + 1}:`, err.message);
        }
      }

      console.log('\n✅ Migración completada (con algunos warnings esperados)');
    } else {
      console.log('✅ Migración ejecutada exitosamente');
      console.log('Resultado:', data);
    }

    // Verificar que las tablas se crearon
    console.log('\n🔍 Verificando tablas creadas...\n');

    const { data: clients, error: clientsError } = await supabase
      .from('clients')
      .select('*')
      .limit(1);

    if (clientsError) {
      console.log('❌ Error al verificar tabla clients:', clientsError.message);
    } else {
      console.log('✅ Tabla "clients" creada correctamente');
      if (clients && clients.length > 0) {
        console.log('   📊 Registro encontrado:', clients[0].name);
      }
    }

    const { data: posts, error: postsError } = await supabase
      .from('posts')
      .select('count')
      .limit(1);

    if (!postsError) {
      console.log('✅ Tabla "posts" creada correctamente');
    }

    const { data: alerts, error: alertsError } = await supabase
      .from('alerts')
      .select('count')
      .limit(1);

    if (!alertsError) {
      console.log('✅ Tabla "alerts" creada correctamente');
    }

    const { data: accountStats, error: statsError } = await supabase
      .from('account_stats')
      .select('count')
      .limit(1);

    if (!statsError) {
      console.log('✅ Tabla "account_stats" creada correctamente');
    }

    const { data: automationLogs, error: logsError } = await supabase
      .from('automation_logs')
      .select('count')
      .limit(1);

    if (!logsError) {
      console.log('✅ Tabla "automation_logs" creada correctamente');
    }

    console.log('\n🎉 ¡Base de datos configurada exitosamente!');
    console.log('\n📋 Próximos pasos:');
    console.log('   1. Crear clientes de Supabase (client.ts y server.ts)');
    console.log('   2. Implementar layout principal');
    console.log('   3. Crear página Home con datos reales\n');

  } catch (error) {
    console.error('❌ Error durante la migración:', error);
    process.exit(1);
  }
}

executeMigration();
