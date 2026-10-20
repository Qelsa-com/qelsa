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
import { bumpJobCount } from "./lib/jobCounts";
import { ADMIN_STAT_KEYS, bumpAdminStat } from "./lib/adminStats";
import { clipPlainText } from "./lib/skillMatch";

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
    limit: v.optional(v.number()),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    await appUser(ctx, args.authId);
    const limit = Math.min(Math.max(args.limit ?? SEARCH_LIMIT_DEFAULT, 1), 20);
    const needle = (args.query ?? "").trim();

    let candidates: Doc<"jobs">[];
    if (needle) {
      candidates = await ctx.db
        .query("jobs")
        .withSearchIndex("search_title", (q) => q.search("title", needle).eq("status", "open"))
        .take(limit * 4);
      if (candidates.length < limit) {
        const byCompany = await ctx.db
          .query("jobs")
          .withSearchIndex("search_company", (q) => q.search("company_name", needle).eq("status", "open"))
          .take(limit * 2);
        const seen = new Set(candidates.map((job) => job._id));
        for (const job of byCompany) {
          if (!seen.has(job._id)) candidates.push(job);
        }
      }
    } else {
      candidates = await ctx.db
        .query("jobs")
        .withIndex("by_status_and_published", (q) => q.eq("status", "open"))
        .order("desc")
        .take(80);
    }

    let cityIds: Set<Id<"cities">> | null = null;
    const cityQuery = args.city?.trim();
    if (cityQuery) {
      const matches = await ctx.db
        .query("cities")
        .withSearchIndex("search_name", (q) => q.search("name", cityQuery))
        .take(8);
      cityIds = new Set(matches.map((city) => city._id));
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
  await bumpAdminStat(ctx, ADMIN_STAT_KEYS.applications, 1);
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
    const coverLetter = args.coverLetter?.trim() ? args.coverLetter.trim().slice(0, 4000) : undefined;
    const id = await insertApplication(ctx, user, job, coverLetter, args.resumeId);
    return {
      application_id: id,
      status: "applied",
      job: jobSummary(job, { company: job.company_name ?? null, location: null }),
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
    limit: limitSchema,
  }),
  execute: async (ctx, args): Promise<any> =>
    ctx.runQuery(internal.qelsaAgentTools.searchJobsInternal, {
      authId: authIdOf(ctx),
      query: args.query,
      city: args.city,
      workplaceType: args.workplace_type,
      remote: args.remote,
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
    const loaded: any = await ctx.runQuery(internal.jobMatch.loadUserContext, {
      authId: authIdOf(ctx),
    });
    return {
      profile: loaded.profile,
      skills: (loaded.skills ?? []).slice(0, 40),
      experiences: (loaded.experiences ?? []).slice(0, 8),
      educations: (loaded.educations ?? []).slice(0, 6),
      certifications: (loaded.certifications ?? []).slice(0, 8),
      resumes: (loaded.resumes ?? []).map((resume: any) => ({
        resume_id: resume.id,
        title: resume.title,
        has_extracted_text: Boolean(resume.text?.trim()),
      })),
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
    "Submit an application to a Qelsa job in one step. Requires human approval. Only works for jobs that apply inside Qelsa (not external application URLs). The user's default resume is attached automatically.",
  inputSchema: z.object({
    job_id: z.string().describe("The job_id to apply to."),
    cover_letter: z
      .string()
      .optional()
      .describe("Optional cover letter text. Use write_cover_letter first to draft one."),
  }),
  needsApproval: true,
  execute: async (ctx, args): Promise<any> =>
    ctx.runMutation(internal.qelsaAgentTools.applyToQelsaJobInternal, {
      authId: authIdOf(ctx),
      jobId: args.job_id as Id<"jobs">,
      coverLetter: args.cover_letter,
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
    return {
      application_url: job.application_url,
      job_title: job.title,
      company: job.company,
      resume_link: resume,
      cover_letter: coverLetter,
      checklist: [
        "Open the application URL.",
        "Upload or paste the resume that matches this role.",
        coverLetter ? "Paste the drafted cover letter." : "Attach a resume and any requested details.",
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

export const qelsaAgentTools = {
  search_jobs: searchJobsTool,
  get_job_details: getJobDetailsTool,
  get_my_profile: getMyProfileTool,
  list_my_applications: listMyApplicationsTool,
  list_saved_jobs: listSavedJobsTool,
  get_job_readiness: getJobReadinessTool,
  write_cover_letter: writeCoverLetterTool,
  save_job: saveJobTool,
  apply_to_job: applyToJobTool,
  prepare_external_application: prepareExternalApplicationTool,
  record_external_application: recordExternalApplicationTool,
  update_career_goal: updateCareerGoalTool,
};
