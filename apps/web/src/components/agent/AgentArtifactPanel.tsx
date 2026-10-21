"use client";

/**
 * Focused reading surface for agent artifacts.
 *
 * Desktop: a side panel next to the chat (wide screens only). Tablet/mobile:
 * a full-screen sheet so the document keeps a comfortable reading width.
 */

import { AiMarkdown } from "@/components/ai/AiMarkdown";
import { cn } from "@/components/ui/utils";
import {
  ArrowUpRight,
  Check,
  ClipboardList,
  Copy,
  Download,
  ExternalLink,
  FileText,
  PenLine,
  Target,
  X,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { AgentArtifact, AgentArtifactKind } from "./agentArtifacts";

const KIND_META: Record<AgentArtifactKind, { label: string; icon: LucideIcon }> = {
  cover_letter: { label: "Cover letter", icon: PenLine },
  application_kit: { label: "Application kit", icon: ClipboardList },
  fit_report: { label: "Fit report", icon: Target },
  tracker: { label: "Application tracker", icon: ClipboardList },
  resume_tailoring: { label: "Resume plan", icon: FileText },
  application_questions: { label: "Application questions", icon: ClipboardList },
  application_answers: { label: "Application answers", icon: PenLine },
  interview_prep: { label: "Interview brief", icon: FileText },
  comparison: { label: "Job comparison", icon: ClipboardList },
  follow_up: { label: "Follow-up email", icon: FileText },
  document: { label: "Answer", icon: FileText },
};

function slugify(value: string) {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "qelsa-artifact"
  );
}

function ApplicationKitBody({ artifact }: { artifact: AgentArtifact }) {
  const [tab, setTab] = useState<"checklist" | "letter">("checklist");
  const hasLetter = Boolean(artifact.coverLetter);
  const checklist = artifact.checklist ?? [];

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {hasLetter && (
        <div className="flex shrink-0 gap-1 border-b border-white/[0.08] px-4 py-2">
          {(
            [
              ["checklist", "Checklist"],
              ["letter", "Cover letter"],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setTab(value)}
              className={cn(
                "rounded-lg px-2.5 py-1.5 text-[12px] font-semibold transition-colors",
                tab === value ? "bg-white/[0.08] text-white" : "text-white/45 hover:bg-white/[0.04] hover:text-white/75",
              )}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
        {tab === "letter" && artifact.coverLetter ? (
          <div className="whitespace-pre-wrap text-[13px] leading-7 text-white/80">{artifact.coverLetter}</div>
        ) : (
          <div className="space-y-5">
            <div className="flex flex-wrap gap-2">
              {artifact.applicationUrl && (
                <a
                  href={artifact.applicationUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-[#623dd6] via-[#8433ae] to-[#be2680] px-3 py-1.5 text-[12px] font-semibold text-white shadow-lg shadow-purple-900/25 transition-opacity hover:opacity-95"
                >
                  Open application page <ExternalLink className="size-3.5" />
                </a>
              )}
              {artifact.resumeUrl && (
                <a
                  href={artifact.resumeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/[0.04] px-3 py-1.5 text-[12px] font-semibold text-white/75 transition-colors hover:border-white/30 hover:text-white"
                >
                  Resume <ExternalLink className="size-3" />
                </a>
              )}
            </div>

            {artifact.alreadyApplied && (
              <p className="rounded-lg border border-emerald-400/20 bg-emerald-400/[0.06] px-3 py-2 text-[12px] text-emerald-200">
                This application is already recorded in your tracker.
              </p>
            )}

            <div>
              <h3 className="text-[11px] font-semibold uppercase tracking-wider text-white/35">Application checklist</h3>
              {checklist.length ? (
                <ol className="mt-2.5 space-y-2">
                  {checklist.map((item, index) => (
                    <li key={`${index}-${item}`} className="flex gap-2.5 text-[13px] leading-relaxed text-white/65">
                      <span className="flex size-5 shrink-0 items-center justify-center rounded-full border border-white/[0.1] bg-white/[0.04] text-[10px] font-semibold text-white/45">
                        {index + 1}
                      </span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="mt-2 text-[12px] text-white/40">No checklist was returned for this application.</p>
              )}
            </div>

            {!hasLetter && (
              <p className="rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-[12px] text-white/45">
                No cover letter was drafted for this application. Ask Qelsa to write one before you apply.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function ArtifactBody({ artifact }: { artifact: AgentArtifact }) {
  if (artifact.kind === "cover_letter") {
    return (
      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
        <div className="whitespace-pre-wrap text-[13px] leading-7 text-white/80">{artifact.coverLetter ?? artifact.markdown}</div>
      </div>
    );
  }

  if (artifact.kind === "application_kit") {
    return <ApplicationKitBody artifact={artifact} />;
  }

  return (
    <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
      <AiMarkdown
        markdown={artifact.markdown}
        newTabLinks
        className="max-w-none text-[13px] leading-relaxed text-white/80"
      />
    </div>
  );
}

export function AgentArtifactPanel({
  artifact,
  onClose,
}: {
  artifact: AgentArtifact;
  onClose: () => void;
}) {
  const meta = KIND_META[artifact.kind];
  const Icon = meta.icon;
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 1_600);
    return () => window.clearTimeout(timer);
  }, [copied]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(artifact.markdown);
      setCopied(true);
      toast.success("Copied to clipboard");
    } catch {
      toast.error("Couldn't copy — select the text instead.");
    }
  };

  const download = () => {
    const extension = artifact.kind === "cover_letter" ? "txt" : "md";
    const type = extension === "txt" ? "text/plain;charset=utf-8" : "text/markdown;charset=utf-8";
    const blob = new Blob([artifact.markdown], { type });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${slugify(artifact.title)}.${extension}`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
  };

  const content = (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="flex shrink-0 items-start gap-3 border-b border-white/[0.08] px-4 py-4">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-white/[0.1] bg-gradient-to-br from-neon-cyan/20 via-neon-purple/20 to-neon-pink/20 text-neon-cyan">
          <Icon className="size-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-white/35">{meta.label}</p>
          <h2 className="truncate text-sm font-semibold text-white">{artifact.title}</h2>
          {artifact.subtitle && <p className="truncate text-[11px] text-white/45">{artifact.subtitle}</p>}
        </div>
        <button
          type="button"
          aria-label="Close artifact"
          onClick={onClose}
          className="flex size-8 shrink-0 items-center justify-center rounded-full border border-white/[0.1] bg-white/[0.04] text-white/55 transition-colors hover:border-white/20 hover:text-white"
        >
          <X className="size-4" />
        </button>
      </header>

      {artifact.badge && (
        <div className="shrink-0 px-5 pt-3">
          <span className="inline-flex rounded-full border border-emerald-400/25 bg-emerald-400/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-300">
            {artifact.badge}
          </span>
        </div>
      )}

      <ArtifactBody artifact={artifact} />

      <footer className="flex shrink-0 flex-wrap items-center gap-2 border-t border-white/[0.08] px-4 py-3">
        <button
          type="button"
          onClick={() => void copy()}
          className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/[0.04] px-3 py-1.5 text-[12px] font-semibold text-white/75 transition-colors hover:border-white/30 hover:text-white"
        >
          {copied ? <Check className="size-3.5 text-emerald-300" /> : <Copy className="size-3.5" />}
          {copied ? "Copied" : "Copy"}
        </button>
        <button
          type="button"
          onClick={download}
          className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/[0.04] px-3 py-1.5 text-[12px] font-semibold text-white/75 transition-colors hover:border-white/30 hover:text-white"
        >
          <Download className="size-3.5" />
          Download
        </button>
        {artifact.jobId && (
          <a
            href={`/jobs/${artifact.jobId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-auto inline-flex items-center gap-1 text-[11px] font-semibold text-sky-300 transition-colors hover:text-sky-200"
          >
            Open job <ArrowUpRight className="size-3" />
          </a>
        )}
      </footer>
    </div>
  );

  return (
    <>
      <aside
        aria-label={`${meta.label}: ${artifact.title}`}
        className="hidden w-[400px] shrink-0 flex-col border-l border-white/[0.08] bg-[#080812]/95 xl:flex 2xl:w-[460px]"
      >
        {content}
      </aside>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`${meta.label}: ${artifact.title}`}
        className="fixed inset-0 z-[70] flex flex-col bg-[#06060f] xl:hidden"
      >
        {content}
      </div>
    </>
  );
}
