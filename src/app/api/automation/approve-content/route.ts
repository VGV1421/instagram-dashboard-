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
        engagement_prediction: selectedProposal.engagement_prediction || 'media',
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
      console.error('❌ Error guardando contenido:', saveError);
      return NextResponse.json({
        success: false,
        error: `Error al guardar contenido: ${saveError.message}`,
        details: saveError
      }, { status: 500 });
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

// GET: Aprobar desde link de email o ver estado
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const batchId = searchParams.get('batchId');
    const proposalIndexStr = searchParams.get('proposalIndex');

    const supabase = supabaseAdmin;
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    // Si viene con proposalIndex, es una aprobación desde email
    if (batchId && proposalIndexStr !== null) {
      const proposalIndex = parseInt(proposalIndexStr);

      console.log(`🔔 Aprobación recibida: batch=${batchId}, index=${proposalIndex}`);

      // EJECUTAR LA LÓGICA DE APROBACIÓN DIRECTAMENTE (no HTTP call)

      // PASO 1: Buscar las propuestas
      let proposals: any[] = [];
      console.log(`🔍 Buscando batch: ${batchId}`);

      // Primero intentar con v2, luego con v1 (backward compatibility)
      let { data: logEntry, error: v2Error } = await supabase
        .from('automation_logs')
        .select('*')
        .eq('execution_id', batchId)
        .eq('workflow_name', 'content-proposals-v2')
        .single();

      console.log(`📊 Búsqueda V2:`, { logEntry: !!logEntry, error: v2Error?.message });

      // Si no encuentra v2, intentar con v1
      if (!logEntry) {
        const { data: logEntryV1, error: v1Error } = await supabase
          .from('automation_logs')
          .select('*')
          .eq('execution_id', batchId)
          .eq('workflow_name', 'content-proposals')
          .single();
        logEntry = logEntryV1;
        console.log(`📊 Búsqueda V1:`, { logEntry: !!logEntry, error: v1Error?.message });
      }

      console.log(`📦 logEntry encontrado:`, !!logEntry);
      console.log(`📦 metadata:`, !!logEntry?.metadata);
      console.log(`📦 metadata.proposals:`, !!logEntry?.metadata?.proposals);
      console.log(`📦 execution_data:`, !!logEntry?.execution_data);

      if (logEntry?.metadata?.proposals) {
        proposals = logEntry.metadata.proposals;
        console.log(`✅ Propuestas encontradas en metadata: ${proposals.length}`);
      } else if (logEntry?.execution_data?.proposals) {
        proposals = logEntry.execution_data.proposals;
        console.log(`✅ Propuestas encontradas en execution_data: ${proposals.length}`);
      }

      if (proposals.length === 0) {
        console.error(`❌ NO SE ENCONTRARON PROPUESTAS`);
        console.error(`   batchId: ${batchId}`);
        console.error(`   logEntry existe: ${!!logEntry}`);
        return new Response(`
          <html>
            <head><meta charset="UTF-8"></head>
            <body style="font-family: monospace; padding: 20px; font-size: 12px;">
              <h1 style="color: #ef4444;">❌ Debug Info</h1>
              <div style="background: #f3f4f6; padding: 10px; border-radius: 5px; text-align: left;">
                <p><strong>Batch ID:</strong> ${batchId}</p>
                <p><strong>Proposal Index:</strong> ${proposalIndex}</p>
                <p><strong>logEntry encontrado:</strong> ${!!logEntry ? 'SÍ' : 'NO'}</p>
                <p><strong>v2Error:</strong> ${v2Error?.message || 'ninguno'}</p>
                <p><strong>metadata existe:</strong> ${!!logEntry?.metadata ? 'SÍ' : 'NO'}</p>
                <p><strong>metadata.proposals existe:</strong> ${!!logEntry?.metadata?.proposals ? 'SÍ' : 'NO'}</p>
                <p><strong>execution_data existe:</strong> ${!!logEntry?.execution_data ? 'SÍ' : 'NO'}</p>
                ${logEntry ? `
                  <hr>
                  <p><strong>metadata keys:</strong> ${Object.keys(logEntry.metadata || {}).join(', ')}</p>
                  <p><strong>workflow_name:</strong> ${logEntry.workflow_name}</p>
                ` : ''}
              </div>
            </body>
          </html>
        `, { headers: { 'Content-Type': 'text/html' } });
      }

      // PASO 2: Obtener la propuesta seleccionada
      const selectedProposal = proposals[proposalIndex];

      if (!selectedProposal) {
        return new Response(`
          <html>
            <body style="font-family: Arial; padding: 40px; text-align: center;">
              <h1 style="color: #ef4444;">❌ Error</h1>
              <p>Propuesta no encontrada</p>
            </body>
          </html>
        `, { headers: { 'Content-Type': 'text/html' } });
      }

      console.log('✅ Propuesta seleccionada:', selectedProposal.topic);

      // PASO 3: Guardar contenido en scheduled_content
      const { data: savedContent, error: saveError } = await supabase
        .from('scheduled_content')
        .insert({
          content_type: selectedProposal.type,
          topic: selectedProposal.topic,
          caption: selectedProposal.caption,
          script: selectedProposal.script || null,
          hashtags: selectedProposal.hashtags || [],
          engagement_prediction: selectedProposal.engagement_prediction || 'media',
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
        console.error('❌ Error guardando contenido:', saveError);
        return new Response(`
          <html>
            <body style="font-family: Arial; padding: 40px; text-align: center;">
              <h1 style="color: #ef4444;">❌ Error al Aprobar</h1>
              <p>No se pudo guardar el contenido en la base de datos</p>
              <p style="color: #888; font-size: 14px; margin-top: 20px;">Error: ${saveError.message}</p>
              <details style="margin-top: 20px; text-align: left;">
                <summary>Detalles técnicos</summary>
                <pre style="background: #f3f4f6; padding: 10px; border-radius: 5px; overflow-x: auto;">${JSON.stringify(saveError, null, 2)}</pre>
              </details>
            </body>
          </html>
        `, { headers: { 'Content-Type': 'text/html' } });
      }

      const contentId = savedContent?.id;
      console.log('💾 Contenido guardado con ID:', contentId);

      // PASO 4: DISPARAR GENERACIÓN DE VIDEO ASÍNCRONA (no esperar)
      if (selectedProposal.type === 'reel' && selectedProposal.script && contentId) {
        console.log('🎬 Iniciando generación de video en background...');

        // Llamar al endpoint de proceso en background (fire and forget)
        fetch(`${baseUrl}/api/automation/process-approved`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contentId })
        }).catch(err => console.error('Error disparando video:', err));
      }

      // PASO 5: Marcar batch como procesado
      await supabase
        .from('automation_logs')
        .update({
          status: 'success',
          metadata: {
            ...logEntry?.metadata,
            status_real: 'approved',
            approved_proposal: selectedProposal.id,
            approved_at: new Date().toISOString()
          }
        })
        .eq('execution_id', batchId);

      // PASO 6: Devolver HTML de confirmación inmediata
      const isReel = selectedProposal.type === 'reel';

      return new Response(`
        <html>
          <head>
            <meta charset="UTF-8">
            <style>
              body { font-family: Arial; padding: 40px; max-width: 600px; margin: 0 auto; text-align: center; background: #f9fafb; }
              .success { background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 40px; border-radius: 15px; margin-bottom: 20px; }
              .details { background: white; padding: 20px; border-radius: 10px; text-align: left; }
              .btn { display: inline-block; background: #667eea; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin: 10px; }
            </style>
          </head>
          <body>
            <div class="success">
              <h1>✅ Propuesta Aprobada!</h1>
              <p style="font-size: 18px; opacity: 0.9;">Tu contenido ha sido guardado exitosamente</p>
            </div>

            <div class="details">
              <h3>📋 Detalles:</h3>
              <p><strong>Tipo:</strong> ${selectedProposal.type}</p>
              <p><strong>Tema:</strong> ${selectedProposal.topic}</p>
              ${isReel ? `
                <p style="background: #fef3c7; padding: 10px; border-radius: 5px; color: #92400e;">
                  🎬 El video se está generando con HeyGen (1-3 min). Recibirás un email cuando esté listo.
                </p>
              ` : `
                <p style="background: #dbeafe; padding: 10px; border-radius: 5px; color: #1e40af;">
                  📸 Listo para añadir imágenes desde el dashboard
                </p>
              `}
            </div>

            <div style="margin-top: 30px;">
              <a href="${baseUrl}" class="btn">Ir al Dashboard</a>
            </div>

            <p style="color: #888; font-size: 12px; margin-top: 30px;">
              Puedes cerrar esta pestaña
            </p>
          </body>
        </html>
      `, { headers: { 'Content-Type': 'text/html' } });
    }

    // Consulta de estado de batch
    if (batchId) {
      const { data } = await supabase
        .from('automation_logs')
        .select('*')
        .eq('execution_id', batchId)
        .single();

      return NextResponse.json({
        success: true,
        data: {
          batch: data,
          proposals: data?.execution_data?.proposals || data?.metadata?.proposals || [],
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
