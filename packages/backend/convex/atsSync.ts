import { v } from "convex/values";
import { internal } from "./_generated/api";
import { internalAction, internalMutation, internalQuery } from "./_generated/server";

const SYNC_INTERVAL_MS = 6 * 60 * 60 * 1000; // 6 hours

type WorkplaceType = "on-site" | "hybrid" | "remote";

type NormalizedJob = {
  external_id: string;
  title?: string;
  description?: string;
  application_url?: string;
  company_name?: string;
  company_logo?: string;
  company_website_url?: string;
  location?: string;
  departments?: string[];
  has_remote?: boolean;
  workplace_type?: WorkplaceType;
  work_type?: string;
  language?: string;
  salary_min?: number;
  salary_max?: number;
  salary_currency?: string;
  published_date?: number;
};

/* ------------------------------------------------------------------ */
/* Provider fetchers — public job-board JSON APIs, no scraping.        */
/* ------------------------------------------------------------------ */

function titleCaseCompany(name: string) {
  const trimmed = name.replace(/[-_]+/g, " ").replace(/\s+/g, " ").trim();
  if (!trimmed) return name;
  if (/[a-z]/.test(trimmed) && /[A-Z]/.test(trimmed)) return trimmed;
  return trimmed
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

function logoForDomain(domain?: string) {
  return domain ? `https://www.google.com/s2/favicons?sz=128&domain=${encodeURIComponent(domain)}` : undefined;
}

function companyDomain(applicationUrl?: string, slug?: string) {
  if (applicationUrl) {
    try {
      const host = new URL(applicationUrl).hostname.replace(/^www\./i, "");
      if (!/(^|\.)greenhouse\.io$/i.test(host) && !/(^|\.)lever\.co$/i.test(host)) {
        const parts = host.split(".");
        return parts.length >= 2 ? parts.slice(-2).join(".") : host;
      }
    } catch {
      /* ignore invalid apply URLs */
    }
  }
  if (slug && /^[a-z0-9-]+$/i.test(slug)) return `${slug.toLowerCase()}.com`;
  return undefined;
}

function metadataValues(metadata: unknown) {
  const out: Record<string, string> = {};
  if (!Array.isArray(metadata)) return out;
  for (const row of metadata) {
    if (!row || typeof row !== "object" || !("name" in row)) continue;
    const name = String((row as { name?: unknown }).name ?? "").trim().toLowerCase();
    const value = (row as { value?: unknown }).value;
    if (name && value != null && value !== "") out[name] = String(value);
  }
  return out;
}

function workplaceFromLabel(value?: string): WorkplaceType | undefined {
  if (!value) return undefined;
  const v = value.toLowerCase().replace(/[_-]+/g, " ");
  if (v.includes("hybrid")) return "hybrid";
  if (v.includes("remote")) return "remote";
  if (v.includes("on site") || v.includes("onsite") || v.includes("office")) return "on-site";
  return undefined;
}

function workTypeFromLabel(value?: string) {
  if (!value) return undefined;
  const v = value.toLowerCase();
  if (v.includes("full")) return "Full-time";
  if (v.includes("part")) return "Part-time";
  if (v.includes("intern")) return "Internship";
  if (v.includes("contract") || v.includes("temp")) return "Contract";
  return value;
}

function payFromRanges(ranges: unknown) {
  if (!Array.isArray(ranges) || ranges.length === 0) return {};
  const first = ranges[0] as { min_cents?: number; max_cents?: number; currency_type?: string };
  return {
    salary_min: typeof first.min_cents === "number" ? first.min_cents / 100 : undefined,
    salary_max: typeof first.max_cents === "number" ? first.max_cents / 100 : undefined,
    salary_currency: first.currency_type,
  };
}

async function fetchGreenhouse(subdomain: string): Promise<NormalizedJob[]> {
  const slug = subdomain.replace(/\.greenhouse\.io$/i, "").trim();
  const [boardRes, jobsRes] = await Promise.all([
    fetch(`https://boards-api.greenhouse.io/v1/boards/${slug}`),
    fetch(`https://boards-api.greenhouse.io/v1/boards/${slug}/jobs?content=true`),
  ]);
  if (!jobsRes.ok) throw new Error(`Greenhouse fetch failed: ${jobsRes.status}`);
  const board = boardRes.ok ? ((await boardRes.json()) as { name?: string }) : {};
  const data = (await jobsRes.json()) as { jobs?: Array<Record<string, unknown>> };
  return (data.jobs ?? []).map((j) => {
    const location = String((j.location as { name?: string } | undefined)?.name ?? "").trim() || undefined;
    const application_url = typeof j.absolute_url === "string" ? j.absolute_url : undefined;
    const domain = companyDomain(application_url, slug);
    const meta = metadataValues(j.metadata);
    const workplace =
      workplaceFromLabel(meta["workplace type"] ?? meta.workplace) ??
      (location && /remote/i.test(location) ? "remote" : undefined);
    const pay = payFromRanges(j.pay_input_ranges);
    const departments = ((j.departments as Array<{ name?: string }> | undefined) ?? []).map((d) => d.name).filter((name): name is string => Boolean(name));
    const company_name = titleCaseCompany(String(j.company_name || board.name || slug));
    const published = typeof j.first_published === "string" ? j.first_published : typeof j.updated_at === "string" ? j.updated_at : undefined;
    return {
      external_id: `gh_${slug}_${j.id}`,
      title: typeof j.title === "string" ? j.title : undefined,
      description: normalizeAtsHtml(typeof j.content === "string" ? j.content : undefined),
      application_url,
      company_name,
      company_logo: logoForDomain(domain),
      company_website_url: domain ? `https://${domain}` : undefined,
      location,
      departments,
      has_remote: workplace === "remote" || /remote/i.test(location ?? ""),
      workplace_type: workplace,
      work_type: workTypeFromLabel(meta["employment type"] ?? meta["job type"] ?? meta.type),
      language: typeof j.language === "string" ? j.language : undefined,
      published_date: published ? new Date(published).getTime() : undefined,
      ...pay,
    };
  });
}

async function fetchLever(subdomain: string): Promise<NormalizedJob[]> {
  const slug = subdomain.replace(/\.lever\.co$/i, "").trim();
  const res = await fetch(`https://api.lever.co/v0/postings/${slug}?mode=json`);
  if (!res.ok) throw new Error(`Lever fetch failed: ${res.status}`);
  const data = (await res.json()) as Array<Record<string, unknown>>;
  const domain = companyDomain(undefined, slug);
  return (data ?? []).map((j) => {
    const categories = (j.categories as { location?: string; team?: string; department?: string; commitment?: string } | undefined) ?? {};
    const application_url = typeof j.hostedUrl === "string" ? j.hostedUrl : typeof j.applyUrl === "string" ? j.applyUrl : undefined;
    const location = categories.location;
    const workplace = workplaceFromLabel(typeof j.workplaceType === "string" ? j.workplaceType : undefined) ?? (location && /remote/i.test(location) ? "remote" : undefined);
    return {
      external_id: `lever_${slug}_${j.id}`,
      title: typeof j.text === "string" ? j.text : undefined,
      description: normalizeAtsHtml(typeof j.description === "string" ? j.description : typeof j.descriptionPlain === "string" ? j.descriptionPlain : undefined),
      application_url,
      company_name: titleCaseCompany(slug),
      company_logo: logoForDomain(domain),
      company_website_url: domain ? `https://${domain}` : undefined,
      location,
      departments: [categories.team, categories.department].filter((name): name is string => Boolean(name)),
      has_remote: workplace === "remote",
      workplace_type: workplace,
      work_type: workTypeFromLabel(categories.commitment),
      published_date: typeof j.createdAt === "number" ? j.createdAt : undefined,
    };
  });
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
