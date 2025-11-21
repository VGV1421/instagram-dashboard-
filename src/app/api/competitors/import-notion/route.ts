import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/simple-client';
import * as XLSX from 'xlsx';

/**
 * POST /api/competitors/import-notion
 *
 * Importa competidores desde el archivo Excel en la página de Notion "Referentes"
 */

export async function POST() {
  try {
    const NOTION_REFERENTES_PAGE_ID = process.env.NOTION_REFERENTES_PAGE_ID;
    const NOTION_API_KEY = process.env.NOTION_API_KEY;

    if (!NOTION_REFERENTES_PAGE_ID) {
      return NextResponse.json({
        success: false,
        error: 'NOTION_REFERENTES_PAGE_ID no está configurado'
      }, { status: 500 });
    }

    if (!NOTION_API_KEY) {
      return NextResponse.json({
        success: false,
        error: 'NOTION_API_KEY no está configurado'
      }, { status: 500 });
    }

    // Obtener los bloques de la página
    const blocksResponse = await fetch(`https://api.notion.com/v1/blocks/${NOTION_REFERENTES_PAGE_ID}/children`, {
      headers: {
        'Authorization': `Bearer ${NOTION_API_KEY}`,
        'Notion-Version': '2022-06-28',
      }
    });

    if (!blocksResponse.ok) {
      throw new Error(`Error obteniendo bloques: ${blocksResponse.statusText}`);
    }

    const blocksData = await blocksResponse.json();

    // Buscar el archivo Excel en la página
    const fileBlock = blocksData.results.find((block: any) =>
      block.type === 'file' && block.file?.name?.endsWith('.xlsx')
    );

    if (!fileBlock) {
      return NextResponse.json({
        success: false,
        error: 'No se encontró ningún archivo Excel (.xlsx) en la página de Notion'
      }, { status: 404 });
    }

    console.log('Archivo Excel encontrado:', fileBlock.file.name);

    // Descargar el archivo Excel
    const excelUrl = fileBlock.file.file.url;
    const excelResponse = await fetch(excelUrl);

    if (!excelResponse.ok) {
      throw new Error(`Error descargando Excel: ${excelResponse.statusText}`);
    }

    const arrayBuffer = await excelResponse.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });

    // Obtener la primera hoja
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];

    // Convertir a JSON
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

    if (!data || data.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'El archivo Excel está vacío'
      }, { status: 404 });
    }

    console.log(`Encontradas ${data.length} filas en el Excel`);

    const supabase = supabaseAdmin;
    const imported = [];
    const errors = [];

    // Procesar cada fila (saltamos la primera si es encabezado)
    const rows = data as any[][];
    const startRow = rows[0]?.some((cell: any) =>
      typeof cell === 'string' &&
      (cell.toLowerCase().includes('nombre') || cell.toLowerCase().includes('instagram') || cell.toLowerCase().includes('url'))
    ) ? 1 : 0;

    for (let i = startRow; i < rows.length; i++) {
      try {
        const row = rows[i];

        if (!row || row.length === 0) {
          continue;
        }

        // Buscar la URL de Instagram en todas las columnas
        let instagramUrl = '';
        let username = '';
        let category = '';
        let displayName = '';

        // Intentar encontrar URL de Instagram en cualquier columna
        for (let j = 0; j < row.length; j++) {
          const cellValue = String(row[j] || '').trim();
          if (cellValue && cellValue.includes('instagram.com')) {
            instagramUrl = cellValue;
            break;
          }
        }

        // Si no hay URL, intentar buscar un username con @
        if (!instagramUrl) {
          for (let j = 0; j < row.length; j++) {
            const cellValue = String(row[j] || '').trim();
            if (cellValue && cellValue.startsWith('@')) {
              username = cellValue.replace('@', '').toLowerCase();
              instagramUrl = `https://instagram.com/${username}`;
              break;
            }
          }
        }

        // La primera columna suele ser el nombre
        if (row.length > 0 && row[0]) {
          const firstCell = String(row[0]).trim();
          // Si la primera celda no es URL ni username, es el nombre
          if (!firstCell.includes('instagram.com') && !firstCell.startsWith('@')) {
            displayName = firstCell;
          }
        }

        // Intentar obtener categoría de la segunda columna (si existe)
        if (row.length > 1 && row[1]) {
          const secondCell = String(row[1]).trim();
          // Si la segunda celda no es una URL ni username, asumimos que es categoría
          if (secondCell && !secondCell.includes('instagram.com') && !secondCell.startsWith('@') && secondCell !== displayName) {
            category = secondCell;
          }
        }

        if (!instagramUrl) {
          errors.push({
            row: i + 1,
            name: displayName || 'Sin nombre',
            error: 'No se encontró URL de Instagram'
          });
          continue;
        }

        // Extraer username de la URL si aún no lo tenemos
        if (!username) {
          const usernameMatch = instagramUrl.match(/instagram\.com\/([^\/\?\s]+)/);

          if (!usernameMatch || !usernameMatch[1]) {
            errors.push({
              row: i + 1,
              url: instagramUrl,
              name: displayName || 'Sin nombre',
              error: 'URL de Instagram inválida'
            });
            continue;
          }

          username = usernameMatch[1].toLowerCase().replace('@', '');
        }

        // Si no tenemos displayName, usar el username
        if (!displayName) {
          displayName = username;
        }

        // Verificar si ya existe
        const { data: existing } = await supabase
          .from('competitors')
          .select('id, instagram_username')
          .eq('instagram_username', username)
          .single();

        if (existing) {
          // Actualizar si ya existe
          const { error: updateError } = await supabase
            .from('competitors')
            .update({
              instagram_url: instagramUrl,
              display_name: displayName || null,
              category: category || null,
              is_active: true
            })
            .eq('id', existing.id);

          if (updateError) {
            errors.push({
              row: i + 1,
              url: instagramUrl,
              name: displayName || username,
              error: `Error actualizando: ${updateError.message}`
            });
          } else {
            imported.push({
              id: existing.id,
              username,
              url: instagramUrl,
              name: displayName,
              category,
              status: 'updated'
            });
          }
          continue;
        }

        // Insertar nuevo competidor
        const { data: newCompetitor, error: insertError } = await supabase
          .from('competitors')
          .insert({
            instagram_username: username,
            instagram_url: instagramUrl,
            display_name: displayName || null,
            category: category || null,
            is_active: true
          })
          .select()
          .single();

        if (insertError) {
          console.error('Error inserting competitor:', insertError);
          errors.push({
            row: i + 1,
            url: instagramUrl,
            name: displayName || username,
            error: insertError.message
          });
          continue;
        }

        imported.push({
          id: newCompetitor.id,
          username: newCompetitor.instagram_username,
          url: newCompetitor.instagram_url,
          name: newCompetitor.display_name,
          category: newCompetitor.category,
          status: 'created'
        });

      } catch (error: any) {
        console.error('Error processing Excel row:', error);
        errors.push({
          row: i + 1,
          error: error.message
        });
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        total: rows.length - startRow,
        imported: imported.length,
        failed: errors.length,
        competitors: imported,
        errors
      }
    });

  } catch (error: any) {
    console.error('Error importing from Notion:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Error al importar desde Notion'
    }, { status: 500 });
  }
}

/**
 * GET /api/competitors/import-notion
 *
 * Obtiene preview de los referentes en el Excel de Notion sin importar
 */
export async function GET() {
  try {
    const NOTION_REFERENTES_PAGE_ID = process.env.NOTION_REFERENTES_PAGE_ID;
    const NOTION_API_KEY = process.env.NOTION_API_KEY;

    if (!NOTION_REFERENTES_PAGE_ID || !NOTION_API_KEY) {
      return NextResponse.json({
        success: false,
        error: 'Configuración de Notion incompleta'
      }, { status: 500 });
    }

    // Obtener los bloques de la página
    const blocksResponse = await fetch(`https://api.notion.com/v1/blocks/${NOTION_REFERENTES_PAGE_ID}/children`, {
      headers: {
        'Authorization': `Bearer ${NOTION_API_KEY}`,
        'Notion-Version': '2022-06-28',
      }
    });

    if (!blocksResponse.ok) {
      throw new Error(`Error obteniendo bloques: ${blocksResponse.statusText}`);
    }

    const blocksData = await blocksResponse.json();

    // Buscar el archivo Excel en la página
    const fileBlock = blocksData.results.find((block: any) =>
      block.type === 'file' && block.file?.name?.endsWith('.xlsx')
    );

    if (!fileBlock) {
      return NextResponse.json({
        success: false,
        error: 'No se encontró ningún archivo Excel en la página de Notion'
      }, { status: 404 });
    }

    // Descargar el archivo Excel
    const excelUrl = fileBlock.file.file.url;
    const excelResponse = await fetch(excelUrl);

    if (!excelResponse.ok) {
      throw new Error(`Error descargando Excel: ${excelResponse.statusText}`);
    }

    const arrayBuffer = await excelResponse.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });

    // Obtener la primera hoja
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];

    // Convertir a JSON (solo primeras 10 filas para preview)
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1, range: 10 });

    const preview = (data as any[][]).map((row: any[]) => {
      let name = '';
      let url = '';

      // Buscar URL y nombre en las columnas
      for (const cell of row) {
        const cellValue = String(cell || '').trim();
        if (cellValue.includes('instagram.com')) {
          url = cellValue;
        } else if (!name && cellValue && !cellValue.startsWith('@')) {
          name = cellValue;
        }
      }

      return { name, url };
    }).filter(item => item.url || item.name);

    return NextResponse.json({
      success: true,
      data: {
        fileName: fileBlock.file.name,
        count: data.length,
        preview
      }
    });

  } catch (error: any) {
    console.error('Error fetching Notion preview:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Error al obtener preview de Notion'
    }, { status: 500 });
  }
}
