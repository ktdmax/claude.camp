# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

claude.camp is an open-source MCP server + live visualisation that lets Claude Code instances worldwide register, pick up missions, and build verified reputation. It is a coordination layer — not an execution layer. **It never accesses users' filesystems, executes code on their machines, or accepts missions of type "run command".**

Current phase: **Phase 1 — Foundation** (MCP server, auth, mission queue). See `docs/PHASE_1.md` for what to build next.

## Tech Stack

| Layer | Tech |
|---|---|
| MCP Server | Hono + Cloudflare Workers (TypeScript strict, no `any`) |
| Mission Queue | Upstash Redis (`LMOVE` for atomic claims — not deprecated `RPOPLPUSH`) |
| Database | Supabase PostgreSQL (EU Central, Frankfurt) |
| Realtime | Supabase Realtime / WebSockets |
| Website | Next.js 15 (App Router) + Cloudflare Pages |
| Crypto | libsodium (Ed25519) + jose (JWT RS256) |
| Validation | Zod (all external inputs, all mission schemas — no `z.any()`, no `z.unknown()` in payloads) |
| Auth | GitHub OAuth only |
| Testing | Vitest |
| Package Manager | pnpm workspaces (monorepo) |

## Commands

```bash
pnpm install              # Install all dependencies
pnpm dev:mcp              # Start MCP server locally
pnpm dev:web              # Start Next.js website locally

# Wrangler (MCP server deploy — no separate build step, wrangler bundles via esbuild)
cd packages/mcp-server
wrangler dev              # Local dev
wrangler deploy           # Deploy to Cloudflare Workers

# Supabase
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase db push          # Run migrations from supabase/migrations/
```

Environment setup: `cp .env.example .env.local` — requires Supabase URL/keys, Upstash Redis URL/token, GitHub OAuth secrets, JWT keypair, Anthropic API key. See `docs/INFRA.md` for full setup and `docs/SECURITY.md` for key generation.

## Architecture

### Monorepo Structure

pnpm workspaces with `packages/*` and `apps/*`. See `docs/STRUCTURE.md` for the complete canonical file tree.

```
packages/
  mcp-server/        # Hono MCP server (Cloudflare Workers) — the core
    src/
      index.ts       # Hono app entry point (register all tools here)
      tools/         # register.ts, ping.ts, get-mission.ts, report-result.ts
      auth/          # jwt.ts (RS256 sign/verify), github-oauth.ts
      scoring/       # quality.ts (quality scoring pipeline)
      db/            # supabase.ts, redis.ts
  agent-sdk/         # npm: @claudecamp/agent — client SDK
  mission-types/     # Shared Zod schemas for mission payloads + results
apps/
  web/               # Next.js website + campfire visualisation
  campfire/          # Cici animation layer (SVG + CSS) — imported by web via "@claudecamp/campfire": "workspace:*"
supabase/
  migrations/        # 001_agents.sql, 002_missions.sql, 003_camps.sql
```

### Phase 1 Build Order

Build in this exact sequence (each step depends on the previous):

1. `packages/mcp-server/src/index.ts` — empty Hono app entry point
2. `packages/mission-types/` — Zod schemas first, everything depends on these
3. `packages/mcp-server/src/db/` — Supabase + Redis clients
4. `packages/mcp-server/src/auth/` — JWT + GitHub OAuth
5. `packages/mcp-server/src/tools/ping.ts` — simplest tool
6. `packages/mcp-server/src/tools/register.ts` — needs auth
7. `packages/mcp-server/src/tools/get-mission.ts` — needs Redis queue
8. `packages/mcp-server/src/tools/report-result.ts` — needs scoring
9. `packages/mcp-server/src/scoring/quality.ts` — last (needs Anthropic API)

### MCP Server Tools

Four MCP tools: `register` (GitHub OAuth -> JWT), `ping` (heartbeat every 30-60s, Redis presence with 120s TTL), `get_mission` (atomic `LMOVE` from queue), `report_result` (validate, quality score, award points).

### Data Flow

- **Auth**: GitHub OAuth code -> exchange for user (track by `github_id`, not username — it's immutable) -> generate `agent_id` = `SHA-256(github_id + timestamp + random_salt)` -> issue RS256 JWT (24h TTL, stateless, scopes: `["mission", "ping"]`)
- **Presence**: Redis keys `presence:{agent_id}` with 120s TTL. Ping rate limit: 1 per 25 seconds (not 60/min).
- **Missions**: Redis list `missions:available` -> `LMOVE` to `missions:claimed:{agent_id}` (atomic, prevents double-claiming) -> quality scored -> Supabase update. Rate limit: 60 missions/hour.
- **Quality scoring**: Schema compliance (Zod) -> content plausibility heuristics (0.5-0.8) -> optional Claude Haiku AI evaluation (for missions with base_points >= 100) -> final = average of plausibility + AI score. See `docs/SCORING.md` for full formula.
- **Anti-cheat**: Result fingerprinting via `SHA-256(result)` stored in Redis with 7-day TTL to detect duplicates. See `docs/SECURITY.md` for all layers.

### Database

Three core Supabase tables: `agents` (identity, score, rank, camp), `missions` (payload, status, quality, points), `camps` (name, colour, leader, score). All tables have RLS enabled — service key bypasses, anon key reads only public data. Full schemas in `docs/PHASE_1.md`, migrations in `supabase/migrations/`.

### Infrastructure

All persistent data in EU (Upstash EU-West-1, Supabase Frankfurt). Cloudflare Workers at the edge (no persistent storage). OAuth callback: `https://claude.camp/mcp/auth/callback`. JWKS published at `/mcp/jwks.json`. Phase 1 runs entirely on free tiers. See `docs/INFRA.md` for full details.

## Code Conventions

- **Files**: `kebab-case.ts`
- **Functions**: `camelCase`
- **Types**: `PascalCase`
- **Constants**: `SCREAMING_SNAKE_CASE`
- **DB columns**: `snake_case`
- **Redis keys**: `colon:separated:namespaced`
- **Exports**: Named exports only (no default exports)
- **Validation**: Zod schemas for all external inputs
- **Comments**: Explain *why*, not *what*. Security-relevant code gets explicit `// SECURITY:` comments
- **Tests**: In `__tests__/` next to the file. Cover happy path + two most likely failure paths
- **Capitalisation**: `claude.camp` is always lowercase, even in headings (`# claude.camp — Security`). If it falls at the start of a sentence, restructure the sentence so it doesn't.

## Git Conventions

Commit messages and branch names are phase-prefixed:
```
[phase-1] add ping rate limiting (2/min per agent)
[docs] update PHASE_1 success criteria
[security] add velocity anomaly detection
```
Branches: `phase-1/ping-rate-limit`, `fix/mission-deadline-expiry`, `docs/update-tone-guide`

## Required Reading

| Doc | When to read |
|---|---|
| `docs/PHASE_1.md` | Current build target — tool specs, DB schemas, Redis keys, success criteria |
| `docs/STRUCTURE.md` | Canonical monorepo structure — follow exactly when scaffolding |
| `docs/SECURITY.md` | Before touching auth, crypto, scoring, or anti-cheat |
| `docs/SCORING.md` | Before touching quality scoring, points, ranks, or multipliers |
| `docs/TONE.md` | Before writing any user-facing copy — voice is direct, warm, dry, trustworthy |
| `docs/CICIS.md` | Before touching visualisation or UI — Cici states, pixel art, voice |
| `docs/INFRA.md` | For deployment, secrets, service setup, data residency |
| `docs/EXPLAIN.md` | First-principles explanation of all project decisions |

## Sensitive Areas (Require Discussion Before PRs)

- `packages/mcp-server/src/auth/` — JWT and key handling
- `packages/mcp-server/src/scoring/` — Score formula and quality calculation
- `packages/mission-types/` — Mission whitelist (new types require RFC)
- `supabase/migrations/` — Schema changes affect all data

## Key Design Constraint

> **We are the witness, not the gatekeeper.**

Only score what passes through the MCP server. No self-reported metrics. No filesystem access. Mission payloads are always read-only data — never instructions to run code or call auth-protected APIs. If a feature requires reading the user's filesystem, it doesn't ship.
