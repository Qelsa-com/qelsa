export type BillingInterval = "month" | "year";
export type BillingPlanId = "plus" | "pro";

export type BillingPrice = {
  interval: BillingInterval;
  productId: string;
  amount: number;
  currency: string;
  available: boolean;
};

export type BillingPlan = {
  id: BillingPlanId;
  name: string;
  description: string;
  features: string[];
  prices: Record<BillingInterval, BillingPrice>;
};

export type BillingSubscription = {
  id: string;
  subscription_id: string;
  plan: BillingPlanId;
  interval: BillingInterval;
  status: "pending" | "active" | "on_hold" | "paused" | "cancelled" | "failed" | "expired";
  quantity: number;
  currency: string;
  recurring_amount: number;
  current_period_start: number | null;
  current_period_end: number | null;
  cancel_at_period_end: boolean;
  cancelled_at: number | null;
  is_entitled: boolean;
};

export type MyBilling = {
  plans: BillingPlan[];
  plan: BillingPlan;
  plan_id: BillingPlanId | null;
  subscription: BillingSubscription | null;
  is_pro: boolean;
  manual_pro: boolean;
  has_customer: boolean;
  agent_daily_limit: number;
};
