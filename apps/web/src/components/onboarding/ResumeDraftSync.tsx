"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useApplyParsedProfileMutation } from "@/features/api/onboardingApi";
import { needsOnboarding } from "@/lib/onboarding";
import { clearResumeDraft, readResumeDraft } from "@/lib/resumeDraft";
import { useEffect, useRef } from "react";

/** Applies a guest-parsed resume after login when the user won't go through candidate onboarding. */
export function ResumeDraftSync() {
  const { user, isLoading } = useAuth();
  const [apply] = useApplyParsedProfileMutation();
  const attempted = useRef(false);

  useEffect(() => {
    if (isLoading || !user || attempted.current) return;
    if (needsOnboarding(user)) return;
    const draft = readResumeDraft();
    if (!draft?.reviewed) return;
    attempted.current = true;
    if (user.account_type !== "seeker") {
      clearResumeDraft();
      return;
    }
    void apply({
      profile: draft.profile,
      storage_id: draft.storageId,
      filename: draft.filename,
    })
      .then(() => clearResumeDraft())
      .catch(() => {
        attempted.current = false;
      });
  }, [apply, isLoading, user]);

  return null;
}
