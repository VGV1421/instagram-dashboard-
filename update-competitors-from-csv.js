/**
 * Actualizar competidores desde el CSV editado
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env.local') });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function updateCompetitorsFromCSV() {
  console.log('📋 Actualizando competidores desde CSV...\n');

  try {
    // 1. Leer CSV
    const filePath = join(__dirname, 'SELECCION_COMPETIDORES.csv');

    if (!fs.existsSync(filePath)) {
      console.error('❌ No se encontró el archivo SELECCION_COMPETIDORES.csv');
      console.log('💡 Ejecuta primero: node create-competitors-selection.js');
      return;
    }

    const csvContent = fs.readFileSync(filePath, 'utf8');
    const lines = csvContent.split('\n').slice(1); // Skip header

    console.log(`📄 Archivo leído: ${lines.length} líneas\n`);

    // 2. Parsear CSV
    const seleccionados = [];
    const noSeleccionados = [];

    lines.forEach((line, idx) => {
      if (!line.trim()) return;

      // Parse CSV line (handling quoted fields)
      const matches = line.match(/(".*?"|[^,]+)(?=\s*,|\s*$)/g);
      if (!matches || matches.length < 2) return;

      const seleccionar = matches[0]?.replace(/"/g, '').trim().toUpperCase();
      const username = matches[1]?.replace(/"/g, '').trim().replace('@', '');
      const nombreCompleto = matches[2]?.replace(/"/g, '').trim();
      const categoria = matches[3]?.replace(/"/g, '').trim();

      if (!username) return;

      if (seleccionar === 'SI' || seleccionar === 'SÍ' || seleccionar === 'YES' || seleccionar === 'X' || seleccionar === '✓') {
        seleccionados.push({ username, nombreCompleto, categoria });
      } else {
        noSeleccionados.push({ username });
      }
    });

    console.log('=' .repeat(80));
    console.log(`\n✅ SELECCIONADOS: ${seleccionados.length}`);
    console.log(`❌ NO SELECCIONADOS: ${noSeleccionados.length}\n`);
    console.log('=' .repeat(80));

    // 3. Actualizar base de datos
    console.log('\n🔄 Actualizando base de datos...\n');

    let activated = 0;
    let deactivated = 0;
    let created = 0;
    let errors = 0;

    // Desactivar todos primero
    await supabase
      .from('competitors')
      .update({ is_active: false })
      .neq('id', '00000000-0000-0000-0000-000000000000');

    console.log('   ⏸️  Todos los competidores desactivados\n');

    // Activar/crear los seleccionados
    for (const comp of seleccionados) {
      try {
        // Verificar si existe
        const { data: existing } = await supabase
          .from('competitors')
          .select('id, instagram_username')
          .eq('instagram_username', comp.username)
          .single();

        if (existing) {
          // Actualizar existente
          const { error: updateError } = await supabase
            .from('competitors')
            .update({
              is_active: true,
              category: comp.categoria,
              display_name: comp.nombreCompleto || comp.username
            })
            .eq('id', existing.id);

          if (updateError) {
            console.log(`   ⚠️  Error actualizando @${comp.username}: ${updateError.message}`);
            errors++;
          } else {
            console.log(`   ✅ Activado: @${comp.username}`);
            activated++;
          }
        } else {
          // Crear nuevo
          const { error: insertError } = await supabase
            .from('competitors')
            .insert({
              instagram_username: comp.username,
              display_name: comp.nombreCompleto || comp.username,
              category: comp.categoria,
              is_active: true,
              instagram_url: `https://www.instagram.com/${comp.username}/`
            });

          if (insertError) {
            console.log(`   ⚠️  Error creando @${comp.username}: ${insertError.message}`);
            errors++;
          } else {
            console.log(`   🆕 Creado y activado: @${comp.username}`);
            created++;
          }
        }
      } catch (error) {
        console.log(`   ❌ Error procesando @${comp.username}: ${error.message}`);
        errors++;
      }
    }

    // Contar desactivados
    deactivated = noSeleccionados.length;

    // 4. Resumen final
    console.log('\n' + '=' .repeat(80));
    console.log('\n📊 RESUMEN DE CAMBIOS:\n');
    console.log(`   ✅ Activados: ${activated}`);
    console.log(`   🆕 Creados: ${created}`);
    console.log(`   ⏸️  Desactivados: ${deactivated}`);
    console.log(`   ❌ Errores: ${errors}`);

    console.log('\n💰 COSTO ESTIMADO POR SINCRONIZACIÓN:');
    const totalActivos = activated + created;
    const postsTotal = totalActivos * 5;
    const costoSync = postsTotal * 0.0027;
    const syncsAlMes = Math.floor(5 / costoSync);

    console.log(`   ${totalActivos} competidores × 5 posts = ${postsTotal} posts`);
    console.log(`   Costo: ~$${costoSync.toFixed(4)} USD por sync`);
    console.log(`   Con $5/mes puedes sincronizar ~${syncsAlMes} veces`);

    if (syncsAlMes >= 4) {
      console.log(`   ✅ Perfecto para 1 sincronización semanal (4/mes)`);
    } else {
      console.log(`   ⚠️  Considera sincronizar cada ${Math.ceil(30 / syncsAlMes)} días`);
    }

    console.log('\n🚀 PRÓXIMOS PASOS:');
    console.log('   1. Ve a: http://localhost:3000/competidores');
    console.log('   2. Verás solo los competidores que seleccionaste');
    console.log('   3. Puedes sincronizarlos manualmente o esperar al workflow de n8n\n');

    console.log('=' .repeat(80) + '\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

updateCompetitorsFromCSV();
