import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { withId } from "./lib/helpers";
import * as catalog from "./seedCatalogData";
import cityData from "./seed/cities.json";

function cityList(): Array<{ name: string; state: string }> {
  const value = cityData as unknown;
  if (Array.isArray(value)) return value as Array<{ name: string; state: string }>;
  if (value && typeof value === "object") {
    const nested = "default" in value ? (value as { default: unknown }).default : value;
    if (Array.isArray(nested)) return nested as Array<{ name: string; state: string }>;
    const rows = Object.values(nested as Record<string, unknown>).filter(
      (row): row is { name: string; state: string } =>
        Boolean(row) && typeof row === "object" && "name" in row && "state" in row,
    );
    return rows;
  }
  return [];
}

export const seedAll = mutation({
  args: {},
  returns: v.object({ ok: v.boolean() }),
  handler: async (ctx) => {
    const existing = await ctx.db.query("degree_levels").first();
    if (!existing) {
      const levelIds = new Map<string, string>();
      for (const level of catalog.degreeLevels) {
        const id = await ctx.db.insert("degree_levels", level);
        levelIds.set(level.name, id);
      }
      for (const degree of catalog.degreeNames) {
        const level_id = levelIds.get(degree.level);
        if (level_id) {
          await ctx.db.insert("degree_names", {
            level_id: level_id as never,
            name: degree.name,
            abbreviation: degree.abbreviation,
          });
        }
      }
      for (const field of catalog.fieldsOfStudy) {
        await ctx.db.insert("fields_of_study", field);
      }
      for (const size of catalog.companySizes) {
        await ctx.db.insert("company_sizes", size);
      }
      const categoryIds: string[] = [];
      for (const category of catalog.skillCategories) {
        categoryIds.push(await ctx.db.insert("skill_categories", category));
      }
      let i = 0;
      for (const name of catalog.skills) {
        await ctx.db.insert("skills", {
          name,
          category_id: categoryIds[i % categoryIds.length] as never,
          is_quick_add: true,
          sort_order: i++,
        });
      }
      i = 0;
      for (const name of catalog.jobTitles) {
        await ctx.db.insert("job_titles", { name, is_popular: true, sort_order: i++ });
      }
      for (const name of catalog.companies) {
        await ctx.db.insert("companies", { name, is_popular: true });
      }
      for (const name of catalog.colleges) {
        await ctx.db.insert("colleges", { name });
      }
    }

    const existingCity = await ctx.db.query("cities").first();
    if (!existingCity) {
      const stateIds = new Map<string, string>();
      for (const city of cityList()) {
        if (!stateIds.has(city.state)) {
          stateIds.set(city.state, await ctx.db.insert("states", { name: city.state }));
        }
        await ctx.db.insert("cities", {
          name: city.name,
          state_id: stateIds.get(city.state)! as never,
        });
      }
    }

    return { ok: true };
  },
});

function searchName<T extends { name: string }>(rows: T[], search?: string) {
  if (!search) return rows;
  const q = search.toLowerCase();
  return rows.filter((r) => r.name.toLowerCase().includes(q));
}

export const degreeNames = query({
  args: { search: v.optional(v.string()) },
  returns: v.any(),
  handler: async (ctx, args) => {
    const rows = await ctx.db.query("degree_names").collect();
    const out = [];
    for (const row of searchName(rows, args.search)) {
      const level = await ctx.db.get(row.level_id);
      out.push({ ...withId(row), degree_level: level ? withId(level) : null });
    }
    return out;
  },
});

export const fieldsOfStudy = query({
  args: { search: v.optional(v.string()) },
  returns: v.any(),
  handler: async (ctx, args) => searchName(await ctx.db.query("fields_of_study").collect(), args.search).map(withId),
});

export const skills = query({
  args: { search: v.optional(v.string()) },
  returns: v.any(),
  handler: async (ctx, args) => {
    const rows = args.search
      ? await ctx.db
          .query("skills")
          .withSearchIndex("search_name", (q) => q.search("name", args.search!))
          .take(30)
      : await ctx.db.query("skills").take(50);
    const out = [];
    for (const row of rows) {
      const category = row.category_id ? await ctx.db.get(row.category_id) : null;
      out.push({ ...withId(row), category: category ? withId(category) : null });
    }
    return out;
  },
});

export const skillCategories = query({
  args: {},
  returns: v.any(),
  handler: async (ctx) => (await ctx.db.query("skill_categories").collect()).map(withId),
});

export const colleges = query({
  args: { search: v.string() },
  returns: v.any(),
  handler: async (ctx, args) => {
    const rows = args.search
      ? await ctx.db.query("colleges").withSearchIndex("search_name", (q) => q.search("name", args.search)).take(20)
      : await ctx.db.query("colleges").take(20);
    return rows.map(withId);
  },
});

export const certifications = query({
  args: { search: v.optional(v.string()), limit: v.optional(v.number()) },
  returns: v.any(),
  handler: async (ctx, args) => {
    const rows = args.search
      ? await ctx.db.query("certifications").withSearchIndex("search_name", (q) => q.search("name", args.search!)).take(args.limit ?? 20)
      : await ctx.db.query("certifications").take(args.limit ?? 20);
    return rows.map(withId);
  },
});

export const issuingBodies = query({
  args: { search: v.optional(v.string()), limit: v.optional(v.number()) },
  returns: v.any(),
  handler: async (ctx, args) => {
    const rows = args.search
      ? await ctx.db.query("issuing_bodies").withSearchIndex("search_name", (q) => q.search("name", args.search!)).take(args.limit ?? 20)
      : await ctx.db.query("issuing_bodies").take(args.limit ?? 20);
    return rows.map(withId);
  },
});

export const companySizes = query({
  args: { search: v.optional(v.string()) },
  returns: v.any(),
  handler: async (ctx, args) => {
    const rows = await ctx.db.query("company_sizes").collect();
    if (!args.search) return rows.map(withId);
    const q = args.search.toLowerCase();
    return rows.filter((r) => r.label.toLowerCase().includes(q)).map(withId);
  },
});

export const states = query({
  args: { search: v.optional(v.string()) },
  returns: v.any(),
  handler: async (ctx, args) => searchName(await ctx.db.query("states").collect(), args.search).map(withId),
});

export const cities = query({
  args: { search: v.string() },
  returns: v.any(),
  handler: async (ctx, args) => {
    const rows = await ctx.db
      .query("cities")
      .withSearchIndex("search_name", (q) => q.search("name", args.search))
      .take(20);
    const out = [];
    for (const row of rows) {
      const state = await ctx.db.get(row.state_id);
      out.push({ ...withId(row), state: state ? withId(state) : null });
    }
    return out;
  },
});

export const companies = query({
  args: { search: v.string() },
  returns: v.any(),
  handler: async (ctx, args) => {
    const rows = await ctx.db
      .query("companies")
      .withSearchIndex("search_name", (q) => q.search("name", args.search))
      .take(20);
    return rows.map(withId);
  },
});

export const jobTitles = query({
  args: { search: v.string() },
  returns: v.any(),
  handler: async (ctx, args) => {
    const rows = await ctx.db
      .query("job_titles")
      .withSearchIndex("search_name", (q) => q.search("name", args.search))
      .take(20);
    return rows.map(withId);
  },
});
