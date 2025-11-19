/**
 * API Route: n8n Workflow Logs
 *
 * POST /api/n8n/log
 *
 * Recibe logs de ejecución de workflows n8n y los guarda en Supabase
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/simple-client';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      workflow_name,
      execution_id,
      status,
      data,
      posts_synced,
      client_username
    } = body;

    // Obtener client_id si se proporciona el username
    let clientId = null;
    if (client_username) {
      const { data: client } = await supabaseAdmin
        .from('clients')
        .select('id')
        .eq('instagram_username', client_username)
        .single();

      if (client) {
        clientId = client.id;
      }
    }

    // Preparar metadata
    const metadata = typeof data === 'string' ? JSON.parse(data) : data;

    // Guardar log en Supabase
    const { data: logData, error: logError } = await supabaseAdmin
      .from('automation_logs')
      .insert({
        client_id: clientId,
        workflow_name,
        execution_id,
        status,
        posts_ingested: posts_synced || 0,
        metadata
      })
      .select('id')
      .single();

    if (logError) {
      console.error('Error guardando log:', logError);
      return NextResponse.json(
        {
          success: false,
          error: logError.message
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      log_id: logData.id,
      message: 'Log guardado exitosamente'
    });

  } catch (error) {
    console.error('Error processing n8n log:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}
