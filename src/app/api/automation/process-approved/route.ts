import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/simple-client';
import { notifyVideoReady } from '@/lib/email/notifications';

/**
 * POST /api/automation/process-approved
 *
 * Procesa contenido aprobado y genera medios:
 * - REEL: genera video con HeyGen
 * - POST: busca imagen de stock
 * - CAROUSEL: genera slides con IA
 */

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { contentId } = body;

    if (!contentId) {
      return NextResponse.json({
        success: false,
        error: 'contentId requerido'
      }, { status: 400 });
    }

    const supabase = supabaseAdmin;
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    // Obtener contenido
    const { data: content, error } = await supabase
      .from('scheduled_content')
      .select('*')
      .eq('id', contentId)
      .single();

    if (error || !content) {
      return NextResponse.json({
        success: false,
        error: 'Contenido no encontrado'
      }, { status: 404 });
    }

    let mediaGenerated = false;
    let mediaUrl = null;

    // REEL: Generar video
    if (content.content_type === 'reel' && content.script) {
      console.log('Generando video para reel...');

      // Obtener avatar ID del metadata si está disponible
      const avatarFileId = content.metadata?.photo_drive_id || null;
      const avatarFilename = content.metadata?.photo_assigned || null;

      console.log('Avatar asignado:', avatarFilename);
      console.log('Google Drive ID:', avatarFileId);

      const videoResponse = await fetch(`${baseUrl}/api/video/talking-avatar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contentId,
          script: content.script,
          language: 'es',
          avatarFileId, // Pasar el ID específico del avatar
          avatarFilename // Para tracking
        })
      });

      const videoResult = await videoResponse.json();

      if (videoResult.success) {
        mediaUrl = videoResult.data?.videoUrl;
        mediaGenerated = true;

        await supabase
          .from('scheduled_content')
          .update({
            status: 'ready',
            media_url: mediaUrl
          })
          .eq('id', contentId);

        // Enviar email con video para revisión
        await notifyVideoReady(mediaUrl, contentId, content.topic);
      }
    }

    // POST o CAROUSEL: Marcar como listo (usará imágenes de stock o generará después)
    if (content.content_type === 'post' || content.content_type === 'carousel') {
      console.log(`Marcando ${content.content_type} como listo...`);

      await supabase
        .from('scheduled_content')
        .update({
          status: 'ready',
          metadata: {
            ...content.metadata,
            ready_for_manual_media: true,
            message: 'Añade imágenes manualmente o usa el generador'
          }
        })
        .eq('id', contentId);

      mediaGenerated = true;
    }

    return NextResponse.json({
      success: true,
      data: {
        contentId,
        type: content.content_type,
        status: mediaGenerated ? 'ready' : 'pending',
        mediaUrl,
        message: mediaGenerated
          ? `${content.content_type} procesado y listo`
          : 'Esperando generación de medios',
        nextStep: content.content_type === 'reel'
          ? 'Revisa tu email para aprobar el video'
          : 'Añade imágenes y publica desde el dashboard'
      }
    });

  } catch (error: any) {
    console.error('Error procesando contenido:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

// GET: Listar contenido aprobado pendiente de procesar
export async function GET() {
  try {
    const supabase = supabaseAdmin;

    const { data: pending } = await supabase
      .from('scheduled_content')
      .select('*')
      .eq('status', 'approved')
      .order('created_at', { ascending: false })
      .limit(10);

    return NextResponse.json({
      success: true,
      data: {
        pending: pending || [],
        count: pending?.length || 0
      }
    });

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
