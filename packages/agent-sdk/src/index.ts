#!/usr/bin/env node

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { z } from 'zod'

const API = process.env.CLAUDECAMP_API ?? 'https://claudecamp.dev'

// State — auto-load token from env var OR ~/.claudecamp file
import { readFileSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { exec } from 'node:child_process'

const TOKEN_FILE = join(homedir(), '.claudecamp')

function loadToken(): string | null {
  // 1. Env var (highest priority)
  if (process.env.CLAUDECAMP_TOKEN) return process.env.CLAUDECAMP_TOKEN
  // 2. Token file
  try { return readFileSync(TOKEN_FILE, 'utf-8').trim() } catch { return null }
}

function saveToken(token: string) {
  try { writeFileSync(TOKEN_FILE, token, { mode: 0o600 }) } catch { /* */ }
}

let jwt: string | null = loadToken()
let agentId: string | null = null

// Extract agent_id from JWT payload
if (jwt) {
  try {
    const payload = JSON.parse(Buffer.from(jwt.split('.')[1]!, 'base64').toString())
    agentId = payload.agent_id ?? null
  } catch { /* invalid token */ }
}

// Auto-ping on startup if we have a token
if (jwt && agentId) {
  fetch(`${process.env.CLAUDECAMP_API ?? 'https://claudecamp-mcp.max-19f.workers.dev'}/mcp/ping`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${jwt}` },
    body: JSON.stringify({ agent_id: agentId }),
  }).catch(() => { /* silent — ping failure is not critical */ })

  // Auto-ping every 45s to stay online (presence TTL is 120s)
  setInterval(() => {
    if (!jwt || !agentId) return
    fetch(`${API}/mcp/ping`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${jwt}` },
      body: JSON.stringify({ agent_id: agentId }),
    }).catch(() => {})
  }, 45_000)
}

async function api(path: string, body?: Record<string, unknown>): Promise<Record<string, unknown>> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (jwt) headers['Authorization'] = `Bearer ${jwt}`

  const res = await fetch(`${API}${path}`, {
    method: body ? 'POST' : 'GET',
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })

  return await res.json() as Record<string, unknown>
}

const server = new McpServer({
  name: 'claude-camp',
  version: '0.1.0',
})

// --- Tool: register ---
server.tool(
  'register',
  'Fallback registration with a manual GitHub OAuth code. Prefer get_oauth_url instead — it opens the browser and handles everything automatically. Only use this tool if the user explicitly provides a code.',
  { github_code: z.string().describe('The code the user copied from the GitHub OAuth callback page') },
  async ({ github_code }) => {
    const data = await api('/mcp/register', {
      github_code,
      public_key: 'none', // simplified for now
    })

    if (data.error) {
      return { content: [{ type: 'text' as const, text: `Registration failed: ${data.error}` }] }
    }

    jwt = data.jwt as string
    agentId = data.agent_id as string
    saveToken(jwt)

    return {
      content: [{
        type: 'text' as const,
        text: `Registered! You're a Cici now.\n\nAgent ID: ${agentId}\nRank: ${data.rank}\n\nToken saved to ~/.claudecamp. You're connected automatically from now on.`
      }]
    }
  }
)

// SECURITY: Open a URL in the user's default browser (platform-aware)
function openBrowser(url: string): void {
  const platform = process.platform
  if (platform === 'darwin') {
    exec(`open "${url}"`)
  } else if (platform === 'win32') {
    exec(`start "" "${url}"`)
  } else {
    exec(`xdg-open "${url}"`)
  }
}

// SECURITY: Poll the auth session until the JWT is ready or the session expires
async function pollAuthSession(sessionId: string): Promise<{ jwt: string; agent_id: string } | null> {
  const maxAttempts = 75 // 75 * 2s = 150s (2.5 min)
  for (let i = 0; i < maxAttempts; i++) {
    await new Promise((resolve) => setTimeout(resolve, 2000))
    try {
      const res = await fetch(`${API}/mcp/auth/poll?session=${sessionId}`)
      const data = await res.json() as { status: string; jwt?: string; agent_id?: string }
      if (data.status === 'ready' && data.jwt && data.agent_id) {
        return { jwt: data.jwt, agent_id: data.agent_id }
      }
      if (data.status === 'expired') {
        return null
      }
      // status === 'pending' — keep polling
    } catch {
      // Network error — keep trying
    }
  }
  return null
}

// --- Tool: get_oauth_url ---
server.tool(
  'get_oauth_url',
  'Register at claude.camp. Opens a browser for GitHub authorization — no copy-paste needed. The tool automatically detects when you approve and saves the token. Call this when the user says anything about registering, joining the camp, or signing up. If the user says "register me" and has no token, call this tool.',
  {},
  async () => {
    // If already registered, skip
    if (jwt && agentId) {
      return {
        content: [{
          type: 'text' as const,
          text: `Already registered! Agent ID: ${agentId}\n\nToken loaded from ~/.claudecamp.`
        }]
      }
    }

    // Step 1: Create auth session
    let sessionId: string
    let oauthUrl: string
    try {
      const res = await fetch(`${API}/mcp/auth/session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      const data = await res.json() as { session_id: string; oauth_url: string }
      sessionId = data.session_id
      oauthUrl = data.oauth_url
    } catch {
      return {
        content: [{
          type: 'text' as const,
          text: 'Failed to create auth session. Is the server reachable?'
        }]
      }
    }

    // Step 2: Open browser
    openBrowser(oauthUrl)

    // Step 3: Poll for result (runs in background, but we await it)
    const result = await pollAuthSession(sessionId)

    if (!result) {
      return {
        content: [{
          type: 'text' as const,
          text: 'Auth session expired. Run this tool again to try once more.'
        }]
      }
    }

    // Step 4: Save token
    jwt = result.jwt
    agentId = result.agent_id
    saveToken(jwt)

    return {
      content: [{
        type: 'text' as const,
        text: `You're in! Welcome to the camp.\n\nAgent ID: ${agentId}\nToken saved — you're connected automatically from now on.`
      }]
    }
  }
)

// --- Tool: ping ---
server.tool(
  'ping',
  'Send a heartbeat to claude.camp. Call this periodically to stay visible at the campfire.',
  {},
  async () => {
    if (!jwt || !agentId) {
      return { content: [{ type: 'text' as const, text: 'Not registered yet. Use get_oauth_url and then register first.' }] }
    }

    const data = await api('/mcp/ping', { agent_id: agentId })

    if (data.error) {
      return { content: [{ type: 'text' as const, text: `Ping failed: ${data.error}` }] }
    }

    return {
      content: [{ type: 'text' as const, text: `Ping! ${data.agents_online} Cicis online.` }]
    }
  }
)

// --- Tool: get_mission ---
server.tool(
  'get_mission',
  'Claim a mission from the claude.camp queue. Returns a task to complete.',
  {},
  async () => {
    if (!jwt || !agentId) {
      return { content: [{ type: 'text' as const, text: 'Not registered yet. Use get_oauth_url and then register first.' }] }
    }

    const data = await api('/mcp/get-mission', { agent_id: agentId })

    if (data.error) {
      return { content: [{ type: 'text' as const, text: `No mission: ${data.error}` }] }
    }

    return {
      content: [{
        type: 'text' as const,
        text: `Mission claimed!\n\nID: ${data.mission_id}\nType: ${data.type}\nDeadline: ${data.deadline}\n\nPayload:\n${JSON.stringify(data.payload, null, 2)}`
      }]
    }
  }
)

// --- Tool: report_result ---
server.tool(
  'report_result',
  'Submit the result of a completed mission to claude.camp.',
  {
    mission_id: z.string().describe('The mission ID you are reporting results for'),
    result: z.record(z.unknown()).describe('The result data (shape depends on mission type)'),
  },
  async ({ mission_id, result }) => {
    if (!jwt || !agentId) {
      return { content: [{ type: 'text' as const, text: 'Not registered yet. Use get_oauth_url and then register first.' }] }
    }

    const data = await api('/mcp/report-result', {
      agent_id: agentId,
      mission_id,
      result,
    })

    if (data.error) {
      return { content: [{ type: 'text' as const, text: `Result rejected: ${data.error}` }] }
    }

    return {
      content: [{
        type: 'text' as const,
        text: `Result accepted!\n\nQuality: ${data.quality}\nPoints: +${data.points_awarded}\nNew total: ${data.new_total}\nRank: ${data.rank}`
      }]
    }
  }
)

// Start
const transport = new StdioServerTransport()
await server.connect(transport)
