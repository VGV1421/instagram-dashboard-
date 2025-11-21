import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/simple-client';

/**
 * GET /api/metrics/revenue-by-source
 *
 * Calcula ingresos por fuente de leads
 * - Revenue por canal de adquisición
 * - ROI por fuente
 * - Comparativa de rendimiento de canales
 */

export async function GET() {
  try {
    const supabase = supabaseAdmin;

    // Obtener todos los clientes
    const { data: clients, error } = await supabase
      .from('clients')
      .select('*');

    if (error) throw error;

    if (!clients || clients.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          total_revenue: 0,
          revenue_by_source: {},
          roi_by_source: {},
          top_sources: [],
          monthly_revenue: {},
          source_comparison: []
        }
      });
    }

    // Inversión por canal (configurable)
    const inversionPorCanal: { [key: string]: number } = {
      'instagram_organic': 0,
      'instagram_ads': 500,
      'instagram_stories': 200,
      'instagram_reels': 150,
      'facebook_ads': 300,
      'referidos': 50,
      'directo': 0,
      'organico': 0,
      'otro': 100
    };

    // Calcular ingresos por fuente
    const revenueBySource: { [key: string]: { revenue: number; clients: number; avg_value: number } } = {};
    const monthlyRevenue: { [key: string]: number } = {};
    let totalRevenue = 0;

    clients.forEach(client => {
      const source = client.source || 'organico';
      const clientValue = client.metadata?.valor_total ||
                         client.metadata?.revenue ||
                         client.metadata?.lifetime_value ||
                         100; // Valor estimado por defecto

      // Inicializar fuente si no existe
      if (!revenueBySource[source]) {
        revenueBySource[source] = { revenue: 0, clients: 0, avg_value: 0 };
      }

      revenueBySource[source].revenue += clientValue;
      revenueBySource[source].clients++;
      totalRevenue += clientValue;

      // Revenue mensual
      const createdMonth = new Date(client.created_at).toISOString().substring(0, 7);
      monthlyRevenue[createdMonth] = (monthlyRevenue[createdMonth] || 0) + clientValue;
    });

    // Calcular valores promedio por fuente
    Object.keys(revenueBySource).forEach(source => {
      if (revenueBySource[source].clients > 0) {
        revenueBySource[source].avg_value = parseFloat(
          (revenueBySource[source].revenue / revenueBySource[source].clients).toFixed(2)
        );
      }
    });

    // Calcular ROI por fuente
    const roiBySource: { [key: string]: { roi: number; profit: number; investment: number } } = {};

    Object.entries(revenueBySource).forEach(([source, data]) => {
      const investment = inversionPorCanal[source] || 100;
      const profit = data.revenue - investment;
      const roi = investment > 0 ? ((profit / investment) * 100) : (data.revenue > 0 ? 100 : 0);

      roiBySource[source] = {
        roi: parseFloat(roi.toFixed(2)),
        profit: parseFloat(profit.toFixed(2)),
        investment
      };
    });

    // Top fuentes por revenue
    const topSources = Object.entries(revenueBySource)
      .sort(([, a], [, b]) => b.revenue - a.revenue)
      .slice(0, 5)
      .map(([source, data]) => ({
        source,
        source_display: getSourceDisplayName(source),
        revenue: data.revenue,
        clients: data.clients,
        avg_value: data.avg_value,
        roi: roiBySource[source]?.roi || 0,
        percentage: totalRevenue > 0 ? parseFloat((data.revenue / totalRevenue * 100).toFixed(2)) : 0
      }));

    // Comparativa de fuentes para gráfico
    const sourceComparison = Object.entries(revenueBySource)
      .map(([source, data]) => ({
        source,
        source_display: getSourceDisplayName(source),
        revenue: data.revenue,
        clients: data.clients,
        investment: inversionPorCanal[source] || 100,
        roi: roiBySource[source]?.roi || 0,
        efficiency_score: calculateEfficiencyScore(data.revenue, inversionPorCanal[source] || 100)
      }))
      .sort((a, b) => b.efficiency_score - a.efficiency_score);

    // Calcular mejor y peor fuente
    const bestSource = sourceComparison[0];
    const worstSource = sourceComparison[sourceComparison.length - 1];

    // Tendencia mensual formateada
    const monthlyTrend = Object.entries(monthlyRevenue)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, revenue]) => ({
        month,
        revenue: parseFloat(revenue.toFixed(2))
      }));

    // Calcular totales
    const totalInvestment = Object.keys(revenueBySource)
      .reduce((sum, source) => sum + (inversionPorCanal[source] || 100), 0);

    const overallROI = totalInvestment > 0
      ? ((totalRevenue - totalInvestment) / totalInvestment * 100)
      : 0;

    return NextResponse.json({
      success: true,
      data: {
        total_revenue: parseFloat(totalRevenue.toFixed(2)),
        total_investment: totalInvestment,
        overall_roi: parseFloat(overallROI.toFixed(2)),
        total_clients: clients.length,
        avg_client_value: parseFloat((totalRevenue / clients.length).toFixed(2)),
        revenue_by_source: revenueBySource,
        roi_by_source: roiBySource,
        top_sources: topSources,
        source_comparison: sourceComparison,
        monthly_trend: monthlyTrend,
        insights: {
          best_source: bestSource ? {
            name: bestSource.source_display,
            roi: bestSource.roi,
            recommendation: `Aumentar inversión en ${bestSource.source_display}`
          } : null,
          worst_source: worstSource && worstSource.roi < 0 ? {
            name: worstSource.source_display,
            roi: worstSource.roi,
            recommendation: `Revisar estrategia de ${worstSource.source_display}`
          } : null,
          organic_vs_paid: calculateOrganicVsPaid(revenueBySource)
        }
      }
    });

  } catch (error: any) {
    console.error('Error calculating revenue by source:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Error al calcular ingresos por fuente'
    }, { status: 500 });
  }
}

// Funciones auxiliares
function getSourceDisplayName(source: string): string {
  const names: { [key: string]: string } = {
    'instagram_organic': 'Instagram Orgánico',
    'instagram_ads': 'Instagram Ads',
    'instagram_stories': 'Instagram Stories',
    'instagram_reels': 'Instagram Reels',
    'facebook_ads': 'Facebook Ads',
    'referidos': 'Referidos',
    'directo': 'Tráfico Directo',
    'organico': 'Orgánico',
    'otro': 'Otros'
  };
  return names[source] || source;
}

function calculateEfficiencyScore(revenue: number, investment: number): number {
  if (investment === 0) return revenue > 0 ? 100 : 0;
  const roi = (revenue - investment) / investment;
  // Normalizar a escala 0-100
  return Math.max(0, Math.min(100, 50 + (roi * 25)));
}

function calculateOrganicVsPaid(revenueBySource: { [key: string]: { revenue: number } }): {
  organic_revenue: number;
  paid_revenue: number;
  organic_percentage: number;
} {
  const organicSources = ['instagram_organic', 'organico', 'directo', 'referidos'];

  let organicRevenue = 0;
  let paidRevenue = 0;

  Object.entries(revenueBySource).forEach(([source, data]) => {
    if (organicSources.includes(source)) {
      organicRevenue += data.revenue;
    } else {
      paidRevenue += data.revenue;
    }
  });

  const total = organicRevenue + paidRevenue;

  return {
    organic_revenue: parseFloat(organicRevenue.toFixed(2)),
    paid_revenue: parseFloat(paidRevenue.toFixed(2)),
    organic_percentage: total > 0 ? parseFloat((organicRevenue / total * 100).toFixed(2)) : 0
  };
}
