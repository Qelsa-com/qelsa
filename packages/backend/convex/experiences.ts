import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { authedMutation, authedQuery } from "./lib/customFunctions";
import { iso, withId } from "./lib/helpers";

async function hydrate(ctx: { db: { get: Function; query: Function } }, row: { _id: string } & Record<string, unknown>) {
  const company = row.company_id ? await ctx.db.get(row.company_id) : null;
  const job_title = row.job_title_id ? await ctx.db.get(row.job_title_id) : null;
  const city = row.city_id ? await ctx.db.get(row.city_id) : null;
  const responsibilities = await ctx.db.query("responsibilities").withIndex("by_experience", (q: { eq: Function }) => q.eq("experience_id", row._id)).collect();
  const impact_metrics = await ctx.db.query("impact_metrics").withIndex("by_experience", (q: { eq: Function }) => q.eq("experience_id", row._id)).collect();
  const links = await ctx.db.query("experience_skills").withIndex("by_experience", (q: { eq: Function }) => q.eq("experience_id", row._id)).collect();
  const skills = [];
  for (const link of links) {
    const skill = await ctx.db.get(link.skill_id);
    if (skill) skills.push(withId(skill));
  }
  return {
    ...withId(row),
    start_date: iso(row.start_date as number),
    end_date: iso(row.end_date as number | undefined),
    company: company ? withId(company) : null,
    job_title: job_title ? withId(job_title) : null,
    city: city ? withId(city) : null,
    responsibilities: responsibilities.map(withId),
    impact_metrics: impact_metrics.map(withId),
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
    });
    for (const r of (data.responsibilities as Array<{ title: string }> | undefined) ?? []) {
      await ctx.db.insert("responsibilities", { user_id: ctx.user._id, experience_id: id, title: r.title });
    }
    for (const skill of (data.skills as Array<{ id?: string } | string> | undefined) ?? []) {
      const skillId = typeof skill === "string" ? skill : skill.id;
      if (skillId) await ctx.db.insert("experience_skills", { experience_id: id, skill_id: skillId as Id<"skills"> });
    }
    for (const m of (data.impact_metrics as Array<{ impact_type: string; impact_value: string; description?: string }> | undefined) ?? []) {
      await ctx.db.insert("impact_metrics", {
        user_id: ctx.user._id,
        experience_id: id,
        impact_type: m.impact_type,
        impact_value: m.impact_value,
        description: m.description,
      });
    }
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
    });
    return hydrate(ctx, (await ctx.db.get(args.id))!);
  },
});

export const remove = authedMutation({
  args: { id: v.id("experiences") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const row = await ctx.db.get(args.id);
    if (!row || row.user_id !== ctx.user._id) throw new Error("Experience not found");
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
