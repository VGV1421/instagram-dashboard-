import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/simple-client';

/**
 * DELETE /api/posts/cleanup-demo
 *
 * Elimina los posts de demostración (IDs: "1", "2", "3")
 * para mostrar solo los posts reales sincronizados desde Instagram
 */
export async function DELETE() {
  try {
    const supabase = supabaseAdmin;

    // Eliminar posts demo con instagram_post_id en ["1", "2", "3"]
    const { data, error } = await supabase
      .from('posts')
      .delete()
      .in('instagram_post_id', ['1', '2', '3'])
      .select();

    if (error) {
      console.error('Error eliminando posts demo:', error);
      throw error;
    }

    return NextResponse.json({
      success: true,
      message: `${data?.length || 0} posts demo eliminados correctamente`,
      deleted: data?.length || 0
    });
  } catch (error: any) {
    console.error('Error en cleanup-demo:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Error al eliminar posts demo'
      },
      { status: 500 }
    );
  }
}
