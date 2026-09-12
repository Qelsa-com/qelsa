"use node";

import { Agent } from "@convex-dev/agent";
import { v } from "convex/values";
import { z } from "zod/v3";
import { components } from "./_generated/api";
import { action } from "./_generated/server";
import { AI_AGENT_MODEL, openRouter } from "./lib/ai";
import {
  experienceLevelValidator,
  MAX_COMPANIES,
  MAX_DESCRIPTION,
  MAX_SKILLS,
  MAX_TAG,
  normalizeExperienceLevel,
  normalizeFocus,
  normalizeRole,
  normalizeTimeline,
  parseCareerGoalText,
  primaryFocusValidator,
  timelineValidator,
  uniqueTrimmed,
} from "./lib/careerGoal";

const extractedValidator = v.object({
  target_role: v.union(v.string(), v.null()),
  dream_companies: v.array(v.string()),
  timeline: v.union(timelineValidator, v.null()),
  experience_level: v.union(experienceLevelValidator, v.null()),
  skills: v.array(v.string()),
  primary_focus: v.union(primaryFocusValidator, v.null()),
  source: v.union(v.literal("rules"), v.literal("ai")),
});

const extractedSchema = z.object({
  target_role: z.string().nullable(),
  dream_companies: z.array(z.string()),
  timeline: z.enum(["3_months", "6_months", "1_year", "2_plus_years"]).nullable(),
  experience_level: z.enum(["entry", "mid", "senior", "lead"]).nullable(),
  skills: z.array(z.string()),
  primary_focus: z.enum(["switch_roles", "get_promoted", "switch_industries", "upskill"]).nullable(),
});

function sanitizeExtract(
  raw: {
    target_role?: string | null;
    dream_companies?: string[];
    timeline?: string | null;
    experience_level?: string | null;
    skills?: string[];
    primary_focus?: string | null;
  },
  source: "rules" | "ai",
) {
  const role = normalizeRole(raw.target_role ?? "");
  return {
    target_role: role || null,
    dream_companies: uniqueTrimmed(raw.dream_companies ?? [], MAX_COMPANIES, MAX_TAG),
    timeline: normalizeTimeline(raw.timeline) ?? null,
    experience_level: normalizeExperienceLevel(raw.experience_level) ?? null,
    skills: uniqueTrimmed(raw.skills ?? [], MAX_SKILLS, MAX_TAG),
    primary_focus: normalizeFocus(raw.primary_focus) ?? null,
    source,
  };
}

export const extractFromText = action({
  args: { description: v.string() },
  returns: extractedValidator,
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const description = args.description.trim().slice(0, MAX_DESCRIPTION);
    const fallback = sanitizeExtract(parseCareerGoalText(description), "rules");
    if (!description || !openRouter) return fallback;

    const agent = new Agent(components.agent, {
      name: "Career Goal Reader",
      languageModel: openRouter.chat(AI_AGENT_MODEL),
      instructions:
        "Extract a structured career goal from the user's own words. Do not invent companies or skills they did not mention. Leave a field null or empty when it is not clearly present. target_role should be a job title, not a sentence.",
      maxSteps: 1,
    });

    try {
      const result = await agent.generateObject(
        ctx,
        { userId: identity.subject },
        {
          schema: extractedSchema,
          prompt: `Extract career goal fields from this description:\n\n${description}`,
        },
      );
      const ai = sanitizeExtract(result.object, "ai");
      return {
        target_role: ai.target_role ?? fallback.target_role,
        dream_companies: ai.dream_companies.length > 0 ? ai.dream_companies : fallback.dream_companies,
        timeline: ai.timeline ?? fallback.timeline,
        experience_level: ai.experience_level ?? fallback.experience_level,
        skills: ai.skills.length > 0 ? ai.skills : fallback.skills,
        primary_focus: ai.primary_focus ?? fallback.primary_focus,
        source: "ai" as const,
      };
    } catch (error) {
      console.warn("Career goal extract fell back to rules:", error);
      return fallback;
    }
  },
});
