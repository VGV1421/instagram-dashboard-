import { NextResponse } from 'next/server';

/**
 * GET /api/analytics/performance
 *
 * Compara rendimiento de posts generados automáticamente vs manuales
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '30');
    const { supabaseAdmin } = await import('@/lib/supabase/simple-client');

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Obtener posts del período
    const { data: posts, error } = await supabaseAdmin
      .from('posts')
      .select('*')
      .gte('timestamp', startDate.toISOString())
      .order('timestamp', { ascending: false });

    if (error) throw error;

    // Clasificar posts
    const aiGenerated = posts?.filter(p => p.is_ai_generated) || [];
    const manual = posts?.filter(p => !p.is_ai_generated) || [];

    // Calcular métricas para cada tipo
    const calculateMetrics = (postList: any[]) => {
      if (postList.length === 0) return null;

      const totalLikes = postList.reduce((sum, p) => sum + (p.like_count || 0), 0);
      const totalComments = postList.reduce((sum, p) => sum + (p.comments_count || 0), 0);
      const totalEngagement = totalLikes + totalComments;

      return {
        count: postList.length,
        totalLikes,
        totalComments,
        totalEngagement,
        avgLikes: Math.round(totalLikes / postList.length),
        avgComments: Math.round((totalComments / postList.length) * 10) / 10,
        avgEngagement: Math.round(totalEngagement / postList.length),
        bestPost: postList
          .map(p => ({
            caption: (p.caption || '').substring(0, 60) + '...',
            engagement: (p.like_count || 0) + (p.comments_count || 0),
            timestamp: p.timestamp
          }))
          .sort((a, b) => b.engagement - a.engagement)[0]
      };
    };

    const aiMetrics = calculateMetrics(aiGenerated);
    const manualMetrics = calculateMetrics(manual);

    // Comparación
    let comparison = null;
    if (aiMetrics && manualMetrics) {
      comparison = {
        engagementDiff: aiMetrics.avgEngagement - manualMetrics.avgEngagement,
        engagementDiffPercent: manualMetrics.avgEngagement > 0
          ? Math.round(((aiMetrics.avgEngagement - manualMetrics.avgEngagement) / manualMetrics.avgEngagement) * 100)
          : 0,
        winner: aiMetrics.avgEngagement > manualMetrics.avgEngagement ? 'AI' : 'Manual'
      };
    }

    // Tendencia temporal (últimos 7 días)
    const last7Days = posts?.filter(p => {
      const postDate = new Date(p.timestamp);
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      return postDate >= sevenDaysAgo;
    }) || [];

    const dailyPerformance = last7Days.reduce((acc, post) => {
      const day = new Date(post.timestamp).toISOString().split('T')[0];
      if (!acc[day]) {
        acc[day] = { date: day, ai: 0, manual: 0 };
      }
      const engagement = (post.like_count || 0) + (post.comments_count || 0);
      if (post.is_ai_generated) {
        acc[day].ai += engagement;
      } else {
        acc[day].manual += engagement;
      }
      return acc;
    }, {} as Record<string, any>);

    const trend = Object.values(dailyPerformance)
      .sort((a: any, b: any) => a.date.localeCompare(b.date));

    return NextResponse.json({
      ai: aiMetrics,
      manual: manualMetrics,
      comparison,
      trend,
      period: `${days} days`
    });

  } catch (error: any) {
    console.error('Error getting performance analytics:', error);
    return NextResponse.json(
      { error: 'Failed to get performance analytics', details: error.message },
      { status: 500 }
    );
  }
}
