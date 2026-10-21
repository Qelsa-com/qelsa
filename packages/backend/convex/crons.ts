import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

crons.interval("fetch external jobs", { hours: 1 }, internal.jobsScraper.fetchAndStoreJobs);

// Public boards and employer ATS re-sync weekly (skill extraction is per new job).
crons.cron("sync ATS integrations", "23 8 * * 1", internal.atsSync.syncAllDue, {});

// Saved-search matching is deterministic and bounded. The agent only writes a
// brief when the ID diff is non-empty, so quiet days cost no model calls.
crons.cron("agent saved searches", "0 7 * * *", internal.agentProactive.runSavedSearches, {});

export default crons;
