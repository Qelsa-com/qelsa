"use client";

import type { AccountType } from "@/features/api/authApi";
import { ArrowRightIcon, CheckIcon } from "./OnboardingShell";
import { ONBOARDING_CARD, PRIMARY_BTN } from "./styles";

const ROLE_OPTIONS: { value: AccountType; title: string; description: string; Icon: () => React.ReactElement }[] = [
  {
    value: "seeker",
    title: "I'm looking for a job",
    description: "See roles matched to your skills and signal your readiness.",
    Icon: SearchIcon,
  },
  {
    value: "recruiter",
    title: "I'm hiring",
    description: "Find candidates who are ready now, not just available.",
    Icon: BuildingIcon,
  },
];

export function RoleStep({
  value,
  onChange,
  onContinue,
  isSaving,
}: {
  value: AccountType | null;
  onChange: (next: AccountType) => void;
  onContinue: () => void;
  isSaving?: boolean;
}) {
  return (
    <div className={ONBOARDING_CARD}>
      <h2 className="text-3xl font-bold text-white">Here&apos;s what to focus on.</h2>
      <p className="mt-2 text-[15px] text-muted-foreground">Pick your starting point — you can switch anytime.</p>

      <div className="mt-6 space-y-3">
        {ROLE_OPTIONS.map((option) => {
          const selected = value === option.value;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange(option.value)}
              aria-pressed={selected}
              className={`flex w-full cursor-pointer items-start gap-3 rounded-2xl border p-5 text-left transition-colors ${
                selected ? "border-neon-purple bg-neon-purple/10 shadow-[0_0_0_1px_rgba(124,58,237,0.35)]" : "border-white/10 bg-white/[0.02] hover:bg-white/[0.05]"
              }`}
            >
              <span className={`mt-0.5 shrink-0 ${selected ? "text-neon-purple" : "text-muted-foreground"}`}>
                <option.Icon />
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
                {selected ? <CheckIcon /> : null}
              </span>
            </button>
          );
        })}
      </div>

      <button type="button" onClick={onContinue} disabled={!value || isSaving} className={`mt-6 ${PRIMARY_BTN}`}>
        {isSaving ? "Saving…" : "Continue"}
        {!isSaving ? <ArrowRightIcon /> : null}
      </button>
    </div>
  );
}

function SearchIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}

function BuildingIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M3 21h18" />
      <path d="M5 21V5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v16" />
      <path d="M15 21V9h2a2 2 0 0 1 2 2v10" />
      <path d="M9 7h2M9 11h2M9 15h2" />
    </svg>
  );
}
