import { v } from "convex/values";
import { authedMutation, authedQuery } from "./lib/customFunctions";
import {
  careerGoalPublicValidator,
  experienceLevelValidator,
  MAX_COMPANIES,
  MAX_SKILLS,
  MAX_TAG,
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
    target_role: v.string(),
    dream_companies: v.optional(v.array(v.string())),
    timeline: v.optional(timelineValidator),
    experience_level: v.optional(experienceLevelValidator),
    skills: v.optional(v.array(v.string())),
    primary_focus: v.optional(primaryFocusValidator),
  },
  returns: careerGoalPublicValidator,
  handler: async (ctx, args) => {
    const target_role = normalizeRole(args.target_role);
    if (!target_role) throw new Error("What role are you aiming for is required");

    const description = normalizeDescription(args.description);
    const timeline = normalizeTimeline(args.timeline);
    const experience_level = normalizeExperienceLevel(args.experience_level);
    const primary_focus = normalizeFocus(args.primary_focus);
    const fields = {
      user_id: ctx.user._id,
      target_role,
      dream_companies: uniqueTrimmed(args.dream_companies ?? [], MAX_COMPANIES, MAX_TAG),
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
