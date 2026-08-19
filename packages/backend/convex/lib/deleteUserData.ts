import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx } from "../_generated/server";

async function deleteStorage(ctx: MutationCtx, storageId: Id<"_storage"> | undefined) {
  if (!storageId) return;
  await ctx.storage.delete(storageId);
}

async function deleteApplication(ctx: MutationCtx, applicationId: Id<"job_applications">) {
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

  await ctx.db.delete(applicationId);
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
  const applications = await ctx.db
    .query("job_applications")
    .withIndex("by_job", (q) => q.eq("job_id", jobId))
    .collect();
  for (const application of applications) await deleteApplication(ctx, application._id);

  const skills = await ctx.db
    .query("job_skills")
    .withIndex("by_job", (q) => q.eq("job_id", jobId))
    .collect();
  for (const row of skills) await ctx.db.delete(row._id);

  const views = await ctx.db
    .query("job_views")
    .withIndex("by_job", (q) => q.eq("job_id", jobId))
    .collect();
  for (const row of views) await ctx.db.delete(row._id);

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

  await ctx.db.delete(jobId);
}

async function deleteExperience(ctx: MutationCtx, experienceId: Id<"experiences">) {
  const skills = await ctx.db
    .query("experience_skills")
    .withIndex("by_experience", (q) => q.eq("experience_id", experienceId))
    .collect();
  for (const row of skills) await ctx.db.delete(row._id);

  const responsibilities = await ctx.db
    .query("responsibilities")
    .withIndex("by_experience", (q) => q.eq("experience_id", experienceId))
    .collect();
  for (const row of responsibilities) await ctx.db.delete(row._id);

  const metrics = await ctx.db
    .query("impact_metrics")
    .withIndex("by_experience", (q) => q.eq("experience_id", experienceId))
    .collect();
  for (const row of metrics) await ctx.db.delete(row._id);

  await ctx.db.delete(experienceId);
}

async function deleteEducation(ctx: MutationCtx, educationId: Id<"educations">) {
  const projects = await ctx.db
    .query("projects")
    .withIndex("by_education", (q) => q.eq("education_id", educationId))
    .collect();
  for (const row of projects) await ctx.db.delete(row._id);

  const achievements = await ctx.db
    .query("achievements")
    .withIndex("by_education", (q) => q.eq("education_id", educationId))
    .collect();
  for (const row of achievements) await ctx.db.delete(row._id);

  await ctx.db.delete(educationId);
}

/**
 * Removes every app row owned by this user, including posted jobs and other
 * people's applications to those jobs. Catalog tables stay.
 */
export async function deleteAppUserData(ctx: MutationCtx, user: Doc<"users">) {
  const userId = user._id;

  const culture = await ctx.db
    .query("culture_preferences")
    .withIndex("by_user", (q) => q.eq("user_id", userId))
    .unique();
  if (culture) await ctx.db.delete(culture._id);

  const resumes = await ctx.db
    .query("resumes")
    .withIndex("by_user", (q) => q.eq("user_id", userId))
    .collect();
  for (const resume of resumes) {
    await deleteStorage(ctx, resume.storage_id);
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

  await deleteStorage(ctx, user.profile_image_storage_id);
  await ctx.db.delete(userId);
}
