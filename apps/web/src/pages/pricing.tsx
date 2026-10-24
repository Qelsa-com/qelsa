"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useChangePlanAction, useCreateCheckoutAction, useGetLivePricesAction, useGetMyBillingQuery, useGetPlansQuery, type BillingInterval, type BillingPlanId, type LivePlanPrices } from "@/features/api/billingApi";
import { EMPLOYER_PRICING_HEADER, renderPlanFeatures } from "@/lib/employerPlanCopy";
import { toastUnknownError } from "@/lib/errors";
import type { BillingPlan, MyBilling } from "@/types/billing";
import { ArrowRight, Check, Loader2, Sparkles } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import Layout from "../layout";

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

export default function PricingPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const isRecruiter = isAuthenticated && user?.account_type === "recruiter";
  const { data: plansData, isLoading: plansLoading } = useGetPlansQuery({
    audience: isRecruiter ? "employer" : "candidate",
  });
  const { data: billingData } = useGetMyBillingQuery({ skip: !isAuthenticated });
  const [getLivePrices, { isLoading: pricesLoading }] = useGetLivePricesAction();
  const [createCheckout, { isLoading: isCheckingOut }] = useCreateCheckoutAction();
  const [changePlan, { isLoading: isChangingPlan }] = useChangePlanAction();
  const [interval, setInterval] = useState<BillingInterval>("month");
  const [livePrices, setLivePrices] = useState<LivePlanPrices | null>(null);

  const billing = billingData as MyBilling | undefined;
  const currentPlanId = billing?.plan_id ?? null;
  const currentInterval = billing?.subscription?.interval ?? null;
  const manualOnly = Boolean(billing?.manual_pro && !billing?.subscription);
  const billingLoading = isAuthenticated && billingData === undefined;
  const plans = ((plansData as { plans?: BillingPlan[] } | undefined)?.plans ?? []) as BillingPlan[];

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

  useEffect(() => {
    if (billing?.subscription?.interval) setInterval(billing.subscription.interval);
  }, [billing?.subscription?.interval]);

  useEffect(() => {
    if (authLoading || isAuthenticated) return;
    router.replace(`/auth?returnUrl=${encodeURIComponent("/pricing")}`);
  }, [authLoading, isAuthenticated, router]);

  const handlePlan = async (planId: BillingPlanId) => {
    if (!isAuthenticated) {
      router.push(`/auth?returnUrl=${encodeURIComponent("/pricing")}`);
      return;
    }

    const price = livePrices?.[planId]?.[interval] ?? plans.find((plan) => plan.id === planId)?.prices[interval];
    if (!price?.available) {
      toastUnknownError(new Error("This plan is not available yet."), "This plan is not available yet.");
      return;
    }

    if (billing?.plan_id) {
      if (billing.plan_id === planId && billing.subscription?.interval === interval) return;
      if (manualOnly) {
        toastUnknownError(new Error("Your Pro access is managed by the Qelsa team."), "Your Pro access is managed by the Qelsa team.");
        return;
      }
      try {
        await changePlan({ plan: planId, interval }).unwrap();
        const target = plans.find((plan) => plan.id === planId)?.name ?? "your plan";
        toast.success(`Switched to ${target} · ${interval === "year" ? "yearly" : "monthly"} billing.`);
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
        cancelUrl: "/pricing",
      }).unwrap();
      window.location.href = result.checkout_url;
    } catch (error) {
      toastUnknownError(error, "Could not start checkout. Please try again.");
    }
  };

  const isBusy = isCheckingOut || isChangingPlan || authLoading || billingLoading || pricesLoading;

  if (authLoading || !isAuthenticated) {
    return (
      <Layout activeSection="pricing">
        <div className="flex min-h-screen items-center justify-center bg-[#06060f]">
          <Loader2 className="size-5 animate-spin text-white/35" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout activeSection="pricing">
      <main className="relative min-h-screen overflow-hidden bg-[#06060f] text-white">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 top-0 h-[520px] w-[760px] -translate-x-1/2 rounded-full bg-neon-purple/[0.12] blur-[150px]" />
          <div className="absolute bottom-0 right-0 h-[360px] w-[360px] rounded-full bg-neon-cyan/[0.06] blur-[120px]" />
        </div>

        <div className="relative mx-auto w-full max-w-6xl px-6 py-16 sm:py-24">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-[11px] font-mono font-semibold uppercase tracking-[0.2em] text-neon-cyan">{isRecruiter ? EMPLOYER_PRICING_HEADER.eyebrow : "Qelsa plans"}</p>
            <h1 className="mt-4 text-4xl font-extrabold tracking-[-0.03em] sm:text-5xl">{isRecruiter ? EMPLOYER_PRICING_HEADER.title : "Choose your pace."}</h1>
            <p className="mt-4 text-sm leading-relaxed text-white/55 sm:text-base">{isRecruiter ? EMPLOYER_PRICING_HEADER.description : "Start with Plus for the essentials, or go Pro for deeper prep and more Agent time."}</p>
          </div>

          <div className="mt-10 flex justify-center">
            <div className="inline-flex rounded-full border border-white/10 bg-white/[0.03] p-1">
              <button type="button" onClick={() => setInterval("month")} className={`rounded-full px-5 py-2 text-xs font-semibold transition ${interval === "month" ? "bg-white text-[#06060f]" : "text-white/55 hover:text-white"}`}>
                Monthly
              </button>
              <button type="button" onClick={() => setInterval("year")} className={`rounded-full px-5 py-2 text-xs font-semibold transition ${interval === "year" ? "bg-white text-[#06060f]" : "text-white/55 hover:text-white"}`}>
                Yearly
              </button>
            </div>
          </div>

          {plansLoading ? (
            <div className="mx-auto mt-10 grid max-w-[860px] gap-5 lg:grid-cols-2">
              <div className="h-[460px] animate-pulse rounded-[28px] border border-white/[0.08] bg-white/[0.025]" />
              <div className="h-[460px] animate-pulse rounded-[28px] border border-white/[0.08] bg-white/[0.025]" />
            </div>
          ) : (
            <div className="mx-auto mt-10 grid max-w-[860px] gap-5 lg:grid-cols-2">
              {plans.map((plan) => {
                const isPro = plan.id === "pro";
                const isCurrent = currentPlanId === plan.id;
                const planFeatures = renderPlanFeatures(plan.features, plan.limits);
                const price = livePrices?.[plan.id]?.[interval] ?? plan.prices[interval];
                const awaitingLivePrice = pricesLoading && !livePrices;
                const currentIntervalPrice = livePrices?.[plan.id]?.[currentInterval ?? "month"] ?? plan.prices[currentInterval ?? "month"];
                const planPrices = livePrices?.[plan.id];
                const saving = planPrices?.month.amount && planPrices?.year.amount ? Math.max(0, Math.round((1 - planPrices.year.amount / Math.max(1, planPrices.month.amount * 12)) * 100)) : 0;
                const samePlanSameInterval = isCurrent && currentInterval === interval;
                const label = !isAuthenticated
                  ? `Get ${plan.name.replace("Qelsa ", "")}`
                  : samePlanSameInterval
                    ? "Current plan"
                    : isCurrent
                      ? `Switch to ${interval === "year" ? "yearly" : "monthly"}`
                      : currentPlanId
                        ? `Switch to ${plan.name}`
                        : plan.id === "plus"
                          ? "Choose Plus"
                          : "Upgrade to Pro";

                return (
                  <section
                    key={plan.id}
                    className={`relative mx-auto w-full max-w-[420px] overflow-hidden rounded-[28px] p-7 sm:p-9 ${
                      isPro ? "border border-neon-purple/30 bg-[#0c0917] shadow-[0_0_80px_-30px_rgba(124,47,243,0.55)]" : "border border-white/[0.08] bg-white/[0.025]"
                    } ${isCurrent ? "ring-1 ring-neon-cyan/50" : ""}`}
                  >
                    {isPro ? (
                      <div
                        aria-hidden
                        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(124,47,243,0.2),transparent_55%),radial-gradient(ellipse_at_bottom_left,rgba(34,211,238,0.08),transparent_50%)]"
                      />
                    ) : null}
                    <div className="relative">
                      <div className="flex items-center justify-between gap-3">
                        <p className={`text-xs font-semibold uppercase tracking-[0.16em] ${isPro ? "text-neon-cyan" : "text-white/40"}`}>{plan.id}</p>
                        {isCurrent ? (
                          <span className="rounded-full border border-neon-cyan/30 bg-neon-cyan/10 px-2.5 py-1 text-[10px] font-semibold text-neon-cyan">Current plan</span>
                        ) : isPro ? (
                          <span className="inline-flex items-center gap-1 rounded-full border border-neon-purple/30 bg-neon-purple/10 px-2.5 py-1 text-[10px] font-semibold text-neon-purple">
                            <Sparkles className="size-3" />
                            Recommended
                          </span>
                        ) : null}
                      </div>

                      <h2 className="mt-3 text-2xl font-bold">{plan.name}</h2>
                      <p className="mt-2 text-sm leading-relaxed text-white/55">{plan.description}</p>

                      <div className="mt-8 flex items-end gap-1.5">
                        <span className="text-4xl font-extrabold">{awaitingLivePrice ? "—" : formatPrice(price?.amount ?? 0, price?.currency ?? "USD")}</span>
                        <span className="pb-1 text-sm text-white/40">/{interval}</span>
                      </div>
                      <p className="mt-1 text-xs text-white/35">
                        {interval === "year" ? "Billed yearly" : "Billed monthly"} · Cancel anytime
                        {saving > 0 ? <span className="ml-1 text-emerald-400">Save {saving}%</span> : null}
                      </p>

                      {isCurrent && currentInterval ? (
                        <p className="mt-2 text-[11px] text-white/35">
                          You are billed {formatPrice(currentIntervalPrice.amount, currentIntervalPrice.currency)} / {currentInterval}.
                        </p>
                      ) : null}

                      <ul className="mt-8 space-y-3">
                        {planFeatures.map((feature) => (
                          <li key={feature} className="flex items-start gap-2.5 text-sm text-white/75">
                            <span className={`mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full ${isPro ? "bg-neon-cyan/15 text-neon-cyan" : "bg-white/[0.06] text-white/50"}`}>
                              <Check className="size-3" />
                            </span>
                            {feature}
                          </li>
                        ))}
                      </ul>

                      <button
                        type="button"
                        onClick={() => void handlePlan(plan.id)}
                        disabled={isBusy || samePlanSameInterval || !price?.available || manualOnly}
                        className={`mt-9 inline-flex w-full items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-45 ${
                          isPro ? "bg-gradient-to-r from-[#623dd6] via-[#8433ae] to-[#be2680] text-white hover:opacity-95" : "border border-white/15 bg-white/[0.04] text-white hover:bg-white/[0.08]"
                        }`}
                      >
                        {pricesLoading || isCheckingOut || isChangingPlan ? <Loader2 className="size-4 animate-spin" /> : null}
                        {pricesLoading ? "Loading plans…" : !price?.available ? "Coming soon" : samePlanSameInterval ? "Current plan" : label}
                        {!isCheckingOut && !isChangingPlan && !pricesLoading && price?.available && !samePlanSameInterval ? <ArrowRight className="size-4" /> : null}
                      </button>
                      {manualOnly ? <p className="mt-3 text-center text-[11px] text-white/30">Managed by the Qelsa team.</p> : null}
                    </div>
                  </section>
                );
              })}
            </div>
          )}

          <p className="mt-10 text-center text-xs leading-relaxed text-white/30">
            Need the free plan?{" "}
            <Link href={isAuthenticated ? (isRecruiter ? "/jobs/posted" : "/") : `/auth?returnUrl=${encodeURIComponent("/")}`} className="text-white/50 underline underline-offset-2 hover:text-white">
              Start free
            </Link>
          </p>
        </div>
      </main>
    </Layout>
  );
}
