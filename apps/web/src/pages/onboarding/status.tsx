"use client";

import { useUpdateProfileMutation } from "@/features/api/authApi";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

type JobSearchStatus = "actively_job_hunting" | "exploring_options" | "building_skills";

const OPTIONS: { value: JobSearchStatus; emoji: string; title: string; description: string }[] = [
  {
    value: "actively_job_hunting",
    emoji: "🎯",
    title: "Actively job hunting",
    description: "Ready to interview. Looking for the right role now.",
  },
  {
    value: "exploring_options",
    emoji: "🔭",
    title: "Exploring options",
    description: "Open to the right opportunity — not in a rush.",
  },
  {
    value: "building_skills",
    emoji: "📈",
    title: "Building skills for later",
    description: "Not looking yet, but tracking what the market wants.",
  },
];

const PRIMARY_BTN =
  "flex h-14 w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-gradient-to-r from-neon-purple to-neon-pink text-[15px] font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40";

export default function JobSearchStatusPage() {
  const router = useRouter();
  const [status, setStatus] = useState<JobSearchStatus | null>(null);
  const [updateProfile, { isLoading }] = useUpdateProfileMutation();

  const handleContinue = async () => {
    if (!status) return;
    try {
      await updateProfile({ job_search_status: status }).unwrap();
      router.push("/");
    } catch {
      toast.error("Could not save your choice. Please try again.");
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 py-10" style={{ background: "var(--background)" }}>
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-1/2 h-[540px] w-[540px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-neon-purple/10 blur-[130px]" />
      </div>

      <Image src="/qelsa-logo.svg" alt="Qelsa" width={91} height={29} priority unoptimized className="mb-8 h-[21px] w-auto" />

      <div className="w-full max-w-[460px]">
        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-8">
          <h2 className="text-3xl font-bold text-white">Where are you right now?</h2>
          <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">Honest answer helps us show the right roles and signal.</p>

          <div className="mt-6 space-y-3">
            {OPTIONS.map((option) => {
              const selected = status === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setStatus(option.value)}
                  aria-pressed={selected}
                  className={`flex w-full cursor-pointer items-start gap-3 rounded-2xl border p-5 text-left transition-colors ${
                    selected ? "border-neon-purple bg-neon-purple/10" : "border-white/10 bg-white/[0.02] hover:bg-white/[0.05]"
                  }`}
                >
                  <span className="mt-0.5 shrink-0 text-xl leading-none" aria-hidden>
                    {option.emoji}
                  </span>
                  <span className="flex-1">
                    <span className="block font-medium text-white">{option.title}</span>
                    <span className="mt-1 block text-sm leading-relaxed text-muted-foreground">{option.description}</span>
                  </span>
                  <span
                    className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition-colors ${
                      selected ? "border-neon-purple bg-neon-purple" : "border-white/25"
                    }`}
                  >
                    {selected && <CheckIcon />}
                  </span>
                </button>
              );
            })}
          </div>

          <button type="button" onClick={handleContinue} disabled={!status || isLoading} className={`mt-6 ${PRIMARY_BTN}`}>
            {isLoading ? "Saving…" : "Continue"}
            {!isLoading && <ArrowRight />}
          </button>
        </div>

        <button
          type="button"
          onClick={() => router.back()}
          className="mx-auto mt-6 flex cursor-pointer items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-white"
        >
          <ArrowLeft /> Back
        </button>
      </div>
    </div>
  );
}

/* ---------- Inline icons ---------- */

function ArrowRight() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  );
}
function ArrowLeft() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M19 12H5M12 19l-7-7 7-7" />
    </svg>
  );
}
function CheckIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M20 6L9 17l-5-5" />
    </svg>
  );
}
