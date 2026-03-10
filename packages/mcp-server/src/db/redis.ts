import { Redis } from '@upstash/redis'
import type { Env } from '../types'

export function createRedis(env: Env): Redis {
  return new Redis({
    url: env.UPSTASH_REDIS_REST_URL,
    token: env.UPSTASH_REDIS_REST_TOKEN,
  })
}

const PRESENCE_TTL = 120
const PING_COOLDOWN_SECONDS = 25
const MISSION_RATE_LIMIT_TTL = 3600
const MISSION_RATE_LIMIT_MAX = 60
const REGISTER_RATE_LIMIT_TTL = 3600
const REGISTER_RATE_LIMIT_MAX = 5
const RESULT_HASH_TTL = 604800 // 7 days

export async function setPresence(redis: Redis, agentId: string): Promise<void> {
  await redis.set(`presence:${agentId}`, '1', { ex: PRESENCE_TTL })
  // SECURITY: Track online agents in a SET instead of using KEYS (H5)
  await redis.sadd('presence:online', agentId)

  // SECURITY: Probabilistic cleanup — ~1% of pings trigger a partial sweep of stale members (M3)
  if (Math.random() < 0.01) {
    const members = await redis.srandmember<string[]>('presence:online', 10)
    if (members && members.length > 0) {
      for (const member of members) {
        const alive = await redis.exists(`presence:${member}`)
        if (!alive) {
          await redis.srem('presence:online', member)
        }
      }
    }
  }
}

// SECURITY: Atomic SET NX EX to prevent TOCTOU race in rate limiting (M4)
export async function checkPingRateLimit(redis: Redis, agentId: string): Promise<boolean> {
  const key = `ratelimit:${agentId}:pings`
  const result = await redis.set(key, '1', { nx: true, ex: PING_COOLDOWN_SECONDS })
  return result !== null
}

// SECURITY: IP-based rate limit on registration — max 5 per IP per hour (M2)
export async function checkRegisterRateLimit(redis: Redis, ip: string): Promise<boolean> {
  const key = `ratelimit:register:${ip}`
  const count = await redis.incr(key)
  if (count === 1) {
    await redis.expire(key, REGISTER_RATE_LIMIT_TTL)
  }
  return count <= REGISTER_RATE_LIMIT_MAX
}

export async function checkMissionRateLimit(redis: Redis, agentId: string): Promise<boolean> {
  const key = `ratelimit:${agentId}:missions`
  const count = await redis.incr(key)
  if (count === 1) {
    await redis.expire(key, MISSION_RATE_LIMIT_TTL)
  }
  return count <= MISSION_RATE_LIMIT_MAX
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

// SECURITY: Use SCARD on a SET instead of KEYS to avoid O(n) scan (H5)
export async function getOnlineCount(redis: Redis): Promise<number> {
  return await redis.scard('presence:online')
}

// SECURITY: Remove agent from online set when presence expires (H5)
// Call this during cleanup or when an agent is known to be offline
export async function removePresence(redis: Redis, agentId: string): Promise<void> {
  await redis.srem('presence:online', agentId)
}

// SECURITY: Full cleanup of stale members from presence:online SET (M3)
// Called from /mcp/health (infrequent) to keep the SET accurate
export async function cleanPresenceSet(redis: Redis): Promise<void> {
  const members = await redis.smembers('presence:online')
  for (const member of members) {
    const alive = await redis.exists(`presence:${member}`)
    if (!alive) {
      await redis.srem('presence:online', member)
    }
  }
}
