"use client";

import { ArrowRight } from "lucide-react";
import type { ReactNode } from "react";

export interface SetupBannerProps {
  title?: string;
  description: string;
  actionLabel: string;
  onAction: () => void;
  /** Optional supporting note, kept visually subordinate to the description. */
  note?: ReactNode;
  className?: string;
}

/**
 * Reusable call-to-action banner used across job discovery pages. The copy is
 * supplied by each page; the visual treatment stays consistent.
 */
export function SetupBanner({ title, description, actionLabel, onAction, note, className = "" }: SetupBannerProps) {
  return (
    <section className={`relative overflow-hidden rounded-[24px] border border-white/[0.09] bg-[#0a0a14] ${className}`}>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(124,47,243,0.13),transparent_55%),radial-gradient(ellipse_at_bottom_right,rgba(34,211,238,0.06),transparent_50%)]" />
      <div className="relative flex flex-col gap-4 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:px-6">
        <div className="min-w-0">
          {title && <p className="text-sm font-semibold text-white">{title}</p>}
          {description && <p className={`mt-1 max-w-2xl leading-relaxed  ${title ? "mt-1 text-xs  text-white/45" : "mt-0 text-[13px] text-white/50 sm:text-sm"}`}>{description}</p>}
          {note && <p className="mt-2 text-[11px] leading-relaxed text-white/35">{note}</p>}
        </div>
        <button
          type="button"
          onClick={onAction}
          className="inline-flex w-full shrink-0 items-center justify-center gap-1.5 rounded-full bg-gradient-to-r from-[#7c2ff3] to-[#d73e9d] px-5 py-2.5 text-xs font-semibold text-white transition hover:brightness-110 sm:w-auto"
        >
          {actionLabel}
          <ArrowRight className="size-3.5" />
        </button>
      </div>
    </section>
  );
}
