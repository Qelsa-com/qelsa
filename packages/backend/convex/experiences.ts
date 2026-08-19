import { v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { authedMutation, authedQuery } from "./lib/customFunctions";
import { iso, withId } from "./lib/helpers";
import { impactMetricList, titledList, withLocalIds } from "./lib/profileFields";

async function replaceExperienceSkills(ctx: MutationCtx, experienceId: Id<"experiences">, skills: unknown) {
  const existing = await ctx.db
    .query("experience_skills")
    .withIndex("by_experience", (q) => q.eq("experience_id", experienceId))
    .collect();
  for (const link of existing) await ctx.db.delete(link._id);
  for (const skill of (skills as Array<{ id?: string } | string> | undefined) ?? []) {
    const skillId = typeof skill === "string" ? skill : skill.id;
    if (skillId) await ctx.db.insert("experience_skills", { experience_id: experienceId, skill_id: skillId as Id<"skills"> });
  }
}

async function hydrate(ctx: QueryCtx, row: Doc<"experiences">) {
  const company = row.company_id ? await ctx.db.get(row.company_id) : null;
  const job_title = row.job_title_id ? await ctx.db.get(row.job_title_id) : null;
  const city = row.city_id ? await ctx.db.get(row.city_id) : null;
  const links = await ctx.db
    .query("experience_skills")
    .withIndex("by_experience", (q) => q.eq("experience_id", row._id))
    .collect();
  const skills = [];
  for (const link of links) {
    const skill = await ctx.db.get(link.skill_id);
    if (skill) skills.push(withId(skill));
  }
  return {
    ...withId(row),
    start_date: iso(row.start_date),
    end_date: iso(row.end_date),
    company: company ? withId(company) : null,
    job_title: job_title ? withId(job_title) : null,
    city: city ? withId(city) : null,
    responsibilities: withLocalIds(row.responsibilities),
    impact_metrics: withLocalIds(row.impact_metrics),
    skills,
  };
}

export const list = authedQuery({
  args: {},
  returns: v.any(),
  handler: async (ctx) => {
    const rows = await ctx.db.query("experiences").withIndex("by_user", (q) => q.eq("user_id", ctx.user._id)).collect();
    const out = [];
    for (const row of rows) out.push(await hydrate(ctx, row));
    return out.sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
  },
});

export const create = authedMutation({
  args: { data: v.any() },
  returns: v.any(),
  handler: async (ctx, args) => {
    const data = args.data as Record<string, unknown>;
    const existing = await ctx.db.query("experiences").withIndex("by_user", (q) => q.eq("user_id", ctx.user._id)).collect();
    const id = await ctx.db.insert("experiences", {
      user_id: ctx.user._id,
      company_id: (data.company as { id?: Id<"companies"> } | undefined)?.id,
      job_title_id: (data.job_title as { id?: Id<"job_titles"> } | undefined)?.id,
      city_id: (data.city as { id?: Id<"cities"> } | undefined)?.id,
      start_date: data.start_date ? new Date(data.start_date as string).getTime() : Date.now(),
      end_date: data.end_date ? new Date(data.end_date as string).getTime() : undefined,
      is_current: Boolean(data.is_current),
      description: data.description as string | undefined,
      team_size: data.team_size as number | undefined,
      position: existing.length,
      responsibilities: titledList(data.responsibilities),
      impact_metrics: impactMetricList(data.impact_metrics),
    });
    await replaceExperienceSkills(ctx, id, data.skills);
    return hydrate(ctx, (await ctx.db.get(id))!);
  },
});

export const update = authedMutation({
  args: { id: v.id("experiences"), data: v.any() },
  returns: v.any(),
  handler: async (ctx, args) => {
    const row = await ctx.db.get(args.id);
    if (!row || row.user_id !== ctx.user._id) throw new Error("Experience not found");
    const data = args.data as Record<string, unknown>;
    await ctx.db.patch(args.id, {
      company_id: (data.company as { id?: Id<"companies"> } | undefined)?.id ?? row.company_id,
      job_title_id: (data.job_title as { id?: Id<"job_titles"> } | undefined)?.id ?? row.job_title_id,
      city_id: (data.city as { id?: Id<"cities"> } | undefined)?.id ?? row.city_id,
      start_date: data.start_date ? new Date(data.start_date as string).getTime() : row.start_date,
      end_date: data.end_date ? new Date(data.end_date as string).getTime() : row.end_date,
      is_current: data.is_current != null ? Boolean(data.is_current) : row.is_current,
      description: (data.description as string | undefined) ?? row.description,
      team_size: (data.team_size as number | undefined) ?? row.team_size,
      responsibilities: data.responsibilities !== undefined ? titledList(data.responsibilities) : row.responsibilities,
      impact_metrics: data.impact_metrics !== undefined ? impactMetricList(data.impact_metrics) : row.impact_metrics,
    });
    if (data.skills !== undefined) await replaceExperienceSkills(ctx, args.id, data.skills);
    return hydrate(ctx, (await ctx.db.get(args.id))!);
  },
});

export const remove = authedMutation({
  args: { id: v.id("experiences") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const row = await ctx.db.get(args.id);
    if (!row || row.user_id !== ctx.user._id) throw new Error("Experience not found");
    const links = await ctx.db
      .query("experience_skills")
      .withIndex("by_experience", (q) => q.eq("experience_id", args.id))
      .collect();
    for (const link of links) await ctx.db.delete(link._id);
    await ctx.db.delete(args.id);
    return null;
  },
});

export const bulkEdit = authedMutation({
  args: { items: v.array(v.object({ id: v.id("experiences"), position: v.number() })) },
  returns: v.null(),
  handler: async (ctx, args) => {
    for (const item of args.items) {
      const row = await ctx.db.get(item.id);
      if (row && row.user_id === ctx.user._id) await ctx.db.patch(item.id, { position: item.position });
    }
    return null;
  },
});
