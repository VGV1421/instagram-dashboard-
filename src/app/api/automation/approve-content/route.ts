import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/simple-client';
import { notifyVideoReady, notifyError } from '@/lib/email/notifications';

/**
 * POST /api/automation/approve-content
 *
 * Recibe la aprobacion del usuario y genera el video.
 *
 * Body:
 * - batchId: ID del batch de propuestas
 * - proposalIndex: Indice de la propuesta seleccionada (0, 1, 2...)
 * - proposalId: ID especifico de la propuesta (alternativa)
 */

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { batchId, proposalIndex, proposalId } = body;

    if (!batchId && !proposalId) {
      return NextResponse.json({
        success: false,
        error: 'Se requiere batchId o proposalId'
      }, { status: 400 });
    }

    const supabase = supabaseAdmin;
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    // PASO 1: Buscar las propuestas
    let proposals: any[] = [];

    // Buscar en automation_logs
    const { data: logEntry } = await supabase
      .from('automation_logs')
      .select('*')
      .eq('execution_id', batchId)
      .eq('workflow_name', 'content-proposals')
      .single();

    // Buscar propuestas en metadata (compatible con schema actual) o execution_data
    if (logEntry?.metadata?.proposals) {
      proposals = logEntry.metadata.proposals;
    } else if (logEntry?.execution_data?.proposals) {
      proposals = logEntry.execution_data.proposals;
    }

    if (proposals.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No se encontraron propuestas para este batch'
      }, { status: 404 });
    }

    // PASO 2: Obtener la propuesta seleccionada
    let selectedProposal;

    if (proposalId) {
      selectedProposal = proposals.find((p: any) => p.id === proposalId);
    } else if (typeof proposalIndex === 'number') {
      selectedProposal = proposals[proposalIndex];
    }

    if (!selectedProposal) {
      return NextResponse.json({
        success: false,
        error: 'Propuesta no encontrada',
        availableIndices: proposals.map((_: any, i: number) => i),
        availableIds: proposals.map((p: any) => p.id)
      }, { status: 400 });
    }

    console.log('Propuesta seleccionada:', selectedProposal.topic);

    // PASO 3: Guardar contenido en scheduled_content
    const { data: savedContent, error: saveError } = await supabase
      .from('scheduled_content')
      .insert({
        content_type: selectedProposal.type,
        topic: selectedProposal.topic,
        caption: selectedProposal.caption,
        script: selectedProposal.script || null,
        hashtags: selectedProposal.hashtags || [],
        engagement_prediction: selectedProposal.engagement_prediction,
        status: 'approved',
        metadata: {
          batch_id: batchId,
          proposal_id: selectedProposal.id,
          photo_assigned: selectedProposal.photo,
          approved_at: new Date().toISOString()
        }
      })
      .select()
      .single();

    if (saveError) {
      console.error('Error guardando contenido:', saveError);
    }

    const contentId = savedContent?.id;

    // PASO 4: Generar video si es un reel y tiene script
    let videoResult = null;

    if (selectedProposal.type === 'reel' && selectedProposal.script) {
      console.log('Generando video con D-ID...');

      try {
        const videoResponse = await fetch(`${baseUrl}/api/video/talking-avatar`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contentId,
            script: selectedProposal.script,
            language: 'es'
          })
        });

        videoResult = await videoResponse.json();

        if (videoResult.success) {
          console.log('Video generado:', videoResult.data?.videoUrl);

          // Actualizar estado
          if (contentId) {
            await supabase
              .from('scheduled_content')
              .update({
                status: 'ready',
                media_url: videoResult.data?.videoUrl
              })
              .eq('id', contentId);
          }
        } else {
          console.error('Error generando video:', videoResult.error);
        }
      } catch (videoError: any) {
        console.error('Error en generacion de video:', videoError);
        videoResult = { success: false, error: videoError.message };
      }
    }

    // PASO 5: Marcar batch como procesado (usar metadata para compatibilidad)
    await supabase
      .from('automation_logs')
      .update({
        status: 'success', // 'approved' requiere actualizar constraint, usar 'success'
        metadata: {
          ...logEntry?.metadata,
          status_real: 'approved',
          approved_proposal: selectedProposal.id,
          approved_at: new Date().toISOString(),
          video_generated: videoResult?.success || false
        }
      })
      .eq('execution_id', batchId);

    // PASO 6: Enviar notificacion con video para revision
    if (videoResult?.success && videoResult.data?.videoUrl) {
      await notifyVideoReady(
        videoResult.data.videoUrl,
        contentId,
        selectedProposal.topic
      );
    }

    // PASO 7: Si es un POST (no reel), publicar directamente
    let publishResult = null;
    if (selectedProposal.type === 'post' && selectedProposal.photoPath) {
      // Para posts con imagen, necesitamos una URL publica
      // Por ahora solo notificamos que esta listo
      console.log('Post listo para publicar manualmente');
    }

    return NextResponse.json({
      success: true,
      data: {
        message: 'Propuesta aprobada exitosamente',
        contentId,
        proposal: {
          type: selectedProposal.type,
          topic: selectedProposal.topic,
          photo: selectedProposal.photo
        },
        video: videoResult?.success ? {
          url: videoResult.data?.videoUrl,
          status: videoResult.data?.status,
          message: 'Video generado! Recibiras un email para aprobar y publicar.'
        } : null,
        nextSteps: videoResult?.success
          ? 'Video generado! Revisa tu email para aprobar y publicar automaticamente.'
          : selectedProposal.type === 'reel'
            ? 'El video esta siendo procesado...'
            : 'Contenido guardado. Listo para publicar.'
      }
    });

  } catch (error: any) {
    console.error('Error:', error);
    await notifyError(`Error aprobando contenido: ${error.message}`);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

// GET: Ver estado de aprobaciones
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const batchId = searchParams.get('batchId');

    const supabase = supabaseAdmin;

    if (batchId) {
      // Buscar batch especifico
      const { data } = await supabase
        .from('automation_logs')
        .select('*')
        .eq('execution_id', batchId)
        .single();

      return NextResponse.json({
        success: true,
        data: {
          batch: data,
          proposals: data?.execution_data?.proposals || [],
          status: data?.status
        }
      });
    }

    // Listar todos los pendientes
    const { data: pending } = await supabase
      .from('automation_logs')
      .select('*')
      .eq('workflow_name', 'content-proposals')
      .in('status', ['pending_approval', 'approved'])
      .order('created_at', { ascending: false })
      .limit(10);

    return NextResponse.json({
      success: true,
      data: {
        batches: pending || [],
        count: pending?.length || 0
      }
    });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message });
  }
}
