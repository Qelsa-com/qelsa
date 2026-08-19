"use client";

import { useAuth } from "@/contexts/AuthContext";
import {
  useApplyParsedProfileMutation,
  useCompleteCandidateOnboardingMutation,
  type JobSeekingStatus,
} from "@/features/api/onboardingApi";
import { clearResumeDraft, readResumeDraft, writeResumeDraft, type ParsedProfile } from "@/lib/resumeDraft";
import { Target, Telescope, TrendingUp } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ResumeOnboardingFlow } from "./ResumeOnboardingFlow";
import { ArrowRightIcon, CheckIcon, OnboardingShell, StepProgress } from "./OnboardingShell";
import { ONBOARDING_CARD, PRIMARY_BTN } from "./styles";

const STATUS_OPTIONS: {
  value: JobSeekingStatus;
  title: string;
  description: string;
  Icon: typeof Target;
}[] = [
  {
    value: "actively_hunting",
    title: "Actively job hunting",
    description: "Ready to interview. Looking for the right role now.",
    Icon: Target,
  },
  {
    value: "exploring",
    title: "Exploring options",
    description: "Open to the right opportunity — not in a rush.",
    Icon: Telescope,
  },
  {
    value: "building_skills",
    title: "Building skills for later",
    description: "Not looking yet, but tracking what the market wants.",
    Icon: TrendingUp,
  },
];

type Step = "resume" | "intent" | "ready";

export function CandidateOnboarding({ onBack, onComplete }: { onBack: () => void; onComplete: () => void }) {
  const router = useRouter();
  const { user } = useAuth();
  const [step, setStep] = useState<Step | null>(null);
  const [startedFromDraft, setStartedFromDraft] = useState(false);
  const [status, setStatus] = useState<JobSeekingStatus | null>(null);
  const [complete, { isLoading }] = useCompleteCandidateOnboardingMutation();
  const [applyProfile] = useApplyParsedProfileMutation();

  useEffect(() => {
    const reviewed = Boolean(readResumeDraft()?.reviewed);
    setStartedFromDraft(reviewed);
    setStep(reviewed ? "intent" : "resume");
  }, []);

  const saveResume = async (parsed: { profile: ParsedProfile; storageId?: string; filename?: string }) => {
    await applyProfile({
      profile: parsed.profile,
      storage_id: parsed.storageId,
      filename: parsed.filename,
    }).unwrap();
    writeResumeDraft({
      profile: parsed.profile,
      storageId: parsed.storageId,
      filename: parsed.filename,
      reviewed: true,
    });
    setStep("intent");
  };

  const finish = async () => {
    if (!status) return;
    const draft = readResumeDraft();
    if (draft?.reviewed) {
      await applyProfile({
        profile: draft.profile,
        storage_id: draft.storageId,
        filename: draft.filename,
      }).unwrap();
    }
    await complete({ job_seeking_status: status }).unwrap();
    clearResumeDraft();
    onComplete();
    setStep("ready");
  };

  const cardMotion = {
    initial: { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -12 },
    transition: { duration: 0.25 },
  };

  if (!step) return null;

  if (step === "resume") {
    return (
      <ResumeOnboardingFlow
        lockedEmail={user?.email}
        initial={readResumeDraft()}
        onBack={onBack}
        onFinished={async (result) => {
          try {
            await saveResume(result);
          } catch (err) {
            toast.error((err as Error)?.message || "Could not save your profile. Please try again.");
          }
        }}
      />
    );
  }

  return (
    <OnboardingShell onBack={step === "intent" ? (startedFromDraft ? onBack : () => setStep("resume")) : undefined}>
      <AnimatePresence mode="wait">
        {step === "intent" && (
          <motion.div key="intent" {...cardMotion} className={ONBOARDING_CARD}>
            <StepProgress current={1} total={2} />
            <h2 className="mt-6 text-3xl font-bold text-white">Where are you right now?</h2>
            <p className="mt-2 text-[15px] text-muted-foreground">Honest answer helps us show the right roles and signal.</p>

            <div className="mt-6 space-y-3">
              {STATUS_OPTIONS.map((option) => {
                const selected = status === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setStatus(option.value)}
                    aria-pressed={selected}
                    className={`flex w-full cursor-pointer items-start gap-3 rounded-2xl border p-5 text-left transition-colors ${
                      selected ? "border-neon-purple bg-neon-purple/10 shadow-[0_0_0_1px_rgba(124,58,237,0.35)]" : "border-white/10 bg-white/[0.02] hover:bg-white/[0.05]"
                    }`}
                  >
                    <option.Icon className={`mt-0.5 h-5 w-5 shrink-0 ${selected ? "text-neon-pink" : "text-muted-foreground"}`} />
                    <span className="flex-1">
                      <span className="block font-medium text-white">{option.title}</span>
                      <span className="mt-1 block text-sm leading-relaxed text-muted-foreground">{option.description}</span>
                    </span>
                    <span
                      className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${
                        selected ? "border-neon-purple bg-neon-purple" : "border-white/25"
                      }`}
                    >
                      {selected ? <CheckIcon /> : null}
                    </span>
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={async () => {
                try {
                  await finish();
                } catch (err) {
                  toast.error((err as Error)?.message || "Could not save your profile. Please try again.");
                }
              }}
              disabled={!status || isLoading}
              className={`mt-6 ${PRIMARY_BTN}`}
            >
              {isLoading ? "Saving…" : "Continue"}
              {!isLoading ? <ArrowRightIcon /> : null}
            </button>
          </motion.div>
        )}
        {step === "ready" && (
          <motion.div key="ready" {...cardMotion}>
            <ReadyCard onContinue={() => router.push("/jobs/smart_matches")} />
          </motion.div>
        )}
      </AnimatePresence>
    </OnboardingShell>
  );
}

function ReadyCard({ onContinue }: { onContinue: () => void }) {
  return (
    <div className={`${ONBOARDING_CARD} text-center`}>
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full gradient-primary">
        <CheckIcon />
      </div>
      <h2 className="mt-6 text-3xl font-bold text-white">You&apos;re ready to look.</h2>
      <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
        We&apos;ll match roles to your skills and keep your readiness signal current.
      </p>
      <button type="button" onClick={onContinue} className={`mt-8 ${PRIMARY_BTN}`}>
        See matching roles
        <SparkleIcon />
      </button>
    </div>
  );
}

function SparkleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 2.5 13.4 8l5.6 1.4L13.4 10.8 12 16.5l-1.4-5.7L5 9.4 10.6 8 12 2.5Zm7 11 0.8 3.1 3.2.8-3.2.8-.8 3.1-.8-3.1-3.2-.8 3.2-.8.8-3.1Z" />
    </svg>
  );
}
