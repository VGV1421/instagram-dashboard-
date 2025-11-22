import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/simple-client';

/**
 * GET /api/competitors
 * Lista todos los competidores con opción de filtrar por activos
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get('active') === 'true';

    let query = supabaseAdmin
      .from('competitors')
      .select('id, instagram_username, display_name, is_active, last_synced_at, created_at')
      .order('instagram_username', { ascending: true });

    if (activeOnly) {
      query = query.eq('is_active', true);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    const stats = {
      total: data?.length || 0,
      active: data?.filter(c => c.is_active).length || 0,
      inactive: data?.filter(c => !c.is_active).length || 0
    };

    return NextResponse.json({
      success: true,
      data: data || [],
      stats
    });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

/**
 * POST /api/competitors
 * Añade un nuevo competidor
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { instagram_username, display_name } = body;

    if (!instagram_username) {
      return NextResponse.json({
        success: false,
        error: 'instagram_username es requerido'
      }, { status: 400 });
    }

    // Limpiar username (quitar @)
    const cleanUsername = instagram_username.replace('@', '').trim().toLowerCase();

    // Verificar si ya existe
    const { data: existing } = await supabaseAdmin
      .from('competitors')
      .select('id')
      .eq('instagram_username', cleanUsername)
      .single();

    if (existing) {
      return NextResponse.json({
        success: false,
        error: `El competidor @${cleanUsername} ya existe`
      }, { status: 400 });
    }

    // Insertar nuevo competidor
    const { data, error } = await supabaseAdmin
      .from('competitors')
      .insert({
        instagram_username: cleanUsername,
        display_name: display_name || cleanUsername,
        is_active: true
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data,
      message: `Competidor @${cleanUsername} añadido correctamente`
    });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

/**
 * PATCH /api/competitors
 * Actualiza competidores (activar/desactivar)
 */
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { ids, is_active, action } = body;

    // Acción: activar/desactivar todos
    if (action === 'activate_all') {
      const { error } = await supabaseAdmin
        .from('competitors')
        .update({ is_active: true })
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Truco para actualizar todos

      if (error) throw error;
      return NextResponse.json({ success: true, message: 'Todos los competidores activados' });
    }

    if (action === 'deactivate_all') {
      const { error } = await supabaseAdmin
        .from('competitors')
        .update({ is_active: false })
        .neq('id', '00000000-0000-0000-0000-000000000000');

      if (error) throw error;
      return NextResponse.json({ success: true, message: 'Todos los competidores desactivados' });
    }

    // Actualizar competidores específicos por IDs
    if (ids && Array.isArray(ids)) {
      const { error } = await supabaseAdmin
        .from('competitors')
        .update({ is_active })
        .in('id', ids);

      if (error) throw error;
      return NextResponse.json({
        success: true,
        message: `${ids.length} competidores ${is_active ? 'activados' : 'desactivados'}`
      });
    }

    return NextResponse.json({
      success: false,
      error: 'Se requiere ids[] o action'
    }, { status: 400 });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

/**
 * DELETE /api/competitors
 * Elimina un competidor
 */
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({
        success: false,
        error: 'id es requerido'
      }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('competitors')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: 'Competidor eliminado'
    });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
