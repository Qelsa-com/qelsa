import { v } from "convex/values";
import { authedMutation, authedQuery } from "./lib/customFunctions";
import { withId } from "./lib/helpers";

async function hydratePage(ctx: { db: { get: Function } }, page: Record<string, unknown> & { _id: string; size_id?: string; ownerId: string }) {
  const size = page.size_id ? await ctx.db.get(page.size_id) : null;
  const owner = await ctx.db.get(page.ownerId);
  return {
    ...withId(page),
    company_size: size ? withId(size) : null,
    owner: owner ? { id: owner._id, name: owner.name, email: owner.email } : null,
  };
}

export const list = authedQuery({
  args: {
    name: v.optional(v.string()),
    industry: v.optional(v.string()),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    let pages = args.name
      ? await ctx.db
          .query("pages")
          .withSearchIndex("search_name", (q) => q.search("name", args.name!))
          .take(50)
      : await ctx.db.query("pages").order("desc").take(50);
    if (args.industry) pages = pages.filter((p) => p.industry === args.industry);
    const rows = [];
    for (const page of pages) {
      const hydrated = await hydratePage(ctx, page);
      rows.push({ ...hydrated, can_manage: page.ownerId === ctx.user._id });
    }
    return rows;
  },
});

export const listMine = authedQuery({
  args: { search: v.optional(v.string()) },
  returns: v.any(),
  handler: async (ctx, args) => {
    let pages = await ctx.db
      .query("pages")
      .withIndex("by_owner", (q) => q.eq("ownerId", ctx.user._id))
      .collect();
    if (args.search) {
      const q = args.search.toLowerCase();
      pages = pages.filter((p) => p.name.toLowerCase().includes(q));
    }
    const rows = [];
    for (const page of pages) {
      const jobs = await ctx.db
        .query("jobs")
        .withIndex("by_page", (q) => q.eq("page_id", page._id))
        .collect();
      const hydrated = await hydratePage(ctx, page);
      rows.push({ ...hydrated, jobs: jobs.map(withId) });
    }
    return rows;
  },
});

export const listDiscover = authedQuery({
  args: {},
  returns: v.any(),
  handler: async (ctx) => {
    const pages = await ctx.db.query("pages").order("desc").take(50);
    const rows = [];
    for (const page of pages) {
      if (page.ownerId === ctx.user._id) continue;
      rows.push(await hydratePage(ctx, page));
    }
    return rows;
  },
});

export const getById = authedQuery({
  args: { id: v.id("pages") },
  returns: v.any(),
  handler: async (ctx, args) => {
    const page = await ctx.db.get(args.id);
    if (!page) return null;
    const jobs = await ctx.db
      .query("jobs")
      .withIndex("by_page", (q) => q.eq("page_id", page._id))
      .collect();
    const hydrated = await hydratePage(ctx, page);
    return { ...hydrated, jobs: jobs.map(withId), can_manage: page.ownerId === ctx.user._id };
  },
});

export const create = authedMutation({
  args: { data: v.any() },
  returns: v.any(),
  handler: async (ctx, args) => {
    const data = args.data as Record<string, unknown>;
    if (!data.name || typeof data.name !== "string") throw new Error("Name is required");
    const id = await ctx.db.insert("pages", {
      name: data.name,
      type: data.type as "company" | "community" | "personal" | undefined,
      industry: data.industry as string | undefined,
      website: data.website as string | undefined,
      tagline: data.tagline as string | undefined,
      description: data.description as string | undefined,
      detailed_description: data.detailed_description as string | undefined,
      logo: data.logo as string | undefined,
      hero_image: data.hero_image as string | undefined,
      size_id: data.size_id as never,
      headquarters: data.headquarters as string | undefined,
      founded_year: data.founded_year as number | undefined,
      contact_email: data.contact_email as string | undefined,
      contact_phone: data.contact_phone as string | undefined,
      linkedin_url: data.linkedin_url as string | undefined,
      twitter_url: data.twitter_url as string | undefined,
      facebook_url: data.facebook_url as string | undefined,
      instagram_url: data.instagram_url as string | undefined,
      youtube_url: data.youtube_url as string | undefined,
      ownerId: ctx.user._id,
    });
    const page = await ctx.db.get(id);
    return { success: true, data: withId(page!) };
  },
});

export const update = authedMutation({
  args: { id: v.id("pages"), data: v.any() },
  returns: v.any(),
  handler: async (ctx, args) => {
    const page = await ctx.db.get(args.id);
    if (!page) throw new Error("Page not found");
    if (page.ownerId !== ctx.user._id) throw new Error("Not authorized to edit this page");
    const data = { ...(args.data as Record<string, unknown>) };
    delete data.id;
    delete data._id;
    delete data.ownerId;
    await ctx.db.patch(args.id, data);
    const updated = await ctx.db.get(args.id);
    return withId(updated!);
  },
});
