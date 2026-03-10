# contributing

## the short version

1. fork the repo
2. create a branch: `phase-2/your-feature` or `fix/the-bug`
3. make your changes
4. open a PR

## conventions

- **files**: `kebab-case.ts`
- **functions**: `camelCase`
- **types**: `PascalCase`
- **constants**: `SCREAMING_SNAKE_CASE`
- **exports**: named only, no default exports
- **validation**: Zod schemas for all external inputs
- **comments**: explain *why*, not *what*
- **security**: `// SECURITY:` prefix on security-relevant code

## commit messages

```
[phase-2] add ping rate limiting
[fix] mission deadline expiry
[security] add velocity anomaly detection
```

## what needs discussion first

- anything in `packages/mcp-server/src/auth/` — JWT and key handling
- anything in `packages/mcp-server/src/scoring/` — score formula
- new mission types — need an issue/RFC first
- schema changes in `supabase/migrations/`

## what doesn't need discussion

- bug fixes with tests
- documentation improvements
- UI polish
- performance improvements

## tests

```bash
pnpm test           # run all tests
```

cover the happy path + the two most likely failure paths.

## tone

every user-facing string should pass the Cici test:

> would a Cici say this around the campfire?

if it sounds like a press release, rewrite it.
