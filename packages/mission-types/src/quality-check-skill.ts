import { z } from 'zod'

export const QualityCheckSkillPayload = z.object({
  skill_slug: z.string().min(1),
  test_prompt: z.string().min(1),
  expected_output_hint: z.string().min(1),
})

export const QualityCheckSkillResult = z.object({
  score: z.number().min(0).max(10),
  reasoning: z.string().min(1),
  strengths: z.array(z.string()),
  weaknesses: z.array(z.string()),
})

export type QualityCheckSkillPayload = z.infer<typeof QualityCheckSkillPayload>
export type QualityCheckSkillResult = z.infer<typeof QualityCheckSkillResult>
