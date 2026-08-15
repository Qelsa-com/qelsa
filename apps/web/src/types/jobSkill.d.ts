import { JobSkillType, ProficiencyLevel } from "../constants/skills";

export interface JobSkill {
  id?: any;
  title: string;        // kept for external/legacy jobs
  job_id?: number;
  skill_id?: number;
  skill?: { id: number; name: string } | null;
  // Per-skill requirement fields (POST /api/jobs/with-questions, GET /api/jobs/:id)
  type?: JobSkillType;
  proficiency?: ProficiencyLevel;
  weight?: number | null;
}
