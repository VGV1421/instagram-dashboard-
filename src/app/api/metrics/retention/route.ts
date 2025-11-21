import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/simple-client';

/**
 * GET /api/metrics/retention
 *
 * Calcula métricas de Retención y Recurrencia de clientes
 * - Tasa de retención mensual
 * - Churn rate
 * - Clientes recurrentes vs nuevos
 * - Cohort analysis simplificado
 */

export async function GET() {
  try {
    const supabase = supabaseAdmin;

    // Obtener todos los clientes
    const { data: clients, error } = await supabase
      .from('clients')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) throw error;

    if (!clients || clients.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          retention_rate: 0,
          churn_rate: 0,
          recurring_customers: 0,
          new_customers: 0,
          total_customers: 0,
          monthly_cohorts: {},
          retention_by_month: []
        }
      });
    }

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

    // Clasificar clientes
    let newCustomers = 0;
    let recurringCustomers = 0;
    let activeCustomers = 0;
    let churnedCustomers = 0;

    // Análisis por cohortes mensuales
    const cohorts: { [key: string]: { total: number; retained: number; churned: number } } = {};

    // Retención por mes
    const retentionByMonth: { [key: string]: { start: number; retained: number } } = {};

    clients.forEach(client => {
      const createdDate = new Date(client.created_at);
      const cohortMonth = createdDate.toISOString().substring(0, 7); // YYYY-MM

      // Inicializar cohorte si no existe
      if (!cohorts[cohortMonth]) {
        cohorts[cohortMonth] = { total: 0, retained: 0, churned: 0 };
      }
      cohorts[cohortMonth].total++;

      // Determinar si es nuevo (últimos 30 días)
      if (createdDate >= thirtyDaysAgo) {
        newCustomers++;
      }

      // Determinar actividad basada en metadata o última actualización
      const lastActivity = client.metadata?.last_activity
        ? new Date(client.metadata.last_activity)
        : new Date(client.updated_at || client.created_at);

      const isActive = lastActivity >= thirtyDaysAgo;
      const hasMultiplePurchases = (client.metadata?.frecuencia_compra || 0) > 1;

      if (isActive) {
        activeCustomers++;
        cohorts[cohortMonth].retained++;

        if (hasMultiplePurchases) {
          recurringCustomers++;
        }
      } else {
        // Cliente inactivo por más de 30 días = churned
        if (createdDate < thirtyDaysAgo) {
          churnedCustomers++;
          cohorts[cohortMonth].churned++;
        }
      }
    });

    // Calcular tasas
    const totalCustomers = clients.length;
    const customersOlderThan30Days = clients.filter(c => new Date(c.created_at) < thirtyDaysAgo).length;

    // Tasa de retención = clientes activos / clientes con más de 30 días
    const retentionRate = customersOlderThan30Days > 0
      ? (activeCustomers / customersOlderThan30Days) * 100
      : 100;

    // Churn rate = clientes perdidos / clientes con más de 30 días
    const churnRate = customersOlderThan30Days > 0
      ? (churnedCustomers / customersOlderThan30Days) * 100
      : 0;

    // Tasa de recurrencia = clientes con múltiples compras / total
    const recurrenceRate = totalCustomers > 0
      ? (recurringCustomers / totalCustomers) * 100
      : 0;

    // Formatear cohortes para respuesta
    const formattedCohorts = Object.entries(cohorts)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, data]) => ({
        month,
        total: data.total,
        retained: data.retained,
        churned: data.churned,
        retention_rate: data.total > 0 ? parseFloat((data.retained / data.total * 100).toFixed(2)) : 0
      }));

    // Calcular tendencia de retención (últimos 6 meses)
    const last6Months = formattedCohorts.slice(-6);

    // Métricas de salud
    let healthStatus = 'critical';
    let healthColor = 'red';
    if (retentionRate >= 80) {
      healthStatus = 'excellent';
      healthColor = 'green';
    } else if (retentionRate >= 60) {
      healthStatus = 'good';
      healthColor = 'yellow';
    } else if (retentionRate >= 40) {
      healthStatus = 'needs_improvement';
      healthColor = 'orange';
    }

    return NextResponse.json({
      success: true,
      data: {
        retention_rate: parseFloat(retentionRate.toFixed(2)),
        churn_rate: parseFloat(churnRate.toFixed(2)),
        recurrence_rate: parseFloat(recurrenceRate.toFixed(2)),
        recurring_customers: recurringCustomers,
        new_customers: newCustomers,
        active_customers: activeCustomers,
        churned_customers: churnedCustomers,
        total_customers: totalCustomers,
        health_status: healthStatus,
        health_color: healthColor,
        cohorts: formattedCohorts,
        last_6_months_trend: last6Months,
        metrics_explanation: {
          retention_rate: 'Porcentaje de clientes que siguen activos después de 30 días',
          churn_rate: 'Porcentaje de clientes que dejaron de interactuar',
          recurrence_rate: 'Porcentaje de clientes con compras repetidas'
        }
      }
    });

  } catch (error: any) {
    console.error('Error calculating retention metrics:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Error al calcular métricas de retención'
    }, { status: 500 });
  }
}
