import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { authedMutation, authedQuery } from "./lib/customFunctions";
import { withId } from "./lib/helpers";
import { findSkillByMatchKey, insertSkill } from "./lib/skillCatalog";
import { refreshInferredSkillLevels } from "./lib/skillLevels";
import { MAX_USER_SKILLS } from "./lib/skillLimits";

async function hydrate(ctx: { db: { get: Function } }, row: { _id: string } & Record<string, unknown>) {
  const skill = row.skill_id ? await ctx.db.get(row.skill_id) : null;
  const category = row.category_id ? await ctx.db.get(row.category_id) : skill?.category_id ? await ctx.db.get(skill.category_id) : null;
  return { ...withId(row), skill: skill ? withId(skill) : null, category: category ? withId(category) : null };
}

export const list = authedQuery({
  args: {},
  returns: v.any(),
  handler: async (ctx) => {
    const rows = await ctx.db
      .query("user_skills")
      .withIndex("by_user", (q) => q.eq("user_id", ctx.user._id))
      .collect();
    const out = [];
    for (const row of rows) out.push(await hydrate(ctx, row));
    return out;
  },
});

export const create = authedMutation({
  args: { data: v.any() },
  returns: v.any(),
  handler: async (ctx, args) => {
    const data = args.data as Record<string, unknown>;
    const skillId = (data.skill as { id?: Id<"skills"> } | undefined)?.id ?? (data.skill_id as Id<"skills"> | undefined);
    if (!skillId) throw new Error("Skill is required");
    const existing = await ctx.db
      .query("user_skills")
      .withIndex("by_user", (q) => q.eq("user_id", ctx.user._id))
      .collect();
    if (existing.length >= MAX_USER_SKILLS) {
      throw new Error(`You can add up to ${MAX_USER_SKILLS} skills`);
    }
    const id = await ctx.db.insert("user_skills", {
      user_id: ctx.user._id,
      skill_id: skillId,
      category_id: (data.category as { id?: Id<"skill_categories"> } | undefined)?.id,
      proficiency: data.proficiency as "beginner" | "intermediate" | "advance" | "expert" | undefined,
      is_top_skill: Boolean(data.is_top_skill),
    });
    if (!data.proficiency) await refreshInferredSkillLevels(ctx, ctx.user._id);
    return hydrate(ctx, (await ctx.db.get(id))!);
  },
});

export const update = authedMutation({
  args: { id: v.id("user_skills"), data: v.any() },
  returns: v.any(),
  handler: async (ctx, args) => {
    const row = await ctx.db.get(args.id);
    if (!row || row.user_id !== ctx.user._id) throw new Error("Skill not found");
    const data = args.data as Record<string, unknown>;
    const proficiency = (data.proficiency as typeof row.proficiency | undefined) ?? row.proficiency;
    await ctx.db.patch(args.id, {
      proficiency,
      proficiency_inferred: proficiency === row.proficiency ? row.proficiency_inferred : false,
      is_top_skill: data.is_top_skill != null ? Boolean(data.is_top_skill) : row.is_top_skill,
    });
    return hydrate(ctx, (await ctx.db.get(args.id))!);
  },
});

export const remove = authedMutation({
  args: { id: v.id("user_skills") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const row = await ctx.db.get(args.id);
    if (!row || row.user_id !== ctx.user._id) throw new Error("Skill not found");
    await ctx.db.delete(args.id);
    return null;
  },
});

/** Get-or-create a catalog skill by exact name, for "Add as new skill" flows. */
export const resolveSkill = authedMutation({
  args: { name: v.string() },
  returns: v.any(),
  handler: async (ctx, args) => {
    const name = args.name.trim();
    if (!name) throw new Error("Skill name is required");
    const existing =
      (await ctx.db
        .query("skills")
        .withIndex("by_name", (q) => q.eq("name", name))
        .first()) ?? (await findSkillByMatchKey(ctx, name));
    if (existing) return withId(existing);
    const id = await insertSkill(ctx, { name });
    return withId((await ctx.db.get(id))!);
  },
});

export const bulkModify = authedMutation({
  args: { skills: v.array(v.any()) },
  returns: v.any(),
  handler: async (ctx, args) => {
    const incoming = args.skills as Array<Record<string, unknown>>;
    if (incoming.length > MAX_USER_SKILLS) {
      throw new Error(`You can add up to ${MAX_USER_SKILLS} skills`);
    }
    const existing = await ctx.db
      .query("user_skills")
      .withIndex("by_user", (q) => q.eq("user_id", ctx.user._id))
      .collect();
    const keep = new Set(incoming.map((s) => s.id).filter(Boolean));
    for (const row of existing) {
      if (!keep.has(row._id)) await ctx.db.delete(row._id);
    }
    const created = [];
    const updated = [];
    for (const skill of incoming) {
      const skillId = (skill.skill as { id?: Id<"skills"> } | undefined)?.id ?? (skill.skill_id as Id<"skills"> | undefined);
      if (skill.id) {
        const row = await ctx.db.get(skill.id as Id<"user_skills">);
        if (row && row.user_id === ctx.user._id) {
          const proficiency = (skill.proficiency as typeof row.proficiency | undefined) || undefined;
          await ctx.db.patch(row._id, {
            proficiency,
            // Editors send every row back; an unchanged level keeps its estimate flag.
            proficiency_inferred: proficiency === row.proficiency ? row.proficiency_inferred : false,
            is_top_skill: Boolean(skill.is_top_skill),
          });
          updated.push(row._id);
        }
      } else if (skillId) {
        const id = await ctx.db.insert("user_skills", {
          user_id: ctx.user._id,
          skill_id: skillId,
          proficiency: skill.proficiency as "beginner" | "intermediate" | "advance" | "expert" | undefined,
          is_top_skill: Boolean(skill.is_top_skill),
        });
        created.push(id);
      }
    }
    await refreshInferredSkillLevels(ctx, ctx.user._id);
    return { created, updated, deleted: [] };
  },
});
