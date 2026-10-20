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
import { useQuery } from "convex/react";
import {
  AlertCircle,
  ArrowUpRight,
  Ban,
  BriefcaseBusiness,
  Check,
  ChevronDown,
  Copy,
  ExternalLink,
  FileText,
  Loader2,
  PanelRight,
  ShieldQuestion,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { artifactFromToolPart, type AgentArtifact } from "./agentArtifacts";
import {
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
  }

  return (
    <div className="mt-2 space-y-2.5">
      <p className="text-[13px] font-medium text-amber-100/90">{copy}</p>
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

  if (name === "search_jobs" || name === "list_saved_jobs") {
    const jobs = asArray(output.jobs) as AgentJobSummary[];
    if (!jobs.length) {
      return <p className="mt-2 text-xs text-white/45">{output.note ?? "No jobs found."}</p>;
    }
    return (
      <div className="mt-2 space-y-1.5">
        {jobs.map((job) => (
          <JobRow key={job.job_id} job={job} />
        ))}
      </div>
    );
  }

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

  if (name === "get_job_readiness") {
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
    const score = typeof output.overall === "number" ? Math.round(output.overall) : null;
    const tone =
      score == null ? "text-white/70" : score >= 75 ? "text-emerald-300" : score >= 50 ? "text-amber-300" : "text-rose-300";
    return (
      <div className="mt-2 space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          {score != null && (
            <span className={cn("text-lg font-bold tabular-nums", tone)}>
              {score}%<span className="ml-1 text-[10px] font-medium uppercase tracking-wide text-white/35">match</span>
            </span>
          )}
          {output.headline && <p className="text-xs text-white/60">{output.headline}</p>}
        </div>
        <ChipList label="Strong" items={asArray(output.strong)} tone="border-emerald-400/25 bg-emerald-400/10 text-emerald-300" />
        <ChipList label="Partial" items={asArray(output.partial)} tone="border-amber-400/25 bg-amber-400/10 text-amber-300" />
        <ChipList label="Missing" items={asArray(output.missing)} tone="border-rose-400/25 bg-rose-400/10 text-rose-300" />
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
  // standalone card. Every other state becomes a flat trace row with the rich
  // result tucked behind its own disclosure.
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
  const traceTitle =
    singleJob && name === "get_job_readiness" ? (
      <>
        {label}
        <span className="font-normal text-white/35"> · {singleJob.title}</span>
      </>
    ) : (
      label
    );
  const traceDescription =
    name === "get_job_readiness" && output?.available === false ? "No analysis yet" : undefined;
  const showBody = Boolean(output) && !failed && !denied;
  const bodyDefaultOpen = name === "get_job_readiness" ? output?.available === true : true;
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
