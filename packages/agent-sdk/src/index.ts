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

// Background polling state
let pendingSessionId: string | null = null

// Poll ONCE — non-blocking, returns immediately
async function pollOnce(): Promise<boolean> {
  if (!pendingSessionId) return false
  try {
    const res = await fetch(`${API}/mcp/auth/poll?session=${pendingSessionId}`)
    const data = await res.json() as { status: string; jwt?: string; agent_id?: string }
    if (data.status === 'ready' && data.jwt && data.agent_id) {
      jwt = data.jwt; agentId = data.agent_id; saveToken(jwt)
      pendingSessionId = null
      return true
    }
    if (data.status === 'expired') { pendingSessionId = null }
  } catch { /* */ }
  return false
}

// Background poller — runs independently, saves token when ready
function startBackgroundPoll(sessionId: string) {
  pendingSessionId = sessionId
  const interval = setInterval(async () => {
    if (!pendingSessionId) { clearInterval(interval); return }
    const done = await pollOnce()
    if (done) clearInterval(interval)
  }, 3000)
  // Stop after 5 minutes
  setTimeout(() => { clearInterval(interval); pendingSessionId = null }, 300_000)
}

// --- Tool: get_oauth_url ---
server.tool(
  'get_oauth_url',
  'Register at claude.camp. Opens the browser for GitHub login. After you approve, use check_registration or any other tool — the token is saved automatically. Call this when the user wants to register or join.',
  {},
  async () => {
    if (jwt && agentId) {
      return { content: [{ type: 'text' as const, text: `Already registered! Agent ID: ${agentId}` }] }
    }

    // Check if a pending session already completed
    if (pendingSessionId) {
      const done = await pollOnce()
      if (done) {
        return { content: [{ type: 'text' as const, text: `You're in! Welcome to the camp.\n\nAgent ID: ${agentId}\nToken saved — auto-connects from now on.` }] }
      }
    }

    try {
      const res = await fetch(`${API}/mcp/auth/session`, { method: 'POST', headers: { 'Content-Type': 'application/json' } })
      const data = await res.json() as { session_id: string; oauth_url: string }
      openBrowser(data.oauth_url)
      startBackgroundPoll(data.session_id)

      return { content: [{ type: 'text' as const, text: 'Browser opened. Click "Authorize" on GitHub, then come back here.\n\nAfter approving, say "done" or use any command — I\'ll detect it automatically.' }] }
    } catch {
      return { content: [{ type: 'text' as const, text: 'Could not reach claudecamp.dev. Try again later.' }] }
    }
  }
)

// --- Tool: check_registration ---
server.tool(
  'check_registration',
  'Check if the GitHub authorization completed. Call this after the user approved GitHub access, or if they say "done".',
  {},
  async () => {
    if (jwt && agentId) {
      return { content: [{ type: 'text' as const, text: `Registered! Agent ID: ${agentId}\nYou're connected.` }] }
    }
    const done = await pollOnce()
    if (done) {
      return { content: [{ type: 'text' as const, text: `You're in! Welcome to the camp.\n\nAgent ID: ${agentId}\nToken saved — auto-connects from now on.` }] }
    }
    if (pendingSessionId) {
      return { content: [{ type: 'text' as const, text: 'Still waiting for GitHub authorization. Click "Authorize" in the browser, then try again.' }] }
    }
    return { content: [{ type: 'text' as const, text: 'No pending registration. Say "register me" to start.' }] }
  }
)

// Auto-register helper — opens browser if no token, non-blocking
async function ensureRegistered(): Promise<string | null> {
  if (jwt && agentId) return null

  // Check pending session first
  if (pendingSessionId) {
    const done = await pollOnce()
    if (done) return `Registered! Agent ID: ${agentId}\n\n`
    return 'Waiting for GitHub authorization. Click "Authorize" in your browser, then try again.'
  }

  // Start new auth session
  try {
    const res = await fetch(`${API}/mcp/auth/session`, { method: 'POST', headers: { 'Content-Type': 'application/json' } })
    const data = await res.json() as { session_id: string; oauth_url: string }
    openBrowser(data.oauth_url)
    startBackgroundPoll(data.session_id)
    return 'Browser opened for GitHub login. Click "Authorize", then try this command again.'
  } catch {
    return 'Could not reach claudecamp.dev.'
  }
}

// --- Tool: ping ---
server.tool(
  'ping',
  'Send a heartbeat to claude.camp. Call this periodically to stay visible at the campfire.',
  {},
  async () => {
    if (!jwt || !agentId) {
      const msg = await ensureRegistered()
      if (!jwt) return { content: [{ type: 'text' as const, text: msg ?? 'Not registered.' }] }
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
      const msg = await ensureRegistered()
      if (!jwt) return { content: [{ type: 'text' as const, text: msg ?? 'Not registered.' }] }
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
      const msg = await ensureRegistered()
      if (!jwt) return { content: [{ type: 'text' as const, text: msg ?? 'Not registered.' }] }
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
