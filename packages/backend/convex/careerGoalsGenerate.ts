"use node";

import { Agent } from "@convex-dev/agent";
import { v } from "convex/values";
import { z } from "zod/v3";
import { components, internal } from "./_generated/api";
import { action } from "./_generated/server";
import { AI_AGENT_MODEL, openRouter } from "./lib/ai";
import {
  experienceLevelValidator,
  filterRolesAgainstProfile,
  filterSkillsAgainstProfile,
  inferSkillsForRole,
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

    let profileContext: { headline?: string; current_titles: string[]; existing_skills: string[] } = {
      current_titles: [],
      existing_skills: [],
    };
    try {
      profileContext = await ctx.runQuery(internal.careerGoals.loadProfileForGoalGeneration, {
        authId: identity.subject,
      });
    } catch (err) {
      console.warn("Could not load user profile for goal generation:", err);
    }

    const fallback = sanitizeExtract(
      parseCareerGoalText(description, {
        currentTitles: profileContext.current_titles,
        existingSkills: profileContext.existing_skills,
      }),
      "rules",
    );
    if (!description || !openRouter) return fallback;

    const currentTitlesList = [profileContext.headline, ...profileContext.current_titles].filter(Boolean);
    const userContextSnippet = [
      currentTitlesList.length ? `Current Role/Headline: ${currentTitlesList.join(", ")}` : null,
      profileContext.existing_skills.length
        ? `Existing Profile Skills (DO NOT RECOMMEND THESE): ${profileContext.existing_skills.slice(0, 30).join(", ")}`
        : null,
    ]
      .filter(Boolean)
      .join("\n");

    const agent = new Agent(components.agent, {
      name: "Career Goal Reader",
      languageModel: openRouter.chat(AI_AGENT_MODEL),
      instructions:
        "You are Qelsa Career Goal Reader & Strategic Career Guide across ALL professions, domains, and verticals (Engineering, Healthcare, Finance, Marketing, Law, Design, Science, Education, Operations, Sales, etc.).\n" +
        "From the user's natural language goal description, deeply understand their chosen profession and career aspiration, and generate 5 structured dimensions:\n" +
        "1) target_roles: 2-3 realistic, next-level job titles in their specific profession/vertical that the user should aim for (e.g. for marketing: 'Director of Growth Marketing', 'VP of Marketing'; for healthcare: 'Nurse Practitioner', 'Clinical Nurse Specialist'; for engineering: 'Staff Engineer', 'Engineering Manager'). CRITICAL: Do NOT suggest titles the user currently holds or lower seniority levels. Always suggest upward or aspirational titles in their domain.\n" +
        "2) skills: 5-8 essential domain-specific and leadership skills the user should build or master to achieve and succeed in this target role. CRITICAL: If existing profile skills are provided, DO NOT recommend skills the user already has. Suggest the true growth, specialization, or leadership gap skills needed to step up to the target role in their vertical.\n" +
        "3) industries: 2-4 relevant industries or sectors matching this goal (e.g. 'Biotechnology', 'Healthcare', 'Fintech', 'Fashion & Luxury', 'Renewable Energy', 'Media & Entertainment', 'SaaS', etc.).\n" +
        "4) timeline: realistic timeline to achieve this goal ('3_months', '6_months', '1_year', '2_plus_years'). Recommend '1_year' or '2_plus_years' for senior/lead/director roles, '6_months' for mid/entry roles.\n" +
        "5) experience_level: target seniority ('entry', 'mid', 'senior', 'lead').",
      maxSteps: 1,
    });

    try {
      const prompt = userContextSnippet
        ? `User's Current Profile Context:\n${userContextSnippet}\n\nUser Goal Description:\n"${description}"\n\nAnalyze their goal, taking into account their current level and existing skills. Suggest next-level target roles (excluding their current title) and recommend 4-6 growth/gap skills to build (filtering out their existing skills).`
        : `Analyze this user's career goal description and generate their goal profile with target roles, recommended skills to build, target industries, timeline, and level:\n\n"${description}"`;

      const result = await agent.generateObject(
        ctx,
        { userId: identity.subject },
        {
          schema: extractedSchema,
          prompt,
        },
      );
      const ai = sanitizeExtract(result.object, "ai");
      let targetRoles = ai.target_roles.length > 0 ? ai.target_roles : fallback.target_roles;
      if (profileContext.current_titles.length > 0) {
        targetRoles = filterRolesAgainstProfile(targetRoles, profileContext.current_titles, targetRoles[0]);
      }

      let skills = ai.skills.length > 0 ? ai.skills : fallback.skills;
      if (skills.length === 0 && targetRoles.length > 0) {
        skills = uniqueTrimmed(inferSkillsForRole(targetRoles[0]), MAX_SKILLS, MAX_TAG);
      }
      if (profileContext.existing_skills.length > 0) {
        skills = filterSkillsAgainstProfile(skills, profileContext.existing_skills, targetRoles[0]);
      }

      return {
        target_role: targetRoles[0] ?? ai.target_role ?? fallback.target_role,
        target_roles: targetRoles,
        dream_companies: ai.dream_companies.length > 0 ? ai.dream_companies : fallback.dream_companies,
        industries: ai.industries.length > 0 ? ai.industries : fallback.industries,
        timeline: ai.timeline ?? fallback.timeline,
        experience_level: ai.experience_level ?? fallback.experience_level,
        skills,
        primary_focus: ai.primary_focus ?? fallback.primary_focus,
        source: "ai" as const,
      };
    } catch (error) {
      console.warn("Career goal extract fell back to rules:", error);
      return fallback;
    }
  },
});
