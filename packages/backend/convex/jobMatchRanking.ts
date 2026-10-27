import { v } from "convex/values";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import {
  internalAction,
  internalMutation,
  internalQuery,
  type MutationCtx,
  type QueryCtx,
} from "./_generated/server";
import { authedMutation, authedQuery } from "./lib/customFunctions";
import { scoreJobForUser, type ScoringCareerGoal } from "./lib/jobMatchScoring";
import { buildProfileFingerprint } from "./lib/profileFingerprint";
import { ALMOST_MIN, READY_MIN } from "./lib/jobProfileMatch";
import { computeYearsExperience } from "./lib/skillMatch";
import { withSkillAliases } from "./lib/skillCatalog";

/** How many ranked jobs a cached ranking keeps. */
const TOP_K = 400;
/**
 * Jobs converted per mutation. Convex caps a single function at 1,000 IO
 * operations, and each job costs up to ~65 (job get, job_skills query, up to
 * VECTOR_SKILL_LIMIT skill gets, two relation gets, one vector lookup). 10 keeps
 * the worst case near 650.
 */
const BACKFILL_PAGE = 10;
/**
 * Retrieval bounds. The recompute scores only jobs that could plausibly place,
 * never the whole catalog: postings for the user's skills, plus career-goal
 * title matches. These caps keep one pass inside Convex's per-transaction limits.
 */
const SKILL_CHUNK = 8;
const POSTINGS_PER_SKILL = 300;
const MAX_CANDIDATES = 2000;
const VECTOR_BATCH = 200;
/** Coalesce rapid profile edits into one pass. */
const RECOMPUTE_DEBOUNCE_MS = 45_000;
/** A recompute holding the lock longer than this is assumed dead. */
const COMPUTE_STALE_MS = 10 * 60 * 1000;
/**
 * Hard per-user caps. Without these, a pathological profile (hundreds of skills,
 * resumes, or experiences) would make a single pass unbounded.
 */
const PROFILE_SKILL_LIMIT = 20;
const PROFILE_EXPERIENCE_LIMIT = 100;
const PROFILE_EDUCATION_LIMIT = 50;
const PROFILE_RESUME_LIMIT = 50;
const VECTOR_SKILL_LIMIT = 60;

type RankingEntry = {
  job_id: Id<"jobs">;
  readiness: number;
  smart_match: number;
  career_alignment?: number;
};

/** Schema-exact shape: optional fields are `undefined`, never `null`. */
type VectorSkill = {
  skill_id: Id<"skills">;
  name?: string;
  type?: "core" | "preferred" | "nice_to_have";
  proficiency?: "beginner" | "intermediate" | "advance" | "expert";
  weight?: number;
};

async function profileInputsFor(ctx: QueryCtx, userId: Id<"users">) {
  const user = await ctx.db.get(userId);
  if (!user) return null;
  const [skillRows, expRows, eduRows, resumeRows, careerGoal] = await Promise.all([
    ctx.db
      .query("user_skills")
      .withIndex("by_user", (q) => q.eq("user_id", userId))
      .take(PROFILE_SKILL_LIMIT),
    ctx.db
      .query("experiences")
      .withIndex("by_user", (q) => q.eq("user_id", userId))
      .take(PROFILE_EXPERIENCE_LIMIT),
    ctx.db
      .query("educations")
      .withIndex("by_user", (q) => q.eq("user_id", userId))
      .take(PROFILE_EDUCATION_LIMIT),
    ctx.db
      .query("resumes")
      .withIndex("by_user", (q) => q.eq("user_id", userId))
      .take(PROFILE_RESUME_LIMIT),
    ctx.db
      .query("career_goals")
      .withIndex("by_user", (q) => q.eq("user_id", userId))
      .unique(),
  ]);

  return {
    userSkills: await withSkillAliases(ctx, skillRows),
    profile: {
      yearsExperience: computeYearsExperience(expRows),
      educationCount: eduRows.length,
    },
    careerGoal: (careerGoal ?? null) as unknown as ScoringCareerGoal,
    fingerprint: buildProfileFingerprint({
      skills: skillRows,
      experiences: expRows,
      educations: eduRows,
      resumes: resumeRows,
      professionalSummary: user.professional_summary,
      about: user.about,
      careerGoal,
    }),
  };
}

/** Build or refresh the compact scoring row for one job. */
async function writeVector(ctx: MutationCtx, jobId: Id<"jobs">) {
  const job = await ctx.db.get(jobId);
  if (!job) return;

  const rows = await ctx.db
    .query("job_skills")
    .withIndex("by_job", (q) => q.eq("job_id", job._id))
    .take(VECTOR_SKILL_LIMIT);

  const skills: VectorSkill[] = [];
  let totalWeight = 0;
  for (const row of rows) {
    const skill = await ctx.db.get(row.skill_id);
    skills.push({
      skill_id: row.skill_id,
      name: skill?.name ?? undefined,
      type: row.type ?? undefined,
      proficiency: row.proficiency ?? undefined,
      weight: row.weight ?? undefined,
    });
    totalWeight += row.weight ?? 0;
  }

  const [page, jobTitle] = await Promise.all([
    job.page_id ? ctx.db.get(job.page_id) : null,
    job.job_title_id ? ctx.db.get(job.job_title_id) : null,
  ]);

  const patch = {
    job_id: job._id,
    status: job.status,
    published_date: job.published_date,
    experience: job.experience,
    title: job.title,
    company_name: job.company_name ?? page?.name,
    industry: page?.industry,
    job_title_name: jobTitle?.name,
    total_weight: totalWeight,
    skills,
    updated_at: Date.now(),
  };

  const existing = await ctx.db
    .query("job_match_vectors")
    .withIndex("by_job", (q) => q.eq("job_id", job._id))
    .first();
  if (existing) await ctx.db.patch(existing._id, patch);
  else await ctx.db.insert("job_match_vectors", patch);
}

export const upsertVector = internalMutation({
  args: { jobId: v.id("jobs") },
  returns: v.null(),
  handler: async (ctx, args) => {
    await writeVector(ctx, args.jobId);
    return null;
  },
});

/** One bounded backfill slice. Kept small so it stays inside transaction limits. */
export const backfillPage = internalMutation({
  args: { cursor: v.union(v.string(), v.null()) },
  returns: v.object({ next: v.union(v.string(), v.null()), processed: v.number() }),
  handler: async (ctx, args) => {
    const page = await ctx.db.query("jobs").paginate({
      numItems: BACKFILL_PAGE,
      cursor: args.cursor,
    });
    for (const job of page.page) {
      await writeVector(ctx, job._id);
    }
    return {
      next: page.isDone ? null : page.continueCursor,
      processed: page.page.length,
    };
  },
});

export const backfillPostingsPage = internalMutation({
  args: { cursor: v.union(v.string(), v.null()) },
  returns: v.object({
    next: v.union(v.string(), v.null()),
    rows: v.number(),
  }),
  handler: async (ctx, args) => {
    const page = await ctx.db.query("jobs").paginate({ numItems: 60, cursor: args.cursor });
    let rows = 0;
    for (const job of page.page) {
      const skills = await ctx.db
        .query("job_skills")
        .withIndex("by_job", (q) => q.eq("job_id", job._id))
        .take(VECTOR_SKILL_LIMIT);
      for (const row of skills) {
        await ctx.db.patch(row._id, { published_date: job.published_date });
        rows += 1;
      }
    }
    return {
      next: page.isDone ? null : page.continueCursor,
      rows,
    };
  },
});

/**
 * One-time backfill: stamp `published_date` onto existing postings so they can
 * be read newest-first. Run once after deploying:
 *   npx convex run jobMatchRanking:backfillPostings '{}'
 */
export const backfillPostings = internalAction({
  args: {},
  returns: v.object({ rows: v.number() }),
  handler: async (ctx) => {
    let cursor: string | null = null;
    let rows = 0;
    for (;;) {
      const res: { next: string | null; rows: number } = await ctx.runMutation(
        internal.jobMatchRanking.backfillPostingsPage,
        { cursor },
      );
      rows += res.rows;
      if (!res.next) break;
      cursor = res.next;
    }
    console.log("[jobMatchRanking] postings backfill complete", rows);
    return { rows };
  },
});

/** Pages per action run, then the action re-schedules itself. */
const BACKFILL_PAGES_PER_RUN = 300;

/**
 * Backfill every job's scoring vector. Each run covers a slice and schedules the
 * next, so it never approaches the action limit. Kick it off with:
 *   npx convex run jobMatchRanking:startBackfill '{}'
 */
export const backfill = internalAction({
  args: { cursor: v.optional(v.union(v.string(), v.null())) },
  returns: v.object({ processed: v.number(), next: v.union(v.string(), v.null()) }),
  handler: async (ctx, args) => {
    let cursor: string | null = args.cursor ?? null;
    let processed = 0;
    for (let page = 0; page < BACKFILL_PAGES_PER_RUN; page++) {
      const res: { next: string | null; processed: number } = await ctx.runMutation(
        internal.jobMatchRanking.backfillPage,
        { cursor },
      );
      processed += res.processed;
      if (!res.next) {
        console.log("[jobMatchRanking] backfill complete", processed);
        return { processed, next: null };
      }
      cursor = res.next;
    }
    // Continue in a fresh invocation so no single run approaches the action
    // limit, and so a CLI caller isn't blocked for the whole backfill.
    await ctx.scheduler.runAfter(0, internal.jobMatchRanking.backfill, { cursor });
    console.log("[jobMatchRanking] backfill continuing", processed);
    return { processed, next: cursor };
  },
});

/** Kick off the vector backfill without waiting for it to finish. */
export const startBackfill = internalMutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    await ctx.scheduler.runAfter(0, internal.jobMatchRanking.backfill, { cursor: null });
    return null;
  },
});

/**
 * Stage 1a: job ids sharing at least one of these skills. Bounded per skill so a
 * popular skill cannot blow the transaction budget.
 */
export const candidatesForSkills = internalQuery({
  args: { skillIds: v.array(v.id("skills")), perSkill: v.number() },
  returns: v.array(v.object({ job_id: v.id("jobs"), weight: v.number() })),
  handler: async (ctx, args) => {
    const pages = await Promise.all(
      args.skillIds.map(async (skillId) => {
        const rows = await ctx.db
          .query("job_skills")
          // Newest postings first, so a common skill's cap keeps current jobs
          // rather than whichever rows happen to sit earliest in the index.
          .withIndex("by_skill_and_published", (q) => q.eq("skill_id", skillId))
          .order("desc")
          .take(args.perSkill);
        return rows.map((row) => ({ job_id: row.job_id, weight: row.weight ?? 1 }));
      }),
    );
    const found: Array<{ job_id: Id<"jobs">; weight: number }> = [];
    for (const rows of pages) found.push(...rows);
    return found;
  },
});

/**
 * Stage 1b lives in `jobs.ts` so this module doesn't depend on the browse lib.
 * See `jobs.goalCandidateIds`.
 */

/** Stage 2: compact scoring rows for the retrieved candidates only. */
export const vectorsForJobs = internalQuery({
  args: { jobIds: v.array(v.id("jobs")) },
  returns: v.array(v.any()),
  handler: async (ctx, args) => {
    const rows = await Promise.all(
      args.jobIds.map((jobId) =>
        ctx.db
          .query("job_match_vectors")
          .withIndex("by_job", (q) => q.eq("job_id", jobId))
          .first(),
      ),
    );
    return rows.filter((row) => row !== null);
  },
});

export const loadRankingContext = internalQuery({
  args: { userId: v.id("users") },
  returns: v.any(),
  handler: async (ctx, args) => await profileInputsFor(ctx, args.userId),
});

export const saveRanking = internalMutation({
  args: {
    userId: v.id("users"),
    fingerprint: v.string(),
    entries: v.array(
      v.object({
        job_id: v.id("jobs"),
        readiness: v.number(),
        smart_match: v.number(),
        career_alignment: v.optional(v.number()),
      }),
    ),
    scanned: v.number(),
    readyTotal: v.number(),
    almostTotal: v.number(),
    growthTotal: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("job_match_rankings")
      .withIndex("by_user", (q) => q.eq("user_id", args.userId))
      .unique();
    const doc = {
      user_id: args.userId,
      fingerprint: args.fingerprint,
      entries: args.entries,
      scanned: args.scanned,
      ready_total: args.readyTotal,
      almost_total: args.almostTotal,
      growth_total: args.growthTotal,
      computed_at: Date.now(),
      // Releasing the lock and clearing the debounce deadline.
      computing_at: undefined,
      recompute_due_at: undefined,
    };
    if (existing) await ctx.db.patch(existing._id, doc);
    else await ctx.db.insert("job_match_rankings", doc);
    return null;
  },
});

export const recomputeState = internalQuery({
  args: { userId: v.id("users") },
  returns: v.any(),
  handler: async (ctx, args) => {
    const row = await ctx.db
      .query("job_match_rankings")
      .withIndex("by_user", (q) => q.eq("user_id", args.userId))
      .unique();
    return row
      ? {
          recompute_due_at: row.recompute_due_at ?? null,
          computing_at: row.computing_at ?? null,
        }
      : null;
  },
});

/**
 * Take the per-user recompute lock. Returns false when another pass is already
 * running, so duplicate schedules collapse into one.
 */
export const claimRecompute = internalMutation({
  args: { userId: v.id("users") },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const now = Date.now();
    const row = await ctx.db
      .query("job_match_rankings")
      .withIndex("by_user", (q) => q.eq("user_id", args.userId))
      .unique();
    if (row?.computing_at && now - row.computing_at < COMPUTE_STALE_MS) return false;
    if (row) {
      await ctx.db.patch(row._id, { computing_at: now });
      return true;
    }
    // No row yet: insert a placeholder that also holds the lock.
    await ctx.db.insert("job_match_rankings", {
      user_id: args.userId,
      fingerprint: "",
      entries: [],
      scanned: 0,
      ready_total: 0,
      almost_total: 0,
      growth_total: 0,
      computed_at: 0,
      computing_at: now,
    });
    return true;
  },
});

/**
 * Rebuild one user's ranking from the jobs that can actually place, not the
 * whole catalog:
 *   1a. jobs sharing at least one of their skills  → bounds the Ready tier
 *   1b. jobs matching their career-goal titles     → bounds the Almost tier,
 *       which career alignment can reach without skill overlap
 *   2.  exact scoring on those candidates only
 */
export const recompute = internalAction({
  args: { userId: v.id("users") },
  returns: v.object({ scanned: v.number(), kept: v.number(), candidates: v.number() }),
  handler: async (ctx, args) => {
    const idle = { scanned: 0, kept: 0, candidates: 0 };
    const state: { recompute_due_at: number | null; computing_at: number | null } | null =
      await ctx.runQuery(internal.jobMatchRanking.recomputeState, { userId: args.userId });

    // A missing row is the normal first run: there is no deadline to honour and
    // no lock to respect. `claimRecompute` creates the row.
    const now = Date.now();
    if (state && typeof state.recompute_due_at === "number" && now < state.recompute_due_at) {
      await ctx.scheduler.runAfter(
        state.recompute_due_at - now,
        internal.jobMatchRanking.recompute,
        { userId: args.userId },
      );
      return idle;
    }

    // One pass per user at a time.
    const claimed = await ctx.runMutation(internal.jobMatchRanking.claimRecompute, {
      userId: args.userId,
    });
    if (!claimed) return idle;

    const context = await ctx.runQuery(internal.jobMatchRanking.loadRankingContext, {
      userId: args.userId,
    });
    if (!context) return idle;

    const weights = new Map<Id<"jobs">, number>();

    // Stage 1a — skill overlap. Accumulate matched weight so the strongest
    // candidates survive the cap, rather than whichever postings came first.
    // `MAX_USER_SKILLS` is hard-capped at 20 by `userSkills.create/update`, so
    // the whole skill set is always scanned. No ordering or rarity heuristic is
    // needed — every skill contributes postings to the same candidate pool.
    const skillIds = (context.userSkills as Array<{ skill_id: string }>).map(
      (skill) => skill.skill_id as Id<"skills">,
    );
    for (let i = 0; i < skillIds.length; i += SKILL_CHUNK) {
      const chunk = skillIds.slice(i, i + SKILL_CHUNK);
      const found: Array<{ job_id: Id<"jobs">; weight: number }> = await ctx.runQuery(
        internal.jobMatchRanking.candidatesForSkills,
        { skillIds: chunk, perSkill: POSTINGS_PER_SKILL },
      );
      for (const row of found) {
        weights.set(row.job_id, (weights.get(row.job_id) ?? 0) + row.weight);
      }
    }

    // Stage 1b — career-goal titles. Career alignment can lift a job with no
    // skill overlap into the Almost tier, so these join with zero weight.
    const goalIds: Id<"jobs">[] = await ctx.runQuery(
      internal.jobs.goalCandidateIds,
      { userId: args.userId },
    );
    for (const jobId of goalIds) if (!weights.has(jobId)) weights.set(jobId, 0);

    // Strongest overlap first, then cap.
    const ids = [...weights.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, MAX_CANDIDATES)
      .map(([jobId]) => jobId);
    let scanned = 0;
    let readyTotal = 0;
    let almostTotal = 0;
    let growthTotal = 0;
    const scored: RankingEntry[] = [];

    for (let i = 0; i < ids.length; i += VECTOR_BATCH) {
      const batch = ids.slice(i, i + VECTOR_BATCH);
      const vectors: any[] = await ctx.runQuery(internal.jobMatchRanking.vectorsForJobs, {
        jobIds: batch,
      });
      for (const vector of vectors) {
        if (vector.status !== "open") continue;
        const result = scoreJobForUser(
          {
            experience: vector.experience,
            title: vector.title,
            company_name: vector.company_name,
            industry: vector.industry,
            job_title_name: vector.job_title_name,
          },
          vector.skills ?? [],
          context.userSkills,
          context.profile,
          context.careerGoal,
        );
        scanned += 1;
        if (result.readiness == null || result.smartMatch == null) continue;
        if (result.smartMatch >= READY_MIN) readyTotal += 1;
        else if (result.smartMatch >= ALMOST_MIN) almostTotal += 1;
        else growthTotal += 1;
        scored.push({
          job_id: vector.job_id,
          readiness: result.readiness,
          smart_match: result.smartMatch,
          ...(result.careerAlignment != null ? { career_alignment: result.careerAlignment } : {}),
        });
      }
    }

    scored.sort((a, b) => b.smart_match - a.smart_match);
    const entries = scored.slice(0, TOP_K);
    await ctx.runMutation(internal.jobMatchRanking.saveRanking, {
      userId: args.userId,
      fingerprint: context.fingerprint,
      entries,
      scanned,
      readyTotal,
      almostTotal,
      growthTotal,
    });
    return { scanned, kept: entries.length, candidates: ids.length };
  },
});

export type CachedRanking = {
  entries: RankingEntry[];
  counts: { ready: number; almost: number; growth: number };
  scanned: number;
  computed_at: number;
} | null;

/**
 * One indexed read. Freshness is deliberately NOT checked here: the stored
 * entries are always safe to serve, and checking the profile fingerprint costs
 * hundreds of reads on every page load. Invalidation lives in
 * `requestRecompute`, which runs once per mount and is the authoritative check.
 */
export async function rankingForUser(
  ctx: QueryCtx,
  userId: Id<"users">,
): Promise<CachedRanking> {
  const row = await ctx.db
    .query("job_match_rankings")
    .withIndex("by_user", (q) => q.eq("user_id", userId))
    .unique();
  if (!row) return null;
  return {
    entries: row.entries,
    counts: { ready: row.ready_total, almost: row.almost_total, growth: row.growth_total },
    scanned: row.scanned,
    computed_at: row.computed_at,
  };
}

/** Cached ranking for the signed-in user (one indexed read). */
export const getRanking = authedQuery({
  args: {},
  returns: v.any(),
  handler: async (ctx) => await rankingForUser(ctx, ctx.user._id),
});

/** Queue a recompute unless the cached ranking already matches the profile. */
export const requestRecompute = authedMutation({
  args: {},
  returns: v.object({ queued: v.boolean() }),
  handler: async (ctx) => {
    const inputs = await profileInputsFor(ctx, ctx.user._id);
    if (!inputs) return { queued: false };
    const existing = await ctx.db
      .query("job_match_rankings")
      .withIndex("by_user", (q) => q.eq("user_id", ctx.user._id))
      .unique();
    if (existing?.fingerprint === inputs.fingerprint) return { queued: false };

    const due = Date.now() + RECOMPUTE_DEBOUNCE_MS;
    if (existing) {
      // Push the deadline out. Any run already scheduled will re-check it and
      // reschedule itself, so rapid edits collapse into a single pass.
      await ctx.db.patch(existing._id, { recompute_due_at: due });
    } else {
      await ctx.db.insert("job_match_rankings", {
        user_id: ctx.user._id,
        fingerprint: "",
        entries: [],
        scanned: 0,
        ready_total: 0,
        almost_total: 0,
        growth_total: 0,
        computed_at: 0,
        recompute_due_at: due,
      });
    }
    await ctx.scheduler.runAfter(RECOMPUTE_DEBOUNCE_MS, internal.jobMatchRanking.recompute, {
      userId: ctx.user._id,
    });
    return { queued: true };
  },
});

/** Ops check: how many vectors exist and what the cached rankings contain. */
export const stats = internalQuery({
  args: {},
  returns: v.any(),
  handler: async (ctx) => {
    const vectors = await ctx.db.query("job_match_vectors").take(4000);
    const rankings = await ctx.db.query("job_match_rankings").take(20);
    return {
      vectors: vectors.length,
      openVectors: vectors.filter((vector) => vector.status === "open").length,
      rankings: rankings.map((row) => ({
        user_id: row.user_id,
        scanned: row.scanned,
        ready: row.ready_total,
        almost: row.almost_total,
        growth: row.growth_total,
        cached: row.entries.length,
        top_readiness: row.entries.slice(0, 5).map((entry) => entry.readiness),
        computed_at: row.computed_at,
        computing_at: row.computing_at ?? null,
        recompute_due_at: row.recompute_due_at ?? null,
      })),
    };
  },
});
