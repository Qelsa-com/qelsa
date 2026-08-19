import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { loadApplicantSearchDocs } from "./applicantSearch";
import { authedMutation, authedQuery } from "./lib/customFunctions";
import { iso, withId } from "./lib/helpers";

export const listForJob = authedQuery({
  args: { jobId: v.id("jobs"), status: v.optional(v.string()) },
  returns: v.any(),
  handler: async (ctx, args) => {
    const job = await ctx.db.get(args.jobId);
    if (!job || job.owner_id !== ctx.user._id) throw new Error("Unauthorized");
    const docs = await loadApplicantSearchDocs(ctx, args.jobId, { includeText: false });
    return docs
      .filter((doc) => !args.status || doc.status === args.status)
      .map((doc) => ({
        id: doc.application_id,
        applicant_name: doc.name,
        headline: doc.headline,
        location: doc.location,
        years_experience: doc.years_experience,
        skills: doc.skills,
        readiness: doc.readiness,
        applied_at: iso(doc.applied_at),
        status: doc.status,
      }));
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
