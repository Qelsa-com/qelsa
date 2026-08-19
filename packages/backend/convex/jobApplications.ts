import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { R2 } from "@convex-dev/r2";
import { components } from "./_generated/api";
import { authedMutation, authedQuery } from "./lib/customFunctions";
import { iso, withId } from "./lib/helpers";
import { bumpJobCount } from "./lib/jobCounts";
import { yearsFromExperiences } from "./lib/applicantSearch";
import { buildCompetencyFramework } from "./lib/skillMatch";
import { signedFileUrl } from "./lib/r2";

const r2 = new R2(components.r2);

export const listForJob = authedQuery({
  args: { jobId: v.id("jobs"), status: v.optional(v.string()) },
  returns: v.any(),
  handler: async (ctx, args) => {
    const job = await ctx.db.get(args.jobId);
    if (!job || job.owner_id !== ctx.user._id) throw new Error("Unauthorized");
    const apps = await ctx.db
      .query("job_applications")
      .withIndex("by_job", (q) => q.eq("job_id", args.jobId))
      .order("desc")
      .take(80);
    const filtered = args.status ? apps.filter((app) => app.status === args.status) : apps;

    const skillRows = await ctx.db.query("job_skills").withIndex("by_job", (q) => q.eq("job_id", args.jobId)).take(40);
    const jobSkills = [];
    for (const row of skillRows) {
      const skill = await ctx.db.get(row.skill_id);
      if (!skill) continue;
      jobSkills.push({
        skill_id: row.skill_id,
        type: row.type,
        proficiency: row.proficiency,
        weight: row.weight,
        skill: { name: skill.name },
      });
    }

    const out = [];
    for (const app of filtered) {
      const user = await ctx.db.get(app.user_id);
      if (!user) continue;
      const [city, userSkills, experienceRows] = await Promise.all([
        user.city_id ? ctx.db.get(user.city_id) : null,
        ctx.db.query("user_skills").withIndex("by_user", (q) => q.eq("user_id", user._id)).take(24),
        ctx.db.query("experiences").withIndex("by_user", (q) => q.eq("user_id", user._id)).take(8),
      ]);
      const skills = [];
      for (const row of userSkills) {
        const skill = await ctx.db.get(row.skill_id);
        if (skill) skills.push({ id: row.skill_id, name: skill.name, proficiency: row.proficiency });
      }
      const competency = buildCompetencyFramework(
        jobSkills,
        userSkills.map((row) => ({ skill_id: row.skill_id, proficiency: row.proficiency })),
      );
      out.push({
        id: app._id,
        applicant_name: user.name ?? user.email,
        headline: user.headline,
        location: city?.name,
        years_experience: yearsFromExperiences(experienceRows, app.applied_at),
        skills,
        readiness: competency.readiness,
        applied_at: iso(app.applied_at),
        status: app.status,
      });
    }
    return out;
  },
});

export const getDetail = authedQuery({
  args: { jobId: v.id("jobs"), applicationId: v.id("job_applications") },
  returns: v.any(),
  handler: async (ctx, args) => {
    const job = await ctx.db.get(args.jobId);
    if (!job || job.owner_id !== ctx.user._id) throw new Error("Unauthorized");
    const app = await ctx.db.get(args.applicationId);
    if (!app || app.job_id !== args.jobId) return null;
    const user = await ctx.db.get(app.user_id);
    const resume = app.resume_id ? await ctx.db.get(app.resume_id) : null;
    const answers = await ctx.db
      .query("job_application_answers")
      .withIndex("by_application", (q) => q.eq("job_application_id", app._id))
      .collect();
    return {
      ...withId(app),
      applied_at: iso(app.applied_at),
      user: user ? withId(user) : null,
      resume: resume
        ? {
            ...withId(resume),
            file_url: (await signedFileUrl(r2, resume.storage_id)) ?? resume.file_url,
          }
        : null,
      answers: answers.map(withId),
      job_application_answers: answers.map(withId),
    };
  },
});

export const apply = authedMutation({
  args: {
    jobId: v.id("jobs"),
    resume_id: v.optional(v.id("resumes")),
    answers: v.optional(v.any()),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("job_applications")
      .withIndex("by_job_and_user", (q) => q.eq("job_id", args.jobId).eq("user_id", ctx.user._id))
      .collect();
    if (existing.some((a) => a.status !== "rejected" && a.status !== "cancelled")) {
      throw new Error("You already applied to this job");
    }
    const id = await ctx.db.insert("job_applications", {
      user_id: ctx.user._id,
      job_id: args.jobId,
      resume_id: args.resume_id,
      status: "applied",
      applied_at: Date.now(),
    });
    await bumpJobCount(ctx, args.jobId, "application_count", 1);
    const answers = (args.answers ?? {}) as Record<string, string>;
    for (const [questionId, answer] of Object.entries(answers)) {
      const question = await ctx.db.get(questionId as Id<"questions">);
      await ctx.db.insert("job_application_answers", {
        job_id: args.jobId,
        job_application_id: id,
        user_id: ctx.user._id,
        question_id: questionId as Id<"questions">,
        question: question?.title ?? "",
        answer,
      });
    }
    return withId((await ctx.db.get(id))!);
  },
});

export const bulkUpdateStatus = authedMutation({
  args: {
    application_ids: v.array(v.id("job_applications")),
    new_status: v.union(
      v.literal("applied"),
      v.literal("viewed"),
      v.literal("shortlisted"),
      v.literal("sorted"),
      v.literal("rejected"),
      v.literal("hold"),
      v.literal("cancelled"),
    ),
  },
  returns: v.object({ updatedCount: v.number() }),
  handler: async (ctx, args) => {
    let updatedCount = 0;
    for (const id of args.application_ids) {
      const app = await ctx.db.get(id);
      if (!app) continue;
      const job = await ctx.db.get(app.job_id);
      if (!job || job.owner_id !== ctx.user._id) continue;
      const old = app.status;
      await ctx.db.patch(id, { status: args.new_status });
      await ctx.db.insert("job_application_logs", {
        job_id: app.job_id,
        job_application_id: id,
        created_by_id: ctx.user._id,
        action_type: "status_changed",
        old_status: old,
        new_status: args.new_status,
      });
      updatedCount += 1;
    }
    return { updatedCount };
  },
});
