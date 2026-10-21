export type BillingInterval = "month" | "year";

export type BillingPrice = {
  interval: BillingInterval;
  productId: string;
  amount: number;
  currency: string;
  available: boolean;
};

export type BillingPlan = {
  id: "pro";
  name: string;
  description: string;
  features: string[];
  prices: Record<BillingInterval, BillingPrice>;
};

export type BillingSubscription = {
  id: string;
  subscription_id: string;
  plan: "pro";
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
  plan: BillingPlan;
  subscription: BillingSubscription | null;
  is_pro: boolean;
  has_customer: boolean;
  agent_daily_limit: number;
};
