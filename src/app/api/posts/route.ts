import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/simple-client';

export async function GET() {
  try {
    const supabase = supabaseAdmin;

    // Obtener todos los posts ordenados por fecha
    const { data: posts, error } = await supabase
      .from('posts')
      .select('*')
      .order('timestamp', { ascending: false });

    if (error) {
      console.error('Error fetching posts:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      posts: posts || [],
      count: posts?.length || 0,
    });
  } catch (error: any) {
    console.error('Error in posts API:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
