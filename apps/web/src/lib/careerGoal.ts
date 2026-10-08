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

export const STANDARD_INDUSTRIES = [
  "Technology",
  "Fintech",
  "Insurtech",
  "SaaS",
  "Artificial Intelligence",
  "Healthcare",
  "E-Commerce",
  "Education",
  "Cybersecurity",
  "Cloud Computing",
  "Gaming",
  "Biotechnology",
  "CleanTech",
  "Media & Entertainment",
  "Financial Services",
  "Consulting",
  "Aerospace & Defense",
  "Retail",
  "Consumer Goods",
  "Hospitality",
  "Real Estate",
  "Telecommunications",
  "Transportation & Logistics",
];

export function hasCareerGoal(goal: { target_role?: string; target_roles?: string[] } | null | undefined): boolean {
  return Boolean(goal?.target_role?.trim() || goal?.target_roles?.length);
}

export function goalTimelineLabel(value?: CareerGoalTimeline): string {
  return GOAL_TIMELINE_OPTIONS.find((option) => option.value === value)?.label ?? "";
}

const MAX_COMPANIES = 12;
const MAX_INDUSTRIES = 8;
const MAX_ROLES = 8;
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

const KNOWN_INDUSTRIES: [RegExp, string][] = [
  [/\bfintech\b/i, "Fintech"],
  [/\binsurtech\b/i, "Insurtech"],
  [/\bsaas\b/i, "SaaS"],
  [/\b(?:health(?:care)?|healthtech)\b/i, "Healthcare"],
  [/\b(?:e-?commerce|retail)\b/i, "E-Commerce"],
  [/\b(?:ai|genai|artificial intelligence|machine learning)\b/i, "Artificial Intelligence"],
  [/\b(?:edtech|education)\b/i, "Education"],
  [/\bgaming\b/i, "Gaming"],
  [/\bbiotech(?:nology)?\b/i, "Biotechnology"],
  [/\b(?:cleantech|clean energy|renewables?)\b/i, "CleanTech"],
  [/\bcybersecurity\b/i, "Cybersecurity"],
  [/\bcloud\b/i, "Cloud Computing"],
  [/\b(?:banking|financial services)\b/i, "Financial Services"],
  [/\bconsulting\b/i, "Consulting"],
  [/\b(?:aerospace|defense)\b/i, "Aerospace & Defense"],
  [/\btech(?:nology)?\b/i, "Technology"],
];

const COMMON_SKILLS_KEYWORDS: [RegExp, string][] = [
  [/\b(?:gen\s*ai|generative\s*ai)\b/i, "Gen AI"],
  [/\bai\s*agents?\b/i, "AI Agents"],
  [/\bmachine\s*learning\b/i, "Machine Learning"],
  [/\bproduct\s*strategy\b/i, "Product Strategy"],
  [/\bproduct\s*management\b/i, "Product Management"],
  [/\buser\s*experience\b|\bux\b/i, "User Experience"],
  [/\buser\s*research\b/i, "User Research"],
  [/\bdata\s*science\b/i, "Data Science"],
  [/\bdata\s*analytics?\b/i, "Data Analytics"],
  [/\bpython\b/i, "Python"],
  [/\b(?:leadership|cross-functional)\b/i, "Cross-Functional Leadership"],
  [/\bsystem\s*design\b/i, "System Design"],
  [/\bprompt\s*engineering\b/i, "Prompt Engineering"],
];

/** Instant, no-network fill from the free-text goal. Empty fields stay empty. */
export function parseCareerGoalText(raw: string): ExtractedCareerGoal {
  const text = raw.trim();
  const empty: ExtractedCareerGoal = {
    target_role: null,
    target_roles: [],
    dream_companies: [],
    industries: [],
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

  // 1. Industries
  const matchedIndustries: string[] = [];
  for (const [pattern, label] of KNOWN_INDUSTRIES) {
    if (pattern.test(lower) && !matchedIndustries.includes(label)) {
      matchedIndustries.push(label);
    }
  }
  extracted.industries = uniqueTrimmed(matchedIndustries, MAX_INDUSTRIES);

  // 2. Roles
  const rolesFound: string[] = [];
  const roleMatch =
    text.match(/(?:aiming for|want to be(?:come)?|looking for(?: a(?:n)? (?:job|role) as)?|as a(?:n)?|role(?: of)?)\s+([^.,\n]+?)(?:\s+(?:at|in|within|for)\b|[.,\n]|$)/i) ??
    text.match(/job opportunities in\s+([^.,\n]+?)(?:\s+(?:at|in|within|for)\b|[.,\n]|$)/i);
  if (roleMatch?.[1]) {
    const role = roleMatch[1]
      .replace(/\b(?:jobs?|opportunities|roles?|company|startups?)\b/gi, "")
      .trim()
      .replace(/\s+/g, " ")
      .slice(0, MAX_ROLE);
    if (role) {
      rolesFound.push(role);
      if (/product\s+manager/i.test(role)) {
        if (!rolesFound.some((r) => /^sr\.?\s+product\s+manager/i.test(r))) rolesFound.unshift("Sr. Product Manager");
        if (!rolesFound.includes("Product Manager")) rolesFound.push("Product Manager");
      }
    }
  }
  extracted.target_roles = uniqueTrimmed(rolesFound, MAX_ROLES);
  extracted.target_role = extracted.target_roles[0] ?? null;

  // 3. Skills
  const skillsFound: string[] = [];
  for (const [pattern, label] of COMMON_SKILLS_KEYWORDS) {
    if (pattern.test(lower) && !skillsFound.includes(label)) {
      skillsFound.push(label);
    }
  }
  const skillMatch = text.match(/skills?(?: I want)?(?: to (?:build|learn|develop))?(?: like|:)?\s+([^.\n]+)/i);
  if (skillMatch?.[1]) {
    skillsFound.push(...skillMatch[1].split(/\s*(?:,|and|&)\s*/));
  }
  extracted.skills = uniqueTrimmed(skillsFound, MAX_SKILLS);

  const companyMatch = text.match(/(?:at|like|companies?:?)\s+([A-Z][\w&.\-]+(?:\s*(?:,|and|&)\s*[A-Z][\w&.\-]+){0,8})/);
  if (companyMatch?.[1]) {
    extracted.dream_companies = uniqueTrimmed(companyMatch[1].split(/\s*(?:,|and|&)\s*/), MAX_COMPANIES);
  }

  return extracted;
}

export function descriptionFingerprint(text: string): string {
  return text.trim().replace(/\s+/g, " ").toLowerCase();
}
