import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

crons.interval("fetch external jobs", { hours: 1 }, internal.jobsScraper.fetchAndStoreJobs);

// Public boards and employer ATS re-sync weekly (skill extraction is per new job).
crons.cron("sync ATS integrations", "23 8 * * 1", internal.atsSync.syncAllDue, {});

// Saved-search matching is deterministic and bounded. The agent only writes a
// brief when the ID diff is non-empty, so quiet days cost no model calls.
crons.cron("agent saved searches", "0 7 * * *", internal.agentProactive.runSavedSearches, {});

// Autofill tokens expire in 20 minutes; remove old rows daily.
crons.cron("cleanup autofill tokens", "17 3 * * *", internal.agentAutofill.cleanupExpired, {});

// AI curriculum agent. It no-ops unless CURRICULUM_AGENT_ENABLED is true, so
// deployments must explicitly opt in to autonomous publishing.
crons.cron("interview prep curriculum", "0 6 * * 2", internal.curriculum.scheduledRun, {});

// Rebuild the denormalized scoring vectors. Job skills arrive asynchronously
// (ATS sync + extraction), so vectors are refreshed nightly instead of on every
// write. Cached rankings are rebuilt on demand from these vectors.
crons.cron("refresh job match vectors", "41 4 * * *", internal.jobMatchRanking.backfill, {});

export default crons;
