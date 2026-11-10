import type { Doc } from "../_generated/dataModel";
import type { ScoringJob } from "./jobMatchScoring";

export type VectorSkill = {
  skill_id: string;
  name?: string;
  type?: "core" | "preferred" | "nice_to_have";
  proficiency?: "beginner" | "intermediate" | "advance" | "expert";
  weight?: number;
};

/**
 * The compact scoring row is the single job-skill source for readiness.
 *
 * The browse page, home rails, job page, employer views and cached ranking
 * must all score the same 60-skill snapshot. Reading `job_skills` directly in
 * some paths and the vector in others let the same job show different scores.
 */
export function skillsFromVector(vector: Pick<Doc<"job_match_vectors">, "skills">): VectorSkill[] {
  return vector.skills.map((skill) => ({
    skill_id: String(skill.skill_id),
    name: skill.name ?? undefined,
    type: skill.type ?? undefined,
    proficiency: skill.proficiency ?? undefined,
    weight: skill.weight ?? undefined,
  }));
}

export function jobFromVector(vector: Doc<"job_match_vectors">): ScoringJob {
  return {
    experience: vector.experience,
    title: vector.title,
    company_name: vector.company_name,
    industry: vector.industry,
    job_title_name: vector.job_title_name,
  };
}
