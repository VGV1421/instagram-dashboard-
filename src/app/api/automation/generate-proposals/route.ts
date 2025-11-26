import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/simple-client';
import { sendContentNotification } from '@/lib/email/notifications';
import fs from 'fs/promises';
import path from 'path';

const AVATAR_UNUSED_PATH = 'C:\\Users\\Usuario\\CURSOR\\instagram-dashboard\\FOTOS AVATAR SIN USAR';

/**
 * POST /api/automation/generate-proposals
 *
 * Genera propuestas de contenido y las envia por email para aprobacion.
 * El usuario recibe un email con las opciones y puede elegir cual usar.
 *
 * Flujo:
 * 1. Analiza competidores (opcional)
 * 2. Genera 3 propuestas de contenido con IA
 * 3. Asigna fotos de avatar a cada propuesta
 * 4. Guarda en BD como "pending_approval"
 * 5. Envia email con todas las opciones
 */

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const {
      count = 3,
      syncFirst = false,
      competitorsToSync = 2
    } = body;

    const supabase = supabaseAdmin;
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    // PASO 1: Sync competidores si se solicita
    if (syncFirst) {
      console.log('Sincronizando competidores...');
      await fetch(`${baseUrl}/api/automation/run-full-cycle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          syncCompetitors: true,
          analyzeContent: true,
          generateContent: false, // No generamos aqui
          competitorsToSync
        })
      });
    }

    // PASO 2: Generar propuestas con IA
    console.log('Generando propuestas de contenido...');
    const generateResponse = await fetch(`${baseUrl}/api/content/generate-auto`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        count,
        types: ['reel', 'post', 'carousel'],
        niche: 'IA y emprendimiento digital',
        tone: 'profesional pero cercano',
        saveToDb: false // No guardamos aun
      })
    });

    const generateResult = await generateResponse.json();

    if (!generateResult.success) {
      return NextResponse.json({
        success: false,
        error: 'Error generando contenido: ' + generateResult.error
      }, { status: 500 });
    }

    const proposals = generateResult.data?.content || [];

    if (proposals.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No se generaron propuestas'
      }, { status: 400 });
    }

    // PASO 3: Asignar fotos a cada propuesta
    const avatarFiles = await fs.readdir(AVATAR_UNUSED_PATH).catch(() => []);
    const imageFiles = avatarFiles.filter(f => /\.(png|jpg|jpeg|webp)$/i.test(f));

    const proposalsWithPhotos = proposals.map((p: any, index: number) => ({
      ...p,
      id: `prop-${Date.now()}-${index}`,
      photo: imageFiles[index % imageFiles.length] || null,
      photoPath: imageFiles[index % imageFiles.length]
        ? `FOTOS AVATAR SIN USAR/${imageFiles[index % imageFiles.length]}`
        : null
    }));

    // PASO 4: Guardar propuestas en automation_logs
    const batchId = `batch-${Date.now()}`;

    // Usar metadata en lugar de execution_data (compatible con schema actual)
    // Y usar status 'warning' como placeholder hasta que se actualice el constraint
    const { error: saveError } = await supabase.from('automation_logs').insert({
      workflow_name: 'content-proposals',
      execution_id: batchId,
      status: 'warning', // Temporal: 'pending_approval' requiere actualizar constraint
      metadata: {
        proposals: proposalsWithPhotos,
        status_real: 'pending_approval',
        created_at: new Date().toISOString()
      }
    });

    if (saveError) {
      console.error('Error guardando propuestas:', saveError);
    } else {
      console.log('Propuestas guardadas con batchId:', batchId);
    }

    // PASO 5: Enviar email con propuestas
    console.log('Enviando email con propuestas...');
    const emailResult = await sendProposalEmail(proposalsWithPhotos, batchId, baseUrl);

    return NextResponse.json({
      success: true,
      data: {
        batchId,
        proposalsCount: proposalsWithPhotos.length,
        proposals: proposalsWithPhotos,
        emailSent: emailResult.success,
        message: 'Propuestas generadas. Revisa tu email para aprobar.',
        approvalUrl: `${baseUrl}/api/automation/approve-content?batchId=${batchId}`
      }
    });

  } catch (error: any) {
    console.error('Error:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

// Enviar email con propuestas para aprobar
async function sendProposalEmail(
  proposals: any[],
  batchId: string,
  baseUrl: string
): Promise<{ success: boolean; error?: string }> {

  const proposalCards = proposals.map((p, i) => `
    <div style="background: white; border: 2px solid ${p.type === 'reel' ? '#ec4899' : '#6366f1'}; border-radius: 12px; padding: 20px; margin-bottom: 20px;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
        <span style="background: ${p.type === 'reel' ? '#fce7f3' : '#e0e7ff'}; color: ${p.type === 'reel' ? '#be185d' : '#4338ca'}; padding: 6px 16px; border-radius: 20px; font-weight: bold; text-transform: uppercase;">
          ${p.type === 'reel' ? 'REEL' : p.type === 'carousel' ? 'CARRUSEL' : 'POST'} #${i + 1}
        </span>
        <span style="background: ${p.engagement_prediction === 'high' ? '#d1fae5' : '#fef3c7'}; color: ${p.engagement_prediction === 'high' ? '#065f46' : '#92400e'}; padding: 4px 12px; border-radius: 4px; font-size: 12px;">
          ${p.engagement_prediction === 'high' ? 'Alto engagement' : 'Medio'}
        </span>
      </div>

      <h3 style="color: #1f2937; margin: 0 0 15px 0; font-size: 18px;">${p.topic}</h3>

      ${p.photo ? `
        <p style="color: #6b7280; font-size: 13px; margin-bottom: 10px;">
          Foto asignada: <strong>${p.photo}</strong>
        </p>
      ` : ''}

      <div style="background: #f9fafb; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
        <p style="color: #374151; margin: 0; font-size: 14px; line-height: 1.6; white-space: pre-wrap;">${(p.caption || '').slice(0, 400)}${(p.caption || '').length > 400 ? '...' : ''}</p>
      </div>

      ${p.script ? `
        <details style="margin-bottom: 15px;">
          <summary style="color: #8b5cf6; cursor: pointer; font-weight: 500;">Ver script del video</summary>
          <div style="background: #faf5ff; padding: 12px; border-radius: 6px; margin-top: 8px;">
            <p style="color: #4c1d95; margin: 0; font-size: 13px; line-height: 1.5;">${(p.script || '').slice(0, 300)}...</p>
          </div>
        </details>
      ` : ''}

      ${p.hashtags?.length ? `
        <p style="color: #6366f1; font-size: 12px; margin-bottom: 15px;">${p.hashtags.slice(0, 8).join(' ')}</p>
      ` : ''}

      <div style="text-align: center;">
        <a href="mailto:vgvtoringana@gmail.com?subject=APROBAR%20PROPUESTA%20${i + 1}&body=Apruebo%20la%20propuesta%20${i + 1}%20(${p.type})%20-%20${encodeURIComponent(p.topic)}%0A%0ABatch%20ID:%20${batchId}"
           style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 12px 30px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 14px;">
          APROBAR ESTA OPCION
        </a>
      </div>
    </div>
  `).join('');

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 650px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%); padding: 30px; border-radius: 12px 12px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 24px;">Propuestas de Contenido</h1>
        <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Selecciona la que quieres publicar</p>
      </div>

      <div style="background: #f3f4f6; padding: 25px; border-radius: 0 0 12px 12px;">
        <p style="color: #4b5563; margin-bottom: 20px; font-size: 15px;">
          He generado <strong>${proposals.length} propuestas</strong> de contenido basadas en el analisis de tus competidores.
          <br><br>
          <strong>Responde a este email</strong> indicando el numero de la propuesta que quieres usar, o haz clic en "APROBAR" debajo de tu favorita.
        </p>

        ${proposalCards}

        <div style="background: #dbeafe; padding: 15px; border-radius: 8px; margin-top: 20px;">
          <p style="color: #1e40af; margin: 0; font-size: 13px;">
            <strong>Como aprobar:</strong><br>
            1. Responde a este email con el numero (ej: "Apruebo la 2")<br>
            2. O haz clic en el boton "APROBAR" de la opcion elegida<br>
            3. El video se generara automaticamente con tu foto de avatar
          </p>
        </div>

        <p style="color: #9ca3af; font-size: 11px; margin-top: 25px; text-align: center;">
          Batch ID: ${batchId} | Las propuestas expiran en 24 horas
        </p>
      </div>
    </div>
  `;

  return sendContentNotification({
    type: 'content_generated',
    title: `${proposals.length} propuestas listas para tu aprobacion`,
    details: {
      contentCount: proposals.length,
      competitorsSynced: 0
    }
  }).then(() => {
    // Enviar email personalizado
    const Resend = require('resend').Resend;
    const resend = new Resend(process.env.RESEND_API_KEY);

    return resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
      to: process.env.ALERT_EMAIL_TO || 'vgvtoringana@gmail.com',
      subject: `Elige tu contenido - ${proposals.length} propuestas listas`,
      html
    }).then(() => ({ success: true }))
      .catch((e: any) => ({ success: false, error: e.message }));
  });
}

// GET: Ver propuestas pendientes
export async function GET() {
  try {
    const supabase = supabaseAdmin;

    // Buscar en content_proposals o automation_logs
    const { data: proposals } = await supabase
      .from('automation_logs')
      .select('*')
      .eq('workflow_name', 'content-proposals')
      .eq('status', 'pending_approval')
      .order('created_at', { ascending: false })
      .limit(5);

    return NextResponse.json({
      success: true,
      data: {
        pending: proposals || [],
        count: proposals?.length || 0
      }
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message });
  }
}
