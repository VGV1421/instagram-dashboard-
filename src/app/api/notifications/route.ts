import { NextResponse } from 'next/server';
import {
  sendContentNotification,
  notifyContentGenerated,
  notifyAutomationComplete,
  notifyVideoReady,
  notifyError,
  ContentNotification
} from '@/lib/email/notifications';

/**
 * POST /api/notifications
 *
 * Envía notificaciones por email manualmente o para testing.
 *
 * Body:
 * - type: 'content_generated' | 'automation_complete' | 'video_ready' | 'error' | 'test'
 * - data: objeto con los datos según el tipo
 */

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { type, data = {} } = body;

    let result;

    switch (type) {
      case 'content_generated':
        result = await notifyContentGenerated(
          data.contentCount || 1,
          data.competitorsSynced || 0
        );
        break;

      case 'automation_complete':
        result = await notifyAutomationComplete(
          data.contentCount || 0,
          data.competitorsSynced || 0,
          data.executionTime || 0
        );
        break;

      case 'video_ready':
        if (!data.videoUrl) {
          return NextResponse.json({
            success: false,
            error: 'videoUrl es requerido para notificación de video'
          }, { status: 400 });
        }
        result = await notifyVideoReady(data.videoUrl);
        break;

      case 'error':
        result = await notifyError(data.error || 'Error de prueba');
        break;

      case 'test':
        // Notificación de prueba
        result = await sendContentNotification({
          type: 'content_generated',
          title: 'Esta es una notificación de prueba del sistema',
          details: {
            contentCount: 5,
            competitorsSynced: 3
          }
        });
        break;

      case 'custom':
        // Notificación personalizada
        if (!data.notification) {
          return NextResponse.json({
            success: false,
            error: 'notification object es requerido para tipo custom'
          }, { status: 400 });
        }
        result = await sendContentNotification(data.notification as ContentNotification);
        break;

      default:
        return NextResponse.json({
          success: false,
          error: `Tipo de notificación no válido: ${type}`,
          validTypes: ['content_generated', 'automation_complete', 'video_ready', 'error', 'test', 'custom']
        }, { status: 400 });
    }

    return NextResponse.json({
      success: result.success,
      data: {
        type,
        emailId: result.id,
        message: result.success
          ? 'Notificación enviada correctamente'
          : `Error: ${result.error}`
      }
    });

  } catch (error: any) {
    console.error('Error enviando notificación:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

/**
 * GET /api/notifications
 *
 * Obtiene información sobre el sistema de notificaciones
 */
export async function GET() {
  const resendConfigured = !!process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
  const toEmail = process.env.ALERT_EMAIL_TO || 'vgvtoringana@gmail.com';

  return NextResponse.json({
    success: true,
    data: {
      configured: resendConfigured,
      fromEmail: resendConfigured ? fromEmail : null,
      toEmail: resendConfigured ? toEmail : null,
      availableTypes: [
        {
          type: 'content_generated',
          description: 'Notifica cuando se genera contenido nuevo',
          requiredData: ['contentCount', 'competitorsSynced (opcional)']
        },
        {
          type: 'automation_complete',
          description: 'Notifica cuando termina el ciclo de automatización',
          requiredData: ['contentCount', 'competitorsSynced', 'executionTime']
        },
        {
          type: 'video_ready',
          description: 'Notifica cuando un video está listo',
          requiredData: ['videoUrl']
        },
        {
          type: 'error',
          description: 'Notifica sobre errores',
          requiredData: ['error']
        },
        {
          type: 'test',
          description: 'Envía una notificación de prueba',
          requiredData: []
        }
      ],
      instructions: !resendConfigured ? {
        message: 'Configura RESEND_API_KEY en .env.local',
        steps: [
          '1. Ve a https://resend.com y crea una cuenta',
          '2. Obtén tu API key',
          '3. Añade RESEND_API_KEY=tu_key en .env.local',
          '4. Opcional: RESEND_FROM_EMAIL y ALERT_EMAIL_TO'
        ]
      } : null
    }
  });
}
