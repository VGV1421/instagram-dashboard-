const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function setupClient() {
  console.log('Creando cliente en Supabase...\n');

  // Datos del cliente
  const clientData = {
    instagram_username: 'digitalmindmillonaria',
    instagram_user_id: process.env.INSTAGRAM_USER_ID || 'YOUR_IG_USER_ID',
    access_token: process.env.INSTAGRAM_ACCESS_TOKEN,
    token_expires_at: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(), // 60 days
    is_active: true,
    settings: {
      sync_enabled: true,
      auto_post: false,
      notifications_enabled: true
    }
  };

  // Verificar si ya existe
  const { data: existing } = await supabase
    .from('clients')
    .select('*')
    .eq('instagram_username', 'digitalmindmillonaria')
    .single();

  if (existing) {
    console.log('[OK] Cliente ya existe:', existing.instagram_username);
    console.log('    ID:', existing.id);
    console.log('    Activo:', existing.is_active);
    return existing;
  }

  // Insertar nuevo cliente
  const { data, error } = await supabase
    .from('clients')
    .insert([clientData])
    .select()
    .single();

  if (error) {
    console.error('[X] Error creando cliente:', error.message);
    console.error('    Detalles:', error);
    return null;
  }

  console.log('[OK] Cliente creado exitosamente!');
  console.log('    Username:', data.instagram_username);
  console.log('    ID:', data.id);
  console.log('    Token expira:', data.token_expires_at);

  return data;
}

setupClient()
  .then(() => console.log('\nListo! Ahora puedes sincronizar datos.'))
  .catch(console.error);
