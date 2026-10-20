"use client";

/**
 * Trace-style agent step indicators, adapted from the shadcn AI Elements
 * `Trace` / `Reasoning` patterns to Qelsa's dark theme.
 *
 * A trace row is intentionally flat: icon, action label, optional status, and
 * an optional disclosure. Running rows use a shimmering label instead of
 * bouncing dots, which keeps long reasoning passes legible and accessible.
 */

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/components/ui/utils";
import { ChevronDown, CircleCheck, LoaderCircle } from "lucide-react";
import { useState, type ComponentType, type ReactNode } from "react";

type TraceStatus = "running" | "error" | "pending";

export function AgentTraceLine({
  icon: Icon,
  iconClassName,
  title,
  description,
  status,
  trailing,
  className,
}: {
  icon?: ComponentType<{ className?: string }>;
  iconClassName?: string;
  title: ReactNode;
  description?: ReactNode;
  status?: TraceStatus;
  trailing?: ReactNode;
  className?: string;
}) {
  return (
    <span className={cn("flex min-h-7 w-full items-center gap-2 rounded-lg px-1 py-1", className)}>
      {Icon ? (
        <span
          aria-hidden="true"
          className={cn(
            "flex size-5 shrink-0 items-center justify-center rounded-md border",
            status === "error"
              ? "border-rose-400/25 bg-rose-400/10 text-rose-300"
              : status === "running"
                ? "border-neon-cyan/25 bg-neon-cyan/10 text-neon-cyan"
                : "border-white/10 bg-white/[0.04] text-white/45",
          )}
        >
          <Icon className={cn("size-3", iconClassName)} />
        </span>
      ) : null}
      <span
        className={cn(
          "min-w-0 flex-1 truncate text-[12px] font-medium leading-5",
          status === "running"
            ? "agent-trace-shimmer"
            : status === "error"
              ? "text-rose-200"
              : status === "pending"
                ? "text-white/40"
                : "text-white/60",
        )}
      >
        {title}
      </span>
      {description ? <span className="shrink-0 text-[11px] text-white/30">{description}</span> : null}
      {trailing ? <span className="flex shrink-0 items-center text-white/30">{trailing}</span> : null}
    </span>
  );
}

/** The pre-first-token state, used before the agent has produced any parts. */
export function AgentThinkingLine() {
  return (
    <AgentTraceLine
      icon={LoaderCircle}
      iconClassName="animate-spin motion-reduce:animate-none"
      title="Thinking"
      status="running"
    />
  );
}

/**
 * A reasoning part. It opens while the model is thinking, then collapses to a
 * one-line "Thought" summary once the part closes — unless the person chose to
 * keep it open. The text stays available on demand.
 */
export function AgentReasoningTrace({ text, running }: { text: string; running: boolean }) {
  const [userOpen, setUserOpen] = useState<boolean | null>(null);
  const open = userOpen ?? running;

  const line = (
    <AgentTraceLine
      icon={running ? LoaderCircle : CircleCheck}
      iconClassName={running ? "animate-spin motion-reduce:animate-none" : undefined}
      title={running ? "Thinking" : "Thought"}
      status={running ? "running" : undefined}
      trailing={
        text.trim() ? (
          <ChevronDown
            className={cn(
              "size-3.5 transition-transform group-data-[state=open]/reasoning:rotate-180",
            )}
          />
        ) : null
      }
    />
  );

  if (!text.trim()) return line;

  return (
    <Collapsible
      open={open}
      onOpenChange={(next) => setUserOpen(next)}
      className="group/reasoning w-full"
    >
      <CollapsibleTrigger
        type="button"
        className="flex w-full rounded-lg text-left transition-colors hover:bg-white/[0.03]"
      >
        {line}
      </CollapsibleTrigger>
      <CollapsibleContent className="agent-collapsible-content">
        <p className="ml-8 mt-0.5 max-h-60 overflow-y-auto whitespace-pre-wrap border-l border-white/[0.08] py-0.5 pl-3 text-[11px] leading-relaxed text-white/40">
          {text}
        </p>
      </CollapsibleContent>
    </Collapsible>
  );
}
