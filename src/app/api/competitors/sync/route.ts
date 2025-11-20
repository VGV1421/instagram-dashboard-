import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/simple-client';

/**
 * POST /api/competitors/sync
 *
 * Sincroniza datos públicos de competidores desde Instagram
 * Body (opcional):
 * - competitorId: string (UUID) - Si se proporciona, sincroniza solo ese competidor
 */

const INSTAGRAM_GRAPH_API_URL = 'https://graph.instagram.com';
const INSTAGRAM_ACCESS_TOKEN = process.env.INSTAGRAM_ACCESS_TOKEN;

// Función para obtener datos de un perfil público usando Graph API
async function fetchInstagramProfile(username: string) {
  if (!INSTAGRAM_ACCESS_TOKEN) {
    throw new Error('Instagram Access Token no configurado');
  }

  try {
    // Nota: Graph API requiere el Instagram Business Account ID
    // Para perfiles públicos, usamos scraping básico o API de terceros
    // Por ahora, usamos datos simulados basados en el username

    // En producción, deberías usar:
    // 1. Instagram Basic Display API (requiere autenticación del usuario)
    // 2. Instagram Graph API (solo para cuentas de negocio)
    // 3. Servicio de terceros como RapidAPI Instagram scraper

    console.log(`Fetching data for @${username}...`);

    // Simulación de datos (REEMPLAZAR con API real)
    const mockData = {
      username,
      display_name: username.charAt(0).toUpperCase() + username.slice(1),
      bio: `Bio de @${username}`,
      followers_count: Math.floor(Math.random() * 50000) + 1000,
      following_count: Math.floor(Math.random() * 1000) + 100,
      posts_count: Math.floor(Math.random() * 500) + 50,
      is_verified: Math.random() > 0.8,
      profile_picture_url: `https://via.placeholder.com/150?text=${username}`,
    };

    return mockData;

  } catch (error) {
    console.error(`Error fetching profile for @${username}:`, error);
    throw error;
  }
}

// Función para obtener posts recientes de un perfil
async function fetchInstagramPosts(username: string) {
  try {
    // Simulación de posts (REEMPLAZAR con API real)
    const mockPosts = [];
    const numPosts = Math.floor(Math.random() * 10) + 5;

    for (let i = 0; i < numPosts; i++) {
      const likes = Math.floor(Math.random() * 5000) + 100;
      const comments = Math.floor(Math.random() * 500) + 10;
      const followers = Math.floor(Math.random() * 50000) + 1000;
      const engagement_rate = ((likes + comments) / followers) * 100;

      mockPosts.push({
        instagram_post_id: `${username}_post_${Date.now()}_${i}`,
        caption: `Este es un caption de ejemplo para @${username}. #marketing #digital #instagram #socialmedia`,
        media_type: 'IMAGE',
        media_url: `https://via.placeholder.com/400?text=Post+${i + 1}`,
        permalink: `https://www.instagram.com/p/${Math.random().toString(36).substring(7)}/`,
        timestamp: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(),
        likes,
        comments,
        engagement_rate: parseFloat(engagement_rate.toFixed(2))
      });
    }

    return mockPosts;

  } catch (error) {
    console.error(`Error fetching posts for @${username}:`, error);
    throw error;
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { competitorId } = body || {};

    const supabase = supabaseAdmin;

    // Obtener competidores a sincronizar
    let query = supabase
      .from('competitors')
      .select('*')
      .eq('is_active', true);

    if (competitorId) {
      query = query.eq('id', competitorId);
    }

    const { data: competitors, error: fetchError } = await query;

    if (fetchError) {
      throw fetchError;
    }

    if (!competitors || competitors.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No se encontraron competidores para sincronizar'
      }, { status: 404 });
    }

    const results = [];

    for (const competitor of competitors) {
      try {
        // Obtener datos del perfil
        const profileData = await fetchInstagramProfile(competitor.instagram_username);

        // Actualizar competidor en BD
        const { error: updateError } = await supabase
          .from('competitors')
          .update({
            display_name: profileData.display_name,
            bio: profileData.bio,
            followers_count: profileData.followers_count,
            following_count: profileData.following_count,
            posts_count: profileData.posts_count,
            profile_picture_url: profileData.profile_picture_url,
            is_verified: profileData.is_verified,
            last_synced_at: new Date().toISOString()
          })
          .eq('id', competitor.id);

        if (updateError) {
          console.error('Error updating competitor:', updateError);
          results.push({
            username: competitor.instagram_username,
            success: false,
            error: updateError.message
          });
          continue;
        }

        // Obtener posts recientes
        const posts = await fetchInstagramPosts(competitor.instagram_username);

        // Insertar posts (con upsert para evitar duplicados)
        let insertedPosts = 0;

        for (const post of posts) {
          const { error: postError } = await supabase
            .from('competitor_posts')
            .upsert({
              competitor_id: competitor.id,
              instagram_post_id: post.instagram_post_id,
              caption: post.caption,
              media_type: post.media_type,
              media_url: post.media_url,
              permalink: post.permalink,
              timestamp: post.timestamp,
              likes: post.likes,
              comments: post.comments,
              engagement_rate: post.engagement_rate
            }, {
              onConflict: 'instagram_post_id'
            });

          if (!postError) {
            insertedPosts++;
          }
        }

        results.push({
          username: competitor.instagram_username,
          success: true,
          profile_updated: true,
          posts_synced: insertedPosts
        });

      } catch (error: any) {
        console.error(`Error syncing competitor ${competitor.instagram_username}:`, error);
        results.push({
          username: competitor.instagram_username,
          success: false,
          error: error.message
        });
      }
    }

    const successCount = results.filter(r => r.success).length;

    return NextResponse.json({
      success: true,
      data: {
        total: competitors.length,
        synced: successCount,
        failed: competitors.length - successCount,
        results
      }
    });

  } catch (error: any) {
    console.error('Error in competitor sync:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Error al sincronizar competidores'
    }, { status: 500 });
  }
}
