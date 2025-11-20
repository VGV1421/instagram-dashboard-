import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/simple-client';

export async function GET() {
  try {
    const supabase = supabaseAdmin;

    // Obtener posts de los últimos 30 días
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: posts, error } = await supabase
      .from('posts')
      .select('likes, comments, timestamp, reach')
      .gte('timestamp', thirtyDaysAgo.toISOString())
      .order('timestamp', { ascending: false });

    if (error) {
      console.error('Error fetching posts for quick stats:', error);
      throw error;
    }

    // Calcular engagement promedio
    let totalEngagement = 0;
    let validPosts = 0;

    posts?.forEach((post) => {
      const reach = post.reach || 0;
      if (reach > 0) {
        const engagement = ((post.likes + post.comments) / reach) * 100;
        totalEngagement += engagement;
        validPosts++;
      }
    });

    const avgEngagement = validPosts > 0 ? (totalEngagement / validPosts).toFixed(1) : '0.0';

    // Contar posts de hoy
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const postsToday = posts?.filter((post) => {
      const postDate = new Date(post.timestamp);
      return postDate >= today;
    }).length || 0;

    return NextResponse.json({
      success: true,
      data: {
        engagement: avgEngagement,
        postsToday: postsToday,
      },
    });
  } catch (error: any) {
    console.error('Error in quick-stats API:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Error al obtener estadísticas rápidas',
      },
      { status: 500 }
    );
  }
}
