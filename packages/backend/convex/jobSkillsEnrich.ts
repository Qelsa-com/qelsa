import { Agent } from "@convex-dev/agent";
import { v } from "convex/values";
import { z } from "zod/v3";
import { components, internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { internalAction, internalMutation, internalQuery } from "./_generated/server";
import { AI_AGENT_MODEL, requireOpenRouter } from "./lib/ai";
import { hasExtractedSkills, markSkillsExtracted } from "./lib/jobSkillExtraction";
import { clipPlainText, normalizeSkillName } from "./lib/skillMatch";

const SKILL_TYPES = ["core", "preferred", "nice_to_have"] as const;
const PROFICIENCIES = ["beginner", "intermediate", "advance", "expert"] as const;

/** Jobs enriched per scheduler tick — keeps AI spend and action runtime bounded. */
const BATCH_CAP = 20;

function toExtractedSkills(raw: unknown) {
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
  return { skills };
}

const extractedSkillsSchema = z.preprocess(
  toExtractedSkills,
  z.object({
    skills: z.array(
      z.object({
        name: z.string(),
        type: z.enum(SKILL_TYPES),
        proficiency: z.enum(PROFICIENCIES).nullable(),
      }),
    ),
  }),
);

const extractedSkillValidator = v.object({
  name: v.string(),
  type: v.union(v.literal("core"), v.literal("preferred"), v.literal("nice_to_have")),
  proficiency: v.union(v.literal("beginner"), v.literal("intermediate"), v.literal("advance"), v.literal("expert"), v.null()),
});

export const getJobForEnrich = internalQuery({
  args: { jobId: v.id("jobs") },
  returns: v.union(
    v.object({
      title: v.string(),
      description: v.string(),
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
    return {
      title: job.title ?? "Untitled role",
      description: clipPlainText(job.description, 6000),
      hasSkills: existing.length > 0,
      skillsExtracted: await hasExtractedSkills(ctx, job._id, job.skills_extracted),
    };
  },
});

/** Catalog lookup + insert of job_skills rows. Always flags the job so it is never re-processed. */
export const applyExtractedSkills = internalMutation({
  args: { jobId: v.id("jobs"), skills: v.array(extractedSkillValidator) },
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
    // Write the sidecar only — never patch `jobs`, which ATS sync also writes.
    await markSkillsExtracted(ctx, args.jobId);
    return inserted;
  },
});

/** Extract skills for a single job via AI and persist them. No-op when skills already exist. */
export const enrichJobSkills = internalAction({
  args: { jobId: v.id("jobs") },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const openRouter = requireOpenRouter();
    const job = await ctx.runQuery(internal.jobSkillsEnrich.getJobForEnrich, { jobId: args.jobId });
    if (!job || job.hasSkills || job.skillsExtracted || job.description.length < 80) return false;

    const agent = new Agent(components.agent, {
      name: "Job Skill Extractor",
      languageModel: openRouter.chat(AI_AGENT_MODEL),
      instructions: `You extract the skills a job requires from a job description.
Rules:
- Only include skills that are explicitly mentioned or unambiguously implied by the text.
- Include technologies, tools, frameworks, domains, and named soft skills.
- Classify each skill: "core" when central to the role, "preferred" when stated as a plus, otherwise "nice_to_have".
- Set proficiency only when the JD signals required depth ("expert in", "deep knowledge of" -> expert; "familiar with", "exposure to" -> beginner); otherwise null.
- Use canonical skill names (e.g. "React", "PostgreSQL"), not sentences.
- Return at most 16 skills.`,
      maxSteps: 1,
    });

    const generated = await agent.generateObject(
      ctx,
      { userId: "job-skill-extractor" },
      {
        schema: extractedSkillsSchema,
        prompt: `JOB TITLE\n${job.title}\n\nJOB DESCRIPTION\n${job.description}`,
      },
    );

    await ctx.runMutation(internal.jobSkillsEnrich.applyExtractedSkills, {
      jobId: args.jobId,
      skills: generated.object.skills,
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
    const head = args.jobIds.slice(0, BATCH_CAP);
    const tail = args.jobIds.slice(BATCH_CAP);
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
