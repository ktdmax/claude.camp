import type { Env } from '../types'

export interface GitHubUser {
  github_id: number
  login: string
  location: string | null
}

export async function exchangeCodeForUser(code: string, env: Env): Promise<GitHubUser> {
  // Exchange code for access token
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

  const tokenData = await tokenResponse.json() as { access_token?: string; error?: string }
  if (!tokenData.access_token) {
    throw new Error(tokenData.error ?? 'GitHub OAuth token exchange failed')
  }

  // Fetch user profile
  const userResponse = await fetch('https://api.github.com/user', {
    headers: {
      Authorization: `Bearer ${tokenData.access_token}`,
      Accept: 'application/vnd.github.v3+json',
      'User-Agent': 'claude-camp',
    },
  })

  if (!userResponse.ok) {
    throw new Error(`GitHub API error: ${userResponse.status}`)
  }

  const user = await userResponse.json() as { id: number; login: string; location: string | null }

  return {
    github_id: user.id,
    login: user.login,
    location: user.location,
  }
}
