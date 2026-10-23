import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";
import {
  FREE_AGENT_DAILY_LIMIT,
  FREE_APPLICATION_LIMIT,
  agentDailyLimitForPlan,
  type BillingPlanId,
} from "../billingPlans";

type ReadCtx = QueryCtx | MutationCtx;

/** A subscription counts as active until its paid period ends. */
export function isSubscriptionEntitled(
  subscription: Doc<"billing_subscriptions"> | null | undefined,
  now = Date.now(),
) {
  if (!subscription || subscription.status !== "active") return false;
  if (!subscription.cancel_at_period_end) return true;
  return Boolean(subscription.current_period_end && subscription.current_period_end > now);
}

export async function hasManualProGrant(ctx: ReadCtx, userId: Id<"users">) {
  const grants = await ctx.db
    .query("manual_entitlements")
    .withIndex("by_user_and_granted_at", (q) => q.eq("user_id", userId))
    .order("desc")
    .take(10);

  return grants.some((grant) => grant.plan === "pro" && !grant.revoked_at);
}

/** Paid plan currently attached to the account, or null for free. */
export async function getUserPlan(ctx: ReadCtx, userId: Id<"users">): Promise<BillingPlanId | null> {
  if (await hasManualProGrant(ctx, userId)) return "pro";

  const latest = await ctx.db
    .query("billing_subscriptions")
    .withIndex("by_user_and_updated_at", (q) => q.eq("user_id", userId))
    .order("desc")
    .take(5);

  const active = latest.find((subscription) => isSubscriptionEntitled(subscription));
  return active?.plan ?? null;
}

export async function getAgentDailyLimit(ctx: ReadCtx, userId: Id<"users">) {
  return agentDailyLimitForPlan(await getUserPlan(ctx, userId));
}

/** Statuses that still use one of the free plan's application slots. */
const ACTIVE_APPLICATION_STATUSES = ["applied", "viewed", "shortlisted", "sorted", "hold"] as const;

/**
 * Count only as far as the caller needs. Free users stop at one application,
 * so this is five tiny indexed reads in the worst case — never a table scan.
 */
async function countActiveApplications(ctx: ReadCtx, userId: Id<"users">, cap: number) {
  let used = 0;
  for (const status of ACTIVE_APPLICATION_STATUSES) {
    if (used >= cap) break;
    const rows = await ctx.db
      .query("job_applications")
      .withIndex("by_user_and_status", (q) => q.eq("user_id", userId).eq("status", status))
      .take(cap - used);
    used += rows.length;
  }
  return used;
}

export type ApplicationUsage = {
  is_pro: boolean;
  plan_id: BillingPlanId | null;
  used: number;
  limit: number | null;
  remaining: number | null;
  can_apply: boolean;
};

export async function getApplicationUsage(
  ctx: ReadCtx,
  userId: Id<"users">,
): Promise<ApplicationUsage> {
  const plan = await getUserPlan(ctx, userId);
  if (plan) {
    return { is_pro: plan === "pro", plan_id: plan, used: 0, limit: null, remaining: null, can_apply: true };
  }

  const used = await countActiveApplications(ctx, userId, FREE_APPLICATION_LIMIT + 1);
  return {
    is_pro: false,
    plan_id: null,
    used,
    limit: FREE_APPLICATION_LIMIT,
    remaining: Math.max(0, FREE_APPLICATION_LIMIT - used),
    can_apply: used < FREE_APPLICATION_LIMIT,
  };
}

export async function assertCanApply(ctx: ReadCtx, userId: Id<"users">) {
  const usage = await getApplicationUsage(ctx, userId);
  if (!usage.can_apply) {
    throw new Error(
      "Your free plan includes 1 application. Upgrade to Qelsa Plus or Pro to apply to more roles.",
    );
  }
}
