import { NextResponse } from 'next/server';

/**
 * GET /api/instagram/callback
 *
 * Callback para OAuth de Facebook/Instagram.
 * Recibe el codigo de autorizacion y lo intercambia por un token.
 */

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');

  if (error) {
    return new Response(`
      <html>
        <body style="font-family: Arial; padding: 40px; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #ef4444;">Error de Autorizacion</h1>
          <p><strong>Error:</strong> ${error}</p>
          <p><strong>Descripcion:</strong> ${errorDescription || 'Sin descripcion'}</p>
          <a href="/" style="color: #6366f1;">Volver al Dashboard</a>
        </body>
      </html>
    `, {
      headers: { 'Content-Type': 'text/html' }
    });
  }

  if (!code) {
    return new Response(`
      <html>
        <body style="font-family: Arial; padding: 40px; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #ef4444;">Error</h1>
          <p>No se recibio codigo de autorizacion.</p>
          <a href="/api/instagram/setup-publish" style="color: #6366f1;">Intentar de nuevo</a>
        </body>
      </html>
    `, {
      headers: { 'Content-Type': 'text/html' }
    });
  }

  // Intercambiar codigo por token
  const appId = process.env.INSTAGRAM_APP_ID;
  const appSecret = process.env.INSTAGRAM_APP_SECRET;
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/instagram/callback`;

  try {
    // Paso 1: Token de corta duracion
    const tokenResponse = await fetch(
      `https://graph.facebook.com/v18.0/oauth/access_token?` +
      `client_id=${appId}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&client_secret=${appSecret}` +
      `&code=${code}`
    );

    const tokenData = await tokenResponse.json();

    if (tokenData.error) {
      return new Response(`
        <html>
          <body style="font-family: Arial; padding: 40px; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #ef4444;">Error obteniendo token</h1>
            <p>${tokenData.error.message}</p>
            <a href="/api/instagram/setup-publish" style="color: #6366f1;">Intentar de nuevo</a>
          </body>
        </html>
      `, {
        headers: { 'Content-Type': 'text/html' }
      });
    }

    const shortLivedToken = tokenData.access_token;

    // Paso 2: Token de larga duracion (60 dias)
    const longLivedResponse = await fetch(
      `https://graph.facebook.com/v18.0/oauth/access_token?` +
      `grant_type=fb_exchange_token` +
      `&client_id=${appId}` +
      `&client_secret=${appSecret}` +
      `&fb_exchange_token=${shortLivedToken}`
    );

    const longLivedData = await longLivedResponse.json();
    const longLivedToken = longLivedData.access_token || shortLivedToken;
    const expiresIn = longLivedData.expires_in || 3600;

    // Paso 3: Obtener paginas
    const pagesResponse = await fetch(
      `https://graph.facebook.com/v18.0/me/accounts?access_token=${longLivedToken}`
    );
    const pagesData = await pagesResponse.json();

    // Paso 4: Buscar Instagram Business Account
    let igUserId = null;
    let igUsername = null;
    let pageName = null;

    for (const page of pagesData.data || []) {
      const igResponse = await fetch(
        `https://graph.facebook.com/v18.0/${page.id}?fields=instagram_business_account&access_token=${longLivedToken}`
      );
      const igData = await igResponse.json();

      if (igData.instagram_business_account) {
        igUserId = igData.instagram_business_account.id;
        pageName = page.name;

        const usernameResponse = await fetch(
          `https://graph.facebook.com/v18.0/${igUserId}?fields=username&access_token=${longLivedToken}`
        );
        const usernameData = await usernameResponse.json();
        igUsername = usernameData.username;
        break;
      }
    }

    if (!igUserId) {
      return new Response(`
        <html>
          <body style="font-family: Arial; padding: 40px; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #f59e0b;">Cuenta de Instagram no encontrada</h1>
            <p>No se encontro una cuenta de Instagram Business conectada a tus paginas de Facebook.</p>
            <h3>Paginas encontradas:</h3>
            <ul>
              ${(pagesData.data || []).map((p: any) => `<li>${p.name}</li>`).join('')}
            </ul>
            <h3>Que hacer:</h3>
            <ol>
              <li>Ve a tu Pagina de Facebook</li>
              <li>Configuracion > Instagram</li>
              <li>Conecta tu cuenta de Instagram Business</li>
              <li><a href="/api/instagram/setup-publish">Intenta de nuevo</a></li>
            </ol>
          </body>
        </html>
      `, {
        headers: { 'Content-Type': 'text/html' }
      });
    }

    // Exito!
    const expirationDate = new Date(Date.now() + expiresIn * 1000);

    return new Response(`
      <html>
        <head>
          <style>
            body { font-family: Arial; padding: 40px; max-width: 700px; margin: 0 auto; background: #f9fafb; }
            .success { background: #10b981; color: white; padding: 20px; border-radius: 10px; margin-bottom: 20px; }
            .config { background: white; padding: 20px; border-radius: 10px; border: 1px solid #e5e7eb; }
            .token { background: #1f2937; color: #10b981; padding: 15px; border-radius: 8px; word-break: break-all; font-family: monospace; font-size: 12px; margin: 10px 0; }
            .copy-btn { background: #6366f1; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; margin-top: 10px; }
            .copy-btn:hover { background: #4f46e5; }
          </style>
        </head>
        <body>
          <div class="success">
            <h1>Autorizacion Exitosa!</h1>
            <p>Cuenta conectada: <strong>@${igUsername}</strong></p>
            <p>Pagina de Facebook: <strong>${pageName}</strong></p>
          </div>

          <div class="config">
            <h2>Configuracion para .env.local</h2>
            <p>Copia estos valores a tu archivo <code>.env.local</code>:</p>

            <h3>INSTAGRAM_ACCESS_TOKEN</h3>
            <div class="token" id="token">${longLivedToken}</div>
            <button class="copy-btn" onclick="navigator.clipboard.writeText('${longLivedToken}')">Copiar Token</button>

            <h3>INSTAGRAM_USER_ID</h3>
            <div class="token" id="userid">${igUserId}</div>
            <button class="copy-btn" onclick="navigator.clipboard.writeText('${igUserId}')">Copiar User ID</button>

            <h3 style="margin-top: 30px;">Informacion del Token</h3>
            <ul>
              <li><strong>Expira:</strong> ${expirationDate.toLocaleDateString('es-ES')} (${Math.floor(expiresIn / 86400)} dias)</li>
              <li><strong>Username:</strong> @${igUsername}</li>
            </ul>

            <div style="background: #dbeafe; padding: 15px; border-radius: 8px; margin-top: 20px;">
              <h4 style="color: #1e40af; margin-top: 0;">Siguiente paso:</h4>
              <ol style="color: #1e40af;">
                <li>Copia el token y el User ID</li>
                <li>Actualiza tu archivo .env.local</li>
                <li>Reinicia el servidor: <code>npm run dev</code></li>
                <li>Prueba la publicacion automatica</li>
              </ol>
            </div>

            <a href="/" style="display: inline-block; background: #10b981; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin-top: 20px;">
              Ir al Dashboard
            </a>
          </div>
        </body>
      </html>
    `, {
      headers: { 'Content-Type': 'text/html' }
    });

  } catch (error: any) {
    return new Response(`
      <html>
        <body style="font-family: Arial; padding: 40px; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #ef4444;">Error</h1>
          <p>${error.message}</p>
          <a href="/api/instagram/setup-publish" style="color: #6366f1;">Intentar de nuevo</a>
        </body>
      </html>
    `, {
      headers: { 'Content-Type': 'text/html' }
    });
  }
}
