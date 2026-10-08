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
  MAX_INDUSTRIES,
  MAX_ROLE,
  MAX_ROLES,
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
  target_roles: v.array(v.string()),
  dream_companies: v.array(v.string()),
  industries: v.array(v.string()),
  timeline: v.union(timelineValidator, v.null()),
  experience_level: v.union(experienceLevelValidator, v.null()),
  skills: v.array(v.string()),
  primary_focus: v.union(primaryFocusValidator, v.null()),
  source: v.union(v.literal("rules"), v.literal("ai")),
});

const extractedSchema = z.object({
  target_roles: z.array(z.string()).describe("Job roles/titles the user should aim for, e.g. ['Sr. Product Manager', 'AI Product Manager', 'Product Manager']"),
  skills: z.array(z.string()).describe("Skills the user should build or use, e.g. ['Product Strategy', 'Gen AI', 'Product Management']"),
  industries: z.array(z.string()).describe("Industries or domains the user is interested in, e.g. ['Technology', 'Insurtech', 'Fintech', 'SaaS']"),
  timeline: z.enum(["3_months", "6_months", "1_year", "2_plus_years"]).nullable().describe("What is your timeline?"),
  experience_level: z.enum(["entry", "mid", "senior", "lead"]).nullable().describe("Target seniority: entry, mid, senior, or lead"),
  dream_companies: z.array(z.string()).optional(),
  primary_focus: z.enum(["switch_roles", "get_promoted", "switch_industries", "upskill"]).nullable().optional(),
});

function sanitizeExtract(
  raw: {
    target_role?: string | null;
    target_roles?: string[];
    dream_companies?: string[];
    industries?: string[];
    timeline?: string | null;
    experience_level?: string | null;
    skills?: string[];
    primary_focus?: string | null;
  },
  source: "rules" | "ai",
) {
  const roles = uniqueTrimmed(raw.target_roles ?? (raw.target_role ? [raw.target_role] : []), MAX_ROLES, MAX_ROLE);
  const role = roles[0] ? normalizeRole(roles[0]) : normalizeRole(raw.target_role ?? "");
  return {
    target_role: role || null,
    target_roles: roles,
    dream_companies: uniqueTrimmed(raw.dream_companies ?? [], MAX_COMPANIES, MAX_TAG),
    industries: uniqueTrimmed(raw.industries ?? [], MAX_INDUSTRIES, MAX_TAG),
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
        "You are Qelsa Career Goal Reader. From the user's natural language goal description, extract 5 dimensions: 1) target_roles (2-3 realistic titles the user should aim for, e.g. ['Sr. Product Manager', 'AI Product Manager']), 2) skills (skills they should build or learn, e.g. ['Product Strategy', 'Gen AI']), 3) industries (domains they want to work in, e.g. ['Fintech', 'Technology']), 4) timeline ('3_months', '6_months', '1_year', '2_plus_years'), 5) experience_level ('entry', 'mid', 'senior', 'lead'). Do not invent unrelated roles or skills not mentioned or implied.",
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
        target_roles: ai.target_roles.length > 0 ? ai.target_roles : fallback.target_roles,
        dream_companies: ai.dream_companies.length > 0 ? ai.dream_companies : fallback.dream_companies,
        industries: ai.industries.length > 0 ? ai.industries : fallback.industries,
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
