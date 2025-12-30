/**
 * Transcribe audio con OpenAI Whisper API
 * Obtiene timestamps precisos para cada palabra
 */

require('dotenv').config({ path: '.env.local' });

const fs = require('fs');
const path = require('path');

async function transcribeWithWhisper(audioPath) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    console.error('❌ OPENAI_API_KEY no está configurado');
    process.exit(1);
  }

  console.log('🎤 Transcribiendo audio con Whisper...');

  try {
    // Usar axios para mejor compatibilidad con FormData
    const axios = require('axios');
    const FormData = require('form-data');

    const form = new FormData();
    form.append('file', fs.createReadStream(audioPath), {
      filename: 'audio.wav',
      contentType: 'audio/wav'
    });
    form.append('model', 'whisper-1');
    form.append('response_format', 'verbose_json');
    form.append('timestamp_granularities[]', 'word');

    const response = await axios.post(
      'https://api.openai.com/v1/audio/transcriptions',
      form,
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          ...form.getHeaders()
        },
        maxContentLength: Infinity,
        maxBodyLength: Infinity
      }
    );

    const data = response.data;

    console.log('✅ Transcripción completada');
    console.log('📝 Texto:', data.text);

    // Guardar resultado completo
    fs.writeFileSync(
      path.join(__dirname, 'temp', 'whisper-result.json'),
      JSON.stringify(data, null, 2)
    );

    // Agregar puntuación con GPT
    console.log('✍️ Agregando puntuación con GPT...');
    const punctuatedText = await addPunctuationToText(data.text);

    // Generar SRT desde los words con timestamps y puntuación
    if (data.words && data.words.length > 0) {
      const srt = generateSRTFromWords(data.words, punctuatedText);
      fs.writeFileSync(
        path.join(__dirname, 'temp', 'subtitles-whisper.srt'),
        srt,
        'utf-8'
      );
      console.log('✅ SRT generado: temp/subtitles-whisper.srt');
    } else {
      console.error('❌ No se obtuvieron timestamps de palabras');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

async function addPunctuationToText(text) {
  const OpenAI = require('openai');
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  try {
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

    return response.choices[0]?.message?.content?.trim() || text;
  } catch (error) {
    console.error('❌ Error agregando puntuación:', error.message);
    return text;
  }
}

function generateSRTFromWords(words, punctuatedText) {
  let srt = '';
  let subtitleIndex = 1;

  // Agrupar palabras en frases de 2-4 palabras
  const phrasesPerSubtitle = 3;

  // Dividir el texto con puntuación en palabras
  const punctuatedWords = punctuatedText.split(/\s+/);

  for (let i = 0; i < words.length; i += phrasesPerSubtitle) {
    const phrase = words.slice(i, i + phrasesPerSubtitle);

    if (phrase.length === 0) continue;

    const startTime = phrase[0].start;
    const endTime = phrase[phrase.length - 1].end;

    // Usar las palabras con puntuación si están disponibles
    let text;
    if (punctuatedWords.length >= i + phrasesPerSubtitle) {
      text = punctuatedWords.slice(i, i + phrasesPerSubtitle).join(' ');
    } else {
      text = phrase.map(w => w.word).join(' ');
    }

    srt += `${subtitleIndex}\n`;
    srt += `${formatSRTTime(startTime)} --> ${formatSRTTime(endTime)}\n`;
    srt += `${text}\n\n`;

    subtitleIndex++;
  }

  return srt;
}

function formatSRTTime(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const millis = Math.floor((seconds % 1) * 1000);

  return `${pad(hours)}:${pad(minutes)}:${pad(secs)},${pad(millis, 3)}`;
}

function pad(num, length = 2) {
  return num.toString().padStart(length, '0');
}

// Ejecutar
const audioPath = path.join(__dirname, 'temp', 'audio-heygen.wav');

if (!fs.existsSync(audioPath)) {
  console.error('❌ No se encontró el archivo de audio:', audioPath);
  process.exit(1);
}

transcribeWithWhisper(audioPath);
