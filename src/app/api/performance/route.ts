import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/simple-client';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sortBy = searchParams.get('sortBy') || 'timestamp';
    const order = searchParams.get('order') || 'desc';
    const mediaType = searchParams.get('mediaType');
    const limit = parseInt(searchParams.get('limit') || '50');

    // Construir query base
    let query = supabaseAdmin
      .from('posts')
      .select('*')
      .order(sortBy, { ascending: order === 'asc' })
      .limit(limit);

    // Filtrar por tipo de media si se especifica
    if (mediaType && mediaType !== 'all') {
      query = query.eq('media_type', mediaType.toUpperCase());
    }

    const { data: posts, error } = await query;

    if (error) {
      console.error('Error fetching posts:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    // Calcular métricas adicionales para cada post
    const postsWithMetrics = posts?.map(post => {
      const engagement = post.like_count + post.comments_count;
      const engagementRate = post.impressions > 0
        ? ((engagement / post.impressions) * 100).toFixed(2)
        : '0.00';

      const reach = post.reach || 0;
      const reachRate = post.impressions > 0
        ? ((reach / post.impressions) * 100).toFixed(2)
        : '0.00';

      const saveRate = post.impressions > 0
        ? ((post.saved / post.impressions) * 100).toFixed(2)
        : '0.00';

      const shareRate = post.impressions > 0
        ? ((post.shares || 0) / post.impressions * 100).toFixed(2)
        : '0.00';

      // Calcular score de rendimiento (0-100)
      const performanceScore = calculatePerformanceScore({
        engagementRate: parseFloat(engagementRate),
        reachRate: parseFloat(reachRate),
        saveRate: parseFloat(saveRate),
        shareRate: parseFloat(shareRate),
      });

      return {
        ...post,
        metrics: {
          engagement,
          engagementRate: parseFloat(engagementRate),
          reach,
          reachRate: parseFloat(reachRate),
          saveRate: parseFloat(saveRate),
          shareRate: parseFloat(shareRate),
          performanceScore,
        },
      };
    }) || [];

    // Calcular estadísticas generales
    const stats = calculateStats(postsWithMetrics);

    return NextResponse.json({
      success: true,
      data: {
        posts: postsWithMetrics,
        stats,
        total: postsWithMetrics.length,
      },
    });
  } catch (error: any) {
    console.error('Error in performance API:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

function calculatePerformanceScore(metrics: {
  engagementRate: number;
  reachRate: number;
  saveRate: number;
  shareRate: number;
}) {
  // Pesos para cada métrica
  const weights = {
    engagement: 0.4,
    reach: 0.3,
    save: 0.2,
    share: 0.1,
  };

  // Normalizar cada métrica (asumiendo que 10% es excelente para engagement, etc.)
  const normalizedEngagement = Math.min((metrics.engagementRate / 10) * 100, 100);
  const normalizedReach = Math.min((metrics.reachRate / 80) * 100, 100);
  const normalizedSave = Math.min((metrics.saveRate / 5) * 100, 100);
  const normalizedShare = Math.min((metrics.shareRate / 2) * 100, 100);

  const score =
    normalizedEngagement * weights.engagement +
    normalizedReach * weights.reach +
    normalizedSave * weights.save +
    normalizedShare * weights.share;

  return Math.round(score);
}

function calculateStats(posts: any[]) {
  if (posts.length === 0) {
    return {
      avgEngagementRate: 0,
      avgReachRate: 0,
      avgSaveRate: 0,
      avgPerformanceScore: 0,
      topPerformingType: 'N/A',
      totalEngagement: 0,
    };
  }

  const totalEngagementRate = posts.reduce((sum, post) => sum + post.metrics.engagementRate, 0);
  const totalReachRate = posts.reduce((sum, post) => sum + post.metrics.reachRate, 0);
  const totalSaveRate = posts.reduce((sum, post) => sum + post.metrics.saveRate, 0);
  const totalPerformanceScore = posts.reduce((sum, post) => sum + post.metrics.performanceScore, 0);
  const totalEngagement = posts.reduce((sum, post) => sum + post.metrics.engagement, 0);

  // Encontrar el tipo de media con mejor rendimiento
  const typeStats = posts.reduce((acc, post) => {
    const type = post.media_type;
    if (!acc[type]) {
      acc[type] = { count: 0, totalScore: 0 };
    }
    acc[type].count++;
    acc[type].totalScore += post.metrics.performanceScore;
    return acc;
  }, {} as Record<string, { count: number; totalScore: number }>);

  let topType = 'N/A';
  let topAvgScore = 0;

  Object.entries(typeStats).forEach(([type, stats]) => {
    const avgScore = stats.totalScore / stats.count;
    if (avgScore > topAvgScore) {
      topAvgScore = avgScore;
      topType = type;
    }
  });

  return {
    avgEngagementRate: parseFloat((totalEngagementRate / posts.length).toFixed(2)),
    avgReachRate: parseFloat((totalReachRate / posts.length).toFixed(2)),
    avgSaveRate: parseFloat((totalSaveRate / posts.length).toFixed(2)),
    avgPerformanceScore: Math.round(totalPerformanceScore / posts.length),
    topPerformingType: topType,
    totalEngagement,
  };
}
