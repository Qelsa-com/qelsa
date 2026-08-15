"use node";

import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";

export const fetchAndStoreJobs = internalAction({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const url = process.env.EXTERNAL_API_URL;
    if (!url) {
      console.log("EXTERNAL_API_URL is not set — skipping job scrape");
      return null;
    }
    const response = await fetch(url);
    if (!response.ok) {
      console.error("Job scrape failed", response.status);
      return null;
    }
    const payload = (await response.json()) as { results?: Array<Record<string, unknown>> };
    await ctx.runMutation(internal.jobs.storeScrapedJobs, { jobs: payload.results ?? [] });
    return null;
  },
});
