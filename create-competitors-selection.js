/**
 * Crear archivo CSV con competidores para selección
 */

import { createClient } from '@supabase/supabase-js';
import { Client } from '@notionhq/client';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env.local') });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const notion = new Client({ auth: process.env.NOTION_API_KEY });

const NOTION_PAGE_ID = '2b17922c4a9f80b9baccf96268c0bb95';

async function createSelectionFile() {
  console.log('📋 Creando archivo de selección de competidores...\n');

  try {
    // 1. Obtener competidores de Supabase
    console.log('🔍 Obteniendo competidores de Supabase...');
    const { data: supabaseCompetitors } = await supabase
      .from('competitors')
      .select('instagram_username, category, is_active, posts_count')
      .order('created_at', { ascending: false });

    console.log(`   ✅ ${supabaseCompetitors?.length || 0} competidores en BD\n`);

    // 2. Obtener competidores de Notion
    console.log('🔍 Obteniendo competidores de Notion...');

    const page = await notion.pages.retrieve({ page_id: NOTION_PAGE_ID });
    const blocks = await notion.blocks.children.list({ block_id: NOTION_PAGE_ID, page_size: 100 });

    const tableBlock = blocks.results.find(b => b.type === 'table');
    const notionCompetitors = [];

    if (tableBlock) {
      const tableRows = await notion.blocks.children.list({ block_id: tableBlock.id, page_size: 100 });

      tableRows.results.forEach((row, idx) => {
        if (row.type === 'table_row' && idx > 0) { // Skip header
          const cells = row.table_row.cells;
          const cellTexts = cells.map(cell => cell.map(richText => richText.plain_text).join(''));

          const username = cellTexts[2]?.trim(); // Columna "Usuario"
          const nombre = cellTexts[1]?.trim(); // Columna "Nombre"
          const nicho = cellTexts[7]?.trim(); // Columna "Nicho/Especialidad"

          if (username && username.includes('@')) {
            notionCompetitors.push({
              username: username.replace('@', ''),
              nombre,
              nicho,
              origen: 'Notion'
            });
          }
        }
      });
    }

    console.log(`   ✅ ${notionCompetitors.length} competidores en Notion\n`);

    // 3. Unificar listas (eliminar duplicados)
    console.log('🔄 Unificando listas...\n');

    const allCompetitors = new Map();

    // Agregar de Supabase
    supabaseCompetitors?.forEach(comp => {
      const username = comp.instagram_username.replace('@', '').toLowerCase();
      allCompetitors.set(username, {
        username: comp.instagram_username,
        categoria: comp.category || 'Sin categoría',
        posts_actuales: comp.posts_count || 0,
        actualmente_activo: comp.is_active ? 'SI' : 'NO',
        origen: 'Base de Datos',
        seleccionar: comp.is_active ? 'SI' : ''
      });
    });

    // Agregar/actualizar de Notion
    notionCompetitors.forEach(comp => {
      const username = comp.username.toLowerCase();

      if (allCompetitors.has(username)) {
        // Ya existe, actualizar info
        const existing = allCompetitors.get(username);
        existing.categoria = comp.nicho || existing.categoria;
        existing.origen = 'Ambas fuentes';
        existing.nombre_completo = comp.nombre;
      } else {
        // Nuevo de Notion
        allCompetitors.set(username, {
          username: '@' + comp.username,
          nombre_completo: comp.nombre,
          categoria: comp.nicho || 'Sin categoría',
          posts_actuales: 0,
          actualmente_activo: 'NO',
          origen: 'Notion',
          seleccionar: ''
        });
      }
    });

    // 4. Crear CSV
    console.log('📝 Creando archivo CSV...\n');

    const csvHeader = 'SELECCIONAR,USERNAME,NOMBRE COMPLETO,CATEGORIA,POSTS ACTUALES,ACTIVO AHORA,ORIGEN\n';

    const csvRows = Array.from(allCompetitors.values())
      .map(comp => {
        return `${comp.seleccionar || ''},"${comp.username}","${comp.nombre_completo || ''}","${comp.categoria}",${comp.posts_actuales},"${comp.actualmente_activo}","${comp.origen}"`;
      })
      .join('\n');

    const csvContent = csvHeader + csvRows;

    const filePath = join(__dirname, 'SELECCION_COMPETIDORES.csv');
    fs.writeFileSync(filePath, csvContent, 'utf8');

    console.log('✅ Archivo creado exitosamente!\n');
    console.log('=' .repeat(80));
    console.log('\n📄 ARCHIVO: SELECCION_COMPETIDORES.csv');
    console.log(`📊 Total de competidores: ${allCompetitors.size}`);
    console.log('\n📝 INSTRUCCIONES:');
    console.log('   1. Abre el archivo SELECCION_COMPETIDORES.csv');
    console.log('   2. En la columna SELECCIONAR, escribe "SI" en los que quieras analizar');
    console.log('   3. Guarda el archivo');
    console.log('   4. Ejecuta: node update-competitors-from-csv.js');
    console.log('\n💡 TIP: Los que ya están activos tienen "SI" pre-marcado\n');
    console.log('=' .repeat(80));

    // 5. Mostrar resumen
    console.log('\n📊 RESUMEN POR ORIGEN:');
    const porOrigen = {};
    allCompetitors.forEach(comp => {
      porOrigen[comp.origen] = (porOrigen[comp.origen] || 0) + 1;
    });
    Object.entries(porOrigen).forEach(([origen, count]) => {
      console.log(`   ${origen}: ${count} competidores`);
    });

    console.log('\n📊 ACTUALMENTE ACTIVOS:');
    const activos = Array.from(allCompetitors.values()).filter(c => c.actualmente_activo === 'SI');
    console.log(`   ${activos.length} competidores activos`);
    activos.forEach(c => console.log(`   - ${c.username}`));

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

createSelectionFile();
