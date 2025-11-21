import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/simple-client';

/**
 * GET /api/metrics/ltv
 *
 * Calcula el Lifetime Value (LTV) de clientes
 * LTV = Valor Promedio de Compra × Frecuencia de Compra × Tiempo de Vida del Cliente
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
          ltv_promedio: 0,
          valor_promedio_compra: 0,
          frecuencia_compra: 0,
          tiempo_vida_promedio: 0,
          total_clientes: 0,
          ltv_por_canal: {}
        }
      });
    }

    // Calcular métricas
    let totalValor = 0;
    let totalCompras = 0;
    const ltvPorCanal: { [key: string]: { total: number; count: number } } = {};

    const now = new Date();

    clients.forEach(client => {
      // Valor estimado por cliente (puedes ajustar según tus datos reales)
      const valorCliente = client.metadata?.valor_total || 100;
      const canal = client.source || 'organico';

      // Calcular tiempo de vida (días desde creación)
      const createdDate = new Date(client.created_at);
      const diasVida = Math.floor((now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));

      // Frecuencia estimada (ajustar según interacciones reales)
      const frecuencia = client.metadata?.frecuencia_compra || 1;

      const ltv = valorCliente * frecuencia;

      totalValor += valorCliente;
      totalCompras += frecuencia;

      if (!ltvPorCanal[canal]) {
        ltvPorCanal[canal] = { total: 0, count: 0 };
      }
      ltvPorCanal[canal].total += ltv;
      ltvPorCanal[canal].count += 1;
    });

    const valorPromedioCompra = totalValor / clients.length;
    const frecuenciaPromedio = totalCompras / clients.length;
    const tiempoVidaPromedio = 365; // Estimación 1 año (ajustar con datos reales)

    const ltvPromedio = valorPromedioCompra * frecuenciaPromedio * (tiempoVidaPromedio / 365);

    // Formatear LTV por canal
    const ltvPorCanalFormateado: { [key: string]: number } = {};
    Object.entries(ltvPorCanal).forEach(([canal, data]) => {
      ltvPorCanalFormateado[canal] = data.total / data.count;
    });

    return NextResponse.json({
      success: true,
      data: {
        ltv_promedio: parseFloat(ltvPromedio.toFixed(2)),
        valor_promedio_compra: parseFloat(valorPromedioCompra.toFixed(2)),
        frecuencia_compra: parseFloat(frecuenciaPromedio.toFixed(2)),
        tiempo_vida_promedio: tiempoVidaPromedio,
        total_clientes: clients.length,
        ltv_por_canal: ltvPorCanalFormateado
      }
    });

  } catch (error: any) {
    console.error('Error calculating LTV:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Error al calcular LTV'
    }, { status: 500 });
  }
}
