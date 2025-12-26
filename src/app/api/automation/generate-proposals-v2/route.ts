import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/simple-client';
import { ContentCrew, PhotoSelector } from '@/lib/agents';
import type { CompetitorPost } from '@/lib/agents/types';
import { notifyFullReport } from '@/lib/email/notifications';
import fs from 'fs/promises';

/**
 * POST /api/automation/generate-proposals-v2
 *
 * SISTEMA PROFESIONAL DE GENERACIÓN DE CONTENIDO V2
 *
 * Usa multi-agente system con:
 * - Content Crew (4 agentes): Research → Strategy → Writer → Optimizer
 * - Photo Selector (state machine): Análisis inteligente de avatares
 *
 * Flujo:
 * 1. Sync competitor content (Apify)
 * 2. Content Crew genera 3 scripts optimizados
 * 3. Photo Selector elige mejor avatar para cada script
 * 4. Guarda propuestas en DB
 * 5. Envía email con propuestas
 */

export async function POST(request: Request) {
  const startTime = Date.now();
  const supabase = supabaseAdmin;

  try {
    console.log('🚀 ============================================');
    console.log('🚀 INICIANDO GENERACIÓN V2 (SISTEMA PROFESIONAL)');
    console.log('🚀 ============================================');

    // ============ PASO 1: Obtener posts de competidores ============

    console.log('\n📊 PASO 1/5: Obteniendo posts de competidores...');

    let competitorPosts: CompetitorPost[] = [];

    try {
      const { data: activeCompetitors, error: competitorsError } = await supabase
        .from('competitors')
        .select('id, username')
        .eq('is_active', true);

      if (competitorsError) {
        console.log(`⚠️ Error obteniendo competidores: ${competitorsError.message}`);
        console.log('   Usando datos de ejemplo...');
      } else if (activeCompetitors && activeCompetitors.length > 0) {
        const activeIds = activeCompetitors.map(c => c.id);

        const { data: topPosts, error: postsError } = await supabase
          .from('competitor_posts')
          .select('post_url, caption, media_type, engagement_rate, likes, comments')
          .in('competitor_id', activeIds)
          .gte('likes', 50)
          .order('engagement_rate', { ascending: false })
          .limit(15);

        if (postsError) {
          console.log(`⚠️ Error obteniendo posts: ${postsError.message}`);
        } else if (topPosts && topPosts.length > 0) {
          competitorPosts = topPosts.map(post => ({
            url: post.post_url || '',
            caption: post.caption || '',
            engagement_rate: post.engagement_rate || 0,
            likes: post.likes || 0,
            comments: post.comments || 0
          }));

          console.log(`✅ Posts obtenidos de DB: ${competitorPosts.length}`);
        }
      }
    } catch (error: any) {
      console.log(`⚠️ Error conectando a Supabase: ${error.message}`);
      console.log('   Usando datos de ejemplo...');
    }

    // Fallback: Usar datos de ejemplo si no hay posts de DB
    if (competitorPosts.length === 0) {
      console.log('📝 Usando posts de ejemplo para testing...');
      competitorPosts = [
        {
          url: 'https://instagram.com/p/example1',
          caption: '¿Sabías que la IA puede automatizar el 70% de tu trabajo? 🤖 Herramientas como ChatGPT, Midjourney y n8n están revolucionando el emprendimiento digital. Aquí te cuento las 3 mejores. #IA #Automatización #Emprendimiento',
          engagement_rate: 0.08,
          likes: 450,
          comments: 32
        },
        {
          url: 'https://instagram.com/p/example2',
          caption: 'El error #1 que cometen los novatos en marketing digital: No medir resultados. Sin analytics, estás navegando a ciegas. Te muestro cómo usar Google Analytics GRATIS. #MarketingDigital #Analytics',
          engagement_rate: 0.065,
          likes: 380,
          comments: 28
        },
        {
          url: 'https://instagram.com/p/example3',
          caption: 'Cómo automaticé mi negocio con IA en 3 pasos: 1. Contenido con ChatGPT 2. Imágenes con Midjourney 3. Workflows con n8n. Resultado: 20 horas ahorradas por semana. #Automatización #IA #Productividad',
          engagement_rate: 0.072,
          likes: 420,
          comments: 35
        }
      ];
    }

    // ============ PASO 2: Content Crew - Generar scripts ============

    console.log('\n🤖 PASO 2/5: Iniciando Content Crew...');
    console.log('   Agentes: Research → Strategy → Writer → Optimizer');

    const contentCrew = new ContentCrew({
      model: 'gpt-4o-mini',  // Optimizado: 15x más barato
      temperature: 0.7,
      max_tokens: 2000,
      verbose: true
    });

    const contentResult = await contentCrew.generateContent(competitorPosts, 3);

    console.log(`\n✅ Content Crew completado:`);
    console.log(`   - Propuestas generadas: ${contentResult.proposals.length}`);
    console.log(`   - Tiempo de ejecución: ${contentResult.execution_time}ms`);

    if (contentResult.proposals.length === 0) {
      throw new Error('Content Crew no generó ninguna propuesta');
    }

    // ============ PASO 3: Photo Selector - Seleccionar avatares ============

    console.log('\n📸 PASO 3/5: Iniciando Photo Selector...');
    console.log('   State Machine: Analyze → Match → Score → Rank');

    const photoSelector = new PhotoSelector({
      model: 'gpt-4o-mini',  // Optimizado: 15x más barato
      temperature: 0.3,
      max_tokens: 1500,
      verbose: true
    });

    // Para cada propuesta, seleccionar mejor avatar
    const proposalsWithAvatars = await Promise.all(
      contentResult.proposals.map(async (proposal, index) => {
        console.log(`\n   Seleccionando avatar para propuesta #${index + 1}...`);

        const fullScript = `${proposal.script.hook} ${proposal.script.body} ${proposal.script.cta}`;

        try {
          const photoResult = await photoSelector.selectBestAvatar(fullScript);

          return {
            id: `prop-${Date.now()}-${index}`,
            type: 'reel' as const,
            topic: proposal.metadata.topic,
            caption: proposal.script.body,
            script: fullScript,
            hashtags: proposal.hashtags,
            photo: photoResult.avatar.filename,
            photoPath: photoResult.avatar.path,
            photoScore: photoResult.score,
            photoReason: photoResult.reason,
            sound_suggestion: proposal.sound_suggestion,
            engagement_prediction: proposal.engagement_prediction,
            engagement_score: proposal.engagement_score
          };
        } catch (error: any) {
          console.error(`   ❌ Error seleccionando avatar: ${error.message}`);
          // Fallback sin avatar
          return {
            id: `prop-${Date.now()}-${index}`,
            type: 'reel' as const,
            topic: proposal.metadata.topic,
            caption: proposal.script.body,
            script: fullScript,
            hashtags: proposal.hashtags,
            photo: 'avatar-placeholder.jpg',
            photoPath: null,
            photoScore: 0,
            photoReason: 'Error al seleccionar avatar',
            sound_suggestion: proposal.sound_suggestion,
            engagement_prediction: proposal.engagement_prediction,
            engagement_score: proposal.engagement_score
          };
        }
      })
    );

    console.log(`\n✅ Photo Selector completado`);
    console.log(`   - Avatares seleccionados: ${proposalsWithAvatars.filter(p => p.photoScore > 0).length}/${proposalsWithAvatars.length}`);

    // ============ PASO 4: Convertir fotos a base64 para email ============

    console.log('\n📸 PASO 4/5: Convirtiendo fotos a base64...');

    const proposalsWithPhotos = await Promise.all(
      proposalsWithAvatars.map(async (proposal) => {
        let photoBase64 = null;

        if (proposal.photoPath) {
          try {
            const imageBuffer = await fs.readFile(proposal.photoPath);
            const base64 = imageBuffer.toString('base64');
            const ext = proposal.photo?.split('.').pop()?.toLowerCase();
            const mimeType = ext === 'png' ? 'image/png' : 'image/jpeg';
            photoBase64 = `data:${mimeType};base64,${base64}`;
            console.log(`   ✅ Foto convertida: ${proposal.photo}`);
          } catch (error: any) {
            console.error(`   ❌ Error convirtiendo foto ${proposal.photo}: ${error.message}`);
          }
        }

        return {
          ...proposal,
          photoBase64  // Agregar base64 para mostrar en email
        };
      })
    );

    console.log(`✅ Fotos convertidas: ${proposalsWithPhotos.filter(p => p.photoBase64).length}/${proposalsWithPhotos.length}`);

    // ============ PASO 4.5: Guardar en automation_logs ============

    console.log('\n💾 PASO 4.5/5: Guardando propuestas en DB...');

    const batchId = `batch-${Date.now()}`;

    try {
      // Remover photoBase64 antes de guardar (puede ser muy grande para metadata)
      const proposalsForDB = proposalsWithPhotos.map(p => {
        const { photoBase64, ...rest } = p;
        return rest;
      });

      const { error: logError } = await supabase
        .from('automation_logs')
        .insert({
          execution_id: batchId,
          workflow_name: 'content-proposals-v2',
          status: 'pending_approval',
          metadata: {
            proposals: proposalsForDB,
            system_version: 'v2-professional',
            content_crew_time: contentResult.execution_time,
            total_execution_time: Date.now() - startTime,
            agent_logs: contentResult.agent_logs
          }
        });

      if (logError) {
        console.error(`❌ ERROR GUARDANDO EN DB:`, logError);
        console.error(`   Código: ${logError.code}`);
        console.error(`   Mensaje: ${logError.message}`);
        console.error(`   Detalles:`, JSON.stringify(logError, null, 2));
        throw new Error(`No se pudo guardar en DB: ${logError.message}`);
      } else {
        console.log(`✅ Batch guardado en DB: ${batchId}`);
      }
    } catch (error: any) {
      console.error(`❌ EXCEPCIÓN guardando en DB:`, error);
      throw error;
    }

    // ============ PASO 5: Enviar email con propuestas ============

    console.log('\n📧 PASO 5/5: Enviando email con propuestas...');

    try {
      await notifyFullReport(
        proposalsWithPhotos.length,
        competitorPosts.length,
        Date.now() - startTime,
        proposalsWithPhotos.map(p => ({
          type: p.type,
          topic: p.topic,
          caption: p.caption,
          script: p.script,
          hashtags: p.hashtags,
          engagement_prediction: p.engagement_prediction,
          photo: p.photo,  // Nombre del archivo de avatar
          photoPath: p.photoPath,  // Ruta completa
          photoScore: p.photoScore,  // Score 0-100
          photoReason: p.photoReason,  // Razón de selección
          photoBase64: p.photoBase64  // Imagen en base64 para mostrar
        })),
        batchId  // Pasar batchId para botones de aprobación
      );
      console.log('✅ Email enviado con botones de aprobación');
    } catch (emailError) {
      console.error('Error enviando email:', emailError);
      // No fallar si el email falla
    }

    // ============ RESULTADO FINAL ============

    const executionTime = Date.now() - startTime;

    console.log('\n🎉 ============================================');
    console.log(`🎉 GENERACIÓN V2 COMPLETADA en ${Math.round(executionTime / 1000)}s`);
    console.log('🎉 ============================================');
    console.log(`   - Propuestas: ${proposalsWithPhotos.length}`);
    console.log(`   - Batch ID: ${batchId}`);
    console.log(`   - Content Crew: ${Math.round(contentResult.execution_time / 1000)}s`);
    console.log(`   - Con avatares inteligentes: ${proposalsWithPhotos.filter(p => p.photoScore > 0).length}`);
    console.log('============================================\n');

    return NextResponse.json({
      success: true,
      data: {
        batch_id: batchId,
        proposals: proposalsWithPhotos,
        execution_time: executionTime,
        stats: {
          competitor_posts_analyzed: competitorPosts.length,
          content_crew_execution_time: contentResult.execution_time,
          proposals_generated: proposalsWithPhotos.length,
          avatars_selected: proposalsWithPhotos.filter(p => p.photoScore > 0).length
        },
        system_version: 'v2-professional'
      }
    });

  } catch (error: any) {
    console.error('\n❌ ============================================');
    console.error('❌ ERROR EN GENERACIÓN V2');
    console.error('❌ ============================================');
    console.error(error);
    console.error('============================================\n');

    return NextResponse.json({
      success: false,
      error: error.message || 'Error al generar propuestas',
      system_version: 'v2-professional'
    }, { status: 500 });
  }
}

// GET: Verificar estado del sistema
export async function GET() {
  return NextResponse.json({
    status: 'ready',
    version: 'v2-professional',
    features: {
      content_crew: true,
      photo_selector: true,
      multi_agent_system: true,
      intelligent_avatar_selection: true
    },
    agents: {
      research_agent: 'active',
      strategy_agent: 'active',
      script_writer_agent: 'active',
      optimizer_agent: 'active',
      photo_selector_agent: 'active'
    }
  });
}
