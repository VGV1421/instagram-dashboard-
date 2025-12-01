import { NextResponse } from 'next/server';

/**
 * GET /api/analytics/keywords
 *
 * Analiza qué keywords se comentan más en los posts
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '30');
    const { supabaseAdmin } = await import('@/lib/supabase/simple-client');

    // Calcular fecha de inicio
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Obtener logs de comentarios detectados
    const { data: logs, error } = await supabaseAdmin
      .from('automation_logs')
      .select('*')
      .eq('workflow_name', 'instagram-comment-reply')
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Analizar keywords
    const keywordStats: Record<string, {
      keyword: string;
      count: number;
      users: Set<string>;
      lastUsed: string;
    }> = {};

    logs?.forEach(log => {
      const keyword = log.metadata?.keyword?.toUpperCase();
      const username = log.metadata?.username;

      if (keyword) {
        if (!keywordStats[keyword]) {
          keywordStats[keyword] = {
            keyword,
            count: 0,
            users: new Set(),
            lastUsed: log.created_at
          };
        }
        keywordStats[keyword].count++;
        if (username) {
          keywordStats[keyword].users.add(username);
        }
        // Actualizar última fecha si es más reciente
        if (new Date(log.created_at) > new Date(keywordStats[keyword].lastUsed)) {
          keywordStats[keyword].lastUsed = log.created_at;
        }
      }
    });

    // Convertir a array y ordenar por frecuencia
    const keywordArray = Object.values(keywordStats).map(stat => ({
      keyword: stat.keyword,
      count: stat.count,
      uniqueUsers: stat.users.size,
      lastUsed: stat.lastUsed,
      avgPerUser: stat.users.size > 0 ? Math.round((stat.count / stat.users.size) * 100) / 100 : 0
    })).sort((a, b) => b.count - a.count);

    // Métricas generales
    const totalInteractions = keywordArray.reduce((sum, k) => sum + k.count, 0);
    const totalUniqueUsers = new Set(logs?.map(l => l.metadata?.username).filter(Boolean)).size;

    return NextResponse.json({
      keywords: keywordArray,
      summary: {
        totalKeywords: keywordArray.length,
        totalInteractions,
        totalUniqueUsers,
        avgInteractionsPerUser: totalUniqueUsers > 0
          ? Math.round((totalInteractions / totalUniqueUsers) * 100) / 100
          : 0,
        mostPopular: keywordArray[0]?.keyword || null,
        period: `${days} days`
      }
    });

  } catch (error: any) {
    console.error('Error getting keyword analytics:', error);
    return NextResponse.json(
      { error: 'Failed to get keyword analytics', details: error.message },
      { status: 500 }
    );
  }
}
