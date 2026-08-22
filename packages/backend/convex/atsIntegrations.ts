import { v } from "convex/values";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { normalizePublicBoardSlug } from "./atsProviders";
import { closeMissingAtsJobs } from "./lib/atsJobReconcile";
import { adminMutation, adminQuery, authedMutation, authedQuery } from "./lib/customFunctions";
import { withId } from "./lib/helpers";

const provider = v.union(v.literal("zoho_recruit"), v.literal("greenhouse"), v.literal("lever"), v.literal("keka"), v.literal("ashby"), v.literal("bamboohr"), v.literal("workday"), v.literal("darwinbox"), v.literal("icims"));
const publicBoardProvider = v.union(v.literal("greenhouse"), v.literal("lever"), v.literal("ashby"));

const SYNC_INTERVAL_MS = 6 * 60 * 60 * 1000; // 6 hours

type Ctx = { db: any; user: { _id: string } };

function isEmployerRow(row: { kind?: string }) {
  return row.kind !== "public_board";
}

async function getByProvider(ctx: Ctx, providerId: string) {
  const rows = await ctx.db
    .query("ats_integrations")
    .withIndex("by_user_and_provider", (q: any) => q.eq("user_id", ctx.user._id).eq("provider", providerId))
    .collect();
  return rows.find(isEmployerRow) ?? null;
}

/** Never leak stored secrets to the client. */
function sanitize(row: Record<string, unknown>) {
  const { api_key: _apiKey, client_id: _clientId, refresh_token: _refresh, ...rest } = row;
  return { ...withId(rest as { _id: string }), has_api_key: Boolean(_apiKey || _clientId || _refresh) };
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
    return rows.filter(isEmployerRow).map(sanitize);
  },
});

type ConnectFields = {
  provider: string;
  auth_type: "board" | "api_key" | "oauth";
  subdomain?: string;
  apiKey?: string;
  clientId?: string;
  refreshToken?: string;
  region?: string;
};

async function upsertConnected(ctx: { db: any; user: { _id: string }; scheduler: any }, args: ConnectFields) {
  const existing = await getByProvider(ctx, args.provider);
  const patch = {
    ...connectedPatch(),
    auth_type: args.auth_type,
    subdomain: args.subdomain,
    region: args.region,
    ...(args.apiKey ? { api_key: args.apiKey } : {}),
    ...(args.clientId ? { client_id: args.clientId } : {}),
    ...(args.refreshToken ? { refresh_token: args.refreshToken } : {}),
  };
  let integrationId;
  if (existing) {
    await ctx.db.patch(existing._id, patch);
    integrationId = existing._id;
  } else {
    integrationId = await ctx.db.insert("ats_integrations", {
      user_id: ctx.user._id,
      provider: args.provider as never,
      kind: "employer",
      sync_jobs: true,
      sync_candidates: true,
      records_synced: 0,
      ...patch,
    });
  }
  await ctx.scheduler.runAfter(0, internal.atsSync.syncIntegration, { integrationId });
  return sanitize((await ctx.db.get(integrationId))!);
}

/** Public job-board providers (Lever, Ashby). */
export const connectBoard = authedMutation({
  args: { provider, subdomain: v.string() },
  returns: v.any(),
  handler: async (ctx, args) => {
    const subdomain = args.subdomain.trim();
    if (!subdomain) throw new Error("A board slug is required");
    return await upsertConnected(ctx, { provider: args.provider, auth_type: "board", subdomain });
  },
});

/** API-key providers (Greenhouse, BambooHR). */
export const connectApiKey = authedMutation({
  args: { provider, apiKey: v.string(), subdomain: v.string() },
  returns: v.any(),
  handler: async (ctx, args) => {
    const apiKey = args.apiKey.trim();
    const subdomain = args.subdomain.trim();
    if (!apiKey) throw new Error("API key is required");
    if (!subdomain) throw new Error("Company subdomain is required");
    return await upsertConnected(ctx, { provider: args.provider, auth_type: "api_key", subdomain, apiKey });
  },
});

/** OAuth credential providers (Zoho Recruit, Keka). */
export const connectOAuth = authedMutation({
  args: {
    provider,
    clientId: v.string(),
    clientSecret: v.string(),
    subdomain: v.optional(v.string()),
    refreshToken: v.optional(v.string()),
    region: v.optional(v.string()),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    const clientId = args.clientId.trim();
    const clientSecret = args.clientSecret.trim();
    if (!clientId || !clientSecret) throw new Error("OAuth client ID and secret are required");
    if (args.provider === "keka" && !args.subdomain?.trim()) throw new Error("Keka company subdomain is required");
    if (args.provider === "zoho_recruit" && !args.refreshToken?.trim()) throw new Error("Zoho refresh token is required");
    return await upsertConnected(ctx, {
      provider: args.provider,
      auth_type: "oauth",
      subdomain: args.subdomain?.trim(),
      apiKey: clientSecret,
      clientId,
      refreshToken: args.refreshToken?.trim(),
      region: args.region?.trim(),
    });
  },
});

/** Re-enter credentials after a token/API-key expiry. Keeps sync configuration. */
export const reconnect = authedMutation({
  args: {
    provider,
    apiKey: v.optional(v.string()),
    subdomain: v.optional(v.string()),
    clientId: v.optional(v.string()),
    clientSecret: v.optional(v.string()),
    refreshToken: v.optional(v.string()),
    region: v.optional(v.string()),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    const existing = await getByProvider(ctx, args.provider);
    if (!existing) throw new Error("Integration not found");
    await ctx.db.patch(existing._id, {
      ...connectedPatch(),
      connected_since: existing.connected_since ?? Date.now(),
      ...(args.subdomain?.trim() ? { subdomain: args.subdomain.trim() } : {}),
      ...(args.apiKey?.trim() ? { api_key: args.apiKey.trim() } : {}),
      ...(args.clientSecret?.trim() ? { api_key: args.clientSecret.trim() } : {}),
      ...(args.clientId?.trim() ? { client_id: args.clientId.trim() } : {}),
      ...(args.refreshToken?.trim() ? { refresh_token: args.refreshToken.trim() } : {}),
      ...(args.region?.trim() ? { region: args.region.trim() } : {}),
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
      kind: "employer",
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

const publicBoardReturn = v.object({
  id: v.id("ats_integrations"),
  _id: v.id("ats_integrations"),
  provider: publicBoardProvider,
  status: v.union(v.literal("connected"), v.literal("error"), v.literal("pending"), v.literal("disconnected")),
  auth_type: v.literal("board"),
  kind: v.literal("public_board"),
  subdomain: v.optional(v.string()),
  sync_jobs: v.boolean(),
  sync_candidates: v.boolean(),
  records_synced: v.number(),
  connected_since: v.optional(v.number()),
  last_synced_at: v.optional(v.number()),
  next_sync_at: v.optional(v.number()),
  error_message: v.optional(v.string()),
  error_detected_at: v.optional(v.number()),
  has_api_key: v.boolean(),
});

function asPublicBoard(row: {
  _id: Id<"ats_integrations">;
  provider: "greenhouse" | "lever" | "ashby" | string;
  status: "connected" | "error" | "pending" | "disconnected";
  auth_type: string;
  kind?: string;
  subdomain?: string;
  sync_jobs: boolean;
  sync_candidates: boolean;
  records_synced: number;
  connected_since?: number;
  last_synced_at?: number;
  next_sync_at?: number;
  error_message?: string;
  error_detected_at?: number;
}) {
  return {
    id: row._id,
    _id: row._id,
    provider: row.provider as "greenhouse" | "lever" | "ashby",
    status: row.status,
    auth_type: "board" as const,
    kind: "public_board" as const,
    subdomain: row.subdomain,
    sync_jobs: row.sync_jobs,
    sync_candidates: row.sync_candidates,
    records_synced: row.records_synced,
    connected_since: row.connected_since,
    last_synced_at: row.last_synced_at,
    next_sync_at: row.next_sync_at,
    error_message: row.error_message,
    error_detected_at: row.error_detected_at,
    has_api_key: false,
  };
}

/** Admin catalog of public career-site boards. Multiple slugs per ATS are allowed. */
export const listPublicBoards = adminQuery({
  args: {},
  returns: v.array(publicBoardReturn),
  handler: async (ctx) => {
    const rows = await ctx.db
      .query("ats_integrations")
      .withIndex("by_kind", (q) => q.eq("kind", "public_board"))
      .collect();
    return rows
      .sort((a, b) => (b.connected_since ?? b._creationTime) - (a.connected_since ?? a._creationTime))
      .map((row) => asPublicBoard(row));
  },
});

export const addPublicBoard = adminMutation({
  args: { provider: publicBoardProvider, subdomain: v.string() },
  returns: publicBoardReturn,
  handler: async (ctx, args) => {
    const subdomain = normalizePublicBoardSlug(args.subdomain);
    if (!subdomain) throw new Error("A board slug is required");
    const existing = await ctx.db
      .query("ats_integrations")
      .withIndex("by_kind_provider_subdomain", (q) => q.eq("kind", "public_board").eq("provider", args.provider).eq("subdomain", subdomain))
      .unique();
    if (existing) throw new Error(`That ${args.provider} board is already added`);
    const integrationId = await ctx.db.insert("ats_integrations", {
      user_id: ctx.user._id,
      provider: args.provider,
      kind: "public_board",
      auth_type: "board",
      subdomain,
      sync_jobs: true,
      sync_candidates: false,
      records_synced: 0,
      ...connectedPatch(),
    });
    await ctx.scheduler.runAfter(0, internal.atsSync.syncIntegration, { integrationId });
    return asPublicBoard((await ctx.db.get(integrationId))!);
  },
});

export const removePublicBoard = adminMutation({
  args: { id: v.id("ats_integrations") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.id);
    if (!existing || existing.kind !== "public_board") throw new Error("Public board not found");
    await closeMissingAtsJobs(ctx, {
      integrationId: existing._id,
      provider: existing.provider,
      liveExternalIds: new Set(),
      listComplete: true,
    });
    await ctx.db.delete(existing._id);
    return null;
  },
});
