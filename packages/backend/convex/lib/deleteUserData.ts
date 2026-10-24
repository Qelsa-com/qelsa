import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx } from "../_generated/server";
import { bumpJobCount, bumpOpenJobCount, openCountDelta } from "./jobCounts";
import { ADMIN_STAT_KEYS, bumpAdminStat } from "./adminStats";

async function deleteApplication(
  ctx: MutationCtx,
  applicationId: Id<"job_applications">,
  adjustJobCount = true,
) {
  const answers = await ctx.db
    .query("job_application_answers")
    .withIndex("by_application", (q) => q.eq("job_application_id", applicationId))
    .collect();
  for (const row of answers) await ctx.db.delete(row._id);

  const logs = await ctx.db
    .query("job_application_logs")
    .withIndex("by_application", (q) => q.eq("job_application_id", applicationId))
    .collect();
  for (const row of logs) await ctx.db.delete(row._id);

  const notes = await ctx.db
    .query("job_application_notes")
    .withIndex("by_application", (q) => q.eq("job_application_id", applicationId))
    .collect();
  for (const row of notes) await ctx.db.delete(row._id);

  const agentNotes = await ctx.db
    .query("agent_application_notes")
    .withIndex("by_application", (q) => q.eq("application_id", applicationId))
    .collect();
  for (const row of agentNotes) await ctx.db.delete(row._id);

  const application = await ctx.db.get(applicationId);
  await ctx.db.delete(applicationId);
  if (adjustJobCount && application) {
    await bumpJobCount(ctx, application.job_id, "application_count", -1);
  }
  // Keep the admin dashboard counter in step with the deletion.
  await bumpAdminStat(ctx, ADMIN_STAT_KEYS.applications, -1);
}

async function deleteQuestionSet(ctx: MutationCtx, setId: Id<"question_sets">) {
  const questions = await ctx.db
    .query("questions")
    .withIndex("by_set", (q) => q.eq("question_set_id", setId))
    .collect();
  for (const question of questions) {
    const options = await ctx.db
      .query("options")
      .withIndex("by_question", (q) => q.eq("question_id", question._id))
      .collect();
    for (const option of options) await ctx.db.delete(option._id);
    await ctx.db.delete(question._id);
  }
  await ctx.db.delete(setId);
}

async function deleteJob(ctx: MutationCtx, jobId: Id<"jobs">) {
  const job = await ctx.db.get(jobId);
  const applications = await ctx.db
    .query("job_applications")
    .withIndex("by_job", (q) => q.eq("job_id", jobId))
    .collect();
  for (const application of applications) await deleteApplication(ctx, application._id, false);

  const skills = await ctx.db
    .query("job_skills")
    .withIndex("by_job", (q) => q.eq("job_id", jobId))
    .collect();
  for (const row of skills) await ctx.db.delete(row._id);

  const extractions = await ctx.db
    .query("job_skill_extractions")
    .withIndex("by_job", (q) => q.eq("job_id", jobId))
    .collect();
  for (const row of extractions) await ctx.db.delete(row._id);

  const views = await ctx.db
    .query("job_views")
    .withIndex("by_job", (q) => q.eq("job_id", jobId))
    .collect();
  for (const row of views) await ctx.db.delete(row._id);

  const stats = await ctx.db
    .query("job_stats")
    .withIndex("by_job", (q) => q.eq("job_id", jobId))
    .collect();
  for (const row of stats) await ctx.db.delete(row._id);

  const saved = await ctx.db
    .query("saved_jobs")
    .withIndex("by_job", (q) => q.eq("job_id", jobId))
    .collect();
  for (const row of saved) await ctx.db.delete(row._id);

  const sets = await ctx.db
    .query("question_sets")
    .withIndex("by_job", (q) => q.eq("jobId", jobId))
    .collect();
  for (const set of sets) await deleteQuestionSet(ctx, set._id);

  await bumpOpenJobCount(ctx, openCountDelta(job?.status, undefined));
  await ctx.db.delete(jobId);
  // Keep the admin dashboard counters in step with the deletion.
  await bumpAdminStat(ctx, ADMIN_STAT_KEYS.jobs, -1);
  if (job?.status === "open") await bumpAdminStat(ctx, ADMIN_STAT_KEYS.openJobs, -1);
}

export async function deleteJobCascade(ctx: MutationCtx, jobId: Id<"jobs">) {
  await deleteJob(ctx, jobId);
}

async function deleteExperience(ctx: MutationCtx, experienceId: Id<"experiences">) {
  const skills = await ctx.db
    .query("experience_skills")
    .withIndex("by_experience", (q) => q.eq("experience_id", experienceId))
    .collect();
  for (const row of skills) await ctx.db.delete(row._id);
  await ctx.db.delete(experienceId);
}

async function deleteEducation(ctx: MutationCtx, educationId: Id<"educations">) {
  await ctx.db.delete(educationId);
}

/**
 * Removes every app row owned by this user, including posted jobs and other
 * people's applications to those jobs. Catalog tables stay.
 * Returns R2 object keys so callers can delete objects without importing
 * the R2 component here (that import cycles with auth.ts).
 */
export async function deleteAppUserData(ctx: MutationCtx, user: Doc<"users">) {
  const userId = user._id;
  const r2Keys: string[] = [];

  const culture = await ctx.db
    .query("culture_preferences")
    .withIndex("by_user", (q) => q.eq("user_id", userId))
    .unique();
  if (culture) await ctx.db.delete(culture._id);

  const careerGoal = await ctx.db
    .query("career_goals")
    .withIndex("by_user", (q) => q.eq("user_id", userId))
    .unique();
  if (careerGoal) await ctx.db.delete(careerGoal._id);

  const resumes = await ctx.db
    .query("resumes")
    .withIndex("by_user", (q) => q.eq("user_id", userId))
    .collect();
  for (const resume of resumes) {
    if (resume.storage_id) r2Keys.push(resume.storage_id);
    await ctx.db.delete(resume._id);
  }

  const skills = await ctx.db
    .query("user_skills")
    .withIndex("by_user", (q) => q.eq("user_id", userId))
    .collect();
  for (const row of skills) await ctx.db.delete(row._id);

  const certifications = await ctx.db
    .query("user_certifications")
    .withIndex("by_user", (q) => q.eq("user_id", userId))
    .collect();
  for (const certification of certifications) {
    const links = await ctx.db
      .query("user_certification_skills")
      .withIndex("by_certification", (q) => q.eq("user_certification_id", certification._id))
      .collect();
    for (const link of links) await ctx.db.delete(link._id);
    await ctx.db.delete(certification._id);
  }

  const educations = await ctx.db
    .query("educations")
    .withIndex("by_user", (q) => q.eq("user_id", userId))
    .collect();
  for (const education of educations) await deleteEducation(ctx, education._id);

  const experiences = await ctx.db
    .query("experiences")
    .withIndex("by_user", (q) => q.eq("user_id", userId))
    .collect();
  for (const experience of experiences) await deleteExperience(ctx, experience._id);

  const saved = await ctx.db
    .query("saved_jobs")
    .withIndex("by_user", (q) => q.eq("user_id", userId))
    .collect();
  for (const row of saved) await ctx.db.delete(row._id);

  const views = await ctx.db
    .query("job_views")
    .withIndex("by_user", (q) => q.eq("user_id", userId))
    .collect();
  for (const row of views) await ctx.db.delete(row._id);

  const applications = await ctx.db
    .query("job_applications")
    .withIndex("by_user", (q) => q.eq("user_id", userId))
    .collect();
  for (const application of applications) await deleteApplication(ctx, application._id);

  const matchSessions = await ctx.db
    .query("job_match_sessions")
    .withIndex("by_user", (q) => q.eq("user_id", userId))
    .collect();
  for (const session of matchSessions) await ctx.db.delete(session._id);

  const savedSearches = await ctx.db
    .query("agent_saved_searches")
    .withIndex("by_user", (q) => q.eq("user_id", userId))
    .collect();
  for (const row of savedSearches) await ctx.db.delete(row._id);

  const briefs = await ctx.db
    .query("agent_briefs")
    .withIndex("by_user_and_created", (q) => q.eq("user_id", userId))
    .collect();
  for (const row of briefs) await ctx.db.delete(row._id);

  const memories = await ctx.db
    .query("agent_memories")
    .withIndex("by_user_and_updated", (q) => q.eq("user_id", userId))
    .collect();
  for (const row of memories) await ctx.db.delete(row._id);

  const agentUsage = await ctx.db
    .query("qelsa_agent_usage")
    .withIndex("by_user_and_day", (q) => q.eq("user_id", userId))
    .collect();
  for (const row of agentUsage) await ctx.db.delete(row._id);

  const pushSubscriptions = await ctx.db
    .query("agent_push_subscriptions")
    .withIndex("by_user", (q) => q.eq("user_id", userId))
    .collect();
  for (const row of pushSubscriptions) await ctx.db.delete(row._id);

  const autofillTokens = await ctx.db
    .query("agent_autofill_tokens")
    .withIndex("by_user", (q) => q.eq("user_id", userId))
    .collect();
  for (const row of autofillTokens) await ctx.db.delete(row._id);

  const courseClicks = await ctx.db
    .query("course_clicks")
    .withIndex("by_user_and_created", (q) => q.eq("user_id", userId))
    .collect();
  for (const row of courseClicks) await ctx.db.delete(row._id);

  const manualEntitlements = await ctx.db
    .query("manual_entitlements")
    .withIndex("by_user", (q) => q.eq("user_id", userId))
    .collect();
  for (const row of manualEntitlements) await ctx.db.delete(row._id);

  const agentThreads = await ctx.db
    .query("qelsa_agent_threads")
    .withIndex("by_user", (q) => q.eq("user_id", userId))
    .collect();
  for (const row of agentThreads) await ctx.db.delete(row._id);

  const pages = await ctx.db
    .query("pages")
    .withIndex("by_owner", (q) => q.eq("ownerId", userId))
    .collect();
  const jobsById = new Map<Id<"jobs">, Doc<"jobs">>();
  const ownedJobs = await ctx.db
    .query("jobs")
    .withIndex("by_owner", (q) => q.eq("owner_id", userId))
    .collect();
  for (const job of ownedJobs) jobsById.set(job._id, job);
  for (const page of pages) {
    const pageJobs = await ctx.db
      .query("jobs")
      .withIndex("by_page", (q) => q.eq("page_id", page._id))
      .collect();
    for (const job of pageJobs) jobsById.set(job._id, job);
  }
  for (const job of jobsById.values()) await deleteJob(ctx, job._id);
  for (const page of pages) await ctx.db.delete(page._id);

  const submittedCompanies = await ctx.db
    .query("user_submitted_companies")
    .withIndex("by_submitted_by", (q) => q.eq("submitted_by", userId))
    .collect();
  for (const row of submittedCompanies) await ctx.db.delete(row._id);

  if (user.profile_image_storage_id) r2Keys.push(user.profile_image_storage_id);
  await ctx.db.delete(userId);
  // Keep the admin dashboard counters in step with the deletion.
  await bumpAdminStat(ctx, ADMIN_STAT_KEYS.users, -1);
  if (user.role === "admin") await bumpAdminStat(ctx, ADMIN_STAT_KEYS.admins, -1);
  if (user.account_type === "seeker") await bumpAdminStat(ctx, ADMIN_STAT_KEYS.seekers, -1);
  if (user.account_type === "recruiter") await bumpAdminStat(ctx, ADMIN_STAT_KEYS.recruiters, -1);
  if (!user.isActive) await bumpAdminStat(ctx, ADMIN_STAT_KEYS.inactiveUsers, -1);
  return r2Keys;
}
