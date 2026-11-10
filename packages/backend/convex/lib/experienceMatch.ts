import type { Doc, Id } from "../_generated/dataModel";
import type { QueryCtx } from "../_generated/server";

/**
 * Job-function taxonomy used by the readiness experience component.
 *
 * The catalog does not yet store a `job_functions` register, so the canonical
 * function is derived from the job title (`job_titles.name` for experience
 * rows, `jobs.title` for a role). This is deliberately a closed, deterministic
 * classifier: same function = full credit, related function = half credit,
 * everything else = a trace (5%). Keeping it in one place means the live
 * browse path, the cached ranking and the employer views agree.
 *
 * When the taxonomy becomes an admin-editable table this module is the only
 * place that needs to swap its source.
 */

export const JOB_FUNCTIONS = [
  "engineering",
  "data",
  "product",
  "design",
  "sales",
  "marketing",
  "operations",
  "finance",
  "hr",
  "customer_success",
  "support",
  "other",
] as const;

export type JobFunction = (typeof JOB_FUNCTIONS)[number];

export const SAME_FUNCTION_CREDIT = 1;
export const RELATED_FUNCTION_CREDIT = 0.5;
export const UNRELATED_FUNCTION_CREDIT = 0.05;

/** Closest transferable functions. Unlisted pairs fall back to 5%. */
const RELATED: Partial<Record<JobFunction, Partial<Record<JobFunction, number>>>> = {
  engineering: { data: 0.6, product: 0.4, design: 0.3, operations: 0.3, support: 0.2 },
  data: { engineering: 0.6, product: 0.5, marketing: 0.3, finance: 0.3, operations: 0.3 },
  product: { data: 0.5, design: 0.5, engineering: 0.4, marketing: 0.4, sales: 0.3, operations: 0.3 },
  design: { product: 0.5, marketing: 0.4, engineering: 0.3 },
  sales: { marketing: 0.5, customer_success: 0.5, product: 0.3, operations: 0.3, finance: 0.2 },
  marketing: { sales: 0.5, product: 0.4, design: 0.4, data: 0.3, operations: 0.3 },
  operations: { finance: 0.4, customer_success: 0.4, hr: 0.3, support: 0.3, product: 0.3, data: 0.3, engineering: 0.3 },
  finance: { operations: 0.4, data: 0.3, sales: 0.2 },
  hr: { operations: 0.3 },
  customer_success: { sales: 0.5, support: 0.5, operations: 0.4, product: 0.3 },
  support: { customer_success: 0.5, operations: 0.3, engineering: 0.2 },
  other: {},
};

export function functionRelatedness(source: JobFunction, target: JobFunction): number {
  if (source === target) return source === "other" ? UNRELATED_FUNCTION_CREDIT : SAME_FUNCTION_CREDIT;
  if (source === "other" || target === "other") return UNRELATED_FUNCTION_CREDIT;
  return RELATED[source]?.[target] ?? RELATED[target]?.[source] ?? UNRELATED_FUNCTION_CREDIT;
}

/**
 * Ordered on purpose: specific titles win over generic words. "Data engineer"
 * must stay data (not engineering), "product designer" design (not product),
 * "sales engineer" sales (not engineering), "marketing analyst" marketing.
 */
const TITLE_RULES: Array<{ fn: JobFunction; patterns: string[] }> = [
  {
    fn: "customer_success",
    patterns: [
      "customer success",
      "client success",
      "customer experience",
      "account management",
      "account manager",
      "client services",
      "relationship manager",
    ],
  },
  {
    fn: "support",
    patterns: [
      "customer support",
      "technical support",
      "help desk",
      "helpdesk",
      "service desk",
      "support engineer",
      "support specialist",
      "support",
    ],
  },
  {
    fn: "marketing",
    patterns: [
      "product marketing",
      "marketing analytics",
      "marketing analyst",
      "marketing",
      "growth",
      "seo",
      "sem",
      "content",
      "social media",
      "brand",
      "communications",
      "demand gen",
      "performance marketing",
      "public relations",
    ],
  },
  {
    fn: "finance",
    patterns: [
      "financial analyst",
      "financial planning",
      "finance",
      "accounting",
      "accountant",
      "fp&a",
      "controller",
      "audit",
      "tax",
      "treasury",
      "investment",
      "banking",
      "private equity",
      "venture capital",
      "credit analyst",
    ],
  },
  {
    fn: "hr",
    patterns: [
      "human resources",
      "recruiter",
      "talent acquisition",
      "talent",
      "people operations",
      "people ops",
      "hris",
      "learning and development",
      "compensation",
      "benefits",
    ],
  },
  {
    fn: "design",
    patterns: [
      "product design",
      "product designer",
      "ux",
      "ui",
      "user experience",
      "user interface",
      "designer",
      "graphic design",
      "brand design",
      "motion design",
      "illustrator",
    ],
  },
  {
    fn: "sales",
    patterns: [
      "sales engineer",
      "sales",
      "account executive",
      "business development",
      "bdr",
      "sdr",
      "revenue",
      "partnerships",
      "solutions engineer",
    ],
  },
  {
    fn: "product",
    patterns: ["product manager", "product owner", "product lead", "head of product", "product analyst", "product"],
  },
  {
    fn: "data",
    patterns: [
      "data engineer",
      "data scientist",
      "data analyst",
      "analytics engineer",
      "business intelligence",
      "bi analyst",
      "machine learning",
      "ml engineer",
      "ai engineer",
      "data science",
      "statistician",
      "database administrator",
      "business analyst",
      "database",
    ],
  },
  {
    fn: "engineering",
    patterns: [
      "software engineer",
      "software developer",
      "engineer",
      "developer",
      "programmer",
      "frontend",
      "front end",
      "backend",
      "back end",
      "full stack",
      "fullstack",
      "devops",
      "sre",
      "platform",
      "mobile",
      "android",
      "ios",
      "qa",
      "test",
      "security",
      "architect",
    ],
  },
  {
    fn: "operations",
    patterns: [
      "business operations",
      "operations",
      "ops",
      "supply chain",
      "logistics",
      "program manager",
      "project manager",
      "chief of staff",
      "strategy",
      "procurement",
      "facilities",
      "quality",
    ],
  },
];

export function jobFunctionForTitle(title?: string | null): JobFunction {
  const normalized = (title ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9+#]+/g, " ")
    .trim();
  if (!normalized) return "other";
  for (const rule of TITLE_RULES) {
    for (const pattern of rule.patterns) {
      if (normalized.includes(pattern)) return rule.fn;
    }
  }
  return "other";
}

export function jobFunctionForJob(title?: string | null, fallbackTitle?: string | null): JobFunction {
  return jobFunctionForTitle(title && title.trim() ? title : fallbackTitle);
}

export function asJobFunction(value?: string | null): JobFunction | null {
  return value && (JOB_FUNCTIONS as readonly string[]).includes(value) ? (value as JobFunction) : null;
}

export interface ExperienceRow {
  start_date: number;
  end_date?: number | null;
  is_current?: boolean | null;
  job_title_id?: string | null;
  /** Present on already-enriched rows (the agent context). */
  title?: string | null;
}

export interface ExperienceProfile {
  /** Weighted years per target function, capped at the total career span. */
  yearsByFunction: Record<JobFunction, number>;
  /** Earliest start to latest end (or now). Used to avoid double-counting overlaps. */
  totalYears: number;
}

const YEAR_MS = 1000 * 60 * 60 * 24 * 365;

/**
 * Related experience is built per function once per candidate, not per job.
 * Each role contributes:
 *   same function  → 100% of its duration
 *   related        → 50%
 *   unrelated      →  5% (a trace, not zero)
 */
export function computeExperienceProfile(
  rows: ExperienceRow[],
  titleNameById: Map<string, string | null> = new Map(),
  asOf = Date.now(),
): ExperienceProfile {
  const yearsByFunction = Object.fromEntries(JOB_FUNCTIONS.map((fn) => [fn, 0])) as Record<JobFunction, number>;
  let earliest = Number.POSITIVE_INFINITY;
  let latest = Number.NEGATIVE_INFINITY;

  for (const row of rows) {
    const start = Number(row.start_date);
    if (!Number.isFinite(start)) continue;
    const rawEnd = row.is_current || row.end_date == null ? asOf : Number(row.end_date);
    if (!Number.isFinite(rawEnd)) continue;
    const end = Math.max(start, Math.min(rawEnd, asOf));
    const years = (end - start) / YEAR_MS;
    if (years <= 0) continue;

    const title =
      row.title ??
      (row.job_title_id ? (titleNameById.get(String(row.job_title_id)) ?? null) : null);
    const roleFunction = jobFunctionForTitle(title);

    for (const target of JOB_FUNCTIONS) {
      yearsByFunction[target] += years * functionRelatedness(roleFunction, target);
    }
    earliest = Math.min(earliest, start);
    latest = Math.max(latest, end);
  }

  const totalYears = Number.isFinite(earliest) && Number.isFinite(latest) ? Math.max(0, (latest - earliest) / YEAR_MS) : 0;
  // Concurrent roles must not add up to more than the elapsed career span.
  for (const fn of JOB_FUNCTIONS) {
    yearsByFunction[fn] = Math.min(yearsByFunction[fn], totalYears);
  }

  return { yearsByFunction, totalYears };
}

/**
 * Relevant-experience score for one job, 0–100.
 * Required years cap the credit; a 0-year role gives everyone full marks.
 */
export function relatedExperienceScore(
  profile: ExperienceProfile | null | undefined,
  jobFunction: JobFunction,
  requiredYears?: number | null,
): number {
  const required = requiredYears ?? 0;
  if (required <= 0) return 100;
  const related = profile?.yearsByFunction[jobFunction] ?? 0;
  if (related <= 0) return 0;
  return Math.max(0, Math.min(100, Math.round((related / required) * 100)));
}

/**
 * Loads the distinct job-title names for an experience set, then builds the
 * profile. `cache` lets list views read each catalog title once across many
 * candidates instead of once per candidate.
 */
export async function loadExperienceProfileCached(
  ctx: QueryCtx,
  rows: ExperienceRow[],
  cache: Map<Id<"job_titles">, Promise<Doc<"job_titles"> | null>>,
  asOf = Date.now(),
): Promise<ExperienceProfile> {
  const ids = [
    ...new Set(
      rows
        .map((row) => row.job_title_id)
        .filter((id): id is Id<"job_titles"> => typeof id === "string" && id.length > 0),
    ),
  ];
  await Promise.all(
    ids.map(async (id) => {
      let pending = cache.get(id);
      if (!pending) {
        pending = ctx.db.get(id);
        cache.set(id, pending);
      }
      await pending;
    }),
  );
  const names = new Map<string, string | null>();
  for (const id of ids) {
    const doc = await cache.get(id);
    names.set(String(id), doc?.name ?? null);
  }
  return computeExperienceProfile(rows, names, asOf);
}

export async function loadExperienceProfile(
  ctx: QueryCtx,
  rows: ExperienceRow[],
  asOf = Date.now(),
): Promise<ExperienceProfile> {
  return loadExperienceProfileCached(ctx, rows, new Map(), asOf);
}

export function emptyExperienceProfile(): ExperienceProfile {
  return {
    yearsByFunction: Object.fromEntries(JOB_FUNCTIONS.map((fn) => [fn, 0])) as Record<JobFunction, number>,
    totalYears: 0,
  };
}
