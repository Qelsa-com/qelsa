import { JobApplication } from "./jobApplication";
import { JobSkill } from "./jobSkill";
import { Page } from "./page";

export type Job = {
  id: number;
  external_id: string;
  description?: string | null;
  application_url?: string | null;
  experience_level?: string | null;
  has_remote: boolean;
  language?: string | null;
  location?: string | null;
  published_date?: string | null;
  salary_currency?: string | null;
  salary_max?: number | null;
  salary_min?: number | null;
  salary?: number | null;
  title: string;
  work_type?: string | null;
  experience?: number | null;
  screening_questions?: ScreeningQuestion[];
  status?: "open" | "paused" | "closed" | "draft";
  workplace_type?: "on-site" | "remote" | "hybrid" | null;
  page_id?: number | null;
  resource?: string | null;

  // Company fields
  company_name?: string | null;
  company_logo?: string | null;
  company_twitter_handle?: string | null;
  company_website_url?: string | null;
  company_linkedin_url?: string | null;
  company_is_agency: boolean;
  company_github_url?: string | null;

  // JSON field
  other_info?: Record<string, any> | null;

  // Extended UI fields (not from API, used in AI/UI components)
  fitScore?: number | null;
  skills?: string[];
  source?: { platform?: string; exclusive?: boolean } | null;
  isQuickApplyAvailable?: boolean;
  requiredSkills?: string[];
  preferredSkills?: string[];
  aiSummary?: string | null;
  skillsGap?: string[];

  createdAt?: Date;
  updatedAt?: Date;

  page?: Page;
  is_bookmarked: boolean;

  job_skills?: JobSkill[];
  applications?: JobApplication[];
  questionSets?: QuestionSet[];
};
