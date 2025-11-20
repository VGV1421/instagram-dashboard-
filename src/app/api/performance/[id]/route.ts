import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/simple-client';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const { data: post, error } = await supabaseAdmin
      .from('posts')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching post:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 404 });
    }

    if (!post) {
      return NextResponse.json({ success: false, error: 'Post not found' }, { status: 404 });
    }

    // Calcular métricas detalladas
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

    const likeRate = post.impressions > 0
      ? ((post.like_count / post.impressions) * 100).toFixed(2)
      : '0.00';

    const commentRate = post.impressions > 0
      ? ((post.comments_count / post.impressions) * 100).toFixed(2)
      : '0.00';

    // Obtener el promedio de la cuenta para comparación
    const { data: allPosts } = await supabaseAdmin
      .from('posts')
      .select('like_count, comments_count, impressions, reach, saved, shares');

    let avgMetrics = {
      engagementRate: 0,
      reachRate: 0,
      saveRate: 0,
      shareRate: 0,
    };

    if (allPosts && allPosts.length > 0) {
      const validPosts = allPosts.filter(p => p.impressions > 0);
      if (validPosts.length > 0) {
        avgMetrics.engagementRate = validPosts.reduce((sum, p) => {
          const eng = ((p.like_count + p.comments_count) / p.impressions) * 100;
          return sum + eng;
        }, 0) / validPosts.length;

        avgMetrics.reachRate = validPosts.reduce((sum, p) => {
          const r = ((p.reach || 0) / p.impressions) * 100;
          return sum + r;
        }, 0) / validPosts.length;

        avgMetrics.saveRate = validPosts.reduce((sum, p) => {
          const s = (p.saved / p.impressions) * 100;
          return sum + s;
        }, 0) / validPosts.length;

        avgMetrics.shareRate = validPosts.reduce((sum, p) => {
          const sh = ((p.shares || 0) / p.impressions) * 100;
          return sum + sh;
        }, 0) / validPosts.length;
      }
    }

    // Calcular comparación con promedio (porcentaje de diferencia)
    const comparison = {
      engagement: calculateDifference(parseFloat(engagementRate), avgMetrics.engagementRate),
      reach: calculateDifference(parseFloat(reachRate), avgMetrics.reachRate),
      save: calculateDifference(parseFloat(saveRate), avgMetrics.saveRate),
      share: calculateDifference(parseFloat(shareRate), avgMetrics.shareRate),
    };

    const postWithDetails = {
      ...post,
      metrics: {
        engagement,
        engagementRate: parseFloat(engagementRate),
        reach,
        reachRate: parseFloat(reachRate),
        saveRate: parseFloat(saveRate),
        shareRate: parseFloat(shareRate),
        likeRate: parseFloat(likeRate),
        commentRate: parseFloat(commentRate),
      },
      avgMetrics: {
        engagementRate: parseFloat(avgMetrics.engagementRate.toFixed(2)),
        reachRate: parseFloat(avgMetrics.reachRate.toFixed(2)),
        saveRate: parseFloat(avgMetrics.saveRate.toFixed(2)),
        shareRate: parseFloat(avgMetrics.shareRate.toFixed(2)),
      },
      comparison,
    };

    return NextResponse.json({
      success: true,
      data: postWithDetails,
    });
  } catch (error: any) {
    console.error('Error in performance detail API:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

function calculateDifference(current: number, average: number): number {
  if (average === 0) return 0;
  return parseFloat((((current - average) / average) * 100).toFixed(1));
}
