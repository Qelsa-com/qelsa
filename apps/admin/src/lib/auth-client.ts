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
  baseURL: process.env.NEXT_PUBLIC_SITE_URL,
  plugins: [convexClient(), emailOTPClient()],
  sessionOptions: {
    refetchOnWindowFocus: false,
  },
});