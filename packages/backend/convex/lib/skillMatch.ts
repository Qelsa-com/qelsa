export const PROFICIENCY_ORDER = ["beginner", "intermediate", "advance", "expert"] as const;

export function proficiencyRank(level?: string | null) {
  if (!level) return null;
  const idx = PROFICIENCY_ORDER.indexOf(level as (typeof PROFICIENCY_ORDER)[number]);
  return idx === -1 ? null : idx;
}

export function matchStatus(required?: string | null, candidate?: string | null) {
  if (candidate == null) return "gap";
  const requiredRank = proficiencyRank(required);
  const candidateRank = proficiencyRank(candidate);
  if (requiredRank == null || candidateRank == null) return "gap";
  if (candidateRank > requiredRank) return "exceeds";
  if (candidateRank === requiredRank) return "match";
  return "gap";
}

const isMatched = (status: string) => status === "match" || status === "exceeds";

export function clipPlainText(text: string | undefined, max: number) {
  if (!text) return "";
  const plain = text.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  return plain.length > max ? `${plain.slice(0, max)}…` : plain;
}

export function normalizeSkillName(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9+#]+/g, " ").trim();
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
    const candidate = userBySkillId.has(js.skill_id) ? userBySkillId.get(js.skill_id) : null;
    const status = matchStatus(js.proficiency, candidate);
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
  const readiness =
    totalWeight > 0
      ? Math.round(
          (competencies.filter((c) => c.matched).reduce((sum, c) => sum + (c.weight || 0), 0) / totalWeight) * 100,
        )
      : totalCount > 0
        ? Math.round((matchedCount / totalCount) * 100)
        : 0;

  return { competencies, matchedCount, totalCount, readiness };
}
