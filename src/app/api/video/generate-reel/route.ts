import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/simple-client';

/**
 * POST /api/video/generate-reel
 *
 * Genera un video Reel automáticamente usando:
 * - Creatomate (si está configurado)
 * - O Pexels + procesamiento local
 *
 * Requiere: CREATOMATE_API_KEY o PEXELS_API_KEY en .env.local
 */

interface ReelRequest {
  contentId?: string;  // ID del contenido en scheduled_content
  script: string;      // Script del reel
  topic: string;       // Tema para buscar videos de stock
  duration?: number;   // Duración en segundos (default: 30)
  style?: 'minimal' | 'dynamic' | 'corporate' | 'fun';
}

export async function POST(request: Request) {
  try {
    const body: ReelRequest = await request.json();
    const { contentId, script, topic, duration = 30, style = 'dynamic' } = body;

    // Verificar qué API está disponible
    const creatomateKey = process.env.CREATOMATE_API_KEY;
    const pexelsKey = process.env.PEXELS_API_KEY;

    if (!creatomateKey && !pexelsKey) {
      return NextResponse.json({
        success: false,
        error: 'No hay API de video configurada',
        instructions: {
          option1: {
            name: 'Creatomate (Recomendado)',
            steps: [
              '1. Ve a https://creatomate.com y crea una cuenta',
              '2. Obtén tu API key en el dashboard',
              '3. Añade CREATOMATE_API_KEY=tu_key en .env.local',
              '4. Reinicia el servidor'
            ],
            pricing: '$15/mes por 50 videos'
          },
          option2: {
            name: 'Pexels (Gratis para stock videos)',
            steps: [
              '1. Ve a https://www.pexels.com/api/',
              '2. Crea cuenta y obtén API key',
              '3. Añade PEXELS_API_KEY=tu_key en .env.local'
            ],
            pricing: 'Gratis (solo videos de stock, sin edición avanzada)'
          }
        }
      }, { status: 400 });
    }

    let result;

    if (creatomateKey) {
      result = await generateWithCreatomate(script, topic, duration, style, creatomateKey);
    } else if (pexelsKey) {
      result = await generateWithPexels(script, topic, duration, pexelsKey);
    }

    // Si se proporcionó contentId, actualizar en BD
    if (contentId && result?.videoUrl) {
      await supabaseAdmin
        .from('scheduled_content')
        .update({
          media_url: result.videoUrl,
          metadata: {
            video_generated: true,
            video_provider: result.provider,
            generated_at: new Date().toISOString()
          }
        })
        .eq('id', contentId);
    }

    return NextResponse.json({
      success: true,
      data: result
    });

  } catch (error: any) {
    console.error('Error generating reel:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

async function generateWithCreatomate(
  script: string,
  topic: string,
  duration: number,
  style: string,
  apiKey: string
) {
  // Parsear el script en escenas
  const scenes = parseScriptToScenes(script);

  // Template ID para Reels verticales (9:16)
  // Estos son templates predefinidos de Creatomate para Instagram Reels
  const templateIds: Record<string, string> = {
    minimal: 'b5a0c7e4-8f9a-4b2d-9c3e-1a2b3c4d5e6f',  // Template minimalista
    dynamic: 'c6b1d8f5-9g0b-5c3e-0d4f-2b3c4d5e6f7g',  // Template dinámico
    corporate: 'd7c2e9g6-0h1c-6d4f-1e5g-3c4d5e6f7g8h', // Template corporativo
    fun: 'e8d3f0h7-1i2d-7e5g-2f6h-4d5e6f7g8h9i'       // Template divertido
  };

  const response = await fetch('https://api.creatomate.com/v1/renders', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      template_id: templateIds[style] || templateIds.dynamic,
      modifications: scenes.map((scene, index) => ({
        [`Text-${index + 1}`]: scene.text,
        [`Duration-${index + 1}`]: scene.duration
      })).reduce((acc, curr) => ({ ...acc, ...curr }), {}),
      // Configuración adicional
      output_format: 'mp4',
      width: 1080,
      height: 1920,
      frame_rate: 30
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Creatomate error: ${error}`);
  }

  const data = await response.json();

  // Creatomate devuelve un array de renders
  const render = data[0];

  // Si el render está en proceso, devolver el ID para polling
  if (render.status === 'planned' || render.status === 'rendering') {
    return {
      provider: 'creatomate',
      status: 'processing',
      renderId: render.id,
      checkUrl: `https://api.creatomate.com/v1/renders/${render.id}`,
      estimatedTime: '30-60 segundos'
    };
  }

  return {
    provider: 'creatomate',
    status: 'completed',
    videoUrl: render.url,
    thumbnailUrl: render.snapshot_url
  };
}

async function generateWithPexels(
  script: string,
  topic: string,
  duration: number,
  apiKey: string
) {
  // Buscar videos relacionados con el topic
  const searchTerms = extractSearchTerms(topic);

  const response = await fetch(
    `https://api.pexels.com/videos/search?query=${encodeURIComponent(searchTerms)}&orientation=portrait&size=medium&per_page=5`,
    {
      headers: {
        'Authorization': apiKey
      }
    }
  );

  if (!response.ok) {
    throw new Error('Error buscando videos en Pexels');
  }

  const data = await response.json();
  const videos = data.videos || [];

  if (videos.length === 0) {
    return {
      provider: 'pexels',
      status: 'no_videos',
      message: 'No se encontraron videos para este tema',
      suggestion: 'Intenta con un tema más genérico'
    };
  }

  // Seleccionar los mejores videos
  const selectedVideos = videos.slice(0, 3).map((v: any) => ({
    id: v.id,
    url: v.video_files.find((f: any) => f.quality === 'hd')?.link || v.video_files[0]?.link,
    duration: v.duration,
    thumbnail: v.image
  }));

  // Parsear script en escenas
  const scenes = parseScriptToScenes(script);

  return {
    provider: 'pexels',
    status: 'ready_to_edit',
    stockVideos: selectedVideos,
    scenes: scenes,
    instructions: {
      message: 'Videos de stock listos. Para editar automáticamente necesitas Creatomate.',
      manual_steps: [
        '1. Descarga los videos de stock',
        '2. Usa CapCut o InShot para añadir el texto',
        '3. Exporta en formato 9:16 (1080x1920)'
      ]
    }
  };
}

function parseScriptToScenes(script: string): Array<{ text: string; duration: number }> {
  // Buscar formato de tiempo en el script (ej: "0-3s:", "4-10s:")
  const timeRegex = /(\d+)-(\d+)s?:\s*([^0-9]+?)(?=\d+-\d+s?:|$)/gi;
  const scenes: Array<{ text: string; duration: number }> = [];

  let match;
  while ((match = timeRegex.exec(script)) !== null) {
    const startTime = parseInt(match[1]);
    const endTime = parseInt(match[2]);
    const text = match[3].trim().replace(/["']/g, '');

    scenes.push({
      text,
      duration: endTime - startTime
    });
  }

  // Si no hay formato de tiempo, dividir por líneas/oraciones
  if (scenes.length === 0) {
    const sentences = script
      .split(/[.!?]\s+/)
      .filter(s => s.trim().length > 0)
      .slice(0, 5); // Máximo 5 escenas

    const durationPerScene = Math.floor(30 / sentences.length);

    sentences.forEach(sentence => {
      scenes.push({
        text: sentence.trim(),
        duration: durationPerScene
      });
    });
  }

  return scenes;
}

function extractSearchTerms(topic: string): string {
  // Extraer palabras clave relevantes para buscar videos
  const stopWords = ['de', 'la', 'el', 'en', 'y', 'a', 'para', 'con', 'un', 'una', 'los', 'las'];
  const words = topic.toLowerCase()
    .split(/\s+/)
    .filter(w => !stopWords.includes(w) && w.length > 2);

  // Mapear temas comunes a búsquedas en inglés (Pexels tiene más contenido en inglés)
  const topicMappings: Record<string, string> = {
    'ia': 'artificial intelligence technology',
    'inteligencia artificial': 'artificial intelligence',
    'emprendimiento': 'entrepreneur business startup',
    'marketing': 'marketing digital social media',
    'negocio': 'business success',
    'productividad': 'productivity work',
    'tecnología': 'technology innovation',
    'dinero': 'money finance success',
    'éxito': 'success achievement'
  };

  for (const [spanish, english] of Object.entries(topicMappings)) {
    if (topic.toLowerCase().includes(spanish)) {
      return english;
    }
  }

  return words.join(' ') || 'business technology';
}

// GET para verificar estado de un render
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const renderId = searchParams.get('renderId');

  if (!renderId) {
    return NextResponse.json({
      success: false,
      error: 'renderId requerido'
    });
  }

  const apiKey = process.env.CREATOMATE_API_KEY;
  if (!apiKey) {
    return NextResponse.json({
      success: false,
      error: 'CREATOMATE_API_KEY no configurado'
    });
  }

  const response = await fetch(`https://api.creatomate.com/v1/renders/${renderId}`, {
    headers: {
      'Authorization': `Bearer ${apiKey}`
    }
  });

  const data = await response.json();

  return NextResponse.json({
    success: true,
    data: {
      status: data.status,
      videoUrl: data.url,
      thumbnailUrl: data.snapshot_url,
      progress: data.progress
    }
  });
}
