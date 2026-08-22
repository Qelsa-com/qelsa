"use node";

import { v } from "convex/values";
import { internal } from "./_generated/api";
import { internalAction } from "./_generated/server";

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
    const needsSkills = await ctx.runMutation(internal.jobs.storeScrapedJobs, { jobs: payload.results ?? [] });
    if (needsSkills.length > 0 && process.env.OPENROUTER_API_KEY) {
      // Detached: extraction runs one AI call per job and must not block the cron.
      await ctx.scheduler.runAfter(0, internal.jobSkillsEnrich.enrichBatch, { jobIds: needsSkills });
    }
    return null;
  },
});
