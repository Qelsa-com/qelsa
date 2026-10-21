import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";
import { FREE_AGENT_DAILY_LIMIT, PRO_AGENT_DAILY_LIMIT } from "../billingPlans";

/** A subscription counts as active until its paid period ends. */
export function isSubscriptionEntitled(
  subscription: Doc<"billing_subscriptions"> | null | undefined,
  now = Date.now(),
) {
  if (!subscription || subscription.status !== "active") return false;
  if (!subscription.cancel_at_period_end) return true;
  return Boolean(subscription.current_period_end && subscription.current_period_end > now);
}

export async function getAgentDailyLimit(ctx: QueryCtx | MutationCtx, userId: Id<"users">) {
  const latest = await ctx.db
    .query("billing_subscriptions")
    .withIndex("by_user_and_updated_at", (q) => q.eq("user_id", userId))
    .order("desc")
    .take(5);

  return latest.some((subscription) => isSubscriptionEntitled(subscription))
    ? PRO_AGENT_DAILY_LIMIT
    : FREE_AGENT_DAILY_LIMIT;
}
