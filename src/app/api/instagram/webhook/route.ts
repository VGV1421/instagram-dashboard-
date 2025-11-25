import { NextResponse } from 'next/server';

/**
 * GET /api/instagram/webhook
 *
 * Verificación del webhook de Instagram
 * Facebook envía esta petición para verificar que tu servidor es legítimo
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  const VERIFY_TOKEN = process.env.INSTAGRAM_WEBHOOK_VERIFY_TOKEN || 'mi_token_secreto_123';

  console.log('🔍 Webhook verification request:', { mode, token, challenge });

  // Verificar que el token coincida
  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('✅ Webhook verified successfully');
    // Devolver el challenge para completar la verificación
    return new NextResponse(challenge, { status: 200 });
  } else {
    console.log('❌ Webhook verification failed');
    return NextResponse.json({ error: 'Verification failed' }, { status: 403 });
  }
}

/**
 * POST /api/instagram/webhook
 *
 * Recibe notificaciones de Instagram cuando:
 * - Alguien comenta en tus posts
 * - Recibes mensajes directos
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();

    console.log('📩 Instagram webhook received:', JSON.stringify(body, null, 2));

    // Verificar que sea de Instagram
    if (body.object !== 'instagram') {
      console.log('⚠️ Not an Instagram webhook');
      return NextResponse.json({ success: false }, { status: 400 });
    }

    // Procesar cada entrada
    for (const entry of body.entry || []) {
      for (const change of entry.changes || []) {

        // COMENTARIOS
        if (change.field === 'comments') {
          const comment = change.value;
          console.log('💬 New comment:', {
            id: comment.id,
            text: comment.text,
            from: comment.from?.username
          });

          // Detectar palabras clave y enviar DM automático
          const { getDocumentConfig } = await import('@/lib/instagram/document-config');
          const documentConfig = getDocumentConfig(comment.text || '');

          if (documentConfig) {
            console.log(`🎯 Keyword detected: ${documentConfig.keyword}`);

            // Registrar en BD
            await logCommentForProcessing(comment, documentConfig.keyword);

            // Enviar DM automáticamente
            try {
              const userId = comment.from?.id;
              const username = comment.from?.username;

              if (userId) {
                console.log(`📤 Sending DM to @${username} (${userId})`);

                // Llamar a nuestro endpoint de envío de DM
                const dmResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/instagram/send-dm`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    recipientId: userId,
                    message: documentConfig.message,
                    documentUrl: documentConfig.documentUrl,
                    documentType: documentConfig.documentType
                  })
                });

                const dmResult = await dmResponse.json();

                if (dmResponse.ok) {
                  console.log(`✅ DM sent successfully to @${username}`);
                } else {
                  console.error(`❌ Failed to send DM:`, dmResult);
                }
              } else {
                console.warn('⚠️ No user ID in comment, cannot send DM');
              }
            } catch (error) {
              console.error('❌ Error sending DM:', error);
              // No fallar el webhook si el DM falla
            }
          }
        }

        // MENSAJES DIRECTOS
        if (change.field === 'messages') {
          const message = change.value;
          console.log('📨 New message:', {
            id: message.id,
            text: message.text
          });
        }
      }
    }

    // IMPORTANTE: Devolver 200 rápidamente para que Facebook no reintente
    return NextResponse.json({ success: true }, { status: 200 });

  } catch (error: any) {
    console.error('❌ Error processing webhook:', error);
    // Aun así devolver 200 para evitar que Facebook siga reintentando
    return NextResponse.json({ success: true }, { status: 200 });
  }
}

/**
 * Guarda el comentario para procesarlo después
 */
async function logCommentForProcessing(comment: any, keyword: string) {
  try {
    const { supabaseAdmin } = await import('@/lib/supabase/simple-client');

    await supabaseAdmin.from('automation_logs').insert({
      workflow_name: 'instagram-comment-reply',
      execution_id: `comment-${comment.id}`,
      status: 'pending',
      metadata: {
        comment_id: comment.id,
        comment_text: comment.text,
        keyword: keyword,
        user_id: comment.from?.id,
        username: comment.from?.username,
        timestamp: new Date().toISOString()
      }
    });

    console.log('✅ Comment logged for processing');
  } catch (error) {
    console.error('⚠️ Error logging comment:', error);
  }
}
