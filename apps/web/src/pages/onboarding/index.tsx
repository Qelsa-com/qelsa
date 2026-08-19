"use client";

import { CandidateOnboarding } from "@/components/onboarding/CandidateOnboarding";
import { HrOnboarding } from "@/components/onboarding/HrOnboarding";
import { RoleStep } from "@/components/onboarding/RoleStep";
import { OnboardingShell } from "@/components/onboarding/OnboardingShell";
import { useAuth } from "@/contexts/AuthContext";
import type { AccountType } from "@/features/api/authApi";
import { useSetAccountTypeAndResetOnboardingMutation } from "@/features/api/onboardingApi";
import { homeForAccount, needsOnboarding } from "@/lib/onboarding";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function OnboardingPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [accountType, setAccountType] = useState<AccountType | null>(null);
  const [pickingRole, setPickingRole] = useState(false);
  const [justFinished, setJustFinished] = useState(false);
  const [saveRole, { isLoading: isSavingRole }] = useSetAccountTypeAndResetOnboardingMutation();

  useEffect(() => {
    if (!user) return;
    if (!accountType && user.account_type) setAccountType(user.account_type);
    if (!user.account_type) setPickingRole(true);
  }, [user, accountType]);

  useEffect(() => {
    if (isLoading || !user) return;
    if (!user.account_type && !pickingRole) setPickingRole(true);
    if (!justFinished && user.account_type && !needsOnboarding(user) && !pickingRole) {
      router.replace(homeForAccount(user.account_type));
    }
  }, [isLoading, user, pickingRole, justFinished, router]);

  if (isLoading || !user) return null;

  const handleRoleContinue = async () => {
    if (!accountType) return;
    try {
      await saveRole({ account_type: accountType }).unwrap();
      setPickingRole(false);
    } catch (err) {
      toast.error((err as Error)?.message || "Could not save your choice. Please try again.");
    }
  };

  if (pickingRole || !accountType) {
    return (
      <OnboardingShell>
        <RoleStep value={accountType} onChange={setAccountType} onContinue={handleRoleContinue} isSaving={isSavingRole} />
      </OnboardingShell>
    );
  }

  if (accountType === "recruiter") {
    return <HrOnboarding onBack={() => setPickingRole(true)} onComplete={() => setJustFinished(true)} />;
  }

  return <CandidateOnboarding onBack={() => setPickingRole(true)} onComplete={() => setJustFinished(true)} />;
}
