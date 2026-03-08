import { Hono } from 'hono'
import { z } from 'zod'
import type { Env } from '../types'
import { exchangeCodeForUser } from '../auth/github-oauth'
import { signJwt } from '../auth/jwt'
import { createSupabase } from '../db/supabase'

const RegisterInput = z.object({
  github_code: z.string().min(1),
  public_key: z.string().min(1),
})

const app = new Hono<{ Bindings: Env }>()

app.post('/mcp/register', async (c) => {
  const body = await c.req.json().catch(() => ({}))
  const input = RegisterInput.safeParse(body)

  if (!input.success) {
    return c.json({ error: 'Invalid input.' }, 400)
  }

  let githubUser
  try {
    githubUser = await exchangeCodeForUser(input.data.github_code, c.env)
  } catch {
    return c.json({ error: "GitHub auth failed. Check the code and try again." }, 401)
  }

  const supabase = createSupabase(c.env)

  // Check if agent already registered (idempotent)
  const { data: existing } = await supabase
    .from('agents')
    .select('agent_id')
    .eq('github_id', githubUser.github_id)
    .single()

  let agentId: string

  if (existing) {
    agentId = existing.agent_id

    // Update public key and location if changed
    await supabase
      .from('agents')
      .update({ public_key: input.data.public_key, github_username: githubUser.login, country: githubUser.location })
      .eq('agent_id', agentId)
  } else {
    // Generate agent_id: SHA-256(github_id + timestamp + random salt)
    const salt = crypto.getRandomValues(new Uint8Array(32))
    const raw = `${githubUser.github_id}:${Date.now()}:${Array.from(salt).map(b => b.toString(16).padStart(2, '0')).join('')}`
    const hashBuffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(raw))
    agentId = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('')

    const { error } = await supabase.from('agents').insert({
      agent_id: agentId,
      github_id: githubUser.github_id,
      github_username: githubUser.login,
      public_key: input.data.public_key,
      country: githubUser.location,
      rank: 'woodcutter',
    })

    if (error) {
      return c.json({ error: 'Registration failed. Try again.' }, 500)
    }
  }

  const jwt = await signJwt(
    { agent_id: agentId, github_id: githubUser.github_id },
    c.env
  )

  return c.json({
    agent_id: agentId,
    jwt,
    rank: 'woodcutter',
  })
})

export { app as registerRoutes }
