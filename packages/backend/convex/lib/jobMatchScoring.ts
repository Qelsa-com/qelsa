import { calculateCareerAlignment, calculateSmartMatch } from "./careerAlignment";
import { isAlmostThere, roundedReadiness } from "./jobProfileMatch";
import { buildCompetencyFramework, closingGap, type ClosingGap } from "./skillMatch";

/**
 * One place that turns a job's scoring inputs into a score. The live browse path
 * and the background whole-catalog pass both call this, so a cached ranking can
 * never drift from what a page load would compute.
 */

export type ScoringSkill = {
  skill_id: string;
  name?: string | null;
  type?: "core" | "preferred" | "nice_to_have" | null;
  proficiency?: string | null;
  weight?: number | null;
};

export type ScoringJob = {
  experience?: number | null;
  title?: string | null;
  company_name?: string | null;
  /** Resolved page industry, when the job belongs to a company page. */
  industry?: string | null;
  /** Resolved job-title name, used when the job has no free-text title. */
  job_title_name?: string | null;
};

export type ScoringUserSkill = { skill_id: string; proficiency?: string; name?: string };

export type ScoringProfile = {
  yearsExperience?: number | null;
  educationCount?: number | null;
};

export type ScoringCareerGoal = {
  target_roles?: string[];
  target_role?: string;
  skills?: string[];
  industries?: string[];
  experience_level?: string;
} | null;

export type JobScore = {
  readiness: number | null;
  careerAlignment: number | null;
  smartMatch: number | null;
  gap: ClosingGap | null;
};

export function scoreJobForUser(
  job: ScoringJob,
  skills: ScoringSkill[],
  userSkills: ScoringUserSkill[],
  profileContext: ScoringProfile | undefined,
  careerGoal: ScoringCareerGoal,
): JobScore {
  const profile = profileContext
    ? {
        candidateYearsExperience: profileContext.yearsExperience ?? null,
        candidateEducationCount: profileContext.educationCount ?? null,
        requiredExperienceYears: job.experience ?? null,
      }
    : undefined;

  const framework = buildCompetencyFramework(
    skills.map((skill) => ({
      skill_id: skill.skill_id,
      type: skill.type ?? undefined,
      proficiency: skill.proficiency ?? undefined,
      weight: skill.weight ?? undefined,
      skill: { name: skill.name ?? undefined },
    })),
    userSkills,
    profile,
  );

  const readiness = roundedReadiness(framework.readiness);
  const careerAlignment = careerGoal
    ? calculateCareerAlignment(
        careerGoal,
        {
          title: job.title ?? job.job_title_name ?? undefined,
          industry: job.industry ?? undefined,
          company_name: job.company_name ?? undefined,
        },
        skills.map((skill) => skill.name ?? "").filter(Boolean),
      )
    : null;
  const smartMatch = readiness == null ? null : calculateSmartMatch(readiness, careerAlignment);
  const gap = readiness != null && isAlmostThere(readiness) ? closingGap(framework) : null;

  return { readiness, careerAlignment, smartMatch, gap };
}
