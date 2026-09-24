"use client";

import { X } from "lucide-react";
import { ReactNode } from "react";

interface ModalShellProps {
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: ReactNode;
  /** Footer row — typically Cancel on the left and the gradient submit on the right. */
  footer?: ReactNode;
  maxWidth?: string;
  /** Hairline under the title. View-only skill modals omit it to match Figma. */
  headerBorder?: boolean;
}

/** Dark glass dialog shell shared by every profile add/edit modal. */
export function ModalShell({
  title,
  subtitle,
  onClose,
  children,
  footer,
  maxWidth = "max-w-[560px]",
  headerBorder = true,
}: ModalShellProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-2.5 sm:p-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-sm"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className={`relative flex max-h-[calc(100dvh-1.5rem)] sm:max-h-[90vh] w-full ${maxWidth} flex-col overflow-hidden rounded-[20px] sm:rounded-[24px] border border-white/10 bg-[#0c0c1a] text-white shadow-2xl overscroll-contain`}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 sm:right-5 sm:top-5 z-10 flex size-8 sm:size-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-white/60 transition-colors hover:text-white"
        >
          <X className="size-4" />
        </button>

        <div className={`px-5 sm:px-7 pb-4 sm:pb-5 pt-5 sm:pt-6 ${headerBorder ? "border-b border-white/8" : "pr-14 sm:pr-16"}`}>
          <h2 className="text-lg sm:text-xl font-bold text-white">{title}</h2>
          {subtitle && <p className="mt-1 text-xs sm:text-sm text-white/50">{subtitle}</p>}
        </div>

        <div className={`flex-1 overflow-y-auto px-5 sm:px-7 overscroll-contain ${headerBorder ? "py-5 sm:py-6 pb-8" : "pb-8 pt-1"}`}>
          {children}
        </div>

        {footer && (
          <div className="flex items-center justify-between gap-2 sm:gap-3 border-t border-white/8 px-4 sm:px-7 py-3 sm:py-4">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

/** Gradient primary action used by modal footers and the editor Publish button. */
export function GradientButton({
  children,
  onClick,
  disabled,
  type = "button",
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  type?: "button" | "submit";
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className="rounded-full bg-gradient-to-r from-[#7c2ff3] to-[#d73e9d] px-4 sm:px-7 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold text-white whitespace-nowrap transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {children}
    </button>
  );
}

export function GhostButton({
  children,
  onClick,
  disabled,
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="rounded-full border border-white/15 bg-white/[0.03] px-3.5 sm:px-6 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold text-white/80 whitespace-nowrap transition-colors hover:bg-white/[0.08] disabled:opacity-50"
    >
      {children}
    </button>
  );
}
