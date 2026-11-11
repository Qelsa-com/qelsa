import { READY_MIN } from "./jobProfileMatch";

export const PROFICIENCY_ORDER = ["beginner", "intermediate", "advance", "expert"] as const;

/** Common spellings that should map onto PROFICIENCY_ORDER entries. */
const PROFICIENCY_ALIASES: Record<string, (typeof PROFICIENCY_ORDER)[number]> = {
  advanced: "advance",
};

export function proficiencyRank(level?: string | null) {
  if (!level) return null;
  const normalized = PROFICIENCY_ALIASES[level] ?? level;
  const idx = PROFICIENCY_ORDER.indexOf(normalized as (typeof PROFICIENCY_ORDER)[number]);
  return idx === -1 ? null : idx;
}

export function matchStatus(required?: string | null, candidate?: string | null) {
  if (candidate == null) return "gap";
  const requiredRank = proficiencyRank(required);
  const candidateRank = proficiencyRank(candidate);
  // Job lists the skill without a required level, or the candidate never set a
  // proficiency — having the skill at all counts as a match.
  if (requiredRank == null || candidateRank == null) return "match";
  if (candidateRank > requiredRank) return "exceeds";
  if (candidateRank === requiredRank) return "match";
  return "gap";
}

const isMatched = (status: string) => status === "match" || status === "exceeds";

export function clipPlainText(text: string | undefined, max: number) {
  if (!text) return "";
  const plain = text
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return plain.length > max ? `${plain.slice(0, max)}…` : plain;
}

/** Pull requirement-like bullets from a JD (HTML or plain text). */
export function extractJdListItems(text: string | undefined, max = 10): string[] {
  if (!text) return [];
  const fromHtml = [...text.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi)].map((match) => clipPlainText(match[1], 220)).filter((item) => item.length > 8);
  if (fromHtml.length > 0) return fromHtml.slice(0, max);
  return clipPlainText(text, 5000)
    .split(/\n+/)
    .map((line) => line.replace(/^[-*•\d.)\s]+/, "").trim())
    .filter((line) => line.length > 16 && line.length < 240)
    .slice(0, max);
}

export function normalizeSkillName(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9+#]+/g, " ")
    .trim();
}

const SKILL_KEY_ALIASES: Record<string, string> = {
  js: "javascript",
  ecmascript: "javascript",
  ts: "typescript",
  golang: "go",
  k8s: "kubernetes",
  postgres: "postgresql",
  mongo: "mongodb",
};

/**
 * Spelling-insensitive identity for a skill: "ReactJS", "React.js" and "React"
 * share a key, as do "JS" and "JavaScript". Stored on `skills.match_key`.
 */
export function skillMatchKey(name: string) {
  let key = name.toLowerCase().replace(/[^a-z0-9+#]+/g, "");
  if (key.length > 4 && key.endsWith("js")) key = key.slice(0, -2);
  return SKILL_KEY_ALIASES[key] ?? key;
}

/** Library names that are also everyday words once ".js" is dropped. */
const AMBIGUOUS_BARE_KEYS = new Set(["next", "three", "express", "ember", "meteor", "backbone", "alpine", "solid"]);

/**
 * Phrases (normalized like `normalizeSkillName`) that count as a mention of
 * the skill in free text. Phrases of one or two letters (go, ts, js) are left
 * out: too ambiguous in prose.
 */
export function skillMentionPhrases(name: string) {
  const key = skillMatchKey(name);
  const phrases = new Set([normalizeSkillName(name)]);
  if (!AMBIGUOUS_BARE_KEYS.has(key)) phrases.add(key);
  for (const [alias, target] of Object.entries(SKILL_KEY_ALIASES)) {
    if (target === key) phrases.add(alias);
  }
  if (key && !(key in SKILL_KEY_ALIASES) && !Object.values(SKILL_KEY_ALIASES).includes(key)) {
    phrases.add(`${key}js`);
    phrases.add(`${key} js`);
  }
  return [...phrases].filter((phrase) => phrase.replace(/\s/g, "").length > 2);
}

export interface CompetencyProfileContext {
  /** Related-experience score for this job, 0–100. */
  experienceScore?: number | null;
  /** Requirement used only to explain the gap; never to derive skill points. */
  requiredExperienceYears?: number | null;
}

/**
 * Years of experience from experience rows. Shared so the job page and the
 * agent's match snapshot feed `buildCompetencyFramework` identical inputs —
 * otherwise the readiness ring and the fit report can never agree.
 */
export function computeYearsExperience(
  rows: Array<{ start_date?: number | null; end_date?: number | null; is_current?: boolean | null }>,
): number | null {
  const now = Date.now();
  const starts = rows
    .map((row) => row.start_date)
    .filter((value): value is number => typeof value === "number" && Number.isFinite(value));
  if (!starts.length) return null;
  const earliest = Math.min(...starts);
  const hasCurrent = rows.some((row) => row.is_current || !row.end_date);
  const latest = hasCurrent
    ? now
    : Math.max(...rows.map((row) => row.end_date ?? row.start_date ?? earliest));
  return Math.max(0, Math.floor((Math.min(latest, now) - earliest) / (1000 * 60 * 60 * 24 * 365)));
}

/**
 * Readiness = 70% skills + 30% relevant experience. Education is deliberately
 * absent. The score is rounded once, after both components are combined.
 */
export function composeReadiness(skillReadiness: number, experienceScore: number | null | undefined) {
  const skills = Math.max(0, Math.min(100, skillReadiness));
  // A missing/unknown experience score is shown as 0% on the bar, so the 70/30
  // total must include that 0. Hiding the bar or silently dropping the 30%
  // makes the number disagree with what the candidate sees.
  const experience = Math.max(0, Math.min(100, experienceScore ?? 0));
  return Math.round(0.7 * skills + 0.3 * experience);
}

export const READINESS_FORMULA_VERSION = "skills70-exp30-v7-no-cap";

export function proficiencyCredit(hasSkill: boolean, required?: string | null, candidate?: string | null) {
  if (!hasSkill) return 0;
  const requiredRank = proficiencyRank(required);
  const candidateRank = proficiencyRank(candidate);
  if (requiredRank == null || candidateRank == null) return 1;
  if (candidateRank >= requiredRank) return 1;
  // Present but short of the bar: beginner vs expert earns 25%, not zero.
  return (candidateRank + 1) / (requiredRank + 1);
}

export function buildCompetencyFramework(
  jobSkills: Array<{
    skill_id: string;
    type?: string;
    proficiency?: string;
    weight?: number;
    skill?: { name?: string } | null;
  }>,
  userSkills: Array<{ skill_id: string; proficiency?: string; name?: string }>,
  profileContext?: CompetencyProfileContext,
) {
  const userBySkillId = new Map(userSkills.map((s) => [s.skill_id, s.proficiency ?? null]));
  // Catalog rows can differ only by spelling (ReactJS vs React), so fall back
  // to the name key when both sides carry names.
  const userByKey = new Map<string, string | null>();
  for (const s of userSkills) {
    if (!s.name) continue;
    const key = skillMatchKey(s.name);
    const prev = userByKey.get(key);
    if (!key || (prev !== undefined && (proficiencyRank(prev) ?? -1) >= (proficiencyRank(s.proficiency) ?? -1))) continue;
    userByKey.set(key, s.proficiency ?? null);
  }

  const competencies = jobSkills.map((js) => {
    const key = userByKey.size > 0 && js.skill?.name ? skillMatchKey(js.skill.name) : "";
    const hasSkill = userBySkillId.has(js.skill_id) || (key !== "" && userByKey.has(key));
    const candidate = !hasSkill ? null : userBySkillId.has(js.skill_id) ? (userBySkillId.get(js.skill_id) ?? null) : (userByKey.get(key) ?? null);
    // Distinguish "skill not on profile" (gap) from "skill present, no
    // proficiency set" (baseline match).
    const status = !hasSkill ? "gap" : candidate == null ? "match" : matchStatus(js.proficiency, candidate);
    const required = js.type === "core";
    return {
      skill_id: js.skill_id,
      skill_name: js.skill?.name ?? null,
      type: js.type,
      required,
      required_proficiency: js.proficiency,
      candidate_proficiency: candidate,
      has_skill: hasSkill,
      weight: js.weight ?? 0,
      status,
      matched: isMatched(status),
      /** Fraction of this skill's weight earned: 1 met, partial below the bar, 0 missing. */
      credit: proficiencyCredit(hasSkill, js.proficiency, candidate),
    };
  });

  const matchedCount = competencies.filter((c) => c.matched).length;
  const totalCount = competencies.length;
  const totalWeight = competencies.reduce((sum, c) => sum + (c.weight || 0), 0);
  const skillReadiness =
    totalWeight > 0
      ? Math.round((competencies.reduce((sum, c) => sum + (c.weight || 0) * c.credit, 0) / totalWeight) * 100)
      : totalCount > 0
        ? Math.round((competencies.reduce((sum, c) => sum + c.credit, 0) / totalCount) * 100)
        : 0;

  const requiredExperienceYears = profileContext?.requiredExperienceYears;
  const experienceRequirement: "unknown" | "none" | "set" =
    requiredExperienceYears == null ? "unknown" : requiredExperienceYears === 0 ? "none" : "set";
  const experienceScore =
    experienceRequirement === "unknown"
      ? null
      : Math.max(0, Math.min(100, profileContext?.experienceScore ?? 0));
  const missingRequired = competencies.filter((c) => c.required && !c.matched).length;
  const rawReadiness = composeReadiness(skillReadiness, experienceScore);
  // A missing required skill caps the role below the Almost There tier.
  // True score everywhere: missing core skills are surfaced as a warning, not
  // used to overwrite the weighted readiness.
  const readiness = rawReadiness;

  return {
    competencies,
    matchedCount,
    totalCount,
    readiness,
    rawReadiness,
    skillReadiness,
    experienceScore,
    experienceRequirement,
    missingRequired,
  };
}

export type ClosingGap = {
  skills: string[];
  /** True when the listed skills would lift the role into Ready Now. */
  reachesReady: boolean;
  blocker: "skills" | "experience" | "profile";
};

type GapSkill = {
  skill_name?: string | null;
  type?: string;
  weight?: number;
  matched: boolean;
  credit: number;
  required: boolean;
};

/**
 * Bounded gap explanation. The old n-choose-3 search over every job skill was
 * exponential on skills-heavy roles and ran for every Almost There job in a
 * ranking pass. Core blockers are always considered first; at most 3 skills
 * are listed.
 */
export function closingGap(input: {
  readiness: number;
  experienceScore: number | null;
  competencies: GapSkill[];
}): ClosingGap | null {
  if (input.readiness >= READY_MIN) return null;

  const { experienceScore, competencies } = input;
  const totalWeight = competencies.reduce((sum, skill) => sum + (skill.weight || 0), 0);
  const totalCount = competencies.length;

  const skillScoreWith = (fixed: Set<GapSkill>) => {
    if (totalWeight > 0) {
      const weighted = competencies.reduce(
        (sum, skill) => sum + (skill.weight || 0) * (fixed.has(skill) ? 1 : skill.credit),
        0,
      );
      return Math.round((weighted / totalWeight) * 100);
    }
    if (totalCount > 0) {
      const earned = competencies.reduce((sum, skill) => sum + (fixed.has(skill) ? 1 : skill.credit), 0);
      return Math.round((earned / totalCount) * 100);
    }
    return 0;
  };

  const coreMissing = competencies.filter((skill) => skill.required && !skill.matched);
  const named = competencies.filter(
    (skill) => !skill.matched && skill.skill_name && (totalWeight === 0 || (skill.weight || 0) > 0),
  );
  const preferred = named.filter((skill) => skill.type === "preferred");
  const other = named.filter((skill) => !skill.required && skill.type !== "preferred");
  // Core skills (even weightless) must be in the set to lift the cap.
  const pool = [...coreMissing, ...preferred, ...other];

  const crosses = (chosen: GapSkill[]) => {
    const fixed = new Set(chosen);
    const raw = composeReadiness(skillScoreWith(fixed), experienceScore);
    return raw >= READY_MIN;
  };

  const ordered = [...pool].sort(
    (a, b) => Number(b.required) - Number(a.required) || (b.weight || 0) - (a.weight || 0),
  );
  const chosen: GapSkill[] = [];
  for (const skill of ordered) {
    chosen.push(skill);
    if (crosses(chosen) || chosen.length >= 3) break;
  }

  if (chosen.length === 0) {
    return {
      skills: [],
      reachesReady: false,
      blocker: composeReadiness(100, experienceScore) < READY_MIN ? "experience" : "profile",
    };
  }

  return {
    skills: chosen.map((skill) => skill.skill_name).filter((name): name is string => Boolean(name)),
    reachesReady: crosses(chosen),
    blocker: composeReadiness(100, experienceScore) < READY_MIN ? "experience" : "skills",
  };
}
