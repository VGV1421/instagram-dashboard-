import { NextRequest, NextResponse } from 'next/server'

/**
 * API endpoint para actualizar INSTAGRAM_ACCESS_TOKEN en Vercel automáticamente
 * Usa la API de Vercel para actualizar la variable y redesplegar
 */
export async function POST(request: NextRequest) {
  try {
    const { newToken } = await request.json()

    if (!newToken) {
      return NextResponse.json({
        success: false,
        error: 'Falta parámetro requerido: newToken'
      }, { status: 400 })
    }

    // Obtener credenciales de Vercel desde variables de entorno
    const VERCEL_API_TOKEN = process.env.VERCEL_API_TOKEN
    const VERCEL_PROJECT_ID = process.env.VERCEL_PROJECT_ID
    const VERCEL_TEAM_ID = process.env.VERCEL_TEAM_ID

    if (!VERCEL_API_TOKEN || !VERCEL_PROJECT_ID || !VERCEL_TEAM_ID) {
      return NextResponse.json({
        success: false,
        error: 'Variables de Vercel no configuradas (VERCEL_API_TOKEN, VERCEL_PROJECT_ID, VERCEL_TEAM_ID)'
      }, { status: 500 })
    }

    // 1. Obtener todas las variables de entorno
    const listUrl = `https://api.vercel.com/v9/projects/${VERCEL_PROJECT_ID}/env?teamId=${VERCEL_TEAM_ID}`

    const listResponse = await fetch(listUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${VERCEL_API_TOKEN}`
      }
    })

    if (!listResponse.ok) {
      const error = await listResponse.json()
      return NextResponse.json({
        success: false,
        error: 'Error al listar variables de Vercel',
        details: error
      }, { status: listResponse.status })
    }

    const listData = await listResponse.json()

    // 2. Encontrar la variable INSTAGRAM_ACCESS_TOKEN en production
    const existingVar = listData.envs?.find((env: any) =>
      env.key === 'INSTAGRAM_ACCESS_TOKEN' &&
      env.target?.includes('production')
    )

    // 3. Eliminar la variable existente si existe
    if (existingVar) {
      const deleteUrl = `https://api.vercel.com/v9/projects/${VERCEL_PROJECT_ID}/env/${existingVar.id}?teamId=${VERCEL_TEAM_ID}`

      const deleteResponse = await fetch(deleteUrl, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${VERCEL_API_TOKEN}`
        }
      })

      if (!deleteResponse.ok) {
        const error = await deleteResponse.json()
        console.warn('Error eliminando variable anterior:', error)
      }
    }

    // 4. Crear la nueva variable
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
        details: createData
      }, { status: createResponse.status })
    }

    // 5. Hacer un redeploy del proyecto
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

    if (!deployResponse.ok) {
      const deployError = await deployResponse.json()
      console.error('Error en deploy:', deployError)
      // No fallar aquí - la variable ya está actualizada
    }

    const deployData = deployResponse.ok ? await deployResponse.json() : null

    return NextResponse.json({
      success: true,
      message: 'Variable INSTAGRAM_ACCESS_TOKEN actualizada en Vercel',
      data: {
        env_created: createData,
        deployment_triggered: deployResponse.ok,
        deployment: deployData
      }
    })

  } catch (error) {
    console.error('Error actualizando variable de Vercel:', error)
    return NextResponse.json({
      success: false,
      error: 'Error interno al actualizar variable de Vercel',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
