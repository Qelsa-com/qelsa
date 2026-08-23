/** Ready Now is strictly above 80. Almost There is 70–80 inclusive. */
export const READY_MIN_EXCLUSIVE = 80;
export const ALMOST_MIN = 70;
export const ALMOST_MAX = 80;
export const READY_LIST_MIN = ALMOST_MAX + 1;

export const MATCH_TIER = {
  ready: {
    href: "/jobs/ready",
    title: "Ready Now",
    subtitle: "These roles match your experience. It's go time for these roles.",
    dotColor: "#10b981",
    minReadiness: READY_LIST_MIN,
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
} as const;

export type MatchTierId = keyof typeof MATCH_TIER;

export function matchRingColor(score: number): string {
  if (score > READY_MIN_EXCLUSIVE) return "#10b981";
  if (score >= ALMOST_MIN) return "#f59e0b";
  return "#9ca3af";
}
