/**
 * Privacy-light attribution for course recommendations.
 *
 * A click row records which recommendation was opened and the skills it was
 * matched to. It deliberately does not store email, resume, or profile data.
 */

import { v } from "convex/values";
import { authedMutation } from "./lib/customFunctions";

export const trackClick = authedMutation({
  args: {
    courseId: v.string(),
    provider: v.string(),
    jobId: v.optional(v.id("jobs")),
    source: v.optional(v.string()),
    matchedSkills: v.optional(v.array(v.string())),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.insert("course_clicks", {
      user_id: ctx.user._id,
      course_id: args.courseId.trim().slice(0, 120),
      provider: args.provider.trim().slice(0, 80),
      job_id: args.jobId,
      source: (args.source ?? "agent_fit").slice(0, 80),
      matched_skills: (args.matchedSkills ?? []).slice(0, 8).map((skill) => skill.slice(0, 80)),
      created_at: Date.now(),
    });
    return null;
  },
});
