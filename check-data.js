const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkData() {
  console.log('Verificando datos en Supabase...\n');

  const tables = ['clients', 'posts', 'account_stats', 'alerts', 'automation_logs'];

  for (const table of tables) {
    try {
      const { data, error, count } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });

      if (error) {
        console.log(`[X] ${table}: Error - ${error.message}`);
      } else {
        console.log(`[OK] ${table}: ${count || 0} registros`);
      }
    } catch (e) {
      console.log(`[X] ${table}: ${e.message}`);
    }
  }

  // Verificar datos específicos
  console.log('\n--- Detalles de datos ---');

  // Posts
  const { data: posts } = await supabase
    .from('posts')
    .select('*')
    .limit(1);
  console.log(`Posts sample: ${posts ? JSON.stringify(posts[0]) : 'No data'}`);

  // Account stats
  const { data: stats } = await supabase
    .from('account_stats')
    .select('*')
    .order('timestamp', { ascending: false })
    .limit(1);
  console.log(`Latest stats: ${stats && stats[0] ? JSON.stringify(stats[0]) : 'No data'}`);
}

checkData().catch(console.error);
