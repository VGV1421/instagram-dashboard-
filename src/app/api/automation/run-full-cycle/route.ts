import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/simple-client';

/**
 * POST /api/automation/run-full-cycle
 *
 * Ejecuta el ciclo completo de automatización:
 * 1. Sincroniza competidores (los que toca)
 * 2. Analiza posts con IA
 * 3. Genera contenido nuevo
 * 4. Guarda en scheduled_content
 *
 * Diseñado para ser llamado por n8n cada 12-24 horas
 */

export async function POST(request: Request) {
  const startTime = Date.now();
  const log: string[] = [];

  try {
    const body = await request.json().catch(() => ({}));
    const {
      syncCompetitors = true,
      analyzeContent = true,
      generateContent = true,
      competitorsToSync = 3,
      contentToGenerate = 3
    } = body;

    const supabase = supabaseAdmin;
    const results = {
      competitors_synced: 0,
      posts_fetched: 0,
      analysis_performed: false,
      content_generated: 0,
      errors: [] as string[]
    };

    // =========================================
    // PASO 1: Sincronizar Competidores
    // =========================================
    if (syncCompetitors) {
      log.push('🔄 Iniciando sincronización de competidores...');

      // Obtener competidores que necesitan sync (ordenados por prioridad)
      const { data: competitorsToSyncData } = await supabase
        .from('competitors')
        .select('id, instagram_username, last_synced_at, sync_priority')
        .eq('is_active', true)
        .order('last_synced_at', { ascending: true, nullsFirst: true })
        .limit(competitorsToSync);

      if (competitorsToSyncData && competitorsToSyncData.length > 0) {
        for (const competitor of competitorsToSyncData) {
          try {
            log.push(`  → Sincronizando @${competitor.instagram_username}...`);

            // Llamar a la API de sync con Apify
            const syncResponse = await fetch(
              `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/competitors/sync-apify`,
              {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  competitorId: competitor.id,
                  username: competitor.instagram_username,
                  postsLimit: 5
                })
              }
            );

            const syncResult = await syncResponse.json();

            if (syncResult.success) {
              results.competitors_synced++;
              results.posts_fetched += syncResult.posts_synced || 0;
              log.push(`    ✅ Sincronizado: ${syncResult.posts_synced || 0} posts`);

              // Actualizar last_synced_at
              await supabase
                .from('competitors')
                .update({
                  last_synced_at: new Date().toISOString(),
                  total_posts_synced: (competitor as any).total_posts_synced + (syncResult.posts_synced || 0)
                })
                .eq('id', competitor.id);
            } else {
              log.push(`    ⚠️ Error: ${syncResult.error}`);
              results.errors.push(`Sync ${competitor.instagram_username}: ${syncResult.error}`);
            }

            // Pequeña pausa entre syncs para no saturar APIs
            await new Promise(resolve => setTimeout(resolve, 2000));

          } catch (syncError: any) {
            log.push(`    ❌ Error sincronizando: ${syncError.message}`);
            results.errors.push(`Sync error: ${syncError.message}`);
          }
        }
      } else {
        log.push('  ℹ️ No hay competidores activos para sincronizar');
      }
    }

    // =========================================
    // PASO 2: Analizar Contenido con IA
    // =========================================
    if (analyzeContent) {
      log.push('🧠 Iniciando análisis de contenido...');

      try {
        const analyzeResponse = await fetch(
          `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/competitors/analyze`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              limit: 20,
              minEngagement: 2,
              generateContent: false // Lo haremos en el paso 3
            })
          }
        );

        const analyzeResult = await analyzeResponse.json();

        if (analyzeResult.success) {
          results.analysis_performed = true;
          log.push(`  ✅ Análisis completado: ${analyzeResult.data.posts_analyzed} posts analizados`);
        } else {
          log.push(`  ⚠️ Análisis parcial: ${analyzeResult.error || 'sin detalles'}`);
        }

      } catch (analyzeError: any) {
        log.push(`  ❌ Error en análisis: ${analyzeError.message}`);
        results.errors.push(`Analysis error: ${analyzeError.message}`);
      }
    }

    // =========================================
    // PASO 3: Generar Contenido Automático
    // =========================================
    if (generateContent) {
      log.push('✍️ Generando contenido nuevo...');

      try {
        const generateResponse = await fetch(
          `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/content/generate-auto`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              count: contentToGenerate,
              types: ['post', 'reel', 'carousel'],
              niche: 'IA y emprendimiento digital',
              tone: 'profesional pero cercano',
              saveToDb: true
            })
          }
        );

        const generateResult = await generateResponse.json();

        if (generateResult.success) {
          results.content_generated = generateResult.data.generated_count;
          log.push(`  ✅ Contenido generado: ${results.content_generated} piezas`);

          // Log de cada pieza generada
          generateResult.data.content?.forEach((c: any, i: number) => {
            log.push(`    ${i + 1}. [${c.type}] ${c.topic} - Predicción: ${c.engagement_prediction}`);
          });
        } else {
          log.push(`  ⚠️ Error generando: ${generateResult.error}`);
          results.errors.push(`Generation error: ${generateResult.error}`);
        }

      } catch (genError: any) {
        log.push(`  ❌ Error en generación: ${genError.message}`);
        results.errors.push(`Generation error: ${genError.message}`);
      }
    }

    // =========================================
    // PASO 4: Registrar Log de Ejecución
    // =========================================
    const executionTime = Date.now() - startTime;
    log.push(`\n⏱️ Tiempo total: ${(executionTime / 1000).toFixed(2)}s`);

    // Guardar log en automation_logs
    await supabase
      .from('automation_logs')
      .insert({
        workflow_name: 'full-automation-cycle',
        execution_id: `auto-${Date.now()}`,
        status: results.errors.length === 0 ? 'success' : 'partial',
        execution_data: {
          results,
          log,
          execution_time_ms: executionTime
        },
        posts_synced: results.posts_fetched,
        competitors_synced: results.competitors_synced,
        content_generated: results.content_generated,
        analysis_performed: results.analysis_performed
      });

    return NextResponse.json({
      success: true,
      data: {
        ...results,
        execution_time_ms: executionTime,
        log
      }
    });

  } catch (error: any) {
    console.error('Error in full automation cycle:', error);

    return NextResponse.json({
      success: false,
      error: error.message,
      log
    }, { status: 500 });
  }
}

// GET para ver estado de la automatización
export async function GET() {
  try {
    const supabase = supabaseAdmin;

    // Obtener últimas ejecuciones
    const { data: recentLogs } = await supabase
      .from('automation_logs')
      .select('*')
      .eq('workflow_name', 'full-automation-cycle')
      .order('created_at', { ascending: false })
      .limit(10);

    // Obtener contenido pendiente
    const { data: pendingContent } = await supabase
      .from('scheduled_content')
      .select('*')
      .eq('status', 'scheduled')
      .order('scheduled_for', { ascending: true })
      .limit(10);

    // Estadísticas
    const { count: totalScheduled } = await supabase
      .from('scheduled_content')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'scheduled');

    const { count: totalPublished } = await supabase
      .from('scheduled_content')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'published');

    return NextResponse.json({
      success: true,
      data: {
        recent_executions: recentLogs || [],
        pending_content: pendingContent || [],
        stats: {
          scheduled: totalScheduled || 0,
          published: totalPublished || 0
        }
      }
    });

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
