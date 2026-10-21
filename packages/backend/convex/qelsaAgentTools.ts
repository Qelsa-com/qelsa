/**
 * Qelsa Agent tools.
 *
 * Every tool maps to an internal Convex function that resolves the user from
 * `authId` and re-checks ownership, so the model can never act as another user.
 * Reads are bounded (`take`/`limit` caps) and writes that change state require
 * human approval before they run (see `needsApproval`).
 */

import { createTool } from "@convex-dev/agent";
import { generateText } from "ai";
import { v } from "convex/values";
import { z } from "zod/v3";
import { internal } from "./_generated/api";
import type { Doc, Id } from "./_generated/dataModel";
import { internalAction, internalMutation, internalQuery } from "./_generated/server";
import { createAgentChatModel, requireOpenRouter } from "./lib/ai";
import { WITHDRAWN_STATUS, isWithdrawn } from "./lib/applications";
import { bumpJobCount } from "./lib/jobCounts";
import { clipPlainText, skillMatchKey } from "./lib/skillMatch";

const SEARCH_LIMIT_DEFAULT = 8;
const LIST_LIMIT_DEFAULT = 12;

type ToolAuth = { userId?: string | null };

function authIdOf(ctx: ToolAuth) {
  if (!ctx.userId) throw new Error("Sign in to Qelsa before using the agent.");
  return ctx.userId;
}

async function appUser(ctx: { db: any }, authId: string): Promise<Doc<"users">> {
  const user = await ctx.db
    .query("users")
    .withIndex("by_authId", (q: { eq: (field: string, value: string) => unknown }) =>
      q.eq("authId", authId),
    )
    .unique();
  if (!user) throw new Error("Your Qelsa profile is not ready yet. Finish onboarding, then try again.");
  return user as Doc<"users">;
}

function normalizeWorkplace(value: string | undefined) {
  if (!value) return undefined;
  const normalized = value.trim().toLowerCase().replace(/\s+/g, "-").replace("onsite", "on-site");
  if (normalized === "on-site" || normalized === "hybrid" || normalized === "remote") {
    return normalized;
  }
  return undefined;
}

function salaryOf(job: Doc<"jobs">) {
  if (job.salary_min == null && job.salary_max == null) return null;
  return {
    min: job.salary_min ?? null,
    max: job.salary_max ?? null,
    currency: job.salary_currency ?? null,
  };
}

function jobSummary(job: Doc<"jobs">, listing: { company?: string | null; location?: string | null }) {
  return {
    job_id: job._id,
    title: job.title ?? "Untitled role",
    company: listing.company ?? null,
    location: listing.location ?? null,
    workplace_type: job.workplace_type ?? null,
    work_type: job.work_type ?? null,
    experience_years: job.experience ?? null,
    salary: salaryOf(job),
    posted_at: job.published_date ?? null,
    applies_on_external_site: Boolean(job.application_url),
    url_path: `/jobs/${job._id}`,
  };
}

async function cityName(ctx: { db: any }, cityId: Id<"cities"> | undefined) {
  if (!cityId) return null;
  const city = await ctx.db.get(cityId);
  return city?.name ?? null;
}

type JobSearchArgs = {
  query?: string;
  city?: string;
  workplaceType?: string;
  remote?: boolean;
  salaryMin?: number;
  limit?: number;
};

/** Shared by the agent tool and the scheduled saved-search runner. */
async function searchOpenJobs(ctx: { db: any }, args: JobSearchArgs) {
  const limit = Math.min(Math.max(args.limit ?? SEARCH_LIMIT_DEFAULT, 1), 20);
  const needle = (args.query ?? "").trim();

  let candidates: Doc<"jobs">[];
  if (needle) {
    candidates = await ctx.db
      .query("jobs")
      .withSearchIndex("search_title", (q: any) => q.search("title", needle).eq("status", "open"))
      .take(limit * 4);
    if (candidates.length < limit) {
      const byCompany = await ctx.db
        .query("jobs")
        .withSearchIndex("search_company", (q: any) => q.search("company_name", needle).eq("status", "open"))
        .take(limit * 2);
      const seen = new Set(candidates.map((job) => job._id));
      for (const job of byCompany) {
        if (!seen.has(job._id)) candidates.push(job);
      }
    }
  } else {
    candidates = await ctx.db
      .query("jobs")
      .withIndex("by_status_and_published", (q: any) => q.eq("status", "open"))
      .order("desc")
      .take(80);
  }

  let cityIds: Set<Id<"cities">> | null = null;
  const cityQuery = args.city?.trim();
  if (cityQuery) {
    const matches = await ctx.db
      .query("cities")
      .withSearchIndex("search_name", (q: any) => q.search("name", cityQuery))
      .take(8);
    cityIds = new Set(matches.map((city: Doc<"cities">) => city._id));
    if (cityIds.size === 0) {
      return { count: 0, jobs: [], note: `No city matched "${cityQuery}".` };
    }
  }

  const workplace = normalizeWorkplace(args.workplaceType);
  const names = new Map<Id<"cities">, string | null>();
  const jobs = [];
  for (const job of candidates) {
    if (jobs.length >= limit) break;
    if (cityIds && (!job.city_id || !cityIds.has(job.city_id))) continue;
    if (workplace && job.workplace_type !== workplace) continue;
    if (args.remote && !(job.has_remote || job.workplace_type === "remote")) continue;
    if (args.salaryMin != null) {
      const salary = job.salary_max ?? job.salary_min;
      if (salary != null && salary < args.salaryMin) continue;
    }
    let location: string | null = null;
    if (job.city_id) {
      if (!names.has(job.city_id)) names.set(job.city_id, await cityName(ctx, job.city_id));
      location = names.get(job.city_id) ?? null;
    }
    jobs.push(jobSummary(job, { company: job.company_name ?? null, location }));
  }

  return {
    count: jobs.length,
    jobs,
    note: jobs.length === 0 ? "No open jobs matched those filters." : undefined,
  };
}

/* ------------------------------------------------------------------ */
/* Read functions                                                      */
/* ------------------------------------------------------------------ */

export const searchJobsInternal = internalQuery({
  args: {
    authId: v.string(),
    query: v.optional(v.string()),
    city: v.optional(v.string()),
    workplaceType: v.optional(v.string()),
    remote: v.optional(v.boolean()),
    salaryMin: v.optional(v.number()),
    limit: v.optional(v.number()),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    await appUser(ctx, args.authId);
    return await searchOpenJobs(ctx, args);
  },
});

/** The scheduled layer already knows the user; never trust a client user id. */
export const searchJobsForSavedSearchInternal = internalQuery({
  args: {
    userId: v.id("users"),
    query: v.optional(v.string()),
    city: v.optional(v.string()),
    workplaceType: v.optional(v.string()),
    remote: v.optional(v.boolean()),
    salaryMin: v.optional(v.number()),
    limit: v.optional(v.number()),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) return { count: 0, jobs: [] };
    return await searchOpenJobs(ctx, args);
  },
});

export const getJobDetailsInternal = internalQuery({
  args: { authId: v.string(), jobId: v.id("jobs") },
  returns: v.any(),
  handler: async (ctx, args) => {
    const user = await appUser(ctx, args.authId);
    const job = await ctx.db.get(args.jobId);
    if (!job) throw new Error("That job no longer exists.");

    const page = job.page_id ? await ctx.db.get(job.page_id) : null;
    const existingApplications = await ctx.db
      .query("job_applications")
      .withIndex("by_job_and_user", (q) => q.eq("job_id", args.jobId).eq("user_id", user._id))
      .collect();
    const alreadyApplied = existingApplications.some(
      (application) => application.status !== "rejected" && application.status !== "cancelled",
    );
    const links = await ctx.db
      .query("job_skills")
      .withIndex("by_job", (q) => q.eq("job_id", args.jobId))
      .take(16);
    const skills: string[] = [];
    for (const link of links) {
      const skill = await ctx.db.get(link.skill_id);
      if (skill) skills.push(skill.name);
    }

    return {
      ...jobSummary(job, {
        company: job.company_name ?? page?.name ?? null,
        location: await cityName(ctx, job.city_id),
      }),
      status: job.status,
      description: clipPlainText(job.description, 2800),
      skills,
      responsibilities: (job.other_info as { responsibilities?: string[] } | undefined)?.responsibilities ?? [],
      apply_inside_qelsa: !job.application_url,
      application_url: job.application_url ?? null,
      already_applied: alreadyApplied,
      page: page ? { name: page.name, type: page.type ?? null, website: page.website ?? null } : null,
    };
  },
});

export const getMyApplicationsInternal = internalQuery({
  args: { authId: v.string(), limit: v.optional(v.number()) },
  returns: v.any(),
  handler: async (ctx, args) => {
    const user = await appUser(ctx, args.authId);
    const limit = Math.min(Math.max(args.limit ?? LIST_LIMIT_DEFAULT, 1), 25);
    const rows = await ctx.db
      .query("job_applications")
      .withIndex("by_user", (q) => q.eq("user_id", user._id))
      .order("desc")
      .take(limit);

    const applications = [];
    for (const row of rows) {
      const job = await ctx.db.get(row.job_id);
      applications.push({
        application_id: row._id,
        status: row.status,
        applied_at: row.applied_at,
        job: job
          ? jobSummary(job, { company: job.company_name ?? null, location: null })
          : { job_id: row.job_id, title: "Job removed", company: null, location: null },
      });
    }
    return { count: applications.length, applications };
  },
});

export const listSavedJobsInternal = internalQuery({
  args: { authId: v.string(), limit: v.optional(v.number()) },
  returns: v.any(),
  handler: async (ctx, args) => {
    const user = await appUser(ctx, args.authId);
    const limit = Math.min(Math.max(args.limit ?? LIST_LIMIT_DEFAULT, 1), 25);
    const saved = await ctx.db
      .query("saved_jobs")
      .withIndex("by_user", (q) => q.eq("user_id", user._id))
      .take(60);

    // One pass over active applications so saved-and-applied jobs stay out.
    const active = await ctx.db
      .query("job_applications")
      .withIndex("by_user", (q) => q.eq("user_id", user._id))
      .take(200);
    const applied = new Set(
      active
        .filter((row) => row.status !== "rejected" && row.status !== "cancelled")
        .map((row) => String(row.job_id)),
    );

    const jobs = [];
    for (const row of saved) {
      if (jobs.length >= limit) break;
      if (applied.has(String(row.job_id))) continue;
      const job = await ctx.db.get(row.job_id);
      if (!job) continue;
      jobs.push(jobSummary(job, { company: job.company_name ?? null, location: null }));
    }
    return { count: jobs.length, jobs };
  },
});

export const getPreferredResumeInternal = internalQuery({
  args: { authId: v.string() },
  returns: v.any(),
  handler: async (ctx, args) => {
    const user = await appUser(ctx, args.authId);
    let resume = user.default_resume_id ? await ctx.db.get(user.default_resume_id) : null;
    if (!resume) {
      resume = await ctx.db
        .query("resumes")
        .withIndex("by_user", (q) => q.eq("user_id", user._id))
        .first();
    }
    if (!resume) return { resume: null, note: "The user has not uploaded a resume yet." };
    return {
      resume: {
        resume_id: resume._id,
        title: resume.title,
        url: resume.file_url ?? null,
      },
    };
  },
});

export const getJobReadinessInternal = internalQuery({
  args: { authId: v.string(), jobId: v.id("jobs") },
  returns: v.any(),
  handler: async (ctx, args) => {
    const user = await appUser(ctx, args.authId);
    const session = await ctx.db
      .query("job_match_sessions")
      .withIndex("by_user_and_job", (q) => q.eq("user_id", user._id).eq("job_id", args.jobId))
      .order("desc")
      .first();
    if (!session) {
      return {
        available: false,
        note: "No readiness analysis exists for this job yet. Open the job's Qelsa Match on its page to run one, then ask again.",
        job_url_path: `/jobs/${args.jobId}`,
      };
    }
    const analysis = session.analysis;
    return {
      available: true,
      session_id: session._id,
      overall: analysis.overall,
      headline: analysis.headline,
      strong: analysis.strong.slice(0, 12),
      partial: analysis.partial.slice(0, 12),
      missing: analysis.missing.slice(0, 12),
      experience_match: analysis.experience_match,
      education_match: analysis.education_match,
      domain_match: analysis.domain_match,
      responsibilities_match: analysis.responsibilities_match,
      actions: analysis.actions.slice(0, 8),
      can_apply: analysis.can_apply,
      match_url_path: `/jobs/match/${session._id}`,
    };
  },
});

export const getApplicationQuestionsInternal = internalQuery({
  args: { authId: v.string(), jobId: v.id("jobs") },
  returns: v.any(),
  handler: async (ctx, args) => {
    await appUser(ctx, args.authId);
    const job = await ctx.db.get(args.jobId);
    if (!job) throw new Error("That job no longer exists.");
    const set = await ctx.db
      .query("question_sets")
      .withIndex("by_job", (q) => q.eq("jobId", args.jobId))
      .first();
    if (!set) {
      return {
        job: jobSummary(job, { company: job.company_name ?? null, location: await cityName(ctx, job.city_id) }),
        questions: [],
        note: "This job has no screening questions. A resume and optional cover letter are enough.",
      };
    }
    const rows = await ctx.db
      .query("questions")
      .withIndex("by_set", (q) => q.eq("question_set_id", set._id))
      .take(40);
    const questions = [];
    for (const question of rows) {
      const optionRows = await ctx.db
        .query("options")
        .withIndex("by_question", (q) => q.eq("question_id", question._id))
        .take(16);
      questions.push({
        question_id: question._id,
        title: question.title,
        type: question.type,
        category: question.category ?? null,
        required: question.required ?? false,
        is_knockout: question.is_knockout ?? false,
        options: optionRows.map((option) => ({
          option_id: option._id,
          title: option.title,
          value: option.value ?? null,
        })),
      });
    }
    return {
      job: jobSummary(job, { company: job.company_name ?? null, location: await cityName(ctx, job.city_id) }),
      questions,
      note: questions.length ? undefined : "This job has no screening questions.",
    };
  },
});

export const getApplicationDetailsInternal = internalQuery({
  args: { authId: v.string(), applicationId: v.id("job_applications") },
  returns: v.any(),
  handler: async (ctx, args) => {
    const user = await appUser(ctx, args.authId);
    const application = await ctx.db.get(args.applicationId);
    if (!application || application.user_id !== user._id) throw new Error("Application not found.");
    const job = await ctx.db.get(application.job_id);
    const [answers, notes, logs] = await Promise.all([
      ctx.db
        .query("job_application_answers")
        .withIndex("by_application", (q) => q.eq("job_application_id", application._id))
        .take(50),
      ctx.db
        .query("agent_application_notes")
        .withIndex("by_application", (q) => q.eq("application_id", application._id))
        .order("desc")
        .take(20),
      ctx.db
        .query("job_application_logs")
        .withIndex("by_application", (q) => q.eq("job_application_id", application._id))
        .order("desc")
        .take(20),
    ]);
    return {
      application_id: application._id,
      status: application.status,
      applied_at: application.applied_at,
      withdrawn_at: application.withdrawn_at ?? null,
      can_withdraw: application.status !== "cancelled" && application.status !== "rejected",
      job: job
        ? jobSummary(job, { company: job.company_name ?? null, location: await cityName(ctx, job.city_id) })
        : null,
      answers: answers.map((row) => ({
        question_id: row.question_id,
        question: row.question,
        answer: row.answer ?? null,
      })),
      notes: notes.map((row) => ({ note_id: row._id, text: row.text, created_at: row.created_at })),
      history: logs.map((row) => ({
        old_status: row.old_status,
        new_status: row.new_status,
      })),
    };
  },
});

export const listStaleApplicationsInternal = internalQuery({
  args: { authId: v.string(), days: v.optional(v.number()), limit: v.optional(v.number()) },
  returns: v.any(),
  handler: async (ctx, args) => {
    const user = await appUser(ctx, args.authId);
    const days = Math.min(Math.max(args.days ?? 7, 1), 90);
    const limit = Math.min(Math.max(args.limit ?? 8, 1), 20);
    const cutoff = Date.now() - days * 86_400_000;
    const rows = await ctx.db
      .query("job_applications")
      .withIndex("by_user", (q) => q.eq("user_id", user._id))
      .order("desc")
      .take(100);
    const stale = [];
    for (const row of rows) {
      if (stale.length >= limit) break;
      if (row.status !== "applied" && row.status !== "viewed") continue;
      if (row.applied_at > cutoff) continue;
      const job = await ctx.db.get(row.job_id);
      if (!job) continue;
      stale.push({
        application_id: row._id,
        status: row.status,
        applied_at: row.applied_at,
        days_since_application: Math.floor((Date.now() - row.applied_at) / 86_400_000),
        job: jobSummary(job, { company: job.company_name ?? null, location: await cityName(ctx, job.city_id) }),
      });
    }
    return { days, count: stale.length, applications: stale };
  },
});

export const getJobPreferencesInternal = internalQuery({
  args: { authId: v.string() },
  returns: v.any(),
  handler: async (ctx, args) => {
    const user = await appUser(ctx, args.authId);
    const city = user.city_id ? await ctx.db.get(user.city_id) : null;
    return {
      city: city?.name ?? null,
      relocate_locations: user.relocate_locations ?? [],
      want_to_relocate: user.want_to_relocate ?? null,
      work_preference: user.work_preference ?? null,
      expected_min_salary: user.expected_min_salary ?? null,
      expected_max_salary: user.expected_max_salary ?? null,
      expected_salary_currency: user.expected_salary_currency ?? null,
      job_seeking_status: user.job_seeking_status ?? null,
      preferences: {
        full_time: user.preffer_full_time ?? null,
        part_time: user.preffer_part_time ?? null,
        contract: user.preffer_contract ?? null,
        internship: user.preffer_internship ?? null,
        freelance: user.preffer_freelance ?? null,
      },
    };
  },
});

/* ------------------------------------------------------------------ */
/* Write mutations                                                     */
/* ------------------------------------------------------------------ */

export const setSavedJobInternal = internalMutation({
  args: { authId: v.string(), jobId: v.id("jobs"), save: v.boolean() },
  returns: v.any(),
  handler: async (ctx, args) => {
    const user = await appUser(ctx, args.authId);
    const job = await ctx.db.get(args.jobId);
    if (!job) throw new Error("That job no longer exists.");

    const saved = await ctx.db
      .query("saved_jobs")
      .withIndex("by_job_and_user", (q) => q.eq("job_id", args.jobId).eq("user_id", user._id))
      .collect();

    if (!args.save) {
      for (const row of saved) await ctx.db.delete(row._id);
      return { saved: false, job: jobSummary(job, { company: job.company_name ?? null, location: null }) };
    }

    const applications = await ctx.db
      .query("job_applications")
      .withIndex("by_job_and_user", (q) => q.eq("job_id", args.jobId).eq("user_id", user._id))
      .collect();
    if (applications.some((a) => a.status !== "rejected" && a.status !== "cancelled")) {
      throw new Error("You have already applied to this job, so it cannot be saved.");
    }
    if (saved.length === 0) {
      await ctx.db.insert("saved_jobs", { job_id: args.jobId, user_id: user._id });
    }
    return { saved: true, job: jobSummary(job, { company: job.company_name ?? null, location: null }) };
  },
});

async function insertApplication(
  ctx: any,
  user: Doc<"users">,
  job: Doc<"jobs">,
  coverLetter: string | undefined,
  resumeId: Id<"resumes"> | undefined,
) {
  const existing = await ctx.db
    .query("job_applications")
    .withIndex("by_job_and_user", (q: any) => q.eq("job_id", job._id).eq("user_id", user._id))
    .collect();
  if (existing.some((a: Doc<"job_applications">) => a.status !== "rejected" && a.status !== "cancelled")) {
    throw new Error("You have already applied to this job.");
  }

  let chosenResume = resumeId;
  if (!chosenResume && user.default_resume_id) chosenResume = user.default_resume_id;
  if (!chosenResume) {
    const firstResume = await ctx.db
      .query("resumes")
      .withIndex("by_user", (q: any) => q.eq("user_id", user._id))
      .first();
    chosenResume = firstResume?._id;
  }

  const id = await ctx.db.insert("job_applications", {
    user_id: user._id,
    job_id: job._id,
    resume_id: chosenResume,
    cover_letter: coverLetter,
    status: "applied",
    applied_at: Date.now(),
  });
  await bumpJobCount(ctx, job._id, "application_count", 1);

  const savedRows = await ctx.db
    .query("saved_jobs")
    .withIndex("by_job_and_user", (q: any) => q.eq("job_id", job._id).eq("user_id", user._id))
    .collect();
  for (const row of savedRows) await ctx.db.delete(row._id);

  return id;
}

export const applyToQelsaJobInternal = internalMutation({
  args: {
    authId: v.string(),
    jobId: v.id("jobs"),
    coverLetter: v.optional(v.string()),
    resumeId: v.optional(v.id("resumes")),
    answers: v.optional(v.any()),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    const user = await appUser(ctx, args.authId);
    const job = await ctx.db.get(args.jobId);
    if (!job) throw new Error("That job no longer exists.");
    if (job.status !== "open") throw new Error(`This job is ${job.status}, so applications are closed.`);
    if (job.application_url) {
      throw new Error(
        "This job is applied to on an external site. Use prepare_external_application, then record_external_application once the user confirms they applied.",
      );
    }
    if (args.resumeId) {
      const resume = await ctx.db.get(args.resumeId);
      if (!resume || resume.user_id !== user._id) throw new Error("That resume does not belong to you.");
    }

    const set = await ctx.db
      .query("question_sets")
      .withIndex("by_job", (q) => q.eq("jobId", args.jobId))
      .first();
    const questionRows = set
      ? await ctx.db.query("questions").withIndex("by_set", (q) => q.eq("question_set_id", set._id)).take(40)
      : [];
    const byId = new Map(questionRows.map((question) => [String(question._id), question]));
    const rawAnswers = args.answers && typeof args.answers === "object" && !Array.isArray(args.answers)
      ? (args.answers as Record<string, unknown>)
      : {};
    const answers: Array<{ question: Doc<"questions">; answer: string }> = [];
    for (const [questionId, raw] of Object.entries(rawAnswers)) {
      const question = byId.get(questionId);
      if (!question) continue;
      const answer = typeof raw === "string" ? raw.trim().slice(0, 3000) : "";
      if (!answer) continue;
      answers.push({ question, answer });
    }
    const missingRequired = questionRows.filter(
      (question) => question.required && !answers.some((row) => row.question._id === question._id),
    );
    if (missingRequired.length) {
      throw new Error(
        `Answer the required application question${missingRequired.length > 1 ? "s" : ""}: ${missingRequired
          .map((question) => question.title)
          .join("; ")}`,
      );
    }

    const coverLetter = args.coverLetter?.trim() ? args.coverLetter.trim().slice(0, 4000) : undefined;
    const id = await insertApplication(ctx, user, job, coverLetter, args.resumeId);
    for (const row of answers) {
      await ctx.db.insert("job_application_answers", {
        job_id: job._id,
        job_application_id: id,
        user_id: user._id,
        question_id: row.question._id,
        question: row.question.title,
        answer: row.answer,
      });
    }
    return {
      application_id: id,
      status: "applied",
      answers_count: answers.length,
      resume_id: args.resumeId ?? user.default_resume_id ?? null,
      job: jobSummary(job, { company: job.company_name ?? null, location: await cityName(ctx, job.city_id) }),
    };
  },
});

export const recordExternalApplicationInternal = internalMutation({
  args: {
    authId: v.string(),
    jobId: v.id("jobs"),
    coverLetter: v.optional(v.string()),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    const user = await appUser(ctx, args.authId);
    const job = await ctx.db.get(args.jobId);
    if (!job) throw new Error("That job no longer exists.");
    if (!job.application_url) {
      throw new Error("This job applies inside Qelsa. Use apply_to_job instead.");
    }
    const coverLetter = args.coverLetter?.trim() ? args.coverLetter.trim().slice(0, 4000) : undefined;
    const id = await insertApplication(ctx, user, job, coverLetter, undefined);
    return {
      application_id: id,
      status: "applied",
      application_url: job.application_url,
      job: jobSummary(job, { company: job.company_name ?? null, location: null }),
    };
  },
});

const TIMELINES = ["3_months", "6_months", "1_year", "2_plus_years"] as const;
const EXPERIENCE_LEVELS = ["entry", "mid", "senior", "lead"] as const;
const PRIMARY_FOCUS = ["switch_roles", "get_promoted", "switch_industries", "upskill"] as const;

function cleanList(values: string[] | undefined, maxItems: number, maxLength: number) {
  const out: string[] = [];
  for (const value of values ?? []) {
    const trimmed = value.trim().slice(0, maxLength);
    if (trimmed) out.push(trimmed);
    if (out.length >= maxItems) break;
  }
  return out;
}

function pickOption<T extends readonly string[]>(value: string | undefined, options: T): T[number] | undefined {
  if (!value) return undefined;
  const normalized = value.trim().toLowerCase();
  return options.includes(normalized as T[number]) ? (normalized as T[number]) : undefined;
}

export const saveCareerGoalInternal = internalMutation({
  args: {
    authId: v.string(),
    targetRole: v.string(),
    targetRoles: v.optional(v.array(v.string())),
    dreamCompanies: v.optional(v.array(v.string())),
    industries: v.optional(v.array(v.string())),
    skills: v.optional(v.array(v.string())),
    timeline: v.optional(v.string()),
    experienceLevel: v.optional(v.string()),
    primaryFocus: v.optional(v.string()),
    description: v.optional(v.string()),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    const user = await appUser(ctx, args.authId);
    const targetRole = args.targetRole.trim().slice(0, 120);
    if (!targetRole) throw new Error("A target role is required for a career goal.");
    const targetRoles = cleanList(args.targetRoles, 4, 120);

    const fields = {
      user_id: user._id,
      target_role: targetRole,
      target_roles: targetRoles,
      dream_companies: cleanList(args.dreamCompanies, 8, 80),
      industries: cleanList(args.industries, 10, 60),
      skills: cleanList(args.skills, 12, 60),
      updated_at: Date.now(),
      ...(args.description?.trim() ? { description: args.description.trim().slice(0, 600) } : {}),
      ...(pickOption(args.timeline, TIMELINES) ? { timeline: pickOption(args.timeline, TIMELINES) } : {}),
      ...(pickOption(args.experienceLevel, EXPERIENCE_LEVELS)
        ? { experience_level: pickOption(args.experienceLevel, EXPERIENCE_LEVELS) }
        : {}),
      ...(pickOption(args.primaryFocus, PRIMARY_FOCUS)
        ? { primary_focus: pickOption(args.primaryFocus, PRIMARY_FOCUS) }
        : {}),
    };

    const existing = await ctx.db
      .query("career_goals")
      .withIndex("by_user", (q) => q.eq("user_id", user._id))
      .unique();
    if (existing) {
      await ctx.db.patch(existing._id, fields);
    } else {
      await ctx.db.insert("career_goals", fields);
    }
    return {
      target_role: fields.target_role,
      dream_companies: fields.dream_companies,
      skills: fields.skills,
      timeline: fields.timeline ?? null,
      experience_level: fields.experience_level ?? null,
    };
  },
});

export const updateProfileInternal = internalMutation({
  args: {
    authId: v.string(),
    headline: v.optional(v.string()),
    professionalSummary: v.optional(v.string()),
    about: v.optional(v.string()),
    cityName: v.optional(v.string()),
    workPreference: v.optional(v.string()),
    expectedMinSalary: v.optional(v.number()),
    expectedMaxSalary: v.optional(v.number()),
    expectedSalaryCurrency: v.optional(v.string()),
    wantToRelocate: v.optional(v.boolean()),
    relocateLocations: v.optional(v.array(v.string())),
    jobSeekingStatus: v.optional(v.string()),
    preferredResumeId: v.optional(v.id("resumes")),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    const user = await appUser(ctx, args.authId);
    const updates: Record<string, unknown> = {};
    if (args.headline !== undefined) updates.headline = args.headline.trim().slice(0, 160);
    if (args.professionalSummary !== undefined) {
      updates.professional_summary = args.professionalSummary.trim().slice(0, 1200);
      if (args.about === undefined) updates.about = updates.professional_summary;
    }
    if (args.about !== undefined) updates.about = args.about.trim().slice(0, 1200);
    if (args.workPreference !== undefined) updates.work_preference = args.workPreference.trim().slice(0, 80);
    if (args.expectedMinSalary !== undefined) updates.expected_min_salary = Math.max(0, Math.round(args.expectedMinSalary));
    if (args.expectedMaxSalary !== undefined) updates.expected_max_salary = Math.max(0, Math.round(args.expectedMaxSalary));
    if (args.expectedSalaryCurrency !== undefined) {
      updates.expected_salary_currency = args.expectedSalaryCurrency.trim().toUpperCase().slice(0, 8);
    }
    if (args.wantToRelocate !== undefined) updates.want_to_relocate = args.wantToRelocate;
    if (args.relocateLocations !== undefined) {
      const locations = cleanList(args.relocateLocations, 8, 80);
      updates.relocate_locations = locations;
      updates.relocate_location = locations[0] ?? undefined;
    }
    if (
      args.jobSeekingStatus !== undefined &&
      ["actively_hunting", "exploring", "building_skills"].includes(args.jobSeekingStatus)
    ) {
      updates.job_seeking_status = args.jobSeekingStatus;
    }
    if (args.cityName !== undefined) {
      const city = await ctx.db
        .query("cities")
        .withSearchIndex("search_name", (q) => q.search("name", args.cityName!.trim()))
        .first();
      if (!city) throw new Error(`I couldn't find a city named "${args.cityName}".`);
      updates.city_id = city._id;
    }
    if (args.preferredResumeId !== undefined) {
      const resume = await ctx.db.get(args.preferredResumeId);
      if (!resume || resume.user_id !== user._id) throw new Error("That resume does not belong to you.");
      updates.default_resume_id = args.preferredResumeId;
    }
    if ((updates.expected_min_salary as number | undefined) != null && (updates.expected_max_salary as number | undefined) != null) {
      if ((updates.expected_min_salary as number) > (updates.expected_max_salary as number)) {
        throw new Error("The minimum salary cannot be higher than the maximum salary.");
      }
    }
    if (Object.keys(updates).length === 0) {
      return { updated: false, message: "Nothing changed." };
    }
    await ctx.db.patch(user._id, updates);
    return { updated: true, fields: Object.keys(updates), message: "Profile updated." };
  },
});

const SKILL_PROFICIENCIES = ["beginner", "intermediate", "advance", "expert"] as const;

export const addProfileSkillsInternal = internalMutation({
  args: {
    authId: v.string(),
    skills: v.array(
      v.object({
        name: v.string(),
        proficiency: v.optional(v.string()),
        is_top_skill: v.optional(v.boolean()),
      }),
    ),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    const user = await appUser(ctx, args.authId);
    const added = [];
    const alreadyPresent = [];
    const unmatched: string[] = [];
    const seen = new Set<string>();
    for (const raw of args.skills.slice(0, 12)) {
      const name = raw.name.trim().slice(0, 80);
      if (!name) continue;
      const key = skillMatchKey(name);
      if (!key || seen.has(key)) continue;
      seen.add(key);
      let skill = await ctx.db
        .query("skills")
        .withIndex("by_match_key", (q) => q.eq("match_key", key))
        .first();
      if (!skill) {
        skill = await ctx.db
          .query("skills")
          .withSearchIndex("search_name", (q) => q.search("name", name))
          .first();
      }
      if (!skill) {
        unmatched.push(name);
        continue;
      }
      const existing = await ctx.db
        .query("user_skills")
        .withIndex("by_user_and_skill", (q) => q.eq("user_id", user._id).eq("skill_id", skill!._id))
        .unique();
      const normalizedProficiency = raw.proficiency === "advanced" ? "advance" : raw.proficiency;
      const proficiency = normalizedProficiency && (SKILL_PROFICIENCIES as readonly string[]).includes(normalizedProficiency)
        ? (normalizedProficiency as (typeof SKILL_PROFICIENCIES)[number])
        : undefined;
      if (existing) {
        const patch: Record<string, unknown> = {};
        if (proficiency) {
          patch.proficiency = proficiency;
          patch.proficiency_inferred = false;
        }
        if (raw.is_top_skill !== undefined) patch.is_top_skill = raw.is_top_skill;
        if (Object.keys(patch).length) await ctx.db.patch(existing._id, patch);
        alreadyPresent.push(skill.name);
      } else {
        await ctx.db.insert("user_skills", {
          user_id: user._id,
          skill_id: skill._id,
          category_id: skill.category_id,
          ...(proficiency ? { proficiency, proficiency_inferred: false } : {}),
          ...(raw.is_top_skill !== undefined ? { is_top_skill: raw.is_top_skill } : {}),
        });
        added.push(skill.name);
      }
    }
    return {
      updated: added.length + alreadyPresent.length,
      added,
      already_present: alreadyPresent,
      unmatched,
      message: unmatched.length
        ? `Some skills were not in the Qelsa catalog: ${unmatched.join(", ")}.`
        : undefined,
    };
  },
});

export const withdrawApplicationInternal = internalMutation({
  args: { authId: v.string(), applicationId: v.id("job_applications") },
  returns: v.any(),
  handler: async (ctx, args) => {
    const user = await appUser(ctx, args.authId);
    const app = await ctx.db.get(args.applicationId);
    if (!app || app.user_id !== user._id) throw new Error("Application not found.");
    if (isWithdrawn(app.status)) {
      return { status: WITHDRAWN_STATUS, already_withdrawn: true };
    }
    if (app.status === "rejected") throw new Error("This application can no longer be withdrawn.");
    const withdrawnAt = Date.now();
    await ctx.db.patch(app._id, { status: WITHDRAWN_STATUS, withdrawn_at: withdrawnAt });
    await ctx.db.insert("job_application_logs", {
      job_id: app.job_id,
      job_application_id: app._id,
      created_by_id: user._id,
      action_type: "status_changed",
      old_status: app.status,
      new_status: WITHDRAWN_STATUS,
    });
    await bumpJobCount(ctx, app.job_id, "application_count", -1);
    return { status: WITHDRAWN_STATUS, withdrawn_at: withdrawnAt };
  },
});

export const addApplicationNoteInternal = internalMutation({
  args: { authId: v.string(), applicationId: v.id("job_applications"), text: v.string() },
  returns: v.any(),
  handler: async (ctx, args) => {
    const user = await appUser(ctx, args.authId);
    const application = await ctx.db.get(args.applicationId);
    if (!application || application.user_id !== user._id) throw new Error("Application not found.");
    const text = args.text.trim().slice(0, 2000);
    if (!text) throw new Error("A note cannot be empty.");
    const noteId = await ctx.db.insert("agent_application_notes", {
      user_id: user._id,
      application_id: application._id,
      text,
      created_at: Date.now(),
    });
    return { note_id: noteId, text };
  },
});

export const saveSavedSearchInternal = internalMutation({
  args: {
    authId: v.string(),
    name: v.string(),
    query: v.optional(v.string()),
    city: v.optional(v.string()),
    workplaceType: v.optional(v.string()),
    remote: v.optional(v.boolean()),
    salaryMin: v.optional(v.number()),
    emailAlerts: v.optional(v.boolean()),
    pushAlerts: v.optional(v.boolean()),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    const user = await appUser(ctx, args.authId);
    const name = args.name.trim().slice(0, 80);
    if (!name) throw new Error("Give this search a short name.");
    const existing = await ctx.db
      .query("agent_saved_searches")
      .withIndex("by_user", (q) => q.eq("user_id", user._id))
      .take(10);
    if (existing.length >= 5) throw new Error("You can keep up to 5 saved searches. Remove one first.");
    const current = await searchOpenJobs(ctx, {
      query: args.query,
      city: args.city,
      workplaceType: args.workplaceType,
      remote: args.remote,
      salaryMin: args.salaryMin,
      limit: 12,
    });
    const seen = current.jobs
      .map((job) => job.job_id)
      .filter((id): id is Id<"jobs"> => typeof id === "string") as Id<"jobs">[];
    const id = await ctx.db.insert("agent_saved_searches", {
      user_id: user._id,
      name,
      query: args.query?.trim() || undefined,
      city: args.city?.trim() || undefined,
      workplace_type: normalizeWorkplace(args.workplaceType),
      remote: args.remote,
      salary_min: args.salaryMin,
      email_alerts: args.emailAlerts ?? true,
      push_alerts: args.pushAlerts ?? true,
      active: true,
      created_at: Date.now(),
      seen_job_ids: seen.slice(0, 50),
    });
    return { saved_search_id: id, name, current_matches: current.count };
  },
});

export const listSavedSearchesInternal = internalQuery({
  args: { authId: v.string() },
  returns: v.any(),
  handler: async (ctx, args) => {
    const user = await appUser(ctx, args.authId);
    const rows = await ctx.db
      .query("agent_saved_searches")
      .withIndex("by_user", (q) => q.eq("user_id", user._id))
      .take(20);
    return {
      count: rows.length,
      searches: rows.map((row) => ({
        saved_search_id: row._id,
        name: row.name,
        query: row.query ?? null,
        city: row.city ?? null,
        workplace_type: row.workplace_type ?? null,
        remote: row.remote ?? null,
        salary_min: row.salary_min ?? null,
        email_alerts: row.email_alerts ?? true,
        push_alerts: row.push_alerts ?? true,
        active: row.active,
        last_checked_at: row.last_checked_at ?? null,
      })),
    };
  },
});

export const deleteSavedSearchInternal = internalMutation({
  args: { authId: v.string(), savedSearchId: v.id("agent_saved_searches") },
  returns: v.any(),
  handler: async (ctx, args) => {
    const user = await appUser(ctx, args.authId);
    const row = await ctx.db.get(args.savedSearchId);
    if (!row || row.user_id !== user._id) throw new Error("Saved search not found.");
    await ctx.db.delete(row._id);
    return { deleted: true, name: row.name };
  },
});

export const updateSavedSearchAlertsInternal = internalMutation({
  args: {
    authId: v.string(),
    savedSearchId: v.id("agent_saved_searches"),
    emailAlerts: v.optional(v.boolean()),
    pushAlerts: v.optional(v.boolean()),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    const user = await appUser(ctx, args.authId);
    const row = await ctx.db.get(args.savedSearchId);
    if (!row || row.user_id !== user._id) throw new Error("Saved search not found.");
    const patch: Record<string, unknown> = {};
    if (args.emailAlerts !== undefined) patch.email_alerts = args.emailAlerts;
    if (args.pushAlerts !== undefined) patch.push_alerts = args.pushAlerts;
    if (!Object.keys(patch).length) return { updated: false, name: row.name };
    await ctx.db.patch(row._id, patch);
    return {
      updated: true,
      name: row.name,
      email_alerts: patch.email_alerts ?? row.email_alerts ?? true,
      push_alerts: patch.push_alerts ?? row.push_alerts ?? true,
    };
  },
});

/* ------------------------------------------------------------------ */
/* Cover letter generation (no DB side effects)                        */
/* ------------------------------------------------------------------ */

export const generateCoverLetterInternal = internalAction({
  args: { authId: v.string(), jobId: v.id("jobs"), instructions: v.optional(v.string()) },
  returns: v.any(),
  handler: async (ctx, args): Promise<any> => {
    requireOpenRouter();
    const context = await ctx.runQuery(internal.coverLetter.loadContextForCoverLetter, {
      authId: args.authId,
      jobId: args.jobId,
    });
    if (!context) throw new Error("Could not load the profile and job needed to write a cover letter.");

    const prompt = `You are an expert career advisor. Write a compelling, concise, professional cover letter (around 150-220 words).
The candidate is applying for:
Job Title: ${context.jobTitle}
Company: ${context.companyName}

Job Context / Description:
${clipPlainText(context.jobDescription, 2500) || "Standard industry responsibilities for this role"}

Candidate Profile:
- Name: ${context.candidateName}
- Headline: ${context.headline || "Professional"}
- Key Skills: ${context.skills.join(", ") || "Relevant domain skills"}
- Key Experience: ${context.experiences.map((e: { title: string; company: string }) => `${e.title} at ${e.company}`).join("; ") || "Relevant past experience"}
- Education: ${context.educations.join("; ") || "Relevant background"}
${args.instructions ? `\nAdditional instructions from the user (follow these):\n${clipPlainText(args.instructions, 600)}\n` : ""}
Requirements:
- Start directly with "Dear Hiring Team at ${context.companyName}," (no date, no placeholder address).
- Write in first person ("I").
- Connect the candidate's specific background and skills to the role.
- Keep tone professional, confident, and genuine (not generic or overly flowery).
- End with a professional sign-off and the candidate's name: "${context.candidateName}".
- Output ONLY the cover letter text, no explanations, no markdown formatting or quotes.`;

    const response = await generateText({
      model: createAgentChatModel("low"),
      prompt,
      temperature: 0.7,
      maxRetries: 2,
      timeout: { totalMs: 90_000 },
    });
    const text = response.text.trim();
    if (!text || text.length < 50) throw new Error("The cover letter came back empty. Try again.");
    return { cover_letter: text, job_title: context.jobTitle, company: context.companyName };
  },
});

/* ------------------------------------------------------------------ */
/* Tools exposed to the model                                          */
/* ------------------------------------------------------------------ */

const limitSchema = z
  .number()
  .int()
  .min(1)
  .max(20)
  .optional()
  .describe("How many results to return (1-20, default 8).");

export const searchJobsTool = createTool({
  description:
    "Search open jobs on Qelsa by keywords, city, workplace type, or remote. Use this whenever the user asks for jobs, roles, or openings. Returns compact job cards with job_id values used by other tools.",
  inputSchema: z.object({
    query: z.string().optional().describe("Keywords matched against the job title and company name."),
    city: z.string().optional().describe("City name to filter by, e.g. 'Bangalore'."),
    workplace_type: z.enum(["on-site", "hybrid", "remote"]).optional().describe("Workplace type filter."),
    remote: z.boolean().optional().describe("Set true to only return remote-friendly jobs."),
    salary_min: z.number().optional().describe("Only include jobs whose known maximum salary is at least this amount."),
    limit: limitSchema,
  }),
  execute: async (ctx, args): Promise<any> =>
    ctx.runQuery(internal.qelsaAgentTools.searchJobsInternal, {
      authId: authIdOf(ctx),
      query: args.query,
      city: args.city,
      workplaceType: args.workplace_type,
      remote: args.remote,
      salaryMin: args.salary_min,
      limit: args.limit,
    }),
});

export const getJobDetailsTool = createTool({
  description:
    "Get the full details of one Qelsa job: description, skills, salary, workplace type, and whether it is applied to inside Qelsa or on an external site. Use the job_id from search results.",
  inputSchema: z.object({
    job_id: z.string().describe("The job_id returned by search_jobs or list_saved_jobs."),
  }),
  execute: async (ctx, args): Promise<any> =>
    ctx.runQuery(internal.qelsaAgentTools.getJobDetailsInternal, {
      authId: authIdOf(ctx),
      jobId: args.job_id as Id<"jobs">,
    }),
});

export const getMyProfileTool = createTool({
  description:
    "Read the signed-in user's Qelsa profile: name, headline, skills, experience, education, certifications, resumes, and career goal. Call this before giving advice about the user's readiness or before writing a cover letter.",
  inputSchema: z.object({}),
  execute: async (ctx): Promise<any> => {
    const authId = authIdOf(ctx);
    const [loaded, preferences]: any[] = await Promise.all([
      ctx.runQuery(internal.jobMatch.loadUserContext, { authId }),
      ctx.runQuery(internal.qelsaAgentTools.getJobPreferencesInternal, { authId }),
    ]);
    return {
      profile: loaded.profile,
      skills: (loaded.skills ?? []).slice(0, 40),
      experiences: (loaded.experiences ?? []).slice(0, 8),
      educations: (loaded.educations ?? []).slice(0, 6),
      projects: (loaded.projects ?? []).slice(0, 12),
      certifications: (loaded.certifications ?? []).slice(0, 8),
      resumes: (loaded.resumes ?? []).map((resume: any) => ({
        resume_id: resume.id,
        title: resume.title,
        has_extracted_text: Boolean(resume.text?.trim()),
      })),
      job_preferences: preferences,
    };
  },
});

export const listMyApplicationsTool = createTool({
  description:
    "List the user's recent job applications with statuses (applied, viewed, shortlisted, sorted, rejected, hold, cancelled). Use this to answer 'where are my applications?' or before suggesting next steps.",
  inputSchema: z.object({ limit: limitSchema }),
  execute: async (ctx, args): Promise<any> =>
    ctx.runQuery(internal.qelsaAgentTools.getMyApplicationsInternal, {
      authId: authIdOf(ctx),
      limit: args.limit,
    }),
});

export const listSavedJobsTool = createTool({
  description: "List the jobs the user has saved (bookmarked) but not applied to yet.",
  inputSchema: z.object({ limit: limitSchema }),
  execute: async (ctx, args): Promise<any> =>
    ctx.runQuery(internal.qelsaAgentTools.listSavedJobsInternal, {
      authId: authIdOf(ctx),
      limit: args.limit,
    }),
});

export const getJobReadinessTool = createTool({
  description:
    "Get the existing Qelsa Match readiness analysis for one job: overall score, matched skills, gaps, and suggested actions. Only works when an analysis already exists for that job; if not, tell the user to open the job page and run Qelsa Match.",
  inputSchema: z.object({
    job_id: z.string().describe("The job_id to check readiness for."),
  }),
  execute: async (ctx, args): Promise<any> =>
    ctx.runQuery(internal.qelsaAgentTools.getJobReadinessInternal, {
      authId: authIdOf(ctx),
      jobId: args.job_id as Id<"jobs">,
    }),
});

export const writeCoverLetterTool = createTool({
  description:
    "Write or refine a tailored cover letter for a job using the user's profile. This only drafts text and stores nothing. Pass instructions to refine a draft (for example, make it more technical or keep it under 150 words). Use apply_to_job or record_external_application afterwards if the user wants to apply with it.",
  inputSchema: z.object({
    job_id: z.string().describe("The job_id to write the cover letter for."),
    instructions: z
      .string()
      .optional()
      .describe("Optional refinement instructions, e.g. 'make it more technical' or 'shorten it to 150 words'."),
  }),
  execute: async (ctx, args): Promise<any> =>
    ctx.runAction(internal.qelsaAgentTools.generateCoverLetterInternal, {
      authId: authIdOf(ctx),
      jobId: args.job_id as Id<"jobs">,
      instructions: args.instructions,
    }),
});

export const saveJobTool = createTool({
  description:
    "Save or unsave a job for the user. Requires human approval. Set save=false to remove a saved job.",
  inputSchema: z.object({
    job_id: z.string().describe("The job_id to save or unsave."),
    save: z.boolean().describe("true to save the job, false to remove it from saved jobs."),
  }),
  needsApproval: true,
  execute: async (ctx, args): Promise<any> =>
    ctx.runMutation(internal.qelsaAgentTools.setSavedJobInternal, {
      authId: authIdOf(ctx),
      jobId: args.job_id as Id<"jobs">,
      save: args.save,
    }),
});

export const applyToJobTool = createTool({
  description:
    "Submit an application to a Qelsa job in one step. Requires human approval. Only works for jobs that apply inside Qelsa (not external application URLs). Pass a resume_id to choose a resume, and an answers object keyed by question_id for screening questions. Call get_application_questions and draft_application_answers first when the job asks questions.",
  inputSchema: z.object({
    job_id: z.string().describe("The job_id to apply to."),
    resume_id: z.string().optional().describe("Optional resume_id from get_my_profile. Defaults to the user's preferred resume."),
    cover_letter: z
      .string()
      .optional()
      .describe("Optional cover letter text. Use write_cover_letter first to draft one."),
    answers: z
      .record(z.string())
      .optional()
      .describe("Screening answers keyed by the exact question_id returned by get_application_questions."),
  }),
  needsApproval: true,
  execute: async (ctx, args): Promise<any> =>
    ctx.runMutation(internal.qelsaAgentTools.applyToQelsaJobInternal, {
      authId: authIdOf(ctx),
      jobId: args.job_id as Id<"jobs">,
      resumeId: args.resume_id as Id<"resumes"> | undefined,
      coverLetter: args.cover_letter,
      answers: args.answers,
    }),
});

export const prepareExternalApplicationTool = createTool({
  description:
    "Prepare everything needed to apply on an external site: the application URL, the user's resume link, a checklist, and optionally a cover letter. This has no side effects. After the user applies on the external site, call record_external_application.",
  inputSchema: z.object({
    job_id: z.string().describe("The job_id with an external application URL."),
    with_cover_letter: z.boolean().optional().describe("Set true to also draft a cover letter."),
  }),
  execute: async (ctx, args): Promise<any> => {
    const authId = authIdOf(ctx);
    const job: any = await ctx.runQuery(internal.qelsaAgentTools.getJobDetailsInternal, {
      authId,
      jobId: args.job_id as Id<"jobs">,
    });
    if (!job.application_url) {
      throw new Error(
        "This job applies inside Qelsa, so no external preparation is needed. Use apply_to_job instead.",
      );
    }
    const preferred: any = await ctx.runQuery(internal.qelsaAgentTools.getPreferredResumeInternal, {
      authId,
    });
    const resume = preferred?.resume ?? null;
    let coverLetter: string | null = null;
    if (args.with_cover_letter) {
      const draft: any = await ctx.runAction(internal.qelsaAgentTools.generateCoverLetterInternal, {
        authId,
        jobId: args.job_id as Id<"jobs">,
      });
      coverLetter = draft.cover_letter;
    }
    const packet: any = await ctx.runMutation(internal.agentAutofill.createPacketInternal, {
      authId,
      jobId: args.job_id as Id<"jobs">,
      coverLetter: coverLetter ?? undefined,
      resumeUrl: resume?.url ?? undefined,
      resumeTitle: resume?.title ?? undefined,
    });
    const origin = (process.env.SITE_URL ?? process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
    const token = String(packet.token);
    const bookmarklet = `javascript:(()=>{window.__qelsaAutofillToken=${JSON.stringify(token)};window.__qelsaAutofillApi=${JSON.stringify(origin)};var s=document.createElement("script");s.src=${JSON.stringify(`${origin}/autofill.js`)};document.documentElement.appendChild(s)})()`;
    return {
      application_url: job.application_url,
      job_title: job.title,
      company: job.company,
      resume_link: resume,
      cover_letter: coverLetter,
      autofill: {
        token,
        expires_at: packet.expires_at,
        bookmarklet,
        api_url: `${origin}/api/agent/autofill?token=${encodeURIComponent(token)}`,
        script_url: `${origin}/autofill.js`,
      },
      checklist: [
        "Open the application URL.",
        "Use the Qelsa autofill bookmarklet on the application page, then review every field.",
        "Upload or paste the resume that matches this role.",
        coverLetter ? "Paste the drafted cover letter if the form asks for one." : "Attach a resume and any requested details.",
        "Submit the form on the external site.",
        "Come back here and tell the agent you applied so it can record the application.",
      ],
      already_applied: Boolean(job.already_applied),
    };
  },
});

export const recordExternalApplicationTool = createTool({
  description:
    "Record that the user completed an application on an external site. Requires human approval. Only call this after the user confirms they submitted the application.",
  inputSchema: z.object({
    job_id: z.string().describe("The external job_id the user applied to."),
    cover_letter: z.string().optional().describe("The cover letter used, if any, to keep with the record."),
  }),
  needsApproval: true,
  execute: async (ctx, args): Promise<any> =>
    ctx.runMutation(internal.qelsaAgentTools.recordExternalApplicationInternal, {
      authId: authIdOf(ctx),
      jobId: args.job_id as Id<"jobs">,
      coverLetter: args.cover_letter,
    }),
});

export const updateCareerGoalTool = createTool({
  description:
    "Create or update the user's career goal (target role, dream companies, skills, timeline, experience level). Requires human approval.",
  inputSchema: z.object({
    target_role: z.string().describe("The primary role the user is aiming for."),
    target_roles: z.array(z.string()).optional().describe("Up to 4 additional target roles."),
    dream_companies: z.array(z.string()).optional().describe("Companies the user wants to work at."),
    industries: z.array(z.string()).optional().describe("Industries of interest."),
    skills: z.array(z.string()).optional().describe("Skills the user wants to build."),
    timeline: z.enum(["3_months", "6_months", "1_year", "2_plus_years"]).optional(),
    experience_level: z.enum(["entry", "mid", "senior", "lead"]).optional(),
    primary_focus: z.enum(["switch_roles", "get_promoted", "switch_industries", "upskill"]).optional(),
    description: z.string().optional().describe("Short free-text description of the goal."),
  }),
  needsApproval: true,
  execute: async (ctx, args): Promise<any> =>
    ctx.runMutation(internal.qelsaAgentTools.saveCareerGoalInternal, {
      authId: authIdOf(ctx),
      targetRole: args.target_role,
      targetRoles: args.target_roles,
      dreamCompanies: args.dream_companies,
      industries: args.industries,
      skills: args.skills,
      timeline: args.timeline,
      experienceLevel: args.experience_level,
      primaryFocus: args.primary_focus,
      description: args.description,
    }),
});

export const runJobMatchTool = createTool({
  description:
    "Run (or refresh) the full Qelsa Match readiness analysis for a job. Use this when no analysis exists or the user asks to check or re-check their fit. Readiness is the skill/profile score; never call it goal fit.",
  inputSchema: z.object({
    job_id: z.string().describe("The job_id to analyze."),
    refresh: z.boolean().optional().describe("Set true to recompute even if the profile has not changed."),
  }),
  execute: async (ctx, args): Promise<any> => {
    const session: any = await ctx.runAction(internal.jobMatchGenerate.startForJobInternal, {
      authId: authIdOf(ctx),
      jobId: args.job_id as Id<"jobs">,
      refresh: args.refresh,
    });
    return {
      available: true,
      session_id: session.id,
      job_id: session.job_id,
      job_title: session.title,
      company: session.company,
      location: session.location,
      overall: session.analysis.overall,
      headline: session.analysis.headline,
      strong: session.analysis.strong,
      partial: session.analysis.partial,
      missing: session.analysis.missing,
      experience_match: session.analysis.experience_match,
      education_match: session.analysis.education_match,
      domain_match: session.analysis.domain_match,
      responsibilities_match: session.analysis.responsibilities_match,
      actions: session.analysis.actions,
      can_apply: session.analysis.can_apply,
      match_url_path: `/jobs/match/${session.id}`,
      job_url_path: session.job_id ? `/jobs/${session.job_id}` : null,
    };
  },
});

export const analyzeExternalJobTool = createTool({
  description:
    "Analyze a job the user found outside Qelsa. Pass a public job URL or pasted job description. Runs Qelsa Match against the user's real profile and stores an external match report.",
  inputSchema: z.object({
    url: z.string().optional().describe("Public job posting URL."),
    jd_text: z.string().optional().describe("Pasted job description. Use this when the page cannot be fetched."),
  }),
  execute: async (ctx, args): Promise<any> => {
    if (!args.url?.trim() && !args.jd_text?.trim()) {
      throw new Error("Provide a job URL or paste the job description.");
    }
    const session: any = await ctx.runAction(internal.jobMatchGenerate.startForExternalInternal, {
      authId: authIdOf(ctx),
      jdUrl: args.url?.trim() || undefined,
      jdText: args.jd_text?.trim() || undefined,
    });
    return {
      available: true,
      source: "external",
      session_id: session.id,
      job_title: session.title,
      company: session.company,
      location: session.location,
      source_url: session.source_url ?? null,
      overall: session.analysis.overall,
      headline: session.analysis.headline,
      strong: session.analysis.strong,
      partial: session.analysis.partial,
      missing: session.analysis.missing,
      experience_match: session.analysis.experience_match,
      education_match: session.analysis.education_match,
      domain_match: session.analysis.domain_match,
      responsibilities_match: session.analysis.responsibilities_match,
      actions: session.analysis.actions,
      can_apply: session.analysis.can_apply,
      match_url_path: `/jobs/match/${session.id}`,
    };
  },
});

export const tailorResumeTool = createTool({
  description:
    "Create a truthful, job-specific resume tailoring plan: summary rewrite, before/after experience bullets, ATS keywords, missing skills, and next steps. Does not modify the stored resume.",
  inputSchema: z.object({
    job_id: z.string().describe("The job_id to tailor the resume for."),
    instructions: z.string().optional().describe("Optional focus, e.g. 'emphasize platform work' or 'keep under one page'."),
  }),
  execute: async (ctx, args): Promise<any> =>
    ctx.runAction(internal.qelsaAgentCoaching.tailorResumeInternal, {
      authId: authIdOf(ctx),
      jobId: args.job_id as Id<"jobs">,
      instructions: args.instructions,
    }),
});

export const getApplicationQuestionsTool = createTool({
  description:
    "Read the screening questions for a job before applying. Returns the exact question_id values, required flags, types, and options.",
  inputSchema: z.object({
    job_id: z.string().describe("The job_id to read questions for."),
  }),
  execute: async (ctx, args): Promise<any> =>
    ctx.runQuery(internal.qelsaAgentTools.getApplicationQuestionsInternal, {
      authId: authIdOf(ctx),
      jobId: args.job_id as Id<"jobs">,
    }),
});

export const draftApplicationAnswersTool = createTool({
  description:
    "Draft grounded answers to a job's screening questions from the user's real profile and resume. This only drafts; review with the user, then pass answers_by_id to apply_to_job.",
  inputSchema: z.object({
    job_id: z.string().describe("The job_id to answer questions for."),
    instructions: z.string().optional().describe("Optional tone or focus instructions."),
  }),
  execute: async (ctx, args): Promise<any> =>
    ctx.runAction(internal.qelsaAgentCoaching.draftApplicationAnswersInternal, {
      authId: authIdOf(ctx),
      jobId: args.job_id as Id<"jobs">,
      instructions: args.instructions,
    }),
});

export const getApplicationDetailsTool = createTool({
  description:
    "Read one application's status, job, screening answers, candidate notes, and status history. Use this before suggesting a follow-up or withdrawal.",
  inputSchema: z.object({
    application_id: z.string().describe("The application_id from list_my_applications."),
  }),
  execute: async (ctx, args): Promise<any> =>
    ctx.runQuery(internal.qelsaAgentTools.getApplicationDetailsInternal, {
      authId: authIdOf(ctx),
      applicationId: args.application_id as Id<"job_applications">,
    }),
});

export const getStaleApplicationsTool = createTool({
  description:
    "Find applications that have been sitting in applied/viewed for too long and may need a follow-up. This is a read-only check.",
  inputSchema: z.object({
    days: z.number().int().min(1).max(90).optional().describe("How many days without a response counts as stale. Default 7."),
    limit: z.number().int().min(1).max(20).optional(),
  }),
  execute: async (ctx, args): Promise<any> =>
    ctx.runQuery(internal.qelsaAgentTools.listStaleApplicationsInternal, {
      authId: authIdOf(ctx),
      days: args.days,
      limit: args.limit,
    }),
});

export const withdrawApplicationTool = createTool({
  description:
    "Withdraw one of the user's applications. Requires human approval. Rejected applications cannot be withdrawn.",
  inputSchema: z.object({
    application_id: z.string().describe("The application_id to withdraw."),
  }),
  needsApproval: true,
  execute: async (ctx, args): Promise<any> =>
    ctx.runMutation(internal.qelsaAgentTools.withdrawApplicationInternal, {
      authId: authIdOf(ctx),
      applicationId: args.application_id as Id<"job_applications">,
    }),
});

export const addApplicationNoteTool = createTool({
  description:
    "Save a private note on an application (for example, interview feedback or a follow-up reminder). Requires human approval. Notes are visible only to the candidate.",
  inputSchema: z.object({
    application_id: z.string().describe("The application_id to annotate."),
    text: z.string().describe("The note text, under 2000 characters."),
  }),
  needsApproval: true,
  execute: async (ctx, args): Promise<any> =>
    ctx.runMutation(internal.qelsaAgentTools.addApplicationNoteInternal, {
      authId: authIdOf(ctx),
      applicationId: args.application_id as Id<"job_applications">,
      text: args.text,
    }),
});

export const draftFollowUpTool = createTool({
  description:
    "Draft a short follow-up email for an application that has gone quiet. Does not send anything.",
  inputSchema: z.object({
    application_id: z.string().describe("The application_id to follow up on."),
    instructions: z.string().optional().describe("Optional tone or context instructions."),
  }),
  execute: async (ctx, args): Promise<any> =>
    ctx.runAction(internal.qelsaAgentCoaching.followUpDraftInternal, {
      authId: authIdOf(ctx),
      applicationId: args.application_id as Id<"job_applications">,
      instructions: args.instructions,
    }),
});

export const prepareInterviewTool = createTool({
  description:
    "Build a role-specific interview brief: what the role tests, likely questions, STAR outlines grounded in the user's experience, a 7-day plan, and watch-outs.",
  inputSchema: z.object({
    job_id: z.string().describe("The job or external match job_id."),
  }),
  execute: async (ctx, args): Promise<any> =>
    ctx.runAction(internal.qelsaAgentCoaching.interviewPrepInternal, {
      authId: authIdOf(ctx),
      jobId: args.job_id as Id<"jobs">,
    }),
});

export const compareJobsTool = createTool({
  description:
    "Compare 2–4 jobs on salary, location, readiness, gaps, and trade-offs, then recommend a next step. Readiness values come only from existing Qelsa Match sessions.",
  inputSchema: z.object({
    job_ids: z.array(z.string()).min(2).max(4).describe("2–4 job_id values to compare."),
  }),
  execute: async (ctx, args): Promise<any> =>
    ctx.runAction(internal.qelsaAgentCoaching.compareJobsInternal, {
      authId: authIdOf(ctx),
      jobIds: args.job_ids.map((id) => id as Id<"jobs">),
    }),
});

export const compareOffersTool = createTool({
  description:
    "Compare two to four job offers using only the terms the user provides, then suggest a negotiation plan. Never invent market data or a competing offer.",
  inputSchema: z.object({
    offers: z
      .array(
        z.object({
          label: z.string(),
          company: z.string().optional(),
          role: z.string().optional(),
          base_salary: z.number().optional(),
          bonus: z.number().optional(),
          equity: z.string().optional(),
          location: z.string().optional(),
          work_mode: z.string().optional(),
          notes: z.string().optional(),
        }),
      )
      .min(2)
      .max(4),
    priorities: z.string().optional(),
  }),
  execute: async (ctx, args): Promise<any> =>
    ctx.runAction(internal.qelsaAgentCoaching.compareOffersInternal, {
      authId: authIdOf(ctx),
      offers: args.offers as Array<{
        label: string;
        company?: string;
        role?: string;
        base_salary?: number;
        bonus?: number;
        equity?: string;
        location?: string;
        work_mode?: string;
        notes?: string;
      }>,
      priorities: args.priorities,
    }),
});

export const updateProfileTool = createTool({
  description:
    "Update the user's profile or job-search preferences. Requires human approval. Use only information the user explicitly provided or confirmed. This does not modify experience entries or skills.",
  inputSchema: z.object({
    headline: z.string().optional(),
    professional_summary: z.string().optional(),
    about: z.string().optional(),
    city_name: z.string().optional().describe("A city name; it must match Qelsa's city catalog."),
    work_preference: z.string().optional().describe("e.g. remote, hybrid, on-site, or a preferred schedule."),
    expected_min_salary: z.number().optional(),
    expected_max_salary: z.number().optional(),
    expected_salary_currency: z.string().optional(),
    want_to_relocate: z.boolean().optional(),
    relocate_locations: z.array(z.string()).optional(),
    job_seeking_status: z.enum(["actively_hunting", "exploring", "building_skills"]).optional(),
    preferred_resume_id: z.string().optional(),
  }),
  needsApproval: true,
  execute: async (ctx, args): Promise<any> =>
    ctx.runMutation(internal.qelsaAgentTools.updateProfileInternal, {
      authId: authIdOf(ctx),
      headline: args.headline,
      professionalSummary: args.professional_summary,
      about: args.about,
      cityName: args.city_name,
      workPreference: args.work_preference,
      expectedMinSalary: args.expected_min_salary,
      expectedMaxSalary: args.expected_max_salary,
      expectedSalaryCurrency: args.expected_salary_currency,
      wantToRelocate: args.want_to_relocate,
      relocateLocations: args.relocate_locations,
      jobSeekingStatus: args.job_seeking_status,
      preferredResumeId: args.preferred_resume_id as Id<"resumes"> | undefined,
    }),
});

export const addProfileSkillsTool = createTool({
  description:
    "Add skills to the user's Qelsa profile from the existing skill catalog. Requires human approval. Use only skills the user explicitly says they have. Returns any names that were not in the catalog.",
  inputSchema: z.object({
    skills: z
      .array(
        z.object({
          name: z.string().describe("Skill name, e.g. TypeScript."),
          proficiency: z.enum(["beginner", "intermediate", "advance", "advanced", "expert"]).optional(),
          is_top_skill: z.boolean().optional(),
        }),
      )
      .min(1)
      .max(12),
  }),
  needsApproval: true,
  execute: async (ctx, args): Promise<any> =>
    ctx.runMutation(internal.qelsaAgentTools.addProfileSkillsInternal, {
      authId: authIdOf(ctx),
      skills: args.skills as Array<{ name: string; proficiency?: string; is_top_skill?: boolean }>,
    }),
});

export const saveJobSearchTool = createTool({
  description:
    "Save a job search so the agent can watch it and brief the user about new matches. Requires human approval. Stores at most 5 searches per user.",
  inputSchema: z.object({
    name: z.string().describe("Short name for this search, e.g. 'Remote React roles'."),
    query: z.string().optional(),
    city: z.string().optional(),
    workplace_type: z.enum(["on-site", "hybrid", "remote"]).optional(),
    remote: z.boolean().optional(),
    salary_min: z.number().optional(),
    email_alerts: z.boolean().optional().describe("Send an email when new matches appear. Default true."),
    push_alerts: z.boolean().optional().describe("Send a browser push notification when new matches appear. Default true."),
  }),
  needsApproval: true,
  execute: async (ctx, args): Promise<any> =>
    ctx.runMutation(internal.qelsaAgentTools.saveSavedSearchInternal, {
      authId: authIdOf(ctx),
      name: args.name,
      query: args.query,
      city: args.city,
      workplaceType: args.workplace_type,
      remote: args.remote,
      salaryMin: args.salary_min,
      emailAlerts: args.email_alerts,
      pushAlerts: args.push_alerts,
    }),
});

export const listJobSearchesTool = createTool({
  description: "List the user's saved job searches and their last check time.",
  inputSchema: z.object({}),
  execute: async (ctx): Promise<any> =>
    ctx.runQuery(internal.qelsaAgentTools.listSavedSearchesInternal, {
      authId: authIdOf(ctx),
    }),
});

export const deleteJobSearchTool = createTool({
  description: "Delete a saved job search. Requires human approval.",
  inputSchema: z.object({
    saved_search_id: z.string().describe("The saved_search_id from list_saved_searches."),
  }),
  needsApproval: true,
  execute: async (ctx, args): Promise<any> =>
    ctx.runMutation(internal.qelsaAgentTools.deleteSavedSearchInternal, {
      authId: authIdOf(ctx),
      savedSearchId: args.saved_search_id as Id<"agent_saved_searches">,
    }),
});

export const updateJobSearchAlertsTool = createTool({
  description:
    "Turn email or browser push alerts on or off for an existing saved job search. Does not change the search filters.",
  inputSchema: z.object({
    saved_search_id: z.string(),
    email_alerts: z.boolean().optional(),
    push_alerts: z.boolean().optional(),
  }),
  execute: async (ctx, args): Promise<any> =>
    ctx.runMutation(internal.qelsaAgentTools.updateSavedSearchAlertsInternal, {
      authId: authIdOf(ctx),
      savedSearchId: args.saved_search_id as Id<"agent_saved_searches">,
      emailAlerts: args.email_alerts,
      pushAlerts: args.push_alerts,
    }),
});

export const getUnreadBriefsTool = createTool({
  description:
    "Read the user's unread proactive briefs: new saved-search matches and other alerts. Use this when the user asks what's new or what they missed.",
  inputSchema: z.object({
    limit: z.number().int().min(1).max(10).optional(),
  }),
  execute: async (ctx, args): Promise<any> =>
    ctx.runQuery(internal.agentProactive.getUnreadBriefsInternal, {
      authId: authIdOf(ctx),
      limit: args.limit,
    }),
});

export const qelsaAgentTools = {
  search_jobs: searchJobsTool,
  get_job_details: getJobDetailsTool,
  get_my_profile: getMyProfileTool,
  list_my_applications: listMyApplicationsTool,
  list_saved_jobs: listSavedJobsTool,
  get_job_readiness: getJobReadinessTool,
  run_job_match: runJobMatchTool,
  analyze_external_job: analyzeExternalJobTool,
  write_cover_letter: writeCoverLetterTool,
  tailor_resume: tailorResumeTool,
  get_application_questions: getApplicationQuestionsTool,
  draft_application_answers: draftApplicationAnswersTool,
  get_application_details: getApplicationDetailsTool,
  get_stale_applications: getStaleApplicationsTool,
  draft_follow_up: draftFollowUpTool,
  prepare_interview: prepareInterviewTool,
  compare_jobs: compareJobsTool,
  compare_offers: compareOffersTool,
  save_job: saveJobTool,
  apply_to_job: applyToJobTool,
  prepare_external_application: prepareExternalApplicationTool,
  record_external_application: recordExternalApplicationTool,
  update_profile: updateProfileTool,
  add_profile_skills: addProfileSkillsTool,
  update_career_goal: updateCareerGoalTool,
  save_job_search: saveJobSearchTool,
  list_saved_searches: listJobSearchesTool,
  update_job_search_alerts: updateJobSearchAlertsTool,
  delete_job_search: deleteJobSearchTool,
  get_unread_briefs: getUnreadBriefsTool,
};
