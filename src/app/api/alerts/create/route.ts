/**
 * API Route: Create Alerts
 *
 * POST /api/alerts/create
 *
 * Crea alertas en Supabase desde workflows n8n
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/simple-client';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { alerts, summary } = body;

    // Parsear alerts si viene como string
    const alertsArray = typeof alerts === 'string' ? JSON.parse(alerts) : alerts;
    const summaryData = typeof summary === 'string' ? JSON.parse(summary) : summary;

    // Obtener el client_id del usuario
    const { data: client, error: clientError } = await supabaseAdmin
      .from('clients')
      .select('id')
      .eq('instagram_username', summaryData.client.username)
      .single();

    if (clientError || !client) {
      console.error('Error obteniendo cliente:', clientError);
      return NextResponse.json(
        { success: false, error: 'Cliente no encontrado' },
        { status: 404 }
      );
    }

    // Insertar cada alerta
    const insertPromises = alertsArray.map((alert: any) => {
      return supabaseAdmin
        .from('alerts')
        .insert({
          client_id: client.id,
          alert_type: alert.type,
          severity: alert.severity,
          title: alert.message.substring(0, 100), // Primeros 100 caracteres como título
          message: alert.message,
          metadata: {
            value: alert.value,
            metrics: summaryData.metrics
          },
          status: 'unread'
        });
    });

    const results = await Promise.all(insertPromises);

    // Verificar si hubo errores
    const errors = results.filter(r => r.error);
    if (errors.length > 0) {
      console.error('Errores al crear alertas:', errors);
      return NextResponse.json(
        {
          success: false,
          error: 'Error al crear algunas alertas',
          details: errors
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      alerts_created: alertsArray.length,
      message: `${alertsArray.length} alerta(s) creada(s) exitosamente`
    });

  } catch (error) {
    console.error('Error creating alerts:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}
