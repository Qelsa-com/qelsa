/**
 * Single source of truth for the paid Qelsa Pro plan.
 *
 * Product IDs come from the Dodo Payments dashboard. Amounts are display
 * metadata only; Dodo remains authoritative for the actual charge. Keep the
 * amounts in sync with the products, or override them with Convex env vars.
 */

export const BILLING_PLAN_ID = "pro" as const;
export const FREE_APPLICATION_LIMIT = 1;
export const FREE_AGENT_DAILY_LIMIT = 5;
export const PRO_AGENT_DAILY_LIMIT = 500;

export type BillingInterval = "month" | "year";

export type BillingPrice = {
  interval: BillingInterval;
  productId: string;
  amount: number;
  currency: string;
  available: boolean;
};

export type PublicBillingPlan = {
  id: typeof BILLING_PLAN_ID;
  name: string;
  description: string;
  features: string[];
  prices: Record<BillingInterval, BillingPrice>;
};

const currency = (process.env.DODO_PRICE_CURRENCY ?? "USD").trim().toUpperCase();
// The live action reads these from Dodo. These values are only a fallback
// when the product API is unavailable; keep them at zero unless configured.
const monthlyAmount = Number(process.env.DODO_PRO_MONTHLY_PRICE ?? 0);
const yearlyAmount = Number(process.env.DODO_PRO_YEARLY_PRICE ?? 0);

const monthlyProductId = process.env.DODO_PRODUCT_PRO_MONTHLY?.trim() ?? "";
const yearlyProductId = process.env.DODO_PRODUCT_PRO_YEARLY?.trim() ?? "";

function safeAmount(value: number) {
  return Number.isFinite(value) && value > 0 ? value : 0;
}

export const BILLING_PLAN: PublicBillingPlan = {
  id: BILLING_PLAN_ID,
  name: "Qelsa Pro",
  description: "Go deeper on readiness, interviews, and the roles worth your time.",
  features: [
    "Unlimited job applications",
    "Advanced readiness reports",
    "Mock interview practice",
    "Advanced skill-gap analysis",
    "500 Qelsa Agent messages per day",
    "Priority job matching",
  ],
  prices: {
    month: {
      interval: "month",
      productId: monthlyProductId,
      amount: safeAmount(monthlyAmount),
      currency,
      available: Boolean(monthlyProductId),
    },
    year: {
      interval: "year",
      productId: yearlyProductId,
      amount: safeAmount(yearlyAmount),
      currency,
      available: Boolean(yearlyProductId),
    },
  },
};

export function productForInterval(interval: BillingInterval): BillingPrice {
  return BILLING_PLAN.prices[interval];
}

export function intervalForProductId(productId: string): BillingInterval | null {
  if (productId && productId === BILLING_PLAN.prices.month.productId) return "month";
  if (productId && productId === BILLING_PLAN.prices.year.productId) return "year";
  return null;
}

export function publicBillingPlan(): PublicBillingPlan {
  // Never return product IDs to the browser; checkout is resolved server-side.
  return {
    ...BILLING_PLAN,
    prices: {
      month: { ...BILLING_PLAN.prices.month, productId: "" },
      year: { ...BILLING_PLAN.prices.year, productId: "" },
    },
  };
}
