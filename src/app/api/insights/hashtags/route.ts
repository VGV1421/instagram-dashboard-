import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/simple-client';

/**
 * GET /api/insights/hashtags
 *
 * Analiza hashtags más efectivos basado en posts
 * Query params:
 * - source: 'own' | 'competitors' (default: 'own')
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const source = searchParams.get('source') || 'own';

    const supabase = supabaseAdmin;

    if (source !== 'own') {
      return NextResponse.json({
        success: false,
        error: 'Análisis de competidores no disponible aún'
      }, { status: 400 });
    }

    // Obtener posts con caption y engagement
    const { data: posts, error } = await supabase
      .from('posts')
      .select('caption, engagement_rate, likes, comments, reach')
      .not('caption', 'is', null);

    if (error) throw error;

    if (!posts || posts.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No hay suficientes datos para análisis'
      }, { status: 404 });
    }

    // Analizar hashtags
    const hashtagStats: { [key: string]: {
      count: number;
      totalEngagement: number;
      totalLikes: number;
      totalComments: number;
      totalReach: number;
      posts: any[];
    } } = {};

    posts.forEach(post => {
      const caption = post.caption || '';
      // Extraer hashtags
      const hashtags = caption.match(/#[\w\u00C0-\u017F]+/g) || [];

      hashtags.forEach(hashtag => {
        const cleanTag = hashtag.toLowerCase();
        if (!hashtagStats[cleanTag]) {
          hashtagStats[cleanTag] = {
            count: 0,
            totalEngagement: 0,
            totalLikes: 0,
            totalComments: 0,
            totalReach: 0,
            posts: []
          };
        }
        hashtagStats[cleanTag].count++;
        hashtagStats[cleanTag].totalEngagement += post.engagement_rate || 0;
        hashtagStats[cleanTag].totalLikes += post.likes || 0;
        hashtagStats[cleanTag].totalComments += post.comments || 0;
        hashtagStats[cleanTag].totalReach += post.reach || 0;
        hashtagStats[cleanTag].posts.push({
          caption: post.caption.substring(0, 100),
          engagement: post.engagement_rate
        });
      });
    });

    // Calcular promedios y ordenar
    const hashtagAnalysis = Object.entries(hashtagStats)
      .map(([hashtag, stats]) => ({
        hashtag,
        frequency: stats.count,
        avgEngagement: stats.count > 0 ? stats.totalEngagement / stats.count : 0,
        avgLikes: stats.count > 0 ? Math.round(stats.totalLikes / stats.count) : 0,
        avgComments: stats.count > 0 ? Math.round(stats.totalComments / stats.count) : 0,
        avgReach: stats.count > 0 ? Math.round(stats.totalReach / stats.count) : 0,
        totalEngagement: stats.totalEngagement,
        posts: stats.posts
      }))
      .filter(item => item.frequency >= 1) // Al menos 1 aparición
      .sort((a, b) => b.avgEngagement - a.avgEngagement);

    // Top hashtags por engagement
    const topByEngagement = hashtagAnalysis.slice(0, 30);

    // Top hashtags por frecuencia
    const topByFrequency = [...hashtagAnalysis]
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 30);

    // Análisis de combinaciones (hashtags que aparecen juntos con buen rendimiento)
    const hashtagPairs: { [key: string]: {
      count: number;
      totalEngagement: number;
      hashtags: string[];
    } } = {};

    posts.forEach(post => {
      const caption = post.caption || '';
      const hashtags = (caption.match(/#[\w\u00C0-\u017F]+/g) || []).map(h => h.toLowerCase());

      if (hashtags.length >= 2) {
        for (let i = 0; i < hashtags.length - 1; i++) {
          for (let j = i + 1; j < hashtags.length; j++) {
            const pair = [hashtags[i], hashtags[j]].sort().join(' + ');
            if (!hashtagPairs[pair]) {
              hashtagPairs[pair] = {
                count: 0,
                totalEngagement: 0,
                hashtags: [hashtags[i], hashtags[j]]
              };
            }
            hashtagPairs[pair].count++;
            hashtagPairs[pair].totalEngagement += post.engagement_rate || 0;
          }
        }
      }
    });

    const topCombinations = Object.entries(hashtagPairs)
      .map(([pair, stats]) => ({
        combination: pair,
        hashtags: stats.hashtags,
        frequency: stats.count,
        avgEngagement: stats.count > 0 ? stats.totalEngagement / stats.count : 0
      }))
      .filter(item => item.frequency >= 2)
      .sort((a, b) => b.avgEngagement - a.avgEngagement)
      .slice(0, 10);

    return NextResponse.json({
      success: true,
      data: {
        topByEngagement: topByEngagement.map(h => ({
          hashtag: h.hashtag,
          frequency: h.frequency,
          avgEngagement: parseFloat(h.avgEngagement.toFixed(2)),
          avgLikes: h.avgLikes,
          avgComments: h.avgComments,
          avgReach: h.avgReach
        })),
        topByFrequency: topByFrequency.map(h => ({
          hashtag: h.hashtag,
          frequency: h.frequency,
          avgEngagement: parseFloat(h.avgEngagement.toFixed(2)),
          avgLikes: h.avgLikes,
          avgComments: h.avgComments,
          avgReach: h.avgReach
        })),
        topCombinations: topCombinations.map(c => ({
          hashtags: c.hashtags,
          frequency: c.frequency,
          avgEngagement: parseFloat(c.avgEngagement.toFixed(2))
        })),
        totalHashtags: Object.keys(hashtagStats).length,
        totalPosts: posts.length,
        source: 'own'
      }
    });

  } catch (error: any) {
    console.error('Error in hashtags API:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Error al analizar hashtags'
      },
      { status: 500 }
    );
  }
}
