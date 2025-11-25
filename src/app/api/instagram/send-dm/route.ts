import { NextResponse } from 'next/server';

/**
 * POST /api/instagram/send-dm
 *
 * Envía un mensaje directo a un usuario de Instagram
 * Puede enviar texto, enlaces, o archivos
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { recipientId, message, documentUrl, documentType = 'info' } = body;

    if (!recipientId || !message) {
      return NextResponse.json(
        { error: 'recipientId and message are required' },
        { status: 400 }
      );
    }

    const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN;
    const igUserId = process.env.INSTAGRAM_USER_ID;

    if (!accessToken || !igUserId) {
      return NextResponse.json(
        { error: 'Instagram credentials not configured' },
        { status: 500 }
      );
    }

    console.log('📤 Sending DM to:', recipientId);

    // Construir el mensaje
    let messagePayload: any = {
      recipient: {
        id: recipientId
      },
      message: {
        text: message
      }
    };

    // Si hay documento, agregarlo como enlace en el mensaje
    if (documentUrl) {
      messagePayload.message.text = `${message}\n\n📄 Descarga tu documento aquí:\n${documentUrl}`;
    }

    // Enviar el mensaje usando Instagram Graph API
    const response = await fetch(
      `https://graph.facebook.com/v18.0/${igUserId}/messages`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify(messagePayload)
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error('❌ Error sending DM:', data);

      // Si el error es de permisos, dar información útil
      if (data.error?.code === 10 || data.error?.message?.includes('permission')) {
        return NextResponse.json({
          error: 'Instagram DM permissions not granted',
          details: data.error,
          help: `
            Para enviar DMs necesitas:
            1. Ir a Facebook App Dashboard
            2. Instagram > Permissions
            3. Solicitar 'instagram_manage_messages' permission
            4. Pasar App Review de Meta
          `
        }, { status: 403 });
      }

      return NextResponse.json(
        { error: 'Failed to send DM', details: data.error },
        { status: response.status }
      );
    }

    console.log('✅ DM sent successfully:', data);

    // Registrar en la BD
    await logDMSent(recipientId, message, documentType);

    return NextResponse.json({
      success: true,
      messageId: data.message_id,
      recipientId: data.recipient_id
    });

  } catch (error: any) {
    console.error('❌ Error in send-dm:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}

/**
 * Registra el envío del DM en la base de datos
 */
async function logDMSent(recipientId: string, message: string, documentType: string) {
  try {
    const { supabaseAdmin } = await import('@/lib/supabase/simple-client');

    await supabaseAdmin.from('automation_logs').insert({
      workflow_name: 'instagram-dm-sent',
      execution_id: `dm-${recipientId}-${Date.now()}`,
      status: 'success',
      metadata: {
        recipient_id: recipientId,
        message_preview: message.substring(0, 100),
        document_type: documentType,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('⚠️ Error logging DM:', error);
  }
}
