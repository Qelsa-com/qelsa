import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

crons.interval("fetch external jobs", { hours: 1 }, internal.jobsScraper.fetchAndStoreJobs);

export default crons;
