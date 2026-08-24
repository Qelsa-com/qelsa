import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

crons.interval("fetch external jobs", { hours: 1 }, internal.jobsScraper.fetchAndStoreJobs);

// Public boards and employer ATS re-sync weekly (skill extraction is per new job).
crons.cron("sync ATS integrations", "23 8 * * 1", internal.atsSync.syncAllDue, {});

export default crons;
