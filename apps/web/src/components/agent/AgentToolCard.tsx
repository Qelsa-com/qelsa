"use client";

/**
 * Renders one agent tool call: a compact status strip plus a result view that
 * fits the Qelsa design language (job cards, readiness chips, application kit).
 * Write tools surface an approval prompt with Approve / Deny buttons.
 */

import { api } from "@/lib/convexApi";
import { cn } from "@/components/ui/utils";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useCreateJobApplicationMutation } from "@/features/api/jobApplicationsApi";
import { toastUnknownError } from "@/lib/errors";
import { useMutation, useQuery } from "convex/react";
import {
  AlertCircle,
  ArrowUpRight,
  Ban,
  Brain,
  BriefcaseBusiness,
  Check,
  ChevronDown,
  Copy,
  ExternalLink,
  FileText,
  Globe2,
  GraduationCap,
  Loader2,
  PanelRight,
  ShieldQuestion,
  Trash2,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { artifactFromToolPart, type AgentArtifact } from "./agentArtifacts";
import {
  type AgentCourse,
  type AgentJobSummary,
  type AgentToolPart,
  toolMetaFor,
  toolNameOf,
} from "./agentToolMeta";
import { AgentTraceLine } from "./AgentTrace";

function asRecord(value: unknown): Record<string, any> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, any>;
}

function asArray(value: unknown): any[] {
  return Array.isArray(value) ? value : [];
}

function jobIdsIn(part: AgentToolPart): string[] {
  const input = asRecord(part.input);
  const output = asRecord(part.output);
  const ids = new Set<string>();
  const push = (value: unknown) => {
    if (typeof value === "string" && value.trim()) ids.add(value);
  };
  push(input?.job_id);
  push(input?.jobId);
  push(output?.job?.job_id);
  push(output?.job_id);
  return [...ids].slice(0, 8);
}

export function salaryLabel(salary?: AgentJobSummary["salary"]): string | null {
  if (!salary || (salary.min == null && salary.max == null)) return null;
  const currency = salary.currency ?? "USD";
  const format = (value: number) => {
    try {
      return new Intl.NumberFormat(undefined, {
        style: "currency",
        currency,
        maximumFractionDigits: 0,
        notation: "compact",
      }).format(value);
    } catch {
      return `${currency} ${value.toLocaleString()}`;
    }
  };
  if (salary.min != null && salary.max != null) {
    return salary.min === salary.max ? format(salary.min) : `${format(salary.min)} – ${format(salary.max)}`;
  }
  if (salary.min != null) return `${format(salary.min)}+`;
  return `Up to ${format(salary.max as number)}`;
}

function relativeTime(value: unknown): string | null {
  if (value == null) return null;
  const date = new Date(value as string | number);
  if (Number.isNaN(date.getTime())) return null;
  const seconds = (Date.now() - date.getTime()) / 1000;
  if (seconds < 3600) return `${Math.max(1, Math.floor(seconds / 60))}m ago`;
  if (seconds < 86_400) return `${Math.floor(seconds / 3_600)}h ago`;
  const days = Math.floor(seconds / 86_400);
  if (days < 30) return `${days}d ago`;
  return date.toLocaleDateString();
}

const STATUS_TONE: Record<string, string> = {
  applied: "border-sky-400/25 bg-sky-400/10 text-sky-300",
  viewed: "border-cyan-400/25 bg-cyan-400/10 text-cyan-300",
  shortlisted: "border-emerald-400/25 bg-emerald-400/10 text-emerald-300",
  sorted: "border-violet-400/25 bg-violet-400/10 text-violet-300",
  hold: "border-amber-400/25 bg-amber-400/10 text-amber-300",
  rejected: "border-rose-400/25 bg-rose-400/10 text-rose-300",
  cancelled: "border-white/15 bg-white/[0.04] text-white/45",
  withdrawn: "border-white/15 bg-white/[0.04] text-white/45",
};

function StatusChip({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold capitalize",
        STATUS_TONE[status.toLowerCase()] ?? "border-white/15 bg-white/[0.04] text-white/55",
      )}
    >
      {status.replaceAll("_", " ")}
    </span>
  );
}

function JobRow({ job }: { job: AgentJobSummary }) {
  const salary = salaryLabel(job.salary);
  const meta = [job.company, job.location].filter(Boolean).join(" · ");
  return (
    <a
      href={`/jobs/${job.job_id}`}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex items-center gap-3 rounded-lg border border-white/[0.07] bg-white/[0.03] px-3 py-2 transition-colors hover:border-sky-400/30 hover:bg-white/[0.06]"
    >
      <div className="flex size-7 shrink-0 items-center justify-center rounded-md border border-white/10 bg-white/[0.05] text-white/50">
        <BriefcaseBusiness className="size-3.5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-semibold text-white/90 group-hover:text-white">{job.title}</p>
        <p className="truncate text-[11px] text-white/45">{meta || "Qelsa job"}</p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {job.workplace_type && (
          <span className="hidden rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[10px] capitalize text-white/55 sm:inline-flex">
            {job.workplace_type}
          </span>
        )}
        {salary && <span className="text-[11px] font-semibold text-white/75">{salary}</span>}
        <ArrowUpRight className="size-3.5 text-white/30 transition-colors group-hover:text-sky-300" />
      </div>
    </a>
  );
}

/** The visible result of a job search/list, kept outside the process trace. */
export function AgentJobResults({ label, jobs }: { label: string; jobs: AgentJobSummary[] }) {
  if (!jobs.length) return null;
  return (
    <section aria-label={label} className="overflow-hidden rounded-xl border border-white/[0.08] bg-white/[0.02]">
      <div className="flex items-center justify-between gap-3 border-b border-white/[0.06] px-3 py-2">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/35">{label}</p>
        <span className="text-[10px] tabular-nums text-white/30">
          {jobs.length} {jobs.length === 1 ? "role" : "roles"}
        </span>
      </div>
      <div className="space-y-1.5 p-2">
        {jobs.map((job) => (
          <JobRow key={job.job_id} job={job} />
        ))}
      </div>
    </section>
  );
}

function CourseList({ courses, jobId }: { courses: AgentCourse[]; jobId?: string }) {
  const trackClick = useMutation(api.agentCourseTracking.trackClick);
  if (!courses.length) return null;
  const hasAffiliate = courses.some((course) => course.affiliate);
  return (
    <div className="space-y-1.5">
      <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-white/35">
        <GraduationCap className="size-3 text-neon-cyan/80" />
        Courses to close the gap
      </p>
      {courses.slice(0, 4).map((course) => (
        <a
          key={course.course_id}
          href={course.url}
          target="_blank"
          rel={course.affiliate ? "noopener noreferrer sponsored" : "noopener noreferrer"}
          onClick={() => {
            void trackClick({
              courseId: course.course_id,
              provider: course.provider,
              jobId: jobId as any,
              source: "agent_fit",
              matchedSkills: course.matched_skills ?? [],
            }).catch(() => undefined);
          }}
          className="group flex items-start gap-2.5 rounded-lg border border-white/[0.07] bg-white/[0.03] px-2.5 py-2 transition-colors hover:border-sky-400/30 hover:bg-white/[0.06]"
        >
          <div className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-md border border-white/10 bg-white/[0.04] text-sky-300">
            <GraduationCap className="size-3.5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="min-w-0 flex-1 truncate text-[11px] font-semibold text-white/85 group-hover:text-white">
                {course.title}
              </p>
              {course.free && (
                <span className="shrink-0 rounded-full border border-emerald-400/20 bg-emerald-400/[0.08] px-1.5 py-0.5 text-[9px] font-semibold text-emerald-300">
                  Free
                </span>
              )}
              {course.affiliate && (
                <span className="shrink-0 rounded-full border border-amber-400/20 bg-amber-400/[0.08] px-1.5 py-0.5 text-[9px] font-semibold text-amber-300">
                  Affiliate
                </span>
              )}
            </div>
            <p className="truncate text-[10px] text-white/40">
              {[course.provider, course.duration].filter(Boolean).join(" · ")}
            </p>
            {course.matched_skills && course.matched_skills.length > 0 && (
              <p className="mt-0.5 truncate text-[10px] text-sky-300/60">
                For {course.matched_skills.slice(0, 3).join(", ")}
              </p>
            )}
          </div>
          <ArrowUpRight className="mt-0.5 size-3 shrink-0 text-white/25 transition-colors group-hover:text-sky-300" />
        </a>
      ))}
      {hasAffiliate && (
        <p className="text-[9px] leading-relaxed text-white/30">
          Some links are affiliate links. Qelsa may earn a commission at no extra cost to you. Recommendations are
          ranked by skill fit, not commission.
        </p>
      )}
    </div>
  );
}

function ChipList({ label, items, tone }: { label: string; items: string[]; tone: string }) {
  if (!items.length) return null;
  const visible = items.slice(0, 3);
  const rest = items.length - visible.length;
  return (
    <div className="flex flex-wrap items-center gap-1">
      <span className="text-[10px] font-semibold uppercase tracking-wide text-white/35">{label}</span>
      {visible.map((item) => (
        <span key={item} className={cn("rounded-full border px-2 py-0.5 text-[10px] font-medium", tone)}>
          {item}
        </span>
      ))}
      {rest > 0 && <span className="text-[10px] text-white/35">+{rest}</span>}
    </div>
  );
}

function CopyButton({ text, label }: { text: string; label: string }) {
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          toast.success("Copied to clipboard");
        } catch {
          toast.error("Couldn't copy — select the text instead.");
        }
      }}
      className="inline-flex items-center gap-1.5 rounded-lg border border-white/12 bg-white/[0.04] px-2.5 py-1.5 text-[11px] font-semibold text-white/70 transition-colors hover:border-white/25 hover:text-white"
    >
      <Copy className="size-3" />
      {label}
    </button>
  );
}

function ArtifactButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 rounded-lg border border-sky-400/25 bg-sky-400/[0.08] px-2.5 py-1.5 text-[11px] font-semibold text-sky-200 transition-colors hover:border-sky-400/40 hover:bg-sky-400/[0.14]"
    >
      <PanelRight className="size-3.5" />
      {label}
    </button>
  );
}

function ApprovalBody({
  name,
  input,
  labels,
  resolving,
  onApprove,
  onDeny,
}: {
  name: string;
  input: Record<string, any> | null;
  labels: Map<string, { title: string; company: string | null }>;
  resolving: boolean;
  onApprove: () => void;
  onDeny: () => void;
}) {
  const label = typeof input?.job_id === "string" ? labels.get(input.job_id) : undefined;
  const jobText = label ? `${label.title}${label.company ? ` at ${label.company}` : ""}` : "this job";
  let copy = "Run this action?";
  if (name === "apply_to_job") copy = `Send your application to ${jobText}?`;
  else if (name === "save_job") {
    copy = input?.save === false ? `Remove ${jobText} from saved jobs?` : `Save ${jobText}?`;
  } else if (name === "record_external_application") copy = `Record your application to ${jobText}?`;
  else if (name === "update_career_goal") {
    copy = `Update your career goal to “${input?.target_role ?? "a new role"}”?`;
  } else if (name === "update_profile") {
    copy = "Update your profile with these changes?";
  } else if (name === "add_profile_skills") {
    copy = "Add these skills to your profile?";
  } else if (name === "update_applicant_status") {
    copy = `Move this applicant to ${String(input?.status ?? "a new stage").replaceAll("_", " ")}?`;
  } else if (name === "save_job_search") {
    copy = `Watch “${input?.name ?? "this search"}” and brief you on new matches?`;
  } else if (name === "delete_job_search") {
    copy = "Delete this saved search?";
  } else if (name === "withdraw_application") {
    copy = "Withdraw this application? This cannot be undone.";
  } else if (name === "add_application_note") {
    copy = "Save this private note to the application?";
  }

  const profileFields =
    name === "update_profile" && input
      ? Object.entries(input)
          .filter(([, value]) => value !== undefined && value !== null && !Array.isArray(value))
          .slice(0, 4)
      : [];
  const answersCount =
    name === "apply_to_job" && input?.answers && typeof input.answers === "object"
      ? Object.keys(input.answers).length
      : 0;

  return (
    <div className="mt-2 space-y-2.5">
      <p className="text-[13px] font-medium text-amber-100/90">{copy}</p>
      {profileFields.length > 0 && (
        <div className="space-y-1 rounded-lg border border-white/[0.07] bg-black/20 px-2.5 py-2">
          {profileFields.map(([key, value]) => (
            <p key={key} className="text-[11px] text-white/50">
              <span className="capitalize text-white/35">{key.replaceAll("_", " ")}:</span>{" "}
              <span className="text-white/70">{String(value).slice(0, 120)}</span>
            </p>
          ))}
        </div>
      )}
      {answersCount > 0 && (
        <p className="text-[11px] text-white/45">
          Includes {answersCount} screening answer{answersCount === 1 ? "" : "s"}.
        </p>
      )}
      {name === "add_profile_skills" && Array.isArray(input?.skills) && (
        <div className="flex flex-wrap gap-1">
          {input.skills.slice(0, 10).map((skill: any, index: number) => (
            <span
              key={`${skill?.name ?? "skill"}-${index}`}
              className="rounded-full border border-emerald-400/20 bg-emerald-400/[0.06] px-2 py-0.5 text-[10px] text-emerald-200/80"
            >
              {String(skill?.name ?? "Skill")}
            </span>
          ))}
        </div>
      )}
      {name === "add_application_note" && input?.text && (
        <p className="rounded-lg border border-white/[0.07] bg-black/20 px-2.5 py-2 text-[11px] text-white/55">
          {String(input.text).slice(0, 240)}
        </p>
      )}
      {name === "update_applicant_status" && input?.note && (
        <p className="rounded-lg border border-white/[0.07] bg-black/20 px-2.5 py-2 text-[11px] text-white/55">
          Note: {String(input.note).slice(0, 240)}
        </p>
      )}
      {name === "save_job_search" && (
        <>
          <p className="text-[11px] text-white/45">
            {[
              input?.query,
              input?.city,
              input?.remote ? "remote" : input?.workplace_type,
              input?.salary_min ? `${input.salary_min}+` : null,
            ]
              .filter(Boolean)
              .join(" · ") || "All open roles"}
          </p>
          <p className="text-[10px] text-white/30">Email and browser alerts are on by default.</p>
        </>
      )}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={resolving}
          onClick={onApprove}
          className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-[#623dd6] via-[#8433ae] to-[#be2680] px-3 py-1.5 text-[12px] font-semibold text-white shadow-lg shadow-purple-900/25 transition-opacity hover:opacity-95 disabled:opacity-60"
        >
          {resolving ? <Loader2 className="size-3.5 animate-spin" /> : <Check className="size-3.5" />}
          Approve
        </button>
        <button
          type="button"
          disabled={resolving}
          onClick={onDeny}
          className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/[0.04] px-3 py-1.5 text-[12px] font-semibold text-white/70 transition-colors hover:border-white/30 hover:text-white disabled:opacity-60"
        >
          <Ban className="size-3.5" />
          Deny
        </button>
      </div>
    </div>
  );
}

function RecordAppliedButton({ jobId, coverLetter }: { jobId?: string; coverLetter?: string }) {
  const [createApplication, { isLoading }] = useCreateJobApplicationMutation();
  const [recorded, setRecorded] = useState(false);

  if (!jobId) return null;

  if (recorded) {
    return (
      <a
        href="/jobs/my-jobs/applied"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-400/25 bg-emerald-400/[0.08] px-3 py-1.5 text-[12px] font-semibold text-emerald-200 transition-colors hover:bg-emerald-400/[0.14]"
      >
        <Check className="size-3.5" />
        Application recorded — track it in My Jobs
      </a>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        disabled={isLoading}
        onClick={async () => {
          try {
            await createApplication({
              id: jobId,
              applicationData: coverLetter ? { cover_letter: coverLetter } : undefined,
            }).unwrap();
            setRecorded(true);
            toast.success("Application recorded in your tracker.");
          } catch (error) {
            toastUnknownError(error, "Couldn't record that application.");
          }
        }}
        className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-400/25 bg-emerald-400/[0.08] px-3 py-1.5 text-[12px] font-semibold text-emerald-200 transition-colors hover:bg-emerald-400/[0.14] disabled:opacity-60"
      >
        {isLoading ? <Loader2 className="size-3.5 animate-spin" /> : <Check className="size-3.5" />}
        I&apos;ve applied — record it
      </button>
      <span className="text-[10px] text-white/35">Adds it to your application tracker.</span>
    </div>
  );
}

function ToolBody({
  part,
  name,
  input,
  output,
  labels,
  onOpenArtifact,
}: {
  part: AgentToolPart;
  name: string;
  input: Record<string, any> | null;
  output: Record<string, any> | null;
  labels: Map<string, { title: string; company: string | null }>;
  onOpenArtifact?: (artifact: AgentArtifact) => void;
}) {
  if (!output) return null;

  const jobId = typeof input?.job_id === "string" ? input.job_id : undefined;
  const jobLabel = jobId ? labels.get(jobId) : undefined;
  const artifact = artifactFromToolPart(
    part,
    jobLabel ? { jobTitle: jobLabel.title, company: jobLabel.company } : undefined,
  );

  if (name === "get_job_details" && typeof output.job_id === "string") {
    const skills = asArray(output.skills).filter((skill) => typeof skill === "string");
    return (
      <div className="mt-2 space-y-2">
        <JobRow job={output as AgentJobSummary} />
        {skills.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {skills.slice(0, 8).map((skill) => (
              <span
                key={skill}
                className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[10px] text-white/55"
              >
                {skill}
              </span>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (name === "get_job_readiness" || name === "run_job_match" || name === "analyze_external_job") {
    if (!output.available) {
      return (
        <div className="mt-2 space-y-2">
          <p className="text-xs text-white/50">{output.note}</p>
          {typeof output.job_url_path === "string" && (
            <a
              href={output.job_url_path}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-sky-300 hover:text-sky-200"
            >
              Open job page <ArrowUpRight className="size-3" />
            </a>
          )}
        </div>
      );
    }
    return (
      <div className="mt-2 space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          {output.headline && <p className="text-xs text-white/60">{output.headline}</p>}
        </div>
        <ChipList label="Strong" items={asArray(output.strong)} tone="border-emerald-400/25 bg-emerald-400/10 text-emerald-300" />
        <ChipList label="Partial" items={asArray(output.partial)} tone="border-amber-400/25 bg-amber-400/10 text-amber-300" />
        <ChipList label="Missing" items={asArray(output.missing)} tone="border-rose-400/25 bg-rose-400/10 text-rose-300" />
        <CourseList courses={asArray(output.courses) as AgentCourse[]} jobId={jobId} />
        <div className="flex flex-wrap items-center gap-3">
          {artifact && onOpenArtifact && (
            <ArtifactButton onClick={() => onOpenArtifact(artifact)} label="Open fit report" />
          )}
          {typeof output.match_url_path === "string" && (
            <a
              href={output.match_url_path}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-sky-300 hover:text-sky-200"
            >
              Open full analysis <ArrowUpRight className="size-3" />
            </a>
          )}
        </div>
      </div>
    );
  }

  if (name === "get_skill_courses") {
    const courses = asArray(output.courses) as AgentCourse[];
    const unmatched = asArray(output.unmatched_skills).filter((skill) => typeof skill === "string");
    if (!courses.length) {
      return (
        <p className="mt-2 text-xs text-white/45">
          {unmatched.length
            ? `No curated course yet for ${unmatched.slice(0, 4).join(", ")}. Ask me to search the web for current options.`
            : output.note}
        </p>
      );
    }
    return (
      <div className="mt-2 space-y-2">
        <CourseList courses={courses} jobId={jobId} />
        {unmatched.length > 0 && (
          <p className="text-[10px] text-white/35">
            No curated course yet for {unmatched.slice(0, 4).join(", ")}.
          </p>
        )}
      </div>
    );
  }

  if (name === "web_search") {
    const results = asArray(output.results);
    if (!results.length) {
      return <p className="mt-2 text-xs text-white/45">{output.note ?? "No external results found."}</p>;
    }
    return (
      <div className="mt-2 space-y-2">
        <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-sky-300/70">
          <Globe2 className="size-3" />
          External sources
          <span className="font-normal normal-case tracking-normal text-white/30">via {output.provider ?? "web"}</span>
        </div>
        <div className="space-y-1.5">
          {results.slice(0, 5).map((result: any) => (
            <a
              key={result.url}
              href={result.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block rounded-lg border border-white/[0.07] bg-white/[0.03] px-3 py-2 transition-colors hover:border-sky-400/25 hover:bg-white/[0.05]"
            >
              <p className="line-clamp-1 text-[12px] font-semibold text-white/85">{result.title}</p>
              <p className="mt-0.5 text-[10px] text-sky-300/60">{result.domain || result.url}</p>
              {result.snippet ? (
                <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-white/45">{result.snippet}</p>
              ) : null}
            </a>
          ))}
        </div>
        <p className="text-[10px] leading-relaxed text-white/30">
          External links. Qelsa doesn't control these pages — verify details before acting.
        </p>
      </div>
    );
  }

  if (name === "remember_about_me" && output.memory) {
    return (
      <div className="mt-2 flex items-start gap-2 rounded-lg border border-emerald-400/15 bg-emerald-400/[0.04] px-3 py-2">
        <Brain className="mt-0.5 size-3.5 shrink-0 text-emerald-300/80" />
        <div className="min-w-0">
          <p className="text-[11px] font-semibold text-emerald-200/80">Remembered for next time</p>
          <p className="mt-0.5 text-[11px] leading-relaxed text-white/55">{output.memory.text}</p>
        </div>
      </div>
    );
  }

  if (name === "list_my_memory") {
    const memories = asArray(output.memories);
    if (!memories.length) return <p className="mt-2 text-xs text-white/45">Nothing saved in Agent memory yet.</p>;
    return (
      <div className="mt-2 space-y-1.5">
        {memories.slice(0, 8).map((memory: any) => (
          <div key={memory.memory_id} className="flex items-start gap-2 rounded-lg border border-white/[0.07] bg-white/[0.03] px-3 py-2">
            <Brain className="mt-0.5 size-3.5 shrink-0 text-neon-purple/70" />
            <p className="min-w-0 flex-1 text-[11px] leading-relaxed text-white/60">{memory.text}</p>
          </div>
        ))}
        {memories.length > 8 && (
          <p className="text-[10px] text-white/30">and {memories.length - 8} more in Agent memory settings.</p>
        )}
      </div>
    );
  }

  if (name === "forget_about_me") {
    const removed = asArray(output.texts);
    return (
      <div className="mt-2 flex items-start gap-2 text-xs text-white/55">
        <Trash2 className="mt-0.5 size-3.5 shrink-0 text-white/35" />
        <span>
          {removed.length ? `Forgot: ${removed.join(" · ")}` : output.note ?? "No matching memory found."}
        </span>
      </div>
    );
  }

  if (name === "list_my_applications") {
    const applications = asArray(output.applications);
    if (!applications.length) {
      return <p className="mt-2 text-xs text-white/45">No applications yet.</p>;
    }
    return (
      <div className="mt-2 space-y-2.5">
        <div className="space-y-1.5">
          {applications.map((row: any) => (
            <div
              key={row.application_id}
              className="flex items-center gap-3 rounded-lg border border-white/[0.07] bg-white/[0.03] px-3 py-2"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-semibold text-white/90">{row.job?.title ?? "Job"}</p>
                <p className="truncate text-[11px] text-white/45">
                  {[row.job?.company, relativeTime(row.applied_at)].filter(Boolean).join(" · ")}
                </p>
              </div>
              <StatusChip status={String(row.status ?? "applied")} />
            </div>
          ))}
        </div>
        {artifact && onOpenArtifact && (
          <ArtifactButton onClick={() => onOpenArtifact(artifact)} label="Open application tracker" />
        )}
      </div>
    );
  }

  if (name === "write_cover_letter" && typeof output.cover_letter === "string") {
    const preview = output.cover_letter.replace(/\s+/g, " ").trim().slice(0, 200);
    const truncated = output.cover_letter.replace(/\s+/g, " ").trim().length > 200;
    const letterTitle = typeof output.job_title === "string" ? output.job_title : "this role";
    return (
      <div className="mt-2 rounded-lg border border-white/[0.08] bg-black/20 p-3">
        <div className="flex items-center gap-2">
          <FileText className="size-3.5 shrink-0 text-sky-300" />
          <p className="min-w-0 flex-1 truncate text-[11px] font-semibold text-white/70">
            Draft for {letterTitle} is ready
          </p>
        </div>
        <p className="mt-1.5 line-clamp-2 text-[11px] leading-relaxed text-white/45">
          {preview}
          {truncated ? "…" : ""}
        </p>
        <div className="mt-2.5 flex flex-wrap gap-2">
          {artifact && onOpenArtifact && (
            <ArtifactButton onClick={() => onOpenArtifact(artifact)} label="Open cover letter" />
          )}
          <CopyButton text={output.cover_letter} label="Copy letter" />
        </div>
      </div>
    );
  }

  if (name === "prepare_external_application") {
    const checklist = asArray(output.checklist).filter((item) => typeof item === "string");
    const jobId = typeof input?.job_id === "string" ? input.job_id : undefined;
    return (
      <div className="mt-2 space-y-2.5">
        <div className="flex flex-wrap gap-2">
          {typeof output.application_url === "string" && (
            <a
              href={output.application_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-[#623dd6] via-[#8433ae] to-[#be2680] px-3 py-1.5 text-[12px] font-semibold text-white shadow-lg shadow-purple-900/25 transition-opacity hover:opacity-95"
            >
              Open application page <ExternalLink className="size-3.5" />
            </a>
          )}
          {typeof output.autofill?.bookmarklet === "string" && (
            <button
              type="button"
              onClick={async () => {
                const tab =
                  typeof output.application_url === "string"
                    ? window.open(output.application_url, "_blank", "noopener,noreferrer")
                    : null;
                try {
                  await navigator.clipboard.writeText(output.autofill.bookmarklet);
                  toast.success(
                    "Autofill bookmarklet copied. Save it to your bookmarks bar once, then click it on the application tab.",
                  );
                } catch {
                  toast.error("Couldn't copy the autofill bookmarklet. Select it from the application kit.");
                }
                void tab;
              }}
              className="inline-flex items-center gap-1.5 rounded-lg border border-sky-400/25 bg-sky-400/[0.08] px-3 py-1.5 text-[12px] font-semibold text-sky-200 transition-colors hover:bg-sky-400/[0.14]"
            >
              <Copy className="size-3.5" />
              Autofill external form
            </button>
          )}
          {typeof output.autofill?.bookmarklet === "string" && (
            <a
              href={output.autofill.bookmarklet}
              draggable
              onClick={(event) => {
                event.preventDefault();
                void navigator.clipboard.writeText(output.autofill.bookmarklet);
                toast.success("Autofill bookmarklet copied.");
              }}
              className="inline-flex cursor-grab items-center gap-1.5 rounded-lg border border-white/15 bg-white/[0.04] px-3 py-1.5 text-[11px] font-semibold text-white/60 transition-colors hover:border-white/30 hover:text-white active:cursor-grabbing"
              title="Drag this link to your bookmarks bar"
            >
              Drag to bookmarks
            </a>
          )}
          {typeof output.resume_link?.url === "string" && (
            <a
              href={output.resume_link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/[0.04] px-3 py-1.5 text-[12px] font-semibold text-white/75 transition-colors hover:border-white/30 hover:text-white"
            >
              Resume <ExternalLink className="size-3" />
            </a>
          )}
          {artifact && onOpenArtifact && (
            <ArtifactButton onClick={() => onOpenArtifact(artifact)} label="Open application kit" />
          )}
          {typeof output.cover_letter === "string" && (
            <CopyButton text={output.cover_letter} label="Copy cover letter" />
          )}
        </div>
        {typeof output.autofill?.bookmarklet === "string" && (
          <p className="text-[10px] leading-relaxed text-white/35">
            For this application, drag “Drag to bookmarks” into your bookmarks bar. On the application tab, click that
            bookmark. Qelsa fills recognized fields and attaches your resume; it never submits. The link expires in
            20 minutes.
          </p>
        )}
        {checklist.length > 0 && (
          <ol className="space-y-1 text-[11px] text-white/50">
            {checklist.map((item: string, index: number) => (
              <li key={item} className="flex gap-2">
                <span className="text-white/30">{index + 1}.</span>
                <span>{item}</span>
              </li>
            ))}
          </ol>
        )}
        {!output.already_applied && (
          <RecordAppliedButton
            jobId={jobId}
            coverLetter={typeof output.cover_letter === "string" ? output.cover_letter : undefined}
          />
        )}
      </div>
    );
  }

  if (name === "tailor_resume" && typeof output.markdown === "string") {
    return (
      <div className="mt-2 space-y-2">
        <p className="text-xs text-white/55">
          A truthful tailoring plan for <span className="font-semibold text-white/80">{output.job_title ?? "this role"}</span> is ready.
        </p>
        <div className="flex flex-wrap gap-2">
          {artifact && onOpenArtifact && (
            <ArtifactButton onClick={() => onOpenArtifact(artifact)} label="Open resume plan" />
          )}
          <CopyButton text={output.markdown} label="Copy plan" />
        </div>
      </div>
    );
  }

  if (name === "prepare_interview" && typeof output.markdown === "string") {
    return (
      <div className="mt-2 space-y-2">
        <p className="text-xs text-white/55">
          Interview brief ready for <span className="font-semibold text-white/80">{output.job_title ?? "this role"}</span>.
        </p>
        <div className="flex flex-wrap gap-2">
          {artifact && onOpenArtifact && (
            <ArtifactButton onClick={() => onOpenArtifact(artifact)} label="Open interview brief" />
          )}
          <CopyButton text={output.markdown} label="Copy brief" />
        </div>
      </div>
    );
  }

  if ((name === "compare_jobs" || name === "compare_offers") && typeof output.markdown === "string") {
    const count = name === "compare_offers" ? asArray(output.offers).length : asArray(output.jobs).length;
    return (
      <div className="mt-2 space-y-2">
        <p className="text-xs text-white/55">
          Compared {count} {name === "compare_offers" ? "offers" : "roles"}.
        </p>
        {artifact && onOpenArtifact && (
          <ArtifactButton onClick={() => onOpenArtifact(artifact)} label="Open comparison" />
        )}
      </div>
    );
  }

  if (name === "draft_follow_up" && typeof output.markdown === "string") {
    return (
      <div className="mt-2 rounded-lg border border-white/[0.08] bg-black/20 p-3">
        <p className="text-[11px] font-semibold text-white/70">{output.subject ?? "Follow-up email"}</p>
        <p className="mt-1 line-clamp-3 whitespace-pre-wrap text-[11px] leading-relaxed text-white/45">
          {String(output.body ?? output.markdown)}
        </p>
        <div className="mt-2.5 flex flex-wrap gap-2">
          {artifact && onOpenArtifact && (
            <ArtifactButton onClick={() => onOpenArtifact(artifact)} label="Open email" />
          )}
          <CopyButton text={String(output.markdown)} label="Copy email" />
        </div>
      </div>
    );
  }

  if (name === "get_application_questions") {
    const questions = asArray(output.questions);
    if (!questions.length) {
      return <p className="mt-2 text-xs text-white/45">{output.note ?? "No screening questions."}</p>;
    }
    const required = questions.filter((question: any) => question.required).length;
    return (
      <div className="mt-2 space-y-2">
        <p className="text-xs text-white/55">
          {questions.length} question{questions.length === 1 ? "" : "s"}
          {required ? ` · ${required} required` : ""}
        </p>
        <ul className="space-y-1">
          {questions.slice(0, 5).map((question: any) => (
            <li key={question.question_id} className="text-[11px] text-white/55">
              {question.title}
              {question.required && <span className="ml-1 text-amber-300/80">required</span>}
            </li>
          ))}
        </ul>
        {artifact && onOpenArtifact && (
          <ArtifactButton onClick={() => onOpenArtifact(artifact)} label="Open all questions" />
        )}
      </div>
    );
  }

  if (name === "draft_application_answers") {
    const answers = asArray(output.answers);
    return (
      <div className="mt-2 space-y-2">
        <p className="text-xs text-white/55">
          Drafted {answers.length} answer{answers.length === 1 ? "" : "s"}. Review before applying.
        </p>
        {artifact && onOpenArtifact && (
          <ArtifactButton onClick={() => onOpenArtifact(artifact)} label="Open answers" />
        )}
      </div>
    );
  }

  if (name === "get_application_details" && output.job) {
    return (
      <div className="mt-2 space-y-2.5">
        <div className="flex items-center gap-2">
          <JobRow job={output.job as AgentJobSummary} />
          <StatusChip status={String(output.status ?? "applied")} />
        </div>
        {asArray(output.answers).length > 0 && (
          <p className="text-[11px] text-white/45">
            {asArray(output.answers).length} screening answer{asArray(output.answers).length === 1 ? "" : "s"} on file
          </p>
        )}
        {asArray(output.notes).slice(0, 2).map((note: any) => (
          <p key={note.note_id} className="rounded-lg border border-white/[0.07] bg-white/[0.03] px-2.5 py-1.5 text-[11px] text-white/55">
            {note.text}
          </p>
        ))}
      </div>
    );
  }

  if (name === "get_stale_applications") {
    const applications = asArray(output.applications);
    if (!applications.length) {
      return <p className="mt-2 text-xs text-white/45">No stale applications — nothing needs a nudge.</p>;
    }
    return (
      <div className="mt-2 space-y-1.5">
        {applications.map((row: any) => (
          <div key={row.application_id} className="flex items-center gap-3 rounded-lg border border-white/[0.07] bg-white/[0.03] px-3 py-2">
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-semibold text-white/90">{row.job?.title ?? "Job"}</p>
              <p className="truncate text-[11px] text-white/45">
                {[row.job?.company, `${row.days_since_application}d since applying`].filter(Boolean).join(" · ")}
              </p>
            </div>
            <StatusChip status={String(row.status ?? "applied")} />
          </div>
        ))}
      </div>
    );
  }

  if (name === "withdraw_application") {
    return (
      <p className="mt-2 flex items-center gap-2 text-xs text-white/60">
        <Check className="size-3.5 text-emerald-300" />
        Application withdrawn.
      </p>
    );
  }

  if (name === "add_application_note") {
    return (
      <p className="mt-2 flex items-center gap-2 text-xs text-white/60">
        <Check className="size-3.5 text-emerald-300" />
        Private note saved.
      </p>
    );
  }

  if (name === "update_profile") {
    const fields = asArray(output.fields);
    return (
      <p className="mt-2 text-xs text-white/55">
        {output.updated
          ? `Updated ${fields.length ? fields.join(", ") : "your profile"}.`
          : "Nothing changed."}
      </p>
    );
  }

  if (name === "add_profile_skills") {
    const added = asArray(output.added);
    const present = asArray(output.already_present);
    const unmatched = asArray(output.unmatched);
    return (
      <div className="mt-2 space-y-1 text-xs text-white/55">
        <p>{added.length ? `Added: ${added.join(", ")}` : "No new skills added."}</p>
        {present.length > 0 && <p className="text-white/40">Already on your profile: {present.join(", ")}</p>}
        {unmatched.length > 0 && <p className="text-amber-300/80">Not in the catalog: {unmatched.join(", ")}</p>}
      </div>
    );
  }

  if (name === "save_job_search") {
    return (
      <p className="mt-2 flex items-center gap-2 text-xs text-white/60">
        <Check className="size-3.5 text-emerald-300" />
        Watching “{output.name}” · {output.current_matches ?? 0} current matches
      </p>
    );
  }

  if (name === "list_saved_searches") {
    const searches = asArray(output.searches);
    if (!searches.length) return <p className="mt-2 text-xs text-white/45">No saved searches yet.</p>;
    return (
      <div className="mt-2 space-y-1.5">
        {searches.map((search: any) => (
          <div key={search.saved_search_id} className="rounded-lg border border-white/[0.07] bg-white/[0.03] px-3 py-2">
            <p className="text-[12px] font-semibold text-white/85">{search.name}</p>
            <p className="text-[10px] text-white/40">
              {[
                search.query,
                search.city,
                search.remote ? "remote" : search.workplace_type,
                search.salary_min ? `$${search.salary_min}+` : null,
              ]
                .filter(Boolean)
                .join(" · ") || "All open roles"}
            </p>
          </div>
        ))}
      </div>
    );
  }

  if (name === "update_job_search_alerts") {
    if (!output.updated) return <p className="mt-2 text-xs text-white/45">No alert changes.</p>;
    return (
      <p className="mt-2 text-xs text-white/55">
        {output.name}: email {output.email_alerts ? "on" : "off"} · browser push {output.push_alerts ? "on" : "off"}
      </p>
    );
  }

  if (name === "delete_job_search") {
    return <p className="mt-2 text-xs text-white/55">Deleted saved search “{output.name}”.</p>;
  }

  if (name === "get_unread_briefs") {
    const briefs = asArray(output.briefs);
    if (!briefs.length) return <p className="mt-2 text-xs text-white/45">No unread briefs.</p>;
    return (
      <div className="mt-2 space-y-1.5">
        {briefs.map((brief: any) => (
          <div key={brief._id} className="rounded-lg border border-white/[0.07] bg-white/[0.03] px-3 py-2">
            <p className="text-[12px] font-semibold text-white/85">{brief.title}</p>
            <p className="mt-0.5 line-clamp-2 text-[11px] text-white/45">{brief.summary}</p>
          </div>
        ))}
      </div>
    );
  }

  if (name === "list_my_jobs") {
    const jobs = asArray(output.jobs);
    if (!jobs.length) return <p className="mt-2 text-xs text-white/45">No jobs found for this recruiter.</p>;
    return (
      <div className="mt-2 space-y-1.5">
        {jobs.slice(0, 6).map((job: any) => (
          <div key={job.job_id} className="flex items-center gap-3 rounded-lg border border-white/[0.07] bg-white/[0.03] px-3 py-2">
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-semibold text-white/90">{job.title}</p>
              <p className="truncate text-[11px] text-white/45">
                {[job.company, job.location, `${job.applications ?? 0} applicant${job.applications === 1 ? "" : "s"}`].filter(Boolean).join(" · ")}
              </p>
            </div>
            <StatusChip status={String(job.status ?? "open")} />
          </div>
        ))}
      </div>
    );
  }

  if (name === "search_applicants") {
    const applicants = asArray(output.applicants);
    if (!applicants.length) {
      return <p className="mt-2 text-xs text-white/45">{output.note ?? "No applicants matched."}</p>;
    }
    return (
      <div className="mt-2 space-y-1.5">
        {applicants.slice(0, 6).map((applicant: any) => (
          <div key={applicant.application_id} className="rounded-lg border border-white/[0.07] bg-white/[0.03] px-3 py-2">
            <div className="flex items-center gap-2">
              <p className="min-w-0 flex-1 truncate text-[13px] font-semibold text-white/90">{applicant.name}</p>
              {applicant.readiness != null && (
                <span className="shrink-0 text-[11px] font-semibold tabular-nums text-emerald-300">{applicant.readiness}%</span>
              )}
              <StatusChip status={String(applicant.status ?? "applied")} />
            </div>
            <p className="mt-0.5 truncate text-[11px] text-white/45">
              {[applicant.headline, applicant.location, applicant.years_experience != null ? `${applicant.years_experience}y` : null]
                .filter(Boolean)
                .join(" · ")}
            </p>
            {asArray(applicant.matched_skills).length > 0 && (
              <p className="mt-1 truncate text-[10px] text-emerald-300/70">
                Matches: {asArray(applicant.matched_skills).slice(0, 4).join(", ")}
              </p>
            )}
          </div>
        ))}
      </div>
    );
  }

  if (name === "get_applicant_context" && output.applicant) {
    const applicant = output.applicant;
    return (
      <div className="mt-2 space-y-2">
        <div>
          <p className="text-[13px] font-semibold text-white/90">{applicant.name}</p>
          <p className="text-[11px] text-white/45">
            {[applicant.headline, applicant.location].filter(Boolean).join(" · ")}
          </p>
        </div>
        {applicant.summary && <p className="text-[11px] leading-relaxed text-white/55">{applicant.summary}</p>}
        <ChipList
          label="Skills"
          items={asArray(applicant.skills).map((skill: any) => skill.name)}
          tone="border-sky-400/20 bg-sky-400/[0.06] text-sky-200"
        />
      </div>
    );
  }

  if (name === "update_applicant_status") {
    return (
      <p className="mt-2 flex items-center gap-2 text-xs text-white/60">
        <Check className="size-3.5 text-emerald-300" />
        {output.updated
          ? `Moved from ${String(output.previous_status ?? "previous stage").replaceAll("_", " ")} to ${String(output.status).replaceAll("_", " ")}.`
          : `Already in ${String(output.status ?? "that stage").replaceAll("_", " ")}.`}
      </p>
    );
  }

  if (name === "draft_candidate_outreach" && typeof output.markdown === "string") {
    return (
      <div className="mt-2 rounded-lg border border-white/[0.08] bg-black/20 p-3">
        {output.subject && <p className="text-[11px] font-semibold text-white/70">{output.subject}</p>}
        <p className="mt-1 line-clamp-3 whitespace-pre-wrap text-[11px] leading-relaxed text-white/45">{output.body}</p>
        <div className="mt-2.5 flex flex-wrap gap-2">
          {artifact && onOpenArtifact && (
            <ArtifactButton onClick={() => onOpenArtifact(artifact)} label="Open outreach" />
          )}
          <CopyButton text={output.markdown} label="Copy message" />
        </div>
      </div>
    );
  }

  if (name === "get_my_profile") {
    const skills = asArray(output.skills).length;
    const experiences = asArray(output.experiences).length;
    const resumes = asArray(output.resumes).length;
    const headline = output.profile?.headline ?? output.profile?.name;
    return (
      <p className="mt-2 text-xs text-white/50">
        {[headline, `${skills} skills`, `${experiences} experiences`, `${resumes} resumes`].filter(Boolean).join(" · ")}
      </p>
    );
  }

  if (name === "save_job" && output.job) {
    return (
      <p className="mt-2 text-xs text-white/60">
        {output.saved ? "Saved" : "Removed"}{" "}
        <span className="font-semibold text-white/85">{output.job.title}</span>
        {output.job.company ? ` · ${output.job.company}` : ""}
      </p>
    );
  }

  if (name === "apply_to_job" && output.job) {
    return (
      <div className="mt-2 flex items-center gap-2 text-xs text-white/60">
        <Check className="size-3.5 text-emerald-300" />
        <span>
          Applied to <span className="font-semibold text-white/85">{output.job.title}</span>
          {output.job.company ? ` · ${output.job.company}` : ""}
        </span>
      </div>
    );
  }

  if (name === "record_external_application" && output.job) {
    return (
      <div className="mt-2 flex items-center gap-2 text-xs text-white/60">
        <Check className="size-3.5 text-emerald-300" />
        <span>
          Recorded application to <span className="font-semibold text-white/85">{output.job.title}</span>
        </span>
      </div>
    );
  }

  if (name === "update_career_goal" && typeof output.target_role === "string") {
    return (
      <p className="mt-2 text-xs text-white/60">
        Goal set to <span className="font-semibold text-white/85">{output.target_role}</span>
      </p>
    );
  }

  // Unknown tool shape: keep the raw result available without dumping a wall of
  // JSON into the conversation.
  return (
    <details className="mt-2 rounded-lg border border-white/[0.08] bg-black/25">
      <summary className="cursor-pointer px-3 py-2 text-[11px] font-semibold text-white/45">Details</summary>
      <pre className="max-h-56 overflow-auto whitespace-pre-wrap border-t border-white/[0.06] px-3 py-2 text-[10px] leading-relaxed text-white/50">
        {JSON.stringify(output, null, 2).slice(0, 2_000)}
      </pre>
    </details>
  );
}

export function AgentToolCard({
  part,
  resolving,
  interrupted = false,
  onApprove,
  onDeny,
  onOpenArtifact,
}: {
  part: AgentToolPart;
  resolving: boolean;
  interrupted?: boolean;
  onApprove: (approvalId: string) => void;
  onDeny: (approvalId: string) => void;
  onOpenArtifact?: (artifact: AgentArtifact) => void;
}) {
  const name = toolNameOf(part);
  const meta = toolMetaFor(name);
  const Icon = meta.icon;
  const input = asRecord(part.input);
  const output = asRecord(part.output);

  const jobIds = useMemo(() => jobIdsIn(part), [part]);
  const labels = useQuery(api.qelsaAgent.jobLabels, jobIds.length ? { jobIds } : "skip");
  const labelMap = useMemo(() => {
    const map = new Map<string, { title: string; company: string | null }>();
    for (const label of labels ?? []) map.set(label.jobId, { title: label.title, company: label.company });
    return map;
  }, [labels]);
  const singleJob = jobIds.length === 1 ? labelMap.get(jobIds[0]) : undefined;

  const state = part.state;
  const failed = state === "output-error";
  const denied = state === "output-denied" || (state === "approval-responded" && part.approval?.approved === false);
  const awaitingApproval = state === "approval-requested";
  const wasRunning =
    state === "input-streaming" ||
    state === "input-available" ||
    (state === "approval-responded" && part.approval?.approved !== false);
  const stopped = interrupted && wasRunning && !awaitingApproval;
  const running = wasRunning && !stopped;

  // Approval is a question for the person, not a trace step, so it stays a
  // standalone card. Other tools become flat trace rows with their rich result
  // tucked behind a disclosure. Job lists are rendered below the final reply
  // instead, where they are the answer rather than process detail.
  if (awaitingApproval) {
    return (
      <div className="rounded-xl border border-amber-400/25 bg-amber-400/[0.06] px-3 py-2.5">
        <div className="flex items-center gap-2">
          <div className="flex size-6 shrink-0 items-center justify-center rounded-md border border-amber-400/25 bg-amber-400/10 text-amber-300">
            <Icon className="size-3.5" />
          </div>
          <p className="min-w-0 flex-1 truncate text-[12px] font-semibold text-amber-200">
            Needs your approval
          </p>
          <ShieldQuestion className="size-3.5 text-amber-300" />
        </div>
        {part.approval?.id && (
          <ApprovalBody
            name={name}
            input={input}
            labels={labelMap}
            resolving={resolving}
            onApprove={() => onApprove(part.approval!.id)}
            onDeny={() => onDeny(part.approval!.id)}
          />
        )}
      </div>
    );
  }

  const status = failed ? "error" : stopped ? "pending" : running ? "running" : undefined;
  const label = failed
    ? meta.failed
    : denied
      ? "Action denied"
      : stopped
        ? "Action interrupted"
        : running
          ? meta.running
          : meta.done;
  const emptyCourseSearch =
    name === "get_skill_courses" &&
    !failed &&
    !denied &&
    !running &&
    Boolean(output) &&
    asArray(output?.courses).length === 0;
  const traceLabel = emptyCourseSearch ? "No curated courses found" : label;
  const traceTitle =
    singleJob && (name === "get_job_readiness" || name === "run_job_match" || name === "analyze_external_job") ? (
      <>
        {traceLabel}
        <span className="font-normal text-white/35"> · {singleJob.title}</span>
      </>
    ) : (
      traceLabel
    );
  const resultsInFinalAnswer = name === "search_jobs" || name === "list_saved_jobs";
  const resultCount =
    resultsInFinalAnswer && !failed && !denied && output && Array.isArray(output.jobs)
      ? output.jobs.length
      : null;
  const traceDescription =
    emptyCourseSearch
      ? "No catalog match"
      : (name === "get_job_readiness" || name === "run_job_match" || name === "analyze_external_job") && output?.available === false
        ? "No analysis yet"
        : resultCount != null
          ? resultCount === 0
            ? "No jobs"
            : `${resultCount} ${resultCount === 1 ? "job" : "jobs"}`
          : undefined;
  const showBody = Boolean(output) && !failed && !denied && !resultsInFinalAnswer;
  const bodyDefaultOpen =
    name === "get_job_readiness" || name === "run_job_match" || name === "analyze_external_job"
      ? output?.available === true
      : true;
  const stateIcon = failed ? (
    <AlertCircle className="size-3.5 text-rose-300" />
  ) : denied ? (
    <Ban className="size-3.5 text-white/30" />
  ) : stopped ? (
    <AlertCircle className="size-3.5 text-white/30" />
  ) : null;

  return (
    <div className="min-w-0">
      {showBody ? (
        <Collapsible defaultOpen={bodyDefaultOpen} className="group/tool w-full">
          <CollapsibleTrigger
            type="button"
            className="flex w-full rounded-lg text-left transition-colors hover:bg-white/[0.03]"
          >
            <AgentTraceLine
              icon={Icon}
              title={traceTitle}
              status={status}
              description={traceDescription}
              trailing={
                <ChevronDown className="size-3.5 transition-transform group-data-[state=open]/tool:rotate-180" />
              }
            />
          </CollapsibleTrigger>
          <CollapsibleContent className="agent-collapsible-content">
            <div className="ml-8 mt-1 rounded-xl border border-white/[0.07] bg-white/[0.02] px-3 py-2.5 [&>*:first-child]:mt-0">
              <ToolBody
                part={part}
                name={name}
                input={input}
                output={output}
                labels={labelMap}
                onOpenArtifact={onOpenArtifact}
              />
            </div>
          </CollapsibleContent>
        </Collapsible>
      ) : (
        <div>
          <AgentTraceLine
            icon={Icon}
            title={traceTitle}
            status={status}
            description={traceDescription}
            trailing={stateIcon}
          />
          {failed && part.errorText && (
            <p className="ml-8 mt-1 rounded-lg border border-rose-400/20 bg-rose-400/[0.06] px-2.5 py-1.5 text-[11px] text-rose-200">
              {part.errorText}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
