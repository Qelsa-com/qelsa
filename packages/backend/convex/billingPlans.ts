/**
 * Single source of truth for the paid Qelsa plans.
 *
 * Product IDs come from the Dodo Payments dashboard. Amounts are display
 * metadata only; Dodo remains authoritative for the actual charge. Keep the
 * amounts in sync with the products, or override them with Convex env vars.
 */

export type BillingPlanId = "plus" | "pro";
export type BillingInterval = "month" | "year";

export const FREE_APPLICATION_LIMIT = 1;
export const FREE_AGENT_DAILY_LIMIT = 5;
export const PLUS_AGENT_DAILY_LIMIT = 100;
export const PRO_AGENT_DAILY_LIMIT = 500;

export type BillingPrice = {
  interval: BillingInterval;
  productId: string;
  amount: number;
  currency: string;
  available: boolean;
};

export type BillingPlanLimits = {
  agent_daily_limit: number;
  application_limit: number | null;
};

export type PublicBillingPlan = {
  id: BillingPlanId;
  name: string;
  description: string;
  features: string[];
  limits: BillingPlanLimits;
  prices: Record<BillingInterval, BillingPrice>;
};

const currency = (process.env.DODO_PRICE_CURRENCY ?? "USD").trim().toUpperCase();

function safeAmount(value: number) {
  return Number.isFinite(value) && value > 0 ? value : 0;
}

function priceFor(
  interval: BillingInterval,
  productId: string | undefined,
  amount: string | undefined,
): BillingPrice {
  return {
    interval,
    productId: productId?.trim() ?? "",
    amount: safeAmount(Number(amount ?? 0)),
    currency,
    available: Boolean(productId?.trim()),
  };
}

export const BILLING_PLANS: Record<BillingPlanId, PublicBillingPlan> = {
  plus: {
    id: "plus",
    name: "Qelsa Plus",
    description: "More applications and Agent time at a lighter price.",
    features: [
      "{{application_benefit}}",
      "Readiness reports",
      "{{agent_benefit}}",
      "Skill-gap analysis",
    ],
    limits: {
      agent_daily_limit: PLUS_AGENT_DAILY_LIMIT,
      application_limit: null,
    },
    prices: {
      month: priceFor(
        "month",
        process.env.DODO_PRODUCT_PLUS_MONTHLY,
        process.env.DODO_PLUS_MONTHLY_PRICE,
      ),
      year: priceFor(
        "year",
        process.env.DODO_PRODUCT_PLUS_YEARLY,
        process.env.DODO_PLUS_YEARLY_PRICE,
      ),
    },
  },
  pro: {
    id: "pro",
    name: "Qelsa Pro",
    description: "Go deeper on readiness, interviews, and the roles worth your time.",
    features: [
      "{{application_benefit}}",
      "Advanced readiness reports",
      "Mock interview practice",
      "Advanced skill-gap analysis",
      "{{agent_benefit}}",
      "Priority job matching",
    ],
    limits: {
      agent_daily_limit: PRO_AGENT_DAILY_LIMIT,
      application_limit: null,
    },
    prices: {
      month: priceFor(
        "month",
        process.env.DODO_PRODUCT_PRO_MONTHLY,
        process.env.DODO_PRO_MONTHLY_PRICE,
      ),
      year: priceFor(
        "year",
        process.env.DODO_PRODUCT_PRO_YEARLY,
        process.env.DODO_PRO_YEARLY_PRICE,
      ),
    },
  },
};

/** Stock display order for pricing surfaces. */
export const BILLING_PLAN_ORDER: BillingPlanId[] = ["plus", "pro"];

export function productForPlan(plan: BillingPlanId, interval: BillingInterval): BillingPrice {
  return BILLING_PLANS[plan].prices[interval];
}

export function planForProductId(productId: string): {
  plan: BillingPlanId;
  interval: BillingInterval;
} | null {
  for (const plan of BILLING_PLAN_ORDER) {
    for (const interval of ["month", "year"] as const) {
      if (productId && BILLING_PLANS[plan].prices[interval].productId === productId) {
        return { plan, interval };
      }
    }
  }
  return null;
}

function withoutProductIds(plan: PublicBillingPlan): PublicBillingPlan {
  return {
    ...plan,
    prices: {
      month: { ...plan.prices.month, productId: "" },
      year: { ...plan.prices.year, productId: "" },
    },
  };
}

export function publicBillingPlans(): PublicBillingPlan[] {
  return BILLING_PLAN_ORDER.map((id) => withoutProductIds(BILLING_PLANS[id]));
}

export function publicBillingPlan(id: BillingPlanId): PublicBillingPlan {
  return withoutProductIds(BILLING_PLANS[id]);
}
