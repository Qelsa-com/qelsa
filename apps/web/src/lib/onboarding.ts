import type { User } from "@/types/user";

export function needsOnboarding(user: User | null | undefined) {
  if (!user?.account_type) return false;
  if (user.onboarding_completed) return false;
  if (user.username?.trim()) return false;
  return true;
}

export function homeForAccount(accountType: User["account_type"]) {
  return accountType === "recruiter" ? "/jobs/posted" : "/jobs/smart_matches";
}
