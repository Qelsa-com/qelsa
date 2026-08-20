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
