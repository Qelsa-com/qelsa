import { v } from "convex/values";
import type { Doc } from "../_generated/dataModel";

export const GOAL_TIMELINES = ["3_months", "6_months", "1_year", "2_plus_years"] as const;
export const GOAL_EXPERIENCE_LEVELS = ["entry", "mid", "senior", "lead"] as const;
export const GOAL_FOCUSES = ["switch_roles", "get_promoted", "switch_industries", "upskill"] as const;

export type GoalTimeline = (typeof GOAL_TIMELINES)[number];
export type GoalExperienceLevel = (typeof GOAL_EXPERIENCE_LEVELS)[number];
export type GoalFocus = (typeof GOAL_FOCUSES)[number];

export const timelineValidator = v.union(v.literal("3_months"), v.literal("6_months"), v.literal("1_year"), v.literal("2_plus_years"));
export const experienceLevelValidator = v.union(v.literal("entry"), v.literal("mid"), v.literal("senior"), v.literal("lead"));
export const primaryFocusValidator = v.union(v.literal("switch_roles"), v.literal("get_promoted"), v.literal("switch_industries"), v.literal("upskill"));

export const MAX_DESCRIPTION = 2000;
export const MAX_ROLE = 120;
export const MAX_ROLES = 8;
export const MAX_COMPANIES = 12;
export const MAX_INDUSTRIES = 8;
export const MAX_SKILLS = 16;
export const MAX_TAG = 80;

export const careerGoalPublicValidator = v.object({
  id: v.id("career_goals"),
  description: v.optional(v.string()),
  target_role: v.string(),
  target_roles: v.array(v.string()),
  dream_companies: v.array(v.string()),
  industries: v.array(v.string()),
  timeline: v.optional(timelineValidator),
  experience_level: v.optional(experienceLevelValidator),
  skills: v.array(v.string()),
  primary_focus: v.optional(primaryFocusValidator),
  updated_at: v.number(),
});

export type CareerGoalPublic = {
  id: Doc<"career_goals">["_id"];
  description?: string;
  target_role: string;
  target_roles: string[];
  dream_companies: string[];
  industries: string[];
  timeline?: GoalTimeline;
  experience_level?: GoalExperienceLevel;
  skills: string[];
  primary_focus?: GoalFocus;
  updated_at: number;
};

export function toCareerGoalPublic(row: Doc<"career_goals">): CareerGoalPublic {
  const target_roles =
    row.target_roles && row.target_roles.length > 0
      ? row.target_roles
      : row.target_role
        ? [row.target_role]
        : [];
  return {
    id: row._id,
    ...(row.description ? { description: row.description } : {}),
    target_role: row.target_role,
    target_roles,
    dream_companies: row.dream_companies ?? [],
    industries: row.industries ?? [],
    ...(row.timeline ? { timeline: row.timeline } : {}),
    ...(row.experience_level ? { experience_level: row.experience_level } : {}),
    skills: row.skills ?? [],
    ...(row.primary_focus ? { primary_focus: row.primary_focus } : {}),
    updated_at: row.updated_at,
  };
}

export function uniqueTrimmed(values: unknown, maxItems: number, maxLen: number): string[] {
  if (!Array.isArray(values)) return [];
  const out: string[] = [];
  const seen = new Set<string>();
  for (const raw of values) {
    if (typeof raw !== "string") continue;
    const value = raw.trim().slice(0, maxLen);
    if (!value) continue;
    const key = value.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(value);
    if (out.length >= maxItems) break;
  }
  return out;
}

export function normalizeRole(value: unknown): string {
  if (typeof value !== "string") return "";
  return value.trim().replace(/\s+/g, " ").slice(0, MAX_ROLE);
}

export function normalizeDescription(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const text = value.trim().slice(0, MAX_DESCRIPTION);
  return text || undefined;
}

function asLiteral<T extends string>(value: unknown, allowed: readonly T[]): T | undefined {
  return typeof value === "string" && (allowed as readonly string[]).includes(value) ? (value as T) : undefined;
}

export function normalizeTimeline(value: unknown): GoalTimeline | undefined {
  return asLiteral(value, GOAL_TIMELINES);
}

export function normalizeExperienceLevel(value: unknown): GoalExperienceLevel | undefined {
  return asLiteral(value, GOAL_EXPERIENCE_LEVELS);
}

export function normalizeFocus(value: unknown): GoalFocus | undefined {
  return asLiteral(value, GOAL_FOCUSES);
}

export type ExtractedCareerGoal = {
  target_role: string | null;
  target_roles: string[];
  dream_companies: string[];
  industries: string[];
  timeline: GoalTimeline | null;
  experience_level: GoalExperienceLevel | null;
  skills: string[];
  primary_focus: GoalFocus | null;
};

const EMPTY_EXTRACT: ExtractedCareerGoal = {
  target_role: null,
  target_roles: [],
  dream_companies: [],
  industries: [],
  timeline: null,
  experience_level: null,
  skills: [],
  primary_focus: null,
};

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

/** Cheap, deterministic fill-in from free text. Used before any LLM call. */
export function parseCareerGoalText(raw: string): ExtractedCareerGoal {
  const text = raw.trim();
  if (!text) return { ...EMPTY_EXTRACT };

  const lower = text.toLowerCase();
  const extracted: ExtractedCareerGoal = {
    ...EMPTY_EXTRACT,
    target_roles: [],
    dream_companies: [],
    industries: [],
    skills: [],
  };

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

  // 1. Extract industries
  const matchedIndustries: string[] = [];
  for (const [pattern, label] of KNOWN_INDUSTRIES) {
    if (pattern.test(lower) && !matchedIndustries.includes(label)) {
      matchedIndustries.push(label);
    }
  }
  extracted.industries = uniqueTrimmed(matchedIndustries, MAX_INDUSTRIES, MAX_TAG);

  // 2. Extract roles
  const rolesFound: string[] = [];
  const roleMatch =
    text.match(/(?:aiming for|want to be(?:come)?|looking for(?: a(?:n)? (?:job|role) as)?|as a(?:n)?|role(?: of)?)\s+([^.,\n]+?)(?:\s+(?:at|in|within|for)\b|[.,\n]|$)/i) ??
    text.match(/job opportunities in\s+([^.,\n]+?)(?:\s+(?:at|in|within|for)\b|[.,\n]|$)/i);

  if (roleMatch?.[1]) {
    const rawRole = normalizeRole(roleMatch[1].replace(/\b(?:jobs?|opportunities|roles?|company|startups?)\b/gi, ""));
    if (rawRole) {
      rolesFound.push(rawRole);
      // If AI Product Manager found, suggest related variations like Sr. Product Manager, Product Manager
      if (/product\s+manager/i.test(rawRole)) {
        if (!rolesFound.some((r) => /^sr\.?\s+product\s+manager/i.test(r))) rolesFound.unshift("Sr. Product Manager");
        if (!rolesFound.includes("Product Manager")) rolesFound.push("Product Manager");
      }
    }
  }

  extracted.target_roles = uniqueTrimmed(rolesFound, MAX_ROLES, MAX_ROLE);
  extracted.target_role = extracted.target_roles[0] ?? null;

  // 3. Extract skills
  const skillsFound: string[] = [];
  for (const [pattern, label] of COMMON_SKILLS_KEYWORDS) {
    if (pattern.test(lower) && !skillsFound.includes(label)) {
      skillsFound.push(label);
    }
  }

  const explicitSkillMatch = text.match(/skills?(?: I want)?(?: to (?:build|learn|develop))?(?: like|:)?\s+([^.\n]+)/i);
  if (explicitSkillMatch?.[1]) {
    skillsFound.push(...explicitSkillMatch[1].split(/\s*(?:,|and|&)\s*/));
  }
  extracted.skills = uniqueTrimmed(skillsFound, MAX_SKILLS, MAX_TAG);

  const companyMatch = text.match(/(?:at|like|companies?:?)\s+([A-Z][\w&.\-]+(?:\s*(?:,|and|&)\s*[A-Z][\w&.\-]+){0,8})/);
  if (companyMatch?.[1]) {
    extracted.dream_companies = uniqueTrimmed(
      companyMatch[1].split(/\s*(?:,|and|&)\s*/),
      MAX_COMPANIES,
      MAX_TAG,
    );
  }

  return extracted;
}

export function descriptionFingerprint(text: string): string {
  return text.trim().replace(/\s+/g, " ").toLowerCase();
}
