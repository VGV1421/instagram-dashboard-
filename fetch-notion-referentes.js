/**
 * Obtener lista de referentes desde Notion
 */

import { Client } from '@notionhq/client';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env.local') });

const notion = new Client({ auth: process.env.NOTION_API_KEY });

// La página que me pasaste: 2b17922c4a9f80b9baccf96268c0bb95
const PAGE_ID = '2b17922c4a9f80b9baccf96268c0bb95';

async function fetchNotionReferentes() {
  console.log('🔍 Obteniendo referentes desde Notion...\n');
  console.log('📄 Page ID:', PAGE_ID, '\n');

  try {
    // Primero intentar obtener la página
    try {
      const page = await notion.pages.retrieve({ page_id: PAGE_ID });
      console.log('✅ Página encontrada:', page.properties?.title?.title?.[0]?.plain_text || 'Sin título');
    } catch (pageError) {
      console.log('⚠️  No se pudo acceder a la página directamente');
      console.log('   Intentando como base de datos...\n');
    }

    // Intentar leer como base de datos
    let response;
    try {
      response = await notion.databases.query({
        database_id: PAGE_ID,
        page_size: 100
      });
    } catch (dbError) {
      console.log('⚠️  No es una base de datos, intentando obtener bloques...\n');

      // Obtener los bloques (children) de la página
      const blocks = await notion.blocks.children.list({
        block_id: PAGE_ID,
        page_size: 100
      });

      console.log('📄 Bloques encontrados:', blocks.results.length);
      console.log('Tipo de contenido: Página regular con bloques\n');

      // Mostrar todos los bloques para ver qué hay
      console.log('🔍 Analizando bloques:\n');

      let tableBlock = null;

      blocks.results.forEach((block, idx) => {
        console.log(`${idx + 1}. Tipo: ${block.type}`);

        if (block.type === 'child_database') {
          console.log(`   ✅ ENCONTRADA BASE DE DATOS VINCULADA!`);
          console.log(`   Database ID: ${block.id}`);
        }

        if (block.type === 'table') {
          console.log(`   ✅ ENCONTRADA TABLA!`);
          console.log(`   Columnas: ${block.table.table_width}`);
          console.log(`   Filas: ${block.table.has_column_header ? 'con encabezado' : 'sin encabezado'}`);
          tableBlock = block;
        }

        if (block.type === 'paragraph' && block.paragraph?.rich_text) {
          const text = block.paragraph.rich_text.map(t => t.plain_text).join('');
          console.log(`   Texto: ${text.substring(0, 100)}`);
        }

        if (block.type === 'bulleted_list_item' && block.bulleted_list_item?.rich_text) {
          const text = block.bulleted_list_item.rich_text.map(t => t.plain_text).join('');
          console.log(`   Item: ${text.substring(0, 100)}`);
        }
      });

      // Si encontramos una tabla, leer sus filas
      if (tableBlock) {
        console.log('\n📊 Leyendo filas de la tabla...\n');

        const tableRows = await notion.blocks.children.list({
          block_id: tableBlock.id,
          page_size: 100
        });

        console.log(`✅ ${tableRows.results.length} filas encontradas\n`);
        console.log('='.repeat(80) + '\n');

        const referentes = [];

        tableRows.results.forEach((row, idx) => {
          if (row.type === 'table_row') {
            const cells = row.table_row.cells;

            // Extraer texto de cada celda
            const cellTexts = cells.map(cell =>
              cell.map(richText => richText.plain_text).join('')
            );

            console.log(`${idx + 1}. ${cellTexts.join(' | ')}`);

            // Si la primera celda parece ser un username de Instagram
            if (cellTexts[0] && (cellTexts[0].includes('@') || cellTexts[0].includes('instagram'))) {
              referentes.push({
                username: cellTexts[0],
                categoria: cellTexts[1] || 'Sin categoría',
                notas: cellTexts[2] || ''
              });
            }
          }
        });

        console.log('\n' + '='.repeat(80));
        console.log(`\n📊 RESUMEN: ${referentes.length} referentes encontrados\n`);

        return referentes;
      }

      // Si encontramos una base de datos vinculada, intentar leerla
      const linkedDB = blocks.results.find(b => b.type === 'child_database');
      if (linkedDB) {
        console.log('\n📊 Obteniendo datos de la base de datos vinculada...\n');

        const dbResponse = await notion.databases.query({
          database_id: linkedDB.id,
          page_size: 100
        });

        console.log(`✅ ${dbResponse.results.length} registros encontrados\n`);
        console.log('='.repeat(80) + '\n');

        dbResponse.results.forEach((page, idx) => {
          const props = page.properties;

          // Mostrar todas las propiedades para ver qué hay
          console.log(`${idx + 1}. Propiedades disponibles:`, Object.keys(props));

          // Intentar extraer datos
          Object.entries(props).forEach(([key, value]) => {
            if (value.type === 'url' && value.url) {
              console.log(`   ${key}: ${value.url}`);
            }
            if (value.type === 'rich_text' && value.rich_text?.[0]) {
              console.log(`   ${key}: ${value.rich_text[0].plain_text}`);
            }
            if (value.type === 'title' && value.title?.[0]) {
              console.log(`   ${key}: ${value.title[0].plain_text}`);
            }
          });
          console.log('');
        });
      }

      return;
    }

    console.log(`✅ Base de datos encontrada con ${response.results.length} registros\n`);
    console.log('=' .repeat(80) + '\n');

    const referentes = [];

    response.results.forEach((page, idx) => {
      const props = page.properties;

      // Extraer datos comunes de Notion
      const username = props.Instagram?.url ||
                      props.Username?.rich_text?.[0]?.plain_text ||
                      props.Nombre?.title?.[0]?.plain_text ||
                      props.Name?.title?.[0]?.plain_text ||
                      'N/A';

      const categoria = props.Categoría?.select?.name ||
                       props.Category?.select?.name ||
                       props.Tipo?.select?.name ||
                       'Sin categoría';

      const notas = props.Notas?.rich_text?.[0]?.plain_text ||
                   props.Notes?.rich_text?.[0]?.plain_text ||
                   '';

      console.log(`${idx + 1}. ${username}`);
      console.log(`   Categoría: ${categoria}`);
      if (notas) console.log(`   Notas: ${notas.substring(0, 60)}...`);
      console.log('');

      referentes.push({
        username,
        categoria,
        notas,
        page_id: page.id
      });
    });

    console.log('=' .repeat(80) + '\n');
    console.log(`📊 RESUMEN:`);
    console.log(`   Total de referentes: ${referentes.length}\n`);

    // Agrupar por categoría
    const porCategoria = {};
    referentes.forEach(r => {
      if (!porCategoria[r.categoria]) {
        porCategoria[r.categoria] = [];
      }
      porCategoria[r.categoria].push(r.username);
    });

    console.log('📋 Por categoría:');
    Object.entries(porCategoria).forEach(([cat, users]) => {
      console.log(`   ${cat}: ${users.length} referentes`);
    });

    console.log('\n' + '='.repeat(80));

    return referentes;

  } catch (error) {
    console.error('\n❌ Error:', error.message);

    if (error.code === 'object_not_found') {
      console.log('\n💡 Posibles causas:');
      console.log('   1. La página no está compartida con la integración de Notion');
      console.log('   2. El Page ID es incorrecto');
      console.log('   3. La integración no tiene permisos\n');
      console.log('📝 Solución:');
      console.log('   1. Abre la página en Notion');
      console.log('   2. Haz clic en "..." (arriba derecha)');
      console.log('   3. Selecciona "Add connections"');
      console.log('   4. Busca y agrega tu integración de Notion');
    }
  }
}

fetchNotionReferentes();
