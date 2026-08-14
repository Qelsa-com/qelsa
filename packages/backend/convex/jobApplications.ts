import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { authedMutation, authedQuery } from "./lib/customFunctions";
import { iso, withId } from "./lib/helpers";
import { buildCompetencyFramework } from "./lib/skillMatch";

export const listForJob = authedQuery({
  args: { jobId: v.id("jobs"), status: v.optional(v.string()) },
  returns: v.any(),
  handler: async (ctx, args) => {
    const job = await ctx.db.get(args.jobId);
    if (!job || job.owner_id !== ctx.user._id) throw new Error("Unauthorized");
    let apps = await ctx.db.query("job_applications").withIndex("by_job", (q) => q.eq("job_id", args.jobId)).collect();
    if (args.status) apps = apps.filter((a) => a.status === args.status);
    const jobSkillRows = await ctx.db.query("job_skills").withIndex("by_job", (q) => q.eq("job_id", args.jobId)).collect();
    const out = [];
    for (const app of apps) {
      const user = await ctx.db.get(app.user_id);
      const userSkills = await ctx.db.query("user_skills").withIndex("by_user", (q) => q.eq("user_id", app.user_id)).collect();
      const competency = buildCompetencyFramework(
        jobSkillRows.map((js) => ({ skill_id: js.skill_id, type: js.type, proficiency: js.proficiency, weight: js.weight })),
        userSkills.map((s) => ({ skill_id: s.skill_id, proficiency: s.proficiency })),
      );
      out.push({
        id: app._id,
        applicant_name: user?.name ?? user?.email ?? "Unknown",
        skills: userSkills.map((s) => s.skill_id),
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
      resume: resume ? withId(resume) : null,
      answers: answers.map(withId),
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
