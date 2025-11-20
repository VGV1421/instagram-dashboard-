import { NextResponse } from 'next/server';
import { Client } from '@notionhq/client';
import { supabaseAdmin } from '@/lib/supabase/simple-client';

/**
 * POST /api/competitors/import-notion
 *
 * Importa competidores desde la página de Notion "Referentes"
 */

const notion = new Client({
  auth: process.env.NOTION_API_KEY,
});

const NOTION_REFERENTES_PAGE_ID = process.env.NOTION_REFERENTES_PAGE_ID;

export async function POST() {
  try {
    if (!NOTION_REFERENTES_PAGE_ID) {
      return NextResponse.json({
        success: false,
        error: 'NOTION_REFERENTES_PAGE_ID no está configurado'
      }, { status: 500 });
    }

    if (!process.env.NOTION_API_KEY) {
      return NextResponse.json({
        success: false,
        error: 'NOTION_API_KEY no está configurado'
      }, { status: 500 });
    }

    // Obtener la base de datos (página) de referentes
    const response = await notion.databases.query({
      database_id: NOTION_REFERENTES_PAGE_ID,
    });

    if (!response.results || response.results.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No se encontraron referentes en la página de Notion'
      }, { status: 404 });
    }

    const supabase = supabaseAdmin;
    const imported = [];
    const errors = [];

    for (const page of response.results) {
      try {
        if (!('properties' in page)) {
          continue;
        }

        const properties = page.properties;

        // Extraer datos de las propiedades de Notion
        // Ajusta estos nombres según tu estructura en Notion
        let instagramUrl = '';
        let username = '';
        let category = '';
        let displayName = '';

        // Buscar propiedad que contenga la URL de Instagram
        // Intenta diferentes nombres comunes: "Instagram", "URL", "Link", "Perfil"
        const urlProp = properties['Instagram'] || properties['URL'] || properties['Link'] || properties['Perfil'] || properties['instagram'];

        if (urlProp) {
          if (urlProp.type === 'url' && urlProp.url) {
            instagramUrl = urlProp.url;
          } else if (urlProp.type === 'rich_text' && urlProp.rich_text.length > 0) {
            instagramUrl = urlProp.rich_text[0].plain_text;
          }
        }

        // Buscar nombre/título
        const nameProp = properties['Name'] || properties['Nombre'] || properties['name'] || properties['título'];

        if (nameProp) {
          if (nameProp.type === 'title' && nameProp.title.length > 0) {
            displayName = nameProp.title[0].plain_text;
          } else if (nameProp.type === 'rich_text' && nameProp.rich_text.length > 0) {
            displayName = nameProp.rich_text[0].plain_text;
          }
        }

        // Buscar categoría
        const categoryProp = properties['Categoría'] || properties['Category'] || properties['Tipo'] || properties['Type'];

        if (categoryProp) {
          if (categoryProp.type === 'select' && categoryProp.select) {
            category = categoryProp.select.name;
          } else if (categoryProp.type === 'rich_text' && categoryProp.rich_text.length > 0) {
            category = categoryProp.rich_text[0].plain_text;
          }
        }

        // Si no hay URL, intentar buscar en otras propiedades de texto
        if (!instagramUrl) {
          // Buscar en todas las propiedades de texto que contengan "instagram.com"
          for (const [key, value] of Object.entries(properties)) {
            if (value.type === 'rich_text' && value.rich_text.length > 0) {
              const text = value.rich_text[0].plain_text;
              if (text && text.includes('instagram.com')) {
                instagramUrl = text;
                break;
              }
            }
          }
        }

        if (!instagramUrl) {
          errors.push({
            page_id: page.id,
            name: displayName || 'Sin nombre',
            error: 'No se encontró URL de Instagram'
          });
          continue;
        }

        // Extraer username de la URL
        const usernameMatch = instagramUrl.match(/instagram\.com\/([^\/\?\s]+)/);

        if (!usernameMatch || !usernameMatch[1]) {
          errors.push({
            url: instagramUrl,
            name: displayName || 'Sin nombre',
            error: 'URL de Instagram inválida'
          });
          continue;
        }

        username = usernameMatch[1].toLowerCase().replace('@', '');

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
        console.error('Error processing Notion page:', error);
        errors.push({
          page_id: 'properties' in page ? page.id : 'unknown',
          error: error.message
        });
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        total: response.results.length,
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
 * Obtiene preview de los referentes en Notion sin importar
 */
export async function GET() {
  try {
    if (!NOTION_REFERENTES_PAGE_ID || !process.env.NOTION_API_KEY) {
      return NextResponse.json({
        success: false,
        error: 'Configuración de Notion incompleta'
      }, { status: 500 });
    }

    const response = await notion.databases.query({
      database_id: NOTION_REFERENTES_PAGE_ID,
      page_size: 10
    });

    const preview = response.results.map((page) => {
      if (!('properties' in page)) return null;

      const properties = page.properties;
      let url = '';
      let name = '';

      // Buscar URL
      const urlProp = properties['Instagram'] || properties['URL'] || properties['Link'];
      if (urlProp && urlProp.type === 'url' && urlProp.url) {
        url = urlProp.url;
      }

      // Buscar nombre
      const nameProp = properties['Name'] || properties['Nombre'];
      if (nameProp && nameProp.type === 'title' && nameProp.title.length > 0) {
        name = nameProp.title[0].plain_text;
      }

      return { name, url };
    }).filter(Boolean);

    return NextResponse.json({
      success: true,
      data: {
        count: response.results.length,
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
