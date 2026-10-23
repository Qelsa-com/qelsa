import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";
import { planForProductId, type BillingPlanId } from "../billingPlans";
import { audienceForUser, getPlanConfig } from "./planConfig";

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

/**
 * The product ID is the durable source of truth for which plan a subscription
 * belongs to. The stored `plan` remains a fallback for products that are no
 * longer configured (for example a retired package), and for rows written
 * before the plan split.
 */
export function effectiveSubscriptionPlan(
  subscription: Doc<"billing_subscriptions">,
): BillingPlanId {
  return planForProductId(subscription.product_id)?.plan ?? subscription.plan;
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
  return active ? effectiveSubscriptionPlan(active) : null;
}

export async function getAgentDailyLimit(ctx: ReadCtx, user: Doc<"users">) {
  const plan = await getUserPlan(ctx, user._id);
  const config = await getPlanConfig(ctx, audienceForUser(user), plan ?? "free");
  return config.agent_daily_limit;
}

/** Statuses that still use an active application slot. */
const ACTIVE_APPLICATION_STATUSES = ["applied", "viewed", "shortlisted", "sorted", "hold"] as const;

/**
 * Count only as far as the caller needs. The configured cap bounds this to a
 * handful of indexed reads, never a table scan.
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
  const config = await getPlanConfig(ctx, "candidate", plan ?? "free");
  const limit = config.application_limit;
  const isPro = plan === "pro";

  if (limit === null) {
    return { is_pro: isPro, plan_id: plan, used: 0, limit: null, remaining: null, can_apply: true };
  }

  const used = await countActiveApplications(ctx, userId, limit + 1);
  return {
    is_pro: isPro,
    plan_id: plan,
    used,
    limit,
    remaining: Math.max(0, limit - used),
    can_apply: used < limit,
  };
}

export async function assertCanApply(ctx: ReadCtx, userId: Id<"users">) {
  const usage = await getApplicationUsage(ctx, userId);
  if (!usage.can_apply) {
    const planLabel =
      usage.plan_id === "plus"
        ? "Qelsa Plus"
        : usage.plan_id === "pro"
        ? "Qelsa Pro"
        : "Your free plan";
    const applicationLabel = `${usage.limit} active application${usage.limit === 1 ? "" : "s"}`;
    const nextStep =
      usage.plan_id === "pro"
        ? "Contact support if you need a higher limit."
        : "Upgrade to apply to more roles.";
    throw new Error(`${planLabel} includes ${applicationLabel}. ${nextStep}`);
  }
}
