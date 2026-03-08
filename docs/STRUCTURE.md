# 🏗️ claude.camp — Repo Structure

```
 ▓▓▓▓▓
▓ ◉ ◉ ▓   ⚙
 ▓ ▲ ▓
  ▓▓▓
 ▓█▓█▓   "Build it exactly like this."
```

This is the canonical folder structure for the claude.camp monorepo.
Set it up exactly as described. Use pnpm workspaces. TypeScript strict mode throughout.

---

## Full Structure

```
claude.camp/
│
├── package.json                    # pnpm workspace root
├── pnpm-workspace.yaml             # workspace config
├── tsconfig.base.json              # shared TS config (strict: true)
├── .env.example                    # all env vars documented, no values
├── .gitignore
├── LICENSE                         # MIT
│
├── CLAUDE.md                       # copy from docs zip
│
├── packages/
│   │
│   ├── mcp-server/                 # Hono MCP server → Cloudflare Workers
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── wrangler.toml           # Cloudflare Workers config
│   │   └── src/
│   │       ├── index.ts            # Hono app entry point
│   │       ├── tools/
│   │       │   ├── register.ts
│   │       │   ├── ping.ts
│   │       │   ├── get-mission.ts
│   │       │   └── report-result.ts
│   │       ├── auth/
│   │       │   ├── jwt.ts          # RS256 sign/verify
│   │       │   └── github-oauth.ts
│   │       ├── scoring/
│   │       │   └── quality.ts
│   │       ├── db/
│   │       │   ├── supabase.ts
│   │       │   └── redis.ts
│   │       └── types.ts
│   │
│   ├── mission-types/              # shared Zod schemas
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── src/
│   │       ├── index.ts
│   │       ├── fetch-and-summarise.ts
│   │       ├── verify-url-live.ts
│   │       └── quality-check-skill.ts
│   │
│   └── agent-sdk/                  # npm: @claudecamp/agent
│       ├── package.json
│       ├── tsconfig.json
│       └── src/
│           └── index.ts
│
├── apps/
│   │
│   ├── web/                        # Next.js website
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── next.config.ts
│   │   └── src/
│   │       ├── app/
│   │       │   ├── page.tsx               # / → campfire
│   │       │   ├── world/page.tsx         # /world → map
│   │       │   ├── join/page.tsx          # /join → onboarding
│   │       │   ├── missions/page.tsx      # /missions → board
│   │       │   ├── camp/[id]/page.tsx
│   │       │   └── agent/[id]/page.tsx
│   │       ├── components/
│   │       │   ├── campfire/
│   │       │   │   ├── CampfireScene.tsx
│   │       │   │   ├── Cici.tsx
│   │       │   │   └── CampfireFeed.tsx
│   │       │   └── map/
│   │       │       └── WorldMap.tsx
│   │       └── lib/
│   │           ├── supabase.ts
│   │           └── types.ts
│   │
│   └── campfire/                   # Cici animation layer
│       ├── package.json
│       └── src/
│           ├── cici.svg
│           └── animations.css
│
├── supabase/
│   └── migrations/
│       ├── 001_agents.sql
│       ├── 002_missions.sql
│       └── 003_camps.sql
│
└── docs/                           # copy all MD files here
```

---

## Config Files

### `pnpm-workspace.yaml`

```yaml
packages:
  - 'packages/*'
  - 'apps/*'
```

### `tsconfig.base.json`

```json
{
  "compilerOptions": {
    "strict": true,
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true
  }
}
```

### `.env.example`

```
# Supabase
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_KEY=

# Upstash Redis
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

# GitHub OAuth
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=

# JWT (RS256)
JWT_PRIVATE_KEY=
JWT_PUBLIC_KEY=

# Claude API (quality scoring)
ANTHROPIC_API_KEY=
```

### `packages/mcp-server/wrangler.toml`

```toml
name = "claudecamp-mcp"
main = "src/index.ts"
compatibility_date = "2025-01-01"

[vars]
ENVIRONMENT = "production"

# Secrets (set via: wrangler secret put SECRET_NAME)
# SUPABASE_URL
# SUPABASE_SERVICE_KEY
# UPSTASH_REDIS_REST_URL
# UPSTASH_REDIS_REST_TOKEN
# GITHUB_CLIENT_ID
# GITHUB_CLIENT_SECRET
# JWT_PRIVATE_KEY
```

---

## Build Order for Phase 1

Tell Claude Code to build in this exact order:

```
1. packages/mission-types/     — Zod schemas first, everything depends on these
2. packages/mcp-server/db/     — Supabase + Redis clients
3. packages/mcp-server/auth/   — JWT + GitHub OAuth
4. packages/mcp-server/tools/ping.ts          — simplest tool
5. packages/mcp-server/tools/register.ts      — needs auth
6. packages/mcp-server/tools/get-mission.ts   — needs Redis queue
7. packages/mcp-server/tools/report-result.ts — needs scoring
8. packages/mcp-server/scoring/quality.ts     — last (needs Anthropic API)
```

---

## Prompt for Claude Code

Copy this exactly:

```
Read docs/CLAUDE.md and docs/PHASE_1.md first.
Then create the monorepo structure from docs/STRUCTURE.md exactly as specified.
Use pnpm workspaces. TypeScript strict mode. Do not install dependencies yet —
just create folders, config files, and empty entry points with correct exports.
After structure is confirmed, implement Phase 1 in the build order specified
at the bottom of STRUCTURE.md.
```
