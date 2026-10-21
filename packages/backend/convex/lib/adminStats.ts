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

/**
 * Rebuild accumulation keys. These are deliberately internal keys: the
 * dashboard never reads them, and a rebuild resets them before scanning.
 */
const REBUILD_KEYS = {
  users: "__rebuild_users",
  seekers: "__rebuild_users_seeker",
  recruiters: "__rebuild_users_recruiter",
  admins: "__rebuild_users_admin",
  inactiveUsers: "__rebuild_users_inactive",
  jobs: "__rebuild_jobs",
  openJobs: "__rebuild_jobs_open",
  applications: "__rebuild_applications",
} as const;

export async function resetAdminStatsRebuild(ctx: MutationCtx) {
  for (const key of Object.values(REBUILD_KEYS)) {
    await setAdminStat(ctx, key, 0);
  }
}

async function finalizeStatsRebuild(
  ctx: MutationCtx,
  pairs: Array<{ accumulate: string; target: string }>,
) {
  const values = await getAdminStats(
    ctx,
    pairs.map((pair) => pair.accumulate),
  );
  for (const pair of pairs) {
    await setAdminStat(ctx, pair.target, values[pair.accumulate] ?? 0);
    await setAdminStat(ctx, pair.accumulate, 0);
  }
}

export async function rebuildUserStats(ctx: MutationCtx, cursor: string | null = null) {
  const result = await ctx.db
    .query("users")
    .order("asc")
    .paginate({ numItems: ADMIN_STAT_REBUILD_BATCH, cursor });

  for (const user of result.page) {
    await bumpAdminStat(ctx, REBUILD_KEYS.users, 1);
    if (user.role === "admin") await bumpAdminStat(ctx, REBUILD_KEYS.admins, 1);
    if (user.account_type === "seeker") await bumpAdminStat(ctx, REBUILD_KEYS.seekers, 1);
    if (user.account_type === "recruiter") await bumpAdminStat(ctx, REBUILD_KEYS.recruiters, 1);
    if (!user.isActive) await bumpAdminStat(ctx, REBUILD_KEYS.inactiveUsers, 1);
  }

  if (result.isDone) {
    await finalizeStatsRebuild(ctx, [
      { accumulate: REBUILD_KEYS.users, target: ADMIN_STAT_KEYS.users },
      { accumulate: REBUILD_KEYS.seekers, target: ADMIN_STAT_KEYS.seekers },
      { accumulate: REBUILD_KEYS.recruiters, target: ADMIN_STAT_KEYS.recruiters },
      { accumulate: REBUILD_KEYS.admins, target: ADMIN_STAT_KEYS.admins },
      { accumulate: REBUILD_KEYS.inactiveUsers, target: ADMIN_STAT_KEYS.inactiveUsers },
    ]);
    return { done: true as const };
  }

  await ctx.scheduler.runAfter(0, internal.admin.rebuildUserStatsBatch, {
    cursor: result.continueCursor,
  });
  return { done: false as const };
}

export async function rebuildJobStats(ctx: MutationCtx, cursor: string | null = null) {
  const result = await ctx.db
    .query("jobs")
    .order("asc")
    .paginate({ numItems: ADMIN_STAT_REBUILD_BATCH, cursor });

  for (const job of result.page) {
    await bumpAdminStat(ctx, REBUILD_KEYS.jobs, 1);
    if (job.status === "open") await bumpAdminStat(ctx, REBUILD_KEYS.openJobs, 1);
  }

  if (result.isDone) {
    await finalizeStatsRebuild(ctx, [
      { accumulate: REBUILD_KEYS.jobs, target: ADMIN_STAT_KEYS.jobs },
      { accumulate: REBUILD_KEYS.openJobs, target: ADMIN_STAT_KEYS.openJobs },
    ]);
    return { done: true as const };
  }

  await ctx.scheduler.runAfter(0, internal.admin.rebuildJobStatsBatch, {
    cursor: result.continueCursor,
  });
  return { done: false as const };
}

export async function rebuildApplicationStats(ctx: MutationCtx, cursor: string | null = null) {
  const result = await ctx.db
    .query("job_applications")
    .order("asc")
    .paginate({ numItems: ADMIN_STAT_REBUILD_BATCH, cursor });

  for (const _row of result.page) {
    await bumpAdminStat(ctx, REBUILD_KEYS.applications, 1);
  }

  if (result.isDone) {
    await finalizeStatsRebuild(ctx, [
      { accumulate: REBUILD_KEYS.applications, target: ADMIN_STAT_KEYS.applications },
    ]);
    return { done: true as const };
  }

  await ctx.scheduler.runAfter(0, internal.admin.rebuildApplicationStatsBatch, {
    cursor: result.continueCursor,
  });
  return { done: false as const };
}
