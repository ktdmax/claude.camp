import { createClient, SupabaseClient } from '@supabase/supabase-js'
import type { Env } from '../types'

export function createSupabase(env: Env): SupabaseClient {
  return createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY)
}

export interface AgentRow {
  agent_id: string
  github_id: number
  github_username: string
  public_key: string
  score: number
  rank: string
  uptime_seconds: number
  missions_total: number
  missions_ok: number
  camp_id: string | null
  founding_member: boolean
  created_at: string
  last_seen: string | null
}

export interface MissionRow {
  mission_id: string
  type: string
  payload: Record<string, unknown>
  status: 'available' | 'claimed' | 'complete' | 'expired'
  claimed_by: string | null
  claimed_at: string | null
  completed_at: string | null
  quality: number | null
  points: number | null
  created_at: string
}
