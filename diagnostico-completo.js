/**
 * Diagnóstico completo del sistema de automatización
 */
const http = require('http');

async function makeRequest(path) {
  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: 'localhost',
      port: 3000,
      path,
      method: 'GET',
      timeout: 10000
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve({ error: 'Invalid JSON', raw: data.substring(0, 200) });
        }
      });
    });
    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    req.end();
  });
}

async function main() {
  console.log('🔍 DIAGNÓSTICO COMPLETO DEL SISTEMA\n');
  console.log('='.repeat(50));

  // 1. Verificar competidores
  console.log('\n📊 1. COMPETIDORES:');
  try {
    const competitors = await makeRequest('/api/competitors');

    if (competitors.success) {
      console.log(`   Total: ${competitors.stats.total}`);
      console.log(`   Activos: ${competitors.stats.active}`);
      console.log(`   Inactivos: ${competitors.stats.inactive}`);

      if (competitors.data && competitors.data.length > 0) {
        console.log('\n   Lista:');
        competitors.data.forEach(c => {
          const lastSync = c.last_synced_at
            ? new Date(c.last_synced_at).toLocaleDateString()
            : 'Nunca';
          console.log(`   ${c.is_active ? '✅' : '⚪'} @${c.instagram_username} - ${c.display_name}`);
          console.log(`      Última sincronización: ${lastSync}`);
        });
      }

      if (competitors.stats.active === 0) {
        console.log('\n   ⚠️  NO HAY COMPETIDORES ACTIVOS');
        console.log('   Esto explica por qué la generación falla.');
      }
    } else {
      console.log('   ❌ Error:', competitors.error);
    }
  } catch (error) {
    console.log('   ❌ Error consultando:', error.message);
  }

  // 2. Verificar posts sincronizados
  console.log('\n📝 2. POSTS DE COMPETIDORES:');
  try {
    const posts = await makeRequest('/api/competitors/posts?limit=5');

    if (posts.success) {
      console.log(`   Total de posts: ${posts.total || 0}`);

      if (posts.total > 0) {
        console.log('   ✅ Hay posts sincronizados para análisis');
      } else {
        console.log('   ⚠️  NO HAY POSTS SINCRONIZADOS');
        console.log('   Necesitas sincronizar primero para generar contenido.');
      }
    } else {
      console.log('   ❌ Error:', posts.error);
    }
  } catch (error) {
    console.log('   ❌ Error consultando:', error.message);
  }

  // 3. Verificar variables de entorno críticas
  console.log('\n🔑 3. VARIABLES DE ENTORNO:');
  const envVars = [
    'OPENAI_API_KEY',
    'RESEND_API_KEY',
    'APIFY_API_TOKEN',
    'NEXT_PUBLIC_SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY'
  ];

  envVars.forEach(varName => {
    const value = process.env[varName];
    const status = value ? '✅' : '❌';
    const preview = value ? `${value.substring(0, 10)}...` : 'NO CONFIGURADA';
    console.log(`   ${status} ${varName}: ${preview}`);
  });

  // 4. Verificar contenido programado
  console.log('\n📅 4. CONTENIDO PROGRAMADO:');
  try {
    const content = await makeRequest('/api/content/generate-auto?status=scheduled&limit=5');

    if (content.success) {
      console.log(`   Total programado: ${content.count || 0}`);
    } else {
      console.log('   ⚠️  No hay contenido programado');
    }
  } catch (error) {
    console.log('   ⚠️  Error consultando:', error.message);
  }

  // RESUMEN Y RECOMENDACIONES
  console.log('\n' + '='.repeat(50));
  console.log('📋 RESUMEN Y RECOMENDACIONES:\n');

  console.log('Para que la automatización funcione necesitas:');
  console.log('1. ✓ Al menos 1 competidor activo (tienes 3)');
  console.log('2. ? Posts sincronizados de esos competidores');
  console.log('3. ? OpenAI API Key configurada');
  console.log('4. ? Resend API Key para emails');

  console.log('\n💡 PRÓXIMOS PASOS:');
  console.log('A. Si no tienes posts: Sincroniza competidores');
  console.log('   → npm run sync-competitors');
  console.log('   → O usa: POST /api/competitors/sync-apify');
  console.log('');
  console.log('B. Una vez con posts: Prueba generación simple');
  console.log('   → POST /api/content/generate-auto');
  console.log('   → Con count: 1 (solo 1 propuesta para prueba rápida)');
  console.log('');
  console.log('C. Luego usa el workflow de n8n');
  console.log('   → http://localhost:5678');
  console.log('');
}

main().catch(console.error);
