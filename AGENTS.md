# Qelsa

pnpm + Turborepo monorepo. `apps/web` is a Next.js 16 app (Pages Router under `apps/web/src/pages`, plus one App-Router auth API route). `apps/admin` is a separate Next.js 16 App-Router app for platform administrators. `packages/backend` is a Convex backend (schema, functions, crons) with Better Auth, an AI agent, and R2 file storage components. Both apps import `@qelsa/backend`.

See `README.md` for setup/dev commands.

## Principles

Make the best decision that will elevate all three: the user experience (UX), developer experience (DX), and agent experience (AX) always, without breaking anything.

## Admin app

`apps/admin` is admin-only. It shares the Convex deployment and Better Auth identities with `apps/web` but runs on its own origin, so its session cookie is scoped separately. Access is gated by `users.role === "admin"`.

- Every admin data function lives in `packages/backend/convex/admin.ts` and uses the `adminQuery` / `adminMutation` wrappers from `convex/lib/customFunctions.ts`, which re-check the role server side. Never expose privileged data through a plain `query` / `mutation`.
- The admin app runs on its own origin, so the deployment needs `ADMIN_SITE_URL` and, when supplied, that origin in `TRUSTED_ORIGINS`.
- Admin auth is intentionally narrow: the admin origin may only use the session/sign-in routes, only active admins can establish a session, and non-admin emails never receive admin-origin OTPs. The admin proxy stamps `x-qelsa-admin-auth: 1`, and the Convex hook trusts that header as well as `ADMIN_SITE_URL` — stale origin config must never silently bypass the gate.
- Dashboard totals come from the `admin_stats` counter table, updated in the same mutation as the source write (see `convex/lib/adminStats.ts`). Do not replace those counters with `.collect().length` scans.
- Admin mutations write an `admin_audit_log` row so every privileged action stays attributable.
- Plan limits and benefit copy are editable at `/plans` and stored in `plan_configs`. Missing rows fall back to `convex/lib/planConfig.ts`; entitlement checks read the row live. Benefit lines support `{{agent_benefit}}`, `{{agent_limit}}`, `{{application_benefit}}`, and `{{application_limit}}` tokens so copy stays in sync with the configured limits.
- Suspended app users are rejected by `getAppUser()` and are treated as signed out by optional auth reads. Do not add a new `authed*` path that bypasses that check.

## Public job boards

The admin "Public job boards" page (`apps/admin/src/app/(admin)/boards/page.tsx`) ingests Greenhouse / Lever / Ashby boards. Boards are keyed on `(provider, subdomain)` — the same slug under a different ATS is a different board.

- `apps/admin/src/components/ats/boardCatalog.ts` powers the "Company" picker, grouped by ATS and by `india` / `global`. It is hand-maintained data, not live discovery: slugs rot as companies drop boards or switch ATS.
- After editing it, run `pnpm check:board-catalog` to probe every slug; `--fix` strips dead entries.
- The picker only offers boards for the currently selected ATS, drops any board already ingested for that ATS, and still accepts a manually typed slug.
- `packages/backend/convex/atsProviders.ts` owns the vendor fetchers. `fetchLever` tries the US host then `api.eu.lever.co`, because Lever serves EU boards from a host that 404s on `.com`.

## ATS sync cadence

Employer integrations and public boards pull through `atsSync.syncIntegration`; the cron only takes rows due against `ATS_SYNC_INTERVAL_MS` (5 days).

- `atsIntegrations.requestSync` backs the employer "Sync now" button, mirroring the admin `retryPublicBoard`.
- Never pass `force: true` from `requestSync`. `force` skips the admin sync kill-switch — right for an admin retry, wrong for an employer. `requestSync` checks the switch itself so the employer gets a clear error instead of a silent no-op.
- `MANUAL_SYNC_MIN_INTERVAL_MS` (5 min) is a cost guard: a manual sync re-runs the full pull plus LLM skill extraction. Measure it from the last **attempt** (`last_synced_at` on success, `error_detected_at` on failure) — measuring from success alone locks out an employer whose sync just failed.

## Employer authentication

`/auth` is the candidate flow. Employers use `/employer/auth`, which supports Google and email OTP but rejects consumer/disposable domains.

- The employer screen uses `/api/employer-auth/[...all]`, which rewrites to the normal Better Auth handler and stamps `x-qelsa-auth-flow: employer`.
- `packages/backend/convex/auth.ts` enforces the work-email policy before sending an OTP or accepting a password/OTP sign-in.
- `packages/backend/convex/lib/employerEmail.ts` owns the domain policy and the optional `EMPLOYER_EMAIL_ALLOWLIST` / `EMPLOYER_EMAIL_BLOCKLIST` overrides.
- The recruiter role may only be granted through `users.setAccountType`, `onboarding.setAccountTypeAndResetOnboarding`, or `onboarding.completeHrOnboarding`; each calls `assertEmployerEmail`.
- Admin accounts are exempt from the legacy-recruiter email check so an admin seeded with a personal email can still sign in.
- Never add `account_type`, `hiring_role`, `active_page_id`, or `onboarding_completed` back to `users.updateProfile`'s patch allowlist — that lets a candidate self-promote to recruiter.

Google OAuth reveals the address only after the callback, so the employer screen checks it before granting recruiter access; the role stays server-gated. OTP/password employer sign-in is rejected at the auth endpoint. Work-email plus OTP proves control of an inbox, not that the domain belongs to a real employer — domain/DNS verification or admin approval is the stronger follow-up.

## User-facing copy

Keep UI copy tight. Customer-facing pages should say more with fewer words.

Cut taglines, helper text and secondary labels. If a screen needs them to make sense, fix the layout.

- Prefer one short sentence or a 1–2 line summary per card, section, or modal.
- Do not stack multiple explanatory paragraphs on a page; move detail into the flow, a tooltip, or admin documentation.
- Avoid repeating the same idea in a heading, subtitle, and helper text.
- Labels should be direct. If the control already explains itself, do not add a second sentence for it.
- AI-generated marketing/learning summaries must stay short (roughly 120 characters for card summaries, 240 for descriptions).

## Performance is a first-pass requirement

Treat cost, latency, data growth, and external-service usage as acceptance criteria for every implementation, not cleanup for later.

- Design for at least 10× current data and traffic. If an approach needs a later rewrite to scale, it is the wrong approach now.
- Use the cheapest reliable path first: structured data and deterministic parsing before external APIs or LLMs. Run expensive work only when required — batch or schedule it, no-op when disabled or unchanged, never attach it to render/request paths.
- Keep reads and writes bounded: indexes and pagination; no growing-table scans, unbounded `.collect()`, per-row network calls, or N+1 queries.
- Add indexes, caching, deduplication, batching, and incremental processing in the initial change when the access pattern requires them.
- Store current truth, not cumulative side effects. Syncs must be idempotent: no inflated counters, duplicate records, wiped richer data, or recomputed unchanged rows.
- Skip work already done: stable fingerprints, timestamps, status fields, idempotency keys, cached results.
- On the frontend, request only what the view needs, keep identities stable, and avoid redundant fetching, subscriptions, and rerenders.

Before finishing, check the hot path, query bounds, repeated work, external/LLM cost, idempotency, and behaviour at 10× scale. If performance depends on a future optimization, implement that optimization now.

## Running the app

Two setups work; use whichever matches the machine you're on.

### This checkout (cloud Convex)

`.env.local` already points at a cloud deployment.

1. Web (`apps/web`): `pnpm dev` → `http://localhost:3000`. Its `dev` script kills anything already on port 3000 first.
2. Admin (`apps/admin`): `pnpm dev` → `http://localhost:3001`.

`pnpm dev` from the root runs both via Turbo; dedicated terminals give clearer logs and let you restart one service.

### Cursor Cloud / fresh VM (anonymous local Convex, no login/account needed)

The startup update script runs `pnpm install --frozen-lockfile`. Everything below is about running/testing, which the update script intentionally does not do.

On a fresh VM there is no cloud Convex deployment. Run Convex in anonymous mode, which spins up a **local** backend. `CONVEX_AGENT_MODE=anonymous` is required — without it `convex dev` tries to log in interactively and hangs.

Start the two services (use separate long-lived terminals, e.g. tmux):

1. Backend (from `packages/backend`): `CONVEX_AGENT_MODE=anonymous npx convex dev`
   - Serves the local deployment at `http://127.0.0.1:3210` (API) and `http://127.0.0.1:3211` (HTTP/site actions). It auto-writes `packages/backend/.env.local` (`CONVEX_DEPLOYMENT=anonymous:anonymous-agent`, `CONVEX_URL`, `CONVEX_SITE_URL`). Local deployment data lives in `packages/backend/.convex/` and is gitignored/ephemeral, so it re-provisions on each fresh VM.
2. Web (from `apps/web`): `pnpm dev` (Next.js on `http://localhost:3000`; its `dev` script kills anything already on port 3000 first).

`CONVEX_AGENT_MODE=anonymous pnpm dev` from the repo root also works (Turbo runs both), but two dedicated terminals give clearer logs and let you restart one service without the other.

#### Required env file (gitignored — create if missing)

`apps/web/.env.local` must point at the local Convex deployment, or the web app crashes (URLs are non-null asserted):

```
NEXT_PUBLIC_CONVEX_URL=http://127.0.0.1:3210
NEXT_PUBLIC_CONVEX_SITE_URL=http://127.0.0.1:3211
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

#### Seed catalog data

Reference/catalog data (degrees, skills, cities, etc.) is not present on a fresh local deployment. Seed it once after the backend is up:
`CONVEX_AGENT_MODE=anonymous npx convex run seed:seedAll '{}'` (from `packages/backend`).

### Signing in during testing

Auth is email + password and email OTP (Better Auth). **No email provider is wired** — the OTP is only `console.log`ed (`[emailOTP] <email>: <code>`), so read it from the Convex function logs (`convex dev` terminal on a VM, or the Convex dashboard for a cloud deployment). Candidates land on My Space (`/`); employer accounts become recruiters and still go through employer onboarding. Password signup also works (`requireEmailVerification: false`).

### Optional integrations (app degrades gracefully without them)

Set on the Convex deployment with `npx convex env set <NAME> <value>` (from `packages/backend`) only if you need the feature:

- `OPENROUTER_API_KEY` — AI job matching, skill extraction, summaries, cover letters. Optional `AI_AGENT_MODEL` (default `openai/gpt-4o-mini`) and `AI_AGENT_REASONING_EFFORT` (`minimal`/`low`/`medium`/`high`/`xhigh`; `off` disables reasoning).
- `EXA_API_KEY` or `TAVILY_API_KEY` — external web search for the candidate Agent when Qelsa has no in-house course or answer. If neither is set it falls back to OpenRouter's web plugin; `AI_WEB_SEARCH_MODEL` controls that fallback.
- Cloudflare R2 credentials — resume/profile-image uploads (the `@convex-dev/r2` component).
- `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET` — Google social login (disabled unless the secret is set).
- `EXTERNAL_API_URL` — hourly job-scraper cron (no-ops when unset).
- `ATS_SYNC_ENABLED` — `true`/`false` to force ATS and public-board sync on or off. Unset: off on local Convex (`127.0.0.1` / localhost), on in the cloud. Admins can also toggle sync on the public-boards page unless this is set.
- `VAPID_PUBLIC_KEY` + `VAPID_PRIVATE_KEY` — browser push for saved-search briefs. Optional `VAPID_SUBJECT` (defaults to a Qelsa mailto). Without these the Enable browser alerts control is hidden and push is skipped.
- `SITE_URL` — absolute web URL used in brief emails, autofill bookmarklets, and notification links. Falls back to `NEXT_PUBLIC_SITE_URL`, then `http://localhost:3000`.
- `EMPLOYER_EMAIL_ALLOWLIST` / `EMPLOYER_EMAIL_BLOCKLIST` — comma-separated exact emails or domains for employer-auth exceptions. Allowlist entries bypass the consumer/disposable-domain policy; blocklist entries always reject.
- `DODO_PAYMENTS_API_KEY`, `DODO_PAYMENTS_ENVIRONMENT` (`test_mode`/`live_mode`), `DODO_PAYMENTS_WEBHOOK_SECRET` — Dodo checkout, customer portal, and signed webhooks.
- `DODO_PRODUCT_PRO_MONTHLY` / `DODO_PRODUCT_PRO_YEARLY` — Pro product IDs. `DODO_PRODUCT_PLUS_MONTHLY` / `DODO_PRODUCT_PLUS_YEARLY` — Plus product IDs. Optional `DODO_PLUS_MONTHLY_PRICE`, `DODO_PLUS_YEARLY_PRICE`, `DODO_PRO_MONTHLY_PRICE`, `DODO_PRO_YEARLY_PRICE`, and `DODO_PRICE_CURRENCY` are display fallbacks only; Dodo remains authoritative.
- Email briefs reuse the Cloudflare Email Sending or Resend config in `convex/lib/email.ts`; with no provider they log to the Convex console.
- `COURSE_AFFILIATE_LINKS` — JSON object mapping catalog `course_id` values to affiliate URLs, e.g. `{"python-py4e":"https://..."}`. Only configured links are labeled Affiliate; ranking never uses commission.
- `CURRICULUM_AGENT_ENABLED` — `true` lets the weekly interview-prep curriculum agent build and auto-publish role tracks (default off). Optional `CURRICULUM_AGENT_MAX_TRACKS` caps each run (1–5, default 2). Admins can also run it from the admin Interview prep page.

## Pre-existing lint/type failures (NOT environment problems)

These fail on the current tree regardless of setup; do not treat them as regressions:

- `pnpm lint` fails in both packages: `apps/web` hits a FlatCompat "circular structure to JSON" error; `packages/backend` reports a TypeScript "Parsing error: Unexpected token" because the Convex ESLint flat config isn't registering a TS parser.
- `pnpm check-types` fails in `packages/backend` (genuine TS errors in the Convex functions). `apps/web` type-checks cleanly.
- `next dev` does not type-check-block, so the web app runs fine despite the backend type errors.

`next dev` rewrites the `nextjs-agent-rules` block in `apps/web/AGENTS.md` on startup; committing that regenerated block keeps the tree clean.
