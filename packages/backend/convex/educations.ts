import { v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";
import type { QueryCtx } from "./_generated/server";
import { authedMutation, authedQuery } from "./lib/customFunctions";
import { withId } from "./lib/helpers";
import { titledList, withLocalIds } from "./lib/profileFields";
import { resolveNamedRef, type NamedRefInput } from "./lib/resolve";

async function hydrate(ctx: QueryCtx, row: Doc<"educations">) {
  const degree = row.degree_id ? await ctx.db.get(row.degree_id) : null;
  const field = row.field_of_study_id ? await ctx.db.get(row.field_of_study_id) : null;
  const college = row.college_id ? await ctx.db.get(row.college_id) : null;
  const city = row.city_id ? await ctx.db.get(row.city_id) : null;
  return {
    ...withId(row),
    degree: degree ? withId(degree) : null,
    field_of_study: field ? withId(field) : null,
    college: college ? withId(college) : null,
    city: city ? withId(city) : null,
    projects: withLocalIds(row.projects),
    achievements: withLocalIds(row.achievements),
  };
}

export const list = authedQuery({
  args: {},
  returns: v.any(),
  handler: async (ctx) => {
    const rows = await ctx.db.query("educations").withIndex("by_user", (q) => q.eq("user_id", ctx.user._id)).collect();
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
    const existing = await ctx.db.query("educations").withIndex("by_user", (q) => q.eq("user_id", ctx.user._id)).collect();
    const id = await ctx.db.insert("educations", {
      user_id: ctx.user._id,
      degree_id: await resolveNamedRef(ctx, "degree_names", data.degree as NamedRefInput),
      field_of_study_id: await resolveNamedRef(ctx, "fields_of_study", data.field_of_study as NamedRefInput),
      college_id: await resolveNamedRef(ctx, "colleges", data.college as NamedRefInput),
      city_id: (data.city as { id?: Id<"cities"> } | undefined)?.id,
      start_year: Number(data.start_year),
      end_year: data.end_year ? Number(data.end_year) : undefined,
      grade: data.grade as string | undefined,
      description: data.description as string | undefined,
      position: existing.length,
      projects: titledList(data.projects),
      achievements: titledList(data.achievements),
    });
    return hydrate(ctx, (await ctx.db.get(id))!);
  },
});

export const update = authedMutation({
  args: { id: v.id("educations"), data: v.any() },
  returns: v.any(),
  handler: async (ctx, args) => {
    const row = await ctx.db.get(args.id);
    if (!row || row.user_id !== ctx.user._id) throw new Error("Education not found");
    const data = args.data as Record<string, unknown>;
    await ctx.db.patch(args.id, {
      degree_id: data.degree !== undefined ? await resolveNamedRef(ctx, "degree_names", data.degree as NamedRefInput) : row.degree_id,
      field_of_study_id: data.field_of_study !== undefined ? await resolveNamedRef(ctx, "fields_of_study", data.field_of_study as NamedRefInput) : row.field_of_study_id,
      college_id: data.college !== undefined ? await resolveNamedRef(ctx, "colleges", data.college as NamedRefInput) : row.college_id,
      city_id: (data.city as { id?: Id<"cities"> } | undefined)?.id ?? row.city_id,
      start_year: data.start_year != null ? Number(data.start_year) : row.start_year,
      end_year: data.end_year != null ? Number(data.end_year) : row.end_year,
      grade: (data.grade as string | undefined) ?? row.grade,
      description: (data.description as string | undefined) ?? row.description,
      projects: data.projects !== undefined ? titledList(data.projects) : row.projects,
      achievements: data.achievements !== undefined ? titledList(data.achievements) : row.achievements,
    });
    return hydrate(ctx, (await ctx.db.get(args.id))!);
  },
});

export const remove = authedMutation({
  args: { id: v.id("educations") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const row = await ctx.db.get(args.id);
    if (!row || row.user_id !== ctx.user._id) throw new Error("Education not found");
    await ctx.db.delete(args.id);
    return null;
  },
});

export const bulkEdit = authedMutation({
  args: { items: v.array(v.object({ id: v.id("educations"), position: v.number() })) },
  returns: v.null(),
  handler: async (ctx, args) => {
    for (const item of args.items) {
      const row = await ctx.db.get(item.id);
      if (row && row.user_id === ctx.user._id) await ctx.db.patch(item.id, { position: item.position });
    }
    return null;
  },
});
