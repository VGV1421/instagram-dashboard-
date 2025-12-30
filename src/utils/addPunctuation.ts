/**
 * Agrega puntuación a texto usando OpenAI GPT
 * Toma texto sin puntuación y retorna texto con signos de puntuación correctos
 */

import OpenAI from 'openai';

export async function addPunctuation(text: string): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    console.warn('⚠️ OPENAI_API_KEY no configurado, retornando texto sin puntuación');
    return text;
  }

  try {
    const openai = new OpenAI({ apiKey });

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'Eres un experto en gramática española. Agrega signos de puntuación (. , ? ¿ ! ¡) al texto que te den. Retorna SOLO el texto con puntuación, sin explicaciones.'
        },
        {
          role: 'user',
          content: `Agrega signos de puntuación a este texto:\n\n${text}`
        }
      ],
      temperature: 0.3,
      max_tokens: 500
    });

    const punctuatedText = response.choices[0]?.message?.content?.trim() || text;

    console.log('✅ Puntuación agregada con GPT');
    console.log('   Original:', text.substring(0, 100) + '...');
    console.log('   Con puntuación:', punctuatedText.substring(0, 100) + '...');

    return punctuatedText;

  } catch (error: any) {
    console.error('❌ Error agregando puntuación:', error.message);
    return text; // Retornar texto original si falla
  }
}
