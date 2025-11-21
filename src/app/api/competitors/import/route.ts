import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/simple-client';

/**
 * POST /api/competitors/import
 *
 * Importa competidores desde una lista de URLs de Instagram
 * Body:
 * - competitors: Array<{ url: string, category?: string }>
 */

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { competitors } = body;

    if (!competitors || !Array.isArray(competitors) || competitors.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Se requiere un array de competidores con sus URLs'
      }, { status: 400 });
    }

    const supabase = supabaseAdmin;
    const imported = [];
    const errors = [];

    for (const comp of competitors) {
      try {
        const { url, category } = comp;

        if (!url) {
          errors.push({ url: 'N/A', error: 'URL es requerida' });
          continue;
        }

        // Extraer username de la URL
        // Ejemplos: https://www.instagram.com/username/ o https://instagram.com/username
        const usernameMatch = url.match(/instagram\.com\/([^\/\?]+)/);

        if (!usernameMatch || !usernameMatch[1]) {
          errors.push({ url, error: 'URL de Instagram inválida' });
          continue;
        }

        const username = usernameMatch[1].toLowerCase();

        // Verificar si ya existe
        const { data: existing } = await supabase
          .from('competitors')
          .select('id, instagram_username')
          .eq('instagram_username', username)
          .single();

        if (existing) {
          errors.push({ url, error: `@${username} ya existe en la base de datos` });
          continue;
        }

        // Insertar nuevo competidor
        const { data: newCompetitor, error: insertError } = await supabase
          .from('competitors')
          .insert({
            instagram_username: username,
            instagram_url: url,
            category: category || null,
            is_active: true
          })
          .select()
          .single();

        if (insertError) {
          console.error('Error inserting competitor:', insertError);
          errors.push({ url, error: insertError.message });
          continue;
        }

        imported.push({
          id: newCompetitor.id,
          username: newCompetitor.instagram_username,
          url: newCompetitor.instagram_url,
          category: newCompetitor.category
        });

      } catch (error: any) {
        console.error('Error processing competitor:', error);
        errors.push({ url: comp.url, error: error.message });
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        imported: imported.length,
        failed: errors.length,
        competitors: imported,
        errors
      }
    });

  } catch (error: any) {
    console.error('Error importing competitors:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Error al importar competidores'
    }, { status: 500 });
  }
}

/**
 * GET /api/competitors/import
 *
 * Obtiene la lista de todos los competidores
 */
export async function GET() {
  try {
    const supabase = supabaseAdmin;

    // Solo obtener competidores ACTIVOS
    const { data: competitors, error } = await supabase
      .from('competitors')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      data: {
        count: competitors?.length || 0,
        competitors: competitors || []
      }
    });

  } catch (error: any) {
    console.error('Error fetching competitors:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Error al obtener competidores'
    }, { status: 500 });
  }
}
