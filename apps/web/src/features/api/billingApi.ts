"use client";

import { withUnwrap, useConvexQueryHook } from "@/lib/convexHooks";
import { api } from "@/lib/convexApi";
import { useAction } from "convex/react";
import { useState } from "react";

import type { PlanAudience } from "@/types/billing";

export type BillingInterval = "month" | "year";
export type BillingPlanId = "plus" | "pro";

type LivePlanPrice = { month: { amount: number; currency: string; available: boolean }; year: { amount: number; currency: string; available: boolean } };
export type LivePlanPrices = Record<BillingPlanId, LivePlanPrice>;

export function useGetPlansQuery(options?: { audience?: PlanAudience; skip?: boolean }) {
  return useConvexQueryHook(
    api.billing.getPlans,
    { audience: options?.audience ?? "candidate" },
    { skip: options?.skip },
  );
}

export function useGetMyBillingQuery(options?: { skip?: boolean }) {
  return useConvexQueryHook(api.billing.getMyBilling, {}, options);
}

export function useGetLivePricesAction() {
  const getLivePrices = useAction(api.billing.getLivePrices);
  const [isLoading, setIsLoading] = useState(false);
  const trigger = () => {
    setIsLoading(true);
    return withUnwrap(
      Promise.resolve(getLivePrices({}) as Promise<LivePlanPrices>).finally(() => setIsLoading(false)),
    );
  };
  return [trigger, { isLoading }] as const;
}

export function useCreateCheckoutAction() {
  const createCheckout = useAction(api.billing.createCheckout);
  const [isLoading, setIsLoading] = useState(false);
  const trigger = (input: { plan: BillingPlanId; interval: BillingInterval; returnUrl?: string; cancelUrl?: string }) => {
    setIsLoading(true);
    return withUnwrap(
      Promise.resolve(createCheckout(input) as Promise<{ checkout_url: string }>).finally(() => setIsLoading(false)),
    );
  };
  return [trigger, { isLoading }] as const;
}

export function useOpenCustomerPortalAction() {
  const openPortal = useAction(api.billing.openCustomerPortal);
  const [isLoading, setIsLoading] = useState(false);
  const trigger = () => {
    setIsLoading(true);
    return withUnwrap(
      Promise.resolve(openPortal({}) as Promise<{ portal_url: string }>).finally(() => setIsLoading(false)),
    );
  };
  return [trigger, { isLoading }] as const;
}

export function useChangePlanAction() {
  const changePlan = useAction(api.billing.changePlan);
  const [isLoading, setIsLoading] = useState(false);
  const trigger = (input: { plan: BillingPlanId; interval: BillingInterval }) => {
    setIsLoading(true);
    return withUnwrap(
      Promise.resolve(changePlan(input) as Promise<{ ok: boolean; plan: BillingPlanId; interval: BillingInterval }>).finally(() =>
        setIsLoading(false),
      ),
    );
  };
  return [trigger, { isLoading }] as const;
}

export function useCancelSubscriptionAction() {
  const setCancel = useAction(api.billing.setCancelAtPeriodEnd);
  const [isLoading, setIsLoading] = useState(false);
  const trigger = (input: { cancel: boolean }) => {
    setIsLoading(true);
    return withUnwrap(
      Promise.resolve(setCancel(input) as Promise<{ ok: boolean; cancel_at_period_end: boolean }>).finally(() =>
        setIsLoading(false),
      ),
    );
  };
  return [trigger, { isLoading }] as const;
}
