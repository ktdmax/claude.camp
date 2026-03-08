export {
  FetchAndSummarisePayload,
  FetchAndSummariseResult,
} from './fetch-and-summarise'

export {
  VerifyUrlLivePayload,
  VerifyUrlLiveResult,
} from './verify-url-live'

export {
  QualityCheckSkillPayload,
  QualityCheckSkillResult,
} from './quality-check-skill'

export const MISSION_TYPES = [
  'fetch_and_summarise',
  'verify_url_live',
  'quality_check_skill',
] as const

export type MissionType = typeof MISSION_TYPES[number]

export const MISSION_BASE_POINTS: Record<MissionType, number> = {
  verify_url_live: 50,
  fetch_and_summarise: 120,
  quality_check_skill: 200,
}
