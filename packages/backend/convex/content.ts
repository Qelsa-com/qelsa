import { v } from "convex/values";
import { query } from "./_generated/server";
import {
  DEFAULT_HOME_JOBS_STAT,
  DEFAULT_LEGAL_CONTENT,
  LEGAL_DEFAULT_UPDATED_AT,
} from "./lib/siteContent";

const legalKey = v.union(v.literal("terms"), v.literal("privacy"), v.literal("cookies"));
const contentKey = v.union(legalKey, v.literal("home_jobs_stat"));

/**
 * Public, cacheable site copy. Returns the saved row when an admin has edited a
 * page, otherwise the checked-in default. Used by Next.js `getServerSideProps`
 * so the legal pages and the home stat are present in the initial HTML.
 */
export const getPublic = query({
  args: { key: contentKey },
  returns: v.any(),
  handler: async (ctx, args) => {
    const row = await ctx.db
      .query("site_content")
      .withIndex("by_key", (q) => q.eq("key", args.key))
      .unique();

    if (args.key === "home_jobs_stat") {
      return {
        key: args.key,
        value: row?.body ?? DEFAULT_HOME_JOBS_STAT,
        updatedAt: row?.updated_at ?? 0,
      };
    }

    const fallback = DEFAULT_LEGAL_CONTENT[args.key];
    return {
      key: args.key,
      title: row?.title ?? fallback.title,
      body: row?.body ?? fallback.body,
      contactHeading: row?.contact_heading ?? fallback.contactHeading,
      contactEmail: row?.contact_email ?? fallback.contactEmail,
      updatedAt: row?.updated_at ?? LEGAL_DEFAULT_UPDATED_AT,
    };
  },
});
