import { v } from "convex/values";
import { internal } from "./_generated/api";
import { action, internalMutation, internalQuery, query } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { authedQuery } from "./lib/customFunctions";
import {
  hasManualProGrant,
  effectiveSubscriptionPlan,
  getUserPlan,
  isSubscriptionEntitled as isEntitled,
} from "./lib/billingEntitlements";
import {
  FREE_AGENT_DAILY_LIMIT,
  agentDailyLimitForPlan,
  planForProductId,
  productForPlan,
  publicBillingPlan,
  publicBillingPlans,
  type BillingInterval,
  type BillingPlanId,
} from "./billingPlans";
import { checkout, customerPortal } from "./dodo";

type SubscriptionStatus = "pending" | "active" | "on_hold" | "paused" | "cancelled" | "failed" | "expired";

function siteUrl() {
  return (
    process.env.SITE_URL ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    "http://localhost:3000"
  ).replace(/\/+$/, "");
}

function safeReturnUrl(value?: string) {
  if (value && value.startsWith("/") && !value.startsWith("//") && !value.includes("\\")) {
    return `${siteUrl()}${value}`;
  }
  return `${siteUrl()}/settings?billing=success`;
}

function safeCancelUrl(value?: string) {
  if (value && value.startsWith("/") && !value.startsWith("//") && !value.includes("\\")) {
    return `${siteUrl()}${value}`;
  }
  return `${siteUrl()}/pricing`;
}

function newestSubscription(rows: Doc<"billing_subscriptions">[]) {
  return rows.slice().sort((a, b) => b.updated_at - a.updated_at)[0] ?? null;
}

async function currentSubscriptionForUser(ctx: QueryCtx | MutationCtx, userId: Id<"users">) {
  const rows = await ctx.db
    .query("billing_subscriptions")
    .withIndex("by_user_and_updated_at", (q) => q.eq("user_id", userId))
    .order("desc")
    .take(10);

  return (
    rows.find((row) => isEntitled(row)) ??
    rows.find((row) => row.status === "pending" || row.status === "on_hold") ??
    newestSubscription(rows)
  );
}

async function billingCustomerForUser(ctx: QueryCtx | MutationCtx, userId: Id<"users">) {
  return await ctx.db
    .query("billing_customers")
    .withIndex("by_user", (q) => q.eq("user_id", userId))
    .first();
}

function asBillingSubscription(row: Doc<"billing_subscriptions">) {
  return {
    id: row._id,
    subscription_id: row.dodo_subscription_id,
    plan: effectiveSubscriptionPlan(row),
    interval: row.interval,
    status: row.status,
    quantity: row.quantity,
    currency: row.currency,
    recurring_amount: row.recurring_amount,
    current_period_start: row.current_period_start ?? null,
    current_period_end: row.current_period_end ?? null,
    cancel_at_period_end: row.cancel_at_period_end,
    cancelled_at: row.cancelled_at ?? null,
    is_entitled: isEntitled(row),
  };
}

/** Public pricing data. Product IDs stay server-side. */
export const getPlans = query({
  args: {},
  returns: v.any(),
  handler: async () => ({
    plans: publicBillingPlans(),
    free: {
      name: "Free",
      agent_daily_limit: FREE_AGENT_DAILY_LIMIT,
    },
  }),
});

/** Current billing state and the customer's available actions. */
export const getMyBilling = authedQuery({
  args: {},
  returns: v.any(),
  handler: async (ctx) => {
    const subscription = await currentSubscriptionForUser(ctx, ctx.user._id);
    const customer = await billingCustomerForUser(ctx, ctx.user._id);
    const manualPro = await hasManualProGrant(ctx, ctx.user._id);
    const planId = await getUserPlan(ctx, ctx.user._id);
    const activePlan = publicBillingPlan(planId ?? "pro");

    return {
      plans: publicBillingPlans(),
      plan: activePlan,
      plan_id: planId,
      subscription: subscription ? asBillingSubscription(subscription) : null,
      is_pro: Boolean(planId),
      manual_pro: manualPro,
      has_customer: Boolean(customer),
      agent_daily_limit: agentDailyLimitForPlan(planId),
    };
  },
});

const PRICE_CACHE_MS = 5 * 60 * 1000;

type LivePlanPrices = Record<
  BillingPlanId,
  Record<BillingInterval, { amount: number; currency: string; available: boolean }>
>;

function fallbackPrices(): LivePlanPrices {
  const plans = publicBillingPlans();
  const result = {} as LivePlanPrices;
  for (const plan of plans) {
    result[plan.id] = {
      month: {
        amount: plan.prices.month.amount,
        currency: plan.prices.month.currency,
        available: plan.prices.month.available,
      },
      year: {
        amount: plan.prices.year.amount,
        currency: plan.prices.year.currency,
        available: plan.prices.year.available,
      },
    };
  }
  return result;
}

export const getCachedPrices = internalQuery({
  args: {},
  returns: v.any(),
  handler: async (ctx) => {
    return await ctx.db.query("billing_price_cache").take(20);
  },
});

export const saveBillingPrices = internalMutation({
  args: {
    prices: v.array(
      v.object({
        plan: v.union(v.literal("plus"), v.literal("pro")),
        interval: v.union(v.literal("month"), v.literal("year")),
        productId: v.string(),
        amount: v.number(),
        currency: v.string(),
      }),
    ),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const now = Date.now();
    for (const price of args.prices) {
      const existing = await ctx.db
        .query("billing_price_cache")
        .withIndex("by_plan_and_interval", (q) =>
          q.eq("plan", price.plan).eq("interval", price.interval),
        )
        .first();
      const patch = {
        plan: price.plan,
        interval: price.interval,
        product_id: price.productId,
        amount: price.amount,
        currency: price.currency,
        fetched_at: now,
      };
      if (existing) await ctx.db.patch(existing._id, patch);
      else await ctx.db.insert("billing_price_cache", patch);
    }
    return null;
  },
});

/** Fetch authoritative product prices for every paid plan from Dodo. */
export const getLivePrices = action({
  args: {},
  returns: v.any(),
  handler: async (ctx) => {
    const fallback = fallbackPrices();
    const cached = (await ctx.runQuery(internal.billing.getCachedPrices, {})) as Array<{
      plan?: "plus" | "pro";
      interval: "month" | "year";
      product_id: string;
      amount: number;
      currency: string;
      fetched_at: number;
    }>;
    const now = Date.now();
    const result = fallback;
    const missing: Array<{ plan: BillingPlanId; interval: BillingInterval; productId: string }> = [];

    for (const plan of ["plus", "pro"] as const) {
      for (const interval of ["month", "year"] as const) {
        const price = productForPlan(plan, interval);
        if (!price.productId) continue;
        const cacheRow = cached.find(
          (row) =>
            row.plan === plan &&
            row.interval === interval &&
            row.product_id === price.productId &&
            now - row.fetched_at < PRICE_CACHE_MS,
        );
        if (cacheRow) {
          result[plan][interval] = {
            amount: cacheRow.amount,
            currency: cacheRow.currency,
            available: true,
          };
        } else {
          missing.push({ plan, interval, productId: price.productId });
        }
      }
    }

    if (!missing.length) return result;

    const fetched = await Promise.all(
      missing.map(async (item) => {
        try {
          const product = await dodoProduct(item.productId);
          return {
            ...item,
            amount: Number(product.price?.price ?? 0) / 100,
            currency: String(product.price?.currency ?? fallback[item.plan][item.interval].currency),
          };
        } catch (error) {
          console.error(`[billing] could not load Dodo price for ${item.plan}/${item.interval}`, error);
          return null;
        }
      }),
    );

    const save: Array<{
      plan: BillingPlanId;
      interval: BillingInterval;
      productId: string;
      amount: number;
      currency: string;
    }> = [];

    for (const item of fetched) {
      if (!item) continue;
      result[item.plan][item.interval] = {
        amount: item.amount,
        currency: item.currency,
        available: true,
      };
      save.push({
        plan: item.plan,
        interval: item.interval,
        productId: item.productId,
        amount: item.amount,
        currency: item.currency,
      });
    }

    if (save.length) {
      await ctx.runMutation(internal.billing.saveBillingPrices, { prices: save });
    }
    return result;
  },
});

export const getCurrentSubscriptionForUser = internalQuery({
  args: { userId: v.id("users") },
  returns: v.any(),
  handler: async (ctx, args) => currentSubscriptionForUser(ctx, args.userId),
});

export const getUserBillingCustomer = internalQuery({
  args: { userId: v.id("users") },
  returns: v.any(),
  handler: async (ctx, args) => billingCustomerForUser(ctx, args.userId),
});

async function requireIdentityUser(ctx: { auth: { getUserIdentity: () => Promise<{ subject: string } | null> }; runQuery: any }) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error("Sign in to manage your subscription.");
  const user = await ctx.runQuery(internal.billingCustomers.getUserByAuthId, { authId: identity.subject });
  if (!user) throw new Error("Your Qelsa account is not ready yet.");
  return user as Doc<"users">;
}

export const createCheckout = action({
  args: {
    plan: v.union(v.literal("plus"), v.literal("pro")),
    interval: v.union(v.literal("month"), v.literal("year")),
    returnUrl: v.optional(v.string()),
    cancelUrl: v.optional(v.string()),
  },
  returns: v.object({ checkout_url: v.string() }),
  handler: async (ctx, args) => {
    const user = await requireIdentityUser(ctx);
    const price = productForPlan(args.plan as BillingPlanId, args.interval as BillingInterval);
    if (!price.available || !price.productId) {
      throw new Error("This plan is not available for checkout yet.");
    }

    const customer = await ctx.runQuery(internal.billing.getUserBillingCustomer, {
      userId: user._id,
    });

    const session = await checkout(ctx, {
      payload: {
        product_cart: [{ product_id: price.productId, quantity: 1 }],
        customer: customer
          ? { customer_id: customer.dodo_customer_id }
          : { email: user.email, name: user.name },
        metadata: {
          user_id: String(user._id),
          plan: args.plan,
          interval: args.interval,
        },
        return_url: safeReturnUrl(args.returnUrl),
        cancel_url: safeCancelUrl(args.cancelUrl),
        billing_currency: price.currency,
        feature_flags: { allow_discount_code: true },
      },
    });

    if (!session.checkout_url) throw new Error("Dodo did not return a checkout URL.");
    return { checkout_url: session.checkout_url };
  },
});

export const openCustomerPortal = action({
  args: { send_email: v.optional(v.boolean()) },
  returns: v.object({ portal_url: v.string() }),
  handler: async (ctx, args) => {
    const user = await requireIdentityUser(ctx);
    const customer = await ctx.runQuery(internal.billing.getUserBillingCustomer, {
      userId: user._id,
    });
    if (!customer) throw new Error("Start a subscription before opening the billing portal.");
    const portal = await customerPortal(ctx, { send_email: args.send_email });
    if (!portal.portal_url) throw new Error("Dodo did not return a billing portal URL.");
    return { portal_url: portal.portal_url };
  },
});

function dodoApiBase() {
  return process.env.DODO_PAYMENTS_ENVIRONMENT === "live_mode"
    ? "https://live.dodopayments.com"
    : "https://test.dodopayments.com";
}

async function dodoProduct(productId: string) {
  const apiKey = process.env.DODO_PAYMENTS_API_KEY;
  if (!apiKey || !productId) throw new Error("Dodo Payments is not configured on this deployment.");
  const response = await fetch(`${dodoApiBase()}/products/${encodeURIComponent(productId)}`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  if (!response.ok) throw new Error(`Dodo product lookup failed (${response.status})`);
  return (await response.json()) as {
    price?: { price?: number; currency?: string };
  };
}

async function dodoRequest(path: string, method: "PATCH" | "POST", body: Record<string, unknown>) {
  const apiKey = process.env.DODO_PAYMENTS_API_KEY;
  if (!apiKey) throw new Error("Dodo Payments is not configured on this deployment.");

  const response = await fetch(`${dodoApiBase()}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`Dodo could not update the subscription (${response.status})${detail ? `: ${detail.slice(0, 180)}` : ""}`);
  }

  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

async function activeSubscriptionForAction(ctx: any, user: Doc<"users">) {
  const subscription = (await ctx.runQuery(internal.billing.getCurrentSubscriptionForUser, {
    userId: user._id,
  })) as Doc<"billing_subscriptions"> | null;
  if (!subscription || !isEntitled(subscription)) {
    throw new Error("There is no active subscription to update.");
  }
  return subscription;
}

export const changePlan = action({
  args: {
    plan: v.union(v.literal("plus"), v.literal("pro")),
    interval: v.union(v.literal("month"), v.literal("year")),
  },
  returns: v.object({
    ok: v.boolean(),
    plan: v.union(v.literal("plus"), v.literal("pro")),
    interval: v.union(v.literal("month"), v.literal("year")),
  }),
  handler: async (ctx, args) => {
    const user = await requireIdentityUser(ctx);
    const subscription = await activeSubscriptionForAction(ctx, user);
    const price = productForPlan(args.plan as BillingPlanId, args.interval as BillingInterval);
    if (!price.available || !price.productId) throw new Error("That plan is not available yet.");
    if (effectiveSubscriptionPlan(subscription) === args.plan && subscription.interval === args.interval) {
      return { ok: true, plan: args.plan, interval: args.interval };
    }

    await dodoRequest(`/subscriptions/${encodeURIComponent(subscription.dodo_subscription_id)}/change-plan`, "POST", {
      product_id: price.productId,
      quantity: subscription.quantity || 1,
      proration_billing_mode: "prorated_immediately",
    });

    // A plan change from settings is also an explicit intent to keep the
    // subscription, so clear a pending cancellation at the same time.
    if (subscription.cancel_at_period_end) {
      await dodoRequest(`/subscriptions/${encodeURIComponent(subscription.dodo_subscription_id)}`, "PATCH", {
        cancel_at_next_billing_date: false,
      });
    }

    await ctx.runMutation(internal.billing.applyLocalPlanChange, {
      subscriptionId: subscription._id,
      plan: args.plan,
      interval: args.interval,
      cancelAtPeriodEnd: false,
    });
    return { ok: true, plan: args.plan, interval: args.interval };
  },
});

export const setCancelAtPeriodEnd = action({
  args: { cancel: v.boolean() },
  returns: v.object({ ok: v.boolean(), cancel_at_period_end: v.boolean() }),
  handler: async (ctx, args) => {
    const user = await requireIdentityUser(ctx);
    const subscription = await activeSubscriptionForAction(ctx, user);

    await dodoRequest(`/subscriptions/${encodeURIComponent(subscription.dodo_subscription_id)}`, "PATCH", {
      cancel_at_next_billing_date: args.cancel,
    });
    await ctx.runMutation(internal.billing.applyLocalCancellation, {
      subscriptionId: subscription._id,
      cancel: args.cancel,
    });
    return { ok: true, cancel_at_period_end: args.cancel };
  },
});

export const applyLocalPlanChange = internalMutation({
  args: {
    subscriptionId: v.id("billing_subscriptions"),
    plan: v.union(v.literal("plus"), v.literal("pro")),
    interval: v.union(v.literal("month"), v.literal("year")),
    cancelAtPeriodEnd: v.boolean(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.subscriptionId);
    if (!existing) return null;
    const price = productForPlan(args.plan, args.interval);
    await ctx.db.patch(args.subscriptionId, {
      plan: args.plan,
      interval: args.interval,
      product_id: price.productId || existing.product_id,
      cancel_at_period_end: args.cancelAtPeriodEnd,
      updated_at: Date.now(),
    });
    return null;
  },
});

export const applyLocalCancellation = internalMutation({
  args: {
    subscriptionId: v.id("billing_subscriptions"),
    cancel: v.boolean(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.subscriptionId);
    if (!existing) return null;
    await ctx.db.patch(args.subscriptionId, {
      cancel_at_period_end: args.cancel,
      updated_at: Date.now(),
    });
    return null;
  },
});

function asStatus(value: string): SubscriptionStatus {
  const allowed: SubscriptionStatus[] = ["pending", "active", "on_hold", "paused", "cancelled", "failed", "expired"];
  return allowed.includes(value as SubscriptionStatus) ? (value as SubscriptionStatus) : "failed";
}

/**
 * Idempotent webhook write. Dodo retries webhooks, so `event_key` is recorded
 * in the same transaction as the subscription update.
 */
export const upsertSubscriptionFromWebhook = internalMutation({
  args: {
    eventKey: v.string(),
    type: v.string(),
    eventAt: v.number(),
    subscriptionId: v.string(),
    customerId: v.string(),
    customerEmail: v.string(),
    customerName: v.optional(v.string()),
    productId: v.string(),
    status: v.string(),
    quantity: v.number(),
    currency: v.string(),
    recurringAmount: v.number(),
    currentPeriodStart: v.optional(v.number()),
    currentPeriodEnd: v.optional(v.number()),
    cancelAtPeriodEnd: v.boolean(),
    cancelledAt: v.optional(v.number()),
    metadata: v.any(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const duplicate = await ctx.db
      .query("billing_events")
      .withIndex("by_event_key", (q) => q.eq("event_key", args.eventKey))
      .first();
    if (duplicate) return null;

    const metadata = (args.metadata ?? {}) as Record<string, unknown>;
    const metadataUserId = typeof metadata.user_id === "string" ? metadata.user_id : null;
    let user: Doc<"users"> | null = null;

    if (metadataUserId) {
      try {
        user = await ctx.db.get(metadataUserId as Id<"users">);
      } catch {
        user = null;
      }
    }

    const customerByDodoId = await ctx.db
      .query("billing_customers")
      .withIndex("by_dodo_customer_id", (q) => q.eq("dodo_customer_id", args.customerId))
      .first();

    if (!user && customerByDodoId) {
      user = await ctx.db.get(customerByDodoId.user_id);
    }
    if (!user) {
      // The checkout action always stamps user_id, but never create orphan
      // billing rows if an event arrives without a resolvable owner.
      await ctx.db.insert("billing_events", {
        event_key: args.eventKey,
        type: args.type,
        subscription_id: args.subscriptionId,
        event_at: args.eventAt,
        received_at: Date.now(),
      });
      return null;
    }

    const now = Date.now();
    if (customerByDodoId) {
      await ctx.db.patch(customerByDodoId._id, {
        user_id: user._id,
        email: args.customerEmail || customerByDodoId.email,
        name: args.customerName ?? customerByDodoId.name,
        updated_at: now,
      });
    } else {
      await ctx.db.insert("billing_customers", {
        user_id: user._id,
        dodo_customer_id: args.customerId,
        email: args.customerEmail,
        name: args.customerName,
        created_at: now,
        updated_at: now,
      });
    }

    const existing = await ctx.db
      .query("billing_subscriptions")
      .withIndex("by_dodo_subscription_id", (q) => q.eq("dodo_subscription_id", args.subscriptionId))
      .first();

    // Older webhooks must not overwrite a newer state. The event ledger still
    // records them, which makes retries and out-of-order delivery debuggable.
    if (existing && args.eventAt < existing.last_event_at) {
      await ctx.db.insert("billing_events", {
        event_key: args.eventKey,
        type: args.type,
        subscription_id: args.subscriptionId,
        event_at: args.eventAt,
        received_at: now,
      });
      return null;
    }

    const product = planForProductId(args.productId);
    const interval: "month" | "year" =
      product?.interval ?? (metadata.interval === "year" ? "year" : "month");
    const plan: BillingPlanId =
      product?.plan ?? (metadata.plan === "plus" ? "plus" : "pro");
    const patch = {
      user_id: user._id,
      dodo_customer_id: args.customerId,
      dodo_subscription_id: args.subscriptionId,
      product_id: args.productId,
      plan,
      interval,
      status: asStatus(args.status),
      quantity: args.quantity,
      currency: args.currency,
      recurring_amount: args.recurringAmount,
      current_period_start: args.currentPeriodStart,
      current_period_end: args.currentPeriodEnd,
      cancel_at_period_end: args.cancelAtPeriodEnd,
      cancelled_at: args.cancelledAt,
      updated_at: now,
      last_event_at: args.eventAt,
    } as const;

    if (existing) {
      await ctx.db.patch(existing._id, patch);
    } else {
      await ctx.db.insert("billing_subscriptions", {
        ...patch,
        created_at: now,
      });
    }

    await ctx.db.insert("billing_events", {
      event_key: args.eventKey,
      type: args.type,
      subscription_id: args.subscriptionId,
      event_at: args.eventAt,
      received_at: now,
    });
    return null;
  },
});
