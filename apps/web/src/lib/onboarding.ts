import type { User } from "@/types/user";

export function needsOnboarding(user: User | null | undefined) {
  if (!user?.account_type) return false;
  if (user.onboarding_completed) return false;
  if (user.username?.trim()) return false;
  return true;
}

export function homeForAccount(user: User | null | undefined) {
  if (user?.account_type === "recruiter") {
    return user.active_page_id ? `/pages/${user.active_page_id}` : "/jobs/posted";
  }
  return "/jobs/smart_matches";
}
