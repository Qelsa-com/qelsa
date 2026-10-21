import { v } from "convex/values";
import { internalQuery } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";

async function userForAuthId(ctx: { db: any }, authId: string): Promise<Doc<"users"> | null> {
  return await ctx.db
    .query("users")
    .withIndex("by_authId", (q: any) => q.eq("authId", authId))
    .unique();
}

export const getUserByAuthId = internalQuery({
  args: { authId: v.string() },
  returns: v.any(),
  handler: async (ctx, args) => userForAuthId(ctx, args.authId),
});

export const getCustomerByAuthId = internalQuery({
  args: { authId: v.string() },
  returns: v.any(),
  handler: async (ctx, args) => {
    const user = await userForAuthId(ctx, args.authId);
    if (!user) return null;
    return await ctx.db
      .query("billing_customers")
      .withIndex("by_user", (q) => q.eq("user_id", user._id as Id<"users">))
      .first();
  },
});
