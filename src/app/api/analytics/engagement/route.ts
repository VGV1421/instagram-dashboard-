import { NextResponse } from 'next/server';

/**
 * GET /api/analytics/engagement
 *
 * Obtiene métricas de engagement de posts
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '30');
    const { supabaseAdmin } = await import('@/lib/supabase/simple-client');

    // Calcular fecha de inicio
    const startDate = new Date();
    startDate.setDate(startDate.setDate() - days);

    // Obtener posts del período
    const { data: posts, error } = await supabaseAdmin
      .from('posts')
      .select('*')
      .gte('timestamp', startDate.toISOString())
      .order('timestamp', { ascending: false });

    if (error) throw error;

    // Calcular métricas
    const metrics = {
      totalPosts: posts?.length || 0,
      totalLikes: posts?.reduce((sum, p) => sum + (p.like_count || 0), 0) || 0,
      totalComments: posts?.reduce((sum, p) => sum + (p.comments_count || 0), 0) || 0,
      avgEngagement: 0,
      topPosts: [],
      engagementByDay: [],
      engagementRate: 0
    };

    if (posts && posts.length > 0) {
      // Calcular engagement promedio
      const totalEngagement = posts.reduce((sum, p) =>
        sum + (p.like_count || 0) + (p.comments_count || 0), 0
      );
      metrics.avgEngagement = Math.round(totalEngagement / posts.length);

      // Top 10 posts por engagement
      metrics.topPosts = posts
        .map(p => ({
          id: p.id,
          caption: (p.caption || '').substring(0, 100),
          likes: p.like_count || 0,
          comments: p.comments_count || 0,
          engagement: (p.like_count || 0) + (p.comments_count || 0),
          timestamp: p.timestamp,
          media_url: p.media_url
        }))
        .sort((a, b) => b.engagement - a.engagement)
        .slice(0, 10);

      // Engagement por día
      const postsByDay = posts.reduce((acc, post) => {
        const day = new Date(post.timestamp).toISOString().split('T')[0];
        if (!acc[day]) {
          acc[day] = { date: day, likes: 0, comments: 0, posts: 0 };
        }
        acc[day].likes += post.like_count || 0;
        acc[day].comments += post.comments_count || 0;
        acc[day].posts += 1;
        return acc;
      }, {} as Record<string, any>);

      metrics.engagementByDay = Object.values(postsByDay)
        .sort((a: any, b: any) => a.date.localeCompare(b.date));

      // Engagement rate (engagement / posts)
      metrics.engagementRate = metrics.totalPosts > 0
        ? Math.round(((metrics.totalLikes + metrics.totalComments) / metrics.totalPosts) * 100) / 100
        : 0;
    }

    return NextResponse.json(metrics);

  } catch (error: any) {
    console.error('Error getting engagement metrics:', error);
    return NextResponse.json(
      { error: 'Failed to get engagement metrics', details: error.message },
      { status: 500 }
    );
  }
}
