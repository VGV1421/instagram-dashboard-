import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/simple-client';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const severity = searchParams.get('severity');
    const isRead = searchParams.get('isRead');

    // Primero verificar que la tabla exista y tiene datos
    let query = supabaseAdmin
      .from('alerts')
      .select('id, client_id, alert_type, severity, message, metadata, created_at, status')
      .order('created_at', { ascending: false });

    // Filtros opcionales
    if (type && type !== 'all') {
      query = query.eq('alert_type', type);
    }

    if (severity && severity !== 'all') {
      query = query.eq('severity', severity as any);
    }

    // Solo aplicar filtro de status si la columna existe
    if (isRead !== null && isRead !== 'all') {
      const statusValue = isRead === 'true' ? 'read' : 'unread';
      query = query.eq('status', statusValue);
    }

    const { data: alerts, error } = await query.limit(100);

    if (error) {
      // Si el error es por columna que no existe, intentar sin esa columna
      if (error.message.includes('does not exist')) {
        console.log('Retrying without status column...');
        const { data: alertsNoStatus, error: error2 } = await supabaseAdmin
          .from('alerts')
          .select('id, client_id, alert_type, severity, message, metadata, created_at')
          .order('created_at', { ascending: false })
          .limit(100);

        if (error2) {
          console.error('Error fetching alerts (retry):', error2);
          return NextResponse.json({
            success: true,
            data: [],
            stats: { total: 0, unread: 0, byType: {}, bySeverity: {} }
          });
        }

        // Añadir status por defecto
        const alertsWithStatus = (alertsNoStatus || []).map(a => ({
          ...a,
          status: 'unread'
        }));

        return NextResponse.json({
          success: true,
          data: alertsWithStatus,
          stats: {
            total: alertsWithStatus.length,
            unread: alertsWithStatus.length,
            byType: {},
            bySeverity: {}
          }
        });
      }

      console.error('Error fetching alerts:', error);
      return NextResponse.json({
        success: true,
        data: [],
        stats: { total: 0, unread: 0, byType: {}, bySeverity: {} }
      });
    }

    // Calcular estadísticas desde los datos obtenidos
    const stats = {
      total: alerts?.length || 0,
      unread: alerts?.filter(a => a.status === 'unread' || !a.status).length || 0,
      byType: {
        low_engagement: alerts?.filter(a => a.alert_type === 'low_engagement').length || 0,
        viral_content: alerts?.filter(a => a.alert_type === 'viral_content').length || 0,
        low_reach: alerts?.filter(a => a.alert_type === 'low_reach').length || 0,
        sync_errors: alerts?.filter(a => a.alert_type === 'sync_errors').length || 0,
      },
      bySeverity: {
        info: alerts?.filter(a => a.severity === 'info').length || 0,
        warning: alerts?.filter(a => a.severity === 'warning').length || 0,
        error: alerts?.filter(a => a.severity === 'error').length || 0,
      },
    };

    return NextResponse.json({
      success: true,
      data: alerts || [],
      stats,
    });
  } catch (error: any) {
    console.error('Error in alerts API:', error);
    return NextResponse.json({
      success: true,
      data: [],
      stats: { total: 0, unread: 0, byType: {}, bySeverity: {} }
    });
  }
}
