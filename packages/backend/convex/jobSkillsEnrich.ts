import { Agent } from "@convex-dev/agent";
import { v } from "convex/values";
import { z } from "zod/v3";
import { components, internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { internalAction, internalMutation, internalQuery } from "./_generated/server";
import { AI_AGENT_MODEL, requireOpenRouter } from "./lib/ai";
import { parseSalaryFromText, salaryFillPatch, salaryFromLlm } from "./lib/jobSalary";
import { hasExtractedSkills, markSkillsExtracted, MIN_SKILL_DESCRIPTION_CHARS, skillContentHash } from "./lib/jobSkillExtraction";
import { clipPlainText, normalizeSkillName } from "./lib/skillMatch";

const SKILL_TYPES = ["core", "preferred", "nice_to_have"] as const;
const PROFICIENCIES = ["beginner", "intermediate", "advance", "expert"] as const;

/** Jobs enriched per scheduler tick — keeps AI spend and action runtime bounded. */
const BATCH_CAP = 20;

function toExtractedJd(raw: unknown) {
  const obj = raw && typeof raw === "object" && !Array.isArray(raw) ? (raw as Record<string, unknown>) : {};
  const rows = Array.isArray(obj.skills) ? obj.skills : [];
  const skills = [];
  for (const row of rows) {
    const item = row && typeof row === "object" && !Array.isArray(row) ? (row as Record<string, unknown>) : {};
    const name = typeof item.name === "string" ? item.name.trim() : "";
    if (!name) continue;
    const typeRaw =
      typeof item.type === "string"
        ? item.type
            .trim()
            .toLowerCase()
            .replace(/[\s-]+/g, "_")
        : "";
    const type = (SKILL_TYPES as readonly string[]).includes(typeRaw) ? typeRaw : "core";
    let proficiency = typeof item.proficiency === "string" ? item.proficiency.trim().toLowerCase() : "";
    if (proficiency === "advanced") proficiency = "advance";
    skills.push({
      name,
      type,
      proficiency: (PROFICIENCIES as readonly string[]).includes(proficiency) ? proficiency : null,
    });
    if (skills.length >= 16) break;
  }
  const salaryRaw = obj.salary && typeof obj.salary === "object" && !Array.isArray(obj.salary) ? (obj.salary as Record<string, unknown>) : obj;
  const salary = {
    min: typeof salaryRaw.min === "number" ? salaryRaw.min : typeof salaryRaw.salary_min === "number" ? salaryRaw.salary_min : null,
    max: typeof salaryRaw.max === "number" ? salaryRaw.max : typeof salaryRaw.salary_max === "number" ? salaryRaw.salary_max : null,
    currency: typeof salaryRaw.currency === "string" ? salaryRaw.currency : typeof salaryRaw.salary_currency === "string" ? salaryRaw.salary_currency : null,
    period: typeof salaryRaw.period === "string" ? salaryRaw.period : null,
  };
  return { skills, salary: salary.min == null && salary.max == null ? null : salary };
}

const extractedJdSchema = z.preprocess(
  toExtractedJd,
  z.object({
    skills: z.array(
      z.object({
        name: z.string(),
        type: z.enum(SKILL_TYPES),
        proficiency: z.enum(PROFICIENCIES).nullable(),
      }),
    ),
    salary: z
      .object({
        min: z.number().nullable(),
        max: z.number().nullable(),
        currency: z.string().nullable(),
        period: z.string().nullable(),
      })
      .nullable(),
  }),
);

const extractedSkillValidator = v.object({
  name: v.string(),
  type: v.union(v.literal("core"), v.literal("preferred"), v.literal("nice_to_have")),
  proficiency: v.union(v.literal("beginner"), v.literal("intermediate"), v.literal("advance"), v.literal("expert"), v.null()),
});

const extractedSalaryValidator = v.object({
  salary_min: v.optional(v.number()),
  salary_max: v.optional(v.number()),
  salary: v.optional(v.number()),
  salary_currency: v.optional(v.string()),
});

export const getJobForEnrich = internalQuery({
  args: { jobId: v.id("jobs") },
  returns: v.union(
    v.object({
      title: v.string(),
      description: v.string(),
      contentHash: v.string(),
      hasSkills: v.boolean(),
      skillsExtracted: v.boolean(),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    const job = await ctx.db.get(args.jobId);
    if (!job) return null;
    const existing = await ctx.db
      .query("job_skills")
      .withIndex("by_job", (q) => q.eq("job_id", job._id))
      .take(1);
    const title = job.title ?? "Untitled role";
    const description = clipPlainText(job.description, 6000);
    return {
      title,
      description,
      contentHash: skillContentHash(title, description),
      hasSkills: existing.length > 0,
      skillsExtracted: await hasExtractedSkills(ctx, job._id, job.skills_extracted),
    };
  },
});

export const findSkillsByContentHash = internalQuery({
  args: { contentHash: v.string(), excludeJobId: v.id("jobs") },
  returns: v.union(v.id("jobs"), v.null()),
  handler: async (ctx, args) => {
    const rows = await ctx.db
      .query("job_skill_extractions")
      .withIndex("by_content_hash", (q) => q.eq("content_hash", args.contentHash))
      .take(8);
    const match = rows.find((row) => row.job_id !== args.excludeJobId);
    return match?.job_id ?? null;
  },
});

export const copyExtractedSkills = internalMutation({
  args: { jobId: v.id("jobs"), fromJobId: v.id("jobs"), contentHash: v.string() },
  returns: v.number(),
  handler: async (ctx, args) => {
    const job = await ctx.db.get(args.jobId);
    if (!job) return 0;
    if (await hasExtractedSkills(ctx, args.jobId, job.skills_extracted)) return 0;
    const sourceJob = await ctx.db.get(args.fromJobId);
    const source = await ctx.db
      .query("job_skills")
      .withIndex("by_job", (q) => q.eq("job_id", args.fromJobId))
      .collect();
    const existing = await ctx.db
      .query("job_skills")
      .withIndex("by_job", (q) => q.eq("job_id", args.jobId))
      .collect();
    const linked = new Set(existing.map((row) => row.skill_id));
    let inserted = 0;
    for (const row of source) {
      if (linked.has(row.skill_id)) continue;
      linked.add(row.skill_id);
      await ctx.db.insert("job_skills", {
        job_id: args.jobId,
        skill_id: row.skill_id,
        type: row.type,
        proficiency: row.proficiency,
      });
      inserted++;
    }
    await markSkillsExtracted(ctx, args.jobId, args.contentHash);
    const salary =
      (sourceJob
        ? salaryFillPatch(job, {
            salary_min: sourceJob.salary_min,
            salary_max: sourceJob.salary_max,
            salary: sourceJob.salary,
            salary_currency: sourceJob.salary_currency,
          })
        : undefined) ?? salaryFillPatch(job, parseSalaryFromText(job.description));
    if (salary) await ctx.db.patch(args.jobId, salary);
    return inserted;
  },
});

/** Catalog lookup + insert of job_skills rows. Always flags the job so it is never re-processed. */
export const applyExtractedSkills = internalMutation({
  args: {
    jobId: v.id("jobs"),
    skills: v.array(extractedSkillValidator),
    contentHash: v.optional(v.string()),
    salary: v.optional(extractedSalaryValidator),
  },
  returns: v.number(),
  handler: async (ctx, args) => {
    const job = await ctx.db.get(args.jobId);
    if (!job) return 0;
    if (await hasExtractedSkills(ctx, args.jobId, job.skills_extracted)) return 0;
    const catalog = await ctx.db.query("skills").take(1000);
    const byNormalized = new Map(catalog.map((skill) => [normalizeSkillName(skill.name), skill._id]));
    const existing = await ctx.db
      .query("job_skills")
      .withIndex("by_job", (q) => q.eq("job_id", args.jobId))
      .collect();
    const linked = new Set(existing.map((row) => row.skill_id));

    let inserted = 0;
    for (const skill of args.skills) {
      const normalized = normalizeSkillName(skill.name);
      if (!normalized) continue;
      let skillId = byNormalized.get(normalized);
      if (!skillId) {
        // Grow the catalog organically so the skill can match user_skills later.
        skillId = await ctx.db.insert("skills", { name: skill.name.trim() });
        byNormalized.set(normalized, skillId);
      }
      if (linked.has(skillId)) continue;
      linked.add(skillId);
      await ctx.db.insert("job_skills", {
        job_id: args.jobId,
        skill_id: skillId,
        type: skill.type,
        // Leave proficiency unset when the JD gives no depth signal — the matcher
        // treats "skill present, no required level" as a baseline match.
        proficiency: skill.proficiency ?? undefined,
      });
      inserted++;
    }
    // Sidecar for skills; salary fills empty min/max only so ATS numbers stay
    // authoritative and a later regex/LLM pass can still complete a partial range.
    await markSkillsExtracted(ctx, args.jobId, args.contentHash);
    const salary = salaryFillPatch(job, args.salary) ?? salaryFillPatch(job, parseSalaryFromText(job.description));
    if (salary) await ctx.db.patch(args.jobId, salary);
    return inserted;
  },
});

/** Extract skills for a single job via AI and persist them. No-op when skills already exist. */
export const enrichJobSkills = internalAction({
  args: { jobId: v.id("jobs") },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const job = await ctx.runQuery(internal.jobSkillsEnrich.getJobForEnrich, { jobId: args.jobId });
    if (!job || job.hasSkills || job.skillsExtracted) return false;
    if (job.description.length < MIN_SKILL_DESCRIPTION_CHARS) {
      await ctx.runMutation(internal.jobSkillsEnrich.applyExtractedSkills, {
        jobId: args.jobId,
        skills: [],
        contentHash: job.contentHash,
      });
      return false;
    }

    const reuseFrom = await ctx.runQuery(internal.jobSkillsEnrich.findSkillsByContentHash, {
      contentHash: job.contentHash,
      excludeJobId: args.jobId,
    });
    if (reuseFrom) {
      await ctx.runMutation(internal.jobSkillsEnrich.copyExtractedSkills, {
        jobId: args.jobId,
        fromJobId: reuseFrom,
        contentHash: job.contentHash,
      });
      return true;
    }

    const openRouter = requireOpenRouter();

    const agent = new Agent(components.agent, {
      name: "Job Skill Extractor",
      languageModel: openRouter.chat(AI_AGENT_MODEL),
      instructions: `You extract the skills a job requires and any stated pay from a job description.
Rules:
- Only include skills that are explicitly mentioned or unambiguously implied by the text.
- Include technologies, tools, frameworks, domains, and named soft skills.
- Classify each skill: "core" when central to the role, "preferred" when stated as a plus, otherwise "nice_to_have".
- Set proficiency only when the JD signals required depth ("expert in", "deep knowledge of" -> expert; "familiar with", "exposure to" -> beginner); otherwise null.
- Use canonical skill names (e.g. "React", "PostgreSQL"), not sentences.
- Return at most 16 skills.
Salary:
- Fill salary only when the JD states a numeric base or range. Never invent "competitive" pay.
- min/max are numbers (150000 not "150k"). LPA/lakhs are Indian rupees (15 LPA -> 1500000).
- currency is an ISO code (USD, INR, EUR, GBP).
- period is annual, monthly, or hourly.
- Use null salary when pay is unstated.`,
      maxSteps: 1,
    });

    const generated = await agent.generateObject(
      ctx,
      { userId: "job-skill-extractor" },
      {
        schema: extractedJdSchema,
        prompt: `JOB TITLE\n${job.title}\n\nJOB DESCRIPTION\n${job.description}`,
      },
    );

    const salary = salaryFromLlm(generated.object.salary);
    await ctx.runMutation(internal.jobSkillsEnrich.applyExtractedSkills, {
      jobId: args.jobId,
      skills: generated.object.skills,
      contentHash: job.contentHash,
      ...(salary ? { salary } : {}),
    });
    return generated.object.skills.length > 0;
  },
});

/** Enrich a list of job ids, chaining via the scheduler when the list exceeds the batch cap. */
export const enrichBatch = internalAction({
  args: { jobIds: v.array(v.id("jobs")) },
  returns: v.null(),
  handler: async (ctx, args) => {
    if (!process.env.OPENROUTER_API_KEY) {
      console.log("OPENROUTER_API_KEY is not set — skipping job skill enrichment");
      return null;
    }
    const uniqueIds = [...new Set(args.jobIds)];
    const head = uniqueIds.slice(0, BATCH_CAP);
    const tail = uniqueIds.slice(BATCH_CAP);
    for (const jobId of head) {
      try {
        await ctx.runAction(internal.jobSkillsEnrich.enrichJobSkills, { jobId });
      } catch (error) {
        console.error("job skill enrichment failed", jobId, error);
      }
    }
    if (tail.length > 0) {
      await ctx.scheduler.runAfter(0, internal.jobSkillsEnrich.enrichBatch, { jobIds: tail });
    }
    return null;
  },
});

/** Page of open jobs that have no job_skills and were never through extraction. */
export const listJobsMissingSkills = internalQuery({
  args: { cursor: v.union(v.string(), v.null()), limit: v.number() },
  returns: v.object({
    jobIds: v.array(v.id("jobs")),
    continueCursor: v.union(v.string(), v.null()),
    isDone: v.boolean(),
  }),
  handler: async (ctx, args) => {
    const { page, isDone, continueCursor } = await ctx.db.query("jobs").paginate({ cursor: args.cursor, numItems: 200 });
    const jobIds: Id<"jobs">[] = [];
    for (const job of page) {
      if (jobIds.length >= args.limit) break;
      if (job.status !== "open" || (await hasExtractedSkills(ctx, job._id, job.skills_extracted))) continue;
      const skill = await ctx.db
        .query("job_skills")
        .withIndex("by_job", (q) => q.eq("job_id", job._id))
        .take(1);
      if (skill.length === 0) jobIds.push(job._id);
    }
    return { jobIds, continueCursor, isDone };
  },
});

/** Backfill pass — enriches a batch, then schedules itself until the table is scanned. */
export const backfillMissingJobSkills = internalAction({
  args: { cursor: v.union(v.string(), v.null()), limit: v.number() },
  returns: v.object({ processed: v.number(), hasMore: v.boolean() }),
  handler: async (ctx, args) => {
    if (!process.env.OPENROUTER_API_KEY) {
      console.log("OPENROUTER_API_KEY is not set — skipping job skill backfill");
      return { processed: 0, hasMore: false };
    }
    const limit = Math.max(1, Math.min(BATCH_CAP, Math.round(args.limit)));
    const scan = await ctx.runQuery(internal.jobSkillsEnrich.listJobsMissingSkills, {
      cursor: args.cursor,
      limit,
    });
    let processed = 0;
    for (const jobId of scan.jobIds) {
      try {
        const enriched = await ctx.runAction(internal.jobSkillsEnrich.enrichJobSkills, { jobId });
        if (enriched) processed++;
      } catch (error) {
        console.error("job skill backfill failed", jobId, error);
      }
    }
    if (!scan.isDone) {
      await ctx.scheduler.runAfter(0, internal.jobSkillsEnrich.backfillMissingJobSkills, {
        cursor: scan.continueCursor,
        limit,
      });
    }
    return { processed, hasMore: !scan.isDone };
  },
});

/**
 * Entry point to kick off the backfill for all existing jobs.
 * Internal-only: not callable by clients; run it from the Convex dashboard
 * (the dashboard runner has no app auth token, so a public action would fail auth).
 */
export const backfillAllJobSkills = internalAction({
  args: { limit: v.optional(v.number()) },
  returns: v.object({ started: v.boolean() }),
  handler: async (ctx, args) => {
    await ctx.scheduler.runAfter(0, internal.jobSkillsEnrich.backfillMissingJobSkills, {
      cursor: null,
      limit: args.limit ?? 10,
    });
    return { started: true };
  },
});
