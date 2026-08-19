import { paginationOptsValidator } from "convex/server";
import { v } from "convex/values";
import { listUIMessages } from "@convex-dev/agent";
import { components } from "./_generated/api";
import type { Doc, Id } from "./_generated/dataModel";
import { internalMutation, internalQuery } from "./_generated/server";
import { authedQuery } from "./lib/customFunctions";
import { clipPlainText, buildCompetencyFramework, extractJdListItems } from "./lib/skillMatch";

export const skillRefValidator = v.object({
  name: v.string(),
  skill_id: v.optional(v.id("skills")),
  type: v.optional(v.union(v.literal("core"), v.literal("preferred"), v.literal("nice_to_have"))),
});

export const analysisValidator = v.object({
  overall: v.number(),
  headline: v.string(),
  strong: v.array(v.string()),
  partial: v.array(v.string()),
  missing: v.array(v.string()),
  experience_match: v.number(),
  education_match: v.number(),
  domain_match: v.number(),
  responsibilities_match: v.number(),
  resume_evidence: v.array(v.string()),
  actions: v.array(v.string()),
  can_apply: v.string(),
});

export const sessionPublicValidator = v.object({
  id: v.id("job_match_sessions"),
  source: v.union(v.literal("qelsa"), v.literal("external")),
  job_id: v.optional(v.id("jobs")),
  thread_id: v.string(),
  title: v.string(),
  company: v.optional(v.string()),
  location: v.optional(v.string()),
  description: v.string(),
  work_type: v.optional(v.string()),
  workplace_type: v.optional(v.union(v.literal("on-site"), v.literal("hybrid"), v.literal("remote"))),
  experience: v.optional(v.number()),
  source_url: v.optional(v.string()),
  skills: v.array(skillRefValidator),
  responsibilities: v.array(v.string()),
  requirements: v.array(v.string()),
  analysis: analysisValidator,
});

function toPublicSession(row: Doc<"job_match_sessions">) {
  return {
    id: row._id,
    source: row.source,
    job_id: row.job_id,
    thread_id: row.thread_id,
    title: row.title,
    company: row.company,
    location: row.location,
    description: row.description,
    work_type: row.work_type,
    workplace_type: row.workplace_type,
    experience: row.experience,
    source_url: row.source_url,
    skills: row.skills,
    responsibilities: row.responsibilities,
    requirements: row.requirements,
    analysis: row.analysis,
  };
}

export const getSession = authedQuery({
  args: { sessionId: v.id("job_match_sessions") },
  returns: v.union(sessionPublicValidator, v.null()),
  handler: async (ctx, args) => {
    const row = await ctx.db.get(args.sessionId);
    if (!row || row.user_id !== ctx.user._id) return null;
    return toPublicSession(row);
  },
});

export const getByJob = authedQuery({
  args: { jobId: v.id("jobs") },
  returns: v.union(sessionPublicValidator, v.null()),
  handler: async (ctx, args) => {
    const row = await ctx.db
      .query("job_match_sessions")
      .withIndex("by_user_and_job", (q) => q.eq("user_id", ctx.user._id).eq("job_id", args.jobId))
      .order("desc")
      .first();
    return row ? toPublicSession(row) : null;
  },
});

export const listMessages = authedQuery({
  args: {
    sessionId: v.id("job_match_sessions"),
    paginationOpts: paginationOptsValidator,
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    const row = await ctx.db.get(args.sessionId);
    if (!row || row.user_id !== ctx.user._id) throw new Error("Match session not found");
    return await listUIMessages(ctx, components.agent, {
      threadId: row.thread_id,
      paginationOpts: args.paginationOpts,
    });
  },
});

export const loadUserContext = internalQuery({
  args: { authId: v.string() },
  returns: v.any(),
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_authId", (q) => q.eq("authId", args.authId))
      .unique();
    if (!user) throw new Error("User not found");

    const city = user.city_id ? await ctx.db.get(user.city_id) : null;
    const [skillRows, experienceRows, educationRows, certRows, resumeRows] = await Promise.all([
      ctx.db.query("user_skills").withIndex("by_user", (q) => q.eq("user_id", user._id)).take(80),
      ctx.db.query("experiences").withIndex("by_user", (q) => q.eq("user_id", user._id)).take(20),
      ctx.db.query("educations").withIndex("by_user", (q) => q.eq("user_id", user._id)).take(12),
      ctx.db.query("user_certifications").withIndex("by_user", (q) => q.eq("user_id", user._id)).take(20),
      ctx.db.query("resumes").withIndex("by_user", (q) => q.eq("user_id", user._id)).take(8),
    ]);

    const skills = [];
    for (const row of skillRows) {
      const skill = await ctx.db.get(row.skill_id);
      if (skill) {
        skills.push({
          skill_id: row.skill_id,
          name: skill.name,
          proficiency: row.proficiency ?? null,
          is_top_skill: row.is_top_skill ?? false,
        });
      }
    }

    const experiences = [];
    for (const row of experienceRows) {
      const [company, jobTitle, skillLinks] = await Promise.all([
        row.company_id ? ctx.db.get(row.company_id) : null,
        row.job_title_id ? ctx.db.get(row.job_title_id) : null,
        ctx.db.query("experience_skills").withIndex("by_experience", (q) => q.eq("experience_id", row._id)).take(12),
      ]);
      const expSkills = [];
      for (const link of skillLinks) {
        const skill = await ctx.db.get(link.skill_id);
        if (skill) expSkills.push(skill.name);
      }
      experiences.push({
        title: jobTitle?.name ?? "Role",
        company: company?.name ?? "Company",
        is_current: row.is_current ?? false,
        description: clipPlainText(row.description, 400),
        responsibilities: (row.responsibilities ?? []).slice(0, 8).map((item) => item.title),
        skills: expSkills,
      });
    }

    const educations = [];
    const projects: string[] = [];
    for (const row of educationRows) {
      const [degree, college, field] = await Promise.all([
        row.degree_id ? ctx.db.get(row.degree_id) : null,
        row.college_id ? ctx.db.get(row.college_id) : null,
        row.field_of_study_id ? ctx.db.get(row.field_of_study_id) : null,
      ]);
      const educationProjects = (row.projects ?? []).slice(0, 6).map((item) => item.title).filter(Boolean);
      projects.push(...educationProjects);
      educations.push({
        degree: degree?.name,
        college: college?.name,
        field: field?.name,
        projects: educationProjects,
      });
    }

    const certifications = certRows.map((c) => c.name ?? c.issuingOrganization ?? "Certification");
    const resumes = resumeRows.map((r) => ({
      id: r._id,
      title: r.title,
      storage_id: r.storage_id,
      text: r.extracted_text ? clipPlainText(r.extracted_text, 4000) : "",
    }));

    const fingerprint = [
      skills.map((s) => `${s.skill_id}:${s.proficiency ?? ""}`).sort().join(","),
      experiences.map((e) => `${e.title}:${e.company}`).join(","),
      educations.map((e) => `${e.degree ?? ""}:${e.college ?? ""}`).join(","),
      resumes.map((r) => r.storage_id ?? r.title).join(","),
      String((user.professional_summary ?? user.about ?? "").length),
    ].join("|");

    return {
      userId: user._id,
      fingerprint,
      profile: {
        name: user.name,
        headline: user.headline,
        about: clipPlainText(user.about, 500),
        professional_summary: clipPlainText(user.professional_summary, 700),
        city: city?.name,
        profile_type: user.profile_type,
      },
      skills,
      experiences,
      educations,
      projects: projects.slice(0, 12),
      certifications,
      resumes,
    };
  },
});

export const loadJobSnapshot = internalQuery({
  args: { jobId: v.id("jobs"), userId: v.id("users") },
  returns: v.any(),
  handler: async (ctx, args) => {
    const job = await ctx.db.get(args.jobId);
    if (!job) throw new Error("Job not found");
    const [page, city, jobTitle, skillRows] = await Promise.all([
      job.page_id ? ctx.db.get(job.page_id) : null,
      job.city_id ? ctx.db.get(job.city_id) : null,
      job.job_title_id ? ctx.db.get(job.job_title_id) : null,
      ctx.db.query("job_skills").withIndex("by_job", (q) => q.eq("job_id", job._id)).take(30),
    ]);
    const state = city ? await ctx.db.get(city.state_id) : null;
    const skills = [];
    for (const row of skillRows) {
      const skill = await ctx.db.get(row.skill_id);
      if (!skill) continue;
      skills.push({
        name: skill.name,
        skill_id: row.skill_id,
        type: row.type,
        proficiency: row.proficiency,
        weight: row.weight,
      });
    }
    const userSkillRows = await ctx.db
      .query("user_skills")
      .withIndex("by_user", (q) => q.eq("user_id", args.userId))
      .take(80);
    const competency = buildCompetencyFramework(
      skills.map((s) => ({
        skill_id: s.skill_id,
        type: s.type,
        proficiency: s.proficiency,
        weight: s.weight,
        skill: { name: s.name },
      })),
      userSkillRows.map((s) => ({ skill_id: s.skill_id, proficiency: s.proficiency })),
    );
    return {
      job_id: job._id,
      title: jobTitle?.name ?? job.title ?? "Untitled role",
      company: page?.name ?? job.company_name,
      location: city ? (state ? `${city.name}, ${state.name}` : city.name) : undefined,
      description: clipPlainText(job.description, 6000),
      work_type: job.work_type,
      workplace_type: job.workplace_type,
      experience: job.experience,
      skills: skills.map((s) => ({ name: s.name, skill_id: s.skill_id, type: s.type })),
      requirements: skills.map((s) => `${s.name}${s.type ? ` (${s.type})` : ""}`),
      responsibilities: extractJdListItems(job.description, 10),
      competency,
    };
  },
});

export const loadSkillCatalog = internalQuery({
  args: {},
  returns: v.array(v.object({ id: v.id("skills"), name: v.string() })),
  handler: async (ctx) => {
    const rows = await ctx.db.query("skills").take(250);
    return rows.map((row) => ({ id: row._id, name: row.name }));
  },
});

export const findExistingForJob = internalQuery({
  args: { userId: v.id("users"), jobId: v.id("jobs") },
  returns: v.union(
    v.object({
      id: v.id("job_match_sessions"),
      thread_id: v.string(),
      context_fingerprint: v.optional(v.string()),
      overall: v.optional(v.number()),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    const row = await ctx.db
      .query("job_match_sessions")
      .withIndex("by_user_and_job", (q) => q.eq("user_id", args.userId).eq("job_id", args.jobId))
      .order("desc")
      .first();
    if (!row) return null;
    return {
      id: row._id,
      thread_id: row.thread_id,
      context_fingerprint: row.context_fingerprint,
      overall: row.analysis?.overall,
    };
  },
});

export const getSessionInternal = internalQuery({
  args: { sessionId: v.id("job_match_sessions"), authId: v.string() },
  returns: v.any(),
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_authId", (q) => q.eq("authId", args.authId))
      .unique();
    if (!user) throw new Error("User not found");
    const row = await ctx.db.get(args.sessionId);
    if (!row || row.user_id !== user._id) throw new Error("Match session not found");
    return toPublicSession(row);
  },
});

export const insertSession = internalMutation({
  args: {
    user_id: v.id("users"),
    source: v.union(v.literal("qelsa"), v.literal("external")),
    job_id: v.optional(v.id("jobs")),
    thread_id: v.string(),
    title: v.string(),
    company: v.optional(v.string()),
    location: v.optional(v.string()),
    description: v.string(),
    work_type: v.optional(v.string()),
    workplace_type: v.optional(v.union(v.literal("on-site"), v.literal("hybrid"), v.literal("remote"))),
    experience: v.optional(v.number()),
    source_url: v.optional(v.string()),
    skills: v.array(skillRefValidator),
    responsibilities: v.array(v.string()),
    requirements: v.array(v.string()),
    analysis: analysisValidator,
    context_fingerprint: v.optional(v.string()),
  },
  returns: v.id("job_match_sessions"),
  handler: async (ctx, args) => {
    return await ctx.db.insert("job_match_sessions", {
      user_id: args.user_id,
      source: args.source,
      thread_id: args.thread_id,
      title: args.title,
      description: args.description,
      skills: args.skills,
      responsibilities: args.responsibilities,
      requirements: args.requirements,
      analysis: args.analysis,
      ...(args.job_id !== undefined ? { job_id: args.job_id } : {}),
      ...(args.company !== undefined ? { company: args.company } : {}),
      ...(args.location !== undefined ? { location: args.location } : {}),
      ...(args.work_type !== undefined ? { work_type: args.work_type } : {}),
      ...(args.workplace_type !== undefined ? { workplace_type: args.workplace_type } : {}),
      ...(args.experience !== undefined ? { experience: args.experience } : {}),
      ...(args.source_url !== undefined ? { source_url: args.source_url } : {}),
      ...(args.context_fingerprint !== undefined ? { context_fingerprint: args.context_fingerprint } : {}),
    });
  },
});

export const replaceSession = internalMutation({
  args: {
    sessionId: v.id("job_match_sessions"),
    thread_id: v.optional(v.string()),
    title: v.string(),
    company: v.optional(v.string()),
    location: v.optional(v.string()),
    description: v.string(),
    work_type: v.optional(v.string()),
    workplace_type: v.optional(v.union(v.literal("on-site"), v.literal("hybrid"), v.literal("remote"))),
    experience: v.optional(v.number()),
    source_url: v.optional(v.string()),
    skills: v.array(skillRefValidator),
    responsibilities: v.array(v.string()),
    requirements: v.array(v.string()),
    analysis: analysisValidator,
    context_fingerprint: v.optional(v.string()),
  },
  returns: v.id("job_match_sessions"),
  handler: async (ctx, args) => {
    const { sessionId, ...rest } = args;
    await ctx.db.patch(sessionId, {
      title: rest.title,
      description: rest.description,
      skills: rest.skills,
      responsibilities: rest.responsibilities,
      requirements: rest.requirements,
      analysis: rest.analysis,
      ...(rest.thread_id !== undefined ? { thread_id: rest.thread_id } : {}),
      ...(rest.company !== undefined ? { company: rest.company } : {}),
      ...(rest.location !== undefined ? { location: rest.location } : {}),
      ...(rest.work_type !== undefined ? { work_type: rest.work_type } : {}),
      ...(rest.workplace_type !== undefined ? { workplace_type: rest.workplace_type } : {}),
      ...(rest.experience !== undefined ? { experience: rest.experience } : {}),
      ...(rest.source_url !== undefined ? { source_url: rest.source_url } : {}),
      ...(rest.context_fingerprint !== undefined ? { context_fingerprint: rest.context_fingerprint } : {}),
    });
    return sessionId;
  },
});
