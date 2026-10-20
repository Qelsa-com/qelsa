import { internal } from "../_generated/api";
import type { Doc } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";

/**
 * Platform-wide counters for the admin dashboard.
 *
 * The dashboard shows totals (users, recruiters, admins, jobs, applications).
 * Counting these with `.collect().length` would scan every row on each visit,
 * which grows with the product. Instead each total is a counter row updated in
 * the same mutation as the write that changes it, so the dashboard read is a
 * single indexed lookup.
 *
 * Keys are stable strings so the dashboard can request them by name. Unknown
 * keys resolve to 0 rather than throwing, so adding a counter later does not
 * break an older client.
 */
export const ADMIN_STAT_KEYS = {
  users: "users",
  seekers: "users_seeker",
  recruiters: "users_recruiter",
  admins: "users_admin",
  inactiveUsers: "users_inactive",
  jobs: "jobs",
  openJobs: "jobs_open",
  applications: "applications",
} as const;

export type AdminStatKey = (typeof ADMIN_STAT_KEYS)[keyof typeof ADMIN_STAT_KEYS];

export async function bumpAdminStat(ctx: MutationCtx, key: string, delta: number) {
  if (delta === 0) return;
  const existing = await ctx.db
    .query("admin_stats")
    .withIndex("by_key", (q) => q.eq("key", key))
    .unique();
  if (existing) {
    await ctx.db.patch(existing._id, { count: Math.max(0, existing.count + delta) });
    return;
  }
  await ctx.db.insert("admin_stats", { key, count: Math.max(0, delta) });
}

/**
 * Sets a counter to an exact value. Used when a baseline has to be rebuilt
 * (for example after backfilling an existing deployment).
 */
export async function setAdminStat(ctx: MutationCtx, key: string, count: number) {
  const existing = await ctx.db
    .query("admin_stats")
    .withIndex("by_key", (q) => q.eq("key", key))
    .unique();
  if (existing) {
    await ctx.db.patch(existing._id, { count: Math.max(0, count) });
    return;
  }
  await ctx.db.insert("admin_stats", { key, count: Math.max(0, count) });
}

/** Reads every requested counter in one pass. Missing keys read as 0. */
export async function getAdminStats(ctx: QueryCtx | MutationCtx, keys: string[]) {
  const rows = await Promise.all(
    keys.map(async (key) => {
      const row = await ctx.db
        .query("admin_stats")
        .withIndex("by_key", (q) => q.eq("key", key))
        .unique();
      return [key, row?.count ?? 0] as const;
    }),
  );
  return Object.fromEntries(rows) as Record<string, number>;
}

/**
 * Maps a user document to the counter deltas its current state implies.
 * Used when a user's role, account type, or active flag changes so every
 * affected counter moves in the same transaction as the patch.
 */
export function userStatDeltas(
  before: Pick<Doc<"users">, "role" | "account_type" | "isActive">,
  after: Pick<Doc<"users">, "role" | "account_type" | "isActive">,
) {
  const deltas: Record<string, number> = {};
  const add = (key: string, delta: number) => {
    deltas[key] = (deltas[key] ?? 0) + delta;
  };

  if (before.role !== after.role) {
    add(ADMIN_STAT_KEYS.admins, after.role === "admin" ? 1 : -1);
  }

  if (before.account_type !== after.account_type) {
    if (before.account_type === "seeker") add(ADMIN_STAT_KEYS.seekers, -1);
    if (before.account_type === "recruiter") add(ADMIN_STAT_KEYS.recruiters, -1);
    if (after.account_type === "seeker") add(ADMIN_STAT_KEYS.seekers, 1);
    if (after.account_type === "recruiter") add(ADMIN_STAT_KEYS.recruiters, 1);
  }

  if (before.isActive !== after.isActive) {
    add(ADMIN_STAT_KEYS.inactiveUsers, after.isActive ? -1 : 1);
  }

  return deltas;
}

/** Applies the deltas from `userStatDeltas` to the counter rows. */
export async function applyUserStatDeltas(
  ctx: MutationCtx,
  before: Pick<Doc<"users">, "role" | "account_type" | "isActive">,
  after: Pick<Doc<"users">, "role" | "account_type" | "isActive">,
) {
  const deltas = userStatDeltas(before, after);
  for (const [key, delta] of Object.entries(deltas)) {
    if (delta !== 0) await bumpAdminStat(ctx, key, delta);
  }
}

/**
 * Rebuilds the user counters from the users table.
 *
 * This is the one place that scans the users table, and it only runs when an
 * admin explicitly asks for a rebuild (for example right after a deployment
 * that predates the counters). It pages through the table so a large user
 * base does not blow the transaction limit.
 */
export const ADMIN_STAT_REBUILD_BATCH = 200;

export async function rebuildUserStats(ctx: MutationCtx, cursor: string | null = null) {
  const result = await ctx.db
    .query("users")
    .order("asc")
    .paginate({ numItems: ADMIN_STAT_REBUILD_BATCH, cursor });

  const totals = {
    users: 0,
    seekers: 0,
    recruiters: 0,
    admins: 0,
    inactiveUsers: 0,
  };

  for (const user of result.page) {
    totals.users += 1;
    if (user.role === "admin") totals.admins += 1;
    if (user.account_type === "seeker") totals.seekers += 1;
    if (user.account_type === "recruiter") totals.recruiters += 1;
    if (!user.isActive) totals.inactiveUsers += 1;
  }

  // Only write totals on the final page so the counters are never briefly wrong.
  if (result.isDone) {
    await setAdminStat(ctx, ADMIN_STAT_KEYS.users, totals.users);
    await setAdminStat(ctx, ADMIN_STAT_KEYS.seekers, totals.seekers);
    await setAdminStat(ctx, ADMIN_STAT_KEYS.recruiters, totals.recruiters);
    await setAdminStat(ctx, ADMIN_STAT_KEYS.admins, totals.admins);
    await setAdminStat(ctx, ADMIN_STAT_KEYS.inactiveUsers, totals.inactiveUsers);
    return { done: true as const };
  }

  await ctx.scheduler.runAfter(0, internal.admin.rebuildUserStatsBatch, { cursor: result.continueCursor });
  return { done: false as const };
}
