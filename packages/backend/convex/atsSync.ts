import { v } from "convex/values";
import { internal } from "./_generated/api";
import { internalAction, internalMutation, internalQuery } from "./_generated/server";

const SYNC_INTERVAL_MS = 6 * 60 * 60 * 1000; // 6 hours

type NormalizedJob = {
  external_id: string;
  title?: string;
  description?: string;
  application_url?: string;
  company_name?: string;
  location?: string;
  departments?: string[];
  has_remote?: boolean;
  published_date?: number;
};

/* ------------------------------------------------------------------ */
/* Provider fetchers — public job-board JSON APIs, no scraping.        */
/* ------------------------------------------------------------------ */

async function fetchGreenhouse(subdomain: string): Promise<NormalizedJob[]> {
  // Public boards API: board token = company subdomain slug.
  const slug = subdomain.replace(/\.greenhouse\.io$/i, "").trim();
  const res = await fetch(`https://boards-api.greenhouse.io/v1/boards/${slug}/jobs?content=true`);
  if (!res.ok) throw new Error(`Greenhouse fetch failed: ${res.status}`);
  const data = (await res.json()) as { jobs?: any[] };
  return (data.jobs ?? []).map((j) => ({
    external_id: `gh_${slug}_${j.id}`,
    title: j.title,
    description: normalizeAtsHtml(j.content),
    application_url: j.absolute_url,
    company_name: slug,
    location: j.location?.name,
    departments: (j.departments ?? []).map((d: any) => d?.name).filter(Boolean),
    has_remote: /remote/i.test(j.location?.name ?? ""),
    published_date: j.updated_at ? new Date(j.updated_at).getTime() : undefined,
  }));
}

async function fetchLever(subdomain: string): Promise<NormalizedJob[]> {
  const slug = subdomain.replace(/\.lever\.co$/i, "").trim();
  const res = await fetch(`https://api.lever.co/v0/postings/${slug}?mode=json`);
  if (!res.ok) throw new Error(`Lever fetch failed: ${res.status}`);
  const data = (await res.json()) as any[];
  return (data ?? []).map((j) => ({
    external_id: `lever_${slug}_${j.id}`,
    title: j.text,
    description: normalizeAtsHtml(j.description ?? j.descriptionPlain),
    application_url: j.hostedUrl ?? j.applyUrl,
    company_name: slug,
    location: j.categories?.location,
    departments: [j.categories?.team, j.categories?.department].filter(Boolean),
    has_remote: /remote/i.test(j.categories?.location ?? "") || j.workplaceType === "remote",
    published_date: j.createdAt ? new Date(j.createdAt).getTime() : undefined,
  }));
}

/** Greenhouse encodes the whole posting as HTML entities (`&lt;div&gt;…`). */
function decodeHtmlEntities(value: string) {
  let text = value;
  for (let i = 0; i < 3; i++) {
    const next = text
      .replace(/&nbsp;|&#160;/gi, " ")
      .replace(/&quot;|&#34;/g, '"')
      .replace(/&apos;|&#39;/g, "'")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
      .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCharCode(parseInt(code, 16)))
      .replace(/&amp;/g, "&");
    if (next === text) break;
    text = next;
  }
  return text;
}

function normalizeAtsHtml(html?: string): string | undefined {
  if (!html) return undefined;
  let text = html.trim();
  if (/&lt;\s*\/?\s*[a-z]/i.test(text) || /&amp;lt;/.test(text)) {
    text = decodeHtmlEntities(text);
  }
  return text || undefined;
}

/* ------------------------------------------------------------------ */
/* Sync one integration.                                                */
/* ------------------------------------------------------------------ */

export const syncIntegration = internalAction({
  args: { integrationId: v.id("ats_integrations") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const integration = await ctx.runQuery(internal.atsSync.getIntegration, { id: args.integrationId });
    if (!integration || integration.status !== "connected" || !integration.sync_jobs) return null;

    const startedAt = Date.now();
    try {
      let jobs: NormalizedJob[] = [];
      if (integration.provider === "greenhouse" && integration.subdomain) {
        jobs = await fetchGreenhouse(integration.subdomain);
      } else if (integration.provider === "lever" && integration.subdomain) {
        jobs = await fetchLever(integration.subdomain);
      }
      // OAuth providers (Zoho, Keka, …) need real token exchange — not wired yet,
      // so they sync nothing until their OAuth flow is implemented.

      const { stored, needsSkills } = await ctx.runMutation(internal.jobs.storeAtsJobs, {
        integrationId: args.integrationId,
        provider: integration.provider,
        jobs,
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

/* ------------------------------------------------------------------ */
/* Internal queries/mutations used by the actions above.               */
/* ------------------------------------------------------------------ */

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
