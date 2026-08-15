import { v } from "convex/values";
import { internalMutation } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";
import { authedMutation, authedQuery, optionalAuthQuery } from "./lib/customFunctions";
import { iso, withId } from "./lib/helpers";
import { buildCompetencyFramework } from "./lib/skillMatch";

async function jobSkillsFor(ctx: { db: { query: Function; get: Function } }, jobId: Id<"jobs">) {
  const rows = await ctx.db.query("job_skills").withIndex("by_job", (q: { eq: Function }) => q.eq("job_id", jobId)).collect();
  const out = [];
  for (const row of rows) {
    const skill = await ctx.db.get(row.skill_id);
    out.push({ ...withId(row), skill: skill ? withId(skill) : null });
  }
  return out;
}

async function enrichJob(
  ctx: { db: { query: Function; get: Function } },
  job: Doc<"jobs">,
  user: Doc<"users"> | null,
) {
  const [page, city, job_title, job_skills] = await Promise.all([
    job.page_id ? ctx.db.get(job.page_id) : null,
    job.city_id ? ctx.db.get(job.city_id) : null,
    job.job_title_id ? ctx.db.get(job.job_title_id) : null,
    jobSkillsFor(ctx, job._id),
  ]);
  const state = city ? await ctx.db.get(city.state_id) : null;

  let is_bookmarked = false;
  let competency = null;
  if (user) {
    const saved = await ctx.db
      .query("saved_jobs")
      .withIndex("by_job_and_user", (q: { eq: Function }) => q.eq("job_id", job._id).eq("user_id", user._id))
      .unique();
    is_bookmarked = Boolean(saved);
    const userSkills = await ctx.db
      .query("user_skills")
      .withIndex("by_user", (q: { eq: Function }) => q.eq("user_id", user._id))
      .collect();
    competency = buildCompetencyFramework(
      job_skills.map((js) => ({
        skill_id: js.skill_id,
        type: js.type,
        proficiency: js.proficiency,
        weight: js.weight,
        skill: js.skill,
      })),
      userSkills.map((s: Doc<"user_skills">) => ({ skill_id: s.skill_id, proficiency: s.proficiency })),
    );
  }

  const applications = await ctx.db
    .query("job_applications")
    .withIndex("by_job", (q: { eq: Function }) => q.eq("job_id", job._id))
    .collect();

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
    company_is_agency: job.company_is_agency ?? false,
    has_remote: job.has_remote ?? false,
    applications: applications.map((app) => ({ ...withId(app), applied_at: iso(app.applied_at) })),
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
    const other = (job.other_info as { cities?: Array<{ name?: string }> } | undefined)?.cities ?? [];
    const names = [cityName, ...other.map((c) => c.name)].filter(Boolean).map((n) => n!.toLowerCase());
    if (!cities.some((c) => names.includes(c.toLowerCase()))) return false;
  }
  if (job_types.length) {
    const squash = (s?: string | null) => (s ?? "").toLowerCase().replace(/[-\s]/g, "");
    const otherTypes = ((job.other_info as { types?: Array<{ name?: string }> } | undefined)?.types ?? []).map((t) =>
      squash(t.name),
    );
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
  return true;
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
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    const open = await ctx.db
      .query("jobs")
      .withIndex("by_status", (q) => q.eq("status", "open"))
      .order("desc")
      .take(100);
    const results = [];
    for (const job of open) {
      const city = job.city_id ? await ctx.db.get(job.city_id) : null;
      if (!matchesFilters(job, city?.name ?? null, { ...args, cities: args.cities ?? (args.city ? [args.city] : []) })) {
        continue;
      }
      results.push(await enrichJob(ctx, job, ctx.user));
    }
    return results;
  },
});

export const getById = optionalAuthQuery({
  args: { id: v.id("jobs") },
  returns: v.any(),
  handler: async (ctx, args) => {
    const job = await ctx.db.get(args.id);
    if (!job) return null;
    const base = await enrichJob(ctx, job, ctx.user);
    const sets = await ctx.db.query("question_sets").withIndex("by_job", (q) => q.eq("jobId", job._id)).collect();
    const questionSets = [];
    const isOwner = ctx.user && job.owner_id === ctx.user._id;
    for (const set of sets) {
      const questions = await ctx.db.query("questions").withIndex("by_set", (q) => q.eq("question_set_id", set._id)).collect();
      const withOptions = [];
      for (const question of questions) {
        const options = await ctx.db.query("options").withIndex("by_question", (q) => q.eq("question_id", question._id)).collect();
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
    const views = await ctx.db.query("job_views").withIndex("by_job", (q) => q.eq("job_id", job._id)).collect();
    return { ...base, questionSets, view_count: views.length };
  },
});

export const listSimilar = optionalAuthQuery({
  args: { id: v.id("jobs") },
  returns: v.any(),
  handler: async (ctx, args) => {
    const job = await ctx.db.get(args.id);
    if (!job) return [];
    const open = await ctx.db.query("jobs").withIndex("by_status", (q) => q.eq("status", "open")).take(20);
    const out = [];
    for (const other of open) {
      if (other._id === job._id) continue;
      out.push(await enrichJob(ctx, other, ctx.user));
    }
    return out;
  },
});

export const listPosted = authedQuery({
  args: { search: v.optional(v.string()), status: v.optional(v.string()) },
  returns: v.any(),
  handler: async (ctx, args) => {
    let jobs = await ctx.db.query("jobs").withIndex("by_owner", (q) => q.eq("owner_id", ctx.user._id)).collect();
    if (args.status) jobs = jobs.filter((j) => j.status === args.status);
    if (args.search) {
      const q = args.search.toLowerCase();
      jobs = jobs.filter((j) => `${j.title ?? ""} ${j.company_name ?? ""}`.toLowerCase().includes(q));
    }
    const out = [];
    for (const job of jobs) out.push(await enrichJob(ctx, job, ctx.user));
    return out;
  },
});

export const listSaved = authedQuery({
  args: { search: v.optional(v.string()) },
  returns: v.any(),
  handler: async (ctx, args) => {
    const saved = await ctx.db.query("saved_jobs").withIndex("by_user", (q) => q.eq("user_id", ctx.user._id)).collect();
    const out = [];
    for (const row of saved) {
      const job = await ctx.db.get(row.job_id);
      if (!job) continue;
      if (args.search && !`${job.title ?? ""}`.toLowerCase().includes(args.search.toLowerCase())) continue;
      out.push(await enrichJob(ctx, job, ctx.user));
    }
    return out;
  },
});

export const listApplied = authedQuery({
  args: { status: v.optional(v.string()), search: v.optional(v.string()) },
  returns: v.any(),
  handler: async (ctx, args) => {
    let apps = await ctx.db.query("job_applications").withIndex("by_user", (q) => q.eq("user_id", ctx.user._id)).collect();
    if (args.status) apps = apps.filter((a) => a.status === args.status);
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
        job: job ? await enrichJob(ctx, job, ctx.user) : null,
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
    const jobs = await ctx.db.query("jobs").withIndex("by_status", (q) => q.eq("status", "open")).take(200);
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
    const jobs = await ctx.db.query("jobs").withIndex("by_status", (q) => q.eq("status", "open")).take(200);
    const names = new Set<string>();
    for (const job of jobs) {
      if (job.work_type) names.add(job.work_type);
      const types = (job.other_info as { types?: Array<{ name?: string }> } | undefined)?.types ?? [];
      for (const t of types) if (t.name) names.add(t.name);
    }
    return [...names];
  },
});

export const toggleSave = authedMutation({
  args: { jobId: v.id("jobs") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("saved_jobs")
      .withIndex("by_job_and_user", (q) => q.eq("job_id", args.jobId).eq("user_id", ctx.user._id))
      .unique();
    if (existing) await ctx.db.delete(existing._id);
    else await ctx.db.insert("saved_jobs", { job_id: args.jobId, user_id: ctx.user._id });
    return null;
  },
});

export const recordView = authedMutation({
  args: { jobId: v.id("jobs") },
  returns: v.object({ view_count: v.number() }),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("job_views")
      .withIndex("by_job_and_user", (q) => q.eq("job_id", args.jobId).eq("user_id", ctx.user._id))
      .unique();
    if (!existing) {
      await ctx.db.insert("job_views", { job_id: args.jobId, user_id: ctx.user._id, viewed_at: Date.now() });
    }
    const views = await ctx.db.query("job_views").withIndex("by_job", (q) => q.eq("job_id", args.jobId)).collect();
    return { view_count: views.length };
  },
});

export const remove = authedMutation({
  args: { jobId: v.id("jobs") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const job = await ctx.db.get(args.jobId);
    if (!job || job.owner_id !== ctx.user._id) throw new Error("Job not found");
    await ctx.db.delete(args.jobId);
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
    const jobId = await ctx.db.insert("jobs", {
      title: (jobIn.title as string | undefined) ?? undefined,
      description: jobIn.description as string | undefined,
      page_id: (jobIn.page_id as Id<"pages"> | undefined) ?? undefined,
      city_id: (jobIn.city_id as Id<"cities"> | undefined) ?? ((jobIn.city as { id?: Id<"cities"> } | undefined)?.id),
      job_title_id: (jobIn.job_title as { id?: Id<"job_titles"> } | undefined)?.id,
      workplace_type: jobIn.workplace_type as "on-site" | "hybrid" | "remote" | undefined,
      work_type: jobIn.work_type as string | undefined,
      salary: jobIn.salary as number | undefined,
      salary_min: jobIn.salary_min as number | undefined,
      salary_max: jobIn.salary_max as number | undefined,
      salary_currency: (jobIn.salary_currency as string | undefined) ?? "INR",
      experience: jobIn.experience as number | undefined,
      status: "open",
      resource: "manual",
      owner_id: ctx.user._id,
      published_date: Date.now(),
    });

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
          category: q.category as string | undefined,
          is_knockout: q.is_knockout as boolean | undefined,
          knockout_condition: q.knockout_condition as string | undefined,
          knockout_value: q.knockout_value as string | undefined,
          expected_answer: q.expected_answer as string | undefined,
          weight: q.weight as number | undefined,
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
  returns: v.null(),
  handler: async (ctx, args) => {
    for (const job of args.jobs) {
      const external_id = String(job.id ?? "");
      if (!external_id) continue;
      const existing = await ctx.db
        .query("jobs")
        .withIndex("by_external_id", (q) => q.eq("external_id", external_id))
        .unique();
      const payload = {
        external_id,
        description: job.description as string | undefined,
        application_url: job.application_url as string | undefined,
        experience_level: job.experience_level as string | undefined,
        has_remote: Boolean(job.has_remote),
        language: job.language as string | undefined,
        published_date: job.published ? new Date(job.published as string).getTime() : Date.now(),
        salary_currency: job.salary_currency as string | undefined,
        salary_max: job.salary_max as number | undefined,
        salary_min: job.salary_min as number | undefined,
        salary: job.salary as number | undefined,
        title: job.title as string | undefined,
        company_name: (job.company as { name?: string } | undefined)?.name,
        company_logo: (job.company as { logo?: string } | undefined)?.logo,
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
      if (existing) await ctx.db.patch(existing._id, payload);
      else await ctx.db.insert("jobs", payload);
    }
    return null;
  },
});
