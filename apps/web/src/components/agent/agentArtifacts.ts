"use client";

/**
 * Client-side artifacts derived from agent tool results.
 *
 * Artifacts are intentionally ephemeral: tool results already live in the
 * conversation, so opening one is just a focused reading surface — no extra
 * storage, subscription, or side effects. Cover letters, application kits,
 * fit reports, application trackers, and long text answers all use the same
 * panel shape.
 */

import type { AgentToolPart } from "./agentToolMeta";

export type AgentArtifactKind =
  | "cover_letter"
  | "application_kit"
  | "fit_report"
  | "tracker"
  | "resume_tailoring"
  | "application_questions"
  | "application_answers"
  | "interview_prep"
  | "comparison"
  | "follow_up"
  | "document";

export type AgentResumeDocument = {
  name: string;
  headline: string | null;
  email: string | null;
  phone: string | null;
  location: string | null;
  links: Array<{ label: string; url: string }>;
  summary: string;
  experience: Array<{
    title: string;
    company: string;
    start_date: number | null;
    end_date: number | null;
    is_current: boolean;
    bullets: string[];
    skills: string[];
  }>;
  education: Array<{
    degree: string;
    college: string;
    field: string | null;
    start_year: number | null;
    end_year: number | null;
  }>;
  certifications: string[];
  skills: string[];
  projects: string[];
};

export type AgentArtifact = {
  id: string;
  kind: AgentArtifactKind;
  title: string;
  subtitle?: string;
  badge?: string;
  jobId?: string;
  applicationUrl?: string;
  resumeUrl?: string;
  checklist?: string[];
  coverLetter?: string;
  resumeDocument?: AgentResumeDocument;
  alreadyApplied?: boolean;
  markdown: string;
};

function asResumeDocument(value: unknown): AgentResumeDocument | null {
  const row = asRecord(value);
  if (!row || typeof row.name !== "string" || typeof row.summary !== "string") return null;
  if (!Array.isArray(row.experience) || !Array.isArray(row.education)) return null;
  return row as AgentResumeDocument;
}

function asRecord(value: unknown): Record<string, any> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, any>;
}

function asArray(value: unknown): any[] {
  return Array.isArray(value) ? value : [];
}

function clean(value: unknown): string {
  return typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "";
}

function escapeTable(value: string): string {
  return value.replace(/\|/g, "\\|");
}

function formatDate(value: unknown): string {
  if (value == null) return "—";
  const date = new Date(value as string | number);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function scoreRows(output: Record<string, any>): Array<[string, number]> {
  const rows: Array<[string, number]> = [];
  const push = (label: string, value: unknown) => {
    if (typeof value === "number" && Number.isFinite(value)) rows.push([label, Math.round(value)]);
  };
  push("Experience", output.experience_match);
  push("Education", output.education_match);
  push("Domain", output.domain_match);
  push("Responsibilities", output.responsibilities_match);
  return rows;
}

function fitReportArtifact(
  part: AgentToolPart,
  output: Record<string, any>,
  jobId: string | undefined,
  jobTitle: string,
  company: string,
): AgentArtifact | null {
  if (!output.available) return null;
  const score = typeof output.overall === "number" ? Math.round(output.overall) : null;
  const strong = asArray(output.strong).filter((item) => typeof item === "string") as string[];
  const partial = asArray(output.partial).filter((item) => typeof item === "string") as string[];
  const missing = asArray(output.missing).filter((item) => typeof item === "string") as string[];
  const actions = asArray(output.actions).filter((item) => typeof item === "string") as string[];
  const rows = scoreRows(output);
  const matchUrl = typeof output.match_url_path === "string" ? output.match_url_path : null;

  const sections: string[] = [`# Fit report — ${jobTitle}`];
  if (score != null) sections.push(`## ${score}% match`);
  if (typeof output.headline === "string" && output.headline.trim()) sections.push(output.headline.trim());
  if (rows.length) {
    sections.push(
      `## Score breakdown\n\n| Area | Score |\n| --- | --- |\n${rows
        .map(([label, value]) => `| ${label} | ${value}% |`)
        .join("\n")}`,
    );
  }
  if (strong.length) sections.push(`## Strong matches\n\n${strong.map((item) => `- ${item}`).join("\n")}`);
  if (partial.length) sections.push(`## Partial matches\n\n${partial.map((item) => `- ${item}`).join("\n")}`);
  if (missing.length) sections.push(`## Gaps\n\n${missing.map((item) => `- ${item}`).join("\n")}`);
  if (actions.length) sections.push(`## Suggested next steps\n\n${actions.map((item) => `- ${item}`).join("\n")}`);
  if (matchUrl) sections.push(`[Open the full Qelsa Match analysis](${matchUrl})`);

  return {
    id: `fit-${part.toolCallId ?? jobId ?? "report"}`,
    kind: "fit_report",
    title: `Fit report · ${jobTitle}`,
    subtitle: company || undefined,
    badge: score != null ? `${score}% match` : undefined,
    jobId,
    markdown: sections.join("\n\n"),
  };
}

function trackerArtifact(part: AgentToolPart, output: Record<string, any>): AgentArtifact | null {
  const applications = asArray(output.applications);
  if (applications.length < 2) return null;
  const rows = applications.map((row: any) => {
    const job = asRecord(row?.job);
    const title = clean(job?.title) || "Job";
    const company = clean(job?.company) || "—";
    const status = clean(row?.status).replaceAll("_", " ") || "applied";
    return `| ${escapeTable(title)} | ${escapeTable(company)} | ${status} | ${formatDate(row?.applied_at)} |`;
  });
  return {
    id: `tracker-${part.toolCallId ?? "applications"}`,
    kind: "tracker",
    title: "Application tracker",
    subtitle: `${applications.length} applications`,
    markdown: [
      "# Application tracker",
      "| Role | Company | Status | Applied |",
      "| --- | --- | --- | --- |",
      ...rows,
    ].join("\n"),
  };
}

/**
 * Builds a panel artifact for tools that produce a substantial document.
 * Returns null for tools whose inline card is already the best view.
 */
export function artifactFromToolPart(
  part: AgentToolPart,
  options?: { jobTitle?: string; company?: string | null },
): AgentArtifact | null {
  const name = part.type.replace(/^tool-/, "");
  const input = asRecord(part.input);
  const output = asRecord(part.output);
  if (!output) return null;

  const jobId =
    (typeof input?.job_id === "string" && input.job_id) ||
    (typeof output.job_id === "string" && output.job_id) ||
    (typeof output.job?.job_id === "string" && output.job.job_id) ||
    undefined;
  const jobTitle = clean(output.job_title) || clean(output.job?.title) || clean(options?.jobTitle) || "this role";
  const company = clean(output.company) || clean(output.job?.company) || clean(options?.company);
  const subtitle = company || undefined;

  if (name === "write_cover_letter" && typeof output.cover_letter === "string") {
    return {
      id: `cover-${part.toolCallId ?? jobId ?? "letter"}`,
      kind: "cover_letter",
      title: `Cover letter · ${jobTitle}`,
      subtitle,
      jobId,
      coverLetter: output.cover_letter,
      markdown: output.cover_letter.trim(),
    };
  }

  if (name === "prepare_external_application") {
    const checklist = asArray(output.checklist).filter((item) => typeof item === "string") as string[];
    const coverLetter = typeof output.cover_letter === "string" ? output.cover_letter : undefined;
    const applicationUrl = typeof output.application_url === "string" ? output.application_url : undefined;
    const resumeUrl = typeof output.resume_link?.url === "string" ? output.resume_link.url : undefined;
    const sections: string[] = [`# Application kit — ${jobTitle}`];
    if (company) sections.push(`**Company:** ${company}`);
    if (applicationUrl) sections.push(`**Application page:** ${applicationUrl}`);
    if (resumeUrl) sections.push(`**Resume:** ${resumeUrl}`);
    if (checklist.length) {
      sections.push(`## Checklist\n\n${checklist.map((item, index) => `${index + 1}. ${item}`).join("\n")}`);
    }
    if (coverLetter) sections.push(`## Cover letter\n\n${coverLetter}`);

    return {
      id: `kit-${part.toolCallId ?? jobId ?? "application"}`,
      kind: "application_kit",
      title: `Application kit · ${jobTitle}`,
      subtitle,
      jobId,
      applicationUrl,
      resumeUrl,
      checklist,
      coverLetter,
      alreadyApplied: Boolean(output.already_applied),
      markdown: sections.join("\n\n"),
    };
  }

  if (name === "get_job_readiness" || name === "run_job_match" || name === "analyze_external_job") {
    return fitReportArtifact(part, output, jobId, jobTitle, company);
  }

  if (name === "list_my_applications") {
    return trackerArtifact(part, output);
  }

  if (name === "tailor_resume" && typeof output.markdown === "string") {
    return {
      id: `resume-${part.toolCallId ?? jobId ?? "plan"}`,
      kind: "resume_tailoring",
      title: `Resume plan · ${jobTitle}`,
      subtitle,
      jobId,
      resumeDocument: asResumeDocument(output.resume) ?? undefined,
      markdown: output.markdown,
    };
  }

  if (name === "prepare_interview" && typeof output.markdown === "string") {
    return {
      id: `interview-${part.toolCallId ?? jobId ?? "prep"}`,
      kind: "interview_prep",
      title: `Interview brief · ${jobTitle}`,
      subtitle,
      jobId,
      markdown: output.markdown,
    };
  }

  if ((name === "compare_jobs" || name === "compare_offers") && typeof output.markdown === "string") {
    return {
      id: `compare-${part.toolCallId ?? "jobs"}`,
      kind: "comparison",
      title: name === "compare_offers" ? "Offer comparison" : "Job comparison",
      markdown: output.markdown,
    };
  }

  if (name === "draft_candidate_outreach" && typeof output.markdown === "string") {
    const applicant = asRecord(output.applicant);
    const applicantName = clean(applicant?.name) || "candidate";
    return {
      id: `outreach-${part.toolCallId ?? "message"}`,
      kind: "follow_up",
      title: `Outreach · ${applicantName}`,
      subtitle: clean(output.job?.title) || undefined,
      markdown: output.markdown,
    };
  }

  if (name === "draft_follow_up" && typeof output.markdown === "string") {
    const followJob = asRecord(output.job);
    const followTitle = clean(followJob?.title) || jobTitle;
    return {
      id: `follow-up-${part.toolCallId ?? "email"}`,
      kind: "follow_up",
      title: `Follow-up · ${followTitle}`,
      subtitle: clean(followJob?.company) || undefined,
      markdown: output.markdown,
    };
  }

  if (name === "get_application_questions" && Array.isArray(output.questions)) {
    const questions = output.questions;
    if (!questions.length) return null;
    const lines = questions.map((question: any, index: number) => {
      const options = asArray(question.options).map((option: any) => clean(option.title)).filter(Boolean);
      return [
        `${index + 1}. **${clean(question.title) || "Question"}**${question.required ? " _(required)_" : ""}`,
        options.length ? `   Options: ${options.join(", ")}` : "",
      ]
        .filter(Boolean)
        .join("\n");
    });
    return {
      id: `questions-${part.toolCallId ?? jobId ?? "job"}`,
      kind: "application_questions",
      title: `Application questions · ${jobTitle}`,
      subtitle,
      jobId,
      markdown: [`# Application questions — ${jobTitle}`, ...lines].join("\n\n"),
    };
  }

  if (name === "draft_application_answers" && Array.isArray(output.answers)) {
    const answers = output.answers;
    if (!answers.length) return null;
    return {
      id: `answers-${part.toolCallId ?? jobId ?? "job"}`,
      kind: "application_answers",
      title: `Application answers · ${jobTitle}`,
      subtitle,
      jobId,
      markdown: [
        `# Application answers — ${jobTitle}`,
        "Review and edit these before submitting.",
        ...answers.map(
          (row: any, index: number) =>
            `## ${index + 1}. ${clean(row.question) || "Question"}\n\n${clean(row.answer)}`,
        ),
      ].join("\n\n"),
    };
  }

  return null;
}

/** A long assistant answer can be read in the focused panel too. */
export function documentArtifact(id: string, markdown: string): AgentArtifact {
  return {
    id: `doc-${id}`,
    kind: "document",
    title: "Qelsa Agent answer",
    subtitle: "Saved from this conversation",
    markdown,
  };
}
