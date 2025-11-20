import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/simple-client';

/**
 * GET /api/insights/best-time
 *
 * Analiza el mejor momento para publicar basado en datos históricos
 * Query params:
 * - source: 'own' | 'competitors' (default: 'own')
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const source = searchParams.get('source') || 'own';

    const supabase = supabaseAdmin;

    // Solo implementamos análisis de posts propios por ahora
    if (source !== 'own') {
      return NextResponse.json({
        success: false,
        error: 'Análisis de competidores no disponible aún'
      }, { status: 400 });
    }

    // Obtener todos los posts con engagement
    const { data: posts, error } = await supabase
      .from('posts')
      .select('timestamp, likes, comments, reach, engagement_rate')
      .order('timestamp', { ascending: false });

    if (error) throw error;

    if (!posts || posts.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No hay suficientes datos para análisis'
      }, { status: 404 });
    }

    // Analizar por día de la semana
    const dayStats: { [key: number]: { count: number; totalEngagement: number; posts: any[] } } = {};
    const hourStats: { [key: number]: { count: number; totalEngagement: number; posts: any[] } } = {};
    const dayHourStats: { [key: string]: { count: number; totalEngagement: number } } = {};

    const daysOfWeek = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

    posts.forEach(post => {
      const date = new Date(post.timestamp);
      const dayOfWeek = date.getDay(); // 0-6
      const hour = date.getHours(); // 0-23
      const engagement = post.engagement_rate || 0;
      const dayHourKey = `${dayOfWeek}-${hour}`;

      // Stats por día
      if (!dayStats[dayOfWeek]) {
        dayStats[dayOfWeek] = { count: 0, totalEngagement: 0, posts: [] };
      }
      dayStats[dayOfWeek].count++;
      dayStats[dayOfWeek].totalEngagement += engagement;
      dayStats[dayOfWeek].posts.push(post);

      // Stats por hora
      if (!hourStats[hour]) {
        hourStats[hour] = { count: 0, totalEngagement: 0, posts: [] };
      }
      hourStats[hour].count++;
      hourStats[hour].totalEngagement += engagement;
      hourStats[hour].posts.push(post);

      // Stats por día-hora combinado
      if (!dayHourStats[dayHourKey]) {
        dayHourStats[dayHourKey] = { count: 0, totalEngagement: 0 };
      }
      dayHourStats[dayHourKey].count++;
      dayHourStats[dayHourKey].totalEngagement += engagement;
    });

    // Calcular promedios y encontrar mejores momentos
    const dayAnalysis = Object.entries(dayStats).map(([day, stats]) => ({
      day: parseInt(day),
      dayName: daysOfWeek[parseInt(day)],
      avgEngagement: stats.count > 0 ? stats.totalEngagement / stats.count : 0,
      postCount: stats.count,
      totalEngagement: stats.totalEngagement
    })).sort((a, b) => b.avgEngagement - a.avgEngagement);

    const hourAnalysis = Object.entries(hourStats).map(([hour, stats]) => ({
      hour: parseInt(hour),
      hourLabel: `${hour.toString().padStart(2, '0')}:00`,
      avgEngagement: stats.count > 0 ? stats.totalEngagement / stats.count : 0,
      postCount: stats.count,
      totalEngagement: stats.totalEngagement
    })).sort((a, b) => b.avgEngagement - a.avgEngagement);

    // Heatmap: día x hora
    const heatmap = [];
    for (let day = 0; day < 7; day++) {
      for (let hour = 0; hour < 24; hour++) {
        const key = `${day}-${hour}`;
        const stats = dayHourStats[key];
        if (stats && stats.count > 0) {
          heatmap.push({
            day,
            dayName: daysOfWeek[day],
            hour,
            hourLabel: `${hour.toString().padStart(2, '0')}:00`,
            avgEngagement: stats.totalEngagement / stats.count,
            postCount: stats.count
          });
        }
      }
    }

    // Mejores 5 combinaciones día-hora
    const topSlots = heatmap
      .sort((a, b) => b.avgEngagement - a.avgEngagement)
      .slice(0, 5);

    // Mejor momento general
    const bestTime = topSlots[0] || null;

    return NextResponse.json({
      success: true,
      data: {
        bestTime: bestTime ? {
          day: bestTime.dayName,
          hour: bestTime.hourLabel,
          avgEngagement: parseFloat(bestTime.avgEngagement.toFixed(2)),
          postCount: bestTime.postCount
        } : null,
        byDay: dayAnalysis,
        byHour: hourAnalysis,
        topSlots: topSlots.map(slot => ({
          day: slot.dayName,
          hour: slot.hourLabel,
          avgEngagement: parseFloat(slot.avgEngagement.toFixed(2)),
          postCount: slot.postCount
        })),
        heatmap: heatmap.map(h => ({
          ...h,
          avgEngagement: parseFloat(h.avgEngagement.toFixed(2))
        })),
        totalPosts: posts.length,
        source: 'own'
      }
    });

  } catch (error: any) {
    console.error('Error in best-time API:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Error al analizar mejor momento'
      },
      { status: 500 }
    );
  }
}
