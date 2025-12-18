import { NextRequest, NextResponse } from 'next/server'

/**
 * API endpoint para renovar el token de Instagram automáticamente
 * Los tokens de larga duración duran 60 días y pueden renovarse antes de expirar
 */
export async function POST(request: NextRequest) {
  try {
    const currentToken = process.env.INSTAGRAM_ACCESS_TOKEN
    const appId = process.env.INSTAGRAM_APP_ID
    const appSecret = process.env.INSTAGRAM_APP_SECRET

    if (!currentToken || !appId || !appSecret) {
      return NextResponse.json({
        success: false,
        error: 'Credenciales no configuradas'
      }, { status: 400 })
    }

    // Para Page Access Tokens (Instagram Business), usar el endpoint de Facebook
    // Este intercambia el token actual por uno de larga duración (60 días)
    const refreshUrl = `https://graph.facebook.com/v21.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${appId}&client_secret=${appSecret}&fb_exchange_token=${currentToken}`

    const response = await fetch(refreshUrl, {
      method: 'GET'
    })

    const data = await response.json()

    if (data.error) {
      return NextResponse.json({
        success: false,
        error: data.error.message || 'Error al renovar token',
        details: data.error
      }, { status: 400 })
    }

    // El nuevo token
    // Nota: Los Page Access Tokens de Facebook no caducan mientras la app tenga permisos
    const newToken = data.access_token
    const expiresIn = data.expires_in || 5184000 // 60 días por defecto (en segundos)
    const expiresAt = new Date(Date.now() + (expiresIn * 1000))

    return NextResponse.json({
      success: true,
      message: 'Token renovado exitosamente',
      data: {
        new_token: newToken,
        expires_in_days: Math.floor(expiresIn / 86400),
        expires_at: expiresAt.toISOString(),
        token_type: data.token_type || 'bearer',
        note: data.expires_in ? 'Token con expiración fija' : 'Page Access Token (no caduca mientras tenga permisos)'
      }
    })

  } catch (error) {
    console.error('Error renovando token:', error)
    return NextResponse.json({
      success: false,
      error: 'Error interno al renovar token'
    }, { status: 500 })
  }
}

/**
 * GET endpoint para verificar el estado actual del token
 */
export async function GET(request: NextRequest) {
  try {
    const currentToken = process.env.INSTAGRAM_ACCESS_TOKEN

    if (!currentToken) {
      return NextResponse.json({
        success: false,
        error: 'No hay token configurado'
      }, { status: 400 })
    }

    // Verificar el token con la API de Facebook
    const userId = process.env.INSTAGRAM_USER_ID
    const verifyUrl = `https://graph.facebook.com/${userId}?fields=id,username&access_token=${currentToken}`

    const response = await fetch(verifyUrl)
    const data = await response.json()

    if (data.error) {
      return NextResponse.json({
        success: false,
        valid: false,
        error: data.error.message,
        message: 'El token actual ha expirado o es inválido'
      })
    }

    return NextResponse.json({
      success: true,
      valid: true,
      message: 'Token válido',
      data: {
        username: data.username,
        user_id: data.id
      }
    })

  } catch (error) {
    console.error('Error verificando token:', error)
    return NextResponse.json({
      success: false,
      error: 'Error interno al verificar token'
    }, { status: 500 })
  }
}
