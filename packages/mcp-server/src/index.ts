import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { bodyLimit } from 'hono/body-limit'
import type { Env, AgentJwtPayload } from './types'
import { jwtMiddleware } from './auth/jwt'
import { registerRoutes } from './tools/register'
import { pingRoutes } from './tools/ping'
import { getMissionRoutes } from './tools/get-mission'
import { reportResultRoutes } from './tools/report-result'
import { createRedis, getOnlineCount, cleanPresenceSet } from './db/redis'
import { createSupabase } from './db/supabase'

const app = new Hono<{ Bindings: Env; Variables: { agent: AgentJwtPayload } }>()

// SECURITY: Restrict CORS to known origins only (H4)
app.use('*', cors({
  origin: ['https://claude.camp', 'https://claude-camp.pages.dev', 'https://claudecamp.dev'],
}))

// SECURITY: Limit request body size to 1 MB to prevent abuse (M9)
app.use('*', bodyLimit({ maxSize: 1024 * 1024 }))

// Public routes (no auth)
app.route('/', registerRoutes)

// SECURITY: HTML-escape user input to prevent XSS (C1)
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
}

// SECURITY: state param not needed here — callback only displays the code for manual copy,
// does not auto-authenticate. No session is created, no cookie is set. (M1)
app.get('/mcp/auth/callback', (c) => {
  const code = c.req.query('code') ?? ''
  if (!code) {
    return c.text('No code received.', 400)
  }
  // SECURITY: Escape code before embedding in HTML to prevent XSS (C1)
  const safeCode = escapeHtml(code)
  return c.html(`<pre style="font-family:monospace;background:#0D0D1A;color:#F5F0E8;padding:2rem;min-height:100vh;margin:0">
Your GitHub OAuth code:

<code style="color:#E8572A;font-size:1.2rem">${safeCode}</code>

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

// Public API: owner aggregation (one owner = one GitHub user, multiple Cicis)
app.get('/mcp/owners', async (c) => {
  const supabase = createSupabase(c.env)
  const { data } = await supabase
    .from('agents')
    .select('owner_hash, country')
    .not('owner_hash', 'is', null)

  // Aggregate by owner_hash
  const owners = new Map<string, { countries: Set<string> ; count: number }>()
  for (const row of data ?? []) {
    const r = row as { owner_hash: string; country: string | null }
    const entry = owners.get(r.owner_hash) ?? { countries: new Set<string>(), count: 0 }
    entry.count++
    if (r.country) entry.countries.add(r.country)
    owners.set(r.owner_hash, entry)
  }

  const ownerList = Array.from(owners.entries()).map(([hash, v]) => ({
    owner_hash: hash,
    cici_count: v.count,
    countries: Array.from(v.countries),
  }))

  const totalCicis = ownerList.reduce((sum, o) => sum + o.cici_count, 0)

  return c.json({
    owners: ownerList,
    total_owners: ownerList.length,
    total_cicis: totalCicis,
  })
})

app.get('/mcp/health', async (c) => {
  const redis = createRedis(c.env)
  // SECURITY: Clean stale members from presence:online SET on infrequent health checks (M3)
  await cleanPresenceSet(redis)
  const agentsOnline = await getOnlineCount(redis)
  return c.json({ ok: true, agents_online: agentsOnline })
})

// SECURITY: Authenticated routes with scope enforcement (H3)
app.use('/mcp/ping', jwtMiddleware('ping'))
app.use('/mcp/get-mission', jwtMiddleware('mission'))
app.use('/mcp/report-result', jwtMiddleware('mission'))

app.route('/', pingRoutes)
app.route('/', getMissionRoutes)
app.route('/', reportResultRoutes)

export default app
