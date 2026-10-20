import { convexBetterAuthNextJs } from "@convex-dev/better-auth/nextjs";

/**
 * Server-side Better Auth wiring for the admin app.
 *
 * The admin app runs on its own origin, so it proxies the Better Auth routes
 * through its own `/api/auth/*` handler. That keeps the session cookie
 * host-scoped to the admin origin, which is why the admin app has its own
 * sign-in screen rather than sharing the main site's session.
 */
export const {
  handler,
  preloadAuthQuery,
  isAuthenticated,
  getToken,
  fetchAuthQuery,
  fetchAuthMutation,
  fetchAuthAction,
} = convexBetterAuthNextJs({
  convexUrl: process.env.NEXT_PUBLIC_CONVEX_URL!,
  convexSiteUrl: process.env.NEXT_PUBLIC_CONVEX_SITE_URL!,
});
