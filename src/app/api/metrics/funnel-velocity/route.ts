import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/simple-client';

/**
 * GET /api/metrics/funnel-velocity
 *
 * Calcula la velocidad del embudo de ventas
 * - Tiempo promedio entre etapas
 * - Velocidad de conversión
 * - Cuellos de botella identificados
 */

// Etapas del embudo
const FUNNEL_STAGES = [
  'awareness',      // Conocimiento (primer contacto)
  'interest',       // Interés (engagement)
  'consideration',  // Consideración (consulta/pregunta)
  'intent',         // Intención (solicitud de info)
  'evaluation',     // Evaluación (propuesta/demo)
  'purchase'        // Compra
];

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
          average_cycle_days: 0,
          velocity_score: 0,
          stage_metrics: [],
          bottlenecks: [],
          conversion_by_stage: {},
          total_in_funnel: 0
        }
      });
    }

    // Analizar clientes por etapa
    const stageMetrics: { [key: string]: { count: number; avg_days: number; total_days: number } } = {};
    const stageTransitions: { from: string; to: string; avg_days: number }[] = [];

    FUNNEL_STAGES.forEach(stage => {
      stageMetrics[stage] = { count: 0, avg_days: 0, total_days: 0 };
    });

    const now = new Date();
    let totalCycleDays = 0;
    let completedCycles = 0;

    clients.forEach(client => {
      const createdDate = new Date(client.created_at);

      // Determinar etapa actual basada en metadata o status
      const currentStage = client.metadata?.funnel_stage ||
                          client.status ||
                          determineStageFromData(client);

      if (stageMetrics[currentStage]) {
        stageMetrics[currentStage].count++;

        // Calcular días en esta etapa
        const stageEntryDate = client.metadata?.stage_entry_date
          ? new Date(client.metadata.stage_entry_date)
          : createdDate;

        const daysInStage = Math.floor((now.getTime() - stageEntryDate.getTime()) / (1000 * 60 * 60 * 24));
        stageMetrics[currentStage].total_days += daysInStage;
      }

      // Si es cliente (purchase), calcular ciclo completo
      if (currentStage === 'purchase' || client.metadata?.is_customer === true) {
        const purchaseDate = client.metadata?.purchase_date
          ? new Date(client.metadata.purchase_date)
          : new Date(client.updated_at || client.created_at);

        const cycleDays = Math.floor((purchaseDate.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
        totalCycleDays += cycleDays;
        completedCycles++;
      }
    });

    // Calcular promedios por etapa
    Object.keys(stageMetrics).forEach(stage => {
      if (stageMetrics[stage].count > 0) {
        stageMetrics[stage].avg_days = Math.round(
          stageMetrics[stage].total_days / stageMetrics[stage].count
        );
      }
    });

    // Identificar cuellos de botella (etapas con tiempo promedio alto)
    const avgDaysOverall = Object.values(stageMetrics)
      .filter(s => s.count > 0)
      .reduce((sum, s) => sum + s.avg_days, 0) /
      Object.values(stageMetrics).filter(s => s.count > 0).length || 1;

    const bottlenecks = Object.entries(stageMetrics)
      .filter(([_, data]) => data.avg_days > avgDaysOverall * 1.5 && data.count > 0)
      .map(([stage, data]) => ({
        stage,
        avg_days: data.avg_days,
        severity: data.avg_days > avgDaysOverall * 2 ? 'high' : 'medium',
        recommendation: getBottleneckRecommendation(stage)
      }));

    // Calcular conversiones entre etapas
    const conversionByStage: { [key: string]: { count: number; rate: number } } = {};
    let previousCount = clients.length;

    FUNNEL_STAGES.forEach((stage, idx) => {
      const stageCount = stageMetrics[stage].count;
      const cumulativeCount = FUNNEL_STAGES.slice(idx)
        .reduce((sum, s) => sum + (stageMetrics[s]?.count || 0), 0);

      conversionByStage[stage] = {
        count: cumulativeCount,
        rate: previousCount > 0 ? parseFloat((cumulativeCount / previousCount * 100).toFixed(2)) : 0
      };
      previousCount = cumulativeCount > 0 ? cumulativeCount : previousCount;
    });

    // Calcular velocidad del embudo (0-100)
    const averageCycleDays = completedCycles > 0 ? totalCycleDays / completedCycles : 30;
    const velocityScore = Math.max(0, Math.min(100, 100 - (averageCycleDays / 2)));

    // Formatear métricas de etapas para respuesta
    const formattedStageMetrics = FUNNEL_STAGES.map(stage => ({
      stage,
      stage_name: getStageDisplayName(stage),
      count: stageMetrics[stage].count,
      avg_days: stageMetrics[stage].avg_days,
      percentage: clients.length > 0
        ? parseFloat((stageMetrics[stage].count / clients.length * 100).toFixed(2))
        : 0
    }));

    return NextResponse.json({
      success: true,
      data: {
        average_cycle_days: Math.round(averageCycleDays),
        velocity_score: parseFloat(velocityScore.toFixed(2)),
        velocity_status: getVelocityStatus(velocityScore),
        total_in_funnel: clients.length,
        completed_conversions: completedCycles,
        stage_metrics: formattedStageMetrics,
        conversion_by_stage: conversionByStage,
        bottlenecks,
        recommendations: generateRecommendations(stageMetrics, bottlenecks),
        funnel_health: {
          score: velocityScore,
          status: getVelocityStatus(velocityScore),
          color: getVelocityColor(velocityScore)
        }
      }
    });

  } catch (error: any) {
    console.error('Error calculating funnel velocity:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Error al calcular velocidad del embudo'
    }, { status: 500 });
  }
}

// Funciones auxiliares
function determineStageFromData(client: any): string {
  // Lógica simplificada para determinar etapa basada en datos disponibles
  if (client.metadata?.is_customer || client.metadata?.has_purchased) {
    return 'purchase';
  }
  if (client.metadata?.requested_demo || client.metadata?.requested_proposal) {
    return 'evaluation';
  }
  if (client.metadata?.requested_info) {
    return 'intent';
  }
  if (client.metadata?.asked_question || client.metadata?.sent_message) {
    return 'consideration';
  }
  if (client.metadata?.engagement_rate > 0 || client.metadata?.interactions > 0) {
    return 'interest';
  }
  return 'awareness';
}

function getStageDisplayName(stage: string): string {
  const names: { [key: string]: string } = {
    'awareness': 'Conocimiento',
    'interest': 'Interés',
    'consideration': 'Consideración',
    'intent': 'Intención',
    'evaluation': 'Evaluación',
    'purchase': 'Compra'
  };
  return names[stage] || stage;
}

function getBottleneckRecommendation(stage: string): string {
  const recommendations: { [key: string]: string } = {
    'awareness': 'Aumentar frecuencia de publicaciones y alcance',
    'interest': 'Mejorar contenido para generar más engagement',
    'consideration': 'Responder más rápido a consultas',
    'intent': 'Crear contenido de valor que responda preguntas frecuentes',
    'evaluation': 'Simplificar proceso de propuestas/demos',
    'purchase': 'Facilitar proceso de compra'
  };
  return recommendations[stage] || 'Revisar proceso de esta etapa';
}

function getVelocityStatus(score: number): string {
  if (score >= 80) return 'excelente';
  if (score >= 60) return 'bueno';
  if (score >= 40) return 'regular';
  return 'lento';
}

function getVelocityColor(score: number): string {
  if (score >= 80) return 'green';
  if (score >= 60) return 'yellow';
  if (score >= 40) return 'orange';
  return 'red';
}

function generateRecommendations(
  stageMetrics: { [key: string]: { count: number; avg_days: number } },
  bottlenecks: any[]
): string[] {
  const recommendations: string[] = [];

  // Recomendaciones basadas en cuellos de botella
  bottlenecks.forEach(bn => {
    recommendations.push(`Optimizar etapa "${getStageDisplayName(bn.stage)}": ${bn.recommendation}`);
  });

  // Recomendaciones generales basadas en distribución
  const awarenessCount = stageMetrics['awareness']?.count || 0;
  const purchaseCount = stageMetrics['purchase']?.count || 0;

  if (awarenessCount > 0 && purchaseCount / awarenessCount < 0.05) {
    recommendations.push('Tasa de conversión baja (<5%). Revisar estrategia de nurturing.');
  }

  if (recommendations.length === 0) {
    recommendations.push('El embudo está funcionando correctamente. Continuar monitoreando.');
  }

  return recommendations.slice(0, 5); // Máximo 5 recomendaciones
}
