# Qelsa

pnpm + Turborepo monorepo. `apps/web` is a Next.js 16 app (Pages Router under `apps/web/src/pages`, plus one App-Router auth API route). `packages/backend` is a Convex backend (schema, functions, crons) with Better Auth, an AI agent, and R2 file storage components. The web app imports `@qelsa/backend`.

See `README.md` for the canonical setup/dev commands. Package scripts live in the root `package.json`, `apps/web/package.json`, and `packages/backend/package.json`.

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

### Pre-existing lint/type failures (NOT environment problems)

On the current tree these fail regardless of environment setup; don't treat them as setup regressions:
- `pnpm lint` fails in both packages: `apps/web` hits an `@eslint/eslintrc` FlatCompat "circular structure to JSON" error; `packages/backend` reports TypeScript "Parsing error: Unexpected token" (the Convex ESLint flat config isn't registering a TS parser).
- `pnpm check-types` fails in `packages/backend` (genuine TS errors in the Convex functions). `apps/web` type-checks cleanly (`cd apps/web && pnpm check-types`).
- `next dev` does not type-check-block, so the web app runs fine despite the backend type errors.

`next dev` rewrites the `nextjs-agent-rules` block in `apps/web/AGENTS.md` on startup; committing that regenerated block keeps the tree clean.
