import { Job } from "./job";
import { JobApplicationAnswer } from "./jobApplicationAnswers";
import { ScreeningQuestion } from "./question";
import { Resume } from "./resume";
import { User } from "./user";
import { Competency } from "./competency";

export type JobApplicationStatus = "applied" | "viewed" | "sorted" | "rejected" | "hold" | "cancelled";

/**
 * Slim row returned by GET /jobs/:id/applications. The full nested payload
 * (user, competency, experiences, answers, …) now lives behind the detail
 * endpoint — see {@link JobApplication}.
 */
export type JobApplicationListItem = {
  id: number;
  applicant_name: string;
  skills: { id: number; name: string; proficiency?: string }[];
  readiness: number;
  applied_at: string;
  status: JobApplicationStatus;
};

/** Full payload returned by GET /jobs/:id/applications/:applicationId. */
export type JobApplication = {
  id: number;
  job: Job;
  user: User;
  user_id: number;
  status: JobApplicationStatus;
  appliedAt: string;
  updatedAt: string;
  applied_at: Date;
  withdrawn_at?: Date | null;
  jobApplicationLogs: JobApplicationLog[];
  applied_days_ago?: number;
  screening_questions: ScreeningQuestion[];
  job_application_answers: JobApplicationAnswer[];
  resume?: Resume;
  competency?: Competency;
  createdAt: string;
  updatedAt: string;
};

export type JobApplicationLog = {
  id: number;
  job: Job;
  job_application: JobApplication;
  created_by: User;
  action_type: "status_changed";
  old_status: JobApplicationStatus;
  new_status: JobApplicationStatus;
  createdAt: string;
};
