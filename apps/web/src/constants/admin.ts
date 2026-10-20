/**
 * Where the standalone admin panel lives.
 *
 * The admin app runs on its own origin so its session cookie stays scoped to
 * admins only. Override it per environment with NEXT_PUBLIC_ADMIN_APP_URL.
 */
export const ADMIN_APP_URL =
  process.env.NEXT_PUBLIC_ADMIN_APP_URL ?? "http://localhost:3001";
