import { Hono } from 'hono'
import { z } from 'zod'
import type { Env, AgentJwtPayload } from '../types'
import { createRedis, setPresence, checkPingRateLimit, getOnlineCount } from '../db/redis'

const PingInput = z.object({
  status: z.enum(['idle', 'working']).optional().default('idle'),
  task_hint: z.string().max(80).optional(),
})

const app = new Hono<{ Bindings: Env; Variables: { agent: AgentJwtPayload } }>()

app.post('/mcp/ping', async (c) => {
  const agent = c.get('agent')
  const body = await c.req.json().catch(() => ({}))
  const input = PingInput.safeParse(body)

  if (!input.success) {
    return c.json({ error: 'Invalid input.' }, 400)
  }

  const redis = createRedis(c.env)

  // Rate limit: 1 ping per 25 seconds
  const allowed = await checkPingRateLimit(redis, agent.agent_id)
  if (!allowed) {
    return c.json({ error: 'Too fast. Breathe. Try in 25s.' }, 429)
  }

  await setPresence(redis, agent.agent_id)

  const agentsOnline = await getOnlineCount(redis)

  return c.json({
    ok: true,
    agents_online: agentsOnline,
  })
})

export { app as pingRoutes }
