"use client";

/**
 * Shared types, tool labels, and suggestion prompts for the Qelsa Agent chat.
 *
 * `@convex-dev/agent/react` types its messages against the AI SDK's UI message
 * parts. The agent's tools are dynamic from the client's perspective, so we
 * describe the parts we render here rather than importing every tool schema.
 */

import {
  Bookmark,
  BriefcaseBusiness,
  CheckCircle2,
  ClipboardList,
  ExternalLink,
  FileSearch,
  FileText,
  PenLine,
  Search,
  Send,
  Sparkles,
  Target,
  UserRound,
  Wrench,
  type LucideIcon,
} from "lucide-react";

export type AgentJobSalary = {
  min: number | null;
  max: number | null;
  currency: string | null;
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

export type AgentUIPart = AgentTextPart | AgentToolPart | { type: string; [key: string]: unknown };

export type AgentUIMessage = {
  key: string;
  role: "user" | "assistant" | "system";
  status?: string;
  parts?: AgentUIPart[];
  text?: string;
  _creationTime?: number;
};

export const TOOL_META: Record<string, { done: string; running: string; icon: LucideIcon }> = {
  search_jobs: { done: "Searched jobs", running: "Searching jobs", icon: Search },
  get_job_details: { done: "Read job details", running: "Reading job details", icon: FileSearch },
  get_my_profile: { done: "Read your profile", running: "Reading your profile", icon: UserRound },
  list_my_applications: { done: "Checked your applications", running: "Checking your applications", icon: ClipboardList },
  list_saved_jobs: { done: "Checked saved jobs", running: "Checking saved jobs", icon: Bookmark },
  get_job_readiness: { done: "Checked your fit", running: "Checking your fit", icon: Target },
  write_cover_letter: { done: "Drafted a cover letter", running: "Drafting a cover letter", icon: PenLine },
  save_job: { done: "Updated saved jobs", running: "Updating saved jobs", icon: Bookmark },
  apply_to_job: { done: "Submitted application", running: "Submitting application", icon: Send },
  prepare_external_application: {
    done: "Prepared external application",
    running: "Preparing external application",
    icon: ExternalLink,
  },
  record_external_application: {
    done: "Recorded external application",
    running: "Recording external application",
    icon: CheckCircle2,
  },
  update_career_goal: { done: "Updated career goal", running: "Updating career goal", icon: Target },
};

export function toolNameOf(part: AgentToolPart) {
  return part.type.replace(/^tool-/, "");
}

export function toolMetaFor(name: string) {
  return TOOL_META[name] ?? { done: "Ran action", running: "Running action", icon: Wrench };
}

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
    subtitle: "Review my applications",
    prompt: "Show me my applications and their current statuses.",
    icon: ClipboardList,
  },
  {
    title: "Draft a cover letter",
    subtitle: "Tailored to one role",
    prompt: "Help me write a cover letter for a job I'm interested in.",
    icon: FileText,
  },
  {
    title: "Plan my next move",
    subtitle: "Set a career goal",
    prompt: "Help me set a career goal based on my profile.",
    icon: Sparkles,
  },
];

/**
 * Instant chips while the backend's contextual suggestion call is in flight.
 * Mirrors the server fallback so every completed reply always has a next step.
 */
export function fallbackFollowUps(toolNames: string[]): string[] {
  const names = new Set(toolNames);
  if (names.has("write_cover_letter")) {
    return ["Make the cover letter more technical", "Shorten the cover letter", "Prepare my application"];
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
