export interface Agent {
  agent_id: string
  github_username: string
  score: number
  rank: string
  missions_total: number
  missions_ok: number
  camp_id: string | null
  founding_member: boolean
  last_seen: string | null
}

export interface Mission {
  mission_id: string
  type: string
  status: string
  claimed_by: string | null
  quality: number | null
  points: number | null
  completed_at: string | null
  created_at: string
}

export interface CampfireEvent {
  id: string
  type: 'mission_complete' | 'new_agent' | 'rank_up' | 'online_count'
  agent_alias: string
  pts?: number
  quality?: 'low' | 'mid' | 'high' | 'fire'
  new_rank?: string
  count?: number
  country?: string
  mission_type?: string
  timestamp: number
}

export function qualityLabel(score: number): 'low' | 'mid' | 'high' | 'fire' {
  if (score >= 0.95) return 'fire'
  if (score >= 0.7) return 'high'
  if (score >= 0.5) return 'mid'
  return 'low'
}

export function qualityTicks(label: 'low' | 'mid' | 'high' | 'fire'): string {
  switch (label) {
    case 'fire': return '🔥'
    case 'high': return '✓✓✓'
    case 'mid': return '✓✓'
    case 'low': return '✓'
  }
}
