"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useAlert } from "@/components/ui/alert-modal";
import { useCancelSubscriptionAction, useChangePlanAction, useCreateCheckoutAction, useGetLivePricesAction, useGetMyBillingQuery, useOpenCustomerPortalAction, type BillingInterval, type LivePlanPrices } from "@/features/api/billingApi";
import { toastUnknownError } from "@/lib/errors";
import { renderPlanFeatures } from "@/lib/employerPlanCopy";
import type { BillingSubscription, MyBilling } from "@/types/billing";
import { CalendarDays, Check, CreditCard, Loader2, RefreshCw, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

function formatAmount(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${currency} ${amount}`;
  }
}

function formatDate(timestamp: number | null) {
  if (!timestamp) return null;
  return new Date(timestamp).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function statusLabel(subscription: BillingSubscription) {
  if (subscription.cancel_at_period_end) return "Cancels at period end";
  switch (subscription.status) {
    case "active":
      return "Active";
    case "pending":
      return "Pending";
    case "on_hold":
      return "Payment on hold";
    case "paused":
      return "Paused";
    case "cancelled":
      return "Cancelled";
    case "expired":
      return "Expired";
    default:
      return "Inactive";
  }
}

export function BillingSettings() {
  const { user } = useAuth();
  const alert = useAlert();
  const { data, isLoading } = useGetMyBillingQuery({ skip: !user });
  const billing = data as MyBilling | undefined;
  const [interval, setInterval] = useState<BillingInterval>("month");
  const [getLivePrices] = useGetLivePricesAction();
  const [livePrices, setLivePrices] = useState<LivePlanPrices | null>(null);
  const [createCheckout, { isLoading: isCheckingOut }] = useCreateCheckoutAction();
  const [changePlan, { isLoading: isChanging }] = useChangePlanAction();
  const [setCancel, { isLoading: isCancelling }] = useCancelSubscriptionAction();
  const [openPortal, { isLoading: isOpeningPortal }] = useOpenCustomerPortalAction();

  useEffect(() => {
    if (billing?.subscription?.interval) setInterval(billing.subscription.interval);
  }, [billing?.subscription?.interval]);

  useEffect(() => {
    let cancelled = false;
    void getLivePrices()
      .unwrap()
      .then((prices) => {
        if (!cancelled) setLivePrices(prices);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  if (isLoading) {
    return (
      <section className="mb-8 rounded-2xl border border-glass-border glass p-6">
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          Loading billing…
        </div>
      </section>
    );
  }

  if (!billing) return null;

  const subscription = billing.subscription;
  const planId = billing.plan_id ?? "pro";
  const price = livePrices?.[planId]?.[interval] ?? billing.plan.prices[interval];
  const yearlyPrice = livePrices?.[planId]?.year ?? billing.plan.prices.year;
  const isPro = billing.is_pro;
  const isRecruiter = user?.account_type === "recruiter";
  const planDescription = billing.plan.description;
  const planFeatures = renderPlanFeatures(billing.plan.features, billing.plan.limits);
  const freeApplicationText =
    billing.free.application_limit === null
      ? "unlimited applications"
      : `${billing.free.application_limit} active application${billing.free.application_limit === 1 ? "" : "s"}`;
  const freePlanText = isRecruiter
    ? `Free includes ${billing.free.agent_daily_limit} Qelsa Agent messages per day.`
    : `Free includes ${freeApplicationText} and ${billing.free.agent_daily_limit} Qelsa Agent messages per day.`;
  const upgradePlanText = isRecruiter
    ? "Upgrade for more Agent time and applicant insight."
    : "Upgrade for more applications and Agent time.";
  const isCancelledAtEnd = Boolean(subscription?.cancel_at_period_end);

  const startCheckout = async () => {
    try {
      const result = await createCheckout({
        plan: planId,
        interval,
        returnUrl: "/settings?billing=success",
        cancelUrl: "/settings",
      }).unwrap();
      window.location.href = result.checkout_url;
    } catch (error) {
      toastUnknownError(error, "We're working on it. ");
    }
  };

  const switchInterval = async (next: BillingInterval) => {
    if (!subscription || next === subscription.interval) {
      setInterval(next);
      return;
    }
    const currentLabel = subscription.interval === "year" ? "yearly" : "monthly";
    const nextLabel = next === "year" ? "yearly" : "monthly";
    const confirmed = await alert({
      title: `Switch to ${nextLabel} billing?`,
      description: "Dodo may apply a prorated charge or credit when the interval changes.",
      confirmText: `Switch to ${nextLabel}`,
      cancelText: `Keep ${currentLabel}`,
    });
    if (!confirmed) return;
    try {
      await changePlan({ plan: subscription.plan, interval: next }).unwrap();
      setInterval(next);
      toast.success(`Billing switched to ${nextLabel}.`);
    } catch (error) {
      toastUnknownError(error, "Could not change your billing interval. Please try again.");
    }
  };

  const toggleCancellation = async () => {
    if (!subscription) return;
    const cancelling = !subscription.cancel_at_period_end;
    const confirmed = await alert({
      title: cancelling ? "Cancel subscription?" : "Resume subscription?",
      description: cancelling
        ? "You will keep access until the end of the current billing period. You can resume before it ends."
        : "You will be billed again on the next renewal date.",
      confirmText: cancelling ? "Cancel at period end" : "Resume subscription",
      cancelText: cancelling ? "Keep subscription" : "Not now",
      tone: cancelling ? "danger" : "default",
    });
    if (!confirmed) return;
    try {
      await setCancel({ cancel: cancelling }).unwrap();
      toast.success(cancelling ? "Subscription scheduled to cancel at period end." : "Subscription resumed.");
    } catch (error) {
      toastUnknownError(error, "Could not update the subscription. Please try again.");
    }
  };

  const managePayment = async () => {
    try {
      const result = await openPortal().unwrap();
      window.location.href = result.portal_url;
    } catch (error) {
      toastUnknownError(error, "Could not open the billing portal. Please try again.");
    }
  };

  return (
    <section className="mb-8 overflow-hidden rounded-2xl border border-glass-border glass">
      <div className="border-b border-glass-border/60 p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-neon-purple/20">
              <CreditCard className="h-5 w-5 text-neon-purple" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-bold text-white">Billing</h2>
                {isPro ? (
                  <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/25 bg-emerald-400/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-300">
                    <Sparkles className="size-3" />
                    {billing.plan_id === "plus" ? "Plus" : "Pro"}
                  </span>
                ) : (
                  <span className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white/40">Free</span>
                )}
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                {isPro && subscription
                  ? `${billing.plan.name} · ${subscription.interval === "year" ? "Yearly" : "Monthly"} billing`
                  : isPro && billing.manual_pro
                  ? "Complimentary Qelsa Pro access."
                  : `${freePlanText} ${upgradePlanText}`}
              </p>
            </div>
          </div>
          {billing.has_customer ? (
            <button
              type="button"
              onClick={() => void managePayment()}
              disabled={isOpeningPortal}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full border border-white/12 bg-white/[0.04] px-4 py-2 text-xs font-semibold text-white/75 transition hover:bg-white/[0.08] hover:text-white disabled:opacity-50"
            >
              {isOpeningPortal ? <Loader2 className="size-3.5 animate-spin" /> : <CreditCard className="size-3.5" />}
              Manage billing
            </button>
          ) : null}
        </div>

        {isPro && subscription ? (
          <div className="mt-5 grid gap-2 text-xs text-white/50 sm:grid-cols-3">
            <p className="flex items-center gap-2">
              <CalendarDays className="size-3.5 text-neon-cyan" />
              {subscription.cancel_at_period_end ? `Access until ${formatDate(subscription.current_period_end) ?? "period end"}` : `Renews ${formatDate(subscription.current_period_end) ?? "automatically"}`}
            </p>
            <p>{statusLabel(subscription)}</p>
            <p>Agent limit: {billing.agent_daily_limit}/day</p>
          </div>
        ) : isPro && billing.manual_pro ? (
          <div className="mt-5 grid gap-2 text-xs text-white/50 sm:grid-cols-2">
            <p>Granted by the Qelsa team</p>
            <p>Agent limit: {billing.agent_daily_limit}/day</p>
          </div>
        ) : null}
      </div>

      <div className="p-6">
        {isPro && subscription ? (
          <div className="space-y-5">
            <div>
              <p className="text-sm font-semibold text-white">{billing.plan.name}</p>
              <p className="mt-1 text-xs leading-relaxed text-white/45">{planDescription}</p>
              <ul className="mt-3 grid gap-2 text-xs text-white/60 sm:grid-cols-2">
                {planFeatures.map((feature) => (
                  <li key={feature} className="flex items-start gap-2">
                    <Check className="mt-0.5 size-3.5 shrink-0 text-neon-cyan" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/40">Billing interval</p>
              <div className="mt-2 inline-flex rounded-full border border-white/10 bg-white/[0.03] p-1">
                {(["month", "year"] as const).map((option) => {
                  const selected = subscription.interval === option;
                  return (
                    <button
                      key={option}
                      type="button"
                      onClick={() => void switchInterval(option)}
                      disabled={isChanging || selected}
                      className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${selected ? "bg-white text-[#06060f]" : "text-white/50 hover:text-white disabled:opacity-60"}`}
                    >
                      {option === "month" ? "Monthly" : "Yearly"}
                    </button>
                  );
                })}
              </div>
              {price ? (
                <p className="mt-2 text-xs text-white/35">
                  {formatAmount(price.amount, price.currency)} / {interval}. Changes may be prorated by Dodo.
                </p>
              ) : null}
            </div>

            <div className="flex flex-wrap gap-2 border-t border-white/[0.07] pt-5">
              <button
                type="button"
                onClick={() => void toggleCancellation()}
                disabled={isCancelling}
                className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold transition disabled:opacity-50 ${
                  isCancelledAtEnd ? "bg-emerald-400/10 text-emerald-300 hover:bg-emerald-400/15" : "border border-rose-400/25 bg-rose-400/[0.06] text-rose-300 hover:bg-rose-400/10"
                }`}
              >
                {isCancelling ? <Loader2 className="size-3.5 animate-spin" /> : <RefreshCw className="size-3.5" />}
                {isCancelledAtEnd ? "Resume subscription" : "Cancel subscription"}
              </button>
              {isCancelledAtEnd ? <span className="self-center text-xs text-white/35">You keep {billing.plan.name} access until the end of this period.</span> : null}
            </div>
          </div>
        ) : isPro && billing.manual_pro ? (
          <div className="rounded-xl border border-amber-300/20 bg-amber-300/[0.05] p-4">
            <p className="text-sm font-semibold text-white">Qelsa Pro is active</p>
            <p className="mt-1 text-xs leading-relaxed text-white/50">
              This access was granted by the Qelsa team, so there is nothing to pay and nothing to cancel.
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-white">{billing.plan.name}</p>
                <p className="mt-1 max-w-xl text-xs leading-relaxed text-white/45">{planDescription}</p>
              </div>
              <p className="text-2xl font-extrabold text-white">
                {formatAmount(price.amount, price.currency)}
                <span className="text-xs font-normal text-white/35">/{interval}</span>
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {(["month", "year"] as const).map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setInterval(option)}
                  className={`rounded-full border px-4 py-2 text-xs font-semibold transition ${interval === option ? "border-neon-purple/50 bg-neon-purple/15 text-white" : "border-white/10 bg-white/[0.03] text-white/50 hover:text-white"}`}
                >
                  {option === "month" ? "Monthly" : "Yearly"}
                  {option === "year" && yearlyPrice.amount > 0 ? ` · ${formatAmount(yearlyPrice.amount, yearlyPrice.currency)}` : null}
                </button>
              ))}
            </div>

            <ul className="grid gap-2 text-xs text-white/60 sm:grid-cols-2">
              {planFeatures.map((feature) => (
                <li key={feature} className="flex items-start gap-2">
                  <Check className="mt-0.5 size-3.5 shrink-0 text-neon-cyan" />
                  {feature}
                </li>
              ))}
            </ul>

            <button
              type="button"
              onClick={() => void startCheckout()}
              disabled={isCheckingOut || !price.available}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#623dd6] via-[#8433ae] to-[#be2680] px-5 py-2.5 text-xs font-bold text-white transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-45"
            >
              {isCheckingOut ? <Loader2 className="size-3.5 animate-spin" /> : <Sparkles className="size-3.5" />}
              {isCheckingOut ? "Opening checkout…" : price.available ? "Upgrade to Pro" : "Checkout coming soon"}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
