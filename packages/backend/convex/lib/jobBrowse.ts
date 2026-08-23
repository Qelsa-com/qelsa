import type { Doc, Id } from "../_generated/dataModel";
import type { QueryCtx } from "../_generated/server";
import { iso, withId } from "./helpers";
import { roundedReadiness, titleSimilarity, titleTokens, type UserRoleProfile } from "./jobProfileMatch";
import { buildCompetencyFramework } from "./skillMatch";

/** Newest-open scan for ranked browse. Indexed `take`, not `.collect()`. */
export const BROWSE_SCAN = 160;
/** Role-matching jobs we score before ranking. */
export const SCORE_CAP = 48;
/** Skill rows per job are enough for a stable readiness rank. */
export const SCORE_SKILL_TAKE = 20;

export type BrowseCandidate = {
  job: Doc<"jobs">;
  readiness: number | null;
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

export function salaryValue(job: { salary_max?: number | null; salary?: number | null }) {
  return (job.salary_max ?? job.salary ?? 0) as number;
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

/** Parallel indexed `job_skills` reads — Convex joins should not be sequential. */
export async function scoreReadiness(
  ctx: QueryCtx,
  jobs: Doc<"jobs">[],
  userSkills: Array<{ skill_id: string; proficiency?: string }>,
): Promise<Map<Id<"jobs">, number | null>> {
  const entries = await Promise.all(
    jobs.map(async (job) => {
      const rows = await ctx.db
        .query("job_skills")
        .withIndex("by_job", (q) => q.eq("job_id", job._id))
        .take(SCORE_SKILL_TAKE);
      return [
        job._id,
        roundedReadiness(
          buildCompetencyFramework(
            rows.map((row) => ({
              skill_id: row.skill_id,
              type: row.type,
              proficiency: row.proficiency,
              weight: row.weight,
            })),
            userSkills,
          ).readiness,
        ),
      ] as const;
    }),
  );
  return new Map(entries);
}

type ListHydration = {
  userSkills: Array<Pick<Doc<"user_skills">, "skill_id" | "proficiency">>;
  savedJobIds: Set<string>;
};

/**
 * Card payload only: no JD HTML, no skill-doc joins, no job_stats.
 * Cards need title, company, location, salary, chips, and readiness.
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

export async function slimListJob(
  ctx: QueryCtx,
  job: Doc<"jobs">,
  hydration: ListHydration,
  readiness: number | null,
  cache: RelationCache,
) {
  const [page, city, job_title] = await Promise.all([
    getCached(ctx, cache.pages, job.page_id),
    getCached(ctx, cache.cities, job.city_id),
    getCached(ctx, cache.titles, job.job_title_id),
  ]);
  const state = city ? await getCached(ctx, cache.states, city.state_id) : null;

  return {
    _id: job._id,
    id: job._id,
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
    competency: readiness == null ? null : { readiness, competencies: [], matchedCount: 0, totalCount: 0 },
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
  return await Promise.all(candidates.map((item) => slimListJob(ctx, item.job, hydration, item.readiness, cache)));
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
