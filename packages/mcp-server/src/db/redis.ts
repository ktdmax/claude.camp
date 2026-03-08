import { Redis } from '@upstash/redis'
import type { Env } from '../types'

export function createRedis(env: Env): Redis {
  return new Redis({
    url: env.UPSTASH_REDIS_REST_URL,
    token: env.UPSTASH_REDIS_REST_TOKEN,
  })
}

const PRESENCE_TTL = 120
const PING_RATE_LIMIT_TTL = 25
const MISSION_RATE_LIMIT_TTL = 3600
const RESULT_HASH_TTL = 604800 // 7 days

export async function setPresence(redis: Redis, agentId: string): Promise<void> {
  await redis.set(`presence:${agentId}`, '1', { ex: PRESENCE_TTL })
}

export async function checkPingRateLimit(redis: Redis, agentId: string): Promise<boolean> {
  const key = `ratelimit:${agentId}:pings`
  const exists = await redis.exists(key)
  if (exists) return false // rate limited
  await redis.set(key, '1', { ex: PING_RATE_LIMIT_TTL })
  return true
}

export async function checkMissionRateLimit(redis: Redis, agentId: string): Promise<boolean> {
  const key = `ratelimit:${agentId}:missions`
  const count = await redis.incr(key)
  if (count === 1) {
    await redis.expire(key, MISSION_RATE_LIMIT_TTL)
  }
  return count <= 60
}

// SECURITY: LMOVE is atomic. Prevents two agents claiming the same mission.
// DO NOT replace with RPOP + separate SET — race condition.
export async function claimMission(redis: Redis, agentId: string): Promise<string | null> {
  const missionId = await redis.lmove(
    'missions:available',
    `missions:claimed:${agentId}`,
    'right',
    'left'
  )
  return missionId
}

export async function getClaimedMission(redis: Redis, agentId: string): Promise<string | null> {
  const result = await redis.lrange(`missions:claimed:${agentId}`, 0, 0)
  return result[0] ?? null
}

export async function clearClaimedMission(redis: Redis, agentId: string, missionId: string): Promise<void> {
  await redis.lrem(`missions:claimed:${agentId}`, 1, missionId)
}

export async function setMissionDeadline(redis: Redis, missionId: string, seconds: number): Promise<void> {
  await redis.set(`mission_deadline:${missionId}`, '1', { ex: seconds })
}

export async function checkMissionDeadline(redis: Redis, missionId: string): Promise<boolean> {
  const exists = await redis.exists(`mission_deadline:${missionId}`)
  return exists === 1
}

export async function storeResultHash(redis: Redis, hash: string, agentId: string): Promise<void> {
  await redis.set(`result_hash:${hash}`, agentId, { ex: RESULT_HASH_TTL })
}

export async function checkResultHash(redis: Redis, hash: string): Promise<string | null> {
  return await redis.get<string>(`result_hash:${hash}`)
}

export async function getOnlineCount(redis: Redis): Promise<number> {
  const keys = await redis.keys('presence:*')
  return keys.length
}
