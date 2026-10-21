/**
 * Only allow same-origin, in-app paths for post-auth redirects.
 *
 * Returning to /auth or /onboarding would loop back into the flow, so those
 * routes are intentionally rejected.
 */
export function safeReturnUrl(value: string | null | undefined): string | undefined {
  if (!value) return undefined;
  if (!value.startsWith("/") || value.startsWith("//") || value.includes("\\")) return undefined;

  const pathname = (value.split(/[?#]/)[0] ?? "").replace(/\/+$/, "") || "/";
  if (pathname === "/auth" || pathname === "/employer/auth" || pathname === "/onboarding") return undefined;

  return value;
}
