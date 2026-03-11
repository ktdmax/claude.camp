import { SignJWT, jwtVerify, importPKCS8, importSPKI } from 'jose'
import { z } from 'zod'
import type { Context, Next } from 'hono'
import type { Env, AgentJwtPayload } from '../types'

const ALG = 'RS256'

// SECURITY: Issuer and audience constants for JWT validation (H1)
const JWT_ISSUER = 'claude.camp'
const JWT_AUDIENCE = 'claudecamp-mcp'

// SECURITY: Zod schema to validate JWT payload structure after verification (H2)
const JwtPayloadSchema = z.object({
  agent_id: z.string().min(1),
  github_id: z.number().int().positive(),
  scope: z.array(z.string()).min(1),
})

export async function signJwt(
  payload: { agent_id: string; github_id: number; country?: string | null },
  env: Env
): Promise<string> {
  const privateKey = await importPKCS8(env.JWT_PRIVATE_KEY, ALG)

  // SECURITY: Set issuer, audience, and subject claims (H1)
  return new SignJWT({
    agent_id: payload.agent_id,
    github_id: payload.github_id,
    scope: ['mission', 'ping'],
    country: payload.country ?? null,
  })
    .setProtectedHeader({ alg: ALG })
    .setIssuedAt()
    .setExpirationTime('24h')
    .setIssuer(JWT_ISSUER)
    .setAudience(JWT_AUDIENCE)
    .setSubject(payload.agent_id)
    .sign(privateKey)
}

export async function verifyJwt(token: string, env: Env): Promise<AgentJwtPayload> {
  const publicKey = await importSPKI(env.JWT_PUBLIC_KEY, ALG)

  // SECURITY: Verify issuer and audience claims (H1)
  const { payload } = await jwtVerify(token, publicKey, {
    issuer: JWT_ISSUER,
    audience: JWT_AUDIENCE,
  })

  // SECURITY: Validate payload structure with Zod (H2)
  const parsed = JwtPayloadSchema.parse(payload)

  return {
    agent_id: parsed.agent_id,
    github_id: parsed.github_id,
    scope: parsed.scope,
    // Backward compat: old JWTs without country field default to null
    country: typeof payload.country === 'string' ? payload.country : null,
    iat: payload.iat as number,
    exp: payload.exp as number,
  }
}

// SECURITY: Middleware now requires a specific scope (H3)
export function jwtMiddleware(requiredScope: string) {
  return async (c: Context<{ Bindings: Env; Variables: { agent: AgentJwtPayload } }>, next: Next) => {
    const authHeader = c.req.header('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return c.json({ error: 'Missing auth token.' }, 401)
    }

    const token = authHeader.slice(7)

    try {
      const payload = await verifyJwt(token, c.env)

      // SECURITY: Enforce scope claim (H3)
      if (!payload.scope.includes(requiredScope)) {
        return c.json({ error: 'Insufficient scope.' }, 403)
      }

      c.set('agent', payload)
      await next()
    } catch {
      return c.json({ error: 'Invalid or expired token.' }, 401)
    }
  }
}
