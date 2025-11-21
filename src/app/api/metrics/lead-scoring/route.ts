import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/simple-client';

/**
 * GET /api/metrics/lead-scoring
 *
 * Sistema de Lead Scoring para clasificar leads en MQL y SQL
 * MQL = Marketing Qualified Lead (interesado pero no listo para comprar)
 * SQL = Sales Qualified Lead (listo para comprar)
 */

interface LeadScore {
  client_id: string;
  username: string;
  score: number;
  classification: 'cold' | 'warm' | 'MQL' | 'SQL';
  factors: {
    engagement: number;
    recency: number;
    frequency: number;
    source_quality: number;
  };
}

export async function GET() {
  try {
    const supabase = supabaseAdmin;

    // Obtener todos los clientes con sus datos
    const { data: clients, error } = await supabase
      .from('clients')
      .select('*');

    if (error) throw error;

    if (!clients || clients.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          total_leads: 0,
          cold_leads: 0,
          warm_leads: 0,
          mql_count: 0,
          sql_count: 0,
          conversion_rate_mql: 0,
          conversion_rate_sql: 0,
          leads_by_score: [],
          distribution: {}
        }
      });
    }

    const now = new Date();
    const leads: LeadScore[] = [];

    // Puntuación por fuente (calidad del canal)
    const sourceScores: { [key: string]: number } = {
      'referidos': 30,
      'instagram_ads': 25,
      'facebook_ads': 20,
      'instagram_reels': 18,
      'instagram_stories': 15,
      'instagram_organic': 12,
      'organico': 10,
      'directo': 8,
      'otro': 5
    };

    clients.forEach(client => {
      // 1. Puntuación por engagement (basado en metadata)
      const engagementScore = Math.min(
        (client.metadata?.engagement_rate || 0) * 10 +
        (client.metadata?.interactions || 0) * 2,
        30
      );

      // 2. Puntuación por recencia (días desde última actividad)
      const lastActivity = client.metadata?.last_activity
        ? new Date(client.metadata.last_activity)
        : new Date(client.created_at);
      const daysSinceActivity = Math.floor((now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24));

      let recencyScore = 0;
      if (daysSinceActivity <= 7) recencyScore = 25;
      else if (daysSinceActivity <= 14) recencyScore = 20;
      else if (daysSinceActivity <= 30) recencyScore = 15;
      else if (daysSinceActivity <= 60) recencyScore = 10;
      else recencyScore = 5;

      // 3. Puntuación por frecuencia de compra
      const purchaseFrequency = client.metadata?.frecuencia_compra || 0;
      const frequencyScore = Math.min(purchaseFrequency * 10, 25);

      // 4. Puntuación por calidad de fuente
      const source = client.source || 'organico';
      const sourceQualityScore = sourceScores[source] || 5;

      // Calcular puntuación total (máximo 100)
      const totalScore = Math.min(
        engagementScore + recencyScore + frequencyScore + sourceQualityScore,
        100
      );

      // Clasificación basada en puntuación
      let classification: 'cold' | 'warm' | 'MQL' | 'SQL';
      if (totalScore >= 70) {
        classification = 'SQL';
      } else if (totalScore >= 50) {
        classification = 'MQL';
      } else if (totalScore >= 30) {
        classification = 'warm';
      } else {
        classification = 'cold';
      }

      leads.push({
        client_id: client.id,
        username: client.instagram_username || client.name || 'Unknown',
        score: totalScore,
        classification,
        factors: {
          engagement: engagementScore,
          recency: recencyScore,
          frequency: frequencyScore,
          source_quality: sourceQualityScore
        }
      });
    });

    // Ordenar por puntuación descendente
    leads.sort((a, b) => b.score - a.score);

    // Calcular estadísticas
    const coldLeads = leads.filter(l => l.classification === 'cold').length;
    const warmLeads = leads.filter(l => l.classification === 'warm').length;
    const mqlCount = leads.filter(l => l.classification === 'MQL').length;
    const sqlCount = leads.filter(l => l.classification === 'SQL').length;

    // Distribución por rango de puntuación
    const distribution = {
      '0-20': leads.filter(l => l.score >= 0 && l.score < 20).length,
      '20-40': leads.filter(l => l.score >= 20 && l.score < 40).length,
      '40-60': leads.filter(l => l.score >= 40 && l.score < 60).length,
      '60-80': leads.filter(l => l.score >= 60 && l.score < 80).length,
      '80-100': leads.filter(l => l.score >= 80 && l.score <= 100).length
    };

    // Top 10 leads por puntuación
    const topLeads = leads.slice(0, 10).map(l => ({
      username: l.username,
      score: l.score,
      classification: l.classification
    }));

    return NextResponse.json({
      success: true,
      data: {
        total_leads: leads.length,
        cold_leads: coldLeads,
        warm_leads: warmLeads,
        mql_count: mqlCount,
        sql_count: sqlCount,
        conversion_rate_mql: leads.length > 0 ? parseFloat(((mqlCount + sqlCount) / leads.length * 100).toFixed(2)) : 0,
        conversion_rate_sql: leads.length > 0 ? parseFloat((sqlCount / leads.length * 100).toFixed(2)) : 0,
        average_score: parseFloat((leads.reduce((acc, l) => acc + l.score, 0) / leads.length).toFixed(2)),
        distribution,
        top_leads: topLeads,
        leads_by_classification: {
          cold: coldLeads,
          warm: warmLeads,
          MQL: mqlCount,
          SQL: sqlCount
        }
      }
    });

  } catch (error: any) {
    console.error('Error calculating lead scoring:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Error al calcular Lead Scoring'
    }, { status: 500 });
  }
}
