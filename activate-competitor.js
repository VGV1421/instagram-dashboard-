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

async function activateCompetitors() {
  console.log('🔄 Activando competidores...\n');

  // Actualizar todos los competidores a activos
  const { data, error } = await supabase
    .from('competitors')
    .update({ is_active: true })
    .neq('id', '00000000-0000-0000-0000-000000000000')
    .select();

  if (error) {
    console.error('❌ Error:', error.message);
  } else {
    console.log(`✅ ${data?.length || 0} competidores activados:`);
    data?.forEach(c => {
      console.log(`   - @${c.instagram_username} (${c.is_active ? 'activo' : 'inactivo'})`);
    });
  }

  // Verificar estado final
  const { data: competitors } = await supabase
    .from('competitors')
    .select('instagram_username, is_active, last_synced_at')
    .eq('is_active', true);

  console.log('\n📊 Competidores activos:');
  competitors?.forEach(c => {
    console.log(`   - @${c.instagram_username} (último sync: ${c.last_synced_at || 'nunca'})`);
  });
}

activateCompetitors();
