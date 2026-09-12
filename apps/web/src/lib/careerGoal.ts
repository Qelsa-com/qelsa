import type { CareerGoalExperienceLevel, CareerGoalFocus, CareerGoalTimeline, ExtractedCareerGoal } from "@/types/careerGoal";

export const GOAL_TIMELINE_OPTIONS: { value: CareerGoalTimeline; label: string }[] = [
  { value: "3_months", label: "3 months" },
  { value: "6_months", label: "6 months" },
  { value: "1_year", label: "1 year" },
  { value: "2_plus_years", label: "2+ years" },
];

export const GOAL_EXPERIENCE_OPTIONS: { value: CareerGoalExperienceLevel; label: string }[] = [
  { value: "entry", label: "Entry Level" },
  { value: "mid", label: "Mid Level" },
  { value: "senior", label: "Senior" },
  { value: "lead", label: "Lead/Principal" },
];

export const GOAL_FOCUS_OPTIONS: { value: CareerGoalFocus; label: string }[] = [
  { value: "switch_roles", label: "Switch roles" },
  { value: "get_promoted", label: "Get promoted" },
  { value: "switch_industries", label: "Switch industries" },
  { value: "upskill", label: "Upskill in current role" },
];

export function hasCareerGoal(goal: { target_role?: string } | null | undefined): boolean {
  return Boolean(goal?.target_role?.trim());
}

export function goalTimelineLabel(value?: CareerGoalTimeline): string {
  return GOAL_TIMELINE_OPTIONS.find((option) => option.value === value)?.label ?? "";
}

const MAX_COMPANIES = 12;
const MAX_SKILLS = 16;
const MAX_TAG = 80;
const MAX_ROLE = 120;

function uniqueTrimmed(values: string[], maxItems: number): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const raw of values) {
    const value = raw.trim().slice(0, MAX_TAG);
    if (!value) continue;
    const key = value.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(value);
    if (out.length >= maxItems) break;
  }
  return out;
}

/** Instant, no-network fill from the free-text goal. Empty fields stay empty. */
export function parseCareerGoalText(raw: string): ExtractedCareerGoal {
  const text = raw.trim();
  const empty: ExtractedCareerGoal = {
    target_role: null,
    dream_companies: [],
    timeline: null,
    experience_level: null,
    skills: [],
    primary_focus: null,
    source: "rules",
  };
  if (!text) return empty;

  const lower = text.toLowerCase();
  const extracted: ExtractedCareerGoal = { ...empty };

  if (/\b2\s*\+?\s*years?\b/.test(lower) || /\btwo\s*\+?\s*years?\b/.test(lower)) extracted.timeline = "2_plus_years";
  else if (/\b1\s*year\b/.test(lower) || /\bone\s*year\b/.test(lower)) extracted.timeline = "1_year";
  else if (/\b6\s*months?\b/.test(lower) || /\bsix\s*months?\b/.test(lower)) extracted.timeline = "6_months";
  else if (/\b3\s*months?\b/.test(lower) || /\bthree\s*months?\b/.test(lower)) extracted.timeline = "3_months";

  if (/\b(lead|principal)\b/.test(lower)) extracted.experience_level = "lead";
  else if (/\b(senior|sr\.?)\b/.test(lower)) extracted.experience_level = "senior";
  else if (/\bmid[- ]?level\b|\bmidlevel\b|\bmid\b/.test(lower)) extracted.experience_level = "mid";
  else if (/\b(entry|junior|student|graduate|intern)\b/.test(lower)) extracted.experience_level = "entry";

  if (/\bswitch(?:ing)?\s+industr/.test(lower)) extracted.primary_focus = "switch_industries";
  else if (/\bpromot/.test(lower)) extracted.primary_focus = "get_promoted";
  else if (/\bupskill|\bgrow in (?:my |the )?current role\b/.test(lower)) extracted.primary_focus = "upskill";
  else if (/\bswitch(?:ing)?\s+roles?\b|\bcareer switch|\bchange (?:roles?|careers?)\b|\blooking for (?:a )?(?:job|role|opportunit)/.test(lower)) {
    extracted.primary_focus = "switch_roles";
  }

  const roleMatch =
    text.match(/(?:aiming for|want to be(?:come)?|looking for(?: a(?:n)? (?:job|role) as)?|as a(?:n)?|role(?: of)?)\s+([^.,\n]+)/i) ??
    text.match(/job opportunities in\s+([^.,\n]+)/i);
  if (roleMatch?.[1]) {
    const role = roleMatch[1]
      .replace(/\b(?:jobs?|opportunities|roles?)\b/gi, "")
      .trim()
      .replace(/\s+/g, " ")
      .slice(0, MAX_ROLE);
    extracted.target_role = role || null;
  }

  const companyMatch = text.match(/(?:at|like|companies?:?)\s+([A-Z][\w&.\-]+(?:\s*(?:,|and|&)\s*[A-Z][\w&.\-]+){0,8})/);
  if (companyMatch?.[1]) {
    extracted.dream_companies = uniqueTrimmed(companyMatch[1].split(/\s*(?:,|and|&)\s*/), MAX_COMPANIES);
  }

  const skillMatch = text.match(/skills?(?: I want)?(?: to (?:build|learn|develop))?(?: like|:)?\s+([^.\n]+)/i);
  if (skillMatch?.[1]) {
    extracted.skills = uniqueTrimmed(skillMatch[1].split(/\s*(?:,|and|&)\s*/), MAX_SKILLS);
  }

  return extracted;
}

export function descriptionFingerprint(text: string): string {
  return text.trim().replace(/\s+/g, " ").toLowerCase();
}
