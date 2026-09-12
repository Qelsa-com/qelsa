"use client";

import { X } from "lucide-react";
import { useEffect } from "react";

interface ExternalApplyConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading?: boolean;
}

export function ExternalApplyConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  isLoading = false,
}: ExternalApplyConfirmModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="external-apply-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative flex w-full max-w-[420px] flex-col rounded-2xl border border-white/12 bg-[#0B0D17] p-6 text-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 id="external-apply-title" className="text-xl font-bold text-white">
            Did you apply?
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="text-white/50 transition-colors hover:text-white"
          >
            <X className="size-5" />
          </button>
        </div>

        <p className="mt-4 text-sm leading-relaxed text-white/60">
          It looks like you were redirected to external site to apply for this position. Did you complete your application there?
        </p>

        <div className="mt-6 flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-white/20 bg-transparent px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-white/5"
          >
            Not Yet
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className="gradient-primary rounded-full px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {isLoading ? "Recording…" : "Yes, I applied"}
          </button>
        </div>
      </div>
    </div>
  );
}
