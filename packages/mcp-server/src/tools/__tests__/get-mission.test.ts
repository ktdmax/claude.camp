import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock Redis before importing the module under test
const mockRedis = {
  incr: vi.fn(),
  expire: vi.fn(),
  lrange: vi.fn(),
  lmove: vi.fn(),
  set: vi.fn(),
}

vi.mock('@upstash/redis', () => ({
  Redis: vi.fn(() => mockRedis),
}))

// Track Supabase query chain
const mockSingle = vi.fn()
const mockEq = vi.fn(() => ({ single: mockSingle }))
const mockSelect = vi.fn(() => ({ eq: mockEq }))
const mockUpdateEq = vi.fn()
const mockUpdate = vi.fn(() => ({ eq: mockUpdateEq }))

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: mockSelect,
      update: mockUpdate,
    })),
  })),
}))

import app from '../../index'
import { signJwt } from '../../auth/jwt'
import { generateKeyPair, exportPKCS8, exportSPKI } from 'jose'
import type { Env } from '../../types'

let env: Env
let agentAToken: string
let agentBToken: string

beforeAll(async () => {
  const { privateKey, publicKey } = await generateKeyPair('RS256', { extractable: true })
  env = {
    JWT_PRIVATE_KEY: await exportPKCS8(privateKey),
    JWT_PUBLIC_KEY: await exportSPKI(publicKey),
    SUPABASE_URL: 'https://fake.supabase.co',
    SUPABASE_SERVICE_KEY: 'fake-service-key',
    UPSTASH_REDIS_REST_URL: 'https://fake.upstash.io',
    UPSTASH_REDIS_REST_TOKEN: 'fake-token',
    GITHUB_CLIENT_ID: '',
    GITHUB_CLIENT_SECRET: '',
    ANTHROPIC_API_KEY: '',
    ENVIRONMENT: 'test',
  }
  agentAToken = await signJwt({ agent_id: 'agent-A', github_id: 1 }, env)
  agentBToken = await signJwt({ agent_id: 'agent-B', github_id: 2 }, env)
})

beforeEach(() => {
  vi.clearAllMocks()
})

describe('get-mission atomicity', () => {
  it('LMOVE ensures only one agent gets the mission', async () => {
    // Simulate: one mission in queue. Agent A claims it, Agent B gets nothing.
    let missionTaken = false

    // Rate limit passes
    mockRedis.incr.mockResolvedValue(1)
    mockRedis.expire.mockResolvedValue(1)
    // No existing claimed mission
    mockRedis.lrange.mockResolvedValue([])
    // Deadline set
    mockRedis.set.mockResolvedValue('OK')

    // LMOVE: first call returns mission, second returns null (already moved)
    mockRedis.lmove.mockImplementation(async () => {
      if (!missionTaken) {
        missionTaken = true
        return 'mission-001'
      }
      return null
    })

    // Supabase returns mission data for agent A
    mockSingle.mockResolvedValue({
      data: {
        mission_id: 'mission-001',
        type: 'verify_url_live',
        payload: { urls: ['https://example.com'] },
        status: 'available',
      },
    })

    const reqA = new Request('http://localhost/mcp/get-mission', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${agentAToken}`,
      },
      body: JSON.stringify({}),
    })

    const reqB = new Request('http://localhost/mcp/get-mission', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${agentBToken}`,
      },
      body: JSON.stringify({}),
    })

    // Fire both concurrently — simulates race condition
    const [resA, resB] = await Promise.all([
      app.fetch(reqA, env),
      app.fetch(reqB, env),
    ])

    const bodyA = await resA.json() as Record<string, unknown>
    const bodyB = await resB.json() as Record<string, unknown>

    // Agent A got the mission
    expect(bodyA.mission_id).toBe('mission-001')

    // Agent B got nothing (queue empty)
    expect(bodyB.mission_id).toBeNull()
    expect(bodyB.message).toContain('quiet')
  })

  it('returns 429 when mission rate limit exceeded', async () => {
    mockRedis.incr.mockResolvedValue(61) // over 60/hour
    mockRedis.lrange.mockResolvedValue([])

    const req = new Request('http://localhost/mcp/get-mission', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${agentAToken}`,
      },
      body: JSON.stringify({}),
    })

    const res = await app.fetch(req, env)
    expect(res.status).toBe(429)
  })
})
