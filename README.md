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
