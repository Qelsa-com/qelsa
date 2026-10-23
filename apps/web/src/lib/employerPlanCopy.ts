import type { BillingPlanLimits } from "@/types/billing";

export const EMPLOYER_PRICING_HEADER = {
  eyebrow: "Qelsa for Employers",
  title: "Hire at your pace.",
  description: "Start with Plus for everyday hiring, or go Pro for deeper candidate insight.",
};

/**
 * Benefit lines are stored with limit tokens so admin changes to a plan limit
 * update the copy without a deploy. Both the full phrase and the bare number
 * are supported.
 */
export function renderPlanFeatures(
  features: string[],
  limits: BillingPlanLimits,
): string[] {
  const applicationBenefit =
    limits.application_limit === null
      ? "Unlimited job applications"
      : `${limits.application_limit} active application${limits.application_limit === 1 ? "" : "s"}`;
  const agentBenefit = `${limits.agent_daily_limit} Qelsa Agent message${limits.agent_daily_limit === 1 ? "" : "s"} per day`;
  const applicationLimit =
    limits.application_limit === null ? "Unlimited" : String(limits.application_limit);
  const agentLimit = String(limits.agent_daily_limit);

  return features.map((feature) =>
    feature
      .replaceAll("{{application_benefit}}", applicationBenefit)
      .replaceAll("{{agent_benefit}}", agentBenefit)
      .replaceAll("{{application_limit}}", applicationLimit)
      .replaceAll("{{agent_limit}}", agentLimit),
  );
}
