"use client";

import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useGenerateForRoleAction,
  useListCurriculumRunsQuery,
  useListCurriculumTracksQuery,
  useListRoleOptionsQuery,
  useRunCurriculumAgentAction,
  useSetCurriculumTrackStatusMutation,
  type CurriculumRun,
  type CurriculumTrack,
} from "@/features/api/curriculumApi";
import { Bot, CheckCircle2, Clock3, GraduationCap, Loader2, Plus, ShieldCheck, Sparkles } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

function formatDate(value: number | null) {
  if (!value) return "—";
  return new Date(value).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function statusBadge(status: string) {
  if (status === "published") {
    return "bg-emerald-500/15 text-emerald-400";
  }
  if (status === "draft") {
    return "bg-amber-500/15 text-amber-300";
  }
  if (status === "running") {
    return "bg-sky-500/15 text-sky-300";
  }
  if (status === "failed") {
    return "bg-rose-500/15 text-rose-300";
  }
  return "bg-white/10 text-white/50";
}

function StatusPill({ status }: { status: string }) {
  return (
    <span className={`rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${statusBadge(status)}`}>
      {status}
    </span>
  );
}

function StatCard({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <div className="rounded-2xl border border-glass-border bg-white/[0.025] p-5">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-bold">{value}</p>
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

export default function InterviewPrepPage() {
  const { data: runsData, isLoading: runsLoading } = useListCurriculumRunsQuery();
  const { data: tracksData, isLoading: tracksLoading } = useListCurriculumTracksQuery();
  const { data: roleOptionsData } = useListRoleOptionsQuery();
  const [runAgent, { isLoading: isRunning }] = useRunCurriculumAgentAction();
  const [generateForRole, { isLoading: isGenerating }] = useGenerateForRoleAction();
  const [setTrackStatus, { isLoading: isUpdating }] = useSetCurriculumTrackStatusMutation();
  const [maxTracks, setMaxTracks] = useState(2);
  const [role, setRole] = useState("");
  const [level, setLevel] = useState("All");

  const runs = (runsData as CurriculumRun[] | undefined) ?? [];
  const tracks = (tracksData as CurriculumTrack[] | undefined) ?? [];
  const published = tracks.filter((track) => track.status === "published").length;
  const drafts = tracks.filter((track) => track.status === "draft").length;
  const avgQuality = tracks.length
    ? (tracks.reduce((sum, track) => sum + track.quality_score, 0) / tracks.length).toFixed(1)
    : "—";
  const lastRun = runs[0];

  const handleRun = async () => {
    try {
      const result = (await runAgent({ maxTracks }).unwrap()) as {
        created: number;
        published: number;
      };
      toast.success(
        result.created
          ? `Curriculum agent created ${result.created} track${result.created === 1 ? "" : "s"} · ${result.published} auto-published.`
          : "Curriculum agent finished without creating a new track.",
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not run the curriculum agent.");
    }
  };

  const handleGenerateForRole = async () => {
    if (!role.trim()) {
      toast.error("Choose a role or type one in.");
      return;
    }
    try {
      const result = (await generateForRole({ role: role.trim(), level }).unwrap()) as {
        created: number;
        published: number;
        decisions: Array<{ status?: string; error?: string }>;
      };
      const failure = result.decisions.find((decision) => decision.status === "failed");
      if (!result.created) {
        toast.error(failure?.error ?? "The track could not be generated.");
        return;
      }
      toast.success(`Track generated and ${result.published ? "published" : "saved as draft"}.`);
      setRole("");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not generate the track.");
    }
  };

  const updateStatus = async (track: CurriculumTrack, status: "draft" | "published" | "archived") => {
    try {
      await setTrackStatus({ trackId: track.id, status }).unwrap();
      toast.success(`“${track.title}” is now ${status}.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update the track.");
    }
  };

  return (
    <div className="min-h-full">
      <PageHeader
        title="Interview prep"
        description="An autonomous curriculum agent watches job demand, builds role-level interview tracks, scores them, and publishes only when the quality gate passes."
        actions={
          <div className="flex items-center gap-2">
            <label className="sr-only" htmlFor="max-tracks">
              Tracks per run
            </label>
            <select
              id="max-tracks"
              value={maxTracks}
              onChange={(event) => setMaxTracks(Number(event.target.value))}
              disabled={isRunning}
              className="h-9 rounded-xl border border-glass-border bg-[#0c0d16] px-3 text-xs font-medium text-white outline-none disabled:opacity-50"
            >
              {[1, 2, 3, 4, 5].map((count) => (
                <option key={count} value={count}>
                  Build {count}
                </option>
              ))}
            </select>
            <Button onClick={() => void handleRun()} disabled={isRunning} className="gradient-primary h-9 rounded-xl px-4 text-xs font-bold text-white">
              {isRunning ? <Loader2 className="size-3.5 animate-spin" /> : <Sparkles className="size-3.5" />}
              {isRunning ? "Agent is building…" : "Run agent"}
            </Button>
          </div>
        }
      />

      <div className="space-y-6 p-5 md:p-8">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Published tracks" value={published} hint="Live in the candidate Courses page" />
          <StatCard label="Drafts / quarantine" value={drafts} hint="Waiting for a quality-gate pass" />
          <StatCard label="Average quality" value={avgQuality} hint="0–10 quality score" />
          <StatCard label="Last run" value={lastRun ? formatDate(lastRun.started_at) : "Not run yet"} hint={lastRun?.trigger ?? "Run the planner manually"} />
        </div>

        <section className="rounded-2xl border border-glass-border bg-white/[0.025] p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="flex items-center gap-2 text-sm font-bold">
                <Plus className="size-4 text-neon-cyan" />
                Create a track for a role
              </h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Choose a role or type one in. The builder agent writes the questions, then the quality gate publishes clean tracks.
              </p>
            </div>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_180px_auto] sm:items-end">
            <div className="space-y-2">
              <Label htmlFor="track-role">Role</Label>
              <Input
                id="track-role"
                list="role-options"
                value={role}
                onChange={(event) => setRole(event.target.value)}
                placeholder="e.g. Product Manager"
              />
              <datalist id="role-options">
                {((roleOptionsData as { roles?: string[] } | undefined)?.roles ?? []).map((option) => (
                  <option key={option} value={option} />
                ))}
              </datalist>
            </div>
            <div className="space-y-2">
              <Label htmlFor="track-level">Level</Label>
              <select
                id="track-level"
                value={level}
                onChange={(event) => setLevel(event.target.value)}
                className="h-9 w-full rounded-xl border border-glass-border bg-[#0c0d16] px-3 text-xs font-medium text-white outline-none"
              >
                {["All", "Entry", "Mid", "Senior"].map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
            <Button
              onClick={() => void handleGenerateForRole()}
              disabled={isGenerating || !role.trim()}
              className="gradient-primary h-9 rounded-xl px-4 text-xs font-bold text-white"
            >
              {isGenerating ? <Loader2 className="size-3.5 animate-spin" /> : <Sparkles className="size-3.5" />}
              {isGenerating ? "Building…" : "Generate track"}
            </Button>
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border border-glass-border bg-white/[0.02]">
          <div className="flex flex-col gap-2 border-b border-glass-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="flex items-center gap-2 text-sm font-bold">
                <Bot className="size-4 text-neon-cyan" />
                Curriculum agent runs
              </h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Each run plans against a bounded job-demand snapshot, builds content, runs QA, and auto-publishes only clean tracks.
              </p>
            </div>
          </div>
          {runsLoading ? (
            <div className="space-y-3 p-5">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : runs.length === 0 ? (
            <div className="px-5 py-10 text-center">
              <GraduationCap className="mx-auto size-8 text-white/20" />
              <p className="mt-3 text-sm font-semibold">No curriculum runs yet</p>
              <p className="mt-1 text-xs text-muted-foreground">Run the agent to generate the first interview-prep tracks.</p>
            </div>
          ) : (
            <div className="divide-y divide-white/[0.06]">
              {runs.map((run) => (
                <div key={run.id} className="flex flex-col gap-2 px-5 py-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusPill status={run.status} />
                      <span className="text-xs font-semibold capitalize">{run.trigger.replace(/_/g, " ")}</span>
                      <span className="text-[11px] text-muted-foreground">{formatDate(run.started_at)}</span>
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {run.tracks_created} created · {run.tracks_published} published · {run.model}
                    </p>
                    {run.error ? <p className="mt-1 text-xs text-rose-300">{run.error}</p> : null}
                    {run.decisions.length ? (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {run.decisions.slice(0, 6).map((decision, index) => (
                          <span key={`${run.id}-${index}`} className="rounded-md border border-white/10 bg-white/[0.03] px-2 py-1 text-[10px] text-white/55">
                            {String(decision.title ?? decision.slug ?? "decision")}
                            {decision.status ? ` · ${String(decision.status)}` : ""}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </div>
                  <div className="flex shrink-0 items-center gap-2 text-[11px] text-muted-foreground">
                    {run.status === "completed" ? <CheckCircle2 className="size-3.5 text-emerald-400" /> : null}
                    {run.status === "running" ? <Clock3 className="size-3.5 text-sky-300" /> : null}
                    {run.status === "failed" ? <ShieldCheck className="size-3.5 text-rose-300" /> : null}
                    {run.completed_at ? `Finished ${formatDate(run.completed_at)}` : "In progress"}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="overflow-hidden rounded-2xl border border-glass-border bg-white/[0.02]">
          <div className="border-b border-glass-border px-5 py-4">
            <h2 className="text-sm font-bold">Interview-prep tracks</h2>
            <p className="mt-1 text-xs text-muted-foreground">Published tracks appear in the candidate catalog. Drafts are held by the quality gate.</p>
          </div>
          {tracksLoading ? (
            <div className="space-y-3 p-5">
              <Skeleton className="h-14 w-full" />
              <Skeleton className="h-14 w-full" />
              <Skeleton className="h-14 w-full" />
            </div>
          ) : tracks.length === 0 ? (
            <div className="px-5 py-10 text-center text-sm text-muted-foreground">No tracks generated yet.</div>
          ) : (
            <div className="divide-y divide-white/[0.06]">
              {tracks.map((track) => (
                <div key={track.id} className="flex flex-col gap-3 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-sm font-semibold">{track.title}</p>
                      <StatusPill status={track.status} />
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {track.role_family} · {track.level} · {track.question_count} questions · {track.quality_score.toFixed(1)}/10 quality · demand {Math.round(track.demand_score)}
                    </p>
                    {track.quality_flags.length ? (
                      <p className="mt-1 text-[11px] text-amber-300">Flags: {track.quality_flags.slice(0, 3).join(" · ")}</p>
                    ) : null}
                  </div>
                  <div className="flex shrink-0 flex-wrap items-center gap-2">
                    {track.status !== "published" ? (
                      <button type="button" disabled={isUpdating} onClick={() => void updateStatus(track, "published")} className="rounded-lg border border-emerald-400/25 bg-emerald-400/10 px-3 py-1.5 text-[11px] font-semibold text-emerald-300 transition-colors hover:bg-emerald-400/15 disabled:opacity-50">
                        Publish
                      </button>
                    ) : (
                      <button type="button" disabled={isUpdating} onClick={() => void updateStatus(track, "draft")} className="rounded-lg border border-white/15 bg-white/[0.03] px-3 py-1.5 text-[11px] font-semibold text-white/65 transition-colors hover:text-white disabled:opacity-50">
                        Unpublish
                      </button>
                    )}
                    {track.status !== "archived" ? (
                      <button type="button" disabled={isUpdating} onClick={() => void updateStatus(track, "archived")} className="rounded-lg border border-rose-400/20 bg-rose-400/[0.06] px-3 py-1.5 text-[11px] font-semibold text-rose-300 transition-colors hover:bg-rose-400/10 disabled:opacity-50">
                        Archive
                      </button>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
