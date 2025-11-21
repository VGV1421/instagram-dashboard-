import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/simple-client';

/**
 * GET /api/metrics/cac
 *
 * Calcula el Coste de Adquisición de Cliente (CAC) detallado por canal
 * CAC = Inversión Marketing / Clientes Nuevos
 */

export async function GET() {
  try {
    const supabase = supabaseAdmin;

    // Obtener clientes agrupados por fuente
    const { data: clients, error } = await supabase
      .from('clients')
      .select('source, created_at, metadata');

    if (error) throw error;

    // Definir inversiones por canal (configurable)
    const inversionesPorCanal: { [key: string]: number } = {
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

    // Agrupar clientes por canal
    const clientesPorCanal: { [key: string]: number } = {};
    const clientesPorMes: { [key: string]: number } = {};

    const now = new Date();
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    let clientesTotal = 0;
    let clientesUltimos30Dias = 0;

    clients?.forEach(client => {
      const canal = client.source || 'organico';
      clientesPorCanal[canal] = (clientesPorCanal[canal] || 0) + 1;
      clientesTotal++;

      // Clientes últimos 30 días
      const createdDate = new Date(client.created_at);
      if (createdDate >= last30Days) {
        clientesUltimos30Dias++;

        const mes = createdDate.toISOString().substring(0, 7);
        clientesPorMes[mes] = (clientesPorMes[mes] || 0) + 1;
      }
    });

    // Calcular CAC por canal
    const cacPorCanal: { [key: string]: { cac: number; clientes: number; inversion: number } } = {};
    let inversionTotal = 0;

    Object.entries(clientesPorCanal).forEach(([canal, clientes]) => {
      const inversion = inversionesPorCanal[canal] || 100;
      inversionTotal += inversion;

      cacPorCanal[canal] = {
        cac: clientes > 0 ? parseFloat((inversion / clientes).toFixed(2)) : 0,
        clientes,
        inversion
      };
    });

    // CAC general
    const cacGeneral = clientesTotal > 0 ? inversionTotal / clientesTotal : 0;

    // Obtener LTV para calcular ratio LTV/CAC
    let ltvPromedio = 100; // Valor por defecto
    try {
      const ltvResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/metrics/ltv`);
      const ltvData = await ltvResponse.json();
      if (ltvData.success && ltvData.data.ltv_promedio) {
        ltvPromedio = ltvData.data.ltv_promedio;
      }
    } catch (e) {
      // Usar valor por defecto
    }

    const ratioLtvCac = cacGeneral > 0 ? ltvPromedio / cacGeneral : 0;

    // Determinar salud del ratio
    let saludRatio = 'malo';
    let colorSalud = 'red';
    if (ratioLtvCac >= 3) {
      saludRatio = 'excelente';
      colorSalud = 'green';
    } else if (ratioLtvCac >= 2) {
      saludRatio = 'bueno';
      colorSalud = 'yellow';
    } else if (ratioLtvCac >= 1) {
      saludRatio = 'regular';
      colorSalud = 'orange';
    }

    return NextResponse.json({
      success: true,
      data: {
        cac_general: parseFloat(cacGeneral.toFixed(2)),
        cac_por_canal: cacPorCanal,
        inversion_total: inversionTotal,
        clientes_total: clientesTotal,
        clientes_ultimos_30_dias: clientesUltimos30Dias,
        ltv_promedio: ltvPromedio,
        ratio_ltv_cac: parseFloat(ratioLtvCac.toFixed(2)),
        salud_ratio: saludRatio,
        color_salud: colorSalud,
        tendencia_mensual: clientesPorMes
      }
    });

  } catch (error: any) {
    console.error('Error calculating CAC:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Error al calcular CAC'
    }, { status: 500 });
  }
}
