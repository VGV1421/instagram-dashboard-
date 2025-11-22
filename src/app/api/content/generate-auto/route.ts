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
      saveToDb = true
    } = body;

    const supabase = supabaseAdmin;

    // 1. Obtener posts exitosos de competidores para inspiración
    const { data: topPosts } = await supabase
      .from('competitor_posts')
      .select('caption, media_type, engagement_rate, likes, comments')
      .gte('engagement_rate', 3)
      .order('engagement_rate', { ascending: false })
      .limit(10);

    // 2. Obtener último análisis de competidores
    const { data: lastAnalysis } = await supabase
      .from('competitor_analysis')
      .select('analysis_data')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    // 3. Preparar contexto para generación
    const competitorContext = topPosts?.map(p => ({
      caption: p.caption?.substring(0, 200),
      type: p.media_type,
      engagement: p.engagement_rate
    })) || [];

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
        i
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
  index: number
): Promise<GeneratedContent | null> {

  const typePrompts: Record<string, string> = {
    post: `un post de Instagram con caption persuasivo`,
    reel: `un Reel de Instagram con script de 30-60 segundos`,
    carousel: `un carrusel de Instagram con 5-7 slides`,
    story: `una historia de Instagram con poll/quiz interactivo`
  };

  const competitorExamples = competitorContext.slice(0, 3)
    .map(c => `- "${c.caption}" (${c.engagement}% engagement)`)
    .join('\n');

  const patternTips = patterns ? `
PATRONES EXITOSOS IDENTIFICADOS:
- Hooks efectivos: ${patterns.hooks?.slice(0, 3).join(', ') || 'N/A'}
- Temas populares: ${patterns.topics?.slice(0, 3).join(', ') || 'N/A'}
- CTAs que funcionan: ${patterns.ctas?.slice(0, 3).join(', ') || 'N/A'}
- Hashtags recomendados: ${patterns.hashtags?.slice(0, 5).join(' ') || 'N/A'}
` : '';

  const prompt = `Eres un creador de contenido viral para Instagram en el nicho de ${niche}.
Tu tono es ${tone}.

OBJETIVO: Crear ${typePrompts[type]} que genere alto engagement y atraiga seguidores interesados en cursos de IA.

${competitorExamples ? `EJEMPLOS DE POSTS EXITOSOS DE COMPETIDORES:\n${competitorExamples}\n` : ''}
${patternTips}

REQUISITOS:
1. Hook potente en las primeras palabras
2. Valor real y accionable
3. Llamada a la acción clara
4. 5-8 hashtags relevantes
5. Emojis estratégicos (3-5)
6. Que genere comentarios y guardados

Responde SOLO en JSON válido:
{
  "topic": "tema principal del contenido",
  "caption": "el caption completo listo para publicar",
  ${type === 'reel' ? '"script": "guión completo del reel con tiempos",' : ''}
  ${type === 'carousel' ? '"slides": ["slide 1", "slide 2", "slide 3", "slide 4", "slide 5"],' : ''}
  "hashtags": ["hashtag1", "hashtag2", "hashtag3", "hashtag4", "hashtag5"],
  "suggested_media": "descripción de imagen/video sugerido",
  "hook_used": "tipo de hook utilizado",
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
