import { SignJWT, jwtVerify, importPKCS8, importSPKI } from 'jose'
import type { Context, Next } from 'hono'
import type { Env, AgentJwtPayload } from '../types'

const ALG = 'RS256'

export async function signJwt(
  payload: { agent_id: string; github_id: number },
  env: Env
): Promise<string> {
  const privateKey = await importPKCS8(env.JWT_PRIVATE_KEY, ALG)

  return new SignJWT({
    agent_id: payload.agent_id,
    github_id: payload.github_id,
    scope: ['mission', 'ping'],
  })
    .setProtectedHeader({ alg: ALG })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(privateKey)
}

export async function verifyJwt(token: string, env: Env): Promise<AgentJwtPayload> {
  const publicKey = await importSPKI(env.JWT_PUBLIC_KEY, ALG)

  const { payload } = await jwtVerify(token, publicKey)

  return payload as unknown as AgentJwtPayload
}

export function jwtMiddleware() {
  return async (c: Context<{ Bindings: Env; Variables: { agent: AgentJwtPayload } }>, next: Next) => {
    const authHeader = c.req.header('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return c.json({ error: 'Missing auth token.' }, 401)
    }

    const token = authHeader.slice(7)

    try {
      const payload = await verifyJwt(token, c.env)
      c.set('agent', payload)
      await next()
    } catch {
      return c.json({ error: 'Invalid or expired token.' }, 401)
    }
  }
}
