"use client";

import { useAuth } from "@/contexts/AuthContext";
import {
  useChangePlanAction,
  useCreateCheckoutAction,
  useGetLivePricesAction,
  useGetMyBillingQuery,
  type BillingInterval,
  type BillingPlanId,
  type LivePlanPrices,
} from "@/features/api/billingApi";
import { toastUnknownError } from "@/lib/errors";
import type { MyBilling } from "@/types/billing";
import { ArrowRight, Check, Loader2, Sparkles, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export type UpgradeReason = "applications" | "agent";

const COPY: Record<UpgradeReason, { eyebrow: string; title: string; description: string; used: string }> = {
  applications: {
    eyebrow: "Free application used",
    title: "Ready to apply to more roles?",
    description: "Paid plans remove the application cap so you can keep moving while your search is hot.",
    used: "1 active application",
  },
  agent: {
    eyebrow: "Message limit reached",
    title: "Keep the conversation going.",
    description: "Upgrade for more Qelsa Agent time. Plus is lighter; Pro goes deeper.",
    used: "5 Qelsa Agent messages per day",
  },
};

const PLAN_NAMES: Record<BillingPlanId, string> = {
  plus: "Qelsa Plus",
  pro: "Qelsa Pro",
};

const PLAN_FEATURES: Record<BillingPlanId, string[]> = {
  plus: ["Unlimited job applications", "100 Agent messages/day", "Readiness reports", "Skill-gap analysis"],
  pro: ["Unlimited job applications", "500 Agent messages/day", "Advanced readiness reports", "Mock interviews + priority matching"],
};

function formatPrice(amount: number, currency: string) {
  if (!amount) return "—";
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

export function SubscriptionUpgradeModal({
  open,
  reason,
  onClose,
}: {
  open: boolean;
  reason: UpgradeReason;
  onClose: () => void;
}) {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const { data: billingData } = useGetMyBillingQuery({ skip: !isAuthenticated });
  const [getLivePrices, { isLoading: pricesLoading }] = useGetLivePricesAction();
  const [createCheckout, { isLoading: isCheckingOut }] = useCreateCheckoutAction();
  const [changePlan, { isLoading: isChangingPlan }] = useChangePlanAction();
  const [planId, setPlanId] = useState<BillingPlanId>("pro");
  const [interval, setInterval] = useState<BillingInterval>("month");
  const [livePrices, setLivePrices] = useState<LivePlanPrices | null>(null);
  const copy = COPY[reason];
  const billing = billingData as MyBilling | undefined;
  const currentPlanId = billing?.plan_id ?? null;
  const currentInterval = billing?.subscription?.interval ?? null;
  const manualOnly = Boolean(billing?.manual_pro && !billing?.subscription);
  const billingLoading = isAuthenticated && billing === undefined;

  useEffect(() => {
    if (!open) return;
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
  }, [open]);

  useEffect(() => {
    if (currentPlanId === "plus") setPlanId("pro");
    if (currentInterval) setInterval(currentInterval);
  }, [currentPlanId, currentInterval]);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const price = livePrices?.[planId]?.[interval];
  const planPrices = livePrices?.[planId];
  const yearlySaving =
    planPrices?.month.amount && planPrices?.year.amount && planPrices.month.amount > 0
      ? Math.max(0, Math.round((1 - planPrices.year.amount / (planPrices.month.amount * 12)) * 100))
      : 0;
  const isCurrent = currentPlanId === planId && currentInterval === interval;
  const busy = isCheckingOut || isChangingPlan;

  const handleUpgrade = async () => {
    if (!isAuthenticated) {
      onClose();
      router.push(`/auth?returnUrl=${encodeURIComponent("/pricing")}`);
      return;
    }
    if (billingLoading) return;
    if (!price?.available) {
      onClose();
      router.push("/pricing");
      return;
    }
    if (manualOnly) {
      toast.error("Your Pro access is managed by the Qelsa team.");
      return;
    }

    if (currentPlanId) {
      if (isCurrent) return;
      try {
        await changePlan({ plan: planId, interval }).unwrap();
        toast.success(`Switched to ${PLAN_NAMES[planId]} · ${interval === "year" ? "yearly" : "monthly"}.`);
        onClose();
      } catch (error) {
        toastUnknownError(error, "Could not change your plan. Please try again.");
      }
      return;
    }

    try {
      const result = await createCheckout({
        plan: planId,
        interval,
        returnUrl: "/settings?billing=success",
        cancelUrl:
          typeof window !== "undefined"
            ? `${window.location.pathname}${window.location.search}`
            : "/pricing",
      }).unwrap();
      window.location.href = result.checkout_url;
    } catch (error) {
      toastUnknownError(error, "Could not start checkout. Please try again.");
    }
  };

  const ctaLabel = isCurrent
    ? "Current plan"
    : currentPlanId
    ? `Switch to ${PLAN_NAMES[planId]}`
    : `Choose ${PLAN_NAMES[planId]}`;
  const footnote =
    currentPlanId === "plus"
      ? "Plus includes 100 Agent messages per day. Pro raises it to 500."
      : currentPlanId === "pro"
      ? "Pro includes 500 Agent messages per day."
      : `Your free plan includes ${copy.used}.`;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="upgrade-title"
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative max-h-[92vh] w-full max-w-[480px] overflow-y-auto rounded-[26px] border border-white/12 bg-[#080a14] text-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute -right-24 -top-28 size-64 rounded-full bg-neon-purple/25 blur-[80px]" />
          <div className="absolute -bottom-28 -left-24 size-64 rounded-full bg-neon-cyan/10 blur-[80px]" />
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 z-10 flex size-8 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-white/55 transition-colors hover:text-white"
        >
          <X className="size-4" />
        </button>

        <div className="relative p-6 sm:p-7">
          <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-neon-cyan">
            <span className="flex size-7 items-center justify-center rounded-full border border-neon-cyan/30 bg-neon-cyan/10">
              <Sparkles className="size-3.5" />
            </span>
            {copy.eyebrow}
          </div>

          <h2 id="upgrade-title" className="mt-4 max-w-[360px] text-2xl font-extrabold leading-tight tracking-[-0.02em]">
            {copy.title}
          </h2>
          <p className="mt-2.5 text-sm leading-relaxed text-white/55">{copy.description}</p>

          <div className="mt-5 grid grid-cols-2 gap-2">
            {(["plus", "pro"] as const).map((option) => {
              const optionPrice = livePrices?.[option]?.[interval];
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => setPlanId(option)}
                  className={`rounded-xl border p-3 text-left transition ${
                    planId === option
                      ? "border-neon-cyan/50 bg-neon-cyan/[0.08]"
                      : "border-white/10 bg-white/[0.03] hover:border-white/25"
                  }`}
                >
                  <span className="block text-[10px] font-semibold uppercase tracking-[0.12em] text-white/40">
                    {option === "plus" ? "Lighter" : "Recommended"}
                  </span>
                  <span className="mt-1 flex items-baseline gap-1 text-sm font-bold text-white">
                    {PLAN_NAMES[option]}
                    <span className="text-[11px] font-normal text-white/40">
                      {optionPrice ? formatPrice(optionPrice.amount, optionPrice.currency) : pricesLoading ? "…" : "—"}/{interval}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>

          <div className="mt-4 inline-flex rounded-full border border-white/10 bg-white/[0.03] p-1">
            <button type="button" onClick={() => setInterval("month")} className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${interval === "month" ? "bg-white text-[#06060f]" : "text-white/55 hover:text-white"}`}>
              Monthly
            </button>
            <button type="button" onClick={() => setInterval("year")} className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${interval === "year" ? "bg-white text-[#06060f]" : "text-white/55 hover:text-white"}`}>
              Yearly
              {yearlySaving > 0 ? <span className="ml-1.5 text-emerald-500">Save {yearlySaving}%</span> : null}
            </button>
          </div>

          <div className="mt-4 flex items-end gap-1.5">
            <span className="text-[34px] font-extrabold leading-none">{price ? formatPrice(price.amount, price.currency) : "—"}</span>
            <span className="pb-0.5 text-sm text-white/40">/{interval}</span>
            {interval === "year" ? <span className="pb-0.5 text-xs text-white/35">billed yearly</span> : null}
          </div>

          <ul className="mt-5 space-y-2.5">
            {PLAN_FEATURES[planId].map((feature) => (
              <li key={feature} className="flex items-start gap-2.5 text-[13px] text-white/75">
                <span className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full bg-neon-cyan/15 text-neon-cyan">
                  <Check className="size-3" />
                </span>
                {feature}
              </li>
            ))}
          </ul>

          <button
            type="button"
            onClick={() => void handleUpgrade()}
            disabled={busy || isCurrent || manualOnly || billingLoading || pricesLoading}
            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#623dd6] via-[#8433ae] to-[#be2680] px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-purple-900/30 transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busy || pricesLoading ? <Loader2 className="size-4 animate-spin" /> : null}
            {pricesLoading
              ? "Loading plans…"
              : busy
              ? "Updating…"
              : !price?.available
              ? "See plans"
              : ctaLabel}
            {!busy && !pricesLoading && price?.available && !isCurrent ? <ArrowRight className="size-4" /> : null}
          </button>

          <div className="mt-3 flex items-center justify-between gap-3">
            <button type="button" onClick={onClose} className="text-xs font-medium text-white/40 transition-colors hover:text-white/70">
              Maybe later
            </button>
            <button
              type="button"
              onClick={() => {
                onClose();
                router.push("/pricing");
              }}
              className="text-xs font-semibold text-neon-cyan underline-offset-2 hover:underline"
            >
              Compare plans
            </button>
          </div>

          <p className="mt-4 text-[10px] leading-relaxed text-white/25">
            {footnote} Cancel paid plans anytime from Settings.
          </p>
        </div>
      </div>
    </div>
  );
}
