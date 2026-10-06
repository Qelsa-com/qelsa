import { v } from "convex/values";
import { internal } from "./_generated/api";
import { internalMutation } from "./_generated/server";
import { refreshInferredSkillLevels } from "./lib/skillLevels";
import { skillMatchKey } from "./lib/skillMatch";

const SKILL_BATCH = 200;
const USER_BATCH = 25;

const backfillResult = v.object({ processed: v.number(), changed: v.number(), done: v.boolean() });

/**
 * Sets `skills.match_key` on catalog rows created before it existed. Run once
 * per deployment: `npx convex run skillBackfills:backfillSkillMatchKeys '{}'`.
 * Re-running only patches rows whose key is missing or stale.
 */
export const backfillSkillMatchKeys = internalMutation({
  args: { cursor: v.optional(v.union(v.string(), v.null())) },
  returns: backfillResult,
  handler: async (ctx, args) => {
    const page = await ctx.db.query("skills").paginate({ cursor: args.cursor ?? null, numItems: SKILL_BATCH });
    let changed = 0;
    for (const skill of page.page) {
      const key = skillMatchKey(skill.name);
      if (skill.match_key === key) continue;
      await ctx.db.patch(skill._id, { match_key: key });
      changed += 1;
    }
    if (!page.isDone) {
      await ctx.scheduler.runAfter(0, internal.skillBackfills.backfillSkillMatchKeys, { cursor: page.continueCursor });
    }
    return { processed: page.page.length, changed, done: page.isDone };
  },
});

/**
 * Estimates levels for existing profiles' skills that have none. Run after the
 * match-key backfill: `npx convex run skillBackfills:backfillSkillLevels '{}'`.
 * Levels users picked are left alone, so re-running is safe.
 */
export const backfillSkillLevels = internalMutation({
  args: { cursor: v.optional(v.union(v.string(), v.null())) },
  returns: backfillResult,
  handler: async (ctx, args) => {
    const page = await ctx.db.query("users").paginate({ cursor: args.cursor ?? null, numItems: USER_BATCH });
    const now = Date.now();
    let changed = 0;
    for (const user of page.page) {
      changed += await refreshInferredSkillLevels(ctx, user._id, now);
    }
    if (!page.isDone) {
      await ctx.scheduler.runAfter(0, internal.skillBackfills.backfillSkillLevels, { cursor: page.continueCursor });
    }
    return { processed: page.page.length, changed, done: page.isDone };
  },
});
