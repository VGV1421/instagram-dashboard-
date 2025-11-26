import { NextResponse } from 'next/server';

/**
 * GET /api/instagram/setup-publish
 *
 * Guia para configurar publicacion automatica en Instagram.
 * Genera las URLs necesarias para obtener los permisos correctos.
 */

export async function GET() {
  const appId = process.env.INSTAGRAM_APP_ID;
  const appSecret = process.env.INSTAGRAM_APP_SECRET;
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/instagram/callback`;

  if (!appId) {
    return NextResponse.json({
      success: false,
      error: 'Falta INSTAGRAM_APP_ID en .env.local',
      instructions: {
        paso1: 'Ve a https://developers.facebook.com',
        paso2: 'Crea o selecciona tu app',
        paso3: 'Copia el App ID y App Secret',
        paso4: 'Anadir a .env.local: INSTAGRAM_APP_ID=xxx y INSTAGRAM_APP_SECRET=xxx'
      }
    });
  }

  // Permisos necesarios para publicar
  const permissions = [
    'instagram_basic',
    'instagram_content_publish',
    'instagram_manage_comments',
    'instagram_manage_insights',
    'pages_show_list',
    'pages_read_engagement',
    'business_management'
  ].join(',');

  // URL para iniciar OAuth
  const authUrl = `https://www.facebook.com/v18.0/dialog/oauth?` +
    `client_id=${appId}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&scope=${permissions}` +
    `&response_type=code`;

  return NextResponse.json({
    success: true,
    data: {
      status: 'setup_required',
      message: 'Sigue estos pasos para habilitar la publicacion automatica',

      requisitos: {
        cuenta: 'Instagram Business o Creator (no personal)',
        pagina: 'Conectada a una Pagina de Facebook',
        app: 'App de Facebook configurada con Instagram Graph API'
      },

      pasos: [
        {
          paso: 1,
          titulo: 'Verifica tu cuenta de Instagram',
          descripcion: 'Tu cuenta debe ser Business o Creator',
          como: 'Instagram > Configuracion > Cuenta > Cambiar a cuenta profesional'
        },
        {
          paso: 2,
          titulo: 'Conecta a Facebook Page',
          descripcion: 'Tu cuenta de Instagram debe estar conectada a una Pagina de Facebook',
          como: 'Facebook Page > Configuracion > Instagram > Conectar cuenta'
        },
        {
          paso: 3,
          titulo: 'Configura la app de Facebook',
          descripcion: 'Tu app debe tener los productos: Instagram Graph API y Facebook Login',
          url: 'https://developers.facebook.com/apps/' + appId
        },
        {
          paso: 4,
          titulo: 'Autoriza la app',
          descripcion: 'Haz clic en este enlace para autorizar los permisos de publicacion',
          url: authUrl
        },
        {
          paso: 5,
          titulo: 'Obtener token de larga duracion',
          descripcion: 'Despues de autorizar, intercambia el codigo por un token de 60 dias',
          endpoint: '/api/instagram/exchange-token'
        }
      ],

      authUrl,

      permisosNecesarios: [
        'instagram_basic - Ver perfil',
        'instagram_content_publish - Publicar contenido',
        'instagram_manage_comments - Gestionar comentarios',
        'pages_show_list - Ver paginas',
        'business_management - Gestion de negocios'
      ],

      notaImportante: 'Sin estos permisos, el sistema solo podra enviarte el contenido por email para que lo publiques manualmente.'
    }
  });
}

/**
 * POST /api/instagram/setup-publish
 *
 * Intercambia el codigo de autorizacion por un token de acceso.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { code } = body;

    if (!code) {
      return NextResponse.json({
        success: false,
        error: 'Falta el codigo de autorizacion'
      }, { status: 400 });
    }

    const appId = process.env.INSTAGRAM_APP_ID;
    const appSecret = process.env.INSTAGRAM_APP_SECRET;
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/instagram/callback`;

    // Paso 1: Intercambiar codigo por token de corta duracion
    const tokenResponse = await fetch(
      `https://graph.facebook.com/v18.0/oauth/access_token?` +
      `client_id=${appId}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&client_secret=${appSecret}` +
      `&code=${code}`
    );

    const tokenData = await tokenResponse.json();

    if (tokenData.error) {
      return NextResponse.json({
        success: false,
        error: tokenData.error.message
      }, { status: 400 });
    }

    const shortLivedToken = tokenData.access_token;

    // Paso 2: Convertir a token de larga duracion (60 dias)
    const longLivedResponse = await fetch(
      `https://graph.facebook.com/v18.0/oauth/access_token?` +
      `grant_type=fb_exchange_token` +
      `&client_id=${appId}` +
      `&client_secret=${appSecret}` +
      `&fb_exchange_token=${shortLivedToken}`
    );

    const longLivedData = await longLivedResponse.json();

    if (longLivedData.error) {
      return NextResponse.json({
        success: false,
        error: longLivedData.error.message
      }, { status: 400 });
    }

    const longLivedToken = longLivedData.access_token;
    const expiresIn = longLivedData.expires_in; // segundos

    // Paso 3: Obtener paginas del usuario
    const pagesResponse = await fetch(
      `https://graph.facebook.com/v18.0/me/accounts?access_token=${longLivedToken}`
    );
    const pagesData = await pagesResponse.json();

    // Paso 4: Obtener Instagram Business Account ID
    let igUserId = null;
    let igUsername = null;

    for (const page of pagesData.data || []) {
      const igResponse = await fetch(
        `https://graph.facebook.com/v18.0/${page.id}?fields=instagram_business_account&access_token=${longLivedToken}`
      );
      const igData = await igResponse.json();

      if (igData.instagram_business_account) {
        igUserId = igData.instagram_business_account.id;

        // Obtener username
        const usernameResponse = await fetch(
          `https://graph.facebook.com/v18.0/${igUserId}?fields=username&access_token=${longLivedToken}`
        );
        const usernameData = await usernameResponse.json();
        igUsername = usernameData.username;
        break;
      }
    }

    if (!igUserId) {
      return NextResponse.json({
        success: false,
        error: 'No se encontro cuenta de Instagram Business conectada a tus paginas de Facebook',
        paginas: pagesData.data?.map((p: any) => p.name) || []
      }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      data: {
        message: 'Token obtenido exitosamente!',
        instrucciones: 'Copia estos valores a tu archivo .env.local',
        config: {
          INSTAGRAM_ACCESS_TOKEN: longLivedToken,
          INSTAGRAM_USER_ID: igUserId
        },
        info: {
          username: igUsername,
          tokenExpira: new Date(Date.now() + expiresIn * 1000).toISOString(),
          diasRestantes: Math.floor(expiresIn / 86400)
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
