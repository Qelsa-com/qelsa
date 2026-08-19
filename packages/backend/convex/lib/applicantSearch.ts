import { v } from "convex/values";
import type { Id } from "../_generated/dataModel";
import { normalizeSkillName } from "./skillMatch";

export type SearchChipCategory = "skill" | "experience" | "location" | "education" | "status" | "readiness" | "other";

export type SearchChip = {
  id: string;
  label: string;
  category: SearchChipCategory;
};

export type ApplicantSearchCriteria = {
  keywords: string[];
  skills: string[];
  companies: string[];
  titles: string[];
  location?: string;
  education?: string;
  min_years?: number;
  status?: string;
  min_readiness?: number;
  workplace?: string;
  skill_gaps: string[];
  semantic_terms: string[];
  rank_by: "relevance" | "readiness" | "experience";
  job_fit?: "best" | "strong" | "gaps_ok";
};

export type ApplicantSearchDoc = {
  application_id: Id<"job_applications">;
  name: string;
  email: string;
  phone: string | undefined;
  headline: string | undefined;
  location: string | undefined;
  years_experience: number | null;
  status: string;
  readiness: number;
  applied_at: number;
  skills: Array<{ id: string; name: string; proficiency?: string }>;
  companies: string[];
  titles: string[];
  education: string[];
  matched_skill_names: string[];
  gap_skill_names: string[];
  search_text: string;
};

export type ApplicantSearchHit = {
  application_id: Id<"job_applications">;
  score: number;
  explanation: string;
  reasons: string[];
  gaps: string[];
};

const STATUS_ALIASES: Record<string, string> = {
  new: "applied",
  applied: "applied",
  viewed: "viewed",
  review: "viewed",
  "under review": "viewed",
  shortlisted: "sorted",
  shortlist: "sorted",
  sorted: "sorted",
  rejected: "rejected",
  reject: "rejected",
  hold: "hold",
  "on hold": "hold",
  cancelled: "cancelled",
};

const NL_HINT =
  /\b(find|show me|looking for|candidates who|applicants who|strongest|best fit|match(?:es)? this role|don't necessarily|doesn'?t necessarily|built|scalable)\b/i;

export function looksLikeNaturalLanguage(query: string) {
  const trimmed = query.trim();
  if (trimmed.length >= 48) return true;
  const words = trimmed.split(/\s+/).filter(Boolean);
  if (words.length >= 5) return true;
  return NL_HINT.test(trimmed);
}

export function emptyCriteria(): ApplicantSearchCriteria {
  return {
    keywords: [],
    skills: [],
    companies: [],
    titles: [],
    skill_gaps: [],
    semantic_terms: [],
    rank_by: "relevance",
  };
}

export function parseKeywordCriteria(query: string): ApplicantSearchCriteria {
  const criteria = emptyCriteria();
  let remaining = query.trim().toLowerCase();
  if (!remaining) return criteria;

  const years = remaining.match(/(\d+)\s*\+?\s*(?:years?|yrs?)/i);
  if (years) {
    criteria.min_years = Number(years[1]);
    remaining = remaining.replace(years[0], " ");
  }

  const readiness = remaining.match(/(\d{2,3})\s*%/);
  if (readiness) {
    criteria.min_readiness = Number(readiness[1]);
    remaining = remaining.replace(readiness[0], " ");
  }

  if (/\b(strongest|best fit|top match(?:es)?|highest readiness)\b/.test(remaining)) {
    criteria.rank_by = "readiness";
    criteria.job_fit = "best";
    criteria.min_readiness = criteria.min_readiness ?? 75;
  }

  for (const [alias, status] of Object.entries(STATUS_ALIASES)) {
    const pattern = new RegExp(`\\b${alias.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
    if (pattern.test(remaining)) {
      criteria.status = status;
      remaining = remaining.replace(pattern, " ");
    }
  }

  criteria.keywords = remaining
    .split(/[\s,/|]+/)
    .map((token) => token.trim())
    .filter((token) => token.length >= 2 && !STOP.has(token));

  return criteria;
}

export function criteriaToChips(criteria: ApplicantSearchCriteria): SearchChip[] {
  const chips: SearchChip[] = [];
  const push = (category: SearchChipCategory, label: string) => {
    chips.push({ id: `${category}-${label.toLowerCase()}`, label, category });
  };
  for (const skill of criteria.skills) push("skill", skill);
  for (const company of criteria.companies) push("other", company);
  for (const title of criteria.titles) push("other", title);
  if (criteria.min_years != null) push("experience", `${criteria.min_years}+ years`);
  if (criteria.location) push("location", criteria.location);
  if (criteria.education) push("education", criteria.education);
  if (criteria.status) push("status", statusLabel(criteria.status));
  if (criteria.min_readiness != null) push("readiness", `${criteria.min_readiness}%+ readiness`);
  if (criteria.workplace) push("other", criteria.workplace);
  for (const gap of criteria.skill_gaps) push("other", `Gap: ${gap}`);
  for (const term of criteria.semantic_terms) push("other", term);
  if (criteria.job_fit === "best") push("readiness", "Best fit for this role");
  for (const keyword of criteria.keywords) {
    if (!chips.some((chip) => chip.label.toLowerCase() === keyword)) push("other", keyword);
  }
  return chips;
}

export function mergeCriteria(base: ApplicantSearchCriteria, extra: Partial<ApplicantSearchCriteria>): ApplicantSearchCriteria {
  return {
    keywords: uniqueStrings([...(extra.keywords ?? []), ...base.keywords]),
    skills: uniqueStrings([...(extra.skills ?? []), ...base.skills]),
    companies: uniqueStrings([...(extra.companies ?? []), ...base.companies]),
    titles: uniqueStrings([...(extra.titles ?? []), ...base.titles]),
    location: extra.location ?? base.location,
    education: extra.education ?? base.education,
    min_years: extra.min_years ?? base.min_years,
    status: extra.status ?? base.status,
    min_readiness: extra.min_readiness ?? base.min_readiness,
    workplace: extra.workplace ?? base.workplace,
    skill_gaps: uniqueStrings([...(extra.skill_gaps ?? []), ...base.skill_gaps]),
    semantic_terms: uniqueStrings([...(extra.semantic_terms ?? []), ...base.semantic_terms]),
    rank_by: extra.rank_by ?? base.rank_by,
    job_fit: extra.job_fit ?? base.job_fit,
  };
}

export function applyHardFilters(doc: ApplicantSearchDoc, criteria: ApplicantSearchCriteria) {
  if (criteria.status && doc.status !== criteria.status) return false;
  if (criteria.min_years != null && (doc.years_experience ?? 0) < criteria.min_years) return false;
  if (criteria.min_readiness != null && doc.readiness < criteria.min_readiness) return false;
  if (criteria.workplace && !includesNormalized(doc.search_text, criteria.workplace) && !includesNormalized(doc.headline ?? "", criteria.workplace)) {
    if (criteria.workplace === "remote" && !includesNormalized(doc.search_text, "remote")) return false;
  }
  if (criteria.location && !includesNormalized(doc.location ?? "", criteria.location) && !includesNormalized(doc.search_text, criteria.location)) {
    return false;
  }
  if (criteria.education && !doc.education.some((row) => includesNormalized(row, criteria.education!)) && !includesNormalized(doc.search_text, criteria.education)) {
    return false;
  }
  for (const skill of criteria.skills) {
    if (!hasSkill(doc, skill) && !includesNormalized(doc.search_text, skill)) return false;
  }
  for (const company of criteria.companies) {
    if (!doc.companies.some((row) => includesNormalized(row, company)) && !includesNormalized(doc.search_text, company)) return false;
  }
  return true;
}

export function scoreApplicant(doc: ApplicantSearchDoc, criteria: ApplicantSearchCriteria): ApplicantSearchHit {
  let score = 0;
  const reasons: string[] = [];
  const gaps: string[] = [];

  for (const keyword of criteria.keywords) {
    const hit = keywordHit(doc, keyword);
    score += hit.points;
    if (hit.reason) reasons.push(hit.reason);
  }

  for (const skill of criteria.skills) {
    if (hasSkill(doc, skill)) {
      score += 28;
      reasons.push(`Has ${displaySkill(doc, skill)}`);
    } else if (includesNormalized(doc.search_text, skill)) {
      score += 12;
      reasons.push(`Mentions ${skill}`);
    }
  }

  for (const title of criteria.titles) {
    if (doc.titles.some((row) => includesNormalized(row, title)) || includesNormalized(doc.headline ?? "", title)) {
      score += 16;
      reasons.push(`Title related to ${title}`);
    }
  }

  for (const company of criteria.companies) {
    const match = doc.companies.find((row) => includesNormalized(row, company));
    if (match) {
      score += 22;
      reasons.push(`Worked at ${match}`);
    }
  }

  if (criteria.min_years != null && doc.years_experience != null) {
    score += Math.min(18, Math.max(0, doc.years_experience - criteria.min_years) * 2 + 8);
    reasons.push(`${doc.years_experience} years of experience`);
  }

  if (criteria.location && includesNormalized(doc.location ?? "", criteria.location)) {
    score += 18;
    reasons.push(`Based in ${doc.location}`);
  }

  for (const term of criteria.semantic_terms) {
    if (includesNormalized(doc.search_text, term)) {
      score += 10;
      reasons.push(`Evidence of ${term}`);
    }
  }

  for (const gap of criteria.skill_gaps) {
    if (!hasSkill(doc, gap)) {
      gaps.push(gap);
      if (criteria.job_fit === "gaps_ok") score += 4;
    } else {
      score -= 8;
    }
  }

  if (doc.gap_skill_names.length && (criteria.job_fit === "gaps_ok" || criteria.skill_gaps.length)) {
    gaps.push(...doc.gap_skill_names.slice(0, 3));
  }

  if (criteria.job_fit === "best" || criteria.job_fit === "strong" || criteria.rank_by === "readiness") {
    score += doc.readiness * 0.6;
  } else {
    score += doc.readiness * 0.15;
  }

  if (criteria.rank_by === "experience") {
    score += (doc.years_experience ?? 0) * 3;
  }

  const uniqueReasons = uniqueStrings(reasons).slice(0, 6);
  const uniqueGaps = uniqueStrings(gaps).slice(0, 4);

  return {
    application_id: doc.application_id,
    score: Math.round(score * 10) / 10,
    explanation: buildExplanation(doc, uniqueReasons, uniqueGaps),
    reasons: uniqueReasons,
    gaps: uniqueGaps,
  };
}

export function rankApplicants(docs: ApplicantSearchDoc[], criteria: ApplicantSearchCriteria): ApplicantSearchHit[] {
  if (!hasSearchSignal(criteria)) return [];
  const hits = docs.filter((doc) => applyHardFilters(doc, criteria)).map((doc) => scoreApplicant(doc, criteria));
  hits.sort((a, b) => b.score - a.score || b.application_id.localeCompare(a.application_id));
  return hits.filter((hit) => hit.score > 0 || criteria.keywords.length === 0);
}

export function yearsFromExperiences(
  rows: Array<{ start_date: number; end_date?: number; is_current?: boolean }>,
  asOf: number,
) {
  if (!rows.length) return null;
  const starts = rows.map((row) => row.start_date).filter((value) => Number.isFinite(value));
  if (!starts.length) return null;
  const earliest = Math.min(...starts);
  const hasCurrent = rows.some((row) => row.is_current || !row.end_date);
  const latest = hasCurrent ? asOf : Math.max(...rows.map((row) => row.end_date ?? row.start_date));
  const years = Math.floor((Math.min(latest, asOf) - earliest) / (1000 * 60 * 60 * 24 * 365));
  return years > 0 ? years : null;
}

function hasSearchSignal(criteria: ApplicantSearchCriteria) {
  return (
    criteria.keywords.length > 0 ||
    criteria.skills.length > 0 ||
    criteria.companies.length > 0 ||
    criteria.titles.length > 0 ||
    criteria.skill_gaps.length > 0 ||
    criteria.semantic_terms.length > 0 ||
    criteria.min_years != null ||
    criteria.min_readiness != null ||
    Boolean(criteria.location) ||
    Boolean(criteria.education) ||
    Boolean(criteria.status) ||
    Boolean(criteria.workplace) ||
    Boolean(criteria.job_fit)
  );
}

function keywordHit(doc: ApplicantSearchDoc, keyword: string) {
  if (includesNormalized(doc.name, keyword)) return { points: 55, reason: `Name matches “${keyword}”` };
  if (includesNormalized(doc.email, keyword)) return { points: 40, reason: `Email matches “${keyword}”` };
  if (doc.phone && digits(doc.phone).includes(digits(keyword)) && digits(keyword).length >= 4) {
    return { points: 35, reason: "Phone matches" };
  }
  if (hasSkill(doc, keyword)) return { points: 26, reason: `Has ${displaySkill(doc, keyword)}` };
  if (doc.companies.some((row) => includesNormalized(row, keyword))) return { points: 20, reason: `Company matches “${keyword}”` };
  if (doc.titles.some((row) => includesNormalized(row, keyword)) || includesNormalized(doc.headline ?? "", keyword)) {
    return { points: 16, reason: `Role matches “${keyword}”` };
  }
  if (includesNormalized(doc.location ?? "", keyword)) return { points: 18, reason: `Location matches “${keyword}”` };
  if (doc.education.some((row) => includesNormalized(row, keyword))) return { points: 12, reason: `Education matches “${keyword}”` };
  if (includesNormalized(doc.search_text, keyword)) return { points: 5, reason: undefined };
  return { points: 0, reason: undefined };
}

function hasSkill(doc: ApplicantSearchDoc, skill: string) {
  const needle = normalizeSkillName(skill);
  return doc.skills.some((row) => normalizeSkillName(row.name) === needle || includesNormalized(row.name, skill));
}

function displaySkill(doc: ApplicantSearchDoc, skill: string) {
  const needle = normalizeSkillName(skill);
  return doc.skills.find((row) => normalizeSkillName(row.name) === needle)?.name ?? skill;
}

function buildExplanation(doc: ApplicantSearchDoc, reasons: string[], gaps: string[]) {
  const headline = `${doc.name} — ${doc.readiness}% readiness`;
  const why = reasons.length ? reasons.join(". ") + "." : "Matches the current filters for this job.";
  const gapLine = gaps.length ? `Gap: ${gaps.join(", ")}.` : "";
  return [headline, why, gapLine].filter(Boolean).join("\n\n");
}

function includesNormalized(haystack: string, needle: string) {
  return normalizeSkillName(haystack).includes(normalizeSkillName(needle));
}

function uniqueStrings(values: string[]) {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const value of values) {
    const key = value.trim().toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(value.trim());
  }
  return out;
}

function digits(value: string) {
  return value.replace(/\D/g, "");
}

function statusLabel(status: string) {
  if (status === "applied") return "New";
  if (status === "viewed") return "Viewed";
  if (status === "sorted") return "Shortlisted";
  if (status === "rejected") return "Rejected";
  if (status === "hold") return "On Hold";
  return status;
}

const STOP = new Set([
  "a",
  "an",
  "and",
  "at",
  "for",
  "from",
  "in",
  "of",
  "on",
  "or",
  "the",
  "to",
  "with",
  "who",
  "me",
  "my",
  "show",
  "find",
  "looking",
  "least",
  "candidates",
  "candidate",
  "applicants",
  "applicant",
  "experience",
  "years",
  "yrs",
]);

export const searchChipValidator = v.object({
  id: v.string(),
  label: v.string(),
  category: v.union(
    v.literal("skill"),
    v.literal("experience"),
    v.literal("location"),
    v.literal("education"),
    v.literal("status"),
    v.literal("readiness"),
    v.literal("other"),
  ),
});

export const searchHitValidator = v.object({
  application_id: v.id("job_applications"),
  score: v.number(),
  explanation: v.string(),
  reasons: v.array(v.string()),
  gaps: v.array(v.string()),
});

export const searchResultValidator = v.object({
  mode: v.union(v.literal("keyword"), v.literal("natural")),
  chips: v.array(searchChipValidator),
  hits: v.array(searchHitValidator),
});

export const jobSearchContextValidator = v.object({
  title: v.string(),
  company: v.optional(v.string()),
  location: v.optional(v.string()),
  description: v.string(),
  workplace_type: v.optional(v.string()),
  experience: v.optional(v.number()),
  skills: v.array(v.string()),
});

