import type { BillingPlanId } from "@/types/billing";

/**
 * Employer-facing plan copy. The subscription products are shared with
 * candidates, but recruiters buy different outcomes, so the benefits shown in
 * pricing, billing settings, and the upgrade modal must match their workflow.
 */
export const EMPLOYER_PLAN_COPY: Record<
  BillingPlanId,
  { description: string; features: string[] }
> = {
  plus: {
    description: "More Agent time and applicant insight for everyday hiring.",
    features: [
      "Unlimited job postings",
      "Applicant readiness reports",
      "100 Qelsa Agent messages per day",
      "Skill-gap analysis for applicants",
    ],
  },
  pro: {
    description: "Deeper verification, comparisons, and priority matching.",
    features: [
      "Unlimited job postings",
      "Advanced applicant readiness reports",
      "Structured candidate verification",
      "Advanced skill-gap analysis",
      "500 Qelsa Agent messages per day",
      "Priority candidate matching",
    ],
  },
};

export const EMPLOYER_PRICING_HEADER = {
  eyebrow: "Qelsa for Employers",
  title: "Hire at your pace.",
  description: "Start with Plus for everyday hiring, or go Pro for deeper candidate insight.",
};
