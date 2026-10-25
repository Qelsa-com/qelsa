import { generateText } from "ai";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { internalAction, internalMutation, internalQuery, type ActionCtx } from "./_generated/server";
import { AI_AGENT_MODEL, createChatModel, openRouter } from "./lib/ai";
import { companyProfileSeed, type CompanyProfileSeed } from "./lib/companyProfile";
import { clipPlainText } from "./lib/skillMatch";

const MAX_ATTEMPTS = 2;
const QUEUE_BATCH = 4;
const STALE_CLAIM_MS = 10 * 60 * 1000;
const RETRY_MS = 7 * 24 * 60 * 60 * 1000;
const MIN_WEBSITE_DESCRIPTION = 70;
const MAX_DESCRIPTION_CHARS = 320;

const seedValidator = v.object({
  key: v.string(),
  name: v.string(),
  website: v.optional(v.string()),
  sampleJobId: v.optional(v.id("jobs")),
});

const claimValidator = v.object({
  profileId: v.id("company_profiles"),
  key: v.string(),
  name: v.string(),
  website: v.optional(v.string()),
  sample_job_id: v.optional(v.id("jobs")),
});

type Claim = {
  profileId: Id<"company_profiles">;
  key: string;
  name: string;
  website?: string;
  sample_job_id?: Id<"jobs">;
};

type ScannedJob = {
  id: Id<"jobs">;
  name?: string;
  website?: string;
  page_id?: Id<"pages">;
};

const field = (tag: string, name: string) => {
  const match = tag.match(new RegExp(`${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, "i"));
  return match?.[1] ?? match?.[2] ?? match?.[3];
};

function decodeEntities(value: string) {
  return value.replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (entity, code: string) => {
    if (code.startsWith("#x") || code.startsWith("#X")) {
      const point = Number.parseInt(code.slice(2), 16);
      return Number.isFinite(point) ? String.fromCodePoint(point) : entity;
    }
    if (code.startsWith("#")) {
      const point = Number.parseInt(code.slice(1), 10);
      return Number.isFinite(point) ? String.fromCodePoint(point) : entity;
    }
    const named: Record<string, string> = {
      amp: "&",
      apos: "'",
      gt: ">",
      lt: "<",
      nbsp: " ",
      quot: '"',
      rsquo: "’",
      ldquo: "“",
      rdquo: "”",
      lsquo: "‘",
    };
    return named[code.toLowerCase()] ?? entity;
  });
}

function cleanDescription(raw: string) {
  const text = decodeEntities(raw)
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\s*(Start free|Learn more|Get started|Book a demo|Contact us|Sign up)\.?\s*$/i, "")
    .trim();
  if (!text) return "";
  if (text.length <= MAX_DESCRIPTION_CHARS) return /[.!?]$/.test(text) ? text : `${text}.`;

  const sentences = text.match(/[^.!?]+[.!?]+(?:\s|$)/g) ?? [];
  let complete = "";
  for (const sentence of sentences) {
    const next = `${complete} ${sentence}`.trim();
    if (next.length > MAX_DESCRIPTION_CHARS) break;
    complete = next;
  }
  if (complete.length >= 80) return complete;

  const clipped = text
    .slice(0, MAX_DESCRIPTION_CHARS - 1)
    .replace(/\s+\S*$/, "")
    .trim();
  return `${clipped}${/[.!?]$/.test(clipped) ? "" : "…"}`;
}

function descriptionFromHtml(html: string) {
  const tags = html.match(/<meta\b[^>]*>/gi) ?? [];
  let description: string | undefined;
  let twitter: string | undefined;
  for (const tag of tags) {
    const key = (field(tag, "property") ?? field(tag, "name") ?? "").toLowerCase();
    const content = field(tag, "content");
    if (!content) continue;
    if (key === "og:description") {
      const cleaned = cleanDescription(content);
      if (cleaned.length >= MIN_WEBSITE_DESCRIPTION) return cleaned;
    } else if (key === "description") {
      description ??= content;
    } else if (key === "twitter:description") {
      twitter ??= content;
    }
  }
  for (const candidate of [description, twitter]) {
    if (!candidate) continue;
    const cleaned = cleanDescription(candidate);
    if (cleaned.length >= MIN_WEBSITE_DESCRIPTION) return cleaned;
  }
  return undefined;
}

function companyExcerptFromJob(description: string, companyName: string) {
  const text = decodeEntities(
    description
      .replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/gi, " ")
      .replace(/<\s*br\s*\/?>/gi, "\n")
      .replace(/<\/(p|div|section|h[1-6]|li|tr)>/gi, "\n")
      .replace(/<[^>]+>/g, " "),
  )
    .replace(/\r/g, "")
    .replace(/[ \t]+/g, " ")
    .replace(/\n[ \t]+/g, "\n")
    .replace(/\n{2,}/g, "\n")
    .trim();
  if (!text) return undefined;

  const name = companyName.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  if (!name) return undefined;
  const nameVariants = [...new Set([name, name.split(" ")[0]])].filter((value) => value.length >= 4);
  const stop = /^(about the role|role overview|the role|responsibilities|what you(?:'|’)ll do|requirements|qualifications|benefits|what we offer|why join|job description|skills|experience|about the team)\b/i;
  const companySignal = /\b(we|our|company|platform|software|provide|build|is an?|offer|help|enable|product|service|mission|team)\b/i;
  const sentences = text
    .replace(/\n+/g, " ")
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);

  for (let i = 0; i < Math.min(sentences.length, 24); i++) {
    const sentence = sentences[i];
    if (sentence.length < 60 || !companySignal.test(sentence)) continue;
    if (!nameVariants.some((variant) => sentence.toLowerCase().includes(variant))) continue;
    if (stop.test(sentence)) continue;
    const paragraphs = [sentence];
    for (let j = i + 1; j < sentences.length && paragraphs.length < 2; j++) {
      const next = sentences[j];
      if (stop.test(next) || !companySignal.test(next)) break;
      if (next.length >= 45) paragraphs.push(next);
    }
    const excerpt = cleanDescription(paragraphs.join(" "));
    if (excerpt.length >= 100) return excerpt;
  }
  return undefined;
}

async function fetchWebsiteDescription(website: string) {
  try {
    const res = await fetch(website, {
      redirect: "follow",
      headers: {
        Accept: "text/html,application/xhtml+xml",
        "User-Agent": "QelsaCompanyProfile/1.0",
      },
      signal: AbortSignal.timeout(8_000),
    });
    if (!res.ok) return undefined;
    const contentType = res.headers.get("content-type") ?? "";
    if (!/html/i.test(contentType)) return undefined;
    const html = (await res.text()).slice(0, 400_000);
    return descriptionFromHtml(html);
  } catch {
    return undefined;
  }
}

function normalizeLlmDescription(raw: string) {
  return cleanDescription(
    raw
      .replace(/^["'“”]+|["'“”]+$/g, "")
      .replace(/^(company description|about [^:]{1,60}):\s*/i, "")
      .trim(),
  );
}

/** Insert missing profiles and wake the queue. Existing/ready profiles never spend tokens again. */
export const ensureProfiles = internalMutation({
  args: { seeds: v.array(seedValidator) },
  returns: v.object({ queued: v.number() }),
  handler: async (ctx, args) => {
    const now = Date.now();
    const unique = new Map<string, CompanyProfileSeed>();
    for (const seed of args.seeds) {
      if (!seed.key || !seed.name) continue;
      if (!unique.has(seed.key)) unique.set(seed.key, seed);
    }

    let queued = 0;
    let wakeQueue = false;
    for (const seed of unique.values()) {
      const existing = await ctx.db
        .query("company_profiles")
        .withIndex("by_key", (q) => q.eq("key", seed.key))
        .unique();

      if (existing) {
        if (existing.status === "pending") wakeQueue = true;
        if (existing.status === "processing" && (!existing.claimed_at || now - existing.claimed_at > STALE_CLAIM_MS)) {
          await ctx.db.patch(existing._id, { status: "pending", claimed_at: undefined });
          wakeQueue = true;
        }
        if (existing.status === "error" && existing.attempts < MAX_ATTEMPTS && (!existing.next_retry_at || existing.next_retry_at <= now)) {
          await ctx.db.patch(existing._id, {
            status: "pending",
            claimed_at: undefined,
            next_retry_at: undefined,
            last_error: undefined,
          });
          queued += 1;
          wakeQueue = true;
        }
        continue;
      }

      await ctx.db.insert("company_profiles", {
        key: seed.key,
        name: seed.name,
        website: seed.website,
        sample_job_id: seed.sampleJobId,
        status: "pending",
        attempts: 0,
      });
      queued += 1;
      wakeQueue = true;
    }

    if (wakeQueue) {
      await ctx.scheduler.runAfter(0, internal.companyProfiles.processQueue, {});
    }
    return { queued };
  },
});

export const claimProfiles = internalMutation({
  args: { limit: v.number() },
  returns: v.array(claimValidator),
  handler: async (ctx, args) => {
    const limit = Math.max(1, Math.min(20, Math.floor(args.limit)));
    const now = Date.now();
    const pending = await ctx.db
      .query("company_profiles")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .take(limit);
    const stale =
      pending.length < limit
        ? (await ctx.db
            .query("company_profiles")
            .withIndex("by_status", (q) => q.eq("status", "processing"))
            .take(limit * 3)).filter((row) => row.claimed_at != null && now - row.claimed_at > STALE_CLAIM_MS)
        : [];

    const claims: Array<{
      profileId: Id<"company_profiles">;
      key: string;
      name: string;
      website?: string;
      sample_job_id?: Id<"jobs">;
    }> = [];
    for (const row of [...pending, ...stale]) {
      if (claims.length >= limit) break;
      await ctx.db.patch(row._id, { status: "processing", claimed_at: now });
      claims.push({
        profileId: row._id,
        key: row.key,
        name: row.name,
        website: row.website,
        sample_job_id: row.sample_job_id,
      });
    }
    return claims;
  },
});

export const markProfileReady = internalMutation({
  args: {
    profileId: v.id("company_profiles"),
    description: v.string(),
    source: v.union(v.literal("website"), v.literal("job"), v.literal("llm")),
    model: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.profileId, {
      description: args.description,
      status: "ready",
      source: args.source,
      model: args.model,
      generated_at: Date.now(),
      claimed_at: undefined,
      last_error: undefined,
      next_retry_at: undefined,
    });
    return null;
  },
});

export const markProfileError = internalMutation({
  args: { profileId: v.id("company_profiles"), message: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const profile = await ctx.db.get(args.profileId);
    if (!profile) return null;
    const attempts = profile.attempts + 1;
    await ctx.db.patch(profile._id, {
      status: "error",
      attempts,
      last_error: args.message.slice(0, 400),
      claimed_at: undefined,
      next_retry_at: attempts < MAX_ATTEMPTS ? Date.now() + RETRY_MS : undefined,
    });
    return null;
  },
});

/** Re-run a cached profile after changing generation logic; used by ops/backfill. */
export const refreshProfile = internalMutation({
  args: { key: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const row = await ctx.db
      .query("company_profiles")
      .withIndex("by_key", (q) => q.eq("key", args.key))
      .unique();
    if (!row) return null;
    await ctx.db.patch(row._id, {
      status: "pending",
      description: undefined,
      source: undefined,
      model: undefined,
      generated_at: undefined,
      attempts: 0,
      last_error: undefined,
      claimed_at: undefined,
      next_retry_at: undefined,
    });
    await ctx.scheduler.runAfter(0, internal.companyProfiles.processQueue, {});
    return null;
  },
});

export const getSampleJob = internalQuery({
  args: { jobId: v.optional(v.id("jobs")), name: v.string() },
  returns: v.union(v.object({ title: v.string(), description: v.string() }), v.null()),
  handler: async (ctx, args) => {
    if (args.jobId) {
      const job = await ctx.db.get(args.jobId);
      if (job?.description) {
        return { title: job.title ?? "Role", description: job.description.slice(0, 12_000) };
      }
    }
    const rows = await ctx.db
      .query("jobs")
      .withSearchIndex("search_company", (q) => q.search("company_name", args.name).eq("status", "open"))
      .take(5);
    const match = rows.find((row) => row.description?.trim());
    return match?.description
      ? { title: match.title ?? "Role", description: match.description.slice(0, 12_000) }
      : null;
  },
});

export const hasWork = internalQuery({
  args: {},
  returns: v.object({ pending: v.boolean(), stale: v.boolean() }),
  handler: async (ctx) => {
    const now = Date.now();
    const pending = await ctx.db
      .query("company_profiles")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .first();
    const processing = await ctx.db
      .query("company_profiles")
      .withIndex("by_status", (q) => q.eq("status", "processing"))
      .take(20);
    return {
      pending: Boolean(pending),
      stale: processing.some((row) => row.claimed_at != null && now - row.claimed_at > STALE_CLAIM_MS),
    };
  },
});

async function generateProfile(ctx: ActionCtx, claim: Claim) {
  try {
    const websiteDescription = claim.website ? await fetchWebsiteDescription(claim.website) : undefined;
    if (websiteDescription) {
      await ctx.runMutation(internal.companyProfiles.markProfileReady, {
        profileId: claim.profileId,
        description: websiteDescription,
        source: "website",
      });
      return;
    }

    const sample = await ctx.runQuery(internal.companyProfiles.getSampleJob, {
      jobId: claim.sample_job_id,
      name: claim.name,
    });
    const excerpt = sample?.description ? companyExcerptFromJob(sample.description, claim.name) : undefined;
    if (excerpt) {
      await ctx.runMutation(internal.companyProfiles.markProfileReady, {
        profileId: claim.profileId,
        description: excerpt,
        source: "job",
      });
      return;
    }
    if (!openRouter) throw new Error("No website description and OPENROUTER_API_KEY is not configured.");
    if (!sample?.description) throw new Error("No usable website or job description source.");

    const model = process.env.AI_COMPANY_PROFILE_MODEL?.trim() || AI_AGENT_MODEL;
    const response = await generateText({
      model: createChatModel(model, "low"),
      prompt: `Write a factual company summary for a job board.
Use only the information below. Do not invent funding, size, customers, awards, history, or claims. Do not use first person, marketing calls to action, headings, bullets, or quotes.
Return two complete sentences, at most 280 characters.

Company: ${claim.name}
Website: ${claim.website ?? "unknown"}
Website metadata: ${websiteDescription ?? "none"}
Job posting excerpt:
${clipPlainText(sample.description, 3_500)}`,
      temperature: 0.2,
      maxOutputTokens: 300,
      maxRetries: 1,
      timeout: { totalMs: 45_000 },
    });
    const description = normalizeLlmDescription(response.text);
    if (description.length < 80) throw new Error("The generated company description was too short.");
    await ctx.runMutation(internal.companyProfiles.markProfileReady, {
      profileId: claim.profileId,
      description,
      source: "llm",
      model,
    });
  } catch (error) {
    await ctx.runMutation(internal.companyProfiles.markProfileError, {
      profileId: claim.profileId,
      message: error instanceof Error ? error.message : "Company profile generation failed.",
    });
  }
}

export const processQueue = internalAction({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const claims = (await ctx.runMutation(internal.companyProfiles.claimProfiles, { limit: QUEUE_BATCH })) as Claim[];
    await Promise.allSettled(claims.map((claim) => generateProfile(ctx, claim)));

    const work = await ctx.runQuery(internal.companyProfiles.hasWork, {});
    if (work.pending) {
      await ctx.scheduler.runAfter(1_000, internal.companyProfiles.processQueue, {});
    } else if (work.stale) {
      await ctx.scheduler.runAfter(60_000, internal.companyProfiles.processQueue, {});
    }
    return null;
  },
});

export const scanJobsPage = internalQuery({
  args: { cursor: v.union(v.string(), v.null()), numItems: v.number() },
  returns: v.object({
    jobs: v.array(
      v.object({
        id: v.id("jobs"),
        name: v.optional(v.string()),
        website: v.optional(v.string()),
        page_id: v.optional(v.id("pages")),
      }),
    ),
    continueCursor: v.union(v.string(), v.null()),
    isDone: v.boolean(),
  }),
  handler: async (ctx, args) => {
    const page = await ctx.db.query("jobs").paginate({
      cursor: args.cursor,
      numItems: Math.max(1, Math.min(500, Math.floor(args.numItems))),
    });
    return {
      jobs: page.page.map((job) => ({
        id: job._id,
        name: job.company_name,
        website: job.company_website_url,
        page_id: job.page_id,
      })),
      continueCursor: page.continueCursor,
      isDone: page.isDone,
    };
  },
});

/**
 * One-time backfill for companies ingested before profiles existed. It only
 * enqueues seeds; the queue does the network/LLM work separately.
 *
 *   npx convex run companyProfiles:backfill '{}'
 */
export const backfill = internalAction({
  args: { cursor: v.optional(v.union(v.string(), v.null())), pages: v.optional(v.number()) },
  returns: v.object({ scanned: v.number(), queued: v.number(), done: v.boolean() }),
  handler: async (ctx, args) => {
    const pages = Math.max(1, Math.min(50, Math.floor(args.pages ?? 10)));
    let cursor = args.cursor ?? null;
    let scanned = 0;
    let queued = 0;

    for (let i = 0; i < pages; i++) {
      const page = await ctx.runQuery(internal.companyProfiles.scanJobsPage, { cursor, numItems: 250 });
      const jobs = (page.jobs ?? []) as ScannedJob[];
      scanned += jobs.length;
      const seeds = jobs
        .filter((job) => !job.page_id && job.name)
        .map((job) => companyProfileSeed({ name: job.name, website: job.website, sampleJobId: job.id }))
        .filter((seed): seed is CompanyProfileSeed => Boolean(seed));
      if (seeds.length > 0) {
        const result = await ctx.runMutation(internal.companyProfiles.ensureProfiles, { seeds });
        queued += result.queued;
      }
      if (page.isDone) return { scanned, queued, done: true };
      cursor = page.continueCursor;
    }

    await ctx.scheduler.runAfter(0, internal.companyProfiles.backfill, { cursor, pages });
    return { scanned, queued, done: false };
  },
});
