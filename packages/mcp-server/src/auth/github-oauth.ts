import { z } from 'zod'
import type { Env } from '../types'

export interface GitHubUser {
  github_id: number
  login: string
  location: string | null
}

// SECURITY: Zod schemas for GitHub API responses — never trust external JSON shape
const GitHubTokenResponse = z.object({
  access_token: z.string().optional(),
  error: z.string().optional(),
})

const GitHubUserResponse = z.object({
  id: z.number(),
  login: z.string(),
  location: z.string().nullable(),
})

export async function exchangeCodeForUser(code: string, env: Env): Promise<GitHubUser> {
  // SECURITY: Exchange happens server-side only — client_secret never exposed to browser
  const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      client_id: env.GITHUB_CLIENT_ID,
      client_secret: env.GITHUB_CLIENT_SECRET,
      code,
    }),
  })

  const tokenParsed = GitHubTokenResponse.safeParse(await tokenResponse.json())
  if (!tokenParsed.success) {
    throw new Error('GitHub OAuth token response has unexpected shape')
  }
  if (!tokenParsed.data.access_token) {
    throw new Error(tokenParsed.data.error ?? 'GitHub OAuth token exchange failed')
  }

  // SECURITY: Token used once to fetch profile, then discarded — never stored or returned
  const userResponse = await fetch('https://api.github.com/user', {
    headers: {
      Authorization: `Bearer ${tokenParsed.data.access_token}`,
      Accept: 'application/vnd.github.v3+json',
      'User-Agent': 'claude-camp',
    },
  })

  if (!userResponse.ok) {
    throw new Error(`GitHub API error: ${userResponse.status}`)
  }

  const userParsed = GitHubUserResponse.safeParse(await userResponse.json())
  if (!userParsed.success) {
    throw new Error('GitHub user response has unexpected shape')
  }

  return {
    github_id: userParsed.data.id,
    login: userParsed.data.login,
    location: userParsed.data.location,
  }
}
