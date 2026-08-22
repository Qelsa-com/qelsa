import { v } from "convex/values";
import { internal } from "./_generated/api";
import { ATS_JOB_FETCH_LIMIT, fetchJobsForProvider } from "./atsProviders";
import { internalAction, internalMutation, internalQuery } from "./_generated/server";

const SYNC_INTERVAL_MS = 6 * 60 * 60 * 1000; // 6 hours

export const syncIntegration = internalAction({
  args: { integrationId: v.id("ats_integrations") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const integration = await ctx.runQuery(internal.atsSync.getIntegration, { id: args.integrationId });
    if (!integration || integration.status !== "connected" || !integration.sync_jobs) return null;

    const startedAt = Date.now();
    try {
      const jobs = await fetchJobsForProvider({
        provider: integration.provider,
        subdomain: integration.subdomain,
        apiKey: integration.api_key,
        clientId: integration.client_id,
        refreshToken: integration.refresh_token,
        region: integration.region,
      });

      const { stored, needsSkills } = await ctx.runMutation(internal.jobs.storeAtsJobs, {
        integrationId: args.integrationId,
        provider: integration.provider,
        jobs,
        listComplete: jobs.length < ATS_JOB_FETCH_LIMIT,
      });

      await ctx.runMutation(internal.atsSync.markSyncSuccess, {
        id: args.integrationId,
        at: startedAt,
        count: stored,
      });

      if (needsSkills.length > 0 && process.env.OPENROUTER_API_KEY) {
        await ctx.scheduler.runAfter(0, internal.jobSkillsEnrich.enrichBatch, { jobIds: needsSkills });
      }
    } catch (err) {
      await ctx.runMutation(internal.atsSync.markSyncError, {
        id: args.integrationId,
        at: startedAt,
        message: err instanceof Error ? err.message : "Sync failed",
      });
    }
    return null;
  },
});

/** Pull every connected integration whose next_sync_at is due. Called by cron. */
export const syncAllDue = internalAction({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const due = await ctx.runQuery(internal.atsSync.listDue, { now: Date.now() });
    for (const row of due) {
      await ctx.scheduler.runAfter(0, internal.atsSync.syncIntegration, { integrationId: row._id });
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
    return rows.filter((r) => r.status === "connected" && r.sync_jobs && typeof r.next_sync_at === "number" && r.next_sync_at <= args.now).map((r) => ({ _id: r._id }));
  },
});

export const markSyncSuccess = internalMutation({
  args: { id: v.id("ats_integrations"), at: v.number(), count: v.number() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const row = await ctx.db.get(args.id);
    if (!row) return null;
    await ctx.db.patch(args.id, {
      last_synced_at: args.at,
      next_sync_at: args.at + SYNC_INTERVAL_MS,
      records_synced: (row.records_synced ?? 0) + args.count,
      error_message: undefined,
      error_detected_at: undefined,
    });
    return null;
  },
});

export const markSyncError = internalMutation({
  args: { id: v.id("ats_integrations"), at: v.number(), message: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      status: "error",
      error_message: args.message,
      error_detected_at: args.at,
    });
    return null;
  },
});
