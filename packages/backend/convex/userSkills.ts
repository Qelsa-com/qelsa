import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { authedMutation, authedQuery } from "./lib/customFunctions";
import { withId } from "./lib/helpers";

async function hydrate(ctx: { db: { get: Function } }, row: { _id: string } & Record<string, unknown>) {
  const skill = row.skill_id ? await ctx.db.get(row.skill_id) : null;
  const category = row.category_id ? await ctx.db.get(row.category_id) : (skill?.category_id ? await ctx.db.get(skill.category_id) : null);
  return { ...withId(row), skill: skill ? withId(skill) : null, category: category ? withId(category) : null };
}

export const list = authedQuery({
  args: {},
  returns: v.any(),
  handler: async (ctx) => {
    const rows = await ctx.db.query("user_skills").withIndex("by_user", (q) => q.eq("user_id", ctx.user._id)).collect();
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
    const id = await ctx.db.insert("user_skills", {
      user_id: ctx.user._id,
      skill_id: skillId,
      category_id: (data.category as { id?: Id<"skill_categories"> } | undefined)?.id,
      proficiency: data.proficiency as "beginner" | "intermediate" | "advance" | "expert" | undefined,
      is_top_skill: Boolean(data.is_top_skill),
    });
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
    await ctx.db.patch(args.id, {
      proficiency: (data.proficiency as typeof row.proficiency | undefined) ?? row.proficiency,
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

export const bulkModify = authedMutation({
  args: { skills: v.array(v.any()) },
  returns: v.any(),
  handler: async (ctx, args) => {
    const incoming = args.skills as Array<Record<string, unknown>>;
    const existing = await ctx.db.query("user_skills").withIndex("by_user", (q) => q.eq("user_id", ctx.user._id)).collect();
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
          await ctx.db.patch(row._id, {
            proficiency: skill.proficiency as typeof row.proficiency | undefined,
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
    return { created, updated, deleted: [] };
  },
});
