import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/simple-client';

export async function GET() {
  try {
    const supabase = supabaseAdmin;

    // Obtener posts ordenados por fecha
    const { data: posts, error: postsError } = await supabase
      .from('posts')
      .select('*')
      .order('timestamp', { ascending: true })
      .limit(30);

    if (postsError) {
      console.error('Error fetching posts:', postsError);
      return NextResponse.json({ error: postsError.message }, { status: 500 });
    }

    // Obtener estadísticas de cuenta
    const { data: stats, error: statsError } = await supabase
      .from('account_stats')
      .select('*')
      .order('calculated_at', { ascending: false })
      .limit(30);

    if (statsError) {
      console.error('Error fetching stats:', statsError);
    }

    // Calcular métricas agregadas
    const totalPosts = posts?.length || 0;
    const totalLikes = posts?.reduce((sum, post) => sum + (post.likes || 0), 0) || 0;
    const totalComments = posts?.reduce((sum, post) => sum + (post.comments || 0), 0) || 0;
    const avgEngagement = posts && posts.length > 0
      ? posts.reduce((sum, post) => sum + (post.engagement_rate || 0), 0) / posts.length
      : 0;

    // Agrupar por tipo de contenido
    const byMediaType = posts?.reduce((acc: any, post) => {
      const type = post.media_type || 'UNKNOWN';
      if (!acc[type]) {
        acc[type] = {
          count: 0,
          totalEngagement: 0,
          totalReach: 0,
          totalLikes: 0,
        };
      }
      acc[type].count++;
      acc[type].totalEngagement += post.engagement_rate || 0;
      acc[type].totalReach += post.reach || 0;
      acc[type].totalLikes += post.likes || 0;
      return acc;
    }, {});

    // Calcular promedios por tipo
    const mediaTypeStats = Object.entries(byMediaType || {}).map(([type, data]: [string, any]) => ({
      type,
      count: data.count,
      avgEngagement: data.totalEngagement / data.count,
      avgReach: Math.round(data.totalReach / data.count),
      avgLikes: Math.round(data.totalLikes / data.count),
    }));

    // Preparar datos para gráficos temporales
    const timelineData = posts?.map(post => ({
      date: new Date(post.timestamp).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' }),
      engagement: parseFloat(post.engagement_rate) || 0,
      reach: post.reach || 0,
      likes: post.likes || 0,
      comments: post.comments || 0,
      mediaType: post.media_type,
    })) || [];

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          totalPosts,
          totalLikes,
          totalComments,
          avgEngagement: parseFloat(avgEngagement.toFixed(2)),
        },
        timeline: timelineData,
        byMediaType: mediaTypeStats,
        recentStats: stats || [],
      },
    });
  } catch (error: any) {
    console.error('Error in trends API:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
