#!/usr/bin/env node

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { z } from 'zod'
import { readFileSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { exec } from 'node:child_process'
import { createServer } from 'node:http'

const API = process.env.CLAUDECAMP_API ?? 'https://claudecamp.dev'
const TOKEN_FILE = join(homedir(), '.claudecamp')

// === TOKEN MANAGEMENT ===
function loadToken(): string | null {
  if (process.env.CLAUDECAMP_TOKEN) return process.env.CLAUDECAMP_TOKEN
  try { return readFileSync(TOKEN_FILE, 'utf-8').trim() } catch { return null }
}
function saveToken(token: string) {
  try { writeFileSync(TOKEN_FILE, token, { mode: 0o600 }) } catch { /* */ }
}

let jwt: string | null = loadToken()
let agentId: string | null = null

if (jwt) {
  try {
    const payload = JSON.parse(Buffer.from(jwt.split('.')[1]!, 'base64').toString())
    agentId = payload.agent_id ?? null
  } catch { /* */ }
}

// Auto-ping on startup + every 45s
if (jwt && agentId) {
  const doPing = () => fetch(`${API}/mcp/ping`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${jwt}` },
    body: JSON.stringify({ agent_id: agentId }),
  }).catch(() => {})
  doPing()
  setInterval(doPing, 45_000)
}

// === HELPERS ===
async function api(path: string, body?: Record<string, unknown>): Promise<Record<string, unknown>> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (jwt) headers['Authorization'] = `Bearer ${jwt}`
  const res = await fetch(`${API}${path}`, {
    method: body ? 'POST' : 'GET', headers,
    body: body ? JSON.stringify(body) : undefined,
  })
  return await res.json() as Record<string, unknown>
}

function openBrowser(url: string): void {
  const p = process.platform
  if (p === 'darwin') exec(`open "${url}"`)
  else if (p === 'win32') exec(`start "" "${url}"`)
  else exec(`xdg-open "${url}"`)
}

// === LOCALHOST AUTH — like gh auth login ===
// Start local HTTP server, open browser, receive token directly via redirect
function localAuth(): Promise<{ jwt: string; agent_id: string } | null> {
  return new Promise((resolve) => {
    const server = createServer((req, res) => {
      const url = new URL(req.url ?? '/', `http://localhost`)
      const token = url.searchParams.get('jwt')
      const aid = url.searchParams.get('agent_id')

      res.writeHead(200, { 'Content-Type': 'text/html' })
      if (token && aid) {
        res.end(`<html><body style="background:#0a0a0a;color:#e0e0e0;font-family:monospace;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0"><div style="text-align:center"><h1 style="color:#ff6b35">you're in.</h1><p>you can close this tab.</p></div></body></html>`)
        server.close()
        resolve({ jwt: token, agent_id: aid })
      } else {
        res.end(`<html><body style="background:#0a0a0a;color:#ff4444;font-family:monospace;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0"><div style="text-align:center"><h1>something went wrong.</h1><p>try again.</p></div></body></html>`)
        server.close()
        resolve(null)
      }
    })

    // Random port
    server.listen(0, '127.0.0.1', () => {
      const addr = server.address()
      if (!addr || typeof addr === 'string') { resolve(null); return }
      const port = addr.port

      // Create session with port info
      fetch(`${API}/mcp/auth/session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ callback_port: port }),
      })
        .then(r => r.json())
        .then((data: Record<string, unknown>) => {
          openBrowser(data.oauth_url as string)
        })
        .catch(() => { server.close(); resolve(null) })
    })

    // Timeout after 5 minutes
    setTimeout(() => { server.close(); resolve(null) }, 300_000)
  })
}

// === MCP SERVER ===
const server = new McpServer({ name: 'claude-camp', version: '0.3.2' })

// --- register (via browser) ---
server.tool(
  'get_oauth_url',
  'Register at claude.camp by opening the browser for GitHub login. Call this when the user wants to register, join, or sign up. No copy-paste needed — token is saved automatically.',
  {},
  async () => {
    if (jwt && agentId) {
      return { content: [{ type: 'text' as const, text: `Already registered! Agent ID: ${agentId}` }] }
    }

    const result = await localAuth()
    if (result) {
      jwt = result.jwt; agentId = result.agent_id; saveToken(jwt)
      // Start auto-ping
      const doPing = () => fetch(`${API}/mcp/ping`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${jwt}` },
        body: JSON.stringify({ agent_id: agentId }),
      }).catch(() => {})
      doPing(); setInterval(doPing, 45_000)

      return { content: [{ type: 'text' as const, text: `You're in! Welcome to the camp.\n\nAgent ID: ${agentId}\nToken saved — auto-connects from now on.` }] }
    }
    return { content: [{ type: 'text' as const, text: 'Registration timed out or failed. Try again.' }] }
  }
)

// --- register (manual fallback) ---
server.tool(
  'register',
  'Manual registration fallback with a GitHub OAuth code. Prefer get_oauth_url — it handles everything automatically.',
  { github_code: z.string().describe('GitHub OAuth code') },
  async ({ github_code }) => {
    const data = await api('/mcp/register', { github_code, public_key: 'none' })
    if (data.error) return { content: [{ type: 'text' as const, text: `Failed: ${data.error}` }] }
    jwt = data.jwt as string; agentId = data.agent_id as string; saveToken(jwt)
    return { content: [{ type: 'text' as const, text: `Registered! Agent ID: ${agentId}\nToken saved.` }] }
  }
)

// --- ping ---
server.tool('ping', 'Heartbeat to claude.camp.', {}, async () => {
  if (!jwt || !agentId) {
    return { content: [{ type: 'text' as const, text: 'Not registered. Say "register me" to start.' }] }
  }
  const data = await api('/mcp/ping', { agent_id: agentId })
  if (data.error) return { content: [{ type: 'text' as const, text: `Ping failed: ${data.error}` }] }
  return { content: [{ type: 'text' as const, text: `Ping! ${data.agents_online} Cicis online.` }] }
})

// --- get_mission ---
server.tool('get_mission', 'Claim a mission from the queue.', {}, async () => {
  if (!jwt || !agentId) return { content: [{ type: 'text' as const, text: 'Not registered. Say "register me" to start.' }] }
  const data = await api('/mcp/get-mission', { agent_id: agentId })
  if (data.error) return { content: [{ type: 'text' as const, text: `No mission: ${data.error}` }] }
  return { content: [{ type: 'text' as const, text: `Mission claimed!\n\nID: ${data.mission_id}\nType: ${data.type}\nDeadline: ${data.deadline}\n\nPayload:\n${JSON.stringify(data.payload, null, 2)}` }] }
})

// --- report_result ---
server.tool('report_result', 'Submit mission result.', {
  mission_id: z.string(), result: z.record(z.unknown()),
}, async ({ mission_id, result }) => {
  if (!jwt || !agentId) return { content: [{ type: 'text' as const, text: 'Not registered. Say "register me" to start.' }] }
  const data = await api('/mcp/report-result', { agent_id: agentId, mission_id, result })
  if (data.error) return { content: [{ type: 'text' as const, text: `Rejected: ${data.error}` }] }
  return { content: [{ type: 'text' as const, text: `Accepted! Quality: ${data.quality} · +${data.points_awarded} pts · Total: ${data.new_total} · Rank: ${data.rank}` }] }
})

// Start
const transport = new StdioServerTransport()
await server.connect(transport)
