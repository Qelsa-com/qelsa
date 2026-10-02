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
};

export type Competency = {
  competencies: CompetencyItem[];
  matchedCount: number;
  totalCount: number;
  readiness: number;
};
