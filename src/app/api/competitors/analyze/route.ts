import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/simple-client';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * POST /api/competitors/analyze
 *
 * Analiza posts de competidores con IA para identificar patrones exitosos
 * y generar recomendaciones de contenido similar
 */

interface CompetitorPost {
  id: string;
  competitor_id: string;
  caption: string;
  media_type: string;
  likes: number;
  comments: number;
  engagement_rate: number;
  hashtags: string[];
  timestamp: string;
  competitor?: {
    instagram_username: string;
    display_name: string;
    category: string;
  };
}

interface AnalysisResult {
  patterns: {
    hooks: string[];
    topics: string[];
    ctas: string[];
    hashtags: string[];
    content_structure: string[];
    emotional_triggers: string[];
  };
  best_practices: string[];
  content_recommendations: {
    topic: string;
    hook: string;
    structure: string;
    hashtags: string[];
    estimated_engagement: string;
  }[];
  posting_insights: {
    best_media_types: string[];
    optimal_caption_length: string;
    emoji_usage: string;
  };
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      limit = 20,
      minEngagement = 0,
      category = null,
      generateContent = true
    } = body;

    const supabase = supabaseAdmin;

    // 1. Obtener posts de competidores activos con mejor engagement
    let query = supabase
      .from('competitor_posts')
      .select(`
        *,
        competitor:competitors(instagram_username, display_name, category)
      `)
      .gte('engagement_rate', minEngagement)
      .order('engagement_rate', { ascending: false })
      .limit(limit);

    const { data: posts, error } = await query;

    if (error) {
      console.error('Error fetching competitor posts:', error);
      // Si falla, intentar sin join
      const { data: postsSimple, error: error2 } = await supabase
        .from('competitor_posts')
        .select('*')
        .gte('engagement_rate', minEngagement)
        .order('engagement_rate', { ascending: false })
        .limit(limit);

      if (error2) throw error2;

      return await analyzePostsWithAI(postsSimple || [], generateContent);
    }

    if (!posts || posts.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No hay posts de competidores para analizar. Sincroniza primero algunos competidores.',
        suggestion: 'Ve a /competidores y sincroniza al menos 3 competidores activos'
      });
    }

    return await analyzePostsWithAI(posts, generateContent);

  } catch (error: any) {
    console.error('Error analyzing competitors:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Error al analizar competidores'
    }, { status: 500 });
  }
}

async function analyzePostsWithAI(posts: any[], generateContent: boolean): Promise<NextResponse> {
  // Preparar datos para análisis
  const postsForAnalysis = posts.map(post => ({
    caption: post.caption?.substring(0, 500) || '',
    media_type: post.media_type,
    engagement_rate: post.engagement_rate,
    likes: post.likes,
    comments: post.comments,
    hashtags: extractHashtags(post.caption || ''),
    competitor: post.competitor?.instagram_username || 'unknown'
  }));

  // Calcular estadísticas básicas
  const stats = {
    total_posts: posts.length,
    avg_engagement: posts.reduce((sum, p) => sum + (p.engagement_rate || 0), 0) / posts.length,
    avg_likes: Math.round(posts.reduce((sum, p) => sum + (p.likes || 0), 0) / posts.length),
    avg_comments: Math.round(posts.reduce((sum, p) => sum + (p.comments || 0), 0) / posts.length),
    media_types: countByField(posts, 'media_type'),
    top_hashtags: getTopHashtags(posts, 10)
  };

  // Análisis con OpenAI
  const prompt = `Eres un experto en marketing de Instagram y análisis de contenido viral.

Analiza estos ${posts.length} posts de competidores exitosos en el nicho de IA/tecnología/emprendimiento:

${JSON.stringify(postsForAnalysis.slice(0, 15), null, 2)}

ESTADÍSTICAS:
- Engagement promedio: ${stats.avg_engagement.toFixed(2)}%
- Likes promedio: ${stats.avg_likes}
- Comentarios promedio: ${stats.avg_comments}
- Hashtags más usados: ${stats.top_hashtags.join(', ')}

TAREA: Identifica patrones de éxito y genera recomendaciones.

Responde SOLO en JSON válido con esta estructura exacta:
{
  "patterns": {
    "hooks": ["lista de 5 tipos de hooks que funcionan"],
    "topics": ["lista de 5 temas más efectivos"],
    "ctas": ["lista de 5 llamadas a la acción efectivas"],
    "hashtags": ["10 hashtags recomendados"],
    "content_structure": ["patrones de estructura que funcionan"],
    "emotional_triggers": ["disparadores emocionales identificados"]
  },
  "best_practices": ["5 mejores prácticas identificadas"],
  "content_recommendations": [
    {
      "topic": "tema específico para post",
      "hook": "hook sugerido para captar atención",
      "structure": "estructura recomendada del caption",
      "hashtags": ["5 hashtags relevantes"],
      "estimated_engagement": "alto/medio/bajo"
    },
    {
      "topic": "segundo tema",
      "hook": "segundo hook",
      "structure": "estructura",
      "hashtags": ["hashtags"],
      "estimated_engagement": "nivel"
    },
    {
      "topic": "tercer tema",
      "hook": "tercer hook",
      "structure": "estructura",
      "hashtags": ["hashtags"],
      "estimated_engagement": "nivel"
    }
  ],
  "posting_insights": {
    "best_media_types": ["tipos de contenido recomendados"],
    "optimal_caption_length": "longitud óptima",
    "emoji_usage": "recomendación de uso de emojis"
  }
}`;

  try {
    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'Eres un analista experto en contenido viral de Instagram. Siempre respondes en JSON válido.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 2000
    });

    const responseText = completion.choices[0]?.message?.content || '{}';

    // Limpiar respuesta y parsear JSON
    let analysis: AnalysisResult;
    try {
      const cleanJson = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      analysis = JSON.parse(cleanJson);
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError);
      // Usar análisis básico si falla el parsing
      analysis = generateBasicAnalysis(posts, stats);
    }

    // Guardar análisis en BD para histórico
    await saveAnalysisToDb(analysis, stats);

    // Si se solicita, generar contenido basado en el análisis
    let generatedContent = null;
    if (generateContent) {
      generatedContent = await generateContentFromAnalysis(analysis);
    }

    return NextResponse.json({
      success: true,
      data: {
        analysis,
        statistics: stats,
        posts_analyzed: posts.length,
        generated_content: generatedContent,
        timestamp: new Date().toISOString()
      }
    });

  } catch (aiError: any) {
    console.error('OpenAI error:', aiError);
    // Retornar análisis básico sin IA
    const basicAnalysis = generateBasicAnalysis(posts, stats);
    return NextResponse.json({
      success: true,
      data: {
        analysis: basicAnalysis,
        statistics: stats,
        posts_analyzed: posts.length,
        ai_error: 'Análisis con IA no disponible, usando análisis básico',
        timestamp: new Date().toISOString()
      }
    });
  }
}

function extractHashtags(text: string): string[] {
  const matches = text.match(/#[\w\u00C0-\u024F]+/g);
  return matches || [];
}

function countByField(posts: any[], field: string): Record<string, number> {
  return posts.reduce((acc, post) => {
    const value = post[field] || 'unknown';
    acc[value] = (acc[value] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
}

function getTopHashtags(posts: any[], limit: number): string[] {
  const hashtagCount: Record<string, number> = {};

  posts.forEach(post => {
    const hashtags = extractHashtags(post.caption || '');
    hashtags.forEach(tag => {
      hashtagCount[tag] = (hashtagCount[tag] || 0) + 1;
    });
  });

  return Object.entries(hashtagCount)
    .sort(([, a], [, b]) => b - a)
    .slice(0, limit)
    .map(([tag]) => tag);
}

function generateBasicAnalysis(posts: any[], stats: any): AnalysisResult {
  return {
    patterns: {
      hooks: [
        'Preguntas directas al lector',
        'Datos o estadísticas impactantes',
        'Declaraciones controversiales',
        'Historias personales',
        'Promesas de valor'
      ],
      topics: [
        'Inteligencia Artificial',
        'Productividad',
        'Emprendimiento digital',
        'Automatización',
        'Crecimiento personal'
      ],
      ctas: [
        'Guarda este post',
        'Comenta tu opinión',
        'Comparte con alguien',
        'Link en bio',
        'Sígueme para más'
      ],
      hashtags: stats.top_hashtags || [],
      content_structure: [
        'Hook → Problema → Solución → CTA',
        'Lista numerada de tips',
        'Historia personal → Lección',
        'Pregunta → Respuesta detallada'
      ],
      emotional_triggers: [
        'FOMO (miedo a perderse algo)',
        'Curiosidad',
        'Aspiración de éxito',
        'Identificación con problemas comunes'
      ]
    },
    best_practices: [
      'Usar emojis estratégicamente',
      'Mantener párrafos cortos',
      'Incluir llamada a la acción clara',
      'Usar hashtags relevantes (5-10)',
      'Publicar en horas de mayor actividad'
    ],
    content_recommendations: [
      {
        topic: 'Cómo usar ChatGPT para tu negocio',
        hook: '¿Sabías que puedes automatizar el 80% de tu trabajo con IA?',
        structure: 'Hook → 5 casos de uso → CTA para seguir',
        hashtags: ['#ChatGPT', '#IA', '#Productividad', '#Emprendimiento', '#Automatizacion'],
        estimated_engagement: 'alto'
      },
      {
        topic: 'Errores comunes al emprender online',
        hook: 'Perdí $5,000 por cometer este error...',
        structure: 'Historia → Error → Lección → Consejo',
        hashtags: ['#Emprendimiento', '#NegociosOnline', '#Errores', '#Aprendizaje'],
        estimated_engagement: 'alto'
      },
      {
        topic: 'Herramientas de IA gratuitas',
        hook: 'Estas 5 herramientas de IA son GRATIS y nadie te lo dice',
        structure: 'Hook → Lista de herramientas → Beneficio de cada una → CTA',
        hashtags: ['#HerramientasIA', '#Gratis', '#Productividad', '#Tech'],
        estimated_engagement: 'medio'
      }
    ],
    posting_insights: {
      best_media_types: Object.keys(stats.media_types || {}),
      optimal_caption_length: '150-300 caracteres para engagement óptimo',
      emoji_usage: 'Usar 3-5 emojis relevantes, no exceder'
    }
  };
}

async function saveAnalysisToDb(analysis: AnalysisResult, stats: any) {
  try {
    const supabase = supabaseAdmin;

    await supabase
      .from('competitor_analysis')
      .insert({
        analysis_data: analysis,
        statistics: stats,
        created_at: new Date().toISOString()
      });
  } catch (error) {
    // Tabla puede no existir, ignorar error
    console.log('Could not save analysis to DB (table may not exist)');
  }
}

async function generateContentFromAnalysis(analysis: AnalysisResult) {
  const recommendations = analysis.content_recommendations || [];

  if (recommendations.length === 0) return null;

  // Generar 3 captions basados en las recomendaciones
  const generatedCaptions = [];

  for (const rec of recommendations.slice(0, 3)) {
    try {
      const captionPrompt = `Genera un caption de Instagram sobre "${rec.topic}" usando este hook: "${rec.hook}".

Estructura: ${rec.structure}
Hashtags a incluir: ${rec.hashtags.join(' ')}

El caption debe:
- Tener entre 150-300 caracteres (sin contar hashtags)
- Usar 3-5 emojis relevantes
- Incluir una llamada a la acción clara
- Estar en español
- Ser para una cuenta que vende cursos de IA/emprendimiento

Responde SOLO con el caption listo para publicar.`;

      const completion = await openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'Eres un copywriter experto en Instagram. Generas captions virales y persuasivos.'
          },
          {
            role: 'user',
            content: captionPrompt
          }
        ],
        temperature: 0.8,
        max_tokens: 500
      });

      const caption = completion.choices[0]?.message?.content || '';

      generatedCaptions.push({
        topic: rec.topic,
        caption: caption,
        hashtags: rec.hashtags,
        estimated_engagement: rec.estimated_engagement,
        generated_at: new Date().toISOString()
      });

    } catch (error) {
      console.error('Error generating caption:', error);
    }
  }

  return generatedCaptions;
}

// GET para obtener último análisis guardado
export async function GET() {
  try {
    const supabase = supabaseAdmin;

    const { data, error } = await supabase
      .from('competitor_analysis')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      return NextResponse.json({
        success: false,
        error: 'No hay análisis previos'
      });
    }

    return NextResponse.json({
      success: true,
      data
    });

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
