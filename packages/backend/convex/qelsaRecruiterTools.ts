/**
 * Qelsa Agent tools for recruiter accounts.
 *
 * Recruiters have a different job: manage their own jobs, search the people who
 * applied to those jobs, and move candidates through a pipeline. Every read and
 * write is scoped to a job owned by the signed-in recruiter, so these tools can
 * never expose another employer's applicants.
 */

import { createTool } from "@convex-dev/agent";
import { v } from "convex/values";
import { z } from "zod/v3";
import type { Doc, Id } from "./_generated/dataModel";
import { internal } from "./_generated/api";
import { internalMutation, internalQuery } from "./_generated/server";
import {
  loadApplicantSearchDocs,
  loadJobSearchContext,
  runKeywordSearch,
} from "./applicantSearch";
import { getJobDetailsTool } from "./qelsaAgentTools";
import { clipPlainText } from "./lib/skillMatch";

const APPLICANT_LIMIT = 10;
const APPLICATION_STATUSES = ["applied", "viewed", "shortlisted", "sorted", "hold", "rejected"] as const;

type ToolAuth = { userId?: string | null };

function authIdOf(ctx: ToolAuth) {
  if (!ctx.userId) throw new Error("Sign in to Qelsa before using the agent.");
  return ctx.userId;
}

async function requireRecruiter(ctx: { db: any }, authId: string): Promise<Doc<"users">> {
  const user = await ctx.db
    .query("users")
    .withIndex("by_authId", (q: any) => q.eq("authId", authId))
    .unique();
  if (!user) throw new Error("Your Qelsa profile is not ready yet.");
  if (user.account_type !== "recruiter") {
    throw new Error("These tools are available to recruiter accounts only.");
  }
  return user;
}

async function requireOwnedJob(ctx: { db: any }, userId: Id<"users">, jobId: Id<"jobs">) {
  const job = await ctx.db.get(jobId);
  if (!job || job.owner_id !== userId) throw new Error("You don't own that job.");
  return job;
}

async function jobCard(ctx: { db: any }, job: Doc<"jobs">) {
  const city = job.city_id ? await ctx.db.get(job.city_id) : null;
  return {
    job_id: job._id,
    title: job.title ?? "Untitled role",
    company: job.company_name ?? null,
    location: city?.name ?? null,
    status: job.status,
    workplace_type: job.workplace_type ?? null,
    work_type: job.work_type ?? null,
    applications: job.application_count ?? 0,
    published_at: job.published_date ?? null,
    url_path: `/jobs/${job._id}`,
  };
}

async function applicantCard(doc: any, hit?: any) {
  return {
    application_id: String(doc.application_id),
    name: doc.name,
    headline: doc.headline ?? null,
    location: doc.location ?? null,
    years_experience: doc.years_experience ?? null,
    status: doc.status,
    readiness: doc.readiness ?? null,
    applied_at: doc.applied_at,
    skills: (doc.skills ?? []).slice(0, 12).map((skill: any) => skill.name),
    companies: (doc.companies ?? []).slice(0, 5),
    titles: (doc.titles ?? []).slice(0, 5),
    education: (doc.education ?? []).slice(0, 4),
    matched_skills: (doc.matched_skill_names ?? []).slice(0, 10),
    gaps: (doc.gap_skill_names ?? []).slice(0, 10),
    score: hit?.score ?? null,
    explanation: hit?.explanation ?? null,
    reasons: (hit?.reasons ?? []).slice(0, 5),
  };
}

export const listMyJobsInternal = internalQuery({
  args: { authId: v.string() },
  returns: v.any(),
  handler: async (ctx, args) => {
    const user = await requireRecruiter(ctx, args.authId);
    const owned = await ctx.db
      .query("jobs")
      .withIndex("by_owner", (q) => q.eq("owner_id", user._id))
      .take(60);
    const pages = await ctx.db
      .query("pages")
      .withIndex("by_owner", (q) => q.eq("ownerId", user._id))
      .take(12);
    const seen = new Set(owned.map((job) => String(job._id)));
    const pageJobs: Doc<"jobs">[] = [];
    for (const page of pages) {
      const rows = await ctx.db
        .query("jobs")
        .withIndex("by_page", (q) => q.eq("page_id", page._id))
        .take(40);
      for (const job of rows) {
        if (seen.has(String(job._id))) continue;
        seen.add(String(job._id));
        pageJobs.push(job);
      }
    }
    const jobs = [...owned, ...pageJobs]
      .sort((a, b) => (b.published_date ?? b._creationTime) - (a.published_date ?? a._creationTime))
      .slice(0, 30);
    return { count: jobs.length, jobs: await Promise.all(jobs.map((job) => jobCard(ctx, job))) };
  },
});

export const searchApplicantsInternal = internalQuery({
  args: {
    authId: v.string(),
    jobId: v.id("jobs"),
    query: v.optional(v.string()),
    status: v.optional(v.string()),
    minYears: v.optional(v.number()),
    minReadiness: v.optional(v.number()),
    limit: v.optional(v.number()),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    const user = await requireRecruiter(ctx, args.authId);
    await requireOwnedJob(ctx, user._id, args.jobId);
    const job = await loadJobSearchContext(ctx, args.jobId);
    const docs = await loadApplicantSearchDocs(ctx, args.jobId);
    const query = args.query?.trim() ?? "";
    const limit = Math.min(Math.max(args.limit ?? APPLICANT_LIMIT, 1), 20);
    const criteria = {
      ...(args.status ? { status: args.status } : {}),
      ...(args.minYears != null ? { min_years: args.minYears } : {}),
      ...(args.minReadiness != null ? { min_readiness: args.minReadiness } : {}),
    };
    const hasFilters = Boolean(query || args.status || args.minYears != null || args.minReadiness != null);
    const result = hasFilters
      ? runKeywordSearch(docs, query, criteria)
      : {
          mode: "keyword" as const,
          chips: [],
          hits: docs
            .slice()
            .sort((a, b) => (b.readiness ?? 0) - (a.readiness ?? 0) || b.applied_at - a.applied_at)
            .map((doc) => ({ application_id: doc.application_id, score: doc.readiness ?? 0, explanation: `${doc.name} — ${doc.readiness ?? 0}% readiness`, reasons: [], gaps: [] })),
        };
    const byId = new Map(docs.map((doc) => [String(doc.application_id), doc]));
    const applicants = [];
    for (const hit of result.hits.slice(0, limit)) {
      const doc = byId.get(String(hit.application_id));
      if (doc) applicants.push(await applicantCard(doc, hit));
    }
    return {
      job: {
        job_id: args.jobId,
        title: job.title,
        company: job.company ?? null,
        location: job.location ?? null,
        experience: job.experience ?? null,
        skills: job.skills.map((skill) => skill.name),
      },
      mode: result.mode,
      chips: result.chips,
      count: applicants.length,
      applicants,
      note: applicants.length ? undefined : "No applicants matched those filters.",
    };
  },
});

export const getApplicantContextInternal = internalQuery({
  args: { authId: v.string(), applicationId: v.id("job_applications") },
  returns: v.any(),
  handler: async (ctx, args) => {
    const recruiter = await requireRecruiter(ctx, args.authId);
    const application = await ctx.db.get(args.applicationId);
    if (!application || application.status === "cancelled") throw new Error("Application not found.");
    const job = await requireOwnedJob(ctx, recruiter._id, application.job_id);
    const user = await ctx.db.get(application.user_id);
    if (!user) throw new Error("Applicant profile not found.");
    const city = user.city_id ? await ctx.db.get(user.city_id) : null;
    const [skillRows, experienceRows, answers] = await Promise.all([
      ctx.db.query("user_skills").withIndex("by_user", (q) => q.eq("user_id", user._id)).take(40),
      ctx.db.query("experiences").withIndex("by_user", (q) => q.eq("user_id", user._id)).take(10),
      ctx.db
        .query("job_application_answers")
        .withIndex("by_application", (q) => q.eq("job_application_id", application._id))
        .take(40),
    ]);
    const skills = [];
    for (const row of skillRows) {
      const skill = await ctx.db.get(row.skill_id);
      if (skill) skills.push({ name: skill.name, proficiency: row.proficiency ?? null });
    }
    const experiences = [];
    for (const row of experienceRows) {
      const [company, title] = await Promise.all([
        row.company_id ? ctx.db.get(row.company_id) : null,
        row.job_title_id ? ctx.db.get(row.job_title_id) : null,
      ]);
      experiences.push({
        title: title?.name ?? "Role",
        company: company?.name ?? "Company",
        is_current: row.is_current ?? false,
        description: clipPlainText(row.description, 400),
        skills: (row.responsibilities ?? []).slice(0, 5).map((item) => item.title),
      });
    }
    return {
      application_id: application._id,
      status: application.status,
      applied_at: application.applied_at,
      applicant: {
        name: user.name ?? user.email,
        headline: user.headline ?? null,
        summary: clipPlainText(user.professional_summary ?? user.about, 1000),
        location: city?.name ?? null,
        skills,
        experiences,
        answers: answers.map((row) => ({ question: row.question, answer: row.answer ?? null })),
      },
      job: {
        job_id: job._id,
        title: job.title ?? "Role",
        company: job.company_name ?? null,
        description: clipPlainText(job.description, 1800),
        experience: job.experience ?? null,
        workplace_type: job.workplace_type ?? null,
      },
    };
  },
});

export const updateApplicantStatusInternal = internalMutation({
  args: {
    authId: v.string(),
    applicationId: v.id("job_applications"),
    status: v.union(
      v.literal("applied"),
      v.literal("viewed"),
      v.literal("shortlisted"),
      v.literal("sorted"),
      v.literal("hold"),
      v.literal("rejected"),
    ),
    note: v.optional(v.string()),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    const recruiter = await requireRecruiter(ctx, args.authId);
    const application = await ctx.db.get(args.applicationId);
    if (!application) throw new Error("Application not found.");
    await requireOwnedJob(ctx, recruiter._id, application.job_id);
    if (application.status === "cancelled") throw new Error("This application was withdrawn.");
    if (application.status === args.status) {
      return { updated: false, status: application.status };
    }
    await ctx.db.patch(application._id, { status: args.status });
    await ctx.db.insert("job_application_logs", {
      job_id: application.job_id,
      job_application_id: application._id,
      created_by_id: recruiter._id,
      action_type: "status_changed",
      old_status: application.status,
      new_status: args.status,
    });
    const note = args.note?.trim().slice(0, 1000);
    if (note) {
      await ctx.db.insert("job_application_notes", {
        job_id: application.job_id,
        job_application_id: application._id,
        user_id: recruiter._id,
        author_name: recruiter.name || recruiter.email || "Recruiter",
        author_image: recruiter.profile_image,
        text: note,
        visibility: "recruiter_only",
        created_at: Date.now(),
      });
    }
    return { updated: true, previous_status: application.status, status: args.status };
  },
});

export const listMyJobsTool = createTool({
  description:
    "List the jobs owned by the signed-in recruiter, including status, application count, and location. Use this before searching applicants or discussing a job.",
  inputSchema: z.object({}),
  execute: async (ctx): Promise<any> =>
    ctx.runQuery(internal.qelsaRecruiterTools.listMyJobsInternal, { authId: authIdOf(ctx) }),
});

export const searchApplicantsTool = createTool({
  description:
    "Search applicants for one of the recruiter's jobs. Read-only. Returns grounded applicant summaries with readiness, matched skills, gaps, and application status. Use the application_id with draft_candidate_outreach or update_applicant_status.",
  inputSchema: z.object({
    job_id: z.string(),
    query: z.string().optional().describe("Keywords, skills, companies, titles, or a natural-language request."),
    status: z.enum(APPLICATION_STATUSES).optional(),
    min_years: z.number().min(0).max(40).optional(),
    min_readiness: z.number().min(0).max(100).optional(),
    limit: z.number().int().min(1).max(20).optional(),
  }),
  execute: async (ctx, args): Promise<any> =>
    ctx.runQuery(internal.qelsaRecruiterTools.searchApplicantsInternal, {
      authId: authIdOf(ctx),
      jobId: args.job_id as Id<"jobs">,
      query: args.query,
      status: args.status,
      minYears: args.min_years,
      minReadiness: args.min_readiness,
      limit: args.limit,
    }),
});

export const getApplicantContextTool = createTool({
  description:
    "Read one applicant's profile, application answers, and the target job before drafting outreach or making a decision. Read-only and limited to the recruiter's own jobs.",
  inputSchema: z.object({
    application_id: z.string(),
  }),
  execute: async (ctx, args): Promise<any> =>
    ctx.runQuery(internal.qelsaRecruiterTools.getApplicantContextInternal, {
      authId: authIdOf(ctx),
      applicationId: args.application_id as Id<"job_applications">,
    }),
});

export const updateApplicantStatusTool = createTool({
  description:
    "Move an applicant to a new pipeline stage. Requires human approval. Use shortlisted/sorted intentionally and include a private note when useful.",
  inputSchema: z.object({
    application_id: z.string(),
    status: z.enum(APPLICATION_STATUSES),
    note: z.string().optional().describe("Optional private note, under 1000 characters."),
  }),
  needsApproval: true,
  execute: async (ctx, args): Promise<any> =>
    ctx.runMutation(internal.qelsaRecruiterTools.updateApplicantStatusInternal, {
      authId: authIdOf(ctx),
      applicationId: args.application_id as Id<"job_applications">,
      status: args.status,
      note: args.note,
    }),
});

export const draftCandidateOutreachTool = createTool({
  description:
    "Draft a short, specific outreach message to one applicant. Does not send anything and does not expose contact details. Use get_applicant_context first if you need more detail.",
  inputSchema: z.object({
    application_id: z.string(),
    channel: z.enum(["email", "linkedin", "in_app"]).optional(),
    instructions: z.string().optional(),
  }),
  execute: async (ctx, args): Promise<any> =>
    ctx.runAction(internal.qelsaRecruiterCoaching.draftOutreachInternal, {
      authId: authIdOf(ctx),
      applicationId: args.application_id as Id<"job_applications">,
      channel: args.channel,
      instructions: args.instructions,
    }),
});

export const qelsaRecruiterTools = {
  list_my_jobs: listMyJobsTool,
  get_job_details: getJobDetailsTool,
  search_applicants: searchApplicantsTool,
  get_applicant_context: getApplicantContextTool,
  update_applicant_status: updateApplicantStatusTool,
  draft_candidate_outreach: draftCandidateOutreachTool,
};
