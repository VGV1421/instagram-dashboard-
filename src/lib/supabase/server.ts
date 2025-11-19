/**
 * Supabase Server Client - Para uso en el servidor (Server Components, API Routes, Server Actions)
 *
 * Uso en Server Component:
 * import { createClient } from '@/lib/supabase/server'
 * const supabase = createClient()
 * const { data } = await supabase.from('posts').select('*')
 *
 * Uso en API Route:
 * import { createClient } from '@/lib/supabase/server'
 * const supabase = createClient()
 */

import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/types/database'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch (error) {
            // La función set puede fallar si se llama desde un Server Component
            // Esto es normal y esperado
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options })
          } catch (error) {
            // La función remove puede fallar si se llama desde un Server Component
            // Esto es normal y esperado
          }
        },
      },
    }
  )
}

/**
 * Cliente con Service Role Key - Solo para operaciones administrativas
 * ⚠️ NUNCA uses esto en el cliente (browser)
 * ⚠️ Solo para API Routes, Server Actions, y operaciones de backend
 */
export async function createServiceClient() {
  const cookieStore = await cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch (error) {
            // Ignorar errores en Server Components
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options })
          } catch (error) {
            // Ignorar errores en Server Components
          }
        },
      },
    }
  )
}
