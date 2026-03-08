import { describe, it, expect } from 'vitest'
import { SignJWT, importPKCS8 } from 'jose'
import { signJwt, verifyJwt } from '../jwt'
import type { Env } from '../../types'

// Generate a test keypair inline — NOT production keys
import { generateKeyPair, exportPKCS8, exportSPKI } from 'jose'

let env: Env

beforeAll(async () => {
  const { privateKey, publicKey } = await generateKeyPair('RS256', { extractable: true })
  const privPem = await exportPKCS8(privateKey)
  const pubPem = await exportSPKI(publicKey)

  env = {
    JWT_PRIVATE_KEY: privPem,
    JWT_PUBLIC_KEY: pubPem,
    SUPABASE_URL: '',
    SUPABASE_SERVICE_KEY: '',
    UPSTASH_REDIS_REST_URL: '',
    UPSTASH_REDIS_REST_TOKEN: '',
    GITHUB_CLIENT_ID: '',
    GITHUB_CLIENT_SECRET: '',
    ANTHROPIC_API_KEY: '',
    ENVIRONMENT: 'test',
  }
})

describe('JWT sign + verify', () => {
  it('signs and verifies a valid token', async () => {
    const token = await signJwt({ agent_id: 'agent-123', github_id: 42 }, env)

    const payload = await verifyJwt(token, env)

    expect(payload.agent_id).toBe('agent-123')
    expect(payload.github_id).toBe(42)
    expect(payload.scope).toEqual(['mission', 'ping'])
    expect(payload.exp).toBeGreaterThan(Math.floor(Date.now() / 1000))
  })

  it('rejects an expired token', async () => {
    // Sign a token that expired 1 second ago
    const privateKey = await importPKCS8(env.JWT_PRIVATE_KEY, 'RS256')

    const expiredToken = await new SignJWT({
      agent_id: 'agent-expired',
      github_id: 99,
      scope: ['mission', 'ping'],
    })
      .setProtectedHeader({ alg: 'RS256' })
      .setIssuedAt(Math.floor(Date.now() / 1000) - 3600)
      .setExpirationTime(Math.floor(Date.now() / 1000) - 1)
      .sign(privateKey)

    await expect(verifyJwt(expiredToken, env)).rejects.toThrow()
  })

  it('rejects a tampered token', async () => {
    const token = await signJwt({ agent_id: 'agent-legit', github_id: 7 }, env)

    // Tamper with the payload (middle segment)
    const parts = token.split('.')
    // Decode payload, modify, re-encode
    const payload = JSON.parse(atob(parts[1]!))
    payload.agent_id = 'agent-hacked'
    parts[1] = btoa(JSON.stringify(payload)).replace(/=/g, '')
    const tampered = parts.join('.')

    await expect(verifyJwt(tampered, env)).rejects.toThrow()
  })

  it('rejects a token signed with a different key', async () => {
    const { privateKey: otherKey } = await generateKeyPair('RS256', { extractable: true })
    const otherPem = await exportPKCS8(otherKey)

    const envWithOtherKey = { ...env, JWT_PRIVATE_KEY: otherPem }
    const token = await signJwt({ agent_id: 'agent-wrong-key', github_id: 1 }, envWithOtherKey)

    // Verify with original public key — should fail
    await expect(verifyJwt(token, env)).rejects.toThrow()
  })
})
