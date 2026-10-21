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
- Convex deployment — `ADMIN_SITE_URL` (the admin app origin, e.g. `http://localhost:3001` or `https://admin.qelsa.ai`)
- Convex deployment (optional) — `EMPLOYER_EMAIL_ALLOWLIST` / `EMPLOYER_EMAIL_BLOCKLIST` for employer-domain exceptions

## Admin panel

`apps/admin` is a separate Next.js app for platform administrators. It uses the
same Convex deployment and the same Better Auth identities as the web app, but
it runs on its own origin so the admin session cookie is scoped separately.

Only a user whose app row has `role === "admin"` can use it. The check runs in
three places:

- `apps/admin` route guard — keeps non-admins out of the UI.
- `convex/admin.ts` — every query and mutation re-checks the role server side.
- `convex/lib/customFunctions.ts` — the shared `adminQuery` / `adminMutation` wrappers.

Because the admin app is a different origin, set its origin on the Convex
deployment. This both trusts the origin for Better Auth and enables the
admin-only auth route gate:

```bash
npx convex env set ADMIN_SITE_URL "https://admin.qelsa.ai"
```

The browser-side admin auth client always calls the admin app's own
`/api/auth` proxy, regardless of `NEXT_PUBLIC_SITE_URL`, and that proxy stamps
an admin-flow header. The Convex auth hook checks the header as well as
`ADMIN_SITE_URL`, so a missing or stale site URL cannot turn the admin login
into a normal public OTP endpoint. Set `NEXT_PUBLIC_SITE_URL` on the admin
service to the same admin origin anyway; it is used as the server-side
fallback.

From `apps/admin`, set `NEXT_PUBLIC_SITE_URL` to the admin origin (for example
`http://localhost:3001` locally). The web app links to it via
`NEXT_PUBLIC_ADMIN_APP_URL`.

To promote a user to admin, set `role: "admin"` on their row in the `users`
table (for example from the Convex dashboard).

## Employer authentication

Candidates sign in at `/auth`. Employers use the separate `/employer/auth`
screen, which supports Google and email OTP but rejects consumer and disposable
email domains.

The policy is enforced in the backend, not only in the form:

- `apps/web/src/app/api/employer-auth/[...all]/route.ts` forwards the employer
  flow through Better Auth with an employer-flow header.
- `packages/backend/convex/auth.ts` rejects personal/disposable domains for that
  flow before an OTP is sent or a password/OTP session is created.
- Every mutation that grants the recruiter role (`users.setAccountType`,
  `onboarding.setAccountTypeAndResetOnboarding`, and
  `onboarding.completeHrOnboarding`) calls `assertEmployerEmail`.
- `users.updateProfile` cannot change `account_type`; it was removed from the
  profile patch allowlist to prevent role escalation.

`EMPLOYER_EMAIL_ALLOWLIST` is a comma-separated list of exact emails or domains
that should bypass the policy for legacy/test accounts. `EMPLOYER_EMAIL_BLOCKLIST`
adds domains that must be rejected. Both are optional and live on the Convex
deployment.

Google OAuth reveals the email only after the callback, so the employer page
checks that address before granting recruiter access; the recruiter role itself
is still server-gated. OTP/password employer sign-in is rejected at the auth
endpoint before a session is created.

This is a policy gate, not proof of employment. A user can still own a domain
that is not a real company. If you need a stronger guarantee, add DNS/domain
verification or an admin approval step for new employer domains.

## Billing and subscriptions

Qelsa Pro is billed through Dodo Payments using the official
`@dodopayments/convex` component. The app stores its own read model for
subscription state and entitlements; Dodo webhooks are authoritative.

The pricing page is `/pricing`, and subscription management is in `/settings`
(Billing). Users can choose monthly or yearly billing, switch interval, cancel
at period end, resume a subscription, and open the Dodo customer portal.

Set these on the Convex deployment:

```bash
npx convex env set DODO_PAYMENTS_API_KEY <api-key>
npx convex env set DODO_PAYMENTS_ENVIRONMENT test_mode
npx convex env set DODO_PAYMENTS_WEBHOOK_SECRET <webhook-secret>
npx convex env set DODO_PRODUCT_PRO_MONTHLY <monthly-product-id>
npx convex env set DODO_PRODUCT_PRO_YEARLY <yearly-product-id>
```

Optional display metadata; keep it aligned with the Dodo products:

```bash
npx convex env set DODO_PRO_MONTHLY_PRICE 499
npx convex env set DODO_PRO_YEARLY_PRICE 4999
npx convex env set DODO_PRICE_CURRENCY INR
```

Set `SITE_URL` to the public web origin so checkout returns to the right app.
In Dodo, register this webhook URL (the Convex **site** URL, not the cloud URL):

```text
https://<deployment>.convex.site/dodopayments-webhook
```

Subscribe it to subscription lifecycle events, including active, renewed,
plan changed, on hold, cancelled, expired, updated, paused, and unpaused.
Webhook signature verification is handled by the component; do not implement a
second unverified webhook route.

Prices shown on `/pricing` are display metadata. Dodo products determine the
actual charge, currency, tax, and payment methods. Use `test_mode` and test
products locally; switch both the environment and product IDs together for
live mode.

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
