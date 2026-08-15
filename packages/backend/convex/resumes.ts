import { v } from "convex/values";
import { authedMutation, authedQuery } from "./lib/customFunctions";
import { iso, withId } from "./lib/helpers";

export const listMine = authedQuery({
  args: {},
  returns: v.any(),
  handler: async (ctx) => {
    const resumes = await ctx.db
      .query("resumes")
      .withIndex("by_user", (q) => q.eq("user_id", ctx.user._id))
      .order("desc")
      .collect();
    return resumes.map((r) => ({
      ...withId(r),
      createdAt: iso(r._creationTime),
      updatedAt: iso(r._creationTime),
    }));
  },
});

export const create = authedMutation({
  args: {
    title: v.string(),
    storageId: v.id("_storage"),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    const file_url = await ctx.storage.getUrl(args.storageId);
    const id = await ctx.db.insert("resumes", {
      user_id: ctx.user._id,
      title: args.title,
      storage_id: args.storageId,
      file_url: file_url ?? undefined,
    });
    const resume = await ctx.db.get(id);
    return { resume: withId(resume!) };
  },
});

export const remove = authedMutation({
  args: { id: v.id("resumes") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const resume = await ctx.db.get(args.id);
    if (!resume || resume.user_id !== ctx.user._id) throw new Error("Resume not found");
    if (resume.storage_id) await ctx.storage.delete(resume.storage_id);
    await ctx.db.delete(args.id);
    return null;
  },
});
