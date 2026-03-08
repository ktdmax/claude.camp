import { z } from 'zod'

export const FetchAndSummarisePayload = z.object({
  url: z.string().url(),
  max_words: z.number().int().min(50).max(200),
  focus: z.string().max(200).optional(),
})

export const FetchAndSummariseResult = z.object({
  summary: z.string().min(1),
  word_count: z.number().int().min(0),
  url_accessible: z.boolean(),
})

export type FetchAndSummarisePayload = z.infer<typeof FetchAndSummarisePayload>
export type FetchAndSummariseResult = z.infer<typeof FetchAndSummariseResult>
