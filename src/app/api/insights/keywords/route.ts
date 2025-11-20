import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/simple-client';

/**
 * GET /api/insights/keywords
 *
 * Analiza keywords más efectivas basado en captions de posts
 * Query params:
 * - source: 'own' | 'competitors' (default: 'own')
 * - minLength: número mínimo de caracteres para considerar palabra (default: 4)
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const source = searchParams.get('source') || 'own';
    const minLength = parseInt(searchParams.get('minLength') || '4');

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

    // Stop words en español
    const stopWords = new Set([
      'el', 'la', 'de', 'que', 'y', 'a', 'en', 'un', 'ser', 'se', 'no', 'haber',
      'por', 'con', 'su', 'para', 'como', 'estar', 'tener', 'le', 'lo', 'todo',
      'pero', 'más', 'hacer', 'o', 'poder', 'decir', 'este', 'ir', 'otro', 'ese',
      'si', 'me', 'ya', 'ver', 'porque', 'dar', 'cuando', 'él', 'muy', 'sin',
      'vez', 'mucho', 'saber', 'qué', 'sobre', 'mi', 'alguno', 'mismo', 'yo',
      'también', 'hasta', 'año', 'dos', 'querer', 'entre', 'así', 'primero',
      'desde', 'grande', 'eso', 'ni', 'nos', 'llegar', 'pasar', 'tiempo', 'ella',
      'sí', 'día', 'uno', 'bien', 'poco', 'deber', 'entonces', 'poner', 'cosa',
      'tanto', 'hombre', 'parecer', 'nuestro', 'tan', 'donde', 'ahora', 'parte',
      'después', 'vida', 'quedar', 'siempre', 'creer', 'hablar', 'llevar', 'dejar',
      'nada', 'cada', 'seguir', 'menos', 'nuevo', 'encontrar', 'algo', 'solo',
      'decir', 'casa', 'usar', 'tal', 'otro', 'momento', 'mano', 'esa', 'estas',
      'estos', 'ante', 'bajo', 'cabe', 'contra', 'durante', 'mediante', 'salvo',
      'según', 'tras', 'versus', 'vía'
    ]);

    // Analizar palabras clave
    const keywordStats: { [key: string]: {
      count: number;
      totalEngagement: number;
      totalLikes: number;
      totalComments: number;
      posts: any[];
    } } = {};

    posts.forEach(post => {
      const caption = post.caption || '';
      // Extraer palabras (sin hashtags ni mentions)
      const words = caption
        .toLowerCase()
        .replace(/#\w+/g, '') // Remover hashtags
        .replace(/@\w+/g, '') // Remover mentions
        .replace(/[^\w\sáéíóúñü]/g, ' ') // Solo letras y espacios
        .split(/\s+/)
        .filter(word =>
          word.length >= minLength &&
          !stopWords.has(word) &&
          isNaN(Number(word)) // Ignorar números
        );

      words.forEach(word => {
        if (!keywordStats[word]) {
          keywordStats[word] = {
            count: 0,
            totalEngagement: 0,
            totalLikes: 0,
            totalComments: 0,
            posts: []
          };
        }
        keywordStats[word].count++;
        keywordStats[word].totalEngagement += post.engagement_rate || 0;
        keywordStats[word].totalLikes += post.likes || 0;
        keywordStats[word].totalComments += post.comments || 0;
        keywordStats[word].posts.push({
          caption: post.caption,
          engagement: post.engagement_rate
        });
      });
    });

    // Calcular promedios y ordenar
    const keywordAnalysis = Object.entries(keywordStats)
      .map(([keyword, stats]) => ({
        keyword,
        frequency: stats.count,
        avgEngagement: stats.count > 0 ? stats.totalEngagement / stats.count : 0,
        avgLikes: stats.count > 0 ? Math.round(stats.totalLikes / stats.count) : 0,
        avgComments: stats.count > 0 ? Math.round(stats.totalComments / stats.count) : 0,
        totalEngagement: stats.totalEngagement,
        posts: stats.posts
      }))
      .filter(item => item.frequency >= 2) // Mínimo 2 apariciones
      .sort((a, b) => b.avgEngagement - a.avgEngagement);

    // Top keywords por engagement
    const topByEngagement = keywordAnalysis.slice(0, 20);

    // Top keywords por frecuencia
    const topByFrequency = [...keywordAnalysis]
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 20);

    return NextResponse.json({
      success: true,
      data: {
        topByEngagement: topByEngagement.map(k => ({
          keyword: k.keyword,
          frequency: k.frequency,
          avgEngagement: parseFloat(k.avgEngagement.toFixed(2)),
          avgLikes: k.avgLikes,
          avgComments: k.avgComments
        })),
        topByFrequency: topByFrequency.map(k => ({
          keyword: k.keyword,
          frequency: k.frequency,
          avgEngagement: parseFloat(k.avgEngagement.toFixed(2)),
          avgLikes: k.avgLikes,
          avgComments: k.avgComments
        })),
        totalKeywords: Object.keys(keywordStats).length,
        totalPosts: posts.length,
        source: 'own'
      }
    });

  } catch (error: any) {
    console.error('Error in keywords API:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Error al analizar keywords'
      },
      { status: 500 }
    );
  }
}
