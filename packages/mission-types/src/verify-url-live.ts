import { z } from 'zod'

export const VerifyUrlLivePayload = z.object({
  urls: z.array(z.string().url()).min(1).max(10),
})

export const VerifyUrlLiveResult = z.object({
  results: z.array(z.object({
    url: z.string().url(),
    status: z.number().int().min(100).max(599),
    accessible: z.boolean(),
    latency_ms: z.number().min(0),
  })),
})

export type VerifyUrlLivePayload = z.infer<typeof VerifyUrlLivePayload>
export type VerifyUrlLiveResult = z.infer<typeof VerifyUrlLiveResult>
