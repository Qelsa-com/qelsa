import { v } from "convex/values";
import { query } from "./_generated/server";

/** Public feature switches used by the web app. Missing rows default to off. */
export const getPublic = query({
  args: {},
  returns: v.object({
    smart_matches: v.boolean(),
  }),
  handler: async (ctx) => {
    const row = await ctx.db
      .query("feature_flags")
      .withIndex("by_key", (q) => q.eq("key", "smart_matches"))
      .unique();
    return { smart_matches: row?.enabled === true };
  },
});
