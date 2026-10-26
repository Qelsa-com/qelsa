"use client";

import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useAlert } from "@/components/ui/alert-modal";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  useListJobsQuery,
  useModerateJobMutation,
  useWipeAllJobsMutation,
} from "@/features/api/adminApi";
import { Briefcase, ChevronLeft, ChevronRight, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

type StatusFilter = "all" | "open" | "closed" | "paused" | "draft";
type SourceFilter = "all" | "ingested" | "posted";
type DateSort = "newest" | "oldest";

function Badge({ children, tone }: { children: React.ReactNode; tone: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold tracking-wide uppercase ${tone}`}
    >
      {children}
    </span>
  );
}

function statusTone(status: string) {
  if (status === "open") return "bg-emerald-500/15 text-emerald-400";
  if (status === "closed") return "bg-white/10 text-white/60";
  if (status === "paused") return "bg-amber-500/15 text-amber-400";
  return "bg-sky-500/15 text-sky-400";
}

export default function JobsPage() {
  const alert = useAlert();
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [source, setSource] = useState<SourceFilter>("all");
  const [dateSort, setDateSort] = useState<DateSort>("newest");
  const [cursor, setCursor] = useState<string | undefined>(undefined);
  const [page, setPage] = useState(0);
  const [pendingId, setPendingId] = useState<string | null>(null);

  const [moderateJob, { isLoading: isModerating }] = useModerateJobMutation();
  const [wipeAll, { isLoading: isWiping }] = useWipeAllJobsMutation();
  const [wipeConfirm, setWipeConfirm] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim());
      setCursor(undefined);
      setPage(0);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const filters = useMemo(
    () => ({
      status: status === "all" ? undefined : status,
      search: search || undefined,
      onlyIngested: source === "all" ? undefined : source === "ingested",
      sort: dateSort,
    }),
    [status, search, source, dateSort],
  );

  const { data, isLoading } = useListJobsQuery(filters, cursor);
  const rows = data?.page ?? [];

  const resetPaging = () => {
    setCursor(undefined);
    setPage(0);
  };

  const handleModerate = async (
    jobId: string,
    action: "close" | "reopen" | "pause" | "delete",
  ) => {
    if (action === "delete") {
      const confirmed = await alert({
        title: "Delete this job?",
        description:
          "Every application attached to it will also be deleted. This cannot be undone.",
        confirmText: "Delete job",
        cancelText: "Keep job",
        tone: "danger",
      });
      if (!confirmed) return;
    }
    setPendingId(jobId);
    try {
      await moderateJob({ jobId, action }).unwrap();
      toast.success(
        action === "delete" ? "Job deleted." : `Job ${action}d.`,
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update the job.");
    } finally {
      setPendingId(null);
    }
  };

  const handleWipe = async () => {
    if (wipeConfirm !== "DELETE") return;
    try {
      const result = await wipeAll(undefined).unwrap();
      setWipeConfirm("");
      if (result.started) {
        toast.success("Deleting seeded and ingested jobs in the background. Jobs posted by users are kept.");
      } else {
        toast.info("There are no seeded or ingested jobs to delete.");
      }
    } catch {
      toast.error("Could not start the job wipe.");
    }
  };

  return (
    <>
      <PageHeader
        title="Jobs"
        description="Moderate postings across the platform. Ingested jobs have no owner; posted jobs belong to a recruiter."
      />

      <div className="px-5 py-6 md:px-8">
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Search by title or company"
              className="pl-9"
              aria-label="Search jobs"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <select
              value={status}
              onChange={(event) => {
                setStatus(event.target.value as StatusFilter);
                resetPaging();
              }}
              aria-label="Filter by status"
              className="h-9 rounded-md border border-glass-border bg-[#12121a] px-3 text-sm text-white outline-none focus-visible:border-ring"
            >
              <option value="all">Any status</option>
              <option value="open">Open</option>
              <option value="closed">Closed</option>
              <option value="paused">Paused</option>
              <option value="draft">Draft</option>
            </select>

            <select
              value={source}
              onChange={(event) => {
                setSource(event.target.value as SourceFilter);
                resetPaging();
              }}
              aria-label="Filter by source"
              className="h-9 rounded-md border border-glass-border bg-[#12121a] px-3 text-sm text-white outline-none focus-visible:border-ring"
            >
              <option value="all">All sources</option>
              <option value="ingested">Ingested</option>
              <option value="posted">Posted by users</option>
            </select>

            <select
              value={dateSort}
              onChange={(event) => {
                setDateSort(event.target.value as DateSort);
                resetPaging();
              }}
              aria-label="Sort by date"
              className="h-9 rounded-md border border-glass-border bg-[#12121a] px-3 text-sm text-white outline-none focus-visible:border-ring"
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
            </select>
          </div>
        </div>

        <div className="mt-5 overflow-hidden rounded-2xl border border-glass-border">
          <Table>
            <TableHeader>
              <TableRow className="border-glass-border hover:bg-transparent">
                <TableHead className="text-muted-foreground">Job</TableHead>
                <TableHead className="text-muted-foreground">Source</TableHead>
                <TableHead className="text-muted-foreground">Status</TableHead>
                <TableHead className="text-muted-foreground">Engagement</TableHead>
                <TableHead className="text-muted-foreground">Posted</TableHead>
                <TableHead className="text-right text-muted-foreground">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading &&
                !data &&
                [0, 1, 2, 3, 4].map((key) => (
                  <TableRow key={key} className="border-glass-border">
                    <TableCell colSpan={6}>
                      <Skeleton className="h-10 w-full" />
                    </TableCell>
                  </TableRow>
                ))}

              {rows.map((job) => (
                <TableRow key={job.id} className="border-glass-border/60 hover:bg-white/5">
                  <TableCell>
                    <div className="min-w-0">
                      <p className="truncate font-medium text-white">
                        {job.title ?? "Untitled"}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {[job.company_name, job.location].filter(Boolean).join(" · ") || "—"}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    {job.is_ingested ? (
                      <Badge tone="bg-sky-500/15 text-sky-400">Ingested</Badge>
                    ) : (
                      <Badge tone="bg-white/10 text-white/70">Posted</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge tone={statusTone(job.status)}>{job.status}</Badge>
                  </TableCell>
                  <TableCell className="text-sm whitespace-nowrap text-muted-foreground">
                    {job.view_count.toLocaleString()} views ·{" "}
                    {job.application_count.toLocaleString()} apps
                  </TableCell>
                  <TableCell className="text-sm whitespace-nowrap text-muted-foreground">
                    {new Date(job.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1.5">
                      {job.status !== "open" && (
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={isModerating || pendingId === job.id}
                          onClick={() => void handleModerate(job.id, "reopen")}
                          className="rounded-full border-glass-border bg-transparent text-white hover:bg-white/5"
                        >
                          Reopen
                        </Button>
                      )}
                      {job.status !== "closed" && (
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={isModerating || pendingId === job.id}
                          onClick={() => void handleModerate(job.id, "close")}
                          className="rounded-full border-glass-border bg-transparent text-white hover:bg-white/5"
                        >
                          Close
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={isModerating || pendingId === job.id}
                        onClick={() => void handleModerate(job.id, "delete")}
                        className="rounded-full border-destructive/50 bg-transparent text-destructive hover:bg-destructive/10"
                      >
                        Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}

              {!isLoading && !rows.length && (
                <TableRow className="border-glass-border">
                  <TableCell
                    colSpan={6}
                    className="py-10 text-center text-sm text-muted-foreground"
                  >
                    <Briefcase className="mx-auto mb-2 h-6 w-6 opacity-40" />
                    No jobs match these filters.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <div className="mt-4 flex items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            {data?.isDone ? "End of results" : "More results available"}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 0}
              onClick={() => {
                setPage((current) => Math.max(0, current - 1));
                setCursor(undefined);
              }}
              className="rounded-full border-glass-border bg-transparent text-white hover:bg-white/5"
            >
              <ChevronLeft className="h-4 w-4" />
              First
            </Button>
            <span className="text-xs text-muted-foreground">Page {page + 1}</span>
            <Button
              variant="outline"
              size="sm"
              disabled={data?.isDone ?? true}
              onClick={() => {
                setPage((current) => current + 1);
                setCursor(data?.continueCursor || undefined);
              }}
              className="rounded-full border-glass-border bg-transparent text-white hover:bg-white/5"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <section className="mt-8 rounded-2xl border border-destructive/40 bg-destructive/5 px-5 py-5">
          <p className="text-sm font-semibold text-destructive">Danger zone</p>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Permanently delete seeded, scraped, and admin ATS board jobs, plus their
            applications and saved rows. Jobs posted by users on Qelsa are not touched.
          </p>

          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="space-y-2">
              <Label htmlFor="wipe-confirm">
                Type <span className="font-semibold text-white">DELETE</span> to confirm
              </Label>
              <Input
                id="wipe-confirm"
                value={wipeConfirm}
                onChange={(event) => setWipeConfirm(event.target.value)}
                placeholder="DELETE"
                autoComplete="off"
                disabled={isWiping}
                className="sm:w-48"
              />
            </div>
            <Button
              variant="outline"
              disabled={wipeConfirm !== "DELETE" || isWiping}
              onClick={() => void handleWipe()}
              className="rounded-full border-destructive/50 bg-transparent text-destructive hover:bg-destructive/10"
            >
              {isWiping ? "Starting…" : "Delete all ingested jobs"}
            </Button>
          </div>
        </section>
      </div>
    </>
  );
}
