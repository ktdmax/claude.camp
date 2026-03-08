import { Hono } from 'hono'
import { cors } from 'hono/cors'
import type { Env, AgentJwtPayload } from './types'
import { jwtMiddleware } from './auth/jwt'
import { registerRoutes } from './tools/register'
import { pingRoutes } from './tools/ping'
import { getMissionRoutes } from './tools/get-mission'
import { reportResultRoutes } from './tools/report-result'
import { createRedis, getOnlineCount } from './db/redis'
import { createSupabase } from './db/supabase'

const app = new Hono<{ Bindings: Env; Variables: { agent: AgentJwtPayload } }>()

// Global middleware
app.use('*', cors())

// Public routes (no auth)
app.route('/', registerRoutes)

// OAuth callback — shows the code for manual registration
app.get('/mcp/auth/callback', (c) => {
  const code = c.req.query('code') ?? ''
  if (!code) {
    return c.text('No code received.', 400)
  }
  return c.html(`<pre style="font-family:monospace;background:#0D0D1A;color:#F5F0E8;padding:2rem;min-height:100vh;margin:0">
Your GitHub OAuth code:

<code style="color:#E8572A;font-size:1.2rem">${code}</code>

Copy this code and use it to register.
This code expires in 10 minutes.</pre>`)
})

// Public API: aggregated country counts for world map
app.get('/mcp/agents/countries', async (c) => {
  const supabase = createSupabase(c.env)
  const { data } = await supabase
    .from('agents')
    .select('country')
    .not('country', 'is', null)

  // Aggregate by country
  const counts: Record<string, number> = {}
  for (const row of data ?? []) {
    const country = (row as { country: string }).country
    if (country) {
      counts[country] = (counts[country] ?? 0) + 1
    }
  }

  return c.json({ countries: counts })
})

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
