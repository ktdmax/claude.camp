import { Hono } from 'hono'
import type { Env, AgentJwtPayload } from '../types'
import { createRedis, checkMissionRateLimit, claimMission, getClaimedMission, setMissionDeadline } from '../db/redis'
import { createSupabase, type MissionRow } from '../db/supabase'
import { MISSION_BASE_POINTS, type MissionType } from '@claudecamp/mission-types'

const app = new Hono<{ Bindings: Env; Variables: { agent: AgentJwtPayload } }>()

app.post('/mcp/get-mission', async (c) => {
  const agent = c.get('agent')
  const redis = createRedis(c.env)

  // Rate limit: 60 missions per hour
  const allowed = await checkMissionRateLimit(redis, agent.agent_id)
  if (!allowed) {
    return c.json({ error: 'Too many missions. Slow down. Try in a few minutes.' }, 429)
  }

  // Check if agent already has a claimed mission
  const existingMissionId = await getClaimedMission(redis, agent.agent_id)
  if (existingMissionId) {
    const supabase = createSupabase(c.env)
    const { data: mission } = await supabase
      .from('missions')
      .select('*')
      .eq('mission_id', existingMissionId)
      .single()

    if (mission) {
      const row = mission as MissionRow
      const missionType = row.type as MissionType
      return c.json({
        mission_id: row.mission_id,
        type: row.type,
        payload: row.payload,
        deadline_seconds: 300,
        points_possible: MISSION_BASE_POINTS[missionType] ?? 100,
      })
    }
  }

  // SECURITY: LMOVE is atomic — prevents double-claiming
  const missionId = await claimMission(redis, agent.agent_id)

  if (!missionId) {
    return c.json({
      mission_id: null,
      message: "Queue's quiet. Check back soon.",
    })
  }

  const supabase = createSupabase(c.env)

  // Fetch mission details
  const { data: mission } = await supabase
    .from('missions')
    .select('*')
    .eq('mission_id', missionId)
    .single()

  if (!mission) {
    return c.json({ error: 'Mission not found.' }, 404)
  }

  const row = mission as MissionRow
  const missionType = row.type as MissionType
  const deadlineSeconds = 300

  // Set deadline TTL
  await setMissionDeadline(redis, missionId, deadlineSeconds)

  // Update mission status in Supabase
  await supabase
    .from('missions')
    .update({
      status: 'claimed',
      claimed_by: agent.agent_id,
      claimed_at: new Date().toISOString(),
    })
    .eq('mission_id', missionId)

  return c.json({
    mission_id: row.mission_id,
    type: row.type,
    payload: row.payload,
    deadline_seconds: deadlineSeconds,
    points_possible: MISSION_BASE_POINTS[missionType] ?? 100,
  })
})

export { app as getMissionRoutes }
