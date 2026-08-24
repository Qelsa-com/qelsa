# Qelsa

pnpm + Turborepo monorepo. `apps/web` is a Next.js 16 app (Pages Router under `apps/web/src/pages`, plus one App-Router auth API route). `packages/backend` is a Convex backend (schema, functions, crons) with Better Auth, an AI agent, and R2 file storage components. The web app imports `@qelsa/backend`.

See `README.md` for the canonical setup/dev commands. Package scripts live in the root `package.json`, `apps/web/package.json`, and `packages/backend/package.json`.

## Performance is a first-pass requirement

Treat cost, latency, data growth, and external-service usage as acceptance criteria for every implementation—not cleanup for later.

- Design for at least 10× current data and traffic. Do not ship an approach that requires a later rewrite to scale.
- Skip work already completed: use stable fingerprints, timestamps, status fields, and idempotency keys; reuse cached or previously computed results.
- Use the cheapest reliable path first: structured data and deterministic parsing before external APIs or LLMs.
- Keep reads and writes bounded: use indexes and pagination; avoid growing-table scans, unbounded `.collect()`, per-row network calls, and N+1 queries.
- Store current truth rather than cumulative side effects. Syncs must be idempotent and must not inflate counters, duplicate records, wipe richer data, or recompute unchanged rows.
- Run expensive work only when required. Batch or schedule it, no-op when disabled or unchanged, and never attach it to render/request paths unnecessarily.
- On the frontend, request only the data the view needs, keep identities stable, and avoid redundant fetching, subscriptions, and rerenders.
- Add indexes, caching, deduplication, batching, and incremental processing in the initial change when the access pattern requires them.

Before finishing, explicitly check the hot path, query bounds, repeated work, external/LLM cost, idempotency, and behavior at 10× scale. If performance depends on a future optimization, implement that optimization now.

## Cursor Cloud specific instructions

The startup update script runs `pnpm install --frozen-lockfile`. Everything below is about running/testing, which the update script intentionally does not do.

### Running the app (Convex runs locally, no login/account needed)

There is no cloud Convex deployment. Run Convex in anonymous mode, which spins up a **local** backend. `CONVEX_AGENT_MODE=anonymous` is required — without it `convex dev` tries to log in interactively and hangs.

Start the two services (use separate long-lived terminals, e.g. tmux):

1. Backend (from `packages/backend`): `CONVEX_AGENT_MODE=anonymous npx convex dev`
   - Serves the local deployment at `http://127.0.0.1:3210` (API) and `http://127.0.0.1:3211` (HTTP/site actions). It auto-writes `packages/backend/.env.local` (`CONVEX_DEPLOYMENT=anonymous:anonymous-agent`, `CONVEX_URL`, `CONVEX_SITE_URL`). Local deployment data lives in `packages/backend/.convex/` and is gitignored/ephemeral, so it re-provisions on each fresh VM.
2. Web (from `apps/web`): `pnpm dev` (Next.js on `http://localhost:3000`; its `dev` script kills anything already on port 3000 first).

`CONVEX_AGENT_MODE=anonymous pnpm dev` from the repo root also works (Turbo runs both), but two dedicated terminals give clearer logs and let you restart one service without the other.

### Required env file (gitignored — create if missing)

`apps/web/.env.local` must point at the local Convex deployment, or the web app crashes (URLs are non-null asserted):

```
NEXT_PUBLIC_CONVEX_URL=http://127.0.0.1:3210
NEXT_PUBLIC_CONVEX_SITE_URL=http://127.0.0.1:3211
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### Seed catalog data

Reference/catalog data (degrees, skills, cities, etc.) is not present on a fresh local deployment. Seed it once after the backend is up:
`CONVEX_AGENT_MODE=anonymous npx convex run seed:seedAll '{}'` (from `packages/backend`).

### Auth / sign-in gotcha (how to log in during testing)

Auth is email + password and email OTP (Better Auth). **No email provider is wired** — the OTP is only `console.log`ed by the backend. To sign in via OTP at `/auth`, enter an email, then read the code from the Convex backend terminal (line format `[emailOTP] <email>: <code>`) and enter it. New users then pick a role (seeker/recruiter) and land on `/onboarding`. Email/password signup also works (`requireEmailVerification: false`).

### Optional integrations (app degrades gracefully without them)

Set these on the local Convex deployment with `npx convex env set <NAME> <value>` (from `packages/backend`, with `CONVEX_AGENT_MODE=anonymous`) only if you need the feature:
- `OPENROUTER_API_KEY` — AI job matching / skill extraction / summaries (otherwise those actions throw or are skipped). Optional `AI_AGENT_MODEL` (default `openai/gpt-4o-mini`).
- Cloudflare R2 credentials — resume/profile-image uploads (the `@convex-dev/r2` component).
- `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET` — Google social login (disabled unless the secret is set).
- `EXTERNAL_API_URL` — hourly job-scraper cron (cleanly no-ops when unset).
- `ATS_SYNC_ENABLED` — `true`/`false` to force ATS and public-board sync on or off for this deployment. Unset: off on local Convex (`127.0.0.1` / localhost), on in the cloud. Admins can also toggle sync on the public-boards page unless this env var is set.

### Pre-existing lint/type failures (NOT environment problems)

On the current tree these fail regardless of environment setup; don't treat them as setup regressions:
- `pnpm lint` fails in both packages: `apps/web` hits an `@eslint/eslintrc` FlatCompat "circular structure to JSON" error; `packages/backend` reports TypeScript "Parsing error: Unexpected token" (the Convex ESLint flat config isn't registering a TS parser).
- `pnpm check-types` fails in `packages/backend` (genuine TS errors in the Convex functions). `apps/web` type-checks cleanly (`cd apps/web && pnpm check-types`).
- `next dev` does not type-check-block, so the web app runs fine despite the backend type errors.

`next dev` rewrites the `nextjs-agent-rules` block in `apps/web/AGENTS.md` on startup; committing that regenerated block keeps the tree clean.
