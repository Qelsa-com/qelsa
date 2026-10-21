"use client";

import { createAuthClient } from "better-auth/react";
import { convexClient } from "@convex-dev/better-auth/client/plugins";
import { emailOTPClient } from "better-auth/client/plugins";

/**
 * Browser-side Better Auth client for the admin app.
 *
 * `baseURL` points at the admin origin so the session cookie is scoped to
 * this app. The Convex plugin mints the JWT that the Convex client uses for
 * authenticated queries and mutations.
 */
export const authClient = createAuthClient({
  // Always talk to the admin app's own /api/auth proxy. A stale or mistaken
  // NEXT_PUBLIC_SITE_URL must not send admin login traffic to the public web
  // auth endpoint, where it would bypass the admin-only gate.
  baseURL:
    typeof window !== "undefined"
      ? window.location.origin
      : process.env.NEXT_PUBLIC_SITE_URL,
  plugins: [convexClient(), emailOTPClient()],
  sessionOptions: {
    refetchOnWindowFocus: false,
  },
});