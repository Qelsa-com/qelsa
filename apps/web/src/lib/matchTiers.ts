/**
 * Readiness scale. 80+ is "Ready Now" and needs no gap-closing advice; the gap
 * hints in jobBrowseShared rely on these staying at 80.
 */
export const READY_MIN = 80;
export const ALMOST_MIN = 60;
export const ALMOST_MAX = 79;

/**
 * Smart Match tiers. These bucket the blended "Match" score (readiness plus
 * career alignment) shown on the Smart Matches page, so they are separate from
 * the readiness thresholds above.
 */
export const MATCH_READY_MIN = 70;
export const MATCH_ALMOST_MIN = 60;
export const MATCH_ALMOST_MAX = 69;
export const MATCH_GROWTH_MAX = 59;

export const MATCH_TIER = {
  ready: {
    href: "/jobs/ready",
    title: "Strong Matches",
    subtitle: "Roles with a match score of 70% or higher.",
    dotColor: "#10b981",
    minReadiness: MATCH_READY_MIN,
    maxReadiness: undefined,
  },
  almost: {
    href: "/jobs/almost",
    title: "Almost There",
    subtitle: "A 60–69% match. Close the gaps to make these strong.",
    dotColor: "#f59e0b",
    minReadiness: MATCH_ALMOST_MIN,
    maxReadiness: MATCH_ALMOST_MAX,
  },
  growth: {
    href: "/jobs/growth",
    title: "Growth Opportunities",
    subtitle: "Explore roles beyond your current profile. Discover new career paths and identify the skills you need to get there.",
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

/** Readiness palette — used wherever a score is labelled "Ready". */
export function matchRingColor(score: number): string {
  if (score >= READY_MIN) return "#10b981";
  if (score >= ALMOST_MIN) return "#f59e0b";
  return "#a855f7";
}

/** Smart Match palette — used where a score is labelled "Match". */
export function smartMatchRingColor(score: number): string {
  if (score >= MATCH_READY_MIN) return "#10b981";
  if (score >= MATCH_ALMOST_MIN) return "#f59e0b";
  return "#a855f7";
}
