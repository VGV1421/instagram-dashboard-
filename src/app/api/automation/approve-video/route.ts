import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/simple-client';
import { notifyVideoReady } from '@/lib/email/notifications';
import fs from 'fs/promises';
import path from 'path';

/**
 * GET /api/automation/approve-video?batchId=xxx&proposalId=xxx
 *
 * Aprueba una propuesta de video:
 * 1. Mueve el video a "VIDEO SELECCIONADO PARA PONER VOZ"
 * 2. Genera el video con voz usando ElevenLabs + FFmpeg
 * 3. Guarda en "VIDEOS FINALES"
 * 4. Envia email para ultimo OK antes de publicar
 */

const VIDEOS_BASE = 'C:\\Users\\Usuario\\CURSOR\\instagram-dashboard\\VIDEOS AVATAR SIN USAR SIN SONIDO';
const VIDEOS_SELECCIONADOS = 'C:\\Users\\Usuario\\CURSOR\\instagram-dashboard\\VIDEO SELECCIONADO PARA PONER VOZ';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const batchId = searchParams.get('batchId');
    const proposalId = searchParams.get('proposalId');

    if (!batchId || !proposalId) {
      return generateHTMLResponse('error', 'Faltan parametros batchId o proposalId');
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    // PASO 1: Buscar la propuesta en BD
    const { data: logEntry } = await supabaseAdmin
      .from('automation_logs')
      .select('*')
      .eq('execution_id', batchId)
      .eq('workflow_name', 'video-proposals')
      .single();

    if (!logEntry) {
      return generateHTMLResponse('error', 'Propuesta no encontrada');
    }

    const proposals = logEntry.metadata?.proposals || [];
    const selectedProposal = proposals.find((p: any) => p.id === proposalId);

    if (!selectedProposal) {
      return generateHTMLResponse('error', 'Propuesta especifica no encontrada');
    }

    const videoFilename = logEntry.metadata?.videoFilename;

    if (!videoFilename) {
      return generateHTMLResponse('error', 'No hay video asociado a esta propuesta');
    }

    console.log('Propuesta aprobada:', selectedProposal.topic);
    console.log('Video:', videoFilename);

    // PASO 2: Mover video a carpeta de seleccionados
    console.log('Moviendo video a seleccionados...');
    const sourcePath = path.join(VIDEOS_BASE, videoFilename);
    const destPath = path.join(VIDEOS_SELECCIONADOS, videoFilename);

    try {
      await fs.rename(sourcePath, destPath);
      console.log('   Video movido');
    } catch (moveError: any) {
      // Si ya esta movido o no existe, intentar copiar
      try {
        await fs.copyFile(sourcePath, destPath);
        console.log('   Video copiado');
      } catch {
        console.log('   Video ya procesado o no disponible');
      }
    }

    // PASO 3: Guardar contenido aprobado en BD
    const { data: savedContent, error: saveError } = await supabaseAdmin
      .from('scheduled_content')
      .insert({
        content_type: 'reel',
        topic: selectedProposal.topic,
        caption: selectedProposal.caption,
        script: selectedProposal.script,
        hashtags: selectedProposal.hashtags || [],
        engagement_prediction: selectedProposal.engagement_prediction,
        status: 'approved',
        metadata: {
          batch_id: batchId,
          proposal_id: proposalId,
          video_filename: videoFilename,
          approved_at: new Date().toISOString()
        }
      })
      .select()
      .single();

    if (saveError) {
      console.error('Error guardando:', saveError);
    }

    const contentId = savedContent?.id;

    // PASO 4: Generar video con voz
    console.log('Generando video con voz...');
    let videoResult = null;

    if (selectedProposal.script) {
      try {
        const voiceResponse = await fetch(`${baseUrl}/api/video/add-voice`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            script: selectedProposal.script,
            videoFilename,
            contentId
          })
        });

        videoResult = await voiceResponse.json();

        if (videoResult.success) {
          console.log('   Video con voz generado!');

          // Actualizar BD con URL del video
          if (contentId) {
            await supabaseAdmin
              .from('scheduled_content')
              .update({
                media_url: videoResult.data?.videoUrl,
                status: 'ready'
              })
              .eq('id', contentId);
          }
        } else {
          console.log('   Error generando video:', videoResult.error);
        }
      } catch (voiceError: any) {
        console.error('Error en generacion de voz:', voiceError);
        videoResult = { success: false, error: voiceError.message };
      }
    }

    // PASO 5: Actualizar estado en BD
    await supabaseAdmin
      .from('automation_logs')
      .update({
        status: 'success',
        metadata: {
          ...logEntry.metadata,
          status_real: 'approved',
          approved_proposal_id: proposalId,
          approved_at: new Date().toISOString(),
          video_generated: videoResult?.success || false,
          content_id: contentId
        }
      })
      .eq('execution_id', batchId);

    // PASO 6: Enviar email con video final
    if (videoResult?.success && videoResult.data?.videoUrl) {
      await notifyVideoReady(
        videoResult.data.videoUrl,
        contentId,
        selectedProposal.topic
      );
    }

    // Respuesta HTML
    if (videoResult?.success) {
      return generateHTMLResponse('success', 'Propuesta aprobada! Video generado.', {
        topic: selectedProposal.topic,
        videoUrl: videoResult.data?.videoUrl,
        message: 'Revisa tu email para dar el ultimo OK antes de publicar.'
      });
    } else {
      return generateHTMLResponse('partial', 'Propuesta aprobada pero hubo un problema con el video', {
        topic: selectedProposal.topic,
        error: videoResult?.error || 'Error desconocido',
        message: 'El video se generara manualmente.'
      });
    }

  } catch (error: any) {
    console.error('Error:', error);
    return generateHTMLResponse('error', error.message);
  }
}

function generateHTMLResponse(
  type: 'success' | 'error' | 'partial',
  message: string,
  data?: any
): Response {
  const bgColor = type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#f59e0b';

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${type === 'success' ? 'Aprobado!' : type === 'error' ? 'Error' : 'Procesando'}</title>
      <style>
        body { font-family: Arial, sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; background: linear-gradient(135deg, ${bgColor} 0%, ${bgColor}dd 100%); }
        .card { background: white; padding: 40px; border-radius: 16px; text-align: center; max-width: 500px; box-shadow: 0 20px 40px rgba(0,0,0,0.2); }
        h1 { color: ${bgColor}; margin-bottom: 20px; }
        p { color: #4b5563; font-size: 16px; line-height: 1.6; }
        .topic { background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0; }
        .btn { display: inline-block; padding: 15px 30px; border-radius: 8px; text-decoration: none; font-weight: bold; margin: 10px 5px; }
        .btn-primary { background: ${bgColor}; color: white; }
        .btn-secondary { background: #6b7280; color: white; }
        .message { background: #dbeafe; padding: 15px; border-radius: 8px; margin-top: 20px; color: #1e40af; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="card">
        <h1>${type === 'success' ? 'Propuesta Aprobada!' : type === 'error' ? 'Error' : 'Procesando...'}</h1>
        <p>${message}</p>

        ${data?.topic ? `<div class="topic"><strong>Tema:</strong> ${data.topic}</div>` : ''}

        ${data?.videoUrl ? `
          <a href="${data.videoUrl}" class="btn btn-primary" target="_blank">
            Ver Video Final
          </a>
        ` : ''}

        ${data?.message ? `<div class="message">${data.message}</div>` : ''}

        ${data?.error ? `<div class="message" style="background: #fef2f2; color: #991b1b;">${data.error}</div>` : ''}

        <div style="margin-top: 30px;">
          <a href="javascript:window.close()" class="btn btn-secondary">Cerrar</a>
        </div>
      </div>
    </body>
    </html>
  `;

  return new Response(html, {
    headers: { 'Content-Type': 'text/html' }
  });
}
