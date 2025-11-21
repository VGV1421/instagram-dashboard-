import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/simple-client';

/**
 * GET /api/competitors/posts
 *
 * Obtiene todos los posts de competidores con información del competidor
 */

export async function GET() {
  try {
    const supabase = supabaseAdmin;

    // Primero obtener los IDs de competidores activos
    const { data: activeCompetitors, error: competitorError } = await supabase
      .from('competitors')
      .select('id')
      .eq('is_active', true);

    if (competitorError) {
      console.error('Error fetching active competitors:', competitorError);
      throw competitorError;
    }

    const activeCompetitorIds = activeCompetitors?.map(c => c.id) || [];

    // Si no hay competidores activos, retornar array vacío
    if (activeCompetitorIds.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          posts: [],
          total: 0
        }
      });
    }

    // Obtener posts solo de competidores activos
    const { data: posts, error } = await supabase
      .from('competitor_posts')
      .select(`
        *,
        competitors:competitor_id (
          id,
          instagram_username,
          display_name,
          is_active
        )
      `)
      .in('competitor_id', activeCompetitorIds)
      .order('timestamp', { ascending: false })
      .limit(100);

    if (error) {
      console.error('Error fetching competitor posts:', error);
      throw error;
    }

    // Formatear datos para el frontend
    const formattedPosts = posts?.map(post => ({
      id: post.id,
      competitor_id: post.competitor_id,
      competitor_username: (post.competitors as any)?.instagram_username || 'unknown',
      competitor_display_name: (post.competitors as any)?.display_name || null,
      instagram_post_id: post.instagram_post_id,
      caption: post.caption,
      media_type: post.media_type,
      media_url: post.media_url,
      permalink: post.permalink,
      timestamp: post.timestamp,
      likes: post.likes || 0,
      comments: post.comments || 0,
      engagement_rate: post.engagement_rate || 0
    })) || [];

    return NextResponse.json({
      success: true,
      data: {
        posts: formattedPosts,
        total: formattedPosts.length
      }
    });

  } catch (error: any) {
    console.error('Error in competitor posts:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Error al obtener posts de competidores'
    }, { status: 500 });
  }
}
