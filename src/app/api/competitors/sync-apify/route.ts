import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/simple-client';

/**
 * POST /api/competitors/sync-apify
 *
 * Sincroniza un competidor usando Apify Instagram Post Scraper
 * Body: { competitorId: string }
 */

const APIFY_API_TOKEN = process.env.APIFY_API_TOKEN;
const APIFY_ACTOR_ID = 'apify~instagram-post-scraper';

interface ApifyPost {
  id: string;
  type: string;
  caption: string;
  hashtags: string[];
  url: string;
  commentsCount: number;
  likesCount: number;
  timestamp: string;
  displayUrl: string;
  ownerUsername: string;
  ownerId: string;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { competitorId, limit = 5 } = body; // limit configurable, default 5

    if (!competitorId) {
      return NextResponse.json({
        success: false,
        error: 'Se requiere competitorId'
      }, { status: 400 });
    }

    if (!APIFY_API_TOKEN || APIFY_API_TOKEN === 'your_apify_token_here') {
      return NextResponse.json({
        success: false,
        error: 'APIFY_API_TOKEN no configurado. Por favor configura tu token de Apify en .env.local'
      }, { status: 500 });
    }

    const supabase = supabaseAdmin;

    // 1. Obtener competidor
    const { data: competitor, error: compError } = await supabase
      .from('competitors')
      .select('*')
      .eq('id', competitorId)
      .single();

    if (compError || !competitor) {
      return NextResponse.json({
        success: false,
        error: 'Competidor no encontrado'
      }, { status: 404 });
    }

    const username = competitor.instagram_username;
    console.log(`🔄 Sincronizando @${username} con Apify...`);

    // 2. Llamar a Apify API - Run synchronously and get results
    const apifyUrl = `https://api.apify.com/v2/acts/${APIFY_ACTOR_ID}/run-sync-get-dataset-items?token=${APIFY_API_TOKEN}`;

    const apifyInput = {
      username: [username],
      resultsLimit: limit // Configurable via parámetro
    };

    console.log(`   Solicitando ${limit} posts...`);

    console.log('📤 Enviando request a Apify...');

    const apifyResponse = await fetch(apifyUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(apifyInput)
    });

    if (!apifyResponse.ok) {
      const errorText = await apifyResponse.text();
      console.error('❌ Error de Apify:', errorText);

      return NextResponse.json({
        success: false,
        error: `Error de Apify: ${apifyResponse.status} - ${errorText}`
      }, { status: apifyResponse.status });
    }

    const apifyData: ApifyPost[] = await apifyResponse.json();
    console.log(`✅ Apify retornó ${apifyData.length} posts`);

    if (!apifyData || apifyData.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No se encontraron posts para este usuario'
      }, { status: 404 });
    }

    // 3. Actualizar datos del competidor
    const firstPost = apifyData[0];
    const { error: updateError } = await supabase
      .from('competitors')
      .update({
        display_name: firstPost.ownerUsername || username,
        last_synced_at: new Date().toISOString()
      })
      .eq('id', competitorId);

    if (updateError) {
      console.error('⚠️ Error actualizando competidor:', updateError);
    }

    // 4. Guardar posts en la base de datos
    let savedCount = 0;
    let skippedCount = 0;

    for (const post of apifyData) {
      try {
        // Verificar si el post ya existe
        const { data: existing } = await supabase
          .from('competitor_posts')
          .select('id')
          .eq('instagram_post_id', post.id)
          .single();

        if (existing) {
          skippedCount++;
          continue;
        }

        // Calcular engagement rate (necesitamos followers count del perfil)
        const engagementRate = 0; // Lo calculamos después cuando tengamos followers

        // Insertar nuevo post
        const { error: insertError } = await supabase
          .from('competitor_posts')
          .insert({
            competitor_id: competitorId,
            instagram_post_id: post.id,
            caption: post.caption || '',
            media_type: normalizeMediaType(post.type),
            media_url: post.displayUrl || '',
            permalink: post.url || '',
            timestamp: post.timestamp || new Date().toISOString(),
            likes: post.likesCount || 0,
            comments: post.commentsCount || 0,
            engagement_rate: engagementRate
          });

        if (insertError) {
          console.error('⚠️ Error insertando post:', insertError);
          continue;
        }

        savedCount++;
      } catch (error: any) {
        console.error('⚠️ Error procesando post:', error.message);
      }
    }

    console.log(`✅ Posts guardados: ${savedCount}, omitidos: ${skippedCount}`);

    return NextResponse.json({
      success: true,
      data: {
        competitor: {
          id: competitor.id,
          username: competitor.instagram_username
        },
        posts: {
          total: apifyData.length,
          saved: savedCount,
          skipped: skippedCount
        }
      }
    });

  } catch (error: any) {
    console.error('❌ Error en sync-apify:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Error al sincronizar con Apify'
    }, { status: 500 });
  }
}

// Función helper para normalizar media type
function normalizeMediaType(type: string): string {
  const typeStr = String(type).toUpperCase();

  if (typeStr.includes('VIDEO') || typeStr === 'VIDEO') return 'VIDEO';
  if (typeStr.includes('SIDECAR') || typeStr.includes('CAROUSEL')) return 'CAROUSEL_ALBUM';
  if (typeStr.includes('REEL')) return 'VIDEO'; // Reels son videos

  return 'IMAGE';
}
