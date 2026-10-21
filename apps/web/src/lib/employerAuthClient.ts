"use client";

import { convexClient } from "@convex-dev/better-auth/client/plugins";
import { emailOTPClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

/**
 * Employer auth goes through its own proxy so the backend can distinguish the
 * employer flow from candidate sign-in. The proxy also stamps the request
 * header, so a direct call to /api/auth cannot masquerade as employer auth.
 */
export const employerAuthClient = createAuthClient({
  basePath: "/api/employer-auth",
  plugins: [convexClient(), emailOTPClient()],
  fetchOptions: {
    headers: {
      "x-qelsa-auth-flow": "employer",
    },
  },
  sessionOptions: {
    refetchOnWindowFocus: false,
  },
});
