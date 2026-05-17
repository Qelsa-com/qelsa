export interface JobSkill {
  id?: any;
  title: string;        // kept for external/legacy jobs
  job_id?: number;
  skill_id?: number;
  skill?: { id: number; name: string } | null;
}
