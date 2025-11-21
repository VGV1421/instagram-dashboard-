import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/simple-client';

/**
 * GET /api/competitors/analytics
 *
 * Calcula métricas avanzadas de competidores activos:
 * - Growth Rate
 * - Posting Frequency
 * - Engagement Rate
 * - Best Time to Post
 * - Content Mix
 * - Top Hashtags
 * - Average Likes/Comments
 * - Content Themes
 */

interface CompetitorMetrics {
  competitor_id: string;
  competitor_username: string;
  growth_rate: number;
  posting_frequency: number;
  avg_engagement_rate: number;
  best_time_to_post: string;
  content_mix: {
    reels: number;
    posts: number;
    carousels: number;
    videos: number;
  };
  top_hashtags: Array<{ hashtag: string; count: number }>;
  avg_likes: number;
  avg_comments: number;
  content_themes: string[];
  total_posts: number;
}

// Función para extraer hashtags de un caption
function extractHashtags(caption: string): string[] {
  if (!caption) return [];
  const hashtagRegex = /#[\wáéíóúñÁÉÍÓÚÑ]+/g;
  const matches = caption.match(hashtagRegex);
  return matches ? matches.map(tag => tag.toLowerCase()) : [];
}

// Función para detectar media type
function normalizeMediaType(type: string): string {
  const typeStr = String(type).toUpperCase();
  if (typeStr.includes('REEL') || typeStr === 'REELS') return 'REELS';
  if (typeStr.includes('CAROUSEL') || typeStr === '8') return 'CAROUSEL';
  if (typeStr.includes('VIDEO') || typeStr === '2') return 'VIDEO';
  return 'IMAGE';
}

// Función para detectar hora óptima de publicación
function getBestTimeToPost(posts: any[]): string {
  // Agrupar posts por hora y calcular engagement promedio
  const hourlyEngagement: { [hour: number]: { total: number; count: number } } = {};

  posts.forEach(post => {
    if (!post.timestamp || !post.engagement_rate) return;

    const date = new Date(post.timestamp);
    const hour = date.getHours();

    if (!hourlyEngagement[hour]) {
      hourlyEngagement[hour] = { total: 0, count: 0 };
    }

    hourlyEngagement[hour].total += post.engagement_rate;
    hourlyEngagement[hour].count += 1;
  });

  // Encontrar la hora con mayor engagement promedio
  let bestHour = 0;
  let maxAvgEngagement = 0;

  Object.entries(hourlyEngagement).forEach(([hour, data]) => {
    const avgEngagement = data.total / data.count;
    if (avgEngagement > maxAvgEngagement) {
      maxAvgEngagement = avgEngagement;
      bestHour = parseInt(hour);
    }
  });

  return `${bestHour}:00 - ${bestHour + 1}:00`;
}

// Función para detectar temas de contenido basados en keywords
function extractContentThemes(captions: string[]): string[] {
  const themes: { [theme: string]: number } = {};

  // Keywords comunes por tema
  const themeKeywords = {
    'IA & Tecnología': ['ia', 'inteligencia artificial', 'ai', 'tecnología', 'digital', 'gemela', 'nano', 'flux'],
    'Marketing Digital': ['marketing', 'vender', 'ventas', 'clientes', 'negocio', 'estrategia', 'contenido'],
    'Emprendimiento': ['emprender', 'emprendedor', 'negocio', 'ingresos', 'monetizar', 'ganar'],
    'Redes Sociales': ['instagram', 'reels', 'tiktok', 'facebook', 'social media', 'algoritmo'],
    'Educación': ['curso', 'aprender', 'guía', 'tutorial', 'enseñar', 'formación'],
    'Productos Digitales': ['infoproducto', 'ebook', 'pdf', 'plantilla', 'digital', 'descarga'],
  };

  const allCaptions = captions.join(' ').toLowerCase();

  Object.entries(themeKeywords).forEach(([theme, keywords]) => {
    keywords.forEach(keyword => {
      const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
      const matches = allCaptions.match(regex);
      if (matches) {
        themes[theme] = (themes[theme] || 0) + matches.length;
      }
    });
  });

  // Ordenar por frecuencia y tomar top 3
  return Object.entries(themes)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([theme]) => theme);
}

export async function GET() {
  try {
    const supabase = supabaseAdmin;

    // Obtener competidores activos
    const { data: activeCompetitors, error: competitorError } = await supabase
      .from('competitors')
      .select('id, instagram_username, followers_count, last_synced_at, created_at')
      .eq('is_active', true);

    if (competitorError) {
      throw competitorError;
    }

    if (!activeCompetitors || activeCompetitors.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          metrics: [],
          message: 'No hay competidores activos'
        }
      });
    }

    const metrics: CompetitorMetrics[] = [];

    // Calcular métricas para cada competidor
    for (const competitor of activeCompetitors) {
      // Obtener posts del competidor
      const { data: posts, error: postsError } = await supabase
        .from('competitor_posts')
        .select('*')
        .eq('competitor_id', competitor.id)
        .order('timestamp', { ascending: false });

      if (postsError || !posts || posts.length === 0) {
        continue;
      }

      // 1. Growth Rate (simulado - necesitaríamos histórico de followers)
      // Por ahora calculamos basado en posts/tiempo
      const oldestPost = posts[posts.length - 1];
      const newestPost = posts[0];
      const daysDiff = oldestPost && newestPost
        ? (new Date(newestPost.timestamp).getTime() - new Date(oldestPost.timestamp).getTime()) / (1000 * 60 * 60 * 24)
        : 7;

      const growth_rate = daysDiff > 0 ? (posts.length / daysDiff) * 7 : 0; // posts por semana como proxy

      // 2. Posting Frequency
      const posting_frequency = daysDiff > 0 ? (posts.length / daysDiff) * 7 : 0;

      // 3. Average Engagement Rate
      const validEngagements = posts.filter(p => p.engagement_rate > 0);
      const avg_engagement_rate = validEngagements.length > 0
        ? validEngagements.reduce((sum, p) => sum + p.engagement_rate, 0) / validEngagements.length
        : 0;

      // 4. Best Time to Post
      const best_time_to_post = getBestTimeToPost(posts);

      // 5. Content Mix
      const content_mix = {
        reels: 0,
        posts: 0,
        carousels: 0,
        videos: 0
      };

      posts.forEach(post => {
        const type = normalizeMediaType(post.media_type);
        if (type === 'REELS') content_mix.reels++;
        else if (type === 'CAROUSEL') content_mix.carousels++;
        else if (type === 'VIDEO') content_mix.videos++;
        else content_mix.posts++;
      });

      // 6. Top Hashtags
      const hashtagCount: { [key: string]: number } = {};
      posts.forEach(post => {
        const hashtags = extractHashtags(post.caption || '');
        hashtags.forEach(tag => {
          hashtagCount[tag] = (hashtagCount[tag] || 0) + 1;
        });
      });

      const top_hashtags = Object.entries(hashtagCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([hashtag, count]) => ({ hashtag, count }));

      // 7. Average Likes
      const avg_likes = posts.reduce((sum, p) => sum + (p.likes || 0), 0) / posts.length;

      // 8. Average Comments
      const avg_comments = posts.reduce((sum, p) => sum + (p.comments || 0), 0) / posts.length;

      // 9. Content Themes
      const captions = posts.map(p => p.caption || '');
      const content_themes = extractContentThemes(captions);

      metrics.push({
        competitor_id: competitor.id,
        competitor_username: competitor.instagram_username,
        growth_rate: parseFloat(growth_rate.toFixed(2)),
        posting_frequency: parseFloat(posting_frequency.toFixed(2)),
        avg_engagement_rate: parseFloat(avg_engagement_rate.toFixed(2)),
        best_time_to_post,
        content_mix,
        top_hashtags,
        avg_likes: parseFloat(avg_likes.toFixed(0)),
        avg_comments: parseFloat(avg_comments.toFixed(0)),
        content_themes,
        total_posts: posts.length
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        metrics,
        total_competitors: metrics.length
      }
    });

  } catch (error: any) {
    console.error('Error calculating competitor analytics:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Error al calcular métricas de competidores'
    }, { status: 500 });
  }
}
