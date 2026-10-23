import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";
import {
  BILLING_PLANS,
  BILLING_PLAN_ORDER,
  FREE_AGENT_DAILY_LIMIT,
  FREE_APPLICATION_LIMIT,
  PLUS_AGENT_DAILY_LIMIT,
  PRO_AGENT_DAILY_LIMIT,
  publicBillingPlan,
  type BillingPlanId,
  type BillingPlanLimits,
  type PublicBillingPlan,
} from "../billingPlans";

type ReadCtx = QueryCtx | MutationCtx;

export type PlanAudience = "candidate" | "employer";
export type PlanTier = "free" | BillingPlanId;

export type PlanConfig = {
  audience: PlanAudience;
  plan: PlanTier;
  agent_daily_limit: number;
  application_limit: number | null;
  description: string;
  features: string[];
  updated_at: number | null;
  updated_by: Id<"users"> | null;
};

type PlanConfigDefaults = Omit<PlanConfig, "updated_at" | "updated_by">;

const CANDIDATE_DEFAULTS: Record<PlanTier, PlanConfigDefaults> = {
  free: {
    audience: "candidate",
    plan: "free",
    agent_daily_limit: FREE_AGENT_DAILY_LIMIT,
    application_limit: FREE_APPLICATION_LIMIT,
    description: "The essentials to get started.",
    features: [
      "{{application_benefit}}",
      "{{agent_benefit}}",
      "Job matching and readiness score",
      "Profile and resume tools",
    ],
  },
  plus: {
    audience: "candidate",
    plan: "plus",
    agent_daily_limit: PLUS_AGENT_DAILY_LIMIT,
    application_limit: null,
    description: BILLING_PLANS.plus.description,
    features: BILLING_PLANS.plus.features,
  },
  pro: {
    audience: "candidate",
    plan: "pro",
    agent_daily_limit: PRO_AGENT_DAILY_LIMIT,
    application_limit: null,
    description: BILLING_PLANS.pro.description,
    features: BILLING_PLANS.pro.features,
  },
};

const EMPLOYER_DEFAULTS: Record<PlanTier, PlanConfigDefaults> = {
  free: {
    audience: "employer",
    plan: "free",
    agent_daily_limit: FREE_AGENT_DAILY_LIMIT,
    application_limit: null,
    description: "Start hiring with the essentials.",
    features: ["{{agent_benefit}}", "Job posting and applicant pipeline tools"],
  },
  plus: {
    audience: "employer",
    plan: "plus",
    agent_daily_limit: PLUS_AGENT_DAILY_LIMIT,
    application_limit: null,
    description: "More Agent time and applicant insight for everyday hiring.",
    features: [
      "Unlimited job postings",
      "Applicant readiness reports",
      "{{agent_benefit}}",
      "Skill-gap analysis for applicants",
    ],
  },
  pro: {
    audience: "employer",
    plan: "pro",
    agent_daily_limit: PRO_AGENT_DAILY_LIMIT,
    application_limit: null,
    description: "Deeper verification, comparisons, and priority matching.",
    features: [
      "Unlimited job postings",
      "Advanced applicant readiness reports",
      "Structured candidate verification",
      "Advanced skill-gap analysis",
      "{{agent_benefit}}",
      "Priority candidate matching",
    ],
  },
};

const DEFAULTS: Record<PlanAudience, Record<PlanTier, PlanConfigDefaults>> = {
  candidate: CANDIDATE_DEFAULTS,
  employer: EMPLOYER_DEFAULTS,
};

export function audienceForUser(user: Doc<"users">): PlanAudience {
  return user.account_type === "recruiter" ? "employer" : "candidate";
}

function withDefaults(defaults: PlanConfigDefaults): PlanConfig {
  return { ...defaults, features: [...defaults.features], updated_at: null, updated_by: null };
}

function rowToConfig(row: Doc<"plan_configs">): PlanConfig {
  return {
    audience: row.audience,
    plan: row.plan,
    agent_daily_limit: row.agent_daily_limit,
    application_limit: row.application_limit,
    description: row.description,
    features: row.features,
    updated_at: row.updated_at,
    updated_by: row.updated_by,
  };
}

export function defaultPlanConfig(audience: PlanAudience, plan: PlanTier): PlanConfig {
  return withDefaults(DEFAULTS[audience][plan]);
}

export async function getPlanConfig(
  ctx: ReadCtx,
  audience: PlanAudience,
  plan: PlanTier,
): Promise<PlanConfig> {
  const row = await ctx.db
    .query("plan_configs")
    .withIndex("by_audience_and_plan", (q) =>
      q.eq("audience", audience).eq("plan", plan),
    )
    .unique();
  return row ? rowToConfig(row) : defaultPlanConfig(audience, plan);
}

export async function getPlanConfigsForAudience(
  ctx: ReadCtx,
  audience: PlanAudience,
): Promise<Record<PlanTier, PlanConfig>> {
  const rows = await ctx.db
    .query("plan_configs")
    .withIndex("by_audience_and_plan", (q) => q.eq("audience", audience))
    .take(10);
  const list: PlanTier[] = ["free", ...BILLING_PLAN_ORDER];
  return list.reduce(
    (result, plan) => {
      const row = rows.find((item) => item.plan === plan);
      result[plan] = row ? rowToConfig(row) : defaultPlanConfig(audience, plan);
      return result;
    },
    {} as Record<PlanTier, PlanConfig>,
  );
}

export async function getAllPlanConfigs(ctx: ReadCtx): Promise<PlanConfig[]> {
  const rows = await ctx.db.query("plan_configs").take(20);
  const configs: PlanConfig[] = [];
  for (const audience of ["candidate", "employer"] as const) {
    for (const plan of ["free", ...BILLING_PLAN_ORDER] as PlanTier[]) {
      const row = rows.find((item) => item.audience === audience && item.plan === plan);
      configs.push(row ? rowToConfig(row) : defaultPlanConfig(audience, plan));
    }
  }
  return configs;
}

/** Public plan data with admin-edited copy and limits applied. */
export async function publicPlansForAudience(
  ctx: ReadCtx,
  audience: PlanAudience,
): Promise<PublicBillingPlan[]> {
  const configs = await getPlanConfigsForAudience(ctx, audience);
  return BILLING_PLAN_ORDER.map((plan) => {
    const base = publicBillingPlan(plan);
    const config = configs[plan];
    const limits: BillingPlanLimits = {
      agent_daily_limit: config.agent_daily_limit,
      application_limit: config.application_limit,
    };
    return {
      ...base,
      description: config.description,
      features: config.features,
      limits,
    };
  });
}
