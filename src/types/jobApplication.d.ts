import { Job } from "./job";
import { JobApplicationAnswer } from "./jobApplicationAnswers";
import { ScreeningQuestion } from "./question";
import { Resume } from "./resume";
import { User } from "./user";
import { Competency } from "./competency";

export type JobApplication = {
  id: number;
  job: Job;
  user: User;
  user_id: number;
  status: "applied" | "sorted" | "rejected" | "hold" | "cancelled";
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
  old_status: "applied" | "sorted" | "rejected" | "hold" | "cancelled";
  new_status: "applied" | "sorted" | "rejected" | "hold" | "cancelled";
  createdAt: string;
};
