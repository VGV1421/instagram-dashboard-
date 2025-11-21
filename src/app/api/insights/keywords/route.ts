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

    // Stop words en español - palabras sin valor informativo
    const stopWords = new Set([
      // Artículos
      'el', 'la', 'los', 'las', 'un', 'una', 'unos', 'unas',
      // Preposiciones
      'a', 'ante', 'bajo', 'cabe', 'con', 'contra', 'de', 'desde', 'durante',
      'en', 'entre', 'hacia', 'hasta', 'mediante', 'para', 'por', 'según',
      'sin', 'so', 'sobre', 'tras', 'versus', 'vía',
      // Conjunciones
      'y', 'e', 'ni', 'que', 'o', 'u', 'pero', 'sino', 'mas', 'aunque',
      // Pronombres
      'yo', 'tú', 'él', 'ella', 'nosotros', 'vosotros', 'ellos', 'ellas',
      'me', 'te', 'le', 'lo', 'la', 'nos', 'os', 'les', 'se', 'mi', 'tu', 'su',
      'mí', 'ti', 'sí', 'este', 'ese', 'aquel', 'esta', 'esa', 'aquella',
      'estos', 'esos', 'aquellos', 'estas', 'esas', 'aquellas', 'esto', 'eso', 'aquello',
      // Verbos auxiliares y comunes
      'ser', 'estar', 'haber', 'tener', 'hacer', 'poder', 'decir', 'ir', 'ver',
      'dar', 'saber', 'querer', 'llegar', 'pasar', 'deber', 'poner', 'parecer',
      'quedar', 'creer', 'hablar', 'llevar', 'dejar', 'seguir', 'encontrar',
      'llamar', 'venir', 'pensar', 'salir', 'volver', 'tomar', 'conocer', 'vivir',
      'sentir', 'tratar', 'mirar', 'contar', 'empezar', 'esperar', 'buscar',
      // Palabras funcionales
      'no', 'si', 'sí', 'como', 'cuando', 'donde', 'porque', 'aunque', 'mientras',
      'muy', 'más', 'menos', 'tan', 'tanto', 'todo', 'cada', 'algo', 'nada',
      'alguien', 'nadie', 'alguno', 'ninguno', 'otro', 'mismo', 'tal', 'cual',
      // Palabras temporales
      'ya', 'aún', 'todavía', 'siempre', 'nunca', 'ahora', 'hoy', 'ayer', 'mañana',
      'antes', 'después', 'luego', 'entonces', 'vez', 'día', 'año', 'tiempo', 'momento',
      // Adjetivos genéricos
      'bueno', 'malo', 'grande', 'pequeño', 'nuevo', 'viejo', 'bien', 'mal', 'poco',
      // Verbos genéricos adicionales
      'usar', 'utilizar', 'tener', 'haber', 'poder', 'deber', 'querer',
      // Palabras de relleno
      'parte', 'caso', 'cosa', 'forma', 'manera', 'tipo', 'clase', 'modo',
      'vida', 'mundo', 'lugar', 'hombre', 'mujer', 'persona', 'gente', 'casa', 'mano',
      // Conectores
      'además', 'también', 'tampoco', 'incluso', 'solo', 'solamente', 'solo',
      'primero', 'segundo', 'último', 'primero'
    ]);

    // Palabras clave relevantes del dominio (mantener siempre)
    const relevantKeywords = new Set([
      'automatización', 'automatizacion', 'marketing', 'ventas', 'inteligencia',
      'artificial', 'digital', 'estrategia', 'contenido', 'redes', 'sociales',
      'instagram', 'facebook', 'tiktok', 'engagement', 'algoritmo', 'analytics',
      'datos', 'análisis', 'analisis', 'métricas', 'metricas', 'roi', 'leads',
      'conversión', 'conversion', 'funnel', 'embudo', 'cliente', 'clientes',
      'audiencia', 'seguidores', 'alcance', 'impresiones', 'interacciones',
      'crecimiento', 'negocio', 'empresa', 'emprendimiento', 'emprendedor',
      'productividad', 'eficiencia', 'optimización', 'optimizacion', 'resultados',
      'objetivo', 'objetivos', 'meta', 'metas', 'estrategia', 'táctica', 'tactica',
      'campaña', 'campana', 'publicidad', 'anuncio', 'anuncios', 'ads',
      'chatbot', 'bot', 'workflow', 'proceso', 'herramienta', 'herramientas',
      'software', 'plataforma', 'aplicación', 'aplicacion', 'app', 'tool',
      'solución', 'solucion', 'problema', 'desafío', 'desafio', 'oportunidad',
      'innovación', 'innovacion', 'tecnología', 'tecnologia', 'transformación',
      'transformacion', 'digital', 'online', 'internet', 'web', 'ecommerce',
      'comercio', 'electrónico', 'electronico', 'tienda', 'venta', 'compra',
      'producto', 'productos', 'servicio', 'servicios', 'marca', 'branding',
      'identidad', 'visual', 'diseño', 'diseno', 'creativo', 'creatividad',
      'comunicación', 'comunicacion', 'mensaje', 'storytelling', 'historia',
      'copywriting', 'copy', 'texto', 'redacción', 'redaccion', 'escrito'
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
        .filter(word => {
          // Siempre incluir palabras relevantes del dominio
          if (relevantKeywords.has(word)) {
            return true;
          }
          // Filtrar el resto
          return word.length >= Math.max(minLength, 5) && // Mínimo 5 caracteres para keywords generales
            !stopWords.has(word) &&
            isNaN(Number(word)) && // Ignorar números
            !/^[aeiouáéíóúü]+$/.test(word) // Ignorar palabras que son solo vocales
        });

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
