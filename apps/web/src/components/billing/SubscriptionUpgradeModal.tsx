"use client";

import { useAuth } from "@/contexts/AuthContext";
import {
  useCreateCheckoutAction,
  useGetLivePricesAction,
  type BillingInterval,
} from "@/features/api/billingApi";
import { toastUnknownError } from "@/lib/errors";
import { ArrowRight, Check, Loader2, Sparkles, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export type UpgradeReason = "applications" | "agent";

type LivePrices = {
  month: { amount: number; currency: string; available: boolean };
  year: { amount: number; currency: string; available: boolean };
};

const COPY: Record<
  UpgradeReason,
  { eyebrow: string; title: string; description: string; used: string }
> = {
  applications: {
    eyebrow: "Free application used",
    title: "Ready to apply to more roles?",
    description:
      "Your free plan includes one active application. Qelsa Pro removes the cap so you can keep applying while your search is hot.",
    used: "1 active application",
  },
  agent: {
    eyebrow: "Free messages used",
    title: "Keep the conversation going.",
    description:
      "Your free plan includes 5 Qelsa Agent messages per day. Upgrade to keep planning, tailoring, and applying with Qelsa Agent.",
    used: "5 Qelsa Agent messages per day",
  },
};

const PRO_FEATURES = [
  "Unlimited active job applications",
  "500 Qelsa Agent messages per day",
  "Advanced readiness reports",
  "Mock interview practice and skill-gap analysis",
  "Priority job matching",
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
  const [getLivePrices] = useGetLivePricesAction();
  const [createCheckout, { isLoading: isCheckingOut }] = useCreateCheckoutAction();
  const [interval, setInterval] = useState<BillingInterval>("month");
  const [livePrices, setLivePrices] = useState<LivePrices | null>(null);
  const copy = COPY[reason];

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    void getLivePrices()
      .unwrap()
      .then((prices) => {
        if (!cancelled) setLivePrices(prices as LivePrices);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const price = livePrices?.[interval];
  const yearly = livePrices?.year;
  const monthly = livePrices?.month;
  const yearlySaving =
    monthly?.amount && yearly?.amount && monthly.amount > 0
      ? Math.max(0, Math.round((1 - yearly.amount / (monthly.amount * 12)) * 100))
      : 0;

  const handleUpgrade = async () => {
    if (!isAuthenticated) {
      onClose();
      router.push(`/auth?returnUrl=${encodeURIComponent("/pricing")}`);
      return;
    }
    if (!price?.available) {
      onClose();
      router.push("/pricing");
      return;
    }
    try {
      const result = await createCheckout({
        interval,
        returnUrl: "/settings?billing=success",
      }).unwrap();
      window.location.href = result.checkout_url;
    } catch (error) {
      toastUnknownError(error, "Could not start checkout. Please try again.");
    }
  };

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

          <div className="mt-5 inline-flex rounded-full border border-white/10 bg-white/[0.03] p-1">
            <button
              type="button"
              onClick={() => setInterval("month")}
              className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${
                interval === "month" ? "bg-white text-[#06060f]" : "text-white/55 hover:text-white"
              }`}
            >
              Monthly
            </button>
            <button
              type="button"
              onClick={() => setInterval("year")}
              className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${
                interval === "year" ? "bg-white text-[#06060f]" : "text-white/55 hover:text-white"
              }`}
            >
              Yearly
              {yearlySaving > 0 ? <span className="ml-1.5 text-emerald-500">Save {yearlySaving}%</span> : null}
            </button>
          </div>

          <div className="mt-4 flex items-end gap-1.5">
            <span className="text-[34px] font-extrabold leading-none">
              {price ? formatPrice(price.amount, price.currency) : "—"}
            </span>
            <span className="pb-0.5 text-sm text-white/40">/{interval}</span>
            {interval === "year" ? <span className="pb-0.5 text-xs text-white/35">billed yearly</span> : null}
          </div>

          <ul className="mt-5 space-y-2.5">
            {PRO_FEATURES.map((feature) => (
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
            disabled={isCheckingOut}
            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#623dd6] via-[#8433ae] to-[#be2680] px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-purple-900/30 transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isCheckingOut ? <Loader2 className="size-4 animate-spin" /> : null}
            {isCheckingOut ? "Opening checkout…" : price?.available ? "Upgrade to Qelsa Pro" : "See Qelsa Pro plans"}
            {!isCheckingOut ? <ArrowRight className="size-4" /> : null}
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
            Your free plan includes {copy.used}. Cancel Qelsa Pro anytime from Settings.
          </p>
        </div>
      </div>
    </div>
  );
}
