/**
 * Supabase Client - Para uso en el navegador (Client Components)
 *
 * Uso:
 * import { supabase } from '@/lib/supabase/client'
 * const { data, error } = await supabase.from('posts').select('*')
 */

import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/database'

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// Instancia singleton para usar en client components
export const supabase = createClient()
