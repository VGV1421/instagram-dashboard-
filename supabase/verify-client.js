const { createClient } = require('@supabase/supabase-js');
const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function verifyClient() {
  console.log('🔍 VERIFICANDO REGISTRO DE CLIENTE\n');

  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('instagram_username', 'digitalmindmillonaria')
    .single();

  if (error) {
    console.error('❌ Error:', error.message);
    return;
  }

  console.log('✅ Cliente encontrado:\n');
  console.log('   ID:', data.id);
  console.log('   Nombre:', data.name);
  console.log('   Instagram:', '@' + data.instagram_username);
  console.log('   User ID:', data.instagram_user_id);
  console.log('   Status:', data.status);
  console.log('   Creado:', data.created_at);
  console.log('   Token configurado:', data.access_token ? 'Sí ✅' : 'No ❌');
  console.log('\n✨ ¡Base de datos lista para usar!\n');
}

verifyClient();
