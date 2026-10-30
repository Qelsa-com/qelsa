import { v } from "convex/values";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { ATS_JOB_FETCH_LIMIT, fetchJobsForProvider, fetchWorkdayDetail, fetchWorkdayPostings, normalizeAtsHtml, workdayExternalId } from "./atsProviders";
import { resolveAtsSyncEnabled } from "./lib/atsSyncEnabled";
import { ATS_SYNC_INTERVAL_MS } from "./lib/atsSyncInterval";
import type { CompanyProfileSeed } from "./lib/companyProfile";
import { ensureOpenJobCount } from "./lib/jobCounts";
import { internalAction, internalMutation, internalQuery, type ActionCtx } from "./_generated/server";

const STORE_BATCH = 25;
const STALE_SYNC_MS = 20 * 60 * 1000;
const OCC_RETRIES = 4;
/** Space cron-started board syncs so they do not all hold a full pull in memory at once. */
const CRON_STAGGER_MS = 20_000;
/** Jobs per page when collecting the ids we already have descriptions for. */
const DESCRIBED_PAGE = 400;
/** Workday removes limits at ~4 req/s; keep the repair pass well under it. */
const REPAIR_SLEEP_MS = 350;

function isWriteConflict(err: unknown) {
  const message = err instanceof Error ? err.message : String(err);
  return message.includes("changed while this mutation was being run");
}

export const syncAllowed = internalQuery({
  args: {},
  returns: v.boolean(),
  handler: async (ctx) => {
    const row = await ctx.db.query("admin_settings").first();
    return resolveAtsSyncEnabled(row?.ats_sync_enabled).enabled;
  },
});

export const syncIntegration = internalAction({
  args: { integrationId: v.id("ats_integrations"), force: v.optional(v.boolean()) },
  returns: v.null(),
  handler: async (ctx, args) => {
    if (!args.force && !(await ctx.runQuery(internal.atsSync.syncAllowed))) {
      console.log("ATS sync is disabled — skipping", args.integrationId);
      return null;
    }
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
        // Workday needs one detail call per posting. Skip the ones we already
        // have a description for so a re-sync stays small and rate-limit free.
        skipExternalIds:
          integration.provider === "workday"
            ? await collectDescribedExternalIds(ctx, args.integrationId)
            : undefined,
      });
      const listComplete = jobs.complete ?? jobs.length < ATS_JOB_FETCH_LIMIT;
      const canEnrich = Boolean(process.env.OPENROUTER_API_KEY);
      const hasIncompleteDetails = jobs.some((job) => job.incomplete === true);

      let stored = 0;
      const profileSeeds = new Map<string, CompanyProfileSeed>();
      for (let i = 0; i < jobs.length; i += STORE_BATCH) {
        const chunk = jobs.slice(i, i + STORE_BATCH);
        const result = await storeAtsJobsWithRetry(ctx, {
          integrationId: args.integrationId,
          provider: integration.provider,
          jobs: chunk,
          seenAt: startedAt,
        });
        stored += result.stored;
        for (const seed of result.companySeeds) {
          if (!profileSeeds.has(seed.key)) profileSeeds.set(seed.key, seed);
        }
        if (canEnrich && result.needsSkills.length > 0) {
          await ctx.scheduler.runAfter(0, internal.jobSkillsEnrich.enrichBatch, { jobIds: result.needsSkills });
        }
        // Drop description payloads so the action can release them before the next chunk.
        for (const job of chunk) job.description = undefined;
      }
      jobs.length = 0;

      // Detail calls that failed transiently leave jobs stored without text.
      // Retry only the missing ones shortly after instead of waiting 5 days.
      if (hasIncompleteDetails && integration.provider === "workday") {
        await ctx.scheduler.runAfter(2 * 60 * 1000, internal.atsSync.backfillMissingWorkdayDescriptions, {
          integrationId: args.integrationId,
          limit: 200,
        });
      }

      // Queue company-profile generation outside the sync path. Existing
      // profiles are skipped, so repeat syncs never spend another LLM call.
      const profileSeedList = [...profileSeeds.values()];
      try {
        for (let i = 0; i < profileSeedList.length; i += 200) {
          await ctx.runMutation(internal.companyProfiles.ensureProfiles, {
            seeds: profileSeedList.slice(i, i + 200),
          });
        }
      } catch (err) {
        // Profile copy is supplementary; never fail an otherwise good sync.
        console.warn("[atsSync] could not enqueue company profiles", args.integrationId, err);
      }

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

/** External ids that already have a description, paged to stay under read limits. */
async function collectDescribedExternalIds(ctx: ActionCtx, integrationId: Id<"ats_integrations">) {
  const ids = new Set<string>();
  let cursor: string | null = null;
  for (let page = 0; page < 25; page++) {
    const result: { ids: string[]; cursor: string | null; isDone: boolean } = await ctx.runQuery(
      internal.atsSync.describedExternalIdsPage,
      {
        integrationId,
        cursor,
        pageSize: DESCRIBED_PAGE,
      },
    );
    for (const id of result.ids) ids.add(id);
    cursor = result.cursor;
    if (result.isDone) break;
  }
  return ids;
}

async function closeUnseenWithRetry(  ctx: ActionCtx,
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
    if (!(await ctx.runQuery(internal.atsSync.syncAllowed))) {
      console.log("ATS sync is disabled — skipping due boards");
      return null;
    }
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
        if (!row.sync_jobs || row.status !== "connected") return false;
        // Prefer last_synced_at so a shorter stored next_sync_at from an older cadence
        // cannot re-pull (and re-enqueue LLM extraction) after we lengthen the interval.
        if (typeof row.last_synced_at === "number" && args.now < row.last_synced_at + ATS_SYNC_INTERVAL_MS) {
          return false;
        }
        if (typeof row.next_sync_at !== "number" || row.next_sync_at > args.now) {
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
      next_sync_at: args.at + ATS_SYNC_INTERVAL_MS,
      records_synced: args.count,
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

/** External ids that already have a description, one page at a time. */
export const describedExternalIdsPage = internalQuery({
  args: {
    integrationId: v.id("ats_integrations"),
    cursor: v.union(v.string(), v.null()),
    pageSize: v.number(),
  },
  returns: v.object({
    ids: v.array(v.string()),
    cursor: v.union(v.string(), v.null()),
    isDone: v.boolean(),
  }),
  handler: async (ctx, args) => {
    const page = await ctx.db
      .query("jobs")
      .withIndex("by_ats_integration", (q) => q.eq("ats_integration_id", args.integrationId))
      .paginate({ numItems: args.pageSize, cursor: args.cursor });
    return {
      ids: page.page
        .filter((job) => Boolean((job.description ?? "").trim()))
        .map((job) => job.external_id)
        .filter((id): id is string => typeof id === "string"),
      cursor: page.continueCursor,
      isDone: page.isDone,
    };
  },
});

/** Jobs on a board whose description never made it through a sync. */
export const jobsMissingDescriptionPage = internalQuery({
  args: {
    integrationId: v.id("ats_integrations"),
    cursor: v.union(v.string(), v.null()),
    pageSize: v.number(),
    limit: v.number(),
  },
  returns: v.object({
    jobs: v.array(v.object({ id: v.id("jobs"), external_id: v.string() })),
    cursor: v.union(v.string(), v.null()),
    isDone: v.boolean(),
  }),
  handler: async (ctx, args) => {
    const page = await ctx.db
      .query("jobs")
      .withIndex("by_ats_integration", (q) => q.eq("ats_integration_id", args.integrationId))
      .paginate({ numItems: args.pageSize, cursor: args.cursor });
    const jobs: Array<{ id: Id<"jobs">; external_id: string }> = [];
    for (const job of page.page) {
      if (jobs.length >= args.limit) break;
      if ((job.description ?? "").trim()) continue;
      if (!job.external_id) continue;
      jobs.push({ id: job._id, external_id: job.external_id });
    }
    return { jobs, cursor: page.continueCursor, isDone: page.isDone };
  },
});

export const applyBackfilledDescription = internalMutation({
  args: {
    jobId: v.id("jobs"),
    description: v.string(),
    publishedDate: v.optional(v.number()),
    title: v.optional(v.string()),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const job = await ctx.db.get(args.jobId);
    if (!job) return false;
    if ((job.description ?? "").trim().length > 0) return false;
    const patch: Record<string, unknown> = { description: args.description };
    if (args.publishedDate) patch.published_date = args.publishedDate;
    if (args.title && !job.title) patch.title = args.title;
    await ctx.db.patch(args.jobId, patch);
    // A missing description used to mark the job "already extracted", which
    // blocks the enrichment pass. Clear it so skills come from the real text.
    const extractions = await ctx.db
      .query("job_skill_extractions")
      .withIndex("by_job", (q) => q.eq("job_id", args.jobId))
      .collect();
    for (const row of extractions) await ctx.db.delete(row._id);
    if (job.skills_extracted) await ctx.db.patch(args.jobId, { skills_extracted: undefined });
    return true;
  },
});

/**
 * Re-fetch the Workday detail for jobs that were stored while the detail call
 * was rate limited. Only the missing ones are fetched, so this is cheap.
 */
export const backfillMissingWorkdayDescriptions = internalAction({
  args: { integrationId: v.id("ats_integrations"), limit: v.optional(v.number()) },
  returns: v.object({
    scanned: v.number(),
    patched: v.number(),
    unmatched: v.number(),
    failed: v.number(),
    deferred: v.number(),
  }),
  handler: async (ctx, args) => {
    const integration = await ctx.runQuery(internal.atsSync.getIntegration, { id: args.integrationId });
    if (!integration || integration.provider !== "workday" || !integration.subdomain) {
      throw new Error("A connected Workday board is required");
    }
    const cap = Math.max(1, args.limit ?? 80);
    const missing: Array<{ id: Id<"jobs">; external_id: string }> = [];
    let cursor: string | null = null;
    let deferred = 0;
    for (let page = 0; page < 25 && missing.length < cap; page++) {
      const result: {
        jobs: Array<{ id: Id<"jobs">; external_id: string }>;
        cursor: string | null;
        isDone: boolean;
      } = await ctx.runQuery(internal.atsSync.jobsMissingDescriptionPage, {
        integrationId: args.integrationId,
        cursor,
        pageSize: DESCRIBED_PAGE,
        limit: cap - missing.length,
      });
      missing.push(...result.jobs);
      cursor = result.cursor;
      if (result.isDone) break;
      if (missing.length >= cap) deferred = 1;
    }
    if (missing.length === 0) {
      return { scanned: 0, patched: 0, unmatched: 0, failed: 0, deferred: 0 };
    }

    const board = await fetchWorkdayPostings(integration.subdomain);
    const byExternalId = new Map<string, Record<string, unknown>>();
    for (const posting of board.postings) {
      const externalPath = typeof posting.externalPath === "string" ? posting.externalPath : "";
      const bullets = Array.isArray(posting.bulletFields) ? posting.bulletFields : [];
      byExternalId.set(workdayExternalId(board.tenant, board.site, bullets[0], externalPath), posting);
    }

    let patched = 0;
    let unmatched = 0;
    let failed = 0;
    const enriched: Id<"jobs">[] = [];
    for (const job of missing) {
      const posting = byExternalId.get(job.external_id);
      const externalPath = posting && typeof posting.externalPath === "string" ? posting.externalPath : "";
      if (!externalPath) {
        unmatched++;
        continue;
      }
      try {
        const info = await fetchWorkdayDetail(integration.subdomain, externalPath);
        const description = normalizeAtsHtml(
          typeof info?.jobDescription === "string" ? info.jobDescription : undefined,
        );
        if (!description) {
          failed++;
          continue;
        }
        const publishedDate =
          typeof info?.startDate === "string"
            ? new Date(`${info.startDate}T00:00:00Z`).getTime()
            : undefined;
        const title = typeof info?.title === "string" ? info.title : undefined;
        const applied = await ctx.runMutation(internal.atsSync.applyBackfilledDescription, {
          jobId: job.id,
          description,
          publishedDate,
          title,
        });
        if (applied) {
          patched++;
          enriched.push(job.id);
        }
      } catch {
        failed++;
      }
      await new Promise((resolve) => setTimeout(resolve, REPAIR_SLEEP_MS));
    }

    if (enriched.length > 0) {
      await ctx.scheduler.runAfter(0, internal.jobSkillsEnrich.enrichBatch, { jobIds: enriched });
    }
    return { scanned: missing.length, patched, unmatched, failed, deferred };
  },
});
