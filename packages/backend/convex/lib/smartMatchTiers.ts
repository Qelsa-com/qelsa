/**
 * Smart Match tiers bucket the blended "Match" score (readiness plus career
 * alignment) shown on the Smart Matches page. Readiness thresholds in
 * `jobProfileMatch` are separate: they drive gap analysis and must not move
 * with these.
 */
export const SMART_READY_MIN = 70;
export const SMART_ALMOST_MIN = 60;
export const SMART_ALMOST_MAX = 69;
