import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/simple-client';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * POST /api/content/generate-auto
 *
 * Genera contenido automáticamente basado en:
 * 1. Análisis de competidores exitosos
 * 2. Tendencias actuales
 * 3. Mejores prácticas identificadas
 *
 * Guarda el contenido en scheduled_content para publicación posterior
 */

interface GeneratedContent {
  id?: string;
  type: 'post' | 'reel' | 'carousel' | 'story';
  topic: string;
  caption: string;
  script?: string;
  hashtags: string[];
  suggested_media: string;
  scheduled_for?: string;
  status: 'draft' | 'scheduled' | 'published';
  engagement_prediction: 'high' | 'medium' | 'low';
  based_on_competitors: string[];
  created_at: string;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      count = 3,
      types = ['post', 'reel', 'carousel'],
      niche = 'IA y emprendimiento digital',
      tone = 'profesional pero cercano',
      saveToDb = true,
      videoInfo = null // { duration: number, type: 'avatar', description: string }
    } = body;

    // Si hay videoInfo, mostrarlo en consola
    if (videoInfo) {
      console.log(`🎬 Video info: ${videoInfo.duration}s, tipo: ${videoInfo.type}`);
    }

    const supabase = supabaseAdmin;

    // 1. Obtener posts exitosos de competidores ACTIVOS para inspiración
    // Primero obtenemos los IDs de competidores activos
    const { data: activeCompetitors } = await supabase
      .from('competitors')
      .select('id')
      .eq('is_active', true);

    const activeIds = activeCompetitors?.map(c => c.id) || [];

    // Luego obtenemos los posts con más engagement de esos competidores
    const { data: topPosts } = await supabase
      .from('competitor_posts')
      .select('caption, media_type, engagement_rate, likes, comments')
      .in('competitor_id', activeIds.length > 0 ? activeIds : ['none'])
      .gte('likes', 50) // Posts con al menos 50 likes
      .order('likes', { ascending: false })
      .limit(15);

    // 2. Obtener último análisis de competidores
    const { data: lastAnalysis } = await supabase
      .from('competitor_analysis')
      .select('analysis_data')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    // 3. Preparar contexto para generación
    const competitorContext = topPosts?.map(p => ({
      caption: p.caption?.substring(0, 300),
      type: p.media_type,
      likes: p.likes || 0,
      comments: p.comments || 0
    })) || [];

    console.log(`📊 Posts de competidores activos: ${topPosts?.length || 0}`);

    const analysisPatterns = lastAnalysis?.analysis_data?.patterns || null;

    // 4. Generar contenido con IA
    const generatedContent: GeneratedContent[] = [];

    for (let i = 0; i < count; i++) {
      const contentType = types[i % types.length];

      const content = await generateSingleContent(
        contentType,
        niche,
        tone,
        competitorContext,
        analysisPatterns,
        i,
        videoInfo // Pasar info del video para adaptar el script
      );

      if (content) {
        generatedContent.push(content);
      }
    }

    // 5. Guardar en BD si se solicita
    if (saveToDb && generatedContent.length > 0) {
      await saveScheduledContent(generatedContent);
    }

    return NextResponse.json({
      success: true,
      data: {
        generated_count: generatedContent.length,
        content: generatedContent,
        based_on: {
          competitor_posts_analyzed: topPosts?.length || 0,
          has_previous_analysis: !!lastAnalysis
        },
        timestamp: new Date().toISOString()
      }
    });

  } catch (error: any) {
    console.error('Error generating content:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Error al generar contenido'
    }, { status: 500 });
  }
}

async function generateSingleContent(
  type: string,
  niche: string,
  tone: string,
  competitorContext: any[],
  patterns: any,
  index: number,
  videoInfo?: { duration: number; type: string; description: string } | null
): Promise<GeneratedContent | null> {

  // Calcular caracteres máximos según duración del video
  // Aproximadamente 15 caracteres por segundo de habla natural
  const videoDuration = videoInfo?.duration || 30;
  const maxChars = Math.round(videoDuration * 15);
  const isAvatarVideo = videoInfo?.type === 'avatar';

  // HOOKS PROBADOS que funcionan (basado en análisis de competidores)
  const provenHooks = [
    '¿Sabías que...',
    'A ver novatos...',
    'Esto es lo que nadie te dice sobre...',
    '🚨 ¡Atención! Esto cambia todo...',
    'No cometas este error...',
    'Esta herramienta es increíble y GRATIS...',
    'Uno de los mejores secretos de...',
    'Resolviendo la duda más común...',
    '¿Necesitas un empujoncito para...?'
  ];

  // TEMAS ESPECÍFICOS que generan engagement (basado en posts virales)
  const viralTopics = [
    'Herramientas de IA gratuitas que pocos conocen',
    'Errores que cometen los novatos en marketing digital',
    'Cómo automatizar tareas con IA paso a paso',
    'Secretos para crear contenido que vende',
    'Generadores de imágenes con IA gratis',
    'Cómo empezar un negocio digital desde cero',
    'Trucos de IA para ahorrar tiempo',
    'Técnicas de ventas que usan los pros'
  ];

  // Seleccionar tema y hook diferente según el índice
  const selectedTopic = viralTopics[index % viralTopics.length];
  const selectedHook = provenHooks[index % provenHooks.length];

  const typePrompts: Record<string, string> = {
    post: `un post de Instagram con caption persuasivo`,
    reel: isAvatarVideo
      ? `un script para video de ${Math.round(videoDuration)} segundos donde UNA PERSONA HABLA DIRECTAMENTE A CÁMARA`
      : `un Reel de Instagram con script de ${Math.round(videoDuration)} segundos`,
    carousel: `un carrusel de Instagram con 5-7 slides`,
    story: `una historia de Instagram con poll/quiz interactivo`
  };

  // Usar los posts con más likes como ejemplos REALES
  const topExamples = competitorContext
    .sort((a, b) => (b.likes || 0) - (a.likes || 0))
    .slice(0, 3)
    .map(c => `[${c.likes} likes] "${(c.caption || '').substring(0, 150)}..."`)
    .join('\n');

  // Instrucciones especiales para videos de avatar
  const avatarInstructions = isAvatarVideo ? `
⚠️ CRÍTICO - VIDEO DE AVATAR (persona hablando a cámara):
- Escribe EXACTAMENTE lo que dirá la persona, en primera persona
- NO describas escenas ni acciones. Solo texto hablado.
- Máximo ${maxChars} caracteres (${Math.round(videoDuration)} segundos)
- Tono conversacional, como hablando con un amigo
- Sin indicaciones técnicas, solo el texto que se dirá
` : '';

  const prompt = `Eres un EXPERTO en contenido viral de Instagram para academias de IA y emprendimiento digital.

CONTEXTO DE NEGOCIO:
- Vendemos cursos y formaciones sobre IA y emprendimiento
- Competidores: academias MIA (@miasantorinni) e IDA (@ganaconnay)
- Target: personas que quieren aprender a monetizar con IA

POSTS QUE YA FUNCIONARON (datos reales de competidores):
${topExamples || 'Sin ejemplos disponibles'}

PATRONES PROBADOS QUE GENERAN ENGAGEMENT:
- Palabras clave: "IA", "GRATIS", "herramienta", "paso a paso", "aprende"
- CTAs efectivos: "Comenta X y te envío...", "Guarda este post"
- Hooks: preguntas directas, urgencia, curiosidad

TAREA: Crear ${typePrompts[type]} sobre "${selectedTopic}"
${avatarInstructions}
INSTRUCCIONES ESPECÍFICAS:
1. Usa un hook estilo: "${selectedHook}" (adáptalo al tema)
2. El contenido debe ser ESPECÍFICO y dar valor real, no genérico
3. CTA: Pide que comenten una palabra para enviarles algo
4. Tono: ${tone}, español de Latinoamérica
5. Menciona herramientas o técnicas CONCRETAS
${isAvatarVideo ? `6. Script de EXACTAMENTE ${maxChars} caracteres máximo` : ''}

PROHIBIDO:
- Contenido genérico tipo "la IA puede ayudarte"
- Frases vacías sin información concreta
- Más de 2-3 emojis

Responde SOLO en JSON:
{
  "topic": "${selectedTopic}",
  "caption": "caption completo para Instagram con CTA y hashtags integrados",
  ${type === 'reel' ? `"script": "texto exacto que dirá la persona (máx ${maxChars} chars)",` : ''}
  ${type === 'carousel' ? '"slides": ["slide 1", "slide 2", "slide 3", "slide 4", "slide 5"],' : ''}
  "hashtags": ["5-8 hashtags relevantes"],
  "suggested_media": "ya tenemos el video",
  "hook_used": "el hook que usaste",
  "engagement_prediction": "high/medium/low"
}`;

  try {
    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'Eres un experto en contenido viral de Instagram. Siempre respondes en JSON válido.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.85,
      max_tokens: 1500
    });

    const responseText = completion.choices[0]?.message?.content || '{}';
    const cleanJson = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed = JSON.parse(cleanJson);

    return {
      type: type as GeneratedContent['type'],
      topic: parsed.topic || 'Sin tema',
      caption: parsed.caption || '',
      script: parsed.script,
      hashtags: parsed.hashtags || [],
      suggested_media: parsed.suggested_media || '',
      status: 'draft',
      engagement_prediction: parsed.engagement_prediction || 'medium',
      based_on_competitors: competitorContext.slice(0, 3).map(() => 'competitor_analysis'),
      created_at: new Date().toISOString()
    };

  } catch (error) {
    console.error('Error generating single content:', error);
    return null;
  }
}

async function saveScheduledContent(content: GeneratedContent[]) {
  try {
    const supabase = supabaseAdmin;

    // Calcular horas óptimas de publicación (9am, 12pm, 6pm)
    const optimalHours = [9, 12, 18];
    const today = new Date();

    const contentToInsert = content.map((c, i) => {
      const scheduledDate = new Date(today);
      scheduledDate.setDate(scheduledDate.getDate() + Math.floor(i / 3));
      scheduledDate.setHours(optimalHours[i % 3], 0, 0, 0);

      return {
        content_type: c.type,
        topic: c.topic,
        caption: c.caption,
        script: c.script || null,
        hashtags: c.hashtags,
        suggested_media: c.suggested_media,
        scheduled_for: scheduledDate.toISOString(),
        status: 'scheduled',
        engagement_prediction: c.engagement_prediction,
        metadata: {
          based_on_competitors: c.based_on_competitors,
          generated_at: c.created_at
        }
      };
    });

    const { error } = await supabase
      .from('scheduled_content')
      .insert(contentToInsert);

    if (error) {
      console.log('Error saving to scheduled_content (table may not exist):', error.message);
    }

  } catch (error) {
    console.error('Error saving scheduled content:', error);
  }
}

// GET para obtener contenido programado
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'all';
    const limit = parseInt(searchParams.get('limit') || '20');

    const supabase = supabaseAdmin;

    let query = supabase
      .from('scheduled_content')
      .select('*')
      .order('scheduled_for', { ascending: true })
      .limit(limit);

    if (status !== 'all') {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({
        success: false,
        error: error.message
      });
    }

    return NextResponse.json({
      success: true,
      data: data || [],
      count: data?.length || 0
    });

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
