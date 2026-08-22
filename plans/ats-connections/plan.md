# ATS Connections — Settings → Integrations

Designs: screenshots in this folder (grid + connect/oauth/gated/manage/disconnect/reconnect/success modals).

## What was built

**Backend** (`packages/backend/convex`)

- `schema.ts` → new `ats_integrations` table: provider, status (`connected | error | pending | disconnected`), auth_type (`oauth | api_key | gated`), credentials, sync toggles, sync stats, error fields. Indexed `by_user`, `by_user_and_provider`.
- `atsIntegrations.ts` → `list`, `connectApiKey`, `connectOAuth` (placeholder, no real OAuth redirect yet), `reconnect`, `disconnect` (keeps config), `remove`, `updateSyncSettings`, `requestAccess`. Secrets are never returned to the client (`has_api_key` flag instead).

**Frontend** (`apps/web/src`)

- `pages/settings/integrations.tsx` → route `/settings/integrations`.
- `components/settings/ats/catalog.ts` → provider metadata (9 ATSs), types, time helpers.
- `components/settings/ats/AtsIntegrationsPage.tsx` → card grid + dialog state machine.
- `components/settings/ats/IntegrationDialogs.tsx` → API-key connect, OAuth connect, request-access (gated), manage (toggles + danger zone), disconnect, reconnect-with-key, error-details, success dialogs.
- `features/api/atsIntegrationsApi.ts` → Convex hooks.

## Provider model

| Auth type | Providers                                    | Connect flow                        |
| --------- | -------------------------------------------- | ----------------------------------- |
| `oauth`   | Zoho Recruit, Lever, Keka, BambooHR, Workday | Info dialog → connect (placeholder) |
| `api_key` | Greenhouse, Ashby                            | API key + subdomain dialog          |
| `gated`   | Darwinbox, iCIMS                             | Request access → `pending`          |

## Sync engine (built)

- `atsSync.ts` → `syncIntegration` action fetches jobs from Greenhouse/Lever **public board JSON APIs** (no scraping, no key needed for reads) and normalizes them; `syncAllDue` action re-syncs all due integrations.
- `jobs.storeAtsJobs` → internal mutation deduping by `external_id`, sets `resource: ats:<provider>`, `status: open`, feeds new jobs into `jobSkillsEnrich.enrichBatch` for AI skill extraction.
- `crons.ts` → hourly interval runs `atsSync.syncAllDue` (integrations sync every 6h via `next_sync_at`).
- Connect/reconnect mutations in `atsIntegrations.ts` schedule an immediate first sync via `runAfter(0, …)`.
- Verified live: connecting Greenhouse with board `airbnb` pulled 189 jobs; they appear in Jobs → All Jobs.

## Follow-ups (not built yet)

- Real OAuth flows (redirect + token exchange + refresh) per provider — Zoho/Keka/BambooHR/Workday currently connect as placeholders and sync nothing.
- Candidate push back into the ATS (write direction).
- Move `api_key` storage to an encrypted vault / env-scoped secret store.
- Webhook endpoints (convex `http.ts`) for ATS push events.
- Ashby board fetcher (public API exists, not wired).
