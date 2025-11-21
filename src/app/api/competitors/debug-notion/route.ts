import { NextResponse } from 'next/server';

/**
 * GET /api/competitors/debug-notion
 *
 * Debug endpoint para ver la estructura de la página de Notion
 */
export async function GET() {
  try {
    const NOTION_REFERENTES_PAGE_ID = process.env.NOTION_REFERENTES_PAGE_ID;
    const NOTION_API_KEY = process.env.NOTION_API_KEY;

    if (!NOTION_REFERENTES_PAGE_ID || !NOTION_API_KEY) {
      return NextResponse.json({
        success: false,
        error: 'Configuración incompleta'
      }, { status: 500 });
    }

    // Obtener información de la página
    const pageResponse = await fetch(`https://api.notion.com/v1/pages/${NOTION_REFERENTES_PAGE_ID}`, {
      headers: {
        'Authorization': `Bearer ${NOTION_API_KEY}`,
        'Notion-Version': '2022-06-28',
      }
    });

    const pageData = await pageResponse.json();

    // Obtener bloques hijos
    const blocksResponse = await fetch(`https://api.notion.com/v1/blocks/${NOTION_REFERENTES_PAGE_ID}/children`, {
      headers: {
        'Authorization': `Bearer ${NOTION_API_KEY}`,
        'Notion-Version': '2022-06-28',
      }
    });

    const blocksData = await blocksResponse.json();

    // Mapear los tipos de bloques
    const blockTypes = blocksData.results?.map((block: any) => ({
      id: block.id,
      type: block.type,
      has_children: block.has_children
    }));

    return NextResponse.json({
      success: true,
      data: {
        page: {
          id: pageData.id,
          object: pageData.object,
          properties: Object.keys(pageData.properties || {})
        },
        blocks: {
          count: blocksData.results?.length || 0,
          types: blockTypes
        },
        raw: {
          page: pageData,
          blocks: blocksData
        }
      }
    });

  } catch (error: any) {
    console.error('Error:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
