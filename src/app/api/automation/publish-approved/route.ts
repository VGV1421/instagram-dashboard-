import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/simple-client';
import { Resend } from 'resend';

/**
 * POST /api/automation/publish-approved
 *
 * Publica un video aprobado en Instagram automaticamente.
 * Se llama despues de que el usuario aprueba el video por email.
 */

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { contentId, publishNow = false } = body;

    if (!contentId) {
      return NextResponse.json({
        success: false,
        error: 'Se requiere contentId'
      }, { status: 400 });
    }

    const supabase = supabaseAdmin;
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    // Obtener el contenido de la BD
    const { data: content, error: fetchError } = await supabase
      .from('scheduled_content')
      .select('*')
      .eq('id', contentId)
      .single();

    if (fetchError || !content) {
      return NextResponse.json({
        success: false,
        error: 'Contenido no encontrado'
      }, { status: 404 });
    }

    if (!content.media_url) {
      return NextResponse.json({
        success: false,
        error: 'El contenido no tiene video asociado'
      }, { status: 400 });
    }

    // Publicar en Instagram
    console.log('Publicando en Instagram...');

    const publishResponse = await fetch(`${baseUrl}/api/instagram/publish`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contentId,
        mediaUrl: content.media_url,
        caption: content.caption,
        mediaType: content.content_type === 'reel' ? 'REELS' : 'IMAGE',
        hashtags: content.hashtags || []
      })
    });

    const publishResult = await publishResponse.json();

    if (!publishResult.success) {
      // Notificar error
      await sendPublishNotification(false, content, publishResult.error);

      return NextResponse.json({
        success: false,
        error: publishResult.error
      }, { status: 500 });
    }

    // Actualizar estado en BD
    await supabase
      .from('scheduled_content')
      .update({
        status: 'published',
        published_at: new Date().toISOString(),
        instagram_media_id: publishResult.data?.mediaId,
        metadata: {
          ...content.metadata,
          published: true,
          instagram_media_id: publishResult.data?.mediaId,
          instagram_permalink: publishResult.data?.permalink,
          published_at: new Date().toISOString()
        }
      })
      .eq('id', contentId);

    // Notificar exito
    await sendPublishNotification(true, content, null, publishResult.data?.permalink);

    return NextResponse.json({
      success: true,
      data: {
        message: 'Publicado exitosamente en Instagram!',
        mediaId: publishResult.data?.mediaId,
        permalink: publishResult.data?.permalink,
        content: {
          topic: content.topic,
          type: content.content_type
        }
      }
    });

  } catch (error: any) {
    console.error('Error publicando:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

// Enviar notificacion de publicacion
async function sendPublishNotification(
  success: boolean,
  content: any,
  error?: string | null,
  permalink?: string
) {
  const resend = new Resend(process.env.RESEND_API_KEY);

  const html = success ? `
    <div style="font-family: Arial; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0;">Publicado en Instagram!</h1>
      </div>
      <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
        <p style="font-size: 18px; color: #374151;">Tu contenido ha sido publicado exitosamente.</p>

        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Tema:</strong> ${content.topic}</p>
          <p><strong>Tipo:</strong> ${content.content_type}</p>
        </div>

        ${permalink ? `
          <a href="${permalink}"
             style="display: inline-block; background: linear-gradient(135deg, #E1306C 0%, #833AB4 100%);
                    color: white; padding: 15px 30px; border-radius: 8px; text-decoration: none; font-weight: bold;">
            Ver en Instagram
          </a>
        ` : ''}

        <p style="color: #9ca3af; font-size: 12px; margin-top: 30px;">
          Publicado automaticamente por Instagram Dashboard
        </p>
      </div>
    </div>
  ` : `
    <div style="font-family: Arial; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); padding: 30px; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0;">Error al Publicar</h1>
      </div>
      <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
        <p style="font-size: 18px; color: #374151;">No se pudo publicar el contenido.</p>

        <div style="background: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ef4444;">
          <p style="color: #991b1b; margin: 0;">${error || 'Error desconocido'}</p>
        </div>

        <p style="color: #6b7280;">Puedes intentar publicar manualmente o contactar soporte.</p>
      </div>
    </div>
  `;

  try {
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
      to: process.env.ALERT_EMAIL_TO || 'vgvtoringana@gmail.com',
      subject: success ? 'Publicado en Instagram!' : 'Error al publicar en Instagram',
      html
    });
  } catch (e) {
    console.error('Error enviando notificacion:', e);
  }
}

// GET: Publicar desde link de email o ver pendientes
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const contentId = searchParams.get('contentId');
    const action = searchParams.get('action');

    // Si viene con contentId y action=publish, publicar
    if (contentId && action === 'publish') {
      const supabase = supabaseAdmin;
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

      // Obtener contenido
      const { data: content, error: fetchError } = await supabase
        .from('scheduled_content')
        .select('*')
        .eq('id', contentId)
        .single();

      if (fetchError || !content) {
        return new Response(`
          <html>
            <body style="font-family: Arial; padding: 40px; max-width: 600px; margin: 0 auto; text-align: center;">
              <h1 style="color: #ef4444;">Contenido no encontrado</h1>
              <p>El contenido que intentas publicar no existe o ya fue publicado.</p>
            </body>
          </html>
        `, { headers: { 'Content-Type': 'text/html' } });
      }

      if (content.status === 'published') {
        return new Response(`
          <html>
            <body style="font-family: Arial; padding: 40px; max-width: 600px; margin: 0 auto; text-align: center;">
              <h1 style="color: #f59e0b;">Ya publicado</h1>
              <p>Este contenido ya fue publicado anteriormente.</p>
              ${content.metadata?.instagram_permalink ? `<a href="${content.metadata.instagram_permalink}">Ver en Instagram</a>` : ''}
            </body>
          </html>
        `, { headers: { 'Content-Type': 'text/html' } });
      }

      if (!content.media_url) {
        return new Response(`
          <html>
            <body style="font-family: Arial; padding: 40px; max-width: 600px; margin: 0 auto; text-align: center;">
              <h1 style="color: #ef4444;">Sin video</h1>
              <p>Este contenido no tiene video asociado.</p>
            </body>
          </html>
        `, { headers: { 'Content-Type': 'text/html' } });
      }

      // Publicar
      const publishResponse = await fetch(`${baseUrl}/api/instagram/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contentId,
          mediaUrl: content.media_url,
          caption: content.caption,
          mediaType: content.content_type === 'reel' ? 'REELS' : 'IMAGE',
          hashtags: content.hashtags || []
        })
      });

      const publishResult = await publishResponse.json();

      if (!publishResult.success) {
        return new Response(`
          <html>
            <body style="font-family: Arial; padding: 40px; max-width: 600px; margin: 0 auto; text-align: center;">
              <div style="background: #fef2f2; padding: 30px; border-radius: 10px;">
                <h1 style="color: #ef4444;">Error al publicar</h1>
                <p>${publishResult.error}</p>
                <p style="color: #6b7280; margin-top: 20px;">Intenta de nuevo o publica manualmente.</p>
              </div>
            </body>
          </html>
        `, { headers: { 'Content-Type': 'text/html' } });
      }

      // Actualizar BD
      await supabase
        .from('scheduled_content')
        .update({
          status: 'published',
          published_at: new Date().toISOString(),
          metadata: {
            ...content.metadata,
            published: true,
            instagram_media_id: publishResult.data?.mediaId,
            instagram_permalink: publishResult.data?.permalink
          }
        })
        .eq('id', contentId);

      // Notificar
      await sendPublishNotification(true, content, null, publishResult.data?.permalink);

      return new Response(`
        <html>
          <head>
            <style>
              body { font-family: Arial; padding: 40px; max-width: 600px; margin: 0 auto; text-align: center; background: #f9fafb; }
              .success { background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 40px; border-radius: 15px; }
              .btn { display: inline-block; background: white; color: #059669; padding: 15px 30px; border-radius: 8px; text-decoration: none; font-weight: bold; margin-top: 20px; }
            </style>
          </head>
          <body>
            <div class="success">
              <h1>Publicado en Instagram!</h1>
              <p style="font-size: 18px; opacity: 0.9;">${content.topic}</p>
              ${publishResult.data?.permalink ? `
                <a href="${publishResult.data.permalink}" class="btn">Ver en Instagram</a>
              ` : ''}
            </div>
            <p style="color: #6b7280; margin-top: 30px;">Recibiras una notificacion por email.</p>
          </body>
        </html>
      `, { headers: { 'Content-Type': 'text/html' } });
    }

    // Si no hay params, mostrar pendientes
    const supabase = supabaseAdmin;

    const { data: pending } = await supabase
      .from('scheduled_content')
      .select('*')
      .eq('status', 'ready')
      .order('created_at', { ascending: false })
      .limit(10);

    return NextResponse.json({
      success: true,
      data: {
        pendingCount: pending?.length || 0,
        pending: pending?.map(c => ({
          id: c.id,
          topic: c.topic,
          type: c.content_type,
          hasVideo: !!c.media_url,
          createdAt: c.created_at
        })) || []
      }
    });

  } catch (error: any) {
    return new Response(`
      <html>
        <body style="font-family: Arial; padding: 40px; max-width: 600px; margin: 0 auto; text-align: center;">
          <h1 style="color: #ef4444;">Error</h1>
          <p>${error.message}</p>
        </body>
      </html>
    `, { headers: { 'Content-Type': 'text/html' } });
  }
}
