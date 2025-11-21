/**
 * Gestión de competidores - Ver lista y gestionar activación
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function manageCompetitors() {
  console.log('📊 LISTA DE COMPETIDORES EN LA BASE DE DATOS\n');
  console.log('='.repeat(80) + '\n');

  try {
    // Obtener TODOS los competidores (activos e inactivos)
    const { data: competitors, error } = await supabase
      .from('competitors')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Separar activos e inactivos
    const active = competitors.filter(c => c.is_active);
    const inactive = competitors.filter(c => !c.is_active);

    console.log(`✅ COMPETIDORES ACTIVOS (${active.length}):`);
    console.log('-'.repeat(80));

    if (active.length > 0) {
      active.forEach((c, idx) => {
        console.log(`\n${idx + 1}. @${c.instagram_username}`);
        console.log(`   ID: ${c.id}`);
        console.log(`   Display: ${c.display_name || 'N/A'}`);
        console.log(`   Categoría: ${c.category || 'Sin categoría'}`);
        console.log(`   Posts: ${c.posts_count || 0}`);
        console.log(`   Última sync: ${c.last_synced_at ? new Date(c.last_synced_at).toLocaleString('es-ES') : 'Nunca'}`);
        console.log(`   Creado: ${new Date(c.created_at).toLocaleDateString('es-ES')}`);
      });
    } else {
      console.log('   (ninguno activo)');
    }

    console.log('\n\n❌ COMPETIDORES INACTIVOS (${inactive.length}):');
    console.log('-'.repeat(80));

    if (inactive.length > 0) {
      inactive.forEach((c, idx) => {
        console.log(`\n${idx + 1}. @${c.instagram_username}`);
        console.log(`   ID: ${c.id}`);
        console.log(`   Categoría: ${c.category || 'Sin categoría'}`);
        console.log(`   Creado: ${new Date(c.created_at).toLocaleDateString('es-ES')}`);
      });
    } else {
      console.log('   (ninguno inactivo)');
    }

    console.log('\n\n' + '='.repeat(80));
    console.log(`\n📊 RESUMEN:`);
    console.log(`   Total: ${competitors.length} competidores`);
    console.log(`   Activos: ${active.length}`);
    console.log(`   Inactivos: ${inactive.length}`);

    if (active.length > 0) {
      console.log(`\n💰 COSTO ESTIMADO POR SINCRONIZACIÓN:`);
      console.log(`   ${active.length} competidores × 5 posts = ${active.length * 5} posts`);
      console.log(`   Costo: ~$${(active.length * 5 * 0.0027).toFixed(4)} USD por sync`);
      console.log(`   Con $5/mes puedes sincronizar ~${Math.floor(5 / (active.length * 5 * 0.0027))} veces`);
    }

    console.log('\n' + '='.repeat(80) + '\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

manageCompetitors();
