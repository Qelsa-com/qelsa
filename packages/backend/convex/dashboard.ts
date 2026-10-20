import { v } from "convex/values";
import { isWithdrawn } from "./lib/applications";
import { authedQuery } from "./lib/customFunctions";

/**
 * Small, indexed rollup for the My Space dashboard.
 *
 * The dashboard only needs counts and a few recent applications, so this avoids
 * hydrating the full applied/saved job lists on every visit. Both reads are
 * bounded; a user with hundreds of rows still gets a stable, cheap response.
 */
export const summary = authedQuery({
  args: {},
  returns: v.object({
    savedCount: v.number(),
    applicationCounts: v.object({
      total: v.number(),
      active: v.number(),
      shortlisted: v.number(),
      closed: v.number(),
    }),
    latestApplications: v.array(
      v.object({
        id: v.string(),
        status: v.string(),
        appliedAt: v.number(),
        jobId: v.union(v.string(), v.null()),
        jobTitle: v.union(v.string(), v.null()),
        companyName: v.union(v.string(), v.null()),
      }),
    ),
  }),
  handler: async (ctx) => {
    const [savedRows, applicationRows] = await Promise.all([
      ctx.db
        .query("saved_jobs")
        .withIndex("by_user", (q) => q.eq("user_id", ctx.user._id))
        .take(200),
      ctx.db
        .query("job_applications")
        .withIndex("by_user", (q) => q.eq("user_id", ctx.user._id))
        .order("desc")
        .take(200),
    ]);

    const applications = applicationRows.filter((row) => !isWithdrawn(row.status));
    const appliedJobIds = new Set(applications.map((row) => String(row.job_id)));

    const applicationCounts = {
      total: applications.length,
      active: 0,
      shortlisted: 0,
      closed: 0,
    };
    for (const application of applications) {
      if (application.status === "shortlisted" || application.status === "sorted") {
        applicationCounts.shortlisted += 1;
      } else if (application.status === "rejected") {
        applicationCounts.closed += 1;
      } else {
        applicationCounts.active += 1;
      }
    }

    const latestApplications = await Promise.all(
      [...applications]
        .sort((a, b) => b.applied_at - a.applied_at)
        .slice(0, 3)
        .map(async (application) => {
          const job = await ctx.db.get(application.job_id);
          return {
            id: application._id,
            status: application.status,
            appliedAt: application.applied_at,
            jobId: job?._id ?? null,
            jobTitle: job?.title ?? null,
            companyName: job?.company_name ?? null,
          };
        }),
    );

    return {
      // Match the saved-jobs page, which hides roles the user has already applied to.
      savedCount: savedRows.filter((row) => !appliedJobIds.has(String(row.job_id))).length,
      applicationCounts,
      latestApplications,
    };
  },
});
