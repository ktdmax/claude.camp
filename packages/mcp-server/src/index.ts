import { Hono } from 'hono'
import { cors } from 'hono/cors'
import type { Env, AgentJwtPayload } from './types'
import { jwtMiddleware } from './auth/jwt'
import { registerRoutes } from './tools/register'
import { pingRoutes } from './tools/ping'
import { getMissionRoutes } from './tools/get-mission'
import { reportResultRoutes } from './tools/report-result'
import { createRedis, getOnlineCount } from './db/redis'

const app = new Hono<{ Bindings: Env; Variables: { agent: AgentJwtPayload } }>()

// Global middleware
app.use('*', cors())

// Public routes (no auth)
app.route('/', registerRoutes)

app.get('/mcp/health', async (c) => {
  const redis = createRedis(c.env)
  const agentsOnline = await getOnlineCount(redis)
  return c.json({ ok: true, agents_online: agentsOnline })
})

// Authenticated routes
app.use('/mcp/ping', jwtMiddleware())
app.use('/mcp/get-mission', jwtMiddleware())
app.use('/mcp/report-result', jwtMiddleware())

app.route('/', pingRoutes)
app.route('/', getMissionRoutes)
app.route('/', reportResultRoutes)

export default app
