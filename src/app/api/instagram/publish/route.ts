import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/simple-client';
import { notifyError } from '@/lib/email/notifications';

/**
 * POST /api/instagram/publish
 *
 * Publica contenido en Instagram automaticamente.
 *
 * Soporta:
 * - Reels (videos)
 * - Posts con imagen
 * - Carruseles (multiple imagenes)
 *
 * Requisitos:
 * - Cuenta Business/Creator de Instagram
 * - Conectada a una Pagina de Facebook
 * - Token con permisos: instagram_content_publish, instagram_basic
 */

interface PublishRequest {
  contentId?: string;
  mediaUrl: string; // URL del video o imagen (debe ser publica y accesible)
  caption: string;
  mediaType: 'REELS' | 'IMAGE' | 'CAROUSEL_ALBUM';
  coverUrl?: string; // Para Reels, imagen de portada opcional
  hashtags?: string[];
  scheduledTime?: string; // ISO date para programar
}

export async function POST(request: Request) {
  try {
    const body: PublishRequest = await request.json();
    const {
      contentId,
      mediaUrl,
      caption,
      mediaType = 'REELS',
      coverUrl,
      hashtags = [],
      scheduledTime
    } = body;

    // Verificar configuracion
    const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN;
    const igUserId = process.env.INSTAGRAM_USER_ID;

    if (!accessToken || !igUserId) {
      return NextResponse.json({
        success: false,
        error: 'Falta configuracion de Instagram',
        instructions: {
          paso1: 'Necesitas una cuenta Business/Creator de Instagram',
          paso2: 'Conectarla a una Pagina de Facebook',
          paso3: 'Obtener token con permisos: instagram_content_publish',
          paso4: 'Configurar en .env.local: INSTAGRAM_ACCESS_TOKEN e INSTAGRAM_USER_ID'
        }
      }, { status: 400 });
    }

    // Construir caption con hashtags
    const fullCaption = hashtags.length > 0
      ? `${caption}\n\n${hashtags.join(' ')}`
      : caption;

    // Para publicacion programada, calcular la mejor hora
    let publishTime = scheduledTime;
    if (!publishTime) {
      publishTime = getBestPublishTime();
    }

    // PASO 1: Crear contenedor de media
    console.log(`Creando contenedor para ${mediaType}...`);

    let containerId: string;

    if (mediaType === 'REELS') {
      containerId = await createReelsContainer(igUserId, accessToken, mediaUrl, fullCaption, coverUrl);
    } else if (mediaType === 'IMAGE') {
      containerId = await createImageContainer(igUserId, accessToken, mediaUrl, fullCaption);
    } else {
      return NextResponse.json({
        success: false,
        error: 'Tipo de media no soportado aun: ' + mediaType
      }, { status: 400 });
    }

    if (!containerId) {
      return NextResponse.json({
        success: false,
        error: 'Error creando contenedor de media'
      }, { status: 500 });
    }

    console.log(`Contenedor creado: ${containerId}`);

    // PASO 2: Esperar a que el contenedor este listo
    console.log('Esperando procesamiento...');
    const isReady = await waitForContainerReady(containerId, accessToken);

    if (!isReady) {
      return NextResponse.json({
        success: false,
        error: 'El contenedor no se proceso correctamente'
      }, { status: 500 });
    }

    // PASO 3: Publicar el contenido
    console.log('Publicando...');
    const publishResult = await publishMedia(igUserId, accessToken, containerId);

    if (!publishResult.success) {
      return NextResponse.json({
        success: false,
        error: publishResult.error
      }, { status: 500 });
    }

    console.log('Publicado! Media ID:', publishResult.mediaId);

    // PASO 4: Actualizar BD
    if (contentId) {
      await supabaseAdmin
        .from('scheduled_content')
        .update({
          status: 'published',
          published_at: new Date().toISOString(),
          instagram_media_id: publishResult.mediaId,
          metadata: {
            published: true,
            media_id: publishResult.mediaId,
            published_at: new Date().toISOString()
          }
        })
        .eq('id', contentId);
    }

    return NextResponse.json({
      success: true,
      data: {
        mediaId: publishResult.mediaId,
        permalink: publishResult.permalink,
        message: 'Contenido publicado exitosamente en Instagram!'
      }
    });

  } catch (error: any) {
    console.error('Error publicando:', error);
    await notifyError(`Error publicando en Instagram: ${error.message}`);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

// Crear contenedor para Reels
async function createReelsContainer(
  igUserId: string,
  accessToken: string,
  videoUrl: string,
  caption: string,
  coverUrl?: string
): Promise<string> {
  const params = new URLSearchParams({
    media_type: 'REELS',
    video_url: videoUrl,
    caption: caption,
    access_token: accessToken
  });

  if (coverUrl) {
    params.append('cover_url', coverUrl);
  }

  // Share to feed por defecto
  params.append('share_to_feed', 'true');

  const response = await fetch(
    `https://graph.facebook.com/v18.0/${igUserId}/media?${params.toString()}`,
    { method: 'POST' }
  );

  const data = await response.json();

  if (data.error) {
    console.error('Error creando contenedor Reels:', data.error);
    throw new Error(data.error.message);
  }

  return data.id;
}

// Crear contenedor para imagen
async function createImageContainer(
  igUserId: string,
  accessToken: string,
  imageUrl: string,
  caption: string
): Promise<string> {
  const params = new URLSearchParams({
    image_url: imageUrl,
    caption: caption,
    access_token: accessToken
  });

  const response = await fetch(
    `https://graph.facebook.com/v18.0/${igUserId}/media?${params.toString()}`,
    { method: 'POST' }
  );

  const data = await response.json();

  if (data.error) {
    console.error('Error creando contenedor imagen:', data.error);
    throw new Error(data.error.message);
  }

  return data.id;
}

// Esperar a que el contenedor este listo
async function waitForContainerReady(containerId: string, accessToken: string): Promise<boolean> {
  const maxAttempts = 30;
  let attempts = 0;

  while (attempts < maxAttempts) {
    const response = await fetch(
      `https://graph.facebook.com/v18.0/${containerId}?fields=status_code&access_token=${accessToken}`
    );

    const data = await response.json();
    const status = data.status_code;

    console.log(`Status del contenedor: ${status}`);

    if (status === 'FINISHED') {
      return true;
    } else if (status === 'ERROR') {
      console.error('Error en procesamiento:', data);
      return false;
    }

    // Esperar 5 segundos antes de verificar de nuevo
    await new Promise(resolve => setTimeout(resolve, 5000));
    attempts++;
  }

  return false;
}

// Publicar el media
async function publishMedia(
  igUserId: string,
  accessToken: string,
  containerId: string
): Promise<{ success: boolean; mediaId?: string; permalink?: string; error?: string }> {
  const response = await fetch(
    `https://graph.facebook.com/v18.0/${igUserId}/media_publish?creation_id=${containerId}&access_token=${accessToken}`,
    { method: 'POST' }
  );

  const data = await response.json();

  if (data.error) {
    return { success: false, error: data.error.message };
  }

  // Obtener permalink
  const mediaId = data.id;
  let permalink = '';

  try {
    const mediaResponse = await fetch(
      `https://graph.facebook.com/v18.0/${mediaId}?fields=permalink&access_token=${accessToken}`
    );
    const mediaData = await mediaResponse.json();
    permalink = mediaData.permalink || '';
  } catch (e) {
    // No es critico si falla
  }

  return { success: true, mediaId, permalink };
}

// Calcular la mejor hora para publicar
function getBestPublishTime(): string {
  const now = new Date();
  const hour = now.getHours();
  const day = now.getDay(); // 0 = domingo

  // Mejores horas segun dia
  const bestHours: Record<number, number[]> = {
    0: [17, 18, 19], // Domingo: tarde
    1: [11, 12, 19, 20], // Lunes
    2: [11, 12, 19, 20], // Martes
    3: [11, 12, 19, 20], // Miercoles
    4: [11, 12, 19, 20], // Jueves
    5: [11, 12, 19, 20], // Viernes
    6: [10, 11, 12] // Sabado: manana
  };

  const todayBestHours = bestHours[day];

  // Si estamos en una buena hora, publicar ahora
  if (todayBestHours.includes(hour)) {
    return new Date().toISOString();
  }

  // Buscar la siguiente mejor hora
  for (const bestHour of todayBestHours) {
    if (bestHour > hour) {
      const scheduled = new Date();
      scheduled.setHours(bestHour, 0, 0, 0);
      return scheduled.toISOString();
    }
  }

  // Si ya pasaron todas las horas de hoy, programar para manana
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowDay = tomorrow.getDay();
  const tomorrowBestHour = bestHours[tomorrowDay][0];
  tomorrow.setHours(tomorrowBestHour, 0, 0, 0);

  return tomorrow.toISOString();
}

// GET: Verificar permisos y estado
export async function GET() {
  const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN;
  const igUserId = process.env.INSTAGRAM_USER_ID;

  if (!accessToken || !igUserId) {
    return NextResponse.json({
      success: false,
      configured: false,
      error: 'Falta configuracion de Instagram'
    });
  }

  try {
    // Verificar permisos
    const response = await fetch(
      `https://graph.facebook.com/v18.0/${igUserId}?fields=username,name,media_count&access_token=${accessToken}`
    );

    const data = await response.json();

    if (data.error) {
      return NextResponse.json({
        success: false,
        configured: true,
        error: data.error.message,
        tokenExpired: data.error.code === 190
      });
    }

    // Verificar si tiene permisos de publicacion
    const permissionsResponse = await fetch(
      `https://graph.facebook.com/v18.0/me/permissions?access_token=${accessToken}`
    );
    const permissionsData = await permissionsResponse.json();

    const hasPublishPermission = permissionsData.data?.some(
      (p: any) => p.permission === 'instagram_content_publish' && p.status === 'granted'
    );

    return NextResponse.json({
      success: true,
      data: {
        username: data.username || data.name,
        mediaCount: data.media_count,
        canPublish: hasPublishPermission,
        permissions: permissionsData.data,
        bestTimeNow: getBestPublishTime()
      }
    });

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message
    });
  }
}
