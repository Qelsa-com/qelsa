import type { Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";

export const MIN_SKILL_DESCRIPTION_CHARS = 80;

export function skillContentHash(title: string, description: string) {
  const text = `${title.trim().toLowerCase()}\n${description}`;
  let hash = 5381;
  for (let i = 0; i < text.length; i++) hash = ((hash << 5) + hash) ^ text.charCodeAt(i);
  return (hash >>> 0).toString(16);
}

export function canExtractSkills(description?: string) {
  if (!description) return false;
  const plain = description
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return plain.length >= MIN_SKILL_DESCRIPTION_CHARS;
}

/** True once AI extraction has run — legacy flag on the job, or the sidecar row. */
export async function hasExtractedSkills(ctx: QueryCtx | MutationCtx, jobId: Id<"jobs">, skillsExtracted?: boolean) {
  if (skillsExtracted) return true;
  const row = await ctx.db
    .query("job_skill_extractions")
    .withIndex("by_job", (q) => q.eq("job_id", jobId))
    .first();
  return row != null;
}

export async function markSkillsExtracted(ctx: MutationCtx, jobId: Id<"jobs">, contentHash?: string) {
  const existing = await ctx.db
    .query("job_skill_extractions")
    .withIndex("by_job", (q) => q.eq("job_id", jobId))
    .first();
  if (existing) {
    if (contentHash && existing.content_hash !== contentHash) {
      await ctx.db.patch(existing._id, { content_hash: contentHash });
    }
    return;
  }
  await ctx.db.insert("job_skill_extractions", {
    job_id: jobId,
    ...(contentHash ? { content_hash: contentHash } : {}),
  });
}

export async function jobNeedsSkillEnrichment(ctx: QueryCtx | MutationCtx, jobId: Id<"jobs">, skillsExtracted?: boolean) {
  if (await hasExtractedSkills(ctx, jobId, skillsExtracted)) return false;
  const linked = await ctx.db
    .query("job_skills")
    .withIndex("by_job", (q) => q.eq("job_id", jobId))
    .take(1);
  return linked.length === 0;
}
