import { v } from "convex/values";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { ATS_JOB_FETCH_LIMIT, fetchJobsForProvider } from "./atsProviders";
import { ensureOpenJobCount } from "./lib/jobCounts";
import { internalAction, internalMutation, internalQuery, type ActionCtx } from "./_generated/server";

const SYNC_INTERVAL_MS = 6 * 60 * 60 * 1000; // 6 hours
const STORE_BATCH = 25;
const STALE_SYNC_MS = 20 * 60 * 1000;
const OCC_RETRIES = 4;
/** Space cron-started board syncs so they do not all hold a full pull in memory at once. */
const CRON_STAGGER_MS = 20_000;

function isWriteConflict(err: unknown) {
  const message = err instanceof Error ? err.message : String(err);
  return message.includes("changed while this mutation was being run");
}

export const syncIntegration = internalAction({
  args: { integrationId: v.id("ats_integrations") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const startedAt = Date.now();
    const claimed = await ctx.runMutation(internal.atsSync.claimSync, { id: args.integrationId, at: startedAt });
    if (!claimed) return null;

    try {
      const integration = await ctx.runQuery(internal.atsSync.getIntegration, { id: args.integrationId });
      if (!integration || !integration.sync_jobs || (integration.status !== "connected" && integration.status !== "error")) {
        await ctx.runMutation(internal.atsSync.releaseSync, { id: args.integrationId });
        return null;
      }

      const jobs = await fetchJobsForProvider({
        provider: integration.provider,
        subdomain: integration.subdomain,
        apiKey: integration.api_key,
        clientId: integration.client_id,
        refreshToken: integration.refresh_token,
        region: integration.region,
      });
      const listComplete = jobs.length < ATS_JOB_FETCH_LIMIT;
      const canEnrich = Boolean(process.env.OPENROUTER_API_KEY);

      let stored = 0;
      for (let i = 0; i < jobs.length; i += STORE_BATCH) {
        const chunk = jobs.slice(i, i + STORE_BATCH);
        const result = await storeAtsJobsWithRetry(ctx, {
          integrationId: args.integrationId,
          provider: integration.provider,
          jobs: chunk,
          seenAt: startedAt,
        });
        stored += result.stored;
        if (canEnrich && result.needsSkills.length > 0) {
          await ctx.scheduler.runAfter(0, internal.jobSkillsEnrich.enrichBatch, { jobIds: result.needsSkills });
        }
        // Drop description payloads so the action can release them before the next chunk.
        for (const job of chunk) job.description = undefined;
      }
      jobs.length = 0;

      if (listComplete) {
        await closeUnseenWithRetry(ctx, {
          integrationId: args.integrationId,
          provider: integration.provider,
          seenAt: startedAt,
        });
      }

      await ctx.runMutation(internal.atsSync.markSyncSuccess, {
        id: args.integrationId,
        at: startedAt,
        count: stored,
      });
    } catch (err) {
      if (isWriteConflict(err)) {
        console.error("ATS sync hit a write conflict; leaving the board connected for the next run", args.integrationId, err);
        await ctx.runMutation(internal.atsSync.releaseSync, {
          id: args.integrationId,
          retryInMs: 5 * 60 * 1000,
        });
        return null;
      }
      await ctx.runMutation(internal.atsSync.markSyncError, {
        id: args.integrationId,
        at: startedAt,
        message: err instanceof Error ? err.message : "Sync failed",
      });
    }
    return null;
  },
});

async function storeAtsJobsWithRetry(
  ctx: ActionCtx,
  args: { integrationId: Id<"ats_integrations">; provider: string; jobs: unknown[]; seenAt: number },
) {
  let lastError: unknown;
  for (let attempt = 0; attempt < OCC_RETRIES; attempt++) {
    try {
      return await ctx.runMutation(internal.jobs.storeAtsJobs, args);
    } catch (err) {
      lastError = err;
      if (!isWriteConflict(err) || attempt === OCC_RETRIES - 1) throw err;
    }
  }
  throw lastError;
}

async function closeUnseenWithRetry(
  ctx: ActionCtx,
  args: { integrationId: Id<"ats_integrations">; provider: string; seenAt: number },
) {
  let cursor: string | null = null;
  let phase: "indexed" | "legacy" = "indexed";
  for (;;) {
    let page: { continueCursor: string | null; phase: "indexed" | "legacy"; isDone: boolean } | undefined;
    let lastError: unknown;
    for (let attempt = 0; attempt < OCC_RETRIES; attempt++) {
      try {
        page = await ctx.runMutation(internal.jobs.closeMissingAtsJobsPage, {
          integrationId: args.integrationId,
          provider: args.provider,
          seenAt: args.seenAt,
          cursor,
          phase,
        });
        lastError = undefined;
        break;
      } catch (err) {
        lastError = err;
        if (!isWriteConflict(err) || attempt === OCC_RETRIES - 1) throw err;
      }
    }
    if (lastError) throw lastError;
    if (!page || page.isDone) return;
    cursor = page.continueCursor;
    phase = page.phase;
  }
}

/** Pull every connected integration whose next_sync_at is due. Called by cron. */
export const syncAllDue = internalAction({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const due = await ctx.runQuery(internal.atsSync.listDue, { now: Date.now() });
    for (let i = 0; i < due.length; i++) {
      const row = due[i];
      if (!row) continue;
      await ctx.scheduler.runAfter(i * CRON_STAGGER_MS, internal.atsSync.syncIntegration, { integrationId: row._id });
    }
    return null;
  },
});

export const getIntegration = internalQuery({
  args: { id: v.id("ats_integrations") },
  returns: v.any(),
  handler: async (ctx, args) => await ctx.db.get(args.id),
});

export const listDue = internalQuery({
  args: { now: v.number() },
  returns: v.array(v.object({ _id: v.id("ats_integrations") })),
  handler: async (ctx, args) => {
    const rows = await ctx.db.query("ats_integrations").collect();
    return rows
      .filter((row) => {
        if (!row.sync_jobs || row.status !== "connected" || typeof row.next_sync_at !== "number" || row.next_sync_at > args.now) {
          return false;
        }
        // Skip boards mid-sync; allow a retry after the lock goes stale.
        return !row.sync_started_at || row.sync_started_at + STALE_SYNC_MS <= args.now;
      })
      .map((row) => ({ _id: row._id }));
  },
});

/** Returns false when another sync is already running for this board. */
export const claimSync = internalMutation({
  args: { id: v.id("ats_integrations"), at: v.number() },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const row = await ctx.db.get(args.id);
    if (!row || !row.sync_jobs || (row.status !== "connected" && row.status !== "error")) return false;
    if (row.sync_started_at && args.at - row.sync_started_at < STALE_SYNC_MS) return false;
    await ensureOpenJobCount(ctx);
    await ctx.db.patch(args.id, { sync_started_at: args.at });
    return true;
  },
});

export const releaseSync = internalMutation({
  args: { id: v.id("ats_integrations"), retryInMs: v.optional(v.number()) },
  returns: v.null(),
  handler: async (ctx, args) => {
    const row = await ctx.db.get(args.id);
    if (!row) return null;
    await ctx.db.patch(args.id, {
      sync_started_at: undefined,
      ...(args.retryInMs != null ? { next_sync_at: Date.now() + args.retryInMs } : {}),
    });
    return null;
  },
});

export const markSyncSuccess = internalMutation({
  args: { id: v.id("ats_integrations"), at: v.number(), count: v.number() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const row = await ctx.db.get(args.id);
    if (!row) return null;
    await ctx.db.patch(args.id, {
      sync_started_at: undefined,
      last_synced_at: args.at,
      next_sync_at: args.at + SYNC_INTERVAL_MS,
      records_synced: (row.records_synced ?? 0) + args.count,
      error_message: undefined,
      error_detected_at: undefined,
      status: "connected",
    });
    return null;
  },
});

export const markSyncError = internalMutation({
  args: { id: v.id("ats_integrations"), at: v.number(), message: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      sync_started_at: undefined,
      status: "error",
      error_message: args.message,
      error_detected_at: args.at,
    });
    return null;
  },
});
