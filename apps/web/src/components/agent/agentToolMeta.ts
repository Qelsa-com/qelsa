"use client";

/**
 * Shared types, tool labels, and suggestion prompts for the Qelsa Agent chat.
 *
 * `@convex-dev/agent/react` types its messages against the AI SDK's UI message
 * parts. The agent's tools are dynamic from the client's perspective, so we
 * describe the parts we render here rather than importing every tool schema.
 */

import {
  Bell,
  Bookmark,
  Brain,
  BriefcaseBusiness,
  Calendar,
  CheckCircle2,
  ClipboardList,
  ExternalLink,
  FileSearch,
  FileText,
  Globe2,
  ListChecks,
  Mail,
  PenLine,
  Scale,
  Search,
  Send,
  Settings,
  Sparkles,
  Target,
  Trash2,
  UserRound,
  Wrench,
  type LucideIcon,
} from "lucide-react";

export type AgentJobSalary = {
  min: number | null;
  max: number | null;
  currency: string | null;
};

export type AgentCourse = {
  course_id: string;
  title: string;
  provider: string;
  url: string;
  level: "Beginner" | "Intermediate" | "Advanced";
  duration: string;
  free: boolean;
  description: string;
  matched_skills?: string[];
  affiliate?: boolean;
};

export type AgentJobSummary = {
  job_id: string;
  title: string;
  company?: string | null;
  location?: string | null;
  workplace_type?: string | null;
  work_type?: string | null;
  experience_years?: number | null;
  salary?: AgentJobSalary | null;
  posted_at?: string | number | null;
  applies_on_external_site?: boolean;
  url_path?: string;
};

export type AgentToolState =
  | "input-streaming"
  | "input-available"
  | "output-available"
  | "output-error"
  | "output-denied"
  | "approval-requested"
  | "approval-responded";

export type AgentToolPart = {
  type: string;
  toolCallId?: string;
  state?: AgentToolState;
  input?: unknown;
  output?: unknown;
  errorText?: string;
  approval?: {
    id: string;
    approved?: boolean;
    reason?: string;
    requestReason?: string;
  };
};

export type AgentTextPart = { type: "text"; text: string };

export type AgentReasoningPart = {
  type: "reasoning";
  text: string;
  state?: "streaming" | "done";
};

export type AgentUIPart =
  | AgentTextPart
  | AgentReasoningPart
  | AgentToolPart
  | { type: string; [key: string]: unknown };

export type AgentUIMessage = {
  key: string;
  role: "user" | "assistant" | "system";
  status?: string;
  parts?: AgentUIPart[];
  text?: string;
  _creationTime?: number;
};

export const TOOL_META: Record<
  string,
  { done: string; running: string; failed: string; icon: LucideIcon }
> = {
  search_jobs: {
    done: "Searched jobs",
    running: "Searching jobs",
    failed: "Couldn't search jobs",
    icon: Search,
  },
  get_job_details: {
    done: "Read job details",
    running: "Reading job details",
    failed: "Couldn't read job details",
    icon: FileSearch,
  },
  get_my_profile: {
    done: "Read your profile",
    running: "Reading your profile",
    failed: "Couldn't read your profile",
    icon: UserRound,
  },
  list_my_applications: {
    done: "Checked your applications",
    running: "Checking your applications",
    failed: "Couldn't check your applications",
    icon: ClipboardList,
  },
  list_saved_jobs: {
    done: "Checked saved jobs",
    running: "Checking saved jobs",
    failed: "Couldn't check saved jobs",
    icon: Bookmark,
  },
  get_job_readiness: {
    done: "Checked your fit",
    running: "Checking your fit",
    failed: "Couldn't check your fit",
    icon: Target,
  },
  write_cover_letter: {
    done: "Drafted a cover letter",
    running: "Drafting a cover letter",
    failed: "Couldn't draft the cover letter",
    icon: PenLine,
  },
  get_skill_courses: {
    done: "Found upskilling courses",
    running: "Finding upskilling courses",
    failed: "Couldn't find courses",
    icon: FileText,
  },
  web_search: {
    done: "Searched the web",
    running: "Searching the web",
    failed: "Couldn't search the web",
    icon: Globe2,
  },
  remember_about_me: {
    done: "Saved to memory",
    running: "Saving to memory",
    failed: "Couldn't save to memory",
    icon: Brain,
  },
  list_my_memory: {
    done: "Read Agent memory",
    running: "Reading Agent memory",
    failed: "Couldn't read Agent memory",
    icon: Brain,
  },
  forget_about_me: {
    done: "Removed from memory",
    running: "Removing from memory",
    failed: "Couldn't remove from memory",
    icon: Trash2,
  },
  run_job_match: {
    done: "Checked your fit",
    running: "Checking your fit",
    failed: "Couldn't check your fit",
    icon: Target,
  },
  analyze_external_job: {
    done: "Analyzed the external job",
    running: "Analyzing the external job",
    failed: "Couldn't analyze the external job",
    icon: Globe2,
  },
  tailor_resume: {
    done: "Tailored your resume",
    running: "Tailoring your resume",
    failed: "Couldn't tailor your resume",
    icon: FileText,
  },
  get_application_questions: {
    done: "Read application questions",
    running: "Reading application questions",
    failed: "Couldn't read application questions",
    icon: ListChecks,
  },
  draft_application_answers: {
    done: "Drafted application answers",
    running: "Drafting application answers",
    failed: "Couldn't draft application answers",
    icon: PenLine,
  },
  get_application_details: {
    done: "Read application details",
    running: "Reading application details",
    failed: "Couldn't read application details",
    icon: ClipboardList,
  },
  get_stale_applications: {
    done: "Checked for follow-ups",
    running: "Checking for follow-ups",
    failed: "Couldn't check for follow-ups",
    icon: Bell,
  },
  withdraw_application: {
    done: "Withdrew application",
    running: "Withdrawing application",
    failed: "Couldn't withdraw the application",
    icon: CheckCircle2,
  },
  add_application_note: {
    done: "Saved application note",
    running: "Saving application note",
    failed: "Couldn't save the note",
    icon: PenLine,
  },
  draft_follow_up: {
    done: "Drafted a follow-up",
    running: "Drafting a follow-up",
    failed: "Couldn't draft the follow-up",
    icon: Mail,
  },
  prepare_interview: {
    done: "Prepared interview brief",
    running: "Preparing interview brief",
    failed: "Couldn't prepare the interview brief",
    icon: Calendar,
  },
  compare_jobs: {
    done: "Compared the roles",
    running: "Comparing the roles",
    failed: "Couldn't compare the roles",
    icon: Scale,
  },
  compare_offers: {
    done: "Compared the offers",
    running: "Comparing the offers",
    failed: "Couldn't compare the offers",
    icon: Scale,
  },
  update_profile: {
    done: "Updated your profile",
    running: "Updating your profile",
    failed: "Couldn't update your profile",
    icon: Settings,
  },
  add_profile_skills: {
    done: "Added profile skills",
    running: "Adding profile skills",
    failed: "Couldn't add profile skills",
    icon: Settings,
  },
  save_job_search: {
    done: "Saved the job search",
    running: "Saving the job search",
    failed: "Couldn't save the job search",
    icon: Search,
  },
  list_saved_searches: {
    done: "Checked saved searches",
    running: "Checking saved searches",
    failed: "Couldn't check saved searches",
    icon: Search,
  },
  update_job_search_alerts: {
    done: "Updated search alerts",
    running: "Updating search alerts",
    failed: "Couldn't update search alerts",
    icon: Bell,
  },
  delete_job_search: {
    done: "Deleted the job search",
    running: "Deleting the job search",
    failed: "Couldn't delete the job search",
    icon: Search,
  },
  get_unread_briefs: {
    done: "Read your agent briefs",
    running: "Reading your agent briefs",
    failed: "Couldn't read your agent briefs",
    icon: Bell,
  },
  list_my_jobs: {
    done: "Reviewed your jobs",
    running: "Reviewing your jobs",
    failed: "Couldn't review your jobs",
    icon: BriefcaseBusiness,
  },
  search_applicants: {
    done: "Searched applicants",
    running: "Searching applicants",
    failed: "Couldn't search applicants",
    icon: Search,
  },
  get_applicant_context: {
    done: "Read the applicant",
    running: "Reading the applicant",
    failed: "Couldn't read the applicant",
    icon: UserRound,
  },
  update_applicant_status: {
    done: "Updated the applicant stage",
    running: "Updating the applicant stage",
    failed: "Couldn't update the applicant stage",
    icon: CheckCircle2,
  },
  draft_candidate_outreach: {
    done: "Drafted outreach",
    running: "Drafting outreach",
    failed: "Couldn't draft outreach",
    icon: Mail,
  },
  save_job: {
    done: "Updated saved jobs",
    running: "Updating saved jobs",
    failed: "Couldn't update saved jobs",
    icon: Bookmark,
  },
  apply_to_job: {
    done: "Submitted application",
    running: "Submitting application",
    failed: "Couldn't submit the application",
    icon: Send,
  },
  prepare_external_application: {
    done: "Prepared external application",
    running: "Preparing external application",
    failed: "Couldn't prepare the application",
    icon: ExternalLink,
  },
  record_external_application: {
    done: "Recorded external application",
    running: "Recording external application",
    failed: "Couldn't record the application",
    icon: CheckCircle2,
  },
  update_career_goal: {
    done: "Updated career goal",
    running: "Updating career goal",
    failed: "Couldn't update the career goal",
    icon: Target,
  },
};

export function toolNameOf(part: AgentToolPart) {
  return part.type.replace(/^tool-/, "");
}

export function toolMetaFor(name: string) {
  return (
    TOOL_META[name] ?? {
      done: "Ran action",
      running: "Running action",
      failed: "Couldn't complete that action",
      icon: Wrench,
    }
  );
}

export function isReasoningPart(part: any): part is AgentReasoningPart {
  return part?.type === "reasoning" && typeof part.text === "string";
}

export const RECRUITER_SUGGESTIONS: Array<{
  title: string;
  subtitle: string;
  prompt: string;
  icon: LucideIcon;
}> = [
  {
    title: "Review my jobs",
    subtitle: "Applicants and pipeline health",
    prompt: "List my jobs and tell me which ones need attention.",
    icon: BriefcaseBusiness,
  },
  {
    title: "Find applicants",
    subtitle: "Search your applicant pool",
    prompt: "Show me the strongest applicants for my open roles.",
    icon: UserRound,
  },
  {
    title: "Shortlist candidates",
    subtitle: "Evidence and gaps, not keywords",
    prompt: "Find the best applicants for my most recent job and explain why they fit.",
    icon: ClipboardList,
  },
  {
    title: "Draft outreach",
    subtitle: "Specific messages to strong fits",
    prompt: "Draft an outreach message to a strong applicant for one of my jobs.",
    icon: Mail,
  },
];

export const SUGGESTIONS: Array<{
  title: string;
  subtitle: string;
  prompt: string;
  icon: LucideIcon;
}> = [
  {
    title: "Find jobs for me",
    subtitle: "Search open roles by title",
    prompt: "Find jobs that match my skills and experience.",
    icon: BriefcaseBusiness,
  },
  {
    title: "Where do I stand?",
    subtitle: "Applications, follow-ups, next steps",
    prompt: "Review my applications and tell me which ones need a follow-up.",
    icon: ClipboardList,
  },
  {
    title: "Tailor my resume",
    subtitle: "For a role I'm targeting",
    prompt: "Pick my strongest target role and tailor my resume for it.",
    icon: FileText,
  },
  {
    title: "Prepare for an interview",
    subtitle: "Questions, stories, 7-day plan",
    prompt: "Help me prepare for an interview for a role I'm pursuing.",
    icon: Sparkles,
  },
];

/**
 * Instant chips while the backend's contextual suggestion call is in flight.
 * Mirrors the server fallback so every completed reply always has a next step.
 */
export function fallbackFollowUps(toolNames: string[], recruiter = false): string[] {
  const names = new Set(toolNames);
  if (recruiter) {
    if (names.has("list_my_jobs")) {
      return ["Find applicants for my newest job", "Which job needs attention?", "Draft outreach to a strong applicant"];
    }
    if (names.has("search_applicants")) {
      return ["Shortlist the top 3", "Draft outreach to the best fit", "Compare the top applicants"];
    }
    if (names.has("get_applicant_context")) {
      return ["Draft outreach to this applicant", "Move them to shortlisted", "Find similar applicants"];
    }
    if (names.has("update_applicant_status")) {
      return ["Draft outreach to this applicant", "Find the next shortlist", "Review my jobs"];
    }
    if (names.has("draft_candidate_outreach")) {
      return ["Make it more specific", "Shorten the message", "Find similar applicants"];
    }
    return ["List my jobs", "Find applicants for a role", "Which job needs attention?"];
  }
  if (names.has("web_search")) {
    return ["Compare these options", "Find a course for this skill", "Check my fit for a role"];
  }
  if (names.has("remember_about_me") || names.has("list_my_memory")) {
    return ["What do you remember about me?", "Forget that", "Find jobs for me"];
  }
  if (names.has("write_cover_letter")) {
    return ["Make the cover letter more technical", "Tailor my resume too", "Prepare my application"];
  }
  if (names.has("tailor_resume")) {
    return ["Draft a cover letter for this job", "What skills should I add?", "Prepare for an interview"];
  }
  if (names.has("prepare_interview")) {
    return ["Ask me a mock interview question", "Draft a thank-you note", "Compare this with another job"];
  }
  if (names.has("run_job_match") || names.has("analyze_external_job")) {
    return ["Show courses for my missing skills", "Tailor my resume for this job", "What should I improve?"];
  }
  if (names.has("get_skill_courses")) {
    return ["Build me a learning plan", "Check my fit for this job", "Tailor my resume for this job"];
  }
  if (names.has("get_application_questions")) {
    return ["Draft answers to these questions", "Check my fit first", "Apply with my best resume"];
  }
  if (names.has("draft_application_answers")) {
    return ["Apply with these answers", "Make the answers shorter", "Check my fit again"];
  }
  if (names.has("get_stale_applications")) {
    return ["Draft a follow-up for the oldest one", "Show all my applications", "Find new roles"];
  }
  if (names.has("draft_follow_up")) {
    return ["Make the follow-up shorter", "Show my application tracker", "Find similar jobs"];
  }
  if (names.has("compare_jobs")) {
    return ["Check my fit for the top choice", "Tailor my resume for it", "Find similar roles"];
  }
  if (names.has("compare_offers")) {
    return ["Draft the negotiation email", "Compare these roles' growth", "Review my decision"];
  }
  if (names.has("save_job_search")) {
    return ["Show my saved searches", "Find jobs for me now", "What's new?"];
  }
  if (names.has("get_unread_briefs")) {
    return ["Review the best new match", "Check my applications", "Update my job preferences"];
  }
  if (names.has("prepare_external_application")) {
    return ["I've applied — record it", "Check my fit for this job", "Find similar jobs"];
  }
  if (names.has("get_job_readiness")) {
    return ["Draft a cover letter for this job", "What should I improve?", "Find similar jobs"];
  }
  if (names.has("apply_to_job")) {
    return ["What should I prepare for the interview?", "Find similar roles", "Show my applications"];
  }
  if (names.has("list_my_applications")) {
    return ["Which applications should I follow up on?", "Find jobs matching my skills", "Show my saved jobs"];
  }
  if (names.has("list_saved_jobs")) {
    return ["Check my fit for the best saved job", "Apply to the best match", "Find similar jobs"];
  }
  if (names.has("get_job_details")) {
    return ["Check my fit for this job", "Draft a cover letter", "Prepare my application"];
  }
  if (names.has("search_jobs")) {
    return ["Check my fit for the top match", "Only show remote roles", "Save the best match"];
  }
  if (names.has("save_job")) {
    return ["Apply to this job", "Draft a cover letter", "Find similar jobs"];
  }
  if (names.has("update_career_goal")) {
    return ["Find jobs that fit this goal", "Review my profile", "Draft a cover letter"];
  }
  if (names.has("get_my_profile")) {
    return ["Find jobs for me", "Draft a cover letter", "Set a career goal"];
  }
  return ["Find jobs for me", "Review my applications", "Draft a cover letter"];
}
