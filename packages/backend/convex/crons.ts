import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

crons.interval("fetch external jobs", { hours: 1 }, internal.jobsScraper.fetchAndStoreJobs);

// Re-sync connected ATS integrations whose next_sync_at is due.
crons.interval("sync ATS integrations", { hours: 1 }, internal.atsSync.syncAllDue);

export default crons;
