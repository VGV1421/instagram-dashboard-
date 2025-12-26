import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
const TO_EMAIL = process.env.ALERT_EMAIL_TO || 'vgvtoringana@gmail.com';

export interface ContentNotification {
  type: 'content_generated' | 'automation_complete' | 'video_ready' | 'error' | 'full_report';
  title: string;
  details: {
    contentCount?: number;
    competitorsSynced?: number;
    videoUrl?: string;
    error?: string;
    executionTime?: number;
    batchId?: string;  // Para botones de aprobación
    generatedContent?: Array<{
      type: string;
      topic: string;
      caption: string;
      script?: string;
      hashtags?: string[];
      engagement_prediction: string;
      photo?: string;  // Nombre del archivo de avatar
      photoPath?: string;  // Ruta completa del avatar
      photoScore?: number;  // Score del avatar (0-100)
      photoReason?: string;  // Razón de selección
      photoBase64?: string;  // Imagen en base64 para mostrar en email
    }>;
  };
}

/**
 * Envía notificación por email cuando se genera contenido
 */
export async function sendContentNotification(notification: ContentNotification) {
  const { type, title, details } = notification;

  const templates: Record<string, { subject: string; html: string }> = {
    content_generated: {
      subject: `🎉 Nuevo contenido generado - ${details.contentCount} piezas`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0;">🎉 ¡Contenido Generado!</h1>
          </div>
          <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
            <p style="font-size: 18px; color: #374151;">${title}</p>

            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #6366f1; margin-top: 0;">📊 Resumen:</h3>
              <ul style="color: #4b5563;">
                <li><strong>Contenido creado:</strong> ${details.contentCount || 0} piezas</li>
                <li><strong>Competidores analizados:</strong> ${details.competitorsSynced || 0}</li>
              </ul>
            </div>

            <a href="http://localhost:3000/contenido-programado"
               style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                      color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold;">
              Ver Contenido →
            </a>

            <p style="color: #9ca3af; font-size: 12px; margin-top: 30px;">
              Generado automáticamente por Instagram Dashboard
            </p>
          </div>
        </div>
      `
    },
    automation_complete: {
      subject: `✅ Ciclo de automatización completado`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0;">✅ Automatización Completada</h1>
          </div>
          <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
            <p style="font-size: 18px; color: #374151;">${title}</p>

            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #10b981; margin-top: 0;">📈 Resultados:</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">Competidores sincronizados</td>
                  <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; font-weight: bold; color: #10b981;">${details.competitorsSynced || 0}</td>
                </tr>
                <tr>
                  <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">Contenido generado</td>
                  <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; font-weight: bold; color: #6366f1;">${details.contentCount || 0}</td>
                </tr>
                <tr>
                  <td style="padding: 8px;">Tiempo de ejecución</td>
                  <td style="padding: 8px; font-weight: bold;">${Math.round((details.executionTime || 0) / 1000)}s</td>
                </tr>
              </table>
            </div>

            <div style="display: flex; gap: 10px;">
              <a href="http://localhost:3000/contenido-programado"
                 style="display: inline-block; background: #6366f1; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none;">
                Ver Contenido
              </a>
              <a href="http://localhost:3000/video-generator"
                 style="display: inline-block; background: #ec4899; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none;">
                Generar Videos
              </a>
            </div>
          </div>
        </div>
      `
    },
    video_ready: {
      subject: `🎬 Video con avatar listo para descargar`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%); padding: 30px; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0;">🎬 ¡Video Listo!</h1>
          </div>
          <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
            <p style="font-size: 18px; color: #374151;">${title}</p>

            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
              <p style="color: #6b7280;">Tu video con avatar Daniella está listo</p>
              ${details.videoUrl ? `
                <a href="${details.videoUrl}"
                   style="display: inline-block; background: linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%);
                          color: white; padding: 15px 30px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px;">
                  ⬇️ Descargar Video
                </a>
              ` : ''}
            </div>

            <p style="color: #6b7280; font-size: 14px;">
              Ya puedes subir este video a Instagram Reels
            </p>
          </div>
        </div>
      `
    },
    error: {
      subject: `❌ Error en automatización`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); padding: 30px; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0;">❌ Error Detectado</h1>
          </div>
          <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
            <p style="font-size: 18px; color: #374151;">${title}</p>

            <div style="background: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ef4444;">
              <p style="color: #991b1b; margin: 0; font-family: monospace;">${details.error || 'Error desconocido'}</p>
            </div>

            <p style="color: #6b7280; font-size: 14px;">
              Revisa la configuración y vuelve a intentarlo.
            </p>
          </div>
        </div>
      `
    },
    full_report: {
      subject: `📱 Tu contenido de Instagram está listo - ${details.contentCount} piezas`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%); padding: 30px; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 24px;">📱 Contenido Listo para Publicar</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Generado automáticamente por tu Dashboard</p>
          </div>
          <div style="background: #f9fafb; padding: 20px; border-radius: 0 0 10px 10px;">

            <div style="background: white; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
              <h3 style="color: #6366f1; margin: 0 0 10px 0; font-size: 14px;">📊 RESUMEN</h3>
              <p style="margin: 5px 0; color: #374151;">✅ Competidores analizados: <strong>${details.competitorsSynced || 0}</strong></p>
              <p style="margin: 5px 0; color: #374151;">✅ Contenido generado: <strong>${details.contentCount || 0}</strong> piezas</p>
              <p style="margin: 5px 0; color: #374151;">⏱️ Tiempo: <strong>${Math.round((details.executionTime || 0) / 1000)}s</strong></p>
            </div>

            ${details.generatedContent?.map((content, index) => {
              const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
              const approveUrl = details.batchId
                ? `${baseUrl}/api/automation/approve-content?batchId=${details.batchId}&proposalIndex=${index}`
                : null;

              return `
              <div style="background: white; padding: 15px; border-radius: 8px; margin-bottom: 15px; border-left: 4px solid ${content.type === 'reel' ? '#ec4899' : content.type === 'carousel' ? '#8b5cf6' : '#6366f1'};">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                  <span style="background: ${content.type === 'reel' ? '#fce7f3' : content.type === 'carousel' ? '#ede9fe' : '#e0e7ff'}; color: ${content.type === 'reel' ? '#be185d' : content.type === 'carousel' ? '#6d28d9' : '#4338ca'}; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; text-transform: uppercase;">
                    ${content.type === 'reel' ? '🎬 REEL' : content.type === 'carousel' ? '📸 CARRUSEL' : '📝 POST'}
                  </span>
                  <span style="background: ${content.engagement_prediction === 'high' ? '#d1fae5' : '#fef3c7'}; color: ${content.engagement_prediction === 'high' ? '#065f46' : '#92400e'}; padding: 4px 8px; border-radius: 4px; font-size: 11px;">
                    ${content.engagement_prediction === 'high' ? '🔥 Alto engagement' : '📈 Medio'}
                  </span>
                </div>

                <h4 style="color: #1f2937; margin: 0 0 10px 0; font-size: 16px;">${content.topic}</h4>

                ${content.photo ? `
                  <div style="background: linear-gradient(135deg, #fdf2f8 0%, #fce7f3 100%); padding: 12px; border-radius: 6px; margin-bottom: 10px; border: 1px solid #fbcfe8;">
                    <h5 style="color: #be185d; margin: 0 0 8px 0; font-size: 13px; font-weight: bold;">📸 AVATAR SELECCIONADO POR IA</h5>
                    <div style="display: flex; gap: 12px; align-items: center;">
                      ${content.photo ? `
                        <div style="flex-shrink: 0;">
                          <img src="cid:${content.photo}" alt="Avatar" style="width: 80px; height: 80px; object-fit: cover; border-radius: 8px; border: 2px solid #ec4899;" />
                        </div>
                      ` : ''}
                      <div style="flex: 1;">
                        <p style="margin: 4px 0; font-size: 12px; color: #831843;">
                          <strong>Archivo:</strong> ${content.photo}
                        </p>
                        <p style="margin: 4px 0; font-size: 12px; color: #831843;">
                          <strong>Score:</strong> <span style="background: ${content.photoScore && content.photoScore >= 80 ? '#86efac' : '#fde68a'}; color: ${content.photoScore && content.photoScore >= 80 ? '#14532d' : '#78350f'}; padding: 2px 8px; border-radius: 12px; font-weight: bold;">${content.photoScore || 0}/100</span>
                        </p>
                        ${content.photoReason ? `
                          <p style="margin: 4px 0; font-size: 11px; color: #9f1239; font-style: italic;">
                            💡 ${content.photoReason}
                          </p>
                        ` : ''}
                      </div>
                    </div>
                  </div>
                ` : ''}

                <div style="background: #f3f4f6; padding: 12px; border-radius: 6px; margin-bottom: 10px;">
                  <p style="color: #374151; margin: 0; font-size: 14px; line-height: 1.5; white-space: pre-wrap;">${content.caption.slice(0, 500)}${content.caption.length > 500 ? '...' : ''}</p>
                </div>

                ${content.script ? `
                  <details style="margin-top: 10px;">
                    <summary style="color: #6366f1; cursor: pointer; font-size: 13px; font-weight: 500;">🎙️ Ver script del video</summary>
                    <div style="background: #faf5ff; padding: 10px; border-radius: 6px; margin-top: 8px;">
                      <p style="color: #4c1d95; margin: 0; font-size: 13px; line-height: 1.5;">${content.script.slice(0, 400)}${content.script.length > 400 ? '...' : ''}</p>
                    </div>
                  </details>
                ` : ''}

                ${content.hashtags && content.hashtags.length > 0 ? `
                  <p style="color: #6366f1; font-size: 12px; margin: 10px 0 0 0;">${content.hashtags.slice(0, 10).join(' ')}</p>
                ` : ''}

                ${approveUrl ? `
                  <div style="text-align: center; margin-top: 15px; padding-top: 15px; border-top: 1px solid #e5e7eb;">
                    <a href="${approveUrl}"
                       style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%);
                              color: white; padding: 12px 30px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 14px;">
                      ✅ APROBAR ESTA PROPUESTA
                    </a>
                    <p style="color: #9ca3af; font-size: 11px; margin: 8px 0 0 0;">
                      Click para generar video y programar publicación
                    </p>
                  </div>
                ` : ''}
              </div>
            `;
            }).join('') || '<p style="color: #6b7280;">No hay contenido generado</p>'}

            <div style="text-align: center; margin-top: 20px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
              <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                🤖 Generado automáticamente por Instagram Dashboard<br>
                Copia y pega el contenido directamente en Instagram
              </p>
            </div>
          </div>
        </div>
      `
    }
  };

  const template = templates[type] || templates.content_generated;

  try {
    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: TO_EMAIL,
      subject: template.subject,
      html: template.html
    });

    console.log('📧 Email enviado:', result);
    return { success: true, id: result.data?.id };
  } catch (error: any) {
    console.error('❌ Error enviando email:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Notificación rápida de contenido generado
 */
export async function notifyContentGenerated(contentCount: number, competitorsSynced: number = 0) {
  return sendContentNotification({
    type: 'content_generated',
    title: `Se han generado ${contentCount} nuevas piezas de contenido basadas en análisis de competidores.`,
    details: { contentCount, competitorsSynced }
  });
}

/**
 * Notificación de ciclo de automatización completado
 */
export async function notifyAutomationComplete(
  contentCount: number,
  competitorsSynced: number,
  executionTime: number
) {
  return sendContentNotification({
    type: 'automation_complete',
    title: 'El ciclo de automatización ha finalizado exitosamente.',
    details: { contentCount, competitorsSynced, executionTime }
  });
}

/**
 * Notificacion de video listo para revision
 */
export async function notifyVideoReady(videoUrl: string, contentId?: string, topic?: string) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  // Email personalizado con boton de aprobar
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%); padding: 30px; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0;">Video Listo para Revisar</h1>
      </div>
      <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
        ${topic ? `<p style="font-size: 16px; color: #374151;"><strong>Tema:</strong> ${topic}</p>` : ''}

        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
          <p style="color: #6b7280; margin-bottom: 15px;">Tu video con avatar esta listo</p>

          <a href="${videoUrl}"
             style="display: inline-block; background: linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%);
                    color: white; padding: 15px 30px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px; margin-bottom: 15px;">
            Ver/Descargar Video
          </a>
        </div>

        <div style="text-align: center; margin-top: 20px;">
          <p style="color: #4b5563; margin-bottom: 15px;">Si el video esta bien, apruebalo para programar la publicacion:</p>

          ${contentId ? `
            <a href="${baseUrl}/api/automation/publish-approved?contentId=${contentId}&action=publish"
               style="display: inline-block; background: #10b981; color: white; padding: 12px 25px; border-radius: 8px; text-decoration: none; font-weight: bold; margin-right: 10px;">
              APROBAR Y PUBLICAR AHORA
            </a>
          ` : ''}

          <a href="mailto:vgvtoringana@gmail.com?subject=RECHAZAR%20VIDEO&body=Rechazo%20el%20video.%20Por%20favor%20genera%20otro."
             style="display: inline-block; background: #ef4444; color: white; padding: 12px 25px; border-radius: 8px; text-decoration: none; font-weight: bold;">
            RECHAZAR
          </a>
        </div>

        <div style="background: #dbeafe; padding: 15px; border-radius: 8px; margin-top: 25px;">
          <p style="color: #1e40af; margin: 0; font-size: 13px;">
            <strong>Mejores horas para publicar en Instagram:</strong><br>
            - Lunes a Viernes: 11:00 - 13:00 y 19:00 - 21:00<br>
            - Sabado: 10:00 - 12:00<br>
            - Domingo: 17:00 - 19:00
          </p>
        </div>

        <p style="color: #9ca3af; font-size: 12px; margin-top: 20px; text-align: center;">
          Generado automaticamente por Instagram Dashboard
        </p>
      </div>
    </div>
  `;

  try {
    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: TO_EMAIL,
      subject: '🎬 Video listo - Revisa y aprueba para publicar',
      html
    });

    console.log('Email de video enviado:', result);
    return { success: true, id: result.data?.id };
  } catch (error: any) {
    console.error('Error enviando email de video:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Notificación de error
 */
export async function notifyError(error: string) {
  return sendContentNotification({
    type: 'error',
    title: 'Se produjo un error durante la automatización.',
    details: { error }
  });
}

/**
 * Notificación completa con todo el contenido generado
 * Para ver desde el móvil sin necesidad del dashboard
 */
export async function notifyFullReport(
  contentCount: number,
  competitorsSynced: number,
  executionTime: number,
  generatedContent: Array<{
    type: string;
    topic: string;
    caption: string;
    script?: string;
    hashtags?: string[];
    engagement_prediction: string;
    photo?: string;  // Nombre del archivo de avatar
    photoPath?: string;  // Ruta completa del avatar
    photoScore?: number;  // Score del avatar (0-100)
    photoReason?: string;  // Razón de selección
    photoBase64?: string;  // Imagen en base64 para mostrar en email
  }>,
  batchId?: string  // Agregar batchId para botones de aprobación
) {
  // Preparar attachments con las fotos
  const attachments = generatedContent
    .filter(c => c.photoBase64 && c.photo)
    .map(c => ({
      filename: c.photo!,
      content: c.photoBase64!.split('base64,')[1], // Remover el prefijo data:image/...;base64,
      cid: c.photo! // Content-ID para referenciar en el HTML
    }));

  // Generar HTML del email
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%); padding: 30px; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 24px;">📱 Contenido Listo para Publicar</h1>
        <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Generado automáticamente por tu Dashboard</p>
      </div>
      <div style="background: #f9fafb; padding: 20px; border-radius: 0 0 10px 10px;">
        <div style="background: white; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
          <h3 style="color: #6366f1; margin: 0 0 10px 0; font-size: 14px;">📊 RESUMEN</h3>
          <p style="margin: 5px 0; color: #374151;">✅ Competidores analizados: <strong>${competitorsSynced}</strong></p>
          <p style="margin: 5px 0; color: #374151;">✅ Contenido generado: <strong>${contentCount}</strong> piezas</p>
          <p style="margin: 5px 0; color: #374151;">⏱️ Tiempo: <strong>${Math.round(executionTime / 1000)}s</strong></p>
        </div>
        ${generatedContent.map((content, index) => {
          const approveUrl = batchId
            ? `${baseUrl}/api/automation/approve-content?batchId=${batchId}&proposalIndex=${index}`
            : null;

          return `
          <div style="background: white; padding: 15px; border-radius: 8px; margin-bottom: 15px; border-left: 4px solid ${content.type === 'reel' ? '#ec4899' : '#6366f1'};">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
              <span style="background: ${content.type === 'reel' ? '#fce7f3' : '#e0e7ff'}; color: ${content.type === 'reel' ? '#be185d' : '#4338ca'}; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; text-transform: uppercase;">
                ${content.type === 'reel' ? '🎬 REEL' : '📝 POST'}
              </span>
              <span style="background: ${content.engagement_prediction === 'high' ? '#d1fae5' : '#fef3c7'}; color: ${content.engagement_prediction === 'high' ? '#065f46' : '#92400e'}; padding: 4px 8px; border-radius: 4px; font-size: 11px;">
                ${content.engagement_prediction === 'high' ? '🔥 Alto engagement' : '📈 Medio'}
              </span>
            </div>
            <h4 style="color: #1f2937; margin: 0 0 10px 0; font-size: 16px;">${content.topic}</h4>
            ${content.photo ? `
              <div style="background: linear-gradient(135deg, #fdf2f8 0%, #fce7f3 100%); padding: 12px; border-radius: 6px; margin-bottom: 10px; border: 1px solid #fbcfe8;">
                <h5 style="color: #be185d; margin: 0 0 8px 0; font-size: 13px; font-weight: bold;">📸 AVATAR SELECCIONADO POR IA</h5>
                <div style="display: flex; gap: 12px; align-items: center;">
                  <div style="flex-shrink: 0;">
                    <img src="cid:${content.photo}" alt="Avatar" style="width: 80px; height: 80px; object-fit: cover; border-radius: 8px; border: 2px solid #ec4899;" />
                  </div>
                  <div style="flex: 1;">
                    <p style="margin: 4px 0; font-size: 12px; color: #831843;"><strong>Archivo:</strong> ${content.photo}</p>
                    <p style="margin: 4px 0; font-size: 12px; color: #831843;"><strong>Score:</strong> <span style="background: ${content.photoScore && content.photoScore >= 80 ? '#86efac' : '#fde68a'}; color: ${content.photoScore && content.photoScore >= 80 ? '#14532d' : '#78350f'}; padding: 2px 8px; border-radius: 12px; font-weight: bold;">${content.photoScore || 0}/100</span></p>
                    ${content.photoReason ? `<p style="margin: 4px 0; font-size: 11px; color: #9f1239; font-style: italic;">💡 ${content.photoReason}</p>` : ''}
                  </div>
                </div>
              </div>
            ` : ''}
            <div style="background: #f3f4f6; padding: 12px; border-radius: 6px; margin-bottom: 10px;">
              <p style="color: #374151; margin: 0; font-size: 14px; line-height: 1.5; white-space: pre-wrap;">${content.caption.slice(0, 500)}${content.caption.length > 500 ? '...' : ''}</p>
            </div>
            ${content.script ? `
              <details style="margin-top: 10px;">
                <summary style="color: #6366f1; cursor: pointer; font-size: 13px; font-weight: 500;">🎙️ Ver script del video</summary>
                <div style="background: #faf5ff; padding: 10px; border-radius: 6px; margin-top: 8px;">
                  <p style="color: #4c1d95; margin: 0; font-size: 13px; line-height: 1.5;">${content.script.slice(0, 400)}${content.script.length > 400 ? '...' : ''}</p>
                </div>
              </details>
            ` : ''}
            ${content.hashtags && content.hashtags.length > 0 ? `
              <p style="color: #6366f1; font-size: 12px; margin: 10px 0 0 0;">${content.hashtags.slice(0, 10).join(' ')}</p>
            ` : ''}
            ${approveUrl ? `
              <div style="text-align: center; margin-top: 15px; padding-top: 15px; border-top: 1px solid #e5e7eb;">
                <a href="${approveUrl}" style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 12px 30px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 14px;">
                  ✅ APROBAR ESTA PROPUESTA
                </a>
                <p style="color: #9ca3af; font-size: 11px; margin: 8px 0 0 0;">Click para generar video y programar publicación</p>
              </div>
            ` : ''}
          </div>
          `;
        }).join('')}
        <div style="text-align: center; margin-top: 20px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
          <p style="color: #9ca3af; font-size: 12px; margin: 0;">🤖 Generado automáticamente por Instagram Dashboard<br>Copia y pega el contenido directamente en Instagram</p>
        </div>
      </div>
    </div>
  `;

  try {
    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: TO_EMAIL,
      subject: `📱 Tu contenido de Instagram está listo - ${contentCount} piezas`,
      html,
      attachments: attachments.length > 0 ? attachments : undefined
    });

    console.log('📧 Email enviado con', attachments.length, 'fotos adjuntas:', result);
    return { success: true, id: result.data?.id };
  } catch (error: any) {
    console.error('❌ Error enviando email:', error);
    return { success: false, error: error.message };
  }
}
