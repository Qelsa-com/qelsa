# Qelsa

pnpm workspace: Next.js web app, a standalone admin panel, plus a shared Convex backend. All apps import `@qelsa/backend`.

```
apps/web              Next.js (candidate + recruiter app)
apps/admin            Next.js (admin panel, admin role only)
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
- Admin only: `pnpm dev:admin`

Env:

- `packages/backend/.env.local` — `CONVEX_DEPLOYMENT`
- `apps/web/.env.local` — `NEXT_PUBLIC_CONVEX_URL`, `NEXT_PUBLIC_CONVEX_SITE_URL`, `NEXT_PUBLIC_SITE_URL`, optional `NEXT_PUBLIC_ADMIN_APP_URL`
- `apps/admin/.env.local` — `NEXT_PUBLIC_CONVEX_URL`, `NEXT_PUBLIC_CONVEX_SITE_URL`, `CONVEX_SITE_URL`, `NEXT_PUBLIC_SITE_URL`

## Admin panel

`apps/admin` is a separate Next.js app for platform administrators. It uses the
same Convex deployment and the same Better Auth identities as the web app, but
it runs on its own origin so the admin session cookie is scoped separately.

Only a user whose app row has `role === "admin"` can use it. The check runs in
three places:

- `apps/admin` route guard — keeps non-admins out of the UI.
- `convex/admin.ts` — every query and mutation re-checks the role server side.
- `convex/lib/customFunctions.ts` — the shared `adminQuery` / `adminMutation` wrappers.

Because the admin app is a different origin, add it to the Convex deployment's
trusted origins so Better Auth accepts its sign-in requests:

```bash
npx convex env set TRUSTED_ORIGINS "https://admin.qelsa.ai"
```

From `apps/admin`, set `NEXT_PUBLIC_SITE_URL` to the admin origin (for example
`http://localhost:3001` locally). The web app links to it via
`NEXT_PUBLIC_ADMIN_APP_URL`.

To promote a user to admin, set `role: "admin"` on their row in the `users`
table (for example from the Convex dashboard).

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
