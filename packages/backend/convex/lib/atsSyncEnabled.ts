/** Explicit Convex env override. Unset means fall through to the admin toggle / default. */
export function parseAtsSyncEnv(): boolean | undefined {
  const raw = process.env.ATS_SYNC_ENABLED?.trim().toLowerCase();
  if (raw === "false" || raw === "0" || raw === "off" || raw === "no") return false;
  if (raw === "true" || raw === "1" || raw === "on" || raw === "yes") return true;
  return undefined;
}

/** Local Convex is off until opted in; cloud deployments stay on. */
export function defaultAtsSyncEnabled() {
  const site = process.env.CONVEX_SITE_URL ?? process.env.CONVEX_CLOUD_URL ?? "";
  if (!site) return true;
  try {
    const { hostname } = new URL(site);
    if (hostname === "localhost" || hostname === "127.0.0.1") return false;
  } catch {
    if (site.includes("127.0.0.1") || site.includes("localhost")) return false;
  }
  return true;
}

export function resolveAtsSyncEnabled(stored: boolean | undefined) {
  const env = parseAtsSyncEnv();
  if (env !== undefined) return { enabled: env, locked: true };
  if (stored !== undefined) return { enabled: stored, locked: false };
  return { enabled: defaultAtsSyncEnabled(), locked: false };
}
