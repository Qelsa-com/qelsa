"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useCreateCheckoutAction, useGetLivePricesAction, useGetPlansQuery, type BillingInterval } from "@/features/api/billingApi";
import { toastUnknownError } from "@/lib/errors";
import type { BillingPlan } from "@/types/billing";
import { ArrowRight, Check, Loader2, Sparkles } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Layout from "../layout";

const FREE_FEATURES = [
  "1 active job application",
  "5 Qelsa Agent messages per day",
  "Job matching and readiness score",
  "Profile and resume tools",
];

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
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { data, isLoading } = useGetPlansQuery();
  const [getLivePrices] = useGetLivePricesAction();
  const [createCheckout, { isLoading: isCheckingOut }] = useCreateCheckoutAction();
  const [interval, setInterval] = useState<BillingInterval>("month");
  const [livePrices, setLivePrices] = useState<{
    month: { amount: number; currency: string; available: boolean };
    year: { amount: number; currency: string; available: boolean };
  } | null>(null);

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

  const plan = data?.plan as BillingPlan | undefined;
  const price = livePrices?.[interval] ?? plan?.prices?.[interval];
  const yearly = livePrices?.year ?? plan?.prices?.year;
  const monthly = livePrices?.month ?? plan?.prices?.month;
  const yearlySaving =
    monthly?.amount && yearly?.amount && monthly.amount > 0
      ? Math.max(0, Math.round((1 - yearly.amount / (monthly.amount * 12)) * 100))
      : 0;

  const handleCheckout = async () => {
    if (!isAuthenticated) {
      router.push(`/auth?returnUrl=${encodeURIComponent("/pricing")}`);
      return;
    }
    if (!price?.available) {
      toastUnknownError(new Error("Checkout is not configured yet."), "Checkout is not available yet. Please try again later.");
      return;
    }
    try {
      const result = await createCheckout({ interval, returnUrl: "/settings?billing=success" }).unwrap();
      window.location.href = result.checkout_url;
    } catch (error) {
      toastUnknownError(error, "Could not start checkout. Please try again.");
    }
  };

  return (
    <Layout activeSection="pricing">
      <main className="relative isolate min-h-screen overflow-hidden text-white">
        <div aria-hidden className="pointer-events-none fixed inset-0 -z-10">
          <div className="absolute left-1/2 top-0 h-[520px] w-[760px] -translate-x-1/2 rounded-full bg-neon-purple/[0.12] blur-[150px]" />
          <div className="absolute bottom-0 right-0 h-[360px] w-[360px] rounded-full bg-neon-cyan/[0.06] blur-[120px]" />
        </div>

        <div className="relative mx-auto w-full max-w-6xl px-6 py-16 sm:py-24">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-[11px] font-mono font-semibold uppercase tracking-[0.2em] text-neon-cyan">Qelsa Pro</p>
            <h1 className="mt-4 text-4xl font-extrabold tracking-[-0.03em] sm:text-5xl">A clearer path to your next role.</h1>
            <p className="mt-4 text-sm leading-relaxed text-white/55 sm:text-base">
              Start free. Upgrade when you want deeper readiness reports, interview practice, and more time with Qelsa Agent.
            </p>
          </div>

          <div className="mt-10 flex justify-center">
            <div className="inline-flex rounded-full border border-white/10 bg-white/[0.03] p-1">
              <button
                type="button"
                onClick={() => setInterval("month")}
                className={`rounded-full px-5 py-2 text-xs font-semibold transition ${interval === "month" ? "bg-white text-[#06060f]" : "text-white/55 hover:text-white"}`}
              >
                Monthly
              </button>
              <button
                type="button"
                onClick={() => setInterval("year")}
                className={`rounded-full px-5 py-2 text-xs font-semibold transition ${interval === "year" ? "bg-white text-[#06060f]" : "text-white/55 hover:text-white"}`}
              >
                Yearly
                {yearlySaving > 0 ? <span className="ml-2 text-emerald-500">Save {yearlySaving}%</span> : null}
              </button>
            </div>
          </div>

          <div className="mt-10 grid gap-5 lg:grid-cols-2">
            <section className="rounded-[28px] border border-white/[0.08] bg-white/[0.025] p-7 sm:p-9">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/40">Free</p>
              <h2 className="mt-3 text-2xl font-bold">Start with the essentials.</h2>
              <p className="mt-2 text-sm leading-relaxed text-white/45">See where you stand and keep your search moving.</p>
              <div className="mt-8 flex items-end gap-1">
                <span className="text-4xl font-extrabold">Free</span>
                <span className="pb-1 text-sm text-white/40">forever</span>
              </div>
              <ul className="mt-8 space-y-3">
                {FREE_FEATURES.map((feature) => (
                  <li key={feature} className="flex items-start gap-2.5 text-sm text-white/65">
                    <Check className="mt-0.5 size-4 shrink-0 text-white/30" />
                    {feature}
                  </li>
                ))}
              </ul>
              <button
                type="button"
                onClick={() => router.push(isAuthenticated ? "/" : `/auth?returnUrl=${encodeURIComponent("/pricing")}`)}
                className="mt-9 w-full rounded-full border border-white/12 bg-white/[0.03] px-5 py-3 text-sm font-semibold text-white/75 transition hover:border-white/20 hover:text-white"
              >
                {isAuthenticated ? "Go to My Space" : "Start free"}
              </button>
            </section>

            <section className="relative overflow-hidden rounded-[28px] border border-neon-purple/30 bg-[#0c0917] p-7 shadow-[0_0_80px_-30px_rgba(124,47,243,0.55)] sm:p-9">
              <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(124,47,243,0.2),transparent_55%),radial-gradient(ellipse_at_bottom_left,rgba(34,211,238,0.08),transparent_50%)]" />
              <div className="relative">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-neon-cyan">Pro</p>
                  <span className="inline-flex items-center gap-1 rounded-full border border-neon-purple/30 bg-neon-purple/10 px-2.5 py-1 text-[10px] font-semibold text-neon-purple">
                    <Sparkles className="size-3" />
                    Recommended
                  </span>
                </div>
                <h2 className="mt-3 text-2xl font-bold">{plan?.name ?? "Qelsa Pro"}</h2>
                <p className="mt-2 text-sm leading-relaxed text-white/55">
                  {plan?.description ?? "Go deeper on readiness, interviews, and the roles worth your time."}
                </p>
                <div className="mt-8 flex items-end gap-1.5">
                  <span className="text-4xl font-extrabold">
                    {isLoading ? "—" : formatPrice(price?.amount ?? 0, price?.currency ?? "INR")}
                  </span>
                  <span className="pb-1 text-sm text-white/40">/{interval}</span>
                </div>
                <p className="mt-1 text-xs text-white/35">
                  {interval === "year" ? "Billed once a year" : "Billed monthly"} · Cancel anytime
                </p>
                <ul className="mt-8 space-y-3">
                  {(plan?.features ?? []).map((feature) => (
                    <li key={feature} className="flex items-start gap-2.5 text-sm text-white/75">
                      <span className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full bg-neon-cyan/15 text-neon-cyan">
                        <Check className="size-3" />
                      </span>
                      {feature}
                    </li>
                  ))}
                </ul>
                <button
                  type="button"
                  onClick={() => void handleCheckout()}
                  disabled={isCheckingOut || authLoading || !price?.available}
                  className="mt-9 inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#623dd6] via-[#8433ae] to-[#be2680] px-5 py-3 text-sm font-bold text-white transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-45"
                >
                  {isCheckingOut ? <Loader2 className="size-4 animate-spin" /> : null}
                  {isCheckingOut ? "Opening checkout…" : price?.available ? "Upgrade to Pro" : "Checkout coming soon"}
                  {!isCheckingOut ? <ArrowRight className="size-4" /> : null}
                </button>
                {isAuthenticated ? (
                  <Link href="/settings" className="mt-4 block text-center text-xs text-white/40 underline-offset-2 hover:text-white hover:underline">
                    Manage your subscription in Settings
                  </Link>
                ) : null}
              </div>
            </section>
          </div>

          <p className="mt-10 text-center text-xs leading-relaxed text-white/30">
            Prices are shown in the billing currency configured for this deployment. Taxes and payment methods are handled securely by Dodo Payments.
          </p>
        </div>
      </main>
    </Layout>
  );
}
