/**
 * API Route de prueba para verificar conexión con Supabase
 *
 * GET /api/test-db
 *
 * Prueba:
 * http://localhost:3000/api/test-db
 */

import { supabaseAdmin } from '@/lib/supabase/simple-client'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = supabaseAdmin

    // Test 1: Obtener el cliente de Instagram
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('*')
      .eq('instagram_username', 'digitalmindmillonaria')
      .single()

    if (clientError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Error al obtener cliente',
          details: clientError.message
        },
        { status: 500 }
      )
    }

    // Test 2: Contar posts (debería ser 0 por ahora)
    const { count: postsCount, error: postsError } = await supabase
      .from('posts')
      .select('*', { count: 'exact', head: true })
      .eq('client_id', client.id)

    if (postsError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Error al contar posts',
          details: postsError.message
        },
        { status: 500 }
      )
    }

    // Test 3: Contar alertas
    const { count: alertsCount, error: alertsError } = await supabase
      .from('alerts')
      .select('*', { count: 'exact', head: true })
      .eq('client_id', client.id)

    if (alertsError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Error al contar alertas',
          details: alertsError.message
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: '✅ Conexión exitosa con Supabase',
      data: {
        client: {
          id: client.id,
          name: client.name,
          instagram_username: client.instagram_username,
          instagram_user_id: client.instagram_user_id,
          status: client.status,
          created_at: client.created_at,
        },
        stats: {
          posts_count: postsCount,
          alerts_count: alertsCount,
        },
        database_info: {
          tables_accessible: ['clients', 'posts', 'alerts', 'account_stats', 'automation_logs'],
          connection: 'OK',
        }
      }
    })

  } catch (error) {
    console.error('Error en test-db:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
