import { v } from "convex/values";
import { internalQuery } from "./_generated/server";
import { authedMutation, authedQuery } from "./lib/customFunctions";
import {
  careerGoalPublicValidator,
  experienceLevelValidator,
  MAX_COMPANIES,
  MAX_INDUSTRIES,
  MAX_ROLES,
  MAX_SKILLS,
  MAX_TAG,
  MAX_ROLE,
  normalizeDescription,
  normalizeExperienceLevel,
  normalizeFocus,
  normalizeRole,
  normalizeTimeline,
  primaryFocusValidator,
  timelineValidator,
  toCareerGoalPublic,
  uniqueTrimmed,
} from "./lib/careerGoal";

export const getMine = authedQuery({
  args: {},
  returns: v.union(careerGoalPublicValidator, v.null()),
  handler: async (ctx) => {
    const row = await ctx.db
      .query("career_goals")
      .withIndex("by_user", (q) => q.eq("user_id", ctx.user._id))
      .unique();
    return row ? toCareerGoalPublic(row) : null;
  },
});

export const upsert = authedMutation({
  args: {
    description: v.optional(v.string()),
    target_role: v.optional(v.string()),
    target_roles: v.optional(v.array(v.string())),
    dream_companies: v.optional(v.array(v.string())),
    industries: v.optional(v.array(v.string())),
    timeline: v.optional(timelineValidator),
    experience_level: v.optional(experienceLevelValidator),
    skills: v.optional(v.array(v.string())),
    primary_focus: v.optional(primaryFocusValidator),
  },
  returns: careerGoalPublicValidator,
  handler: async (ctx, args) => {
    const roles = uniqueTrimmed(args.target_roles ?? (args.target_role ? [args.target_role] : []), MAX_ROLES, MAX_ROLE);
    const target_role = roles[0] ? normalizeRole(roles[0]) : normalizeRole(args.target_role ?? "");
    if (!target_role) throw new Error("What role are you aiming for is required");

    const description = normalizeDescription(args.description);
    const timeline = normalizeTimeline(args.timeline);
    const experience_level = normalizeExperienceLevel(args.experience_level);
    const primary_focus = normalizeFocus(args.primary_focus);
    const fields = {
      user_id: ctx.user._id,
      target_role,
      target_roles: roles,
      dream_companies: uniqueTrimmed(args.dream_companies ?? [], MAX_COMPANIES, MAX_TAG),
      industries: uniqueTrimmed(args.industries ?? [], MAX_INDUSTRIES, MAX_TAG),
      skills: uniqueTrimmed(args.skills ?? [], MAX_SKILLS, MAX_TAG),
      updated_at: Date.now(),
      ...(description ? { description } : {}),
      ...(timeline ? { timeline } : {}),
      ...(experience_level ? { experience_level } : {}),
      ...(primary_focus ? { primary_focus } : {}),
    };

    const existing = await ctx.db
      .query("career_goals")
      .withIndex("by_user", (q) => q.eq("user_id", ctx.user._id))
      .unique();

    if (existing) {
      await ctx.db.replace(existing._id, fields);
      const next = await ctx.db.get(existing._id);
      if (!next) throw new Error("Could not update your career goal");
      return toCareerGoalPublic(next);
    }

    const id = await ctx.db.insert("career_goals", fields);
    const created = await ctx.db.get(id);
    if (!created) throw new Error("Could not save your career goal");
    return toCareerGoalPublic(created);
  },
});

export const loadProfileForGoalGeneration = internalQuery({
  args: { authId: v.string() },
  returns: v.object({
    headline: v.optional(v.string()),
    current_titles: v.array(v.string()),
    existing_skills: v.array(v.string()),
  }),
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_authId", (q) => q.eq("authId", args.authId))
      .unique();
    if (!user) {
      return { current_titles: [], existing_skills: [] };
    }

    const [skillRows, experienceRows] = await Promise.all([
      ctx.db.query("user_skills").withIndex("by_user", (q) => q.eq("user_id", user._id)).take(50),
      ctx.db.query("experiences").withIndex("by_user", (q) => q.eq("user_id", user._id)).take(10),
    ]);

    const existing_skills: string[] = [];
    for (const row of skillRows) {
      const skill = await ctx.db.get(row.skill_id);
      if (skill?.name) existing_skills.push(skill.name);
    }

    const current_titles: string[] = [];
    if (user.headline) current_titles.push(user.headline);
    for (const row of experienceRows) {
      if (row.job_title_id) {
        const titleDoc = await ctx.db.get(row.job_title_id);
        if (titleDoc?.name) current_titles.push(titleDoc.name);
      }
    }

    return {
      ...(user.headline ? { headline: user.headline } : {}),
      current_titles,
      existing_skills,
    };
  },
});

