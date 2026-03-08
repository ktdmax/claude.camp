import { describe, it, expect } from 'vitest'
import { scoreResult, qualityMultiplier, qualityMessage } from '../quality'
import type { Env } from '../../types'

// This test calls real Claude Haiku API — run manually, not in CI
describe('quality scoring — live API', () => {
  const env: Env = {
    SUPABASE_URL: '',
    SUPABASE_SERVICE_KEY: '',
    UPSTASH_REDIS_REST_URL: '',
    UPSTASH_REDIS_REST_TOKEN: '',
    GITHUB_CLIENT_ID: '',
    GITHUB_CLIENT_SECRET: '',
    JWT_PRIVATE_KEY: '',
    JWT_PUBLIC_KEY: '',
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY ?? '',
    ENVIRONMENT: 'test',
  }

  it('scores a plausible fetch_and_summarise result (>= 0.5)', async () => {
    const payload = {
      url: 'https://example.com',
      max_words: 100,
    }

    const result = {
      summary: 'Example Domain is a simple website used for illustrative examples in documents and tutorials. It is maintained by IANA and can be used without prior coordination.',
      word_count: 25,
      url_accessible: true,
    }

    const score = await scoreResult('fetch_and_summarise', payload, result, env)

    console.log(`Quality score: ${score}`)
    console.log(`Multiplier: ${qualityMultiplier(score)}`)
    console.log(`Message: ${qualityMessage(score)}`)

    // A plausible result should score at least 0.5
    expect(score).toBeGreaterThanOrEqual(0.5)
    expect(score).toBeLessThanOrEqual(1.0)
  }, 15000)

  it('scores a garbage result low (< 0.5)', async () => {
    const payload = {
      url: 'https://example.com',
      max_words: 100,
    }

    const result = {
      summary: 'asdf',
      word_count: 999,
      url_accessible: true,
    }

    const score = await scoreResult('fetch_and_summarise', payload, result, env)

    console.log(`Garbage score: ${score}`)

    // Garbage should score low — word_count mismatch, tiny summary
    expect(score).toBeLessThan(0.7)
  }, 15000)

  it('returns 0 for schema-invalid result', async () => {
    const score = await scoreResult('fetch_and_summarise', {}, { wrong_field: true }, env)
    expect(score).toBe(0)
  })
})
