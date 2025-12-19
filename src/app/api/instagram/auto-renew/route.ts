import { NextResponse } from 'next/server'

/**
 * ENDPOINT TODO-EN-UNO para renovación automática
 * 1. Renueva el token de Instagram
 * 2. Actualiza la variable en Vercel
 * 3. Hace redeploy
 *
 * n8n solo tiene que llamar a este endpoint sin parámetros
 */
export async function POST() {
  try {
    console.log('🔄 Iniciando renovación automática completa...')

    // ========================================
    // PASO 1: Renovar Token de Instagram
    // ========================================
    const appId = process.env.INSTAGRAM_APP_ID
    const appSecret = process.env.INSTAGRAM_APP_SECRET
    const currentToken = process.env.INSTAGRAM_ACCESS_TOKEN

    if (!appId || !appSecret || !currentToken) {
      return NextResponse.json({
        success: false,
        error: 'Variables de Instagram no configuradas'
      }, { status: 500 })
    }

    // Renovar token usando Facebook OAuth
    const refreshUrl = `https://graph.facebook.com/v21.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${appId}&client_secret=${appSecret}&fb_exchange_token=${currentToken}`

    const refreshResponse = await fetch(refreshUrl)
    const refreshData = await refreshResponse.json()

    if (!refreshResponse.ok || refreshData.error) {
      console.error('❌ Error renovando token:', refreshData)
      return NextResponse.json({
        success: false,
        error: 'Error al renovar token de Instagram',
        details: refreshData
      }, { status: 500 })
    }

    const newToken = refreshData.access_token
    const expiresIn = refreshData.expires_in || 5184000 // 60 días en segundos

    console.log('✅ Token renovado exitosamente')

    // ========================================
    // PASO 2: Actualizar Vercel
    // ========================================
    const VERCEL_API_TOKEN = process.env.VERCEL_API_TOKEN
    const VERCEL_PROJECT_ID = process.env.VERCEL_PROJECT_ID
    const VERCEL_TEAM_ID = process.env.VERCEL_TEAM_ID

    if (!VERCEL_API_TOKEN || !VERCEL_PROJECT_ID || !VERCEL_TEAM_ID) {
      return NextResponse.json({
        success: false,
        error: 'Variables de Vercel no configuradas',
        token_renewed: true,
        new_token: newToken
      }, { status: 500 })
    }

    // Listar variables existentes
    const listUrl = `https://api.vercel.com/v9/projects/${VERCEL_PROJECT_ID}/env?teamId=${VERCEL_TEAM_ID}`
    const listResponse = await fetch(listUrl, {
      headers: {
        'Authorization': `Bearer ${VERCEL_API_TOKEN}`
      }
    })

    if (!listResponse.ok) {
      return NextResponse.json({
        success: false,
        error: 'Error al listar variables de Vercel',
        token_renewed: true,
        new_token: newToken
      }, { status: 500 })
    }

    const listData = await listResponse.json()

    // Encontrar y eliminar variable existente
    const existingVar = listData.envs?.find((env: any) =>
      env.key === 'INSTAGRAM_ACCESS_TOKEN' &&
      env.target?.includes('production')
    )

    if (existingVar) {
      const deleteUrl = `https://api.vercel.com/v9/projects/${VERCEL_PROJECT_ID}/env/${existingVar.id}?teamId=${VERCEL_TEAM_ID}`
      await fetch(deleteUrl, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${VERCEL_API_TOKEN}`
        }
      })
      console.log('🗑️ Variable anterior eliminada')
    }

    // Crear nueva variable
    const createUrl = `https://api.vercel.com/v10/projects/${VERCEL_PROJECT_ID}/env?teamId=${VERCEL_TEAM_ID}`
    const createResponse = await fetch(createUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${VERCEL_API_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        key: 'INSTAGRAM_ACCESS_TOKEN',
        value: newToken,
        type: 'encrypted',
        target: ['production']
      })
    })

    const createData = await createResponse.json()

    if (!createResponse.ok) {
      return NextResponse.json({
        success: false,
        error: 'Error al crear nueva variable en Vercel',
        details: createData,
        token_renewed: true,
        new_token: newToken
      }, { status: 500 })
    }

    console.log('✅ Variable actualizada en Vercel')

    // ========================================
    // PASO 3: Hacer Redeploy
    // ========================================
    const deployUrl = `https://api.vercel.com/v13/deployments`
    const deployResponse = await fetch(deployUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${VERCEL_API_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: 'instagram-dashboard',
        project: VERCEL_PROJECT_ID,
        target: 'production',
        gitSource: {
          type: 'github',
          ref: 'main',
          repoId: 889964652
        }
      })
    })

    const deployData = deployResponse.ok ? await deployResponse.json() : null

    if (deployResponse.ok) {
      console.log('✅ Redeploy iniciado')
    } else {
      console.warn('⚠️ No se pudo iniciar redeploy, pero la variable está actualizada')
    }

    // ========================================
    // RETORNAR RESULTADO COMPLETO
    // ========================================
    const expiresAt = new Date(Date.now() + expiresIn * 1000)

    return NextResponse.json({
      success: true,
      message: 'Token renovado y Vercel actualizado AUTOMATICAMENTE',
      data: {
        token_renewal: {
          success: true,
          expires_in_days: Math.floor(expiresIn / 86400),
          expires_at: expiresAt.toISOString(),
          token_type: 'bearer'
        },
        vercel_update: {
          env_updated: true,
          deployment_triggered: deployResponse.ok,
          deployment_url: deployData?.url || null
        }
      }
    })

  } catch (error) {
    console.error('❌ Error en renovación automática:', error)
    return NextResponse.json({
      success: false,
      error: 'Error interno en renovación automática',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
