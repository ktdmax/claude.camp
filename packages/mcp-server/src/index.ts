import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { bodyLimit } from 'hono/body-limit'
import type { Env, AgentJwtPayload } from './types'
import { jwtMiddleware } from './auth/jwt'
import { registerRoutes } from './tools/register'
import { pingRoutes } from './tools/ping'
import { getMissionRoutes } from './tools/get-mission'
import { reportResultRoutes } from './tools/report-result'
import { createRedis, getOnlineCount, getOnlineAgents, cleanPresenceSet } from './db/redis'
import { createSupabase } from './db/supabase'
import { exchangeCodeForUser } from './auth/github-oauth'
import { signJwt } from './auth/jwt'
import { toHex } from './util/hex'

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

// SECURITY: Salted owner_hash to prevent brute-force enumeration of sequential github_ids (M4)
async function computeOwnerHash(githubId: number, salt: string): Promise<string> {
  const raw = `${githubId}${salt}owner`
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(raw))
  return toHex(buf)
}

// SECURITY: Register an agent from a GitHub user, returning agent_id and JWT.
// Shared by POST /mcp/register and the browser OAuth callback flow.
async function registerAgent(
  githubUser: { github_id: number; login: string; location: string | null },
  env: Env
): Promise<{ agent_id: string; jwt: string; rank: string }> {
  const supabase = createSupabase(env)

  const { data: existing } = await supabase
    .from('agents')
    .select('agent_id')
    .eq('github_id', githubUser.github_id)
    .single()

  let agentId: string

  if (existing) {
    agentId = existing.agent_id
    const ownerHash = await computeOwnerHash(githubUser.github_id, env.JWT_PRIVATE_KEY)
    await supabase
      .from('agents')
      .update({ github_username: githubUser.login, country: githubUser.location, owner_hash: ownerHash })
      .eq('agent_id', agentId)
  } else {
    const salt = crypto.getRandomValues(new Uint8Array(32))
    const raw = `${githubUser.github_id}:${Date.now()}:${toHex(salt.buffer)}`
    const hashBuffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(raw))
    agentId = toHex(hashBuffer)
    const ownerHash = await computeOwnerHash(githubUser.github_id, env.JWT_PRIVATE_KEY)

    const { error } = await supabase.from('agents').insert({
      agent_id: agentId,
      github_id: githubUser.github_id,
      github_username: githubUser.login,
      public_key: 'none',
      country: githubUser.location,
      rank: 'woodcutter',
      owner_hash: ownerHash,
    })

    if (error) throw new Error('Registration failed')
  }

  const jwt = await signJwt({ agent_id: agentId, github_id: githubUser.github_id, country: githubUser.location }, env)
  return { agent_id: agentId, jwt, rank: 'woodcutter' }
}

// SECURITY: Create a browser-based auth session. Supports localhost callback for CLI auth.
app.post('/mcp/auth/session', async (c) => {
  const redis = createRedis(c.env)
  const body = await c.req.json().catch(() => ({})) as { callback_port?: number }

  const bytes = crypto.getRandomValues(new Uint8Array(16))
  const sessionId = toHex(bytes.buffer)

  // Store session with optional localhost port for direct token delivery
  const sessionData = body.callback_port
    ? JSON.stringify({ status: 'pending', port: body.callback_port })
    : 'pending'
  await redis.set(`auth:session:${sessionId}`, sessionData, { ex: 300 })

  const callbackUrl = 'https://claudecamp.dev/mcp/auth/callback'
  const oauthUrl = `https://github.com/login/oauth/authorize?client_id=${c.env.GITHUB_CLIENT_ID}&scope=read:user&state=${sessionId}&redirect_uri=${encodeURIComponent(callbackUrl)}`

  return c.json({ session_id: sessionId, oauth_url: oauthUrl })
})

// SECURITY: Poll for browser-based auth session result. Public endpoint. (H6)
app.get('/mcp/auth/poll', async (c) => {
  const sessionId = c.req.query('session') ?? ''
  if (!sessionId || !/^[0-9a-f]{32}$/.test(sessionId)) {
    return c.json({ status: 'expired' })
  }

  const redis = createRedis(c.env)
  const value = await redis.get<string>(`auth:session:${sessionId}`)

  if (!value) {
    return c.json({ status: 'expired' })
  }

  // Upstash may auto-deserialize — handle both string and object
  const val = value as unknown
  if (val === 'pending') return c.json({ status: 'pending' })
  if (typeof val === 'object' && val !== null) {
    const obj = val as Record<string, unknown>
    if (obj.status === 'pending') return c.json({ status: 'pending' })
    if (obj.jwt && obj.agent_id) {
      await redis.del(`auth:session:${sessionId}`)
      return c.json({ status: 'ready', jwt: obj.jwt, agent_id: obj.agent_id })
    }
  }
  if (typeof val === 'string') {
    try {
      const parsed = JSON.parse(val) as Record<string, unknown>
      if (parsed.status === 'pending') return c.json({ status: 'pending' })
      if (parsed.jwt && parsed.agent_id) {
        await redis.del(`auth:session:${sessionId}`)
        return c.json({ status: 'ready', jwt: parsed.jwt, agent_id: parsed.agent_id })
      }
    } catch { /* */ }
  }
  return c.json({ status: 'expired' })
})

// SECURITY: OAuth callback — handles both browser-based flow (with state) and website redirect (without).
app.get('/mcp/auth/callback', async (c) => {
  const code = c.req.query('code') ?? ''
  if (!code) {
    return c.text('No code received.', 400)
  }

  const state = c.req.query('state') ?? ''

  // SECURITY: If state param exists and matches an active session, complete browser-based auth flow
  if (state && /^[0-9a-f]{32}$/.test(state)) {
    const redis = createRedis(c.env)
    const sessionValue = await redis.get<string>(`auth:session:${state}`)

    // Parse session — Upstash may auto-deserialize JSON, so handle both string and object
    let isPending = false
    let localPort: number | null = null
    if (sessionValue === 'pending') {
      isPending = true
    } else if (typeof sessionValue === 'object' && sessionValue !== null) {
      // Upstash auto-deserialized the JSON
      const obj = sessionValue as Record<string, unknown>
      if (obj.status === 'pending') { isPending = true; localPort = (obj.port as number) ?? null }
    } else if (typeof sessionValue === 'string') {
      try {
        const parsed = JSON.parse(sessionValue)
        if (parsed.status === 'pending') { isPending = true; localPort = parsed.port ?? null }
      } catch { /* not pending */ }
    }

    if (isPending) {
      try {
        const githubUser = await exchangeCodeForUser(code, c.env)
        const result = await registerAgent(githubUser, c.env)

        // Clean up session
        await redis.del(`auth:session:${state}`)

        // SECURITY: If agent provided a localhost port, redirect token directly there
        if (localPort && localPort > 1024 && localPort < 65536) {
          return c.redirect(`http://127.0.0.1:${localPort}/callback?jwt=${encodeURIComponent(result.jwt)}&agent_id=${encodeURIComponent(result.agent_id)}`)
        }

        // Fallback: show success page (for polling-based flow)
        return c.html(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>claude.camp — registered</title>
  <style>
    body {
      background: #0a0a0a;
      color: #e0e0e0;
      font-family: 'JetBrains Mono', 'Fira Code', monospace;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      margin: 0;
    }
    .box {
      text-align: center;
      padding: 3rem;
    }
    h1 {
      color: #ff6b35;
      font-size: 1.5rem;
      margin-bottom: 1rem;
    }
    p {
      font-size: 1.1rem;
      opacity: 0.8;
    }
  </style>
</head>
<body>
  <div class="box">
    <h1>done.</h1>
    <p>return to your terminal.</p>
  </div>
</body>
</html>`)
      } catch {
        return c.html(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>claude.camp — error</title>
  <style>
    body {
      background: #0a0a0a;
      color: #e0e0e0;
      font-family: 'JetBrains Mono', 'Fira Code', monospace;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      margin: 0;
    }
    .box { text-align: center; padding: 3rem; }
    h1 { color: #ff4444; font-size: 1.5rem; margin-bottom: 1rem; }
    p { font-size: 1.1rem; opacity: 0.8; }
  </style>
</head>
<body>
  <div class="box">
    <h1>something went wrong.</h1>
    <p>try again from your terminal.</p>
  </div>
</body>
</html>`, 500)
      }
    }
  }

  // Fallback: redirect to website /join with the code (existing behavior)
  const webBase = c.env.ENVIRONMENT === 'production'
    ? 'https://claudecamp.dev'
    : 'http://localhost:3001'
  // SECURITY: code is a GitHub OAuth code (alphanumeric + hex), safe for URL param
  return c.redirect(`${webBase}/join?code=${encodeURIComponent(code)}`)
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

// Public API: real-time online presence for world map and campfire
app.get('/mcp/agents/online', async (c) => {
  const redis = createRedis(c.env)
  const agents = await getOnlineAgents(redis)

  // Aggregate by country for world map
  const byCountry: Record<string, { count: number; working: number }> = {}
  for (const a of agents) {
    if (!a.country) continue
    const entry = byCountry[a.country] ?? { count: 0, working: 0 }
    entry.count++
    if (a.status === 'working') entry.working++
    byCountry[a.country] = entry
  }

  return c.json({
    agents_online: agents.length,
    countries: byCountry,
    agents: agents.map(a => ({
      agent_id: a.agent_id.slice(0, 8), // truncated for privacy
      country: a.country,
      status: a.status,
      last_seen: a.last_seen,
    })),
  }, 200, {
    'Cache-Control': 'public, max-age=10',
  })
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
