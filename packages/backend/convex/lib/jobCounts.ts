import type { Id } from "../_generated/dataModel";
import type { MutationCtx } from "../_generated/server";

export async function bumpJobCount(
  ctx: MutationCtx,
  jobId: Id<"jobs">,
  field: "view_count" | "application_count",
  delta: number,
) {
  const job = await ctx.db.get(jobId);
  if (!job) return;
  await ctx.db.patch(jobId, { [field]: Math.max(0, (job[field] ?? 0) + delta) });
}
