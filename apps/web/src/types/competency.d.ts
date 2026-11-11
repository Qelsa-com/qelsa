import { JobSkillType, ProficiencyLevel } from "../constants/skills";

export type CompetencyItem = {
  skill_id: number;
  skill_name: string;
  type: JobSkillType;
  required_proficiency: ProficiencyLevel | "" | null;
  candidate_proficiency: ProficiencyLevel | "" | null;
  /** Skill is on the candidate's profile, even when no level is set. */
  has_skill?: boolean;
  weight: number;
  status: string; // "match" | "exceeds" | "gap"
  matched: boolean;
  /** Fraction of the weight earned (1 met, partial below the bar, 0 missing). */
  credit?: number;
  /** True for the employer's core/required skills. */
  required?: boolean;
};

export type MatchGap = {
  skills: string[];
  reachesReady: boolean;
  blocker: "skills" | "experience" | "profile";
};

export type Competency = {
  competencies: CompetencyItem[];
  matchedCount: number;
  totalCount: number;
  readiness: number;
  career_alignment?: number | null;
  smart_match?: number | null;
  gap?: MatchGap | null;
  skillReadiness?: number | null;
  experienceScore?: number | null;
  /** "none" = role states no minimum; "unknown" = missing requirement; "set" = scored. */
  experienceRequirement?: "unknown" | "none" | "set";
  /** Number of missing core skills; shown as a warning only. */
  missingRequired?: number;
};
