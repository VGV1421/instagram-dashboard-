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
 * - useCompetitorData: boolean (usar datos de competidores en lugar de propios)
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
      useCompetitorData = false,
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
    // Si useCompetitorData es true, usar posts de competidores
    let topPosts, error;

    if (useCompetitorData) {
      // Obtener posts de competidores
      const { data, error: compError } = await (supabase as any)
        .from('competitor_posts')
        .select('caption, engagement_rate, likes, comments')
        .order('engagement_rate', { ascending: false })
        .limit(5);

      topPosts = data;
      error = compError;
    } else {
      // Obtener posts propios
      const { data, error: ownError } = await supabase
        .from('posts')
        .select('caption, engagement_rate, likes, comments')
        .order('engagement_rate', { ascending: false })
        .limit(5);

      topPosts = data;
      error = ownError;
    }

    if (error) {
      console.error('Error fetching top posts:', error);
    }

    // Preparar ejemplos de captions exitosos
    const exampleCaptions = topPosts && topPosts.length > 0
      ? topPosts.map((p: any) => p.caption).filter(Boolean).join('\n---\n')
      : '';

    // Obtener keywords y hashtags de posts exitosos
    const keywordsTable = useCompetitorData ? 'competitor_posts' : 'posts';
    const { data: keywordsData } = await (supabase as any)
      .from(keywordsTable)
      .select('caption, engagement_rate')
      .not('caption', 'is', null)
      .order('engagement_rate', { ascending: false })
      .limit(15);

    // Extraer keywords contextuales (excluyendo palabras comunes y verbos de relleno)
    const stopWords = new Set([
      'el', 'la', 'los', 'las', 'un', 'una', 'unos', 'unas', 'de', 'en', 'y', 'a',
      'del', 'con', 'para', 'por', 'que', 'tu', 'te', 'mi', 'tú', 'si', 'no',
      'como', 'más', 'pero', 'muy', 'también', 'donde', 'cuando', 'porque',
      'hacer', 'tener', 'estar', 'ser', 'poder', 'decir', 'dar', 'ver', 'saber',
      'querer', 'llegar', 'pasar', 'dejar', 'seguir', 'encontrar', 'llamar',
      'paso', 'cosa', 'parte', 'día', 'año', 'vez', 'tiempo', 'vida', 'mundo',
      'desde', 'hasta', 'sobre', 'entre', 'sin', 'tras', 'durante', 'contra',
      'este', 'ese', 'aquel', 'esta', 'esa', 'aquella', 'esto', 'eso', 'aquello',
      'yo', 'él', 'ella', 'nosotros', 'vosotros', 'ellos', 'ellas', 'me', 'se',
      'comenta', 'comentar', 'guarda', 'guardar', 'comparte', 'compartir', 'sigue',
      'link', 'perfil', 'bio', 'swipe', 'slide', 'click', 'toca', 'enviar'
    ]);

    // Palabras clave relevantes del dominio que SIEMPRE se consideran
    const relevantDomainKeywords = new Set([
      'automatización', 'automatizacion', 'marketing', 'ventas', 'inteligencia',
      'artificial', 'digital', 'estrategia', 'contenido', 'instagram', 'redes',
      'sociales', 'engagement', 'algoritmo', 'analytics', 'datos', 'análisis',
      'conversión', 'conversion', 'cliente', 'clientes', 'audiencia', 'seguidores',
      'crecimiento', 'negocio', 'empresa', 'emprendimiento', 'productividad',
      'eficiencia', 'optimización', 'resultados', 'objetivo', 'meta', 'campaña',
      'publicidad', 'chatbot', 'workflow', 'herramienta', 'software', 'plataforma',
      'solución', 'innovación', 'tecnología', 'transformación', 'ecommerce',
      'producto', 'servicio', 'marca', 'branding', 'diseño', 'creativo',
      'comunicación', 'copywriting', 'mensaje', 'storytelling'
    ]);

    const allWords: { [key: string]: number } = {};

    keywordsData?.forEach(post => {
      const text = post.caption?.toLowerCase().replace(/#\w+/g, '').replace(/[^\w\sáéíóúñü]/g, ' ') || '';
      const words = text.split(/\s+/).filter(w => {
        if (relevantDomainKeywords.has(w)) return true; // Siempre incluir palabras del dominio
        return w.length >= 5 && !stopWords.has(w) && isNaN(Number(w));
      });
      words.forEach(word => {
        allWords[word] = (allWords[word] || 0) + 1;
      });
    });

    // Priorizar palabras del dominio en el ranking
    const topKeywords = Object.entries(allWords)
      .map(([word, count]) => ({
        word,
        count,
        isDomain: relevantDomainKeywords.has(word),
        score: relevantDomainKeywords.has(word) ? count * 3 : count // 3x bonus para palabras del dominio
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 15)
      .map(item => item.word);

    // Extraer hashtags exitosos
    const allHashtags: string[] = [];
    keywordsData?.forEach(post => {
      const hashtags = post.caption?.match(/#[\w\u00C0-\u017F]+/g) || [];
      allHashtags.push(...hashtags);
    });

    const topHashtags = [...new Set(allHashtags.map(h => h.toLowerCase()))]
      .slice(0, 8)
      .join(' ');

    // Configurar longitud
    const lengthMap = {
      corto: '100-150 caracteres',
      medio: '150-250 caracteres',
      largo: '250-400 caracteres'
    };

    const lengthInstruction = lengthMap[length as keyof typeof lengthMap] || lengthMap.medio;

    // Construir prompt para OpenAI con enfoque en Keywords (2025 SEO)
    const dataSourceText = useCompetitorData
      ? 'los competidores analizados'
      : 'esta cuenta';
    const systemPrompt = `Eres un experto en Instagram SEO 2025 que crea captions optimizados para máxima visibilidad.

CONTEXTO CRÍTICO - Instagram 2025:
- Instagram es ahora un MOTOR DE BÚSQUEDA, no solo red social
- El algoritmo LEE Y ANALIZA todo el texto del caption
- Las KEYWORDS son MÁS IMPORTANTES que los hashtags
- Google indexa contenido de Instagram desde julio 2025
- La gente busca usando PALABRAS CLAVE, no hashtags

Tu tarea es generar 3 variaciones de captions para Instagram basándote en:
1. El tema proporcionado por el usuario
2. El tono solicitado
3. Los ejemplos de captions exitosos de ${dataSourceText}
4. Las KEYWORDS más efectivas de ${dataSourceText}: ${topKeywords.join(', ')}

REGLAS FUNDAMENTALES 2025:
- Genera exactamente 3 variaciones diferentes
- Tono: ${tone}
- Longitud: ${lengthInstruction}
- **PRIORIDAD #1: Incluye KEYWORDS SEO naturalmente en el texto** (de esta lista: ${topKeywords.slice(0, 8).join(', ')})
- **KEYWORDS deben aparecer en las primeras 2-3 líneas** para máximo SEO
- Las keywords deben ser NATURALES, no forzadas
${includeEmojis ? '- Incluye emojis estratégicos (2-4 por caption) que NO afecten keywords' : '- NO uses emojis'}
${includeHashtags ? `- Incluye 3-5 hashtags complementarios al FINAL (keywords son más importantes). Usa: ${topHashtags}` : '- NO incluyas hashtags'}
- Usa saltos de línea para mejor legibilidad y SEO
- Primera línea debe captar atención Y contener keyword principal
- Incluye call-to-action (CTA) con keywords relevantes
- Mantén el estilo que funciona para esta cuenta
- Piensa en qué BUSCARÍA la gente en Instagram para encontrar este contenido

EJEMPLOS DE CAPTIONS EXITOSOS DE ESTA CUENTA:
${exampleCaptions || 'No hay ejemplos disponibles, usa tu criterio profesional basado en Instagram SEO 2025.'}`;

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

    // Análisis de cada caption (longitud, hashtags, emojis, KEYWORDS)
    const captionsWithAnalysis = captions.map((caption, idx) => {
      const hashtagCount = (caption.match(/#\w+/g) || []).length;
      const emojiCount = (caption.match(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu) || []).length;
      const charCount = caption.length;

      // Detectar keywords usadas en el caption
      const captionLower = caption.toLowerCase();
      const keywordsUsed = topKeywords.filter(kw => captionLower.includes(kw.toLowerCase()));

      return {
        id: idx + 1,
        text: caption,
        analysis: {
          characters: charCount,
          keywords: keywordsUsed.length,
          hashtags: hashtagCount,
          emojis: emojiCount,
          keywordsList: keywordsUsed.slice(0, 5),
          estimatedEngagement: keywordsUsed.length >= 3 ? 'Alto' : keywordsUsed.length >= 2 ? 'Medio' : 'Bajo'
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
          topKeywords: topKeywords.slice(0, 10),
          topHashtags: topHashtags ? topHashtags.split(' ').slice(0, 5) : [],
          model: 'gpt-4o-mini',
          seoOptimized: true,
          year: 2025,
          dataSource: useCompetitorData ? 'competitors' : 'own',
          useCompetitorData
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
