import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://sufarlfdhtozbgwuosdg.supabase.co'
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''

let _client: SupabaseClient | null = null

export function getSupabase(): SupabaseClient {
  if (!_client) {
    if (!SUPABASE_ANON_KEY) {
      throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY is not set')
    }
    _client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  }
  return _client
}
