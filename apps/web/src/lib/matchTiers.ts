/** Strong Matches is 80 or above. Almost There is 60–79. Growth Opportunities is < 60. */
export const READY_MIN = 80;
export const ALMOST_MIN = 60;
export const ALMOST_MAX = 79;
export const GROWTH_MAX = 59;

export const MATCH_TIER = {
  ready: {
    href: "/jobs/ready",
    title: "Strong Matches",
    subtitle: "These roles have a match score of 80% or higher.",
    dotColor: "#10b981",
    minReadiness: READY_MIN,
    maxReadiness: undefined,
  },
  almost: {
    href: "/jobs/almost",
    title: "Almost There",
    subtitle: "Close to 80% match - stand out! Fill gaps to boost these roles.",
    dotColor: "#f59e0b",
    minReadiness: ALMOST_MIN,
    maxReadiness: ALMOST_MAX,
  },
  growth: {
    href: "/jobs/growth",
    title: "Growth Opportunities",
    subtitle: "Explore roles beyond your current profile. Discover new career paths and identify the skills you need to get there.",
    dotColor: "#a855f7",
    minReadiness: 0,
    maxReadiness: GROWTH_MAX,
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

export function matchRingColor(score: number): string {
  if (score >= READY_MIN) return "#10b981";
  if (score >= ALMOST_MIN) return "#f59e0b";
  return "#a855f7";
}
