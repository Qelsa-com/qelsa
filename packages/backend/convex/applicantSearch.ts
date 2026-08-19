import { v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";
import type { QueryCtx } from "./_generated/server";
import { internalQuery } from "./_generated/server";
import { authedQuery } from "./lib/customFunctions";
import {
  criteriaToChips,
  emptyCriteria,
  jobSearchContextValidator,
  mergeCriteria,
  parseKeywordCriteria,
  rankApplicants,
  searchResultValidator,
  yearsFromExperiences,
  type ApplicantSearchCriteria,
  type ApplicantSearchDoc,
} from "./lib/applicantSearch";
import { buildCompetencyFramework, clipPlainText } from "./lib/skillMatch";

const MAX_APPS = 80;

async function requireOwnedJob(ctx: QueryCtx & { user: { _id: Id<"users"> } }, jobId: Id<"jobs">) {
  const job = await ctx.db.get(jobId);
  if (!job || job.owner_id !== ctx.user._id) throw new Error("Unauthorized");
  return job;
}

export async function loadJobSearchContext(ctx: QueryCtx, jobId: Id<"jobs">) {
  const job = await ctx.db.get(jobId);
  if (!job) throw new Error("Job not found");
  const [page, city, jobTitle, skillRows] = await Promise.all([
    job.page_id ? ctx.db.get(job.page_id) : null,
    job.city_id ? ctx.db.get(job.city_id) : null,
    job.job_title_id ? ctx.db.get(job.job_title_id) : null,
    ctx.db.query("job_skills").withIndex("by_job", (q) => q.eq("job_id", jobId)).take(40),
  ]);
  const skills = [];
  for (const row of skillRows) {
    const skill = await ctx.db.get(row.skill_id);
    if (!skill) continue;
    skills.push({
      skill_id: row.skill_id,
      name: skill.name,
      type: row.type,
      proficiency: row.proficiency,
      weight: row.weight,
    });
  }
  return {
    job,
    title: jobTitle?.name ?? job.title ?? "Untitled role",
    company: page?.name ?? job.company_name,
    location: city?.name,
    description: clipPlainText(job.description, 2500),
    workplace_type: job.workplace_type,
    experience: job.experience,
    skills,
  };
}

export async function loadApplicantSearchDocs(
  ctx: QueryCtx,
  jobId: Id<"jobs">,
  options?: { includeText?: boolean },
): Promise<ApplicantSearchDoc[]> {
  const includeText = options?.includeText ?? true;
  const jobContext = await loadJobSearchContext(ctx, jobId);
  const apps = await ctx.db
    .query("job_applications")
    .withIndex("by_job", (q) => q.eq("job_id", jobId))
    .order("desc")
    .take(MAX_APPS);

  const docs = await Promise.all(
    apps.map(async (app) => {
      const user = await ctx.db.get(app.user_id);
      if (!user) return null;

      const [city, userSkills, experienceRows, educationRows, answers] = await Promise.all([
        user.city_id ? ctx.db.get(user.city_id) : null,
        ctx.db.query("user_skills").withIndex("by_user", (q) => q.eq("user_id", user._id)).take(24),
        ctx.db.query("experiences").withIndex("by_user", (q) => q.eq("user_id", user._id)).take(8),
        includeText
          ? ctx.db.query("educations").withIndex("by_user", (q) => q.eq("user_id", user._id)).take(4)
          : Promise.resolve([] as Doc<"educations">[]),
        includeText
          ? ctx.db.query("job_application_answers").withIndex("by_application", (q) => q.eq("job_application_id", app._id)).take(8)
          : Promise.resolve([] as Doc<"job_application_answers">[]),
      ]);

      const skills: ApplicantSearchDoc["skills"] = [];
      for (const row of userSkills) {
        const skill = await ctx.db.get(row.skill_id);
        if (skill) skills.push({ id: row.skill_id, name: skill.name, proficiency: row.proficiency });
      }

      const companies: string[] = [];
      const titles: string[] = [];
      const experienceBits: string[] = [];
      for (const row of experienceRows) {
        const [company, title] = await Promise.all([
          row.company_id ? ctx.db.get(row.company_id) : null,
          row.job_title_id ? ctx.db.get(row.job_title_id) : null,
        ]);
        if (company?.name) companies.push(company.name);
        if (title?.name) titles.push(title.name);
        experienceBits.push([title?.name, company?.name, includeText ? clipPlainText(row.description, 280) : ""].filter(Boolean).join(" "));
      }

      const education: string[] = [];
      for (const row of educationRows) {
        const [college, degree, field] = await Promise.all([
          row.college_id ? ctx.db.get(row.college_id) : null,
          row.degree_id ? ctx.db.get(row.degree_id) : null,
          row.field_of_study_id ? ctx.db.get(row.field_of_study_id) : null,
        ]);
        education.push([degree?.name, field?.name, college?.name].filter(Boolean).join(" "));
      }

      const competency = buildCompetencyFramework(
        jobContext.skills.map((skill) => ({
          skill_id: skill.skill_id,
          type: skill.type,
          proficiency: skill.proficiency,
          weight: skill.weight,
          skill: { name: skill.name },
        })),
        userSkills.map((row) => ({ skill_id: row.skill_id, proficiency: row.proficiency })),
      );

      const screening = answers.map((row) => `${row.question} ${row.answer ?? ""}`).join(" ");
      const search_text = [
        user.name,
        user.email,
        user.phone,
        user.headline,
        includeText ? user.about : undefined,
        includeText ? user.professional_summary : undefined,
        city?.name,
        ...skills.map((skill) => skill.name),
        ...experienceBits,
        ...education,
        screening,
      ]
        .filter(Boolean)
        .join(" ");

      const doc: ApplicantSearchDoc = {
        application_id: app._id,
        name: user.name ?? user.email,
        email: user.email,
        phone: user.phone,
        headline: user.headline,
        location: city?.name,
        years_experience: yearsFromExperiences(experienceRows, app.applied_at),
        status: app.status,
        readiness: competency.readiness,
        applied_at: app.applied_at,
        skills,
        companies,
        titles,
        education: education.filter(Boolean),
        matched_skill_names: competency.competencies.filter((row) => row.matched).map((row) => row.skill_name).filter((name): name is string => Boolean(name)),
        gap_skill_names: competency.competencies.filter((row) => !row.matched).map((row) => row.skill_name).filter((name): name is string => Boolean(name)),
        search_text: clipPlainText(search_text, 6000),
      };
      return doc;
    }),
  );

  return docs.filter((doc): doc is ApplicantSearchDoc => doc != null);
}

export function runKeywordSearch(
  docs: ApplicantSearchDoc[],
  query: string,
  extras?: Partial<ApplicantSearchCriteria>,
) {
  const criteria = mergeCriteria(parseKeywordCriteria(query), extras ?? emptyCriteria());
  return {
    mode: "keyword" as const,
    chips: criteriaToChips(criteria),
    hits: rankApplicants(docs, criteria),
  };
}

export const search = authedQuery({
  args: {
    jobId: v.id("jobs"),
    query: v.string(),
    status: v.optional(v.string()),
    min_years: v.optional(v.number()),
    min_readiness: v.optional(v.number()),
  },
  returns: searchResultValidator,
  handler: async (ctx, args) => {
    await requireOwnedJob(ctx, args.jobId);
    const docs = await loadApplicantSearchDocs(ctx, args.jobId);
    return runKeywordSearch(docs, args.query, {
      status: args.status,
      min_years: args.min_years,
      min_readiness: args.min_readiness,
    });
  },
});

export const loadForOwner = internalQuery({
  args: { authId: v.string(), jobId: v.id("jobs") },
  returns: v.object({
    docs: v.any(),
    job: jobSearchContextValidator,
  }),
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_authId", (q) => q.eq("authId", args.authId))
      .unique();
    if (!user) throw new Error("Not authenticated");
    const job = await ctx.db.get(args.jobId);
    if (!job || job.owner_id !== user._id) throw new Error("Unauthorized");
    const jobContext = await loadJobSearchContext(ctx, args.jobId);
    const docs = await loadApplicantSearchDocs(ctx, args.jobId);
    return {
      docs,
      job: {
        title: jobContext.title,
        company: jobContext.company,
        location: jobContext.location,
        description: jobContext.description,
        workplace_type: jobContext.workplace_type,
        experience: jobContext.experience,
        skills: jobContext.skills.map((skill) => skill.name),
      },
    };
  },
});
