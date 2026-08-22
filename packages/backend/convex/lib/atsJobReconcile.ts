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
    closed += await reconcileAtsJob(ctx, job, args.integrationId, args.liveExternalIds);
  }
  return closed;
}

const CLOSE_PAGE_SIZE = 40;

export type CloseAtsPhase = "indexed" | "legacy";

/** One page of close/reopen reconcile so sync does not read the whole board at once. */
export async function closeMissingAtsJobsPage(
  ctx: MutationCtx,
  args: {
    integrationId: Id<"ats_integrations">;
    provider: string;
    seenAt: number;
    cursor: string | null;
    phase: CloseAtsPhase;
  },
): Promise<{ closed: number; continueCursor: string | null; phase: CloseAtsPhase; isDone: boolean }> {
  if (args.phase === "indexed") {
    const result = await ctx.db
      .query("jobs")
      .withIndex("by_ats_integration", (q) => q.eq("ats_integration_id", args.integrationId))
      .paginate({ cursor: args.cursor, numItems: CLOSE_PAGE_SIZE });
    let closed = 0;
    for (const job of result.page) {
      closed += await reconcileUnseenAtsJob(ctx, job, args.integrationId, args.seenAt);
    }
    if (!result.isDone) {
      return { closed, continueCursor: result.continueCursor, phase: "indexed", isDone: false };
    }
    return { closed, continueCursor: null, phase: "legacy", isDone: false };
  }

  const result = await ctx.db
    .query("jobs")
    .withIndex("by_resource", (q) => q.eq("resource", `ats:${args.provider}`))
    .paginate({ cursor: args.cursor, numItems: CLOSE_PAGE_SIZE });
  let closed = 0;
  for (const job of result.page) {
    if (job.ats_integration_id === args.integrationId) continue;
    if (integrationIdFromOtherInfo(job.other_info) !== args.integrationId) continue;
    closed += await reconcileUnseenAtsJob(ctx, job, args.integrationId, args.seenAt);
  }
  return {
    closed,
    continueCursor: result.isDone ? null : result.continueCursor,
    phase: "legacy",
    isDone: result.isDone,
  };
}

async function reconcileAtsJob(
  ctx: MutationCtx,
  job: Doc<"jobs">,
  integrationId: Id<"ats_integrations">,
  liveExternalIds: Set<string>,
): Promise<number> {
  if (!job.external_id || liveExternalIds.has(job.external_id)) return 0;
  return await closeAtsJob(ctx, job, integrationId);
}

async function reconcileUnseenAtsJob(
  ctx: MutationCtx,
  job: Doc<"jobs">,
  integrationId: Id<"ats_integrations">,
  seenAt: number,
): Promise<number> {
  if (job.ats_seen_at === seenAt) return 0;
  return await closeAtsJob(ctx, job, integrationId);
}

async function closeAtsJob(ctx: MutationCtx, job: Doc<"jobs">, integrationId: Id<"ats_integrations">): Promise<number> {
  if (job.status === "closed") {
    if (job.ats_integration_id !== integrationId) {
      await ctx.db.patch(job._id, { ats_integration_id: integrationId });
    }
    return 0;
  }
  await ctx.db.patch(job._id, {
    status: "closed",
    ats_integration_id: integrationId,
  });
  return 1;
}
