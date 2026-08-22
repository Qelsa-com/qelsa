import type { Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";

/** True once AI extraction has run — legacy flag on the job, or the sidecar row. */
export async function hasExtractedSkills(ctx: QueryCtx | MutationCtx, jobId: Id<"jobs">, skillsExtracted?: boolean) {
  if (skillsExtracted) return true;
  const row = await ctx.db
    .query("job_skill_extractions")
    .withIndex("by_job", (q) => q.eq("job_id", jobId))
    .first();
  return row != null;
}

export async function markSkillsExtracted(ctx: MutationCtx, jobId: Id<"jobs">) {
  const existing = await ctx.db
    .query("job_skill_extractions")
    .withIndex("by_job", (q) => q.eq("job_id", jobId))
    .first();
  if (existing) return;
  await ctx.db.insert("job_skill_extractions", { job_id: jobId });
}

export async function jobNeedsSkillEnrichment(ctx: QueryCtx | MutationCtx, jobId: Id<"jobs">, skillsExtracted?: boolean) {
  if (await hasExtractedSkills(ctx, jobId, skillsExtracted)) return false;
  const linked = await ctx.db
    .query("job_skills")
    .withIndex("by_job", (q) => q.eq("job_id", jobId))
    .take(1);
  return linked.length === 0;
}
