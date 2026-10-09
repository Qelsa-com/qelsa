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
  candidateYearsExperience?: number | null;
  requiredExperienceYears?: number | null;
  candidateEducationCount?: number | null;
}

/** Same weights as `buildCompetencyFramework`. Ready Now is 80 or above. */
export function composeReadiness(skillReadiness: number, experienceScore: number | null, educationScore: number | null) {
  if (experienceScore !== null && educationScore !== null) {
    return Math.round(0.5 * skillReadiness + 0.3 * experienceScore + 0.2 * educationScore);
  }
  if (experienceScore !== null) {
    return Math.round(0.65 * skillReadiness + 0.35 * experienceScore);
  }
  if (educationScore !== null) {
    return Math.round(0.75 * skillReadiness + 0.25 * educationScore);
  }
  return skillReadiness;
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
    return {
      skill_id: js.skill_id,
      skill_name: js.skill?.name ?? null,
      type: js.type,
      required_proficiency: js.proficiency,
      candidate_proficiency: candidate,
      has_skill: hasSkill,
      weight: js.weight ?? 0,
      status,
      matched: isMatched(status),
    };
  });

  const matchedCount = competencies.filter((c) => c.matched).length;
  const totalCount = competencies.length;
  const totalWeight = competencies.reduce((sum, c) => sum + (c.weight || 0), 0);
  const skillReadiness = totalWeight > 0 ? Math.round((competencies.filter((c) => c.matched).reduce((sum, c) => sum + (c.weight || 0), 0) / totalWeight) * 100) : totalCount > 0 ? Math.round((matchedCount / totalCount) * 100) : 0;

  // Calculate experience score when experience context is available
  let experienceScore: number | null = null;
  if (profileContext?.candidateYearsExperience !== undefined || profileContext?.requiredExperienceYears !== undefined) {
    const candidateYears = profileContext?.candidateYearsExperience ?? 0;
    const requiredYears = profileContext?.requiredExperienceYears ?? 0;
    if (requiredYears <= 0) {
      experienceScore = 100;
    } else if (candidateYears >= requiredYears) {
      experienceScore = 100;
    } else {
      experienceScore = Math.max(20, Math.min(100, Math.round((candidateYears / requiredYears) * 100)));
    }
  }

  // Calculate education score when education context is available
  let educationScore: number | null = null;
  if (profileContext?.candidateEducationCount !== undefined && profileContext?.candidateEducationCount !== null) {
    const count = profileContext.candidateEducationCount;
    educationScore = count > 0 ? 100 : 70;
  }

  const readiness = composeReadiness(skillReadiness, experienceScore, educationScore);

  return {
    competencies,
    matchedCount,
    totalCount,
    readiness,
    skillReadiness,
    experienceScore,
    educationScore,
  };
}

export type ClosingGap = {
  skills: string[];
  /** True when `skills` alone would push readiness above Ready Now. */
  reachesReady: boolean;
  blocker: "skills" | "experience" | "education" | "profile";
};

type GapSkill = {
  skill_name?: string | null;
  type?: string;
  weight?: number;
  matched: boolean;
};

function skillPercent(matchedWeight: number, totalWeight: number, matchedCount: number, totalCount: number) {
  if (totalWeight > 0) return Math.round((matchedWeight / totalWeight) * 100);
  if (totalCount > 0) return Math.round((matchedCount / totalCount) * 100);
  return 0;
}

function combinations<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  const pick = (start: number, chosen: T[]) => {
    if (chosen.length === size) {
      out.push(chosen.slice());
      return;
    }
    for (let i = start; i < items.length; i++) {
      chosen.push(items[i]!);
      pick(i + 1, chosen);
      chosen.pop();
    }
  };
  pick(0, []);
  return out;
}

/**
 * Smallest set of missing required skills (at most 3) that would cross into Ready Now.
 * When perfect skills still cannot cross, the hold-back is experience or education.
 */
export function closingGap(input: {
  readiness: number;
  experienceScore: number | null;
  educationScore: number | null;
  competencies: GapSkill[];
}): ClosingGap | null {
  if (input.readiness >= READY_MIN) return null;

  const { experienceScore, educationScore, competencies } = input;
  const totalWeight = competencies.reduce((sum, skill) => sum + (skill.weight || 0), 0);
  const totalCount = competencies.length;
  const matchedWeight = competencies.filter((skill) => skill.matched).reduce((sum, skill) => sum + (skill.weight || 0), 0);
  const matchedCount = competencies.filter((skill) => skill.matched).length;

  const readinessAt = (nextSkill: number) => composeReadiness(nextSkill, experienceScore, educationScore);
  if (readinessAt(100) < READY_MIN) {
    const experienceFixed = experienceScore == null ? readinessAt(100) : composeReadiness(100, 100, educationScore);
    const educationFixed = educationScore == null ? readinessAt(100) : composeReadiness(100, experienceScore, 100);
    const experienceBlocks = experienceScore != null && experienceScore < 100 && experienceFixed >= READY_MIN;
    const educationBlocks = educationScore != null && educationScore < 100 && educationFixed >= READY_MIN;
    if (experienceBlocks && !educationBlocks) return { skills: [], reachesReady: false, blocker: "experience" };
    if (educationBlocks && !experienceBlocks) return { skills: [], reachesReady: false, blocker: "education" };
    return { skills: [], reachesReady: false, blocker: "profile" };
  }

  const named = competencies.filter((skill) => !skill.matched && skill.skill_name && (totalWeight === 0 || (skill.weight || 0) > 0));
  const core = named.filter((skill) => !skill.type || skill.type === "core");
  const preferred = named.filter((skill) => skill.type === "preferred");
  const required = core.length + preferred.length > 0 ? [...core, ...preferred] : named;

  const crosses = (subset: GapSkill[]) => {
    const weight = matchedWeight + subset.reduce((sum, skill) => sum + (skill.weight || 0), 0);
    const count = matchedCount + subset.length;
    return readinessAt(skillPercent(weight, totalWeight, count, totalCount)) >= READY_MIN;
  };

  const smallest = (pool: GapSkill[]) => {
    for (let size = 1; size <= 3; size++) {
      let best: GapSkill[] | null = null;
      let bestWeight = -1;
      for (const combo of combinations(pool, size)) {
        if (!crosses(combo)) continue;
        const weight = combo.reduce((sum, skill) => sum + (skill.weight || 0), 0);
        if (!best || weight > bestWeight) {
          best = combo;
          bestWeight = weight;
        }
      }
      if (best) return best;
    }
    return null;
  };

  const found = (core.length > 0 ? smallest(core) : null) ?? smallest(required);
  const chosen = found ?? [...required].sort((a, b) => (b.weight || 0) - (a.weight || 0)).slice(0, 3);
  const skills = chosen.map((skill) => skill.skill_name).filter((name): name is string => Boolean(name));
  if (skills.length === 0) return null;
  return { skills, reachesReady: Boolean(found), blocker: "skills" };
}
