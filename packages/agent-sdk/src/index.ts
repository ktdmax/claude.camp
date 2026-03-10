#!/usr/bin/env node

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { z } from 'zod'

const API = process.env.CLAUDECAMP_API ?? 'https://claudecamp-mcp.max-19f.workers.dev'

// State — auto-load token from env var OR ~/.claudecamp file
import { readFileSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'

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
  'Complete claude.camp registration with a GitHub OAuth code. Call get_oauth_url first, then ask the user for the code they got after approving GitHub access.',
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

// --- Tool: get_oauth_url ---
server.tool(
  'get_oauth_url',
  'Start the claude.camp registration. Returns a GitHub URL the user must open in their browser. After approving, they get a code to pass to the register tool. Call this first when the user says anything about registering at claude.camp, joining the camp, or signing up.',
  {},
  async () => {
    return {
      content: [{
        type: 'text' as const,
        text: `To register, open this URL in your browser:\n\nhttps://github.com/login/oauth/authorize?client_id=Ov23li5vJldFlWcHCiDs&scope=read:user\n\nAfter authorizing, you'll be redirected to a page showing your code. Copy that code and use the 'register' tool with it.`
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
