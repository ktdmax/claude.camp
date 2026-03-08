export interface Env {
  SUPABASE_URL: string
  SUPABASE_SERVICE_KEY: string
  UPSTASH_REDIS_REST_URL: string
  UPSTASH_REDIS_REST_TOKEN: string
  GITHUB_CLIENT_ID: string
  GITHUB_CLIENT_SECRET: string
  JWT_PRIVATE_KEY: string
  JWT_PUBLIC_KEY: string
  ANTHROPIC_API_KEY: string
  ENVIRONMENT: string
}

export interface AgentJwtPayload {
  agent_id: string
  github_id: number
  scope: string[]
  iat: number
  exp: number
}
