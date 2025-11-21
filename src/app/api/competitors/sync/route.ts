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

// Función para obtener datos REALES de un perfil público usando RapidAPI
async function fetchInstagramProfile(username: string) {
  const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;
  const RAPIDAPI_HOST = process.env.RAPIDAPI_INSTAGRAM_HOST || 'instagram-scraper-20251.p.rapidapi.com';

  try {
    console.log(`Fetching REAL data for @${username}...`);

    if (!RAPIDAPI_KEY) {
      throw new Error('RAPIDAPI_KEY no configurado en las variables de entorno');
    }

    // Usar el endpoint correcto: /userinfo/
    const response = await fetch(`https://${RAPIDAPI_HOST}/userinfo/?username_or_id_url=${username}`, {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': RAPIDAPI_KEY,
        'X-RapidAPI-Host': RAPIDAPI_HOST
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ RapidAPI error for @${username}:`, {
        status: response.status,
        statusText: response.statusText,
        body: errorText,
        url: response.url
      });

      if (response.status === 429) {
        throw new Error(`Límite de API alcanzado. Espera unos minutos antes de sincronizar más competidores.`);
      }

      if (response.status === 404) {
        throw new Error(`Usuario @${username} no encontrado en Instagram`);
      }

      if (response.status === 403) {
        throw new Error(`API key inválida o sin permisos`);
      }

      throw new Error(`Error ${response.status}: ${errorText || response.statusText}`);
    }

    const data = await response.json();
    console.log(`📦 Estructura de respuesta para @${username}:`, JSON.stringify(data).substring(0, 200));

    // Extraer datos del response
    const userData = data.data || data;

    const profileData = {
      username: userData.username || username,
      display_name: userData.full_name || userData.name || userData.display_name || username,
      bio: userData.biography || userData.bio || userData.description || '',
      followers_count: userData.follower_count || userData.followers_count || userData.edge_followed_by?.count || 0,
      following_count: userData.following_count || userData.follows_count || userData.edge_follow?.count || 0,
      posts_count: userData.media_count || userData.posts_count || userData.edge_owner_to_timeline_media?.count || 0,
      is_verified: userData.is_verified || userData.verified || false,
      profile_picture_url: userData.profile_pic_url || userData.profile_pic_url_hd || userData.profile_picture || `https://via.placeholder.com/150?text=${username}`,
    };

    console.log(`✅ Datos obtenidos para @${username}: ${profileData.followers_count.toLocaleString()} seguidores`);
    return profileData;

  } catch (error: any) {
    console.error(`❌ Error completo para @${username}:`, error);
    throw error; // Re-throw para que el error se propague
  }
}

// Función para obtener posts recientes de un perfil usando RapidAPI
async function fetchInstagramPosts(username: string, followerCount: number = 1000) {
  const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;
  const RAPIDAPI_HOST = process.env.RAPIDAPI_INSTAGRAM_HOST || 'instagram-scraper-20251.p.rapidapi.com';

  try {
    console.log(`Fetching REAL posts for @${username}...`);

    if (!RAPIDAPI_KEY) {
      console.warn('⚠️ RAPIDAPI_KEY no configurado');
      return [];
    }

    // Usar el endpoint correcto: /userposts/
    const response = await fetch(`https://${RAPIDAPI_HOST}/userposts/?username_or_id_url=${username}`, {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': RAPIDAPI_KEY,
        'X-RapidAPI-Host': RAPIDAPI_HOST
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ RapidAPI posts error for @${username}:`, response.status, errorText);
      // Si falla, retornar array vacío en lugar de tirar error
      console.warn(`No se pudieron obtener posts para @${username}, continuando sin posts`);
      return [];
    }

    const data = await response.json();
    console.log(`📦 Posts response estructura para @${username}:`, JSON.stringify(data).substring(0, 200));

    // Extraer posts del response
    const postsData = data.data?.items || data.data || data.items || [];

    if (!postsData || postsData.length === 0) {
      console.warn(`⚠️ No posts found for @${username}`);
      return [];
    }

    // Tomar los últimos 12 posts
    const recentPosts = postsData.slice(0, 12);

    const formattedPosts = recentPosts.map((post: any) => {
      const likes = post.like_count || post.likes || post.edge_media_preview_like?.count || 0;
      const comments = post.comment_count || post.comments || post.edge_media_to_comment?.count || 0;
      const engagement_rate = followerCount > 0
        ? parseFloat((((likes + comments) / followerCount) * 100).toFixed(2))
        : 0;

      return {
        instagram_post_id: post.id || post.pk || post.code || `${username}_${Date.now()}_${Math.random()}`,
        caption: post.caption?.text || post.caption || post.edge_media_to_caption?.edges?.[0]?.node?.text || '',
        media_type: post.media_type || (post.is_video || post.product_type === 'clips' ? 'VIDEO' : 'IMAGE'),
        media_url: post.thumbnail_url || post.display_url || post.image_versions2?.candidates?.[0]?.url || post.thumbnail_src || '',
        permalink: post.permalink || `https://www.instagram.com/p/${post.code || post.shortcode}/`,
        timestamp: post.taken_at ? new Date(post.taken_at * 1000).toISOString() : (post.timestamp || post.taken_at_timestamp ? new Date(post.taken_at_timestamp * 1000).toISOString() : new Date().toISOString()),
        likes,
        comments,
        engagement_rate
      };
    });

    console.log(`✅ ${formattedPosts.length} posts obtenidos para @${username}`);
    return formattedPosts;

  } catch (error: any) {
    console.error(`❌ Error fetching posts for @${username}:`, error.message);
    // Retornar array vacío en lugar de tirar error para no bloquear la sincronización
    return [];
  }
}

export async function POST(request: Request) {
  try {
    let body = {};
    try {
      const text = await request.text();
      if (text) {
        body = JSON.parse(text);
      }
    } catch (e) {
      // Body vacío o inválido, usar objeto vacío
      body = {};
    }
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

        // Obtener posts recientes (pasamos el follower count para calcular engagement correcto)
        const posts = await fetchInstagramPosts(competitor.instagram_username, profileData.followers_count);

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
