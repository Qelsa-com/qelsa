"use client";

import { type ResumeDraft, readResumeDraft, writeResumeDraft } from "@/lib/resumeDraft";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ResumeOnboardingFlow } from "./ResumeOnboardingFlow";

export function GuestResumeLanding() {
  const router = useRouter();
  const [draft, setDraft] = useState<ResumeDraft | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setDraft(readResumeDraft());
    setReady(true);
  }, []);

  if (!ready) return null;

  return (
    <ResumeOnboardingFlow
      initial={draft}
      onFinished={({ profile, storageId, filename }) => {
        writeResumeDraft({ profile, storageId, filename, reviewed: true });
        router.push("/auth?returnUrl=/onboarding");
      }}
    />
  );
}
