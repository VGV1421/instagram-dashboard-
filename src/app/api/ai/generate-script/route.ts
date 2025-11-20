import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { prompt, tone, format } = await request.json();

    if (!prompt) {
      return NextResponse.json(
        { success: false, error: 'Prompt is required' },
        { status: 400 }
      );
    }

    // Verificar si OpenAI está configurado
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey || !apiKey.startsWith('sk-')) {
      // Si no hay API key válida, devolver un script de ejemplo
      const mockScript = generateMockScript(prompt, tone, format);
      return NextResponse.json({
        success: true,
        script: mockScript,
        source: 'mock',
      });
    }

    // Construir el prompt para OpenAI
    const systemPrompt = buildSystemPrompt(tone, format);
    const userPrompt = `Crea un script para Instagram sobre: ${prompt}`;

    // Llamar a OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('OpenAI API error:', error);
      // En caso de error, devolver script de ejemplo
      const mockScript = generateMockScript(prompt, tone, format);
      return NextResponse.json({
        success: true,
        script: mockScript,
        source: 'mock',
        warning: 'OpenAI no disponible, usando script de ejemplo',
      });
    }

    const data = await response.json();
    const generatedScript = data.choices[0]?.message?.content || '';

    return NextResponse.json({
      success: true,
      script: generatedScript,
      source: 'openai',
    });
  } catch (error: any) {
    console.error('Error in generate-script API:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

function buildSystemPrompt(tone: string, format: string): string {
  const toneDescriptions: Record<string, string> = {
    professional: 'profesional y claro, directo al punto',
    casual: 'casual y amigable, como hablando con un amigo',
    motivational: 'motivacional e inspirador, que genere acción',
    educational: 'educativo y detallado, fácil de entender',
  };

  const formatInstructions: Record<string, string> = {
    reel: 'Crea un script para un Reel de 30 segundos. Incluye: HOOK (primeros 3 segundos), DESARROLLO (problema/solución), CTA (llamada a la acción). Máximo 75 palabras.',
    video: 'Crea un script para un video de 60 segundos. Incluye: INTRO, CONTENIDO PRINCIPAL dividido en 3 puntos, CIERRE con CTA. Máximo 150 palabras.',
    carousel: 'Crea un script para un carrusel de 5-7 slides. Incluye: PORTADA (hook), SLIDES 2-6 (contenido paso a paso), CIERRE (resumen y CTA).',
    post: 'Crea un caption para un post simple. Incluye: Hook inicial, contenido de valor, hashtags relevantes, llamada a la acción.',
  };

  return `Eres un experto en marketing digital y creación de contenido para Instagram.

Tu tarea es crear scripts de contenido ${toneDescriptions[tone] || 'profesional'}.

${formatInstructions[format] || formatInstructions.reel}

IMPORTANTE:
- Usa lenguaje adaptado al público hispanohablante de Latinoamérica
- Incluye emojis estratégicos (1-2 por sección)
- El contenido debe ser accionable y valioso
- Termina siempre con una pregunta o CTA clara
- Formatea el texto de manera clara con saltos de línea

Formato de respuesta:
[HOOK/TÍTULO]
...

[CONTENIDO]
...

[CTA]
...`;
}

function generateMockScript(prompt: string, tone: string, format: string): string {
  const scripts: Record<string, string> = {
    reel: `🎯 HOOK (0-3s):
"¿Sabías que hay una forma más fácil de [lograr esto]?"

💡 DESARROLLO (3-20s):
El problema que enfrentamos: [problema relacionado con ${prompt}]

La solución es más simple de lo que piensas:
1. [Paso 1]
2. [Paso 2]
3. [Paso 3]

🚀 CTA (20-30s):
¿Listo para aplicarlo? Comenta "SÍ" y te cuento más detalles.

#contenido #instagram #marketingdigital`,

    video: `🎬 INTRO (0-10s):
Hola! Hoy quiero compartir contigo algo súper importante sobre ${prompt}.

📊 PUNTO 1 (10-25s):
Primero, debes entender que [concepto clave 1]. Esto es fundamental porque [razón].

💪 PUNTO 2 (25-40s):
Luego, necesitas [acción específica 2]. Muchas personas cometen el error de [error común], pero tú puedes evitarlo haciendo [solución].

✨ PUNTO 3 (40-55s):
Por último, [paso final 3]. Este es el secreto que hace la diferencia.

🎯 CIERRE (55-60s):
¿Te sirvió este tip? Guarda este video y compártelo con alguien que lo necesite. Nos vemos en el próximo!`,

    carousel: `SLIDE 1 - PORTADA:
🎯 [NÚMERO] cosas que debes saber sobre ${prompt}

SLIDE 2:
1️⃣ [Punto importante 1]
[Explicación breve]

SLIDE 3:
2️⃣ [Punto importante 2]
[Explicación breve]

SLIDE 4:
3️⃣ [Punto importante 3]
[Explicación breve]

SLIDE 5:
4️⃣ [Punto importante 4]
[Explicación breve]

SLIDE 6:
5️⃣ [Punto importante 5]
[Explicación breve]

SLIDE 7 - CIERRE:
💡 RESUMEN
Ahora ya sabes cómo [beneficio principal]

👉 Guarda este post para no olvidarlo
💬 Cuéntame en comentarios: ¿cuál te sorprendió más?

#tips #instagram #contenido`,

    post: `✨ [HOOK INICIAL CON EMOJI]

Hoy quiero hablarte sobre ${prompt} porque es algo que puede cambiar completamente [beneficio].

💡 [PUNTO CLAVE 1]
[Desarrollo del punto]

🎯 [PUNTO CLAVE 2]
[Desarrollo del punto]

🚀 [PUNTO CLAVE 3]
[Desarrollo del punto]

La clave está en [insight importante]. Cuando apliques esto, verás que [resultado esperado].

¿Ya lo estás aplicando? Cuéntame en comentarios 👇

---
#marketingdigital #instagram #contenido #emprendimiento #negociosonline #socialmedia`,
  };

  return scripts[format] || scripts.reel;
}
