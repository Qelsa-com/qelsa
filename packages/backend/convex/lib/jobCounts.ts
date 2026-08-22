import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";

async function statsFor(ctx: QueryCtx | MutationCtx, jobId: Id<"jobs">) {
  return await ctx.db
    .query("job_stats")
    .withIndex("by_job", (q) => q.eq("job_id", jobId))
    .first();
}

export async function ensureJobStats(ctx: MutationCtx, jobId: Id<"jobs">) {
  const existing = await statsFor(ctx, jobId);
  if (existing) return existing._id;
  return await ctx.db.insert("job_stats", {
    job_id: jobId,
    view_count: 0,
    application_count: 0,
  });
}

export async function getJobCounts(ctx: QueryCtx | MutationCtx, job: Doc<"jobs">) {
  const stats = await statsFor(ctx, job._id);
  return {
    view_count: stats?.view_count ?? job.view_count ?? 0,
    application_count: stats?.application_count ?? job.application_count ?? 0,
  };
}

const OPEN_JOBS_KEY = "open";

export async function getOpenJobCount(ctx: QueryCtx | MutationCtx) {
  const row = await ctx.db
    .query("job_browse_stats")
    .withIndex("by_key", (q) => q.eq("key", OPEN_JOBS_KEY))
    .unique();
  return row?.count ?? null;
}

export async function bumpOpenJobCount(ctx: MutationCtx, delta: number) {
  if (delta === 0) return;
  const row = await ctx.db
    .query("job_browse_stats")
    .withIndex("by_key", (q) => q.eq("key", OPEN_JOBS_KEY))
    .unique();
  if (!row) {
    await ctx.db.insert("job_browse_stats", { key: OPEN_JOBS_KEY, count: Math.max(0, delta) });
    return;
  }
  await ctx.db.patch(row._id, { count: Math.max(0, row.count + delta) });
}

export function openCountDelta(previousStatus?: string, nextStatus?: string) {
  const wasOpen = previousStatus === "open";
  const isOpen = nextStatus === "open";
  if (wasOpen === isOpen) return 0;
  return isOpen ? 1 : -1;
}

/** One-time fill so the browse header has a total before the next ingest. */
export async function ensureOpenJobCount(ctx: MutationCtx) {
  const existing = await ctx.db
    .query("job_browse_stats")
    .withIndex("by_key", (q) => q.eq("key", OPEN_JOBS_KEY))
    .unique();
  if (existing) return existing.count;
  const open = await ctx.db
    .query("jobs")
    .withIndex("by_status", (q) => q.eq("status", "open"))
    .take(8000);
  await ctx.db.insert("job_browse_stats", { key: OPEN_JOBS_KEY, count: open.length });
  return open.length;
}

export async function bumpJobCount(
  ctx: MutationCtx,
  jobId: Id<"jobs">,
  field: "view_count" | "application_count",
  delta: number,
) {
  const existing = await statsFor(ctx, jobId);
  if (existing) {
    await ctx.db.patch(existing._id, { [field]: Math.max(0, existing[field] + delta) });
    return;
  }

  const job = await ctx.db.get(jobId);
  if (!job) return;
  await ctx.db.insert("job_stats", {
    job_id: jobId,
    view_count: Math.max(0, (job.view_count ?? 0) + (field === "view_count" ? delta : 0)),
    application_count: Math.max(0, (job.application_count ?? 0) + (field === "application_count" ? delta : 0)),
  });
}
