import {
  FetchAndSummariseResult,
  VerifyUrlLiveResult,
  QualityCheckSkillResult,
  MISSION_BASE_POINTS,
  type MissionType,
} from '@claudecamp/mission-types'
import type { Env } from '../types'

// Step 1: Schema validation — returns parsed result or null
function validateSchema(missionType: MissionType, result: unknown): Record<string, unknown> | null {
  const schemas: Record<MissionType, { safeParse: (v: unknown) => { success: boolean; data?: unknown } }> = {
    fetch_and_summarise: FetchAndSummariseResult,
    verify_url_live: VerifyUrlLiveResult,
    quality_check_skill: QualityCheckSkillResult,
  }

  const schema = schemas[missionType]
  if (!schema) return null

  const parsed = schema.safeParse(result)
  return parsed.success ? (parsed.data as Record<string, unknown>) : null
}

// Step 2: Plausibility heuristics — score 0.5–0.8
function plausibilityScore(missionType: MissionType, payload: Record<string, unknown>, result: Record<string, unknown>): number {
  let score = 0.5

  switch (missionType) {
    case 'fetch_and_summarise': {
      const summary = result.summary as string
      const wordCount = result.word_count as number
      const actualWords = summary.split(/\s+/).filter(Boolean).length

      // Word count within ±10% of actual
      const ratio = actualWords > 0 ? wordCount / actualWords : 0
      if (ratio >= 0.9 && ratio <= 1.1) score += 0.15

      // Summary has reasonable length
      const maxWords = (payload.max_words as number) ?? 200
      if (actualWords >= 10 && actualWords <= maxWords * 1.5) score += 0.15

      break
    }
    case 'verify_url_live': {
      const results = result.results as Array<{ latency_ms: number; status: number }>

      // All results have valid status codes and positive latency
      const allValid = results.every(r => r.status >= 100 && r.status < 600 && r.latency_ms > 0)
      if (allValid) score += 0.2

      // Result count matches input URL count
      const inputUrls = (payload.urls as string[]) ?? []
      if (results.length === inputUrls.length) score += 0.1

      break
    }
    case 'quality_check_skill': {
      const scoreVal = result.score as number
      const reasoning = result.reasoning as string
      const strengths = result.strengths as string[]
      const weaknesses = result.weaknesses as string[]

      // Score in valid range and reasoning non-trivial
      if (scoreVal >= 0 && scoreVal <= 10) score += 0.1
      if (reasoning.length > 20) score += 0.1
      if (strengths.length >= 1 && weaknesses.length >= 1) score += 0.1

      break
    }
  }

  return Math.min(score, 0.8)
}

// Step 3: AI evaluation via Claude Haiku (only for missions with base_points >= 100)
async function aiEvaluation(
  missionType: MissionType,
  payload: Record<string, unknown>,
  result: Record<string, unknown>,
  env: Env
): Promise<number | null> {
  const basePoints = MISSION_BASE_POINTS[missionType]
  if (basePoints < 100) return null

  try {
    const { default: Anthropic } = await import('@anthropic-ai/sdk')
    const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY })

    const evalPrompt = `You are evaluating a mission result for quality and accuracy.

Mission type: ${missionType}
Mission payload: ${JSON.stringify(payload)}
Submitted result: ${JSON.stringify(result)}

Score this result from 0.0 to 1.0:
- 0.0: completely wrong, fabricated, or irrelevant
- 0.5: partially correct, missing key elements
- 1.0: accurate, complete, and useful

Respond with JSON only: {"score": 0.0, "reason": "one sentence"}`

    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 100,
      messages: [{ role: 'user', content: evalPrompt }],
    })

    const text = response.content[0]?.type === 'text' ? response.content[0].text : ''
    const parsed = JSON.parse(text) as { score: number }
    return Math.max(0, Math.min(1, parsed.score))
  } catch {
    // AI eval failure is non-fatal — fall back to plausibility only
    return null
  }
}

// Main scoring pipeline
export async function scoreResult(
  missionType: MissionType,
  payload: Record<string, unknown>,
  result: unknown,
  env: Env
): Promise<number> {
  // Step 1: Schema validation
  const validated = validateSchema(missionType, result)
  if (!validated) return 0

  // Step 2: Plausibility
  const plausibility = plausibilityScore(missionType, payload, validated)

  // Step 3: AI evaluation (if applicable)
  const aiScore = await aiEvaluation(missionType, payload, validated, env)

  // Final: average of plausibility + AI, or plausibility-only
  if (aiScore !== null) {
    return (plausibility + aiScore) / 2
  }
  return plausibility
}

// Quality multiplier from score
export function qualityMultiplier(score: number): number {
  if (score < 0.3) return 0
  if (score < 0.5) return 0.3
  if (score < 0.7) return 0.7
  if (score < 0.9) return 1.0
  if (score < 0.95) return 1.5
  return 2.0
}

// Cici-voice message from score
export function qualityMessage(score: number): string {
  if (score < 0.3) return 'Rejected.'
  if (score < 0.5) return 'Barely counts.'
  if (score < 0.7) return 'Acceptable.'
  if (score < 0.9) return 'Solid.'
  if (score < 0.95) return 'Clean.'
  return "Yes. That's it."
}
