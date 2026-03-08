import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock Redis
const mockRedis = {
  lrange: vi.fn(),
  exists: vi.fn(),
  get: vi.fn(),
  set: vi.fn(),
  lrem: vi.fn(),
}

vi.mock('@upstash/redis', () => ({
  Redis: vi.fn(() => mockRedis),
}))

// Mock Supabase
const mockSingle = vi.fn()
const mockSelectEq = vi.fn(() => ({ single: mockSingle }))
const mockSelect = vi.fn(() => ({ eq: mockSelectEq }))
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

// Mock scoring — returns predictable quality
vi.mock('../../scoring/quality', () => ({
  scoreResult: vi.fn().mockResolvedValue(0.75),
  qualityMultiplier: vi.fn().mockReturnValue(1.0),
  qualityMessage: vi.fn().mockReturnValue('Solid.'),
}))

import app from '../../index'
import { signJwt } from '../../auth/jwt'
import { generateKeyPair, exportPKCS8, exportSPKI } from 'jose'
import type { Env } from '../../types'

let env: Env
let agentToken: string
let wrongAgentToken: string

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
  agentToken = await signJwt({ agent_id: 'agent-owner', github_id: 10 }, env)
  wrongAgentToken = await signJwt({ agent_id: 'agent-thief', github_id: 11 }, env)
})

beforeEach(() => {
  vi.clearAllMocks()
})

function makeReportRequest(token: string, body: Record<string, unknown>): Request {
  return new Request('http://localhost/mcp/report-result', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  })
}

describe('report-result', () => {
  it('rejects when agent does not own the mission (403)', async () => {
    // agent-thief claims to own mission-001, but Redis says they have nothing
    mockRedis.lrange.mockResolvedValue([])

    const req = makeReportRequest(wrongAgentToken, {
      mission_id: 'mission-001',
      result: { summary: 'fake', word_count: 5, url_accessible: true },
    })

    const res = await app.fetch(req, env)
    const body = await res.json() as Record<string, unknown>

    expect(res.status).toBe(403)
    expect(body.accepted).toBe(false)
    expect(body.error).toContain('not your mission')
  })

  it('rejects when agent owns a different mission (403)', async () => {
    // agent-thief has mission-002 claimed, but tries to report for mission-001
    mockRedis.lrange.mockResolvedValue(['mission-002'])

    const req = makeReportRequest(wrongAgentToken, {
      mission_id: 'mission-001',
      result: { summary: 'fake', word_count: 5, url_accessible: true },
    })

    const res = await app.fetch(req, env)
    const body = await res.json() as Record<string, unknown>

    expect(res.status).toBe(403)
    expect(body.accepted).toBe(false)
  })

  it('rejects when deadline has expired (410)', async () => {
    // Ownership check passes
    mockRedis.lrange.mockResolvedValue(['mission-001'])
    // Deadline key no longer exists in Redis (TTL expired)
    mockRedis.exists.mockResolvedValue(0)
    // clearClaimedMission
    mockRedis.lrem.mockResolvedValue(1)

    const req = makeReportRequest(agentToken, {
      mission_id: 'mission-001',
      result: { summary: 'good work', word_count: 2, url_accessible: true },
    })

    const res = await app.fetch(req, env)
    const body = await res.json() as Record<string, unknown>

    expect(res.status).toBe(410)
    expect(body.accepted).toBe(false)
    expect(body.error).toContain('Deadline')
  })

  it('rejects duplicate results (409)', async () => {
    // Ownership passes
    mockRedis.lrange.mockResolvedValue(['mission-001'])
    // Deadline passes
    mockRedis.exists.mockResolvedValue(1)
    // Duplicate hash found
    mockRedis.get.mockResolvedValue('agent-someone-else')

    const req = makeReportRequest(agentToken, {
      mission_id: 'mission-001',
      result: { summary: 'copied answer', word_count: 2, url_accessible: true },
    })

    const res = await app.fetch(req, env)
    const body = await res.json() as Record<string, unknown>

    expect(res.status).toBe(409)
    expect(body.accepted).toBe(false)
    expect(body.error).toContain('Duplicate')
  })

  it('accepts a valid result from the rightful owner', async () => {
    // Ownership passes
    mockRedis.lrange.mockResolvedValue(['mission-001'])
    // Deadline passes
    mockRedis.exists.mockResolvedValue(1)
    // No duplicate
    mockRedis.get.mockResolvedValue(null)
    // storeResultHash + clearClaimedMission
    mockRedis.set.mockResolvedValue('OK')
    mockRedis.lrem.mockResolvedValue(1)

    // Supabase returns mission
    mockSingle.mockResolvedValue({
      data: {
        mission_id: 'mission-001',
        type: 'fetch_and_summarise',
        payload: { url: 'https://example.com', max_words: 100 },
        status: 'claimed',
        claimed_by: 'agent-owner',
      },
    })

    // Agent score lookup
    mockSingle.mockResolvedValueOnce({
      data: {
        mission_id: 'mission-001',
        type: 'fetch_and_summarise',
        payload: { url: 'https://example.com', max_words: 100 },
        status: 'claimed',
        claimed_by: 'agent-owner',
      },
    }).mockResolvedValueOnce({
      data: { score: 500, missions_total: 3, missions_ok: 3 },
    })

    const req = makeReportRequest(agentToken, {
      mission_id: 'mission-001',
      result: { summary: 'A good summary of the page', word_count: 6, url_accessible: true },
    })

    const res = await app.fetch(req, env)
    const body = await res.json() as Record<string, unknown>

    expect(res.status).toBe(200)
    expect(body.accepted).toBe(true)
    expect(body.quality_score).toBe(0.75)
    expect(body.message).toBe('Solid.')
  })
})
