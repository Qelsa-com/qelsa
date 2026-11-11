import type { Doc, Id } from "../_generated/dataModel";
import type { QueryCtx } from "../_generated/server";
import { iso, withId } from "./helpers";
import { calculateCareerAlignment, calculateSmartMatch } from "./careerAlignment";
import { isAlmostThere, roundedReadiness, titleSimilarity, titleTokens, type UserRoleProfile } from "./jobProfileMatch";
import {
  jobFunctionForJob,
  relatedExperienceScore,
  type ExperienceProfile,
} from "./experienceMatch";
import { jobSalaryUsd } from "./salary";
import { buildCompetencyFramework, closingGap, type ClosingGap } from "./skillMatch";
import { scoreJobForUser } from "./jobMatchScoring";
import { jobFromVector, skillsFromVector } from "./scoringVector";

/** Newest-open scan for ranked browse. Indexed `take`, not `.collect()`. */
export const BROWSE_SCAN = 160;
/** Skill rows per job are enough for a stable readiness rank. */
export const SCORE_SKILL_TAKE = 20;
/** Non-paginated rails (Smart Matches) only need a bounded head. */
export const SEARCH_CANDIDATE_CAP = 800;

export type BrowseCandidate = {
  job: Doc<"jobs">;
  readiness: number | null;
  careerAlignment?: number | null;
  smartMatch?: number | null;
  gap?: ClosingGap | null;
};

export type RelationCache = {
  pages: Map<Id<"pages">, Doc<"pages"> | null>;
  cities: Map<Id<"cities">, Doc<"cities"> | null>;
  titles: Map<Id<"job_titles">, Doc<"job_titles"> | null>;
  states: Map<Id<"states">, Doc<"states"> | null>;
};

export function emptyRelationCache(): RelationCache {
  return {
    pages: new Map(),
    cities: new Map(),
    titles: new Map(),
    states: new Map(),
  };
}

async function getCached<Table extends "pages" | "cities" | "job_titles" | "states">(
  ctx: QueryCtx,
  cache: Map<Id<Table>, Doc<Table> | null>,
  id: Id<Table> | undefined,
): Promise<Doc<Table> | null> {
  if (!id) return null;
  if (cache.has(id)) return cache.get(id) ?? null;
  const doc = await ctx.db.get(id);
  cache.set(id, doc);
  return doc;
}

/** One indexed read per distinct city — never N sequential gets in a job loop. */
export async function prefetchCities(ctx: QueryCtx, jobs: Doc<"jobs">[], cache: RelationCache) {
  const ids = [...new Set(jobs.map((job) => job.city_id).filter((id): id is Id<"cities"> => Boolean(id)))];
  await Promise.all(
    ids.map(async (id) => {
      if (!cache.cities.has(id)) cache.cities.set(id, await ctx.db.get(id));
    }),
  );
}

export function publishedMs(job: { published_date?: number; _creationTime?: number }) {
  return job.published_date ?? job._creationTime ?? 0;
}

export function salaryValue(job: {
  salary_max?: number | null;
  salary?: number | null;
  salary_currency?: string | null;
}) {
  // Compare in a single currency: raw amounts let ₹45,00,000 outrank $850,000.
  return jobSalaryUsd(job) ?? 0;
}

export function rankCandidates(candidates: BrowseCandidate[], sortBy?: string) {
  if (sortBy === "date") return;
  if (sortBy === "salary") {
    candidates.sort((a, b) => {
      const bySalary = salaryValue(b.job) - salaryValue(a.job);
      return bySalary !== 0 ? bySalary : publishedMs(b.job) - publishedMs(a.job);
    });
    return;
  }
  candidates.sort((a, b) => {
    const byScore = (b.readiness ?? -1) - (a.readiness ?? -1);
    return byScore !== 0 ? byScore : publishedMs(b.job) - publishedMs(a.job);
  });
}

/** Smart Matches tiers order by the blended score the "Match" ring shows. */
export function rankBySmartMatch(candidates: BrowseCandidate[]) {
  candidates.sort((a, b) => {
    const byScore = (b.smartMatch ?? b.readiness ?? -1) - (a.smartMatch ?? a.readiness ?? -1);
    return byScore !== 0 ? byScore : publishedMs(b.job) - publishedMs(a.job);
  });
}

/** Goal-first ranking for early-career users who do not have readiness data yet. */
export function rankByCareerAlignment(candidates: BrowseCandidate[]) {
  candidates.sort((a, b) => {
    const byScore = (b.careerAlignment ?? -1) - (a.careerAlignment ?? -1);
    return byScore !== 0 ? byScore : publishedMs(b.job) - publishedMs(a.job);
  });
}

export function sortEnrichedJobs(
  jobs: Array<{
    competency?: { readiness?: number } | null;
    published_date?: number | string;
    _creationTime?: number;
    salary_max?: number | null;
    salary?: number | null;
  }>,
  sortBy?: string,
) {
  if (sortBy === "date") return;
  const published = (job: { published_date?: number | string; _creationTime?: number }) => {
    if (typeof job.published_date === "number") return job.published_date;
    if (typeof job.published_date === "string") {
      const ms = Date.parse(job.published_date);
      return Number.isFinite(ms) ? ms : (job._creationTime ?? 0);
    }
    return job._creationTime ?? 0;
  };
  if (sortBy === "salary") {
    jobs.sort((a, b) => {
      const bySalary = salaryValue(b) - salaryValue(a);
      return bySalary !== 0 ? bySalary : published(b) - published(a);
    });
    return;
  }
  jobs.sort((a, b) => {
    const byScore = (roundedReadiness(b.competency?.readiness) ?? -1) - (roundedReadiness(a.competency?.readiness) ?? -1);
    return byScore !== 0 ? byScore : published(b) - published(a);
  });
}

/** Parallel indexed reads; jobs with a scoring vector need no skill joins. */
export async function scoreReadiness(
  ctx: QueryCtx,
  jobs: Doc<"jobs">[],
  userSkills: Array<{ skill_id: string; proficiency?: string; name?: string }>,
  profileContext?: { experienceProfile?: ExperienceProfile | null },
  skillCache: Map<Id<"skills">, Doc<"skills"> | null> = new Map(),
): Promise<Map<Id<"jobs">, number | null>> {
  const hasData = userSkills.length > 0 || (profileContext?.experienceProfile?.totalYears ?? 0) > 0;
  if (!hasData) {
    return new Map(jobs.map((job) => [job._id, null]));
  }

  const vectors = await Promise.all(
    jobs.map((job) =>
      ctx.db
        .query("job_match_vectors")
        .withIndex("by_job", (q) => q.eq("job_id", job._id))
        .first(),
    ),
  );
  const vectorById = new Map(jobs.map((job, index) => [job._id, vectors[index] ?? null]));
  const missing = jobs.filter((job) => !vectorById.get(job._id));

  // Fallback for a job whose vector has not been written yet. New and edited
  // jobs get one from `jobMatchRanking.upsertVector`; this keeps the card
  // scored in the gap instead of silently dropping readiness.
  const rowsByJob = new Map<Id<"jobs">, Array<{ skill_id: Id<"skills">; type?: string; proficiency?: string; weight?: number }>>();
  if (missing.length > 0) {
    const rows = await Promise.all(
      missing.map(async (job) => {
        const jobRows = await ctx.db
          .query("job_skills")
          .withIndex("by_job", (q) => q.eq("job_id", job._id))
          .take(SCORE_SKILL_TAKE);
        return [job._id, jobRows] as const;
      }),
    );
    for (const [jobId, jobRows] of rows) rowsByJob.set(jobId, jobRows);
    const missingSkillIds = new Set<Id<"skills">>();
    for (const jobRows of rowsByJob.values()) {
      for (const row of jobRows) {
        if (!skillCache.has(row.skill_id)) missingSkillIds.add(row.skill_id);
      }
    }
    await Promise.all(
      [...missingSkillIds].map(async (id) => {
        skillCache.set(id, await ctx.db.get(id));
      }),
    );
  }

  const entries = jobs.map((job) => {
    const vector = vectorById.get(job._id);
    if (vector) {
      const score = scoreJobForUser(
        jobFromVector(vector),
        skillsFromVector(vector),
        userSkills,
        profileContext,
        null,
      );
      return [job._id, score.readiness] as const;
    }
    const rows = rowsByJob.get(job._id) ?? [];
    const experienceScore = relatedExperienceScore(
      profileContext?.experienceProfile,
      jobFunctionForJob(job.title),
      job.experience,
      { jobTitle: job.title },
    );
    return [
      job._id,
      roundedReadiness(
        buildCompetencyFramework(
          rows.map((row) => ({
            skill_id: row.skill_id,
            type: row.type,
            proficiency: row.proficiency,
            weight: row.weight,
            skill: { name: skillCache.get(row.skill_id)?.name },
          })),
          userSkills,
          { experienceScore, requiredExperienceYears: job.experience },
        ).readiness,
      ),
    ] as const;
  });
  return new Map(entries);
}

type ScoreProfile = { experienceProfile?: ExperienceProfile | null };

type TierScoreCaches = {
  skills: Map<Id<"skills">, Doc<"skills"> | null>;
  pages: Map<Id<"pages">, Doc<"pages"> | null>;
  titles: Map<Id<"job_titles">, Doc<"job_titles"> | null>;
};

export type TierScore = {
  readiness: number | null;
  careerAlignment: number | null;
  smartMatch: number | null;
  gap: ClosingGap | null;
};

/**
 * Readiness plus career alignment for at most the jobs already chosen for scoring.
 * Skill names and company pages are one deduped batch, reused by the card serializer.
 */
export async function scoreTierMatches(
  ctx: QueryCtx,
  jobs: Doc<"jobs">[],
  userSkills: Array<{ skill_id: string; proficiency?: string; name?: string }>,
  profileContext: ScoreProfile | undefined,
  careerGoal: {
    target_roles?: string[];
    target_role?: string;
    skills?: string[];
    industries?: string[];
    experience_level?: string;
  } | null,
  _caches: TierScoreCaches,
): Promise<Map<Id<"jobs">, TierScore>> {
  const hasData = userSkills.length > 0 || (profileContext?.experienceProfile?.totalYears ?? 0) > 0;

  const vectors = await Promise.all(
    jobs.map((job) =>
      ctx.db
        .query("job_match_vectors")
        .withIndex("by_job", (q) => q.eq("job_id", job._id))
        .first(),
    ),
  );

  const scores = new Map<Id<"jobs">, TierScore>();
  for (let index = 0; index < jobs.length; index++) {
    const job = jobs[index]!;
    const vector = vectors[index];
    if (!vector) {
      // Career alignment still works without a vector; readiness stays unknown
      // until the vector write lands.
      const careerAlignment = careerGoal
        ? calculateCareerAlignment(
            careerGoal,
            {
              title: job.title,
              industry: undefined,
              company_name: job.company_name,
            },
            [],
          )
        : null;
      scores.set(job._id, { readiness: null, careerAlignment, smartMatch: null, gap: null });
      continue;
    }

    if (!hasData) {
      const careerAlignment = careerGoal
        ? calculateCareerAlignment(
            careerGoal,
            {
              title: vector.title ?? job.title,
              industry: vector.industry,
              company_name: vector.company_name ?? job.company_name,
            },
            vector.skills.map((skill) => skill.name ?? "").filter(Boolean),
          )
        : null;
      scores.set(job._id, { readiness: null, careerAlignment, smartMatch: null, gap: null });
      continue;
    }

    const result = scoreJobForUser(
      jobFromVector(vector),
      skillsFromVector(vector),
      userSkills,
      profileContext,
      careerGoal,
    );
    scores.set(job._id, {
      readiness: result.readiness,
      careerAlignment: result.careerAlignment,
      smartMatch: result.smartMatch,
      gap: result.gap,
    });
  }
  return scores;
}

type ListHydration = {
  userSkills: Array<Pick<Doc<"user_skills">, "skill_id" | "proficiency">>;
  savedJobIds: Set<string>;
  careerGoal?: Doc<"career_goals"> | null;
};

/**
 * Card payload only: no JD HTML, no skill-doc joins, no job_stats.
 * Smart Match fields are whatever the score pass already computed.
 */
function slimOtherInfo(info: unknown) {
  if (!info || typeof info !== "object") return null;
  const rec = info as { location?: unknown; types?: unknown; cities?: unknown };
  return {
    location: typeof rec.location === "string" ? rec.location : null,
    types: Array.isArray(rec.types) ? rec.types : null,
    cities: Array.isArray(rec.cities) ? rec.cities : null,
  };
}

export async function slimListJob(ctx: QueryCtx, candidate: BrowseCandidate, hydration: ListHydration, cache: RelationCache) {
  const job = candidate.job;
  const readiness = candidate.readiness;
  const [page, city, job_title] = await Promise.all([
    getCached(ctx, cache.pages, job.page_id),
    getCached(ctx, cache.cities, job.city_id),
    getCached(ctx, cache.titles, job.job_title_id),
  ]);
  const state = city ? await getCached(ctx, cache.states, city.state_id) : null;

  const career_alignment = candidate.careerAlignment ?? null;
  const smart_match = candidate.smartMatch ?? null;
  const gap = candidate.gap ?? null;

  return {
    _id: job._id,
    id: job._id,
    slug: job.slug ?? null,
    _creationTime: job._creationTime,
    title: job.title ?? job_title?.name ?? "",
    company_name: job.company_name ?? page?.name ?? null,
    company_logo: job.company_logo ?? page?.logo ?? null,
    company_website_url: job.company_website_url ?? null,
    company_is_agency: job.company_is_agency ?? false,
    application_url: job.application_url ?? null,
    experience: job.experience ?? null,
    experience_level: job.experience_level ?? null,
    work_type: job.work_type ?? null,
    workplace_type: job.workplace_type ?? null,
    has_remote: job.has_remote ?? false,
    salary: job.salary ?? null,
    salary_min: job.salary_min ?? null,
    salary_max: job.salary_max ?? null,
    salary_currency: job.salary_currency ?? null,
    other_info: slimOtherInfo(job.other_info),
    status: job.status,
    published_date: iso(job.published_date),
    createdAt: iso(job._creationTime),
    updatedAt: iso(job._creationTime),
    page: page ? { _id: page._id, id: page._id, name: page.name, logo: page.logo } : null,
    city: city ? { ...withId(city), state: state ? withId(state) : null } : null,
    job_title: job_title ? withId(job_title) : null,
    job_skills: [],
    is_bookmarked: hydration.savedJobIds.has(job._id),
    competency:
      readiness == null
        ? null
        : {
            readiness,
            career_alignment,
            smart_match,
            gap,
            competencies: [],
            matchedCount: 0,
            totalCount: 0,
          },
    career_alignment,
    smart_match,
    application_count: job.application_count ?? 0,
    view_count: job.view_count ?? 0,
    has_applied: false,
    applications: [],
  };
}

export async function slimListJobs(
  ctx: QueryCtx,
  candidates: BrowseCandidate[],
  hydration: ListHydration,
  cache: RelationCache = emptyRelationCache(),
) {
  return await Promise.all(candidates.map((item) => slimListJob(ctx, item, hydration, cache)));
}

const SIMILAR_MIN = 0.4;
const SIMILAR_POOL = 50;

export type SimilarCandidate = BrowseCandidate & { similarity: number };

/**
 * Other open jobs that share a role title (and optionally skills).
 * Uses `by_job_title` + `search_title` — never the newest-jobs feed.
 */
export async function findSimilarOpenJobs(ctx: QueryCtx, job: Doc<"jobs">, limit = 4): Promise<SimilarCandidate[]> {
  const titled = job.job_title_id ? await ctx.db.get(job.job_title_id) : null;
  const title = (job.title ?? titled?.name ?? "").trim();
  const pool = new Map<Id<"jobs">, Doc<"jobs">>();

  const add = (other: Doc<"jobs">) => {
    if (other._id === job._id || other.status !== "open") return;
    pool.set(other._id, other);
  };

  if (job.job_title_id) {
    const sameTitle = await ctx.db
      .query("jobs")
      .withIndex("by_job_title", (q) => q.eq("job_title_id", job.job_title_id!))
      .take(SIMILAR_POOL);
    for (const other of sameTitle) add(other);
  }

  if (title) {
    const searched = await ctx.db
      .query("jobs")
      .withSearchIndex("search_title", (q) => q.search("title", title))
      .take(40);
    for (const other of searched) add(other);
  }

  const shortQuery = titleTokens(title).slice(0, 3).join(" ");
  if (pool.size < 8 && shortQuery) {
    const more = await ctx.db
      .query("jobs")
      .withSearchIndex("search_title", (q) => q.search("title", shortQuery))
      .take(40);
    for (const other of more) add(other);
  }

  const others = [...pool.values()];
  if (others.length === 0) return [];

  const sourceSkills = await ctx.db
    .query("job_skills")
    .withIndex("by_job", (q) => q.eq("job_id", job._id))
    .take(SCORE_SKILL_TAKE);
  const sourceIds = new Set(sourceSkills.map((row) => row.skill_id));

  const scored = await Promise.all(
    others.map(async (other) => {
      let titleSim = titleSimilarity(title, other.title ?? "");
      if (job.job_title_id && other.job_title_id === job.job_title_id) titleSim = Math.max(titleSim, 0.9);
      const rows = await ctx.db
        .query("job_skills")
        .withIndex("by_job", (q) => q.eq("job_id", other._id))
        .take(SCORE_SKILL_TAKE);
      const shared = rows.filter((row) => sourceIds.has(row.skill_id)).length;
      const union = new Set([...sourceIds, ...rows.map((row) => row.skill_id)]).size;
      const skillSim = union === 0 ? 0 : shared / union;
      return { job: other, readiness: null, similarity: titleSim * 0.75 + skillSim * 0.25 };
    }),
  );

  return scored
    .filter((item) => item.similarity >= SIMILAR_MIN)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, limit);
}

/**
 * Non-paginated search head for the Smart Matches rails. The paginated All
 * Jobs search uses the same index directly with a cursor.
 */
export async function jobsMatchingBrowseSearch(ctx: QueryCtx, rawSearch: string): Promise<Doc<"jobs">[]> {
  const search = rawSearch.trim();
  if (!search) return [];
  return await ctx.db
    .query("jobs")
    .withSearchIndex("search_all", (q) => q.search("search_text", search).eq("status", "open"))
    .take(SEARCH_CANDIDATE_CAP);
}

/**
 * Open jobs that match the user's role titles via index + search.
 * All Jobs' newest-only scan misses older postings Similar Jobs can still find.
 */
export async function jobsMatchingRoleTitles(ctx: QueryCtx, profile: UserRoleProfile): Promise<Doc<"jobs">[]> {
  const pool = new Map<Id<"jobs">, Doc<"jobs">>();
  const add = (job: Doc<"jobs">) => {
    if (job.status === "open") pool.set(job._id, job);
  };

  const titleIds = [...profile.titleIds].slice(0, 6);
  await Promise.all(
    titleIds.map(async (titleId) => {
      const rows = await ctx.db
        .query("jobs")
        .withIndex("by_job_title", (q) => q.eq("job_title_id", titleId))
        .take(40);
      for (const job of rows) add(job);
    }),
  );

  const queries = new Set<string>();
  for (const phrase of profile.phrases.slice(0, 4)) {
    const short = titleTokens(phrase).slice(0, 3).join(" ");
    if (short) queries.add(short);
  }
  await Promise.all(
    [...queries].slice(0, 4).map(async (query) => {
      const rows = await ctx.db
        .query("jobs")
        .withSearchIndex("search_title", (q) => q.search("title", query))
        .take(40);
      for (const job of rows) add(job);
    }),
  );

  return [...pool.values()];
}
