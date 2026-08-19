import { R2 } from "@convex-dev/r2";
import { v } from "convex/values";
import { components } from "./_generated/api";
import { authedMutation, authedQuery } from "./lib/customFunctions";
import { iso, withId } from "./lib/helpers";
import { deleteR2Keys, signedFileUrl } from "./lib/r2";

const r2 = new R2(components.r2);

export const listMine = authedQuery({
  args: {},
  returns: v.any(),
  handler: async (ctx) => {
    const resumes = await ctx.db
      .query("resumes")
      .withIndex("by_user", (q) => q.eq("user_id", ctx.user._id))
      .order("desc")
      .collect();
    return await Promise.all(
      resumes.map(async (r) => ({
        ...withId(r),
        file_url: (await signedFileUrl(r2, r.storage_id)) ?? r.file_url,
        createdAt: iso(r._creationTime),
        updatedAt: iso(r._creationTime),
      })),
    );
  },
});

export const create = authedMutation({
  args: {
    title: v.string(),
    storageId: v.string(),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    const file_url = await signedFileUrl(r2, args.storageId);
    const id = await ctx.db.insert("resumes", {
      user_id: ctx.user._id,
      title: args.title,
      storage_id: args.storageId,
      file_url,
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
    await deleteR2Keys(r2, ctx, [resume.storage_id]);
    await ctx.db.delete(args.id);
    return null;
  },
});
