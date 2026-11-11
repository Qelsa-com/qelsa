/**
 * Readiness scale. 80+ is "Ready Now" and needs no gap-closing advice; the gap
 * hints in jobBrowseShared rely on these staying at 80.
 */
export const READY_MIN = 80;
export const ALMOST_MIN = 60;
export const ALMOST_MAX = 79;

/**
 * Tier buckets for the single readiness score. There is no separate Match
 * score anymore; these use the readiness thresholds above.
 */
export const MATCH_READY_MIN = READY_MIN;
export const MATCH_ALMOST_MIN = ALMOST_MIN;
export const MATCH_ALMOST_MAX = ALMOST_MAX;
export const MATCH_GROWTH_MAX = ALMOST_MIN - 1;

export const MATCH_TIER = {
  ready: {
    href: "/jobs/ready",
    title: "Ready Now",
    subtitle: "Roles with a readiness score of 80% or higher.",
    dotColor: "#10b981",
    minReadiness: MATCH_READY_MIN,
    maxReadiness: undefined,
  },
  almost: {
    href: "/jobs/almost",
    title: "Almost There",
    subtitle: "A 60–79% readiness score. Close the gaps to become ready.",
    dotColor: "#f59e0b",
    minReadiness: MATCH_ALMOST_MIN,
    maxReadiness: MATCH_ALMOST_MAX,
  },
  growth: {
    href: "/jobs/growth",
    title: "Growth Opportunities",
    subtitle: "Below 60% readiness. Explore the gaps and what you can learn next.",
    dotColor: "#a855f7",
    minReadiness: 0,
    maxReadiness: MATCH_GROWTH_MAX,
  },
} as const;

export type MatchTierId = keyof typeof MATCH_TIER;

/** Goal-first mode for early-career users without readiness data. */
export const GOAL_MATCH = {
  title: "Goal matches",
  subtitle: "Ranked by how well each role fits your target role, skills, and industries.",
  dotColor: "#22d3ee",
  color: "#22d3ee",
} as const;

/** Readiness palette — used wherever a score is labelled "Readiness". */
export function matchRingColor(score: number): string {
  if (score >= READY_MIN) return "#10b981";
  if (score >= ALMOST_MIN) return "#f59e0b";
  return "#a855f7";
}

/** Readiness palette for tier cards. */
export function smartMatchRingColor(score: number): string {
  return matchRingColor(score);
}
