import { paginationOptsValidator } from "convex/server";
import { v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";
import { internalMutation, internalQuery, type MutationCtx, type QueryCtx } from "./_generated/server";
import { authedMutation, authedQuery, optionalAuthQuery } from "./lib/customFunctions";
import { deleteJobCascade } from "./lib/deleteUserData";
import { iso, withId } from "./lib/helpers";
import { bumpJobCount, ensureJobStats, getJobCounts } from "./lib/jobCounts";
import { buildCompetencyFramework, clipPlainText } from "./lib/skillMatch";

type SkillCache = Map<Id<"skills">, Doc<"skills"> | null>;

type ListHydration = {
  userSkills: Array<Pick<Doc<"user_skills">, "skill_id" | "proficiency">>;
  savedJobIds: Set<string>;
  skillCache: SkillCache;
};

async function jobSkillsFor(ctx: QueryCtx, jobId: Id<"jobs">, cache?: SkillCache) {
  const rows = await ctx.db
    .query("job_skills")
    .withIndex("by_job", (q) => q.eq("job_id", jobId))
    .collect();
  const skillCache = cache ?? new Map();
  const missing = rows.filter((row) => !skillCache.has(row.skill_id));
  await Promise.all(
    missing.map(async (row) => {
      skillCache.set(row.skill_id, await ctx.db.get(row.skill_id));
    }),
  );
  return rows.map((row) => {
    const skill = skillCache.get(row.skill_id) ?? null;
    return { ...withId(row), skill: skill ? withId(skill) : null };
  });
}

async function listHydration(ctx: QueryCtx, user: Doc<"users"> | null, loadSaved = true): Promise<ListHydration> {
  if (!user) return { userSkills: [], savedJobIds: new Set(), skillCache: new Map() };
  const [skillRows, saved] = await Promise.all([
    ctx.db
      .query("user_skills")
      .withIndex("by_user", (q) => q.eq("user_id", user._id))
      .collect(),
    loadSaved
      ? ctx.db
          .query("saved_jobs")
          .withIndex("by_user", (q) => q.eq("user_id", user._id))
          .collect()
      : Promise.resolve([]),
  ]);
  return {
    userSkills: skillRows.map((row) => ({ skill_id: row.skill_id, proficiency: row.proficiency })),
    savedJobIds: new Set(saved.map((row) => row.job_id)),
    skillCache: new Map(),
  };
}

async function enrichJob(ctx: QueryCtx, job: Doc<"jobs">, user: Doc<"users"> | null, list?: ListHydration, includeSaved = true) {
  const [page, city, job_title, job_skills] = await Promise.all([
    job.page_id ? ctx.db.get(job.page_id) : null,
    job.city_id ? ctx.db.get(job.city_id) : null,
    job.job_title_id ? ctx.db.get(job.job_title_id) : null,
    jobSkillsFor(ctx, job._id, list?.skillCache),
  ]);
  const state = city ? await ctx.db.get(city.state_id) : null;

  let is_bookmarked = false;
  let competency = null;
  let has_applied = false;
  if (user) {
    is_bookmarked = includeSaved
      ? list
        ? list.savedJobIds.has(job._id)
        : Boolean(
            await ctx.db
              .query("saved_jobs")
              .withIndex("by_job_and_user", (q) => q.eq("job_id", job._id).eq("user_id", user._id))
              .unique(),
          )
      : false;
    const userSkills = list
      ? list.userSkills
      : (
          await ctx.db
            .query("user_skills")
            .withIndex("by_user", (q) => q.eq("user_id", user._id))
            .collect()
        ).map((row) => ({ skill_id: row.skill_id, proficiency: row.proficiency }));
    competency = buildCompetencyFramework(
      job_skills.map((js) => ({
        skill_id: js.skill_id,
        type: js.type,
        proficiency: js.proficiency,
        weight: js.weight,
        skill: js.skill,
      })),
      userSkills,
    );
    if (!list) {
      const mine = await ctx.db
        .query("job_applications")
        .withIndex("by_job_and_user", (q) => q.eq("job_id", job._id).eq("user_id", user._id))
        .collect();
      has_applied = mine.some((row) => row.status !== "rejected" && row.status !== "cancelled");
    }
  }

  const counts = await getJobCounts(ctx, job);
  const application_count = counts.application_count;

  return {
    ...withId(job),
    published_date: iso(job.published_date),
    createdAt: iso(job._creationTime),
    updatedAt: iso(job._creationTime),
    page: page ? withId(page) : null,
    city: city ? { ...withId(city), state: state ? withId(state) : null } : null,
    job_title: job_title ? withId(job_title) : null,
    job_skills,
    is_bookmarked,
    competency,
    title: job.title ?? job_title?.name,
    company_name: job.company_name ?? page?.name,
    company_logo: job.company_logo ?? page?.logo,
    company_is_agency: job.company_is_agency ?? false,
    has_remote: job.has_remote ?? false,
    application_count,
    view_count: counts.view_count,
    has_applied,
    applications: has_applied && user ? [{ user_id: user._id }] : [],
  };
}

function matchesFilters(job: Doc<"jobs">, cityName: string | null, args: Record<string, unknown>) {
  const cities = (args.cities as string[] | undefined) ?? [];
  const job_types = (args.job_types as string[] | undefined) ?? [];
  const workplace_types = (args.workplace_types as string[] | undefined) ?? [];
  const search = ((args.search as string | undefined) ?? "").trim().toLowerCase();
  const salary_min = args.salary_min as number | undefined;
  const salary_max = args.salary_max as number | undefined;
  const page_id = args.page_id as string | undefined;

  if (page_id && job.page_id !== page_id) return false;
  if (cities.length) {
    const extra = job.other_info as { cities?: Array<{ name?: string }>; location?: string } | undefined;
    const names = [cityName, extra?.location, ...(extra?.cities ?? []).map((c) => c.name)]
      .filter(Boolean)
      .map((n) => n!.toLowerCase());
    if (!cities.some((c) => names.some((n) => n === c.toLowerCase() || n.includes(c.toLowerCase())))) return false;
  }
  if (job_types.length) {
    const squash = (s?: string | null) => (s ?? "").toLowerCase().replace(/[-\s]/g, "");
    const otherTypes = ((job.other_info as { types?: Array<{ name?: string }> } | undefined)?.types ?? []).map((t) => squash(t.name));
    const wanted = job_types.map(squash);
    if (!wanted.includes(squash(job.work_type)) && !otherTypes.some((t) => wanted.includes(t))) return false;
  }
  if (workplace_types.length) {
    const wanted = workplace_types.map((t) => t.toLowerCase());
    const matchesWorkplace = job.workplace_type && wanted.includes(job.workplace_type);
    const matchesRemote = wanted.includes("remote") && job.has_remote;
    if (!matchesWorkplace && !matchesRemote) return false;
  }
  if (typeof salary_min === "number" && (job.salary_min ?? job.salary ?? 0) < salary_min) return false;
  if (typeof salary_max === "number" && (job.salary_max ?? job.salary ?? 0) > salary_max) return false;
  if (search) {
    const hay = `${job.title ?? ""} ${job.company_name ?? ""} ${job.external_id ?? ""}`.toLowerCase();
    if (!hay.includes(search)) return false;
  }
  const posted_within = args.posted_within as string | undefined;
  const now = args.now as number | undefined;
  if (posted_within && typeof now === "number") {
    const postedAt = job.published_date ?? job._creationTime;
    const maxAge = posted_within === "24h" ? 86_400_000 : posted_within === "week" ? 7 * 86_400_000 : 30 * 86_400_000;
    if (now - postedAt > maxAge) return false;
  }
  return true;
}

async function openJobs(ctx: QueryCtx, limit: number) {
  return await ctx.db
    .query("jobs")
    .withIndex("by_status_and_published", (q) => q.eq("status", "open"))
    .order("desc")
    .take(limit);
}

export const list = optionalAuthQuery({
  args: {
    cities: v.optional(v.array(v.string())),
    departments: v.optional(v.array(v.string())),
    job_types: v.optional(v.array(v.string())),
    workplace_types: v.optional(v.array(v.string())),
    salary_min: v.optional(v.number()),
    salary_max: v.optional(v.number()),
    search: v.optional(v.string()),
    sort_by: v.optional(v.string()),
    city: v.optional(v.string()),
    page_id: v.optional(v.string()),
    posted_within: v.optional(v.union(v.literal("24h"), v.literal("week"), v.literal("month"))),
    now: v.optional(v.number()),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    const open = await openJobs(ctx, 100);
    const hydration = await listHydration(ctx, ctx.user);
    const results = [];
    for (const job of open) {
      const city = job.city_id ? await ctx.db.get(job.city_id) : null;
      if (!matchesFilters(job, city?.name ?? null, { ...args, cities: args.cities ?? (args.city ? [args.city] : []) })) {
        continue;
      }
      results.push(await enrichJob(ctx, job, ctx.user, hydration));
    }
    if (args.sort_by === "salary") {
      results.sort((a, b) => ((b.salary_max ?? b.salary ?? 0) as number) - ((a.salary_max ?? a.salary ?? 0) as number));
    }
    return results;
  },
});

/**
 * Paginated job browse. Uses cursor pagination so the client can load jobs in
 * chunks (with per-page caching via usePaginatedQuery) instead of pulling the
 * whole open set at once. Filters that can't use an index (search, city, salary,
 * recency) are applied in-memory per page, so a page may occasionally return
 * fewer than numItems — the cursor still advances correctly.
 */
export const listPaginated = optionalAuthQuery({
  args: {
    paginationOpts: paginationOptsValidator,
    cities: v.optional(v.array(v.string())),
    departments: v.optional(v.array(v.string())),
    job_types: v.optional(v.array(v.string())),
    workplace_types: v.optional(v.array(v.string())),
    salary_min: v.optional(v.number()),
    salary_max: v.optional(v.number()),
    search: v.optional(v.string()),
    sort_by: v.optional(v.string()),
    city: v.optional(v.string()),
    page_id: v.optional(v.string()),
    posted_within: v.optional(v.union(v.literal("24h"), v.literal("week"), v.literal("month"))),
    now: v.optional(v.number()),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    const { paginationOpts, ...filterArgs } = args;
    const search = ((filterArgs.search as string | undefined) ?? "").trim();

    // usePaginatedQuery requires the Convex PaginationResult shape (`page`,
    // not `results`). Search uses the title index; the default browse path
    // walks open jobs newest-first via by_status_and_published.
    const paged = search
      ? await ctx.db
          .query("jobs")
          .withSearchIndex("search_title", (q) => q.search("title", search))
          .paginate(paginationOpts)
      : await ctx.db
          .query("jobs")
          .withIndex("by_status_and_published", (q) => q.eq("status", "open"))
          .order("desc")
          .paginate(paginationOpts);

    const hydration = await listHydration(ctx, ctx.user);
    const page = [];
    for (const job of paged.page) {
      if (search && job.status !== "open") continue;
      const city = job.city_id ? await ctx.db.get(job.city_id) : null;
      if (
        !matchesFilters(job, city?.name ?? null, {
          ...filterArgs,
          cities: filterArgs.cities ?? (filterArgs.city ? [filterArgs.city] : []),
        })
      ) {
        continue;
      }
      page.push(await enrichJob(ctx, job, ctx.user, hydration));
    }
    if (filterArgs.sort_by === "salary") {
      page.sort((a, b) => ((b.salary_max ?? b.salary ?? 0) as number) - ((a.salary_max ?? a.salary ?? 0) as number));
    }
    return {
      page,
      isDone: paged.isDone,
      continueCursor: paged.continueCursor,
      splitCursor: paged.splitCursor,
      pageStatus: paged.pageStatus,
    };
  },
});

/** Lightweight count for the profile editor's "Smart Job Matches" callout. */
export const matchCount = authedQuery({
  args: {
    cities: v.optional(v.array(v.string())),
    workplace_types: v.optional(v.array(v.string())),
    job_types: v.optional(v.array(v.string())),
  },
  returns: v.number(),
  handler: async (ctx, args) => {
    const open = await openJobs(ctx, 400);
    let count = 0;
    for (const job of open) {
      const city = job.city_id ? await ctx.db.get(job.city_id) : null;
      if (matchesFilters(job, city?.name ?? null, { ...args })) count++;
    }
    return count;
  },
});

export const getById = optionalAuthQuery({
  args: { id: v.id("jobs") },
  returns: v.any(),
  handler: async (ctx, args) => {
    const job = await ctx.db.get(args.id);
    if (!job) return null;
    const base = await enrichJob(ctx, job, ctx.user, undefined, false);
    const sets = await ctx.db
      .query("question_sets")
      .withIndex("by_job", (q) => q.eq("jobId", job._id))
      .collect();
    const questionSets = [];
    const isOwner = ctx.user && job.owner_id === ctx.user._id;
    for (const set of sets) {
      const questions = await ctx.db
        .query("questions")
        .withIndex("by_set", (q) => q.eq("question_set_id", set._id))
        .collect();
      const withOptions = [];
      for (const question of questions) {
        const options = await ctx.db
          .query("options")
          .withIndex("by_question", (q) => q.eq("question_id", question._id))
          .collect();
        const q = { ...withId(question), options: options.map(withId) };
        if (!isOwner) {
          delete (q as { is_knockout?: boolean }).is_knockout;
          delete (q as { knockout_condition?: string }).knockout_condition;
          delete (q as { knockout_value?: string }).knockout_value;
        }
        withOptions.push(q);
      }
      questionSets.push({ ...withId(set), questions: withOptions });
    }
    const sizeId = (base.page as { size_id?: Id<"company_sizes"> } | null)?.size_id;
    const size = sizeId ? await ctx.db.get(sizeId) : null;
    return {
      ...base,
      questionSets,
      page: base.page ? { ...base.page, company_size: size ? withId(size) : null } : null,
    };
  },
});

export const listSimilar = optionalAuthQuery({
  args: { id: v.id("jobs") },
  returns: v.any(),
  handler: async (ctx, args) => {
    const job = await ctx.db.get(args.id);
    if (!job) return [];
    const open = await openJobs(ctx, 20);
    const hydration = await listHydration(ctx, ctx.user, false);
    const out = [];
    for (const other of open) {
      if (other._id === job._id) continue;
      out.push(await enrichJob(ctx, other, ctx.user, hydration));
    }
    return out;
  },
});

export const listPosted = authedQuery({
  args: { search: v.optional(v.string()), status: v.optional(v.string()) },
  returns: v.any(),
  handler: async (ctx, args) => {
    let jobs = await ctx.db
      .query("jobs")
      .withIndex("by_owner", (q) => q.eq("owner_id", ctx.user._id))
      .collect();
    if (args.status) jobs = jobs.filter((j) => j.status === args.status);
    if (args.search) {
      const q = args.search.toLowerCase();
      jobs = jobs.filter((j) => `${j.title ?? ""} ${j.company_name ?? ""}`.toLowerCase().includes(q));
    }
    const hydration = await listHydration(ctx, ctx.user);
    const out = [];
    for (const job of jobs) out.push(await enrichJob(ctx, job, ctx.user, hydration));
    return out;
  },
});

export const listSaved = authedQuery({
  args: { search: v.optional(v.string()) },
  returns: v.any(),
  handler: async (ctx, args) => {
    const saved = await ctx.db
      .query("saved_jobs")
      .withIndex("by_user", (q) => q.eq("user_id", ctx.user._id))
      .collect();
    const hydration = await listHydration(ctx, ctx.user);
    const out = [];
    for (const row of saved) {
      const job = await ctx.db.get(row.job_id);
      if (!job) continue;
      if (args.search && !`${job.title ?? ""}`.toLowerCase().includes(args.search.toLowerCase())) continue;
      out.push(await enrichJob(ctx, job, ctx.user, hydration));
    }
    return out;
  },
});

export const listApplied = authedQuery({
  args: { status: v.optional(v.string()), search: v.optional(v.string()) },
  returns: v.any(),
  handler: async (ctx, args) => {
    let apps = await ctx.db
      .query("job_applications")
      .withIndex("by_user", (q) => q.eq("user_id", ctx.user._id))
      .collect();
    if (args.status) apps = apps.filter((a) => a.status === args.status);
    const hydration = await listHydration(ctx, ctx.user);
    const out = [];
    for (const app of apps) {
      const job = await ctx.db.get(app.job_id);
      if (args.search) {
        const q = args.search.toLowerCase();
        const hay = `${job?.title ?? ""} ${job?.company_name ?? ""}`.toLowerCase();
        if (!hay.includes(q)) continue;
      }
      const logs = await ctx.db
        .query("job_application_logs")
        .withIndex("by_application", (q) => q.eq("job_application_id", app._id))
        .collect();
      out.push({
        ...withId(app),
        applied_at: iso(app.applied_at),
        job: job ? await enrichJob(ctx, job, ctx.user, hydration) : null,
        jobApplicationLogs: logs.map(withId),
      });
    }
    return out;
  },
});

export const listJobCities = optionalAuthQuery({
  args: {},
  returns: v.array(v.string()),
  handler: async (ctx) => {
    const jobs = await openJobs(ctx, 200);
    const names = new Set<string>();
    for (const job of jobs) {
      if (job.city_id) {
        const city = await ctx.db.get(job.city_id);
        if (city) names.add(city.name);
      }
    }
    return [...names];
  },
});

export const listJobTypes = optionalAuthQuery({
  args: {},
  returns: v.array(v.string()),
  handler: async (ctx) => {
    const jobs = await openJobs(ctx, 200);
    const names = new Set<string>();
    for (const job of jobs) {
      if (job.work_type) names.add(job.work_type);
      const types = (job.other_info as { types?: Array<{ name?: string }> } | undefined)?.types ?? [];
      for (const t of types) if (t.name) names.add(t.name);
    }
    return [...names];
  },
});

async function savedJobsFor(ctx: QueryCtx | MutationCtx, jobId: Id<"jobs">, userId: Id<"users">) {
  return await ctx.db
    .query("saved_jobs")
    .withIndex("by_job_and_user", (q) => q.eq("job_id", jobId).eq("user_id", userId))
    .collect();
}

export const isSaved = optionalAuthQuery({
  args: { jobId: v.id("jobs") },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    if (!ctx.user) return false;
    const existing = await savedJobsFor(ctx, args.jobId, ctx.user._id);
    return existing.length > 0;
  },
});

export const toggleSave = authedMutation({
  args: { jobId: v.id("jobs") },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const existing = await savedJobsFor(ctx, args.jobId, ctx.user._id);
    if (existing.length > 0) {
      for (const row of existing) {
        await ctx.db.delete(row._id);
      }
      return false;
    }
    await ctx.db.insert("saved_jobs", { job_id: args.jobId, user_id: ctx.user._id });
    return true;
  },
});

export const recordView = authedMutation({
  args: { jobId: v.id("jobs") },
  returns: v.object({ view_count: v.number() }),
  handler: async (ctx, args) => {
    const job = await ctx.db.get("jobs", args.jobId);
    if (!job) throw new Error("Job not found");

    const existing = await ctx.db
      .query("job_views")
      .withIndex("by_job_and_user", (q) => q.eq("job_id", args.jobId).eq("user_id", ctx.user._id))
      .unique();
    const viewedAt = Date.now();
    if (existing) {
      await ctx.db.patch("job_views", existing._id, { viewed_at: viewedAt });
    } else {
      await ctx.db.insert("job_views", { job_id: args.jobId, user_id: ctx.user._id, viewed_at: viewedAt });
      await bumpJobCount(ctx, args.jobId, "view_count", 1);
    }
    const counts = await getJobCounts(ctx, job);
    return { view_count: counts.view_count };
  },
});

export const remove = authedMutation({
  args: { jobId: v.id("jobs") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const job = await ctx.db.get(args.jobId);
    if (!job || job.owner_id !== ctx.user._id) throw new Error("Job not found");
    await deleteJobCascade(ctx, args.jobId);
    return null;
  },
});

export const update = authedMutation({
  args: { jobId: v.id("jobs"), data: v.any() },
  returns: v.any(),
  handler: async (ctx, args) => {
    const job = await ctx.db.get(args.jobId);
    if (!job || job.owner_id !== ctx.user._id) throw new Error("Job not found");
    const data = { ...(args.data as Record<string, unknown>) };
    const jobFields = (data.job as Record<string, unknown> | undefined) ?? data;
    delete jobFields.id;
    delete jobFields._id;
    delete jobFields.owner_id;
    await ctx.db.patch(args.jobId, jobFields);
    return withId((await ctx.db.get(args.jobId))!);
  },
});

export const createWithQuestions = authedMutation({
  args: { payload: v.any() },
  returns: v.any(),
  handler: async (ctx, args) => {
    const payload = args.payload as {
      job?: Record<string, unknown>;
      questionSet?: { title?: string };
      questions?: Array<Record<string, unknown>>;
      skills?: Array<{ id: string; type?: string; proficiency?: string; weight?: number }>;
    };
    const jobIn = payload.job ?? {};
    const pageId = (jobIn.page_id as Id<"pages"> | undefined) ?? undefined;
    const jobTitleId = (jobIn.job_title as { id?: Id<"job_titles"> } | undefined)?.id;
    const [page, jobTitle] = await Promise.all([pageId ? ctx.db.get(pageId) : null, jobTitleId ? ctx.db.get(jobTitleId) : null]);
    const jobId = await ctx.db.insert("jobs", {
      title: (jobIn.title as string | undefined) ?? jobTitle?.name,
      description: jobIn.description as string | undefined,
      page_id: pageId,
      city_id: (jobIn.city_id as Id<"cities"> | undefined) ?? (jobIn.city as { id?: Id<"cities"> } | undefined)?.id,
      job_title_id: jobTitleId,
      workplace_type: jobIn.workplace_type as "on-site" | "hybrid" | "remote" | undefined,
      work_type: jobIn.work_type as string | undefined,
      salary: jobIn.salary as number | undefined,
      salary_min: jobIn.salary_min as number | undefined,
      salary_max: jobIn.salary_max as number | undefined,
      salary_currency: (jobIn.salary_currency as string | undefined) ?? "INR",
      experience: jobIn.experience as number | undefined,
      company_name: (jobIn.company_name as string | undefined) ?? page?.name,
      company_logo: (jobIn.company_logo as string | undefined) ?? page?.logo,
      status: "open",
      resource: "qelsa",
      owner_id: ctx.user._id,
      published_date: Date.now(),
      view_count: 0,
      application_count: 0,
    });
    await ensureJobStats(ctx, jobId);

    for (const skill of payload.skills ?? []) {
      await ctx.db.insert("job_skills", {
        job_id: jobId,
        skill_id: skill.id as Id<"skills">,
        type: skill.type as "core" | "preferred" | "nice_to_have" | undefined,
        proficiency: skill.proficiency as "beginner" | "intermediate" | "advance" | "expert" | undefined,
        weight: skill.weight,
      });
    }

    if (payload.questions?.length) {
      const setId = await ctx.db.insert("question_sets", {
        jobId,
        ownerId: ctx.user._id,
        title: payload.questionSet?.title ?? "Screening",
      });
      let order = 0;
      for (const q of payload.questions) {
        const questionId = await ctx.db.insert("questions", {
          question_set_id: setId,
          title: String(q.title ?? ""),
          type: String(q.type ?? "short_text"),
          category: typeof q.category === "string" ? q.category : undefined,
          is_knockout: typeof q.is_knockout === "boolean" ? q.is_knockout : undefined,
          knockout_condition: typeof q.knockout_condition === "string" ? q.knockout_condition : undefined,
          knockout_value: typeof q.knockout_value === "string" ? q.knockout_value : undefined,
          expected_answer: typeof q.expected_answer === "string" ? q.expected_answer : undefined,
          weight: typeof q.weight === "number" ? q.weight : undefined,
          required: (q.required as boolean | undefined) ?? true,
          order: order++,
        });
        const options = (q.options as Array<{ title: string; value?: string }> | undefined) ?? [];
        let optOrder = 0;
        for (const opt of options) {
          await ctx.db.insert("options", {
            question_id: questionId,
            title: opt.title,
            value: opt.value,
            order: optOrder++,
          });
        }
      }
    }

    const job = await ctx.db.get(jobId);
    return enrichJob(ctx, job!, ctx.user);
  },
});

export const storeScrapedJobs = internalMutation({
  args: { jobs: v.array(v.any()) },
  returns: v.array(v.id("jobs")),
  handler: async (ctx, args) => {
    const needsSkills: Id<"jobs">[] = [];
    for (const job of args.jobs) {
      const external_id = String(job.id ?? "");
      if (!external_id) continue;
      const existing = await ctx.db
        .query("jobs")
        .withIndex("by_external_id", (q) => q.eq("external_id", external_id))
        .unique();
      const types = (job.types as Array<{ name?: string }> | undefined) ?? [];
      const work_type = (job.work_type as string | undefined) ?? types.find((t) => t.name)?.name;
      const payload = {
        external_id,
        description: job.description as string | undefined,
        application_url: job.application_url as string | undefined,
        experience_level: job.experience_level as string | undefined,
        has_remote: Boolean(job.has_remote) || (work_type ?? "").toLowerCase().includes("remote"),
        language: job.language as string | undefined,
        published_date: job.published ? new Date(job.published as string).getTime() : Date.now(),
        salary_currency: job.salary_currency as string | undefined,
        salary_max: job.salary_max as number | undefined,
        salary_min: job.salary_min as number | undefined,
        salary: job.salary as number | undefined,
        title: job.title as string | undefined,
        company_name: (job.company as { name?: string } | undefined)?.name,
        company_logo: (job.company as { logo?: string } | undefined)?.logo,
        work_type,
        resource: "https://jobdataapi.com/",
        other_info: {
          cities: job.cities,
          countries: job.countries,
          regions: job.regions,
          states: job.states,
          types: job.types,
        },
        status: "open" as const,
      };
      if (existing) {
        await ctx.db.patch(existing._id, payload);
        if (!existing.skills_extracted) {
          const linked = await ctx.db
            .query("job_skills")
            .withIndex("by_job", (q) => q.eq("job_id", existing._id))
            .take(1);
          if (linked.length === 0) needsSkills.push(existing._id);
        }
      } else {
        const jobId = await ctx.db.insert("jobs", { ...payload, view_count: 0, application_count: 0 });
        await ensureJobStats(ctx, jobId);
        needsSkills.push(jobId);
      }
    }
    return needsSkills;
  },
});

/**
 * Store jobs pulled from a connected ATS (Greenhouse/Lever public boards).
 * Expects jobs pre-normalized by the atsSync action into a common shape.
 * Dedupes by external_id; returns ids needing AI skill extraction.
 */
export const storeAtsJobs = internalMutation({
  args: {
    integrationId: v.id("ats_integrations"),
    provider: v.string(),
    jobs: v.array(v.any()),
  },
  returns: v.object({ stored: v.number(), needsSkills: v.array(v.id("jobs")) }),
  handler: async (ctx, args) => {
    const needsSkills: Id<"jobs">[] = [];
    let stored = 0;
    for (const job of args.jobs) {
      const external_id = String(job.external_id ?? "");
      if (!external_id) continue;
      const existing = await ctx.db
        .query("jobs")
        .withIndex("by_external_id", (q) => q.eq("external_id", external_id))
        .unique();
      const location = typeof job.location === "string" ? job.location.trim() : "";
      const cityHint = location.split(",")[0]?.trim();
      const payload = {
        external_id,
        title: job.title as string | undefined,
        description: job.description as string | undefined,
        application_url: job.application_url as string | undefined,
        company_name: job.company_name as string | undefined,
        company_logo: job.company_logo as string | undefined,
        company_website_url: job.company_website_url as string | undefined,
        has_remote: Boolean(job.has_remote),
        workplace_type: job.workplace_type as "on-site" | "hybrid" | "remote" | undefined,
        work_type: job.work_type as string | undefined,
        language: job.language as string | undefined,
        salary_min: job.salary_min as number | undefined,
        salary_max: job.salary_max as number | undefined,
        salary_currency: job.salary_currency as string | undefined,
        published_date: (job.published_date as number | undefined) ?? Date.now(),
        resource: `ats:${args.provider}`,
        other_info: {
          ats_provider: args.provider,
          integration_id: args.integrationId,
          location: location || undefined,
          departments: job.departments,
          cities: cityHint ? [{ name: cityHint }] : [],
        },
        status: "open" as const,
      };
      if (existing) {
        await ctx.db.patch(existing._id, payload);
        if (!existing.skills_extracted) {
          const linked = await ctx.db
            .query("job_skills")
            .withIndex("by_job", (q) => q.eq("job_id", existing._id))
            .take(1);
          if (linked.length === 0) needsSkills.push(existing._id);
        }
      } else {
        const jobId = await ctx.db.insert("jobs", { ...payload, view_count: 0, application_count: 0 });
        await ensureJobStats(ctx, jobId);
        needsSkills.push(jobId);
      }
      stored++;
    }
    return { stored, needsSkills };
  },
});

export const aiSummaryValidator = v.object({
  role_overview: v.string(),
  key_requirements: v.array(v.string()),
  why_this_role: v.string(),
});

export const loadSummarySource = internalQuery({
  args: { jobId: v.id("jobs") },
  returns: v.object({
    title: v.string(),
    company: v.optional(v.string()),
    description: v.string(),
    skills: v.array(v.string()),
    ai_summary: v.optional(aiSummaryValidator),
  }),
  handler: async (ctx, args) => {
    const job = await ctx.db.get(args.jobId);
    if (!job) throw new Error("Job not found");
    const [page, jobTitle, skillRows] = await Promise.all([
      job.page_id ? ctx.db.get(job.page_id) : null,
      job.job_title_id ? ctx.db.get(job.job_title_id) : null,
      ctx.db
        .query("job_skills")
        .withIndex("by_job", (q) => q.eq("job_id", job._id))
        .take(20),
    ]);
    const skills: string[] = [];
    for (const row of skillRows) {
      const skill = await ctx.db.get(row.skill_id);
      if (skill?.name) skills.push(skill.name);
    }
    return {
      title: jobTitle?.name ?? job.title ?? "Untitled role",
      company: page?.name ?? job.company_name,
      description: clipPlainText(job.description, 6000),
      skills,
      ai_summary: job.ai_summary,
    };
  },
});

export const saveAiSummary = internalMutation({
  args: {
    jobId: v.id("jobs"),
    summary: aiSummaryValidator,
  },
  returns: aiSummaryValidator,
  handler: async (ctx, args) => {
    const job = await ctx.db.get(args.jobId);
    if (!job) throw new Error("Job not found");
    await ctx.db.patch(args.jobId, { ai_summary: args.summary });
    return args.summary;
  },
});
