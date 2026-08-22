import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx } from "../_generated/server";

function integrationIdFromOtherInfo(otherInfo: unknown): string | undefined {
  if (!otherInfo || typeof otherInfo !== "object" || !("integration_id" in otherInfo)) return undefined;
  const value = (otherInfo as { integration_id?: unknown }).integration_id;
  return typeof value === "string" ? value : undefined;
}

async function jobsForAtsIntegration(
  ctx: MutationCtx,
  integrationId: Id<"ats_integrations">,
  provider: string,
): Promise<Doc<"jobs">[]> {
  const indexed = await ctx.db
    .query("jobs")
    .withIndex("by_ats_integration", (q) => q.eq("ats_integration_id", integrationId))
    .collect();
  const seen = new Set(indexed.map((job) => job._id));
  // Legacy rows stored integration_id only in other_info before the indexed field existed.
  const fromResource = await ctx.db
    .query("jobs")
    .withIndex("by_resource", (q) => q.eq("resource", `ats:${provider}`))
    .collect();
  const extras = fromResource.filter((job) => {
    if (seen.has(job._id)) return false;
    return integrationIdFromOtherInfo(job.other_info) === integrationId;
  });
  return extras.length === 0 ? indexed : [...indexed, ...extras];
}

export async function closeMissingAtsJobs(
  ctx: MutationCtx,
  args: {
    integrationId: Id<"ats_integrations">;
    provider: string;
    liveExternalIds: Set<string>;
    listComplete: boolean;
  },
): Promise<number> {
  if (!args.listComplete) return 0;
  const existing = await jobsForAtsIntegration(ctx, args.integrationId, args.provider);
  let closed = 0;
  for (const job of existing) {
    if (!job.external_id || args.liveExternalIds.has(job.external_id)) continue;
    if (job.status === "closed") {
      if (job.ats_integration_id !== args.integrationId) {
        await ctx.db.patch(job._id, { ats_integration_id: args.integrationId });
      }
      continue;
    }
    await ctx.db.patch(job._id, {
      status: "closed",
      ats_integration_id: args.integrationId,
    });
    closed++;
  }
  return closed;
}
