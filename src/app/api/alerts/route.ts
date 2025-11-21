import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/simple-client';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const severity = searchParams.get('severity');
    const isRead = searchParams.get('isRead');

    let query = supabaseAdmin
      .from('alerts')
      .select('*')
      .order('created_at', { ascending: false });

    // Filtros opcionales
    if (type && type !== 'all') {
      query = query.eq('alert_type', type);
    }

    if (severity && severity !== 'all') {
      query = query.eq('severity', severity);
    }

    if (isRead !== null && isRead !== 'all') {
      const status = isRead === 'true' ? 'read' : 'unread';
      query = query.eq('status', status);
    }

    const { data: alerts, error } = await query.limit(100);

    if (error) {
      console.error('Error fetching alerts:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Contar alertas por categoría
    const { data: allAlerts } = await supabaseAdmin
      .from('alerts')
      .select('alert_type, severity, status');

    const stats = {
      total: allAlerts?.length || 0,
      unread: allAlerts?.filter(a => a.status === 'unread').length || 0,
      byType: {
        low_engagement: allAlerts?.filter(a => a.alert_type === 'low_engagement').length || 0,
        viral_content: allAlerts?.filter(a => a.alert_type === 'viral_content').length || 0,
        low_reach: allAlerts?.filter(a => a.alert_type === 'low_reach').length || 0,
        sync_errors: allAlerts?.filter(a => a.alert_type === 'sync_errors').length || 0,
      },
      bySeverity: {
        info: allAlerts?.filter(a => a.severity === 'info').length || 0,
        warning: allAlerts?.filter(a => a.severity === 'warning').length || 0,
        error: allAlerts?.filter(a => a.severity === 'error').length || 0,
      },
    };

    return NextResponse.json({
      success: true,
      data: alerts || [],
      stats,
    });
  } catch (error: any) {
    console.error('Error in alerts API:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
