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

export function buildCompetencyFramework(
  jobSkills: Array<{
    skill_id: string;
    type?: string;
    proficiency?: string;
    weight?: number;
    skill?: { name?: string } | null;
  }>,
  userSkills: Array<{ skill_id: string; proficiency?: string }>,
) {
  const userBySkillId = new Map(userSkills.map((s) => [s.skill_id, s.proficiency ?? null]));

  const competencies = jobSkills.map((js) => {
    const hasSkill = userBySkillId.has(js.skill_id);
    const candidate = hasSkill ? (userBySkillId.get(js.skill_id) ?? null) : null;
    // Distinguish "skill not on profile" (gap) from "skill present, no
    // proficiency set" (baseline match).
    const status = !hasSkill ? "gap" : candidate == null ? "match" : matchStatus(js.proficiency, candidate);
    return {
      skill_id: js.skill_id,
      skill_name: js.skill?.name ?? null,
      type: js.type,
      required_proficiency: js.proficiency,
      candidate_proficiency: candidate,
      weight: js.weight ?? 0,
      status,
      matched: isMatched(status),
    };
  });

  const matchedCount = competencies.filter((c) => c.matched).length;
  const totalCount = competencies.length;
  const totalWeight = competencies.reduce((sum, c) => sum + (c.weight || 0), 0);
  const readiness = totalWeight > 0 ? Math.round((competencies.filter((c) => c.matched).reduce((sum, c) => sum + (c.weight || 0), 0) / totalWeight) * 100) : totalCount > 0 ? Math.round((matchedCount / totalCount) * 100) : 0;

  return { competencies, matchedCount, totalCount, readiness };
}
