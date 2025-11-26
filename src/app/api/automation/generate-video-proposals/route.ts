import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/simple-client';
import { Resend } from 'resend';
import fs from 'fs/promises';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const FFMPEG_PATH = 'C:\\Users\\Usuario\\AppData\\Local\\Microsoft\\WinGet\\Links\\ffmpeg.exe';

/**
 * POST /api/automation/generate-video-proposals
 *
 * Genera propuestas de contenido CON VIDEO incluido:
 * 1. Selecciona un video de "VIDEOS AVATAR SIN USAR SIN SONIDO"
 * 2. Genera propuestas de contenido con IA
 * 3. Sube el video a Supabase Storage para preview
 * 4. Envia email con video + propuestas para aprobacion
 *
 * El usuario puede:
 * - Aprobar una propuesta (el video se mueve a "VIDEO SELECCIONADO PARA PONER VOZ")
 * - Pedir modificaciones
 * - Rechazar
 */

const VIDEOS_BASE = 'C:\\Users\\Usuario\\CURSOR\\instagram-dashboard\\VIDEOS AVATAR SIN USAR SIN SONIDO';
const VIDEOS_SELECCIONADOS = 'C:\\Users\\Usuario\\CURSOR\\instagram-dashboard\\VIDEO SELECCIONADO PARA PONER VOZ';

interface ProposalRequest {
  count?: number;           // Numero de propuestas (default: 3)
  niche?: string;           // Nicho de contenido
  tone?: string;            // Tono del contenido
}

export async function POST(request: Request) {
  try {
    const body: ProposalRequest = await request.json().catch(() => ({}));
    const {
      count = 3,
      niche = 'IA y emprendimiento digital',
      tone = 'profesional pero cercano'
    } = body;

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    // PASO 1: Obtener video disponible
    console.log('Buscando video disponible...');
    const videoResult = await getAvailableVideo();

    if (!videoResult.success) {
      return NextResponse.json({
        success: false,
        error: 'No hay videos disponibles',
        path: VIDEOS_BASE,
        suggestion: 'Añade videos (.mp4) a la carpeta "VIDEOS AVATAR SIN USAR SIN SONIDO"'
      }, { status: 400 });
    }

    const videoPath = videoResult.path!;
    const videoFilename = videoResult.filename!;
    console.log(`   Video seleccionado: ${videoFilename}`);

    // PASO 1.5: Obtener duración del video
    const videoDuration = await getVideoDuration(videoPath);
    console.log(`   Duración del video: ${videoDuration} segundos`);

    // PASO 2: Subir video a Supabase Storage para preview en email
    console.log('Subiendo video para preview...');
    const uploadResult = await uploadVideoForPreview(videoPath, videoFilename);

    if (!uploadResult.success) {
      console.log('   Error subiendo video, continuando sin preview');
    }

    // PASO 3: Generar propuestas con IA adaptadas al video
    console.log('Generando propuestas de contenido...');
    const generateResponse = await fetch(`${baseUrl}/api/content/generate-auto`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        count,
        types: ['reel'],
        niche,
        tone,
        saveToDb: false,
        // NUEVO: Información del video para generar script correcto
        videoInfo: {
          duration: videoDuration,
          type: 'avatar', // Video de avatar/persona hablando a cámara
          description: 'Video de una persona hablando directamente a cámara. El script debe ser lo que dice esa persona, NO describir lo que se ve.'
        }
      })
    });

    const generateResult = await generateResponse.json();

    if (!generateResult.success || !generateResult.data?.content?.length) {
      return NextResponse.json({
        success: false,
        error: 'Error generando propuestas: ' + (generateResult.error || 'Sin contenido')
      }, { status: 500 });
    }

    const proposals = generateResult.data.content.map((p: any, index: number) => ({
      ...p,
      id: `prop-${Date.now()}-${index}`,
      videoFilename,
      videoUrl: uploadResult.url || null
    }));

    // PASO 4: Guardar en BD
    const batchId = `video-batch-${Date.now()}`;

    await supabaseAdmin.from('automation_logs').insert({
      workflow_name: 'video-proposals',
      execution_id: batchId,
      status: 'warning', // Temporal: pending_approval
      metadata: {
        proposals,
        videoFilename,
        videoUrl: uploadResult.url,
        status_real: 'pending_approval',
        created_at: new Date().toISOString()
      }
    });

    // PASO 5: Enviar email con video + propuestas
    console.log('Enviando email con propuestas...');
    await sendVideoProposalEmail(proposals, batchId, videoFilename, uploadResult.url, baseUrl);

    return NextResponse.json({
      success: true,
      data: {
        batchId,
        proposalsCount: proposals.length,
        videoFilename,
        videoPreviewUrl: uploadResult.url,
        message: 'Propuestas generadas! Revisa tu email para aprobar.',
        proposals: proposals.map((p: any) => ({
          id: p.id,
          topic: p.topic,
          type: p.type
        }))
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

// Obtener video disponible
async function getAvailableVideo(): Promise<{ success: boolean; path?: string; filename?: string }> {
  try {
    const files = await fs.readdir(VIDEOS_BASE);
    const videoFiles = files.filter(f => /\.(mp4|mov|avi|webm)$/i.test(f));

    if (videoFiles.length === 0) {
      return { success: false };
    }

    // Usar el primero disponible
    const selectedFile = videoFiles[0];
    const fullPath = path.join(VIDEOS_BASE, selectedFile);

    return { success: true, path: fullPath, filename: selectedFile };
  } catch (error) {
    return { success: false };
  }
}

// Subir video para preview
async function uploadVideoForPreview(
  videoPath: string,
  filename: string
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    const videoBuffer = await fs.readFile(videoPath);
    const uploadFilename = `preview_${Date.now()}_${filename}`;

    const { error } = await supabaseAdmin.storage
      .from('avatars')
      .upload(`video-previews/${uploadFilename}`, videoBuffer, {
        contentType: 'video/mp4',
        upsert: true
      });

    if (error) {
      return { success: false, error: error.message };
    }

    const { data: publicUrl } = supabaseAdmin.storage
      .from('avatars')
      .getPublicUrl(`video-previews/${uploadFilename}`);

    return { success: true, url: publicUrl.publicUrl };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Enviar email con video y propuestas
async function sendVideoProposalEmail(
  proposals: any[],
  batchId: string,
  videoFilename: string,
  videoUrl: string | null,
  baseUrl: string
) {
  const resend = new Resend(process.env.RESEND_API_KEY);

  const proposalCards = proposals.map((p, i) => `
    <div style="background: white; border: 2px solid #ec4899; border-radius: 12px; padding: 20px; margin-bottom: 20px;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
        <span style="background: #fce7f3; color: #be185d; padding: 6px 16px; border-radius: 20px; font-weight: bold;">
          OPCION ${i + 1}
        </span>
        <span style="background: ${p.engagement_prediction === 'high' ? '#d1fae5' : '#fef3c7'}; color: ${p.engagement_prediction === 'high' ? '#065f46' : '#92400e'}; padding: 4px 12px; border-radius: 4px; font-size: 12px;">
          ${p.engagement_prediction === 'high' ? 'Alto engagement' : 'Medio'}
        </span>
      </div>

      <h3 style="color: #1f2937; margin: 0 0 15px 0; font-size: 18px;">${p.topic}</h3>

      <div style="background: #f9fafb; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
        <p style="color: #374151; margin: 0; font-size: 14px; line-height: 1.6;">${(p.caption || '').slice(0, 300)}${(p.caption || '').length > 300 ? '...' : ''}</p>
      </div>

      ${p.script ? `
        <details style="margin-bottom: 15px;">
          <summary style="color: #8b5cf6; cursor: pointer; font-weight: 500;">Ver script para la voz</summary>
          <div style="background: #faf5ff; padding: 12px; border-radius: 6px; margin-top: 8px;">
            <p style="color: #4c1d95; margin: 0; font-size: 13px; line-height: 1.5;">${(p.script || '').slice(0, 400)}...</p>
          </div>
        </details>
      ` : ''}

      <div style="text-align: center;">
        <a href="${baseUrl}/api/automation/approve-video?batchId=${batchId}&proposalId=${p.id}"
           style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 12px 30px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 14px;">
          USAR ESTA PROPUESTA
        </a>
      </div>
    </div>
  `).join('');

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 650px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%); padding: 30px; border-radius: 12px 12px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 24px;">Propuestas de Contenido</h1>
        <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Video + ${proposals.length} opciones de texto</p>
      </div>

      <div style="background: #f3f4f6; padding: 25px; border-radius: 0 0 12px 12px;">

        <!-- Preview del video -->
        <div style="background: white; padding: 20px; border-radius: 12px; margin-bottom: 25px; text-align: center;">
          <h3 style="color: #1f2937; margin: 0 0 15px 0;">Video seleccionado:</h3>
          <p style="color: #6b7280; font-size: 14px; margin-bottom: 15px;">${videoFilename}</p>

          ${videoUrl ? `
            <a href="${videoUrl}"
               style="display: inline-block; background: linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%); color: white; padding: 15px 30px; border-radius: 8px; text-decoration: none; font-weight: bold;">
              VER VIDEO
            </a>
          ` : '<p style="color: #9ca3af;">Video disponible en el dashboard</p>'}
        </div>

        <p style="color: #4b5563; margin-bottom: 20px; font-size: 15px;">
          Elige una de las siguientes propuestas. El texto se usara como voz para el video.
        </p>

        ${proposalCards}

        <div style="background: #dbeafe; padding: 15px; border-radius: 8px; margin-top: 20px;">
          <p style="color: #1e40af; margin: 0; font-size: 13px;">
            <strong>Como funciona:</strong><br>
            1. Haz clic en "USAR ESTA PROPUESTA" en tu favorita<br>
            2. Se generara el video con la voz en espanol<br>
            3. Recibiras otro email para dar el OK final antes de publicar
          </p>
        </div>

        <p style="color: #9ca3af; font-size: 11px; margin-top: 25px; text-align: center;">
          Batch ID: ${batchId}
        </p>
      </div>
    </div>
  `;

  try {
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
      to: process.env.ALERT_EMAIL_TO || 'vgvtoringana@gmail.com',
      subject: `Elige tu contenido - Video + ${proposals.length} propuestas`,
      html
    });
    console.log('Email enviado');
  } catch (e: any) {
    console.error('Error enviando email:', e.message);
  }
}

// GET: Ver propuestas pendientes
export async function GET() {
  try {
    // Listar videos disponibles
    const files = await fs.readdir(VIDEOS_BASE).catch(() => []);
    const videoFiles = files.filter(f => /\.(mp4|mov|avi|webm)$/i.test(f));

    // Buscar propuestas pendientes
    const { data: pending } = await supabaseAdmin
      .from('automation_logs')
      .select('*')
      .eq('workflow_name', 'video-proposals')
      .order('created_at', { ascending: false })
      .limit(5);

    return NextResponse.json({
      success: true,
      data: {
        videosDisponibles: videoFiles.length,
        listaVideos: videoFiles,
        propuestasPendientes: pending?.map(p => ({
          batchId: p.execution_id,
          status: p.metadata?.status_real || p.status,
          videoFilename: p.metadata?.videoFilename,
          proposalsCount: p.metadata?.proposals?.length || 0,
          createdAt: p.created_at
        })) || []
      }
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message });
  }
}

// Obtener duración del video usando FFmpeg
async function getVideoDuration(videoPath: string): Promise<number> {
  try {
    const { stdout, stderr } = await execAsync(
      `"${FFMPEG_PATH}" -i "${videoPath}" 2>&1`
    );

    const output = stdout || stderr;
    const match = output.match(/Duration: (\d{2}):(\d{2}):(\d{2})\.(\d{2})/);

    if (match) {
      const hours = parseInt(match[1]);
      const minutes = parseInt(match[2]);
      const seconds = parseInt(match[3]);
      const centiseconds = parseInt(match[4]);

      return hours * 3600 + minutes * 60 + seconds + centiseconds / 100;
    }

    return 30; // Default 30 segundos si no se puede detectar
  } catch (error: any) {
    // FFmpeg devuelve error code 1 pero igual tiene la duración en stderr
    const output = error.stderr || error.stdout || '';
    const match = output.match(/Duration: (\d{2}):(\d{2}):(\d{2})\.(\d{2})/);

    if (match) {
      const hours = parseInt(match[1]);
      const minutes = parseInt(match[2]);
      const seconds = parseInt(match[3]);
      const centiseconds = parseInt(match[4]);

      return hours * 3600 + minutes * 60 + seconds + centiseconds / 100;
    }

    console.log('No se pudo detectar duración, usando 30s por defecto');
    return 30;
  }
}
