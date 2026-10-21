/**
 * Proactive Qelsa Agent work.
 *
 * Saved searches are checked on a schedule. We deliberately keep the model out
 * of the hot path: a bounded keyword search and an ID diff decide whether
 * anything changed, and only then is a brief written. This keeps alerts cheap,
 * idempotent, and useful at 10x the current number of saved searches.
 */

import { paginationOptsValidator } from "convex/server";
import { v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";
import { internal } from "./_generated/api";
import { internalAction, internalMutation, internalQuery } from "./_generated/server";
import { authedMutation, authedQuery } from "./lib/customFunctions";

const MAX_SEARCH_PAGES = 12;
const SEEN_JOBS_LIMIT = 80;

async function jobCard(ctx: { db: any }, job: Doc<"jobs">) {
  const city = job.city_id ? await ctx.db.get(job.city_id) : null;
  return {
    job_id: job._id,
    title: job.title ?? "Untitled role",
    company: job.company_name ?? null,
    location: city?.name ?? null,
    workplace_type: job.workplace_type ?? null,
    salary:
      job.salary_min == null && job.salary_max == null
        ? null
        : { min: job.salary_min ?? null, max: job.salary_max ?? null, currency: job.salary_currency ?? null },
    url_path: `/jobs/${job._id}`,
  };
}

/** The scheduled action walks saved searches one bounded page at a time. */
export const listActiveSearchPage = internalQuery({
  args: { paginationOpts: paginationOptsValidator },
  returns: v.any(),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("agent_saved_searches")
      .withIndex("by_active", (q) => q.eq("active", true))
      .paginate(args.paginationOpts);
  },
});

export const recordSavedSearchRun = internalMutation({
  args: {
    savedSearchId: v.id("agent_saved_searches"),
    currentJobIds: v.array(v.id("jobs")),
    newJobIds: v.array(v.id("jobs")),
    checkedAt: v.number(),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    const search = await ctx.db.get(args.savedSearchId);
    if (!search || !search.active) return { recorded: false };
    const seen = [...new Set([...args.currentJobIds, ...search.seen_job_ids])].slice(0, SEEN_JOBS_LIMIT);
    await ctx.db.patch(search._id, {
      seen_job_ids: seen,
      last_checked_at: args.checkedAt,
    });
    if (!args.newJobIds.length) return { recorded: true, new_count: 0 };

    // The first run seeds current matches. Only jobs created after the search
    // existed can be genuinely "new"; this prevents an old result that was
    // outside the bounded top-N from looking like a fresh alert later.
    const jobs: Doc<"jobs">[] = [];
    for (const id of args.newJobIds.slice(0, 6)) {
      const job = await ctx.db.get(id);
      if (job && job._creationTime > search.created_at) jobs.push(job);
    }
    if (!jobs.length) return { recorded: true, new_count: 0 };
    const labels = jobs.map((job) => `${job.title ?? "Role"}${job.company_name ? ` at ${job.company_name}` : ""}`);
    const summary = `${jobs.length} new role${jobs.length === 1 ? "" : "s"} matched "${search.name}". ${labels.join(" · ")}`;
    const briefId = await ctx.db.insert("agent_briefs", {
      user_id: search.user_id,
      kind: "saved_search",
      title: `New matches for ${search.name}`,
      summary,
      job_ids: jobs.map((job) => job._id),
      saved_search_id: search._id,
      read: false,
      created_at: args.checkedAt,
    });
    return { recorded: true, new_count: jobs.length, brief_id: briefId };
  },
});

export const runSavedSearches = internalAction({
  args: { cursor: v.optional(v.string()) },
  returns: v.null(),
  handler: async (ctx, args) => {
    let cursor: string | null = args.cursor ?? null;
    let pages = 0;
    do {
      const page: any = await ctx.runQuery(internal.agentProactive.listActiveSearchPage, {
        paginationOpts: { numItems: 40, cursor },
      });
      for (const search of page.page as Doc<"agent_saved_searches">[]) {
        const result: any = await ctx.runQuery(internal.qelsaAgentTools.searchJobsForSavedSearchInternal, {
          userId: search.user_id,
          query: search.query,
          city: search.city,
          workplaceType: search.workplace_type,
          remote: search.remote,
          salaryMin: search.salary_min,
          limit: 12,
        });
        const current = (result.jobs ?? [])
          .map((job: any) => job.job_id)
          .filter((id: unknown): id is Id<"jobs"> => typeof id === "string") as Id<"jobs">[];
        const seen = new Set(search.seen_job_ids.map(String));
        const fresh = current.filter((id) => !seen.has(String(id)));
        const runResult: any = await ctx.runMutation(internal.agentProactive.recordSavedSearchRun, {
          savedSearchId: search._id,
          currentJobIds: current,
          newJobIds: fresh,
          checkedAt: Date.now(),
        });
        if (runResult?.brief_id) {
          if (search.email_alerts !== false) {
            await ctx.scheduler.runAfter(0, internal.agentNotifications.emailBrief, {
              briefId: runResult.brief_id,
            });
          }
          if (search.push_alerts !== false) {
            await ctx.scheduler.runAfter(0, internal.agentPush.pushBrief, {
              briefId: runResult.brief_id,
            });
          }
        }
      }
      cursor = page.isDone ? null : page.continueCursor;
      pages += 1;
    } while (cursor && pages < MAX_SEARCH_PAGES);
    // At 10x scale one action should not hold the scheduler for minutes. Hand
    // the remaining cursor to a fresh action, keeping each run bounded.
    if (cursor) {
      await ctx.scheduler.runAfter(0, internal.agentProactive.runSavedSearches, { cursor });
    }
    return null;
  },
});

export const getUnreadBriefsInternal = internalQuery({
  args: { authId: v.string(), limit: v.optional(v.number()) },
  returns: v.any(),
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_authId", (q) => q.eq("authId", args.authId))
      .unique();
    if (!user) throw new Error("User not found");
    const limit = Math.min(Math.max(args.limit ?? 3, 1), 10);
    const rows = await ctx.db
      .query("agent_briefs")
      .withIndex("by_user_and_read", (q) => q.eq("user_id", user._id).eq("read", false))
      .order("desc")
      .take(limit);
    return { count: rows.length, briefs: rows };
  },
});

/** Called by the chat page to show the latest unread brief. */
export const listBriefs = authedQuery({
  args: { limit: v.optional(v.number()) },
  returns: v.any(),
  handler: async (ctx, args) => {
    const limit = Math.min(Math.max(args.limit ?? 3, 1), 10);
    const rows = await ctx.db
      .query("agent_briefs")
      .withIndex("by_user_and_created", (q) => q.eq("user_id", ctx.user._id))
      .order("desc")
      .take(limit);
    const briefs = [];
    for (const row of rows) {
      const jobs = [];
      for (const id of row.job_ids.slice(0, 6)) {
        const job = await ctx.db.get(id);
        if (job) jobs.push(await jobCard(ctx, job));
      }
      briefs.push({
        brief_id: row._id,
        kind: row.kind,
        title: row.title,
        summary: row.summary,
        jobs,
        read: row.read,
        created_at: row.created_at,
      });
    }
    const unread = await ctx.db
      .query("agent_briefs")
      .withIndex("by_user_and_read", (q) => q.eq("user_id", ctx.user._id).eq("read", false))
      .take(20);
    return { briefs, unread: unread.length };
  },
});

export const markBriefRead = authedMutation({
  args: { briefId: v.id("agent_briefs") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const brief = await ctx.db.get(args.briefId);
    if (!brief || brief.user_id !== ctx.user._id) throw new Error("Brief not found");
    if (!brief.read) {
      await ctx.db.patch(brief._id, { read: true, read_at: Date.now() });
    }
    return null;
  },
});
