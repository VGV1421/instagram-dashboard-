import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/simple-client';
import OpenAI from 'openai';

/**
 * POST /api/ai/generate-caption
 *
 * Genera captions para Instagram usando IA basado en posts exitosos
 * Body:
 * - topic: string (tema del post)
 * - tone: 'profesional' | 'casual' | 'motivacional' | 'educativo' | 'entretenido'
 * - length: 'corto' | 'medio' | 'largo'
 * - includeHashtags: boolean
 * - includeEmojis: boolean
 */

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      topic = '',
      tone = 'profesional',
      length = 'medio',
      includeHashtags = true,
      includeEmojis = true,
    } = body;

    if (!topic) {
      return NextResponse.json({
        success: false,
        error: 'El tema es requerido'
      }, { status: 400 });
    }

    // Verificar que OpenAI esté configurado
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({
        success: false,
        error: 'OpenAI API key no configurada'
      }, { status: 500 });
    }

    const supabase = supabaseAdmin;

    // Obtener posts más exitosos para aprender del estilo
    const { data: topPosts, error } = await supabase
      .from('posts')
      .select('caption, engagement_rate, likes, comments')
      .order('engagement_rate', { ascending: false })
      .limit(5);

    if (error) {
      console.error('Error fetching top posts:', error);
    }

    // Preparar ejemplos de captions exitosos
    const exampleCaptions = topPosts && topPosts.length > 0
      ? topPosts.map(p => p.caption).filter(Boolean).join('\n---\n')
      : '';

    // Obtener hashtags exitosos
    const { data: hashtagsData } = await supabase
      .from('posts')
      .select('caption, engagement_rate')
      .not('caption', 'is', null)
      .order('engagement_rate', { ascending: false })
      .limit(10);

    // Extraer hashtags
    const allHashtags: string[] = [];
    hashtagsData?.forEach(post => {
      const hashtags = post.caption?.match(/#[\w\u00C0-\u017F]+/g) || [];
      allHashtags.push(...hashtags);
    });

    const topHashtags = [...new Set(allHashtags.map(h => h.toLowerCase()))]
      .slice(0, 10)
      .join(' ');

    // Configurar longitud
    const lengthMap = {
      corto: '100-150 caracteres',
      medio: '150-250 caracteres',
      largo: '250-400 caracteres'
    };

    const lengthInstruction = lengthMap[length as keyof typeof lengthMap] || lengthMap.medio;

    // Construir prompt para OpenAI
    const systemPrompt = `Eres un experto en marketing de Instagram que crea captions altamente efectivos.

Tu tarea es generar 3 variaciones de captions para Instagram basándote en:
1. El tema proporcionado por el usuario
2. El tono solicitado
3. Los ejemplos de captions exitosos del usuario
4. Los hashtags que han funcionado bien

REGLAS IMPORTANTES:
- Genera exactamente 3 variaciones diferentes
- Tono: ${tone}
- Longitud: ${lengthInstruction}
${includeEmojis ? '- Incluye emojis relevantes (2-4 por caption)' : '- NO uses emojis'}
${includeHashtags ? `- Incluye 5-8 hashtags relevantes al final. Prioriza estos hashtags exitosos: ${topHashtags}` : '- NO incluyas hashtags'}
- Usa saltos de línea para mejor legibilidad
- Primera línea debe captar atención
- Incluye call-to-action (CTA) al final
- Mantén el estilo que funciona para esta cuenta

EJEMPLOS DE CAPTIONS EXITOSOS DE ESTA CUENTA:
${exampleCaptions || 'No hay ejemplos disponibles, usa tu criterio profesional.'}`;

    const userPrompt = `Genera 3 captions sobre: "${topic}"

Formato de respuesta (IMPORTANTE - sigue exactamente este formato):
---CAPTION 1---
[Caption aquí]

---CAPTION 2---
[Caption aquí]

---CAPTION 3---
[Caption aquí]`;

    // Llamar a OpenAI
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.8,
      max_tokens: 1500,
    });

    const generatedText = completion.choices[0]?.message?.content || '';

    // Parsear las 3 captions
    const captions = generatedText
      .split(/---CAPTION \d+---/)
      .map(c => c.trim())
      .filter(c => c.length > 0);

    if (captions.length === 0) {
      throw new Error('No se pudieron generar captions');
    }

    // Análisis de cada caption (longitud, hashtags, emojis)
    const captionsWithAnalysis = captions.map((caption, idx) => {
      const hashtagCount = (caption.match(/#\w+/g) || []).length;
      const emojiCount = (caption.match(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu) || []).length;
      const charCount = caption.length;

      return {
        id: idx + 1,
        text: caption,
        analysis: {
          characters: charCount,
          hashtags: hashtagCount,
          emojis: emojiCount,
          estimatedEngagement: 'Medio' // Placeholder, se puede calcular con ML
        }
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        captions: captionsWithAnalysis,
        metadata: {
          topic,
          tone,
          length,
          basedOnPosts: topPosts?.length || 0,
          topHashtags: topHashtags ? topHashtags.split(' ').slice(0, 5) : [],
          model: 'gpt-4o-mini'
        }
      }
    });

  } catch (error: any) {
    console.error('Error generating caption:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Error al generar caption'
      },
      { status: 500 }
    );
  }
}
