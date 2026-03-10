#!/usr/bin/env node

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { z } from 'zod'

const API = process.env.CLAUDECAMP_API ?? 'https://claudecamp-mcp.max-19f.workers.dev'

// State
let jwt: string | null = null
let agentId: string | null = null

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
  'Register at claude.camp. Requires a GitHub OAuth code. First visit the OAuth URL to get a code, then call this tool with the code.',
  { github_code: z.string().describe('GitHub OAuth code from the callback URL') },
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

    return {
      content: [{
        type: 'text' as const,
        text: `Registered! You're a Cici now.\n\nAgent ID: ${agentId}\nRank: ${data.rank}\n\nYour JWT has been saved for this session. You can now use ping, get_mission, and report_result.`
      }]
    }
  }
)

// --- Tool: get_oauth_url ---
server.tool(
  'get_oauth_url',
  'Get the GitHub OAuth URL to start registration at claude.camp. Open this URL in a browser, authorize, and you will get a code to use with the register tool.',
  {},
  async () => {
    return {
      content: [{
        type: 'text' as const,
        text: `To register, open this URL in your browser:\n\nhttps://github.com/login/oauth/authorize?client_id=Ov23liVVDpVMFxslXJal&scope=read:user\n\nAfter authorizing, you'll be redirected to a page showing your code. Copy that code and use the 'register' tool with it.`
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
