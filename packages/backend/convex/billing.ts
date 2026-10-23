import { v } from "convex/values";
import { internal } from "./_generated/api";
import { action, internalMutation, internalQuery, query } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { authedQuery } from "./lib/customFunctions";
import { hasManualProGrant, isSubscriptionEntitled as isEntitled } from "./lib/billingEntitlements";
import {
  BILLING_PLAN_ID,
  FREE_AGENT_DAILY_LIMIT,
  PRO_AGENT_DAILY_LIMIT,
  intervalForProductId,
  productForInterval,
  publicBillingPlan,
  type BillingInterval,
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
    plan: row.plan,
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
    plan: publicBillingPlan(),
    free: {
      name: "Free",
      agent_daily_limit: FREE_AGENT_DAILY_LIMIT,
    },
    pro: {
      agent_daily_limit: PRO_AGENT_DAILY_LIMIT,
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
    const plan = publicBillingPlan();

    return {
      plan,
      subscription: subscription ? asBillingSubscription(subscription) : null,
      is_pro: isEntitled(subscription) || manualPro,
      manual_pro: manualPro,
      has_customer: Boolean(customer),
      agent_daily_limit: isEntitled(subscription) || manualPro ? PRO_AGENT_DAILY_LIMIT : FREE_AGENT_DAILY_LIMIT,
    };
  },
});

const PRICE_CACHE_MS = 5 * 60 * 1000;

function fallbackPrices() {
  const plan = publicBillingPlan();
  return {
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

export const getCachedPrices = internalQuery({
  args: {},
  returns: v.any(),
  handler: async (ctx) => {
    return await ctx.db.query("billing_price_cache").take(2);
  },
});

export const saveBillingPrices = internalMutation({
  args: {
    prices: v.array(
      v.object({
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
        .withIndex("by_interval", (q) => q.eq("interval", price.interval))
        .first();
      const patch = {
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

/** Fetch authoritative product prices from Dodo, with a short server cache. */
export const getLivePrices = action({
  args: {},
  returns: v.any(),
  handler: async (ctx) => {
    const month = productForInterval("month");
    const year = productForInterval("year");
    const fallback = fallbackPrices();
    if (!month.productId || !year.productId) return fallback;

    const cached = (await ctx.runQuery(internal.billing.getCachedPrices, {})) as Array<{
      interval: "month" | "year";
      product_id: string;
      amount: number;
      currency: string;
      fetched_at: number;
    }>;
    const now = Date.now();
    const cachedMonth = cached.find((row) => row.interval === "month");
    const cachedYear = cached.find((row) => row.interval === "year");
    const cacheIsFresh =
      Boolean(cachedMonth && cachedYear) &&
      now - cachedMonth!.fetched_at < PRICE_CACHE_MS &&
      now - cachedYear!.fetched_at < PRICE_CACHE_MS &&
      cachedMonth!.product_id === month.productId &&
      cachedYear!.product_id === year.productId;
    if (cacheIsFresh) {
      return {
        month: { amount: cachedMonth!.amount, currency: cachedMonth!.currency, available: true },
        year: { amount: cachedYear!.amount, currency: cachedYear!.currency, available: true },
      };
    }

    try {
      const [monthProduct, yearProduct] = await Promise.all([
        dodoProduct(month.productId),
        dodoProduct(year.productId),
      ]);
      const prices = [
        {
          interval: "month" as const,
          productId: month.productId,
          amount: Number(monthProduct.price?.price ?? 0) / 100,
          currency: String(monthProduct.price?.currency ?? fallback.month.currency),
        },
        {
          interval: "year" as const,
          productId: year.productId,
          amount: Number(yearProduct.price?.price ?? 0) / 100,
          currency: String(yearProduct.price?.currency ?? fallback.year.currency),
        },
      ];
      await ctx.runMutation(internal.billing.saveBillingPrices, { prices });
      return {
        month: { amount: prices[0].amount, currency: prices[0].currency, available: true },
        year: { amount: prices[1].amount, currency: prices[1].currency, available: true },
      };
    } catch (error) {
      console.error("[billing] could not load Dodo product prices", error);
      return {
        month: {
          amount: cachedMonth?.amount ?? fallback.month.amount,
          currency: cachedMonth?.currency ?? fallback.month.currency,
          available: Boolean(month.productId),
        },
        year: {
          amount: cachedYear?.amount ?? fallback.year.amount,
          currency: cachedYear?.currency ?? fallback.year.currency,
          available: Boolean(year.productId),
        },
      };
    }
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
    interval: v.union(v.literal("month"), v.literal("year")),
    returnUrl: v.optional(v.string()),
    cancelUrl: v.optional(v.string()),
  },
  returns: v.object({ checkout_url: v.string() }),
  handler: async (ctx, args) => {
    const user = await requireIdentityUser(ctx);
    const price = productForInterval(args.interval as BillingInterval);
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
          plan: BILLING_PLAN_ID,
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
  args: { interval: v.union(v.literal("month"), v.literal("year")) },
  returns: v.object({ ok: v.boolean(), interval: v.union(v.literal("month"), v.literal("year")) }),
  handler: async (ctx, args) => {
    const user = await requireIdentityUser(ctx);
    const subscription = await activeSubscriptionForAction(ctx, user);
    const price = productForInterval(args.interval as BillingInterval);
    if (!price.available || !price.productId) throw new Error("That billing interval is not available yet.");
    if (subscription.interval === args.interval) return { ok: true, interval: args.interval };

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
      interval: args.interval,
      cancelAtPeriodEnd: false,
    });
    return { ok: true, interval: args.interval };
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
    interval: v.union(v.literal("month"), v.literal("year")),
    cancelAtPeriodEnd: v.boolean(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.subscriptionId);
    if (!existing) return null;
    const price = productForInterval(args.interval);
    await ctx.db.patch(args.subscriptionId, {
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

    const interval =
      intervalForProductId(args.productId) ??
      (metadata.interval === "year" ? "year" : "month");
    const patch = {
      user_id: user._id,
      dodo_customer_id: args.customerId,
      dodo_subscription_id: args.subscriptionId,
      product_id: args.productId,
      plan: BILLING_PLAN_ID,
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
