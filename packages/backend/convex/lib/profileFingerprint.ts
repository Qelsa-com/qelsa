/**
 * Stable fingerprint of the profile inputs that move readiness. Used to decide
 * whether a stored analysis (fit report) or a cached ranking is still valid.
 *
 * Dates are included on purpose: they drive computed years of experience, so an
 * edit that only changes dates must still invalidate the cached score.
 */

/** Small stable hash. The Convex runtime has no `node:crypto`. */
export function contentHash(text: string) {
  let hash = 5381;
  const normalized = text.trim().replace(/\s+/g, " ").toLowerCase();
  for (let i = 0; i < normalized.length; i++) {
    hash = ((hash << 5) + hash + normalized.charCodeAt(i)) | 0;
  }
  return (hash >>> 0).toString(36);
}

export function buildProfileFingerprint(input: {
  skills: Array<{ skill_id: string; proficiency?: string | null }>;
  experiences: Array<{
    title?: string | null;
    company?: string | null;
    start_date?: number | null;
    end_date?: number | null;
    is_current?: boolean | null;
  }>;
  educations: Array<{
    degree?: string | null;
    college?: string | null;
    start_year?: number | null;
    end_year?: number | null;
  }>;
  resumes: Array<{ storage_id?: string | null; title?: string | null }>;
  professionalSummary?: string | null;
  about?: string | null;
  careerGoal?: { target_role?: string | null; updated_at?: number | null } | null;
}): string {
  return [
    input.skills
      .map((skill) => `${skill.skill_id}:${skill.proficiency ?? ""}`)
      .sort()
      .join(","),
    input.experiences
      .map(
        (e) =>
          `${e.title ?? ""}:${e.company ?? ""}:${e.start_date ?? ""}:${e.end_date ?? ""}:${e.is_current ? 1 : 0}`,
      )
      .join(","),
    input.educations
      .map((e) => `${e.degree ?? ""}:${e.college ?? ""}:${e.start_year ?? ""}:${e.end_year ?? ""}`)
      .join(","),
    input.resumes.map((r) => r.storage_id ?? r.title ?? "").join(","),
    // Content, not just length: an edit of equal length is still a new profile.
    contentHash(`${input.professionalSummary ?? ""}|${input.about ?? ""}`),
    input.careerGoal ? `${input.careerGoal.target_role ?? ""}:${input.careerGoal.updated_at ?? ""}` : "",
  ].join("|");
}
