import { NextRequest, NextResponse } from 'next/server'

/**
 * API endpoint para actualizar variables de entorno en Vercel
 * Usa la API de Vercel en lugar de CLI para evitar problemas de vinculación
 */
export async function POST(request: NextRequest) {
  try {
    const { token, varName, varValue } = await request.json()

    if (!token || !varName || !varValue) {
      return NextResponse.json({
        success: false,
        error: 'Faltan parámetros requeridos: token, varName, varValue'
      }, { status: 400 })
    }

    // Obtener el ID del proyecto desde variables de entorno
    const VERCEL_PROJECT_ID = process.env.VERCEL_PROJECT_ID || 'instagram-dashboard'
    const VERCEL_TEAM_ID = process.env.VERCEL_TEAM_ID

    // 1. Primero eliminar la variable existente
    const deleteUrl = `https://api.vercel.com/v9/projects/${VERCEL_PROJECT_ID}/env/${varName}?target=production${VERCEL_TEAM_ID ? `&teamId=${VERCEL_TEAM_ID}` : ''}`

    await fetch(deleteUrl, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })

    // 2. Crear la nueva variable
    const createUrl = `https://api.vercel.com/v10/projects/${VERCEL_PROJECT_ID}/env${VERCEL_TEAM_ID ? `?teamId=${VERCEL_TEAM_ID}` : ''}`

    const createResponse = await fetch(createUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        key: varName,
        value: varValue,
        type: 'encrypted',
        target: ['production']
      })
    })

    const createData = await createResponse.json()

    if (!createResponse.ok) {
      return NextResponse.json({
        success: false,
        error: createData.error?.message || 'Error al actualizar variable en Vercel',
        details: createData
      }, { status: createResponse.status })
    }

    return NextResponse.json({
      success: true,
      message: `Variable ${varName} actualizada en Vercel production`,
      data: createData
    })

  } catch (error) {
    console.error('Error actualizando variable de Vercel:', error)
    return NextResponse.json({
      success: false,
      error: 'Error interno al actualizar variable de Vercel'
    }, { status: 500 })
  }
}
