# Qelsa

pnpm workspace: Next.js web app plus a shared Convex backend. Admin and Expo apps can be added under `apps/` later and import `@qelsa/backend`.

```
apps/web              Next.js
packages/backend      Convex (schema, functions, auth)
```

## Setup

```bash
pnpm install
```

## Develop

```bash
pnpm dev
```

Runs Convex (`packages/backend`) and Next.js (`apps/web`) together.

- Web: http://localhost:3000
- Convex only: `pnpm dev:server`
- Next only: `pnpm dev:web`

Env:

- `packages/backend/.env.local` — `CONVEX_DEPLOYMENT`
- `apps/web/.env.local` — `NEXT_PUBLIC_CONVEX_URL`, `NEXT_PUBLIC_CONVEX_SITE_URL`, `NEXT_PUBLIC_SITE_URL`

## Email OTP

Convex env that must be set on the deployment: `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_EMAIL_API_TOKEN` (Email Sending: Edit), and `CLOUDFLARE_EMAIL_FROM`.

Obtain them in the [Cloudflare dashboard](https://dash.cloudflare.com/):

- **`CLOUDFLARE_ACCOUNT_ID`** — press `CMD/CTRL + K`, search **Copy account ID**, and copy. Or open any domain **Overview**, scroll to **API**, and copy **Account ID**. Also on **Workers & Pages** under **Account Details**.
- **`CLOUDFLARE_EMAIL_API_TOKEN`** — [My Profile → API Tokens](https://dash.cloudflare.com/profile/api-tokens) (or **Manage Account → API Tokens** for an account-owned token) → **Create Token** → **Custom token**. Permission: **Account** → **Email Sending** → **Edit**. Copy the secret once; it is shown only at creation.
- **`CLOUDFLARE_EMAIL_FROM`** — [Compute → Email Service → Email Sending](https://dash.cloudflare.com/?to=/:account/email-service/sending) → **Onboard Domain**. Use an address on that onboarded domain, e.g. `Qelsa <no-reply@yourdomain.com>`.

Docs: [find account ID](https://developers.cloudflare.com/fundamentals/account/find-account-and-zone-ids/), [create API token](https://developers.cloudflare.com/fundamentals/api/get-started/create-token/), [onboard a sending domain](https://developers.cloudflare.com/email-service/configuration/domains/).

From `packages/backend`:

```bash
npx convex env set CLOUDFLARE_ACCOUNT_ID <account-id>
npx convex env set CLOUDFLARE_EMAIL_API_TOKEN <token>
npx convex env set CLOUDFLARE_EMAIL_FROM "Qelsa <no-reply@your-verified-domain>"
```

Without these, OTP codes are printed in the Convex backend logs instead of being emailed.
