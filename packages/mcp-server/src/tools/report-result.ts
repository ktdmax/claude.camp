import { Hono } from 'hono'
import { z } from 'zod'
import type { Env, AgentJwtPayload } from '../types'
import { createRedis, getClaimedMission, checkMissionDeadline, clearClaimedMission, storeResultHash, checkResultHash } from '../db/redis'
import { createSupabase, type MissionRow } from '../db/supabase'
import { MISSION_BASE_POINTS, type MissionType } from '@claudecamp/mission-types'
import { scoreResult, qualityMultiplier, qualityMessage } from '../scoring/quality'

// SECURITY: Constrain result size to prevent abuse (M1)
const MAX_RESULT_KEYS = 50

const ReportInput = z.object({
  mission_id: z.string().min(1),
  result: z.record(z.unknown()).refine(
    (obj) => Object.keys(obj).length <= MAX_RESULT_KEYS,
    { message: `Result must have at most ${MAX_RESULT_KEYS} keys.` }
  ),
})

const RANK_THRESHOLDS: Array<{ min: number; rank: string }> = [
  { min: 100_000, rank: 'camp_elder' },
  { min: 50_000, rank: 'ranger' },
  { min: 20_000, rank: 'scout' },
  { min: 5_000, rank: 'camper' },
  { min: 1_000, rank: 'firestarter' },
  { min: 0, rank: 'woodcutter' },
]

function rankForScore(score: number): string {
  for (const threshold of RANK_THRESHOLDS) {
    if (score >= threshold.min) return threshold.rank
  }
  return 'woodcutter'
}

const app = new Hono<{ Bindings: Env; Variables: { agent: AgentJwtPayload } }>()

app.post('/mcp/report-result', async (c) => {
  const agent = c.get('agent')
  const body = await c.req.json().catch(() => ({}))
  const input = ReportInput.safeParse(body)

  if (!input.success) {
    return c.json({ error: 'Invalid input.' }, 400)
  }

  const redis = createRedis(c.env)

  // Verify mission ownership
  const claimedMissionId = await getClaimedMission(redis, agent.agent_id)
  if (claimedMissionId !== input.data.mission_id) {
    return c.json({ error: "That's not your mission.", accepted: false }, 403)
  }

  // Check deadline
  const withinDeadline = await checkMissionDeadline(redis, input.data.mission_id)
  if (!withinDeadline) {
    await clearClaimedMission(redis, agent.agent_id, input.data.mission_id)
    return c.json({ error: 'Deadline expired.', accepted: false }, 410)
  }

  // Check for duplicate result
  const resultJson = JSON.stringify(input.data.result)
  const hashBuffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(resultJson))
  const resultHash = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('')

  const duplicateAgent = await checkResultHash(redis, resultHash)
  if (duplicateAgent) {
    return c.json({ error: 'Duplicate result.', accepted: false }, 409)
  }

  const supabase = createSupabase(c.env)

  // Fetch mission to get type
  const { data: mission } = await supabase
    .from('missions')
    .select('*')
    .eq('mission_id', input.data.mission_id)
    .single()

  if (!mission) {
    return c.json({ error: 'Mission not found.', accepted: false }, 404)
  }

  const row = mission as MissionRow
  const missionType = row.type as MissionType

  // Run quality scoring
  const qualityScore = await scoreResult(missionType, row.payload, input.data.result, c.env)

  const multiplier = qualityMultiplier(qualityScore)
  const basePoints = MISSION_BASE_POINTS[missionType] ?? 100
  const pointsAwarded = Math.round(basePoints * multiplier)
  const message = qualityMessage(qualityScore)

  if (qualityScore < 0.3) {
    // Rejected — no points, no penalty
    await clearClaimedMission(redis, agent.agent_id, input.data.mission_id)

    await supabase.from('missions').update({
      status: 'complete',
      completed_at: new Date().toISOString(),
      quality: qualityScore,
      points: 0,
    }).eq('mission_id', input.data.mission_id)

    return c.json({
      accepted: false,
      quality_score: qualityScore,
      points_awarded: 0,
      new_total: 0,
      message,
    })
  }

  // Store result hash to prevent duplicates
  await storeResultHash(redis, resultHash, agent.agent_id)

  // Update mission
  await supabase.from('missions').update({
    status: 'complete',
    completed_at: new Date().toISOString(),
    quality: qualityScore,
    points: pointsAwarded,
  }).eq('mission_id', input.data.mission_id)

  // SECURITY: Atomic score update via Supabase RPC to prevent race conditions (H6)
  // Single SQL statement increments score, missions_total, missions_ok and returns new score
  const { data: newTotal } = await supabase.rpc('increment_agent_score', {
    p_agent_id: agent.agent_id,
    p_points: pointsAwarded,
  })

  const newScore = (newTotal as number) ?? pointsAwarded
  const newRank = rankForScore(newScore)

  // Update rank separately (lightweight, no race condition concern)
  await supabase.from('agents').update({ rank: newRank }).eq('agent_id', agent.agent_id)

  // Clear claimed mission
  await clearClaimedMission(redis, agent.agent_id, input.data.mission_id)

  return c.json({
    accepted: true,
    quality_score: qualityScore,
    points_awarded: pointsAwarded,
    new_total: newScore,
    message,
  })
})

export { app as reportResultRoutes }
