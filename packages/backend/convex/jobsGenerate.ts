import { z } from "zod/v3";
import { v } from "convex/values";
import { Agent } from "@convex-dev/agent";
import { components, internal } from "./_generated/api";
import type { Doc, Id } from "./_generated/dataModel";
import { action, internalQuery } from "./_generated/server";
import { AI_AGENT_MODEL, openRouter } from "./lib/ai";

const EXPERIENCE_BUCKETS = [0, 1, 2, 3, 5, 7, 10, 12, 15] as const;

const workTypeValidator = v.union(
  v.literal("full-time"),
  v.literal("part-time"),
  v.literal("contract"),
  v.literal("internship"),
);

const workplaceTypeValidator = v.union(
  v.literal("on-site"),
  v.literal("hybrid"),
  v.literal("remote"),
);

const skillTypeValidator = v.union(
  v.literal("core"),
  v.literal("preferred"),
  v.literal("nice_to_have"),
);

const proficiencyValidator = v.union(
  v.literal("beginner"),
  v.literal("intermediate"),
  v.literal("advance"),
  v.literal("expert"),
);

const draftSkillValidator = v.object({
  id: v.id("skills"),
  name: v.string(),
  type: skillTypeValidator,
  proficiency: proficiencyValidator,
});

const similarJobValidator = v.object({
  title: v.string(),
  work_type: v.optional(v.string()),
  workplace_type: v.optional(v.string()),
  experience: v.optional(v.number()),
  description: v.string(),
  skills: v.array(v.string()),
});

const generationContextValidator = v.object({
  job_title: v.string(),
  location: v.string(),
  company: v.string(),
  industry: v.optional(v.string()),
  company_size: v.optional(v.string()),
  department: v.optional(v.string()),
  seniority: v.optional(v.string()),
  notes: v.optional(v.string()),
  existing_skills: v.array(v.string()),
  allowed_skills: v.array(v.object({ id: v.id("skills"), name: v.string() })),
  similar_jobs: v.array(similarJobValidator),
  previous_jds: v.array(similarJobValidator),
});

const draftResultValidator = v.object({
  work_type: workTypeValidator,
  workplace_type: workplaceTypeValidator,
  experience: v.number(),
  salary_range: v.string(),
  salary_min: v.union(v.number(), v.null()),
  salary_max: v.union(v.number(), v.null()),
  description: v.string(),
  skills: v.array(draftSkillValidator),
  warnings: v.array(v.string()),
});

const generatedDraftSchema = z.object({
  work_type: z.enum(["full-time", "part-time", "contract", "internship"]),
  workplace_type: z.enum(["on-site", "hybrid", "remote"]),
  experience_years: z.number().min(0).max(20),
  salary_min: z.number().nullable(),
  salary_max: z.number().nullable(),
  description: z.string().min(80),
  skills: z
    .array(
      z.object({
        name: z.string(),
        type: z.enum(["core", "preferred", "nice_to_have"]),
        proficiency: z.enum(["beginner", "intermediate", "advance", "expert"]),
      }),
    )
    .min(4)
    .max(12),
});

type SimilarJobSummary = {
  title: string;
  work_type?: string;
  workplace_type?: string;
  experience?: number;
  description: string;
  skills: string[];
};

function clip(text: string | undefined, max: number) {
  if (!text) return "";
  const plain = text.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  return plain.length > max ? `${plain.slice(0, max)}…` : plain;
}

function normalizeSkillName(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9+#]+/g, " ").trim();
}

function snapExperience(years: number) {
  let best: (typeof EXPERIENCE_BUCKETS)[number] = 0;
  let bestDist = Number.POSITIVE_INFINITY;
  for (const bucket of EXPERIENCE_BUCKETS) {
    const dist = Math.abs(years - bucket);
    if (dist < bestDist || (dist === bestDist && bucket < best)) {
      best = bucket;
      bestDist = dist;
    }
  }
  return best;
}

function toAnnualInr(value: number | null) {
  if (value == null || !Number.isFinite(value) || value <= 0) return null;
  if (value < 1000) return Math.round(value * 100000);
  return Math.round(value);
}

function formatSalaryRange(min: number | null, max: number | null) {
  const fmt = (n: number) => {
    if (n >= 100000) {
      const lakhs = n / 100000;
      return Number.isInteger(lakhs) ? `${lakhs}L` : `${lakhs.toFixed(1)}L`;
    }
    if (n >= 1000) {
      const thousands = n / 1000;
      return Number.isInteger(thousands) ? `${thousands}k` : `${thousands.toFixed(0)}k`;
    }
    return String(n);
  };
  if (min == null && max == null) return "";
  if (min != null && max != null) return `${fmt(min)} - ${fmt(max)}`;
  if (min != null) return `${fmt(min)}+`;
  return max != null ? fmt(max) : "";
}

async function summarizeJobs(
  ctx: { db: { query: Function; get: Function } },
  jobs: Doc<"jobs">[],
): Promise<SimilarJobSummary[]> {
  const summaries: SimilarJobSummary[] = [];
  for (const job of jobs) {
    const skillRows = await ctx.db
      .query("job_skills")
      .withIndex("by_job", (q: { eq: Function }) => q.eq("job_id", job._id))
      .take(20);
    const names: string[] = [];
    for (const row of skillRows) {
      const skill = await ctx.db.get(row.skill_id);
      if (skill?.name) names.push(skill.name);
    }
    summaries.push({
      title: job.title ?? "Untitled",
      work_type: job.work_type,
      workplace_type: job.workplace_type,
      experience: job.experience,
      description: clip(job.description, 420),
      skills: names,
    });
  }
  return summaries;
}

export const loadDraftContext = internalQuery({
  args: {
    authId: v.string(),
    jobTitleId: v.id("job_titles"),
    cityId: v.id("cities"),
    pageId: v.optional(v.id("pages")),
    companyName: v.optional(v.string()),
    existingSkillIds: v.optional(v.array(v.id("skills"))),
    notes: v.optional(v.string()),
  },
  returns: v.union(generationContextValidator, v.null()),
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_authId", (q) => q.eq("authId", args.authId))
      .unique();
    if (!user) throw new Error("User not found");

    const [jobTitle, city] = await Promise.all([
      ctx.db.get(args.jobTitleId),
      ctx.db.get(args.cityId),
    ]);
    if (!jobTitle) throw new Error("Job title not found in Qelsa catalog");
    if (!city) throw new Error("Location not found in Qelsa catalog");

    const state = await ctx.db.get(city.state_id);
    const location = state ? `${city.name}, ${state.name}` : city.name;

    let page: Doc<"pages"> | null = null;
    if (args.pageId) {
      page = await ctx.db.get(args.pageId);
      if (!page) throw new Error("Company page not found");
      if (page.ownerId !== user._id) {
        throw new Error("Unauthorized: you can only generate jobs for your own company page");
      }
    }

    const companySize = page?.size_id ? await ctx.db.get(page.size_id) : null;

    const existingSkills: string[] = [];
    for (const skillId of args.existingSkillIds ?? []) {
      const skill = await ctx.db.get(skillId);
      if (skill?.name) existingSkills.push(skill.name);
    }

    const catalogSkills = await ctx.db.query("skills").take(250);
    const allowedById = new Map<Id<"skills">, string>();
    for (const skill of catalogSkills) {
      allowedById.set(skill._id, skill.name);
    }
    for (const skillId of args.existingSkillIds ?? []) {
      if (!allowedById.has(skillId)) {
        const skill = await ctx.db.get(skillId);
        if (skill) allowedById.set(skill._id, skill.name);
      }
    }

    const similarJobs = await ctx.db
      .query("jobs")
      .withIndex("by_job_title", (q) => q.eq("job_title_id", args.jobTitleId))
      .order("desc")
      .take(8);

    const previousJobs = page
      ? await ctx.db
          .query("jobs")
          .withIndex("by_page", (q) => q.eq("page_id", page!._id))
          .order("desc")
          .take(6)
      : [];

    const similarIds = new Set(similarJobs.map((job) => job._id));
    const previousOnly = previousJobs.filter((job) => !similarIds.has(job._id)).slice(0, 5);

    const [similarSummaries, previousSummaries] = await Promise.all([
      summarizeJobs(ctx, similarJobs.filter((job) => job.page_id !== page?._id).slice(0, 5)),
      summarizeJobs(ctx, previousOnly.length ? previousOnly : previousJobs.slice(0, 5)),
    ]);

    for (const summary of [...similarSummaries, ...previousSummaries]) {
      for (const name of summary.skills) {
        const match = catalogSkills.find(
          (skill) => normalizeSkillName(skill.name) === normalizeSkillName(name),
        );
        if (match) allowedById.set(match._id, match.name);
      }
    }

    return {
      job_title: jobTitle.name,
      location,
      company: page?.name ?? args.companyName?.trim() ?? "",
      industry: page?.industry,
      company_size: companySize?.label,
      notes: args.notes?.trim() || undefined,
      existing_skills: existingSkills,
      allowed_skills: [...allowedById.entries()].map(([id, name]) => ({ id, name })),
      similar_jobs: similarSummaries,
      previous_jds: previousSummaries,
    };
  },
});

type GenerationContext = {
  job_title: string;
  location: string;
  company: string;
  industry?: string;
  company_size?: string;
  department?: string;
  seniority?: string;
  notes?: string;
  existing_skills: string[];
  allowed_skills: Array<{ id: Id<"skills">; name: string }>;
  similar_jobs: SimilarJobSummary[];
  previous_jds: SimilarJobSummary[];
};

function buildPrompt(context: GenerationContext) {
  const allowedNames = context.allowed_skills.map((skill) => skill.name);
  return `Write a hiring-manager-ready job draft from Qelsa's locked context.

LOCKED FIELDS — copy is already chosen in the Qelsa database. Never invent, rename, or contradict them:
- Job title: ${context.job_title}
- Location: ${context.location}
- Company: ${context.company || "Not provided"}

RICHER CONTEXT (use this to be specific; do not override locked fields):
- Industry: ${context.industry || "Unknown"}
- Company size: ${context.company_size || "Unknown"}
- Department: ${context.department || "Unknown"}
- Seniority: ${context.seniority || "Unknown"}
- Recruiter notes: ${context.notes || "None"}
- Skills already selected by the recruiter: ${context.existing_skills.join(", ") || "None"}

Similar open roles on Qelsa:
${JSON.stringify(context.similar_jobs)}

This company's previous job descriptions:
${JSON.stringify(context.previous_jds)}

Allowed skill names (pick ONLY from this list; never invent a skill):
${JSON.stringify(allowedNames)}

Rules:
- Output only schema fields.
- Prefer skills the recruiter already selected when they still fit the role.
- Include 4–12 skills. Mark 3–6 as core, the rest preferred or nice_to_have.
- experience_years is the minimum years required, as a number.
- salary_min and salary_max are annual INR integers (e.g. 1200000). Use null if you are not confident.
- description is plain text (no HTML) with short sections: About the role, Responsibilities, Requirements, Nice to have.
- Workplace type should fit the location (do not default everything to remote).
- Do not mention that you are an AI.`;
}

type GeneratedDraft = z.infer<typeof generatedDraftSchema>;

type DraftResult = {
  work_type: "full-time" | "part-time" | "contract" | "internship";
  workplace_type: "on-site" | "hybrid" | "remote";
  experience: number;
  salary_range: string;
  salary_min: number | null;
  salary_max: number | null;
  description: string;
  skills: Array<{
    id: Id<"skills">;
    name: string;
    type: "core" | "preferred" | "nice_to_have";
    proficiency: "beginner" | "intermediate" | "advance" | "expert";
  }>;
  warnings: string[];
};

export const generateDraft = action({
  args: {
    jobTitleId: v.id("job_titles"),
    cityId: v.id("cities"),
    pageId: v.optional(v.id("pages")),
    companyName: v.optional(v.string()),
    existingSkillIds: v.optional(v.array(v.id("skills"))),
    notes: v.optional(v.string()),
  },
  returns: draftResultValidator,
  handler: async (ctx, args): Promise<DraftResult> => {
    if (!openRouter) {
      throw new Error(
        "OPENROUTER_API_KEY is not configured. Set it on the Convex deployment before generating job descriptions.",
      );
    }
    if (!args.pageId && !args.companyName?.trim()) {
      throw new Error("Select a company page or enter a company name.");
    }

    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const context: GenerationContext | null = await ctx.runQuery(internal.jobsGenerate.loadDraftContext, {
      authId: identity.subject,
      jobTitleId: args.jobTitleId,
      cityId: args.cityId,
      pageId: args.pageId,
      companyName: args.companyName,
      existingSkillIds: args.existingSkillIds,
      notes: args.notes,
    });
    if (!context) throw new Error("Could not load job generation context");

    const agent = new Agent(components.agent, {
      name: "Job Description Writer",
      languageModel: openRouter.chat(AI_AGENT_MODEL),
      instructions:
        "You write accurate job drafts for Qelsa recruiters. Locked fields (job title, location, company) come from the Qelsa database and must not be invented or changed. Infer work type, workplace, experience, salary, description, and skills from the provided context. Pick skills only from the allowed catalog names.",
      maxSteps: 1,
    });

    const result: { object: GeneratedDraft } = await agent.generateObject(
      ctx,
      { userId: identity.subject },
      {
        schema: generatedDraftSchema,
        prompt: buildPrompt(context),
      },
    );

    const generated: GeneratedDraft = result.object;
    const warnings: string[] = [];
    const byNormalized = new Map(
      context.allowed_skills.map((skill) => [normalizeSkillName(skill.name), skill] as const),
    );

    const skills: DraftResult["skills"] = [];
    const seen = new Set<string>();

    for (const skill of generated.skills) {
      const match = byNormalized.get(normalizeSkillName(skill.name));
      if (!match) {
        warnings.push(`Dropped invented skill “${skill.name}” — not in the Qelsa catalog.`);
        continue;
      }
      if (seen.has(match.id)) continue;
      seen.add(match.id);
      skills.push({
        id: match.id,
        name: match.name,
        type: skill.type,
        proficiency: skill.proficiency,
      });
    }

    if (skills.length < 4) {
      warnings.push("AI returned fewer catalog skills than expected. Add skills manually before publishing.");
    }

    const salaryMin = toAnnualInr(generated.salary_min);
    const salaryMax = toAnnualInr(generated.salary_max);
    const orderedMin = salaryMin != null && salaryMax != null && salaryMax < salaryMin ? salaryMax : salaryMin;
    const orderedMax = salaryMin != null && salaryMax != null && salaryMax < salaryMin ? salaryMin : salaryMax;

    return {
      work_type: generated.work_type,
      workplace_type: generated.workplace_type,
      experience: snapExperience(generated.experience_years),
      salary_range: formatSalaryRange(orderedMin, orderedMax),
      salary_min: orderedMin,
      salary_max: orderedMax,
      description: generated.description.trim(),
      skills,
      warnings,
    };
  },
});
