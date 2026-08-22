import { v } from "convex/values";
import { internal } from "./_generated/api";
import { authedMutation, authedQuery } from "./lib/customFunctions";
import { withId } from "./lib/helpers";

const provider = v.union(v.literal("zoho_recruit"), v.literal("greenhouse"), v.literal("lever"), v.literal("keka"), v.literal("ashby"), v.literal("bamboohr"), v.literal("workday"), v.literal("darwinbox"), v.literal("icims"));

const SYNC_INTERVAL_MS = 6 * 60 * 60 * 1000; // 6 hours

type Ctx = { db: any; user: { _id: string } };

async function getByProvider(ctx: Ctx, providerId: string) {
  return await ctx.db
    .query("ats_integrations")
    .withIndex("by_user_and_provider", (q: any) => q.eq("user_id", ctx.user._id).eq("provider", providerId))
    .unique();
}

/** Never leak stored secrets to the client. */
function sanitize(row: Record<string, unknown>) {
  const { api_key: _apiKey, ...rest } = row;
  return { ...withId(rest as { _id: string }), has_api_key: Boolean(_apiKey) };
}

function connectedPatch() {
  const now = Date.now();
  return {
    status: "connected" as const,
    connected_since: now,
    last_synced_at: now,
    next_sync_at: now + SYNC_INTERVAL_MS,
    error_message: undefined,
    error_detected_at: undefined,
  };
}

export const list = authedQuery({
  args: {},
  returns: v.any(),
  handler: async (ctx) => {
    const rows = await ctx.db
      .query("ats_integrations")
      .withIndex("by_user", (q) => q.eq("user_id", ctx.user._id))
      .collect();
    return rows.map(sanitize);
  },
});

/** API-key providers (Greenhouse, Ashby, …): validate + store credentials. */
export const connectApiKey = authedMutation({
  args: { provider, apiKey: v.string(), subdomain: v.optional(v.string()) },
  returns: v.any(),
  handler: async (ctx, args) => {
    const existing = await getByProvider(ctx, args.provider);
    let integrationId;
    if (existing) {
      await ctx.db.patch(existing._id, {
        ...connectedPatch(),
        auth_type: "api_key",
        api_key: args.apiKey,
        subdomain: args.subdomain,
      });
      integrationId = existing._id;
    } else {
      integrationId = await ctx.db.insert("ats_integrations", {
        user_id: ctx.user._id,
        provider: args.provider as never,
        auth_type: "api_key",
        api_key: args.apiKey,
        subdomain: args.subdomain,
        sync_jobs: true,
        sync_candidates: true,
        records_synced: 0,
        ...connectedPatch(),
      });
    }
    // Kick off the first sync right away so jobs start flowing in.
    await ctx.scheduler.runAfter(0, internal.atsSync.syncIntegration, { integrationId });
    return sanitize((await ctx.db.get(integrationId))!);
  },
});

/**
 * OAuth providers (Zoho Recruit, Lever, …).
 * Placeholder: marks the integration connected immediately. Replace with a real
 * OAuth redirect + token exchange before shipping.
 */
export const connectOAuth = authedMutation({
  args: { provider },
  returns: v.any(),
  handler: async (ctx, args) => {
    const existing = await getByProvider(ctx, args.provider);
    let integrationId;
    if (existing) {
      await ctx.db.patch(existing._id, { ...connectedPatch(), auth_type: "oauth" });
      integrationId = existing._id;
    } else {
      integrationId = await ctx.db.insert("ats_integrations", {
        user_id: ctx.user._id,
        provider: args.provider as never,
        auth_type: "oauth",
        sync_jobs: true,
        sync_candidates: true,
        records_synced: 0,
        ...connectedPatch(),
      });
    }
    await ctx.scheduler.runAfter(0, internal.atsSync.syncIntegration, { integrationId });
    return sanitize((await ctx.db.get(integrationId))!);
  },
});

/** Re-enter credentials after a token/API-key expiry. Keeps sync configuration. */
export const reconnect = authedMutation({
  args: { provider, apiKey: v.optional(v.string()) },
  returns: v.any(),
  handler: async (ctx, args) => {
    const existing = await getByProvider(ctx, args.provider);
    if (!existing) throw new Error("Integration not found");
    await ctx.db.patch(existing._id, {
      ...connectedPatch(),
      connected_since: existing.connected_since ?? Date.now(),
      ...(args.apiKey ? { api_key: args.apiKey } : {}),
    });
    await ctx.scheduler.runAfter(0, internal.atsSync.syncIntegration, { integrationId: existing._id });
    return sanitize((await ctx.db.get(existing._id))!);
  },
});

/** Stop syncing but keep credentials + sync configuration for a later reconnect. */
export const disconnect = authedMutation({
  args: { provider },
  returns: v.null(),
  handler: async (ctx, args) => {
    const existing = await getByProvider(ctx, args.provider);
    if (!existing) return null;
    await ctx.db.patch(existing._id, {
      status: "disconnected",
      next_sync_at: undefined,
    });
    return null;
  },
});

/** Permanently remove the integration row (credentials + configuration). */
export const remove = authedMutation({
  args: { provider },
  returns: v.null(),
  handler: async (ctx, args) => {
    const existing = await getByProvider(ctx, args.provider);
    if (existing) await ctx.db.delete(existing._id);
    return null;
  },
});

export const updateSyncSettings = authedMutation({
  args: { provider, syncJobs: v.optional(v.boolean()), syncCandidates: v.optional(v.boolean()) },
  returns: v.any(),
  handler: async (ctx, args) => {
    const existing = await getByProvider(ctx, args.provider);
    if (!existing) throw new Error("Integration not found");
    await ctx.db.patch(existing._id, {
      ...(args.syncJobs !== undefined ? { sync_jobs: args.syncJobs } : {}),
      ...(args.syncCandidates !== undefined ? { sync_candidates: args.syncCandidates } : {}),
    });
    return sanitize((await ctx.db.get(existing._id))!);
  },
});

/** Gated providers (Darwinbox, iCIMS): record an access request for vendor approval. */
export const requestAccess = authedMutation({
  args: { provider },
  returns: v.any(),
  handler: async (ctx, args) => {
    const existing = await getByProvider(ctx, args.provider);
    if (existing) return sanitize(existing);
    const id = await ctx.db.insert("ats_integrations", {
      user_id: ctx.user._id,
      provider: args.provider as never,
      status: "pending",
      auth_type: "gated",
      sync_jobs: true,
      sync_candidates: true,
      records_synced: 0,
      requested_at: Date.now(),
    });
    return sanitize((await ctx.db.get(id))!);
  },
});
