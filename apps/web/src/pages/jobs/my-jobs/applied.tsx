"use client";

/**
 * Applied tab of the job tracker — the list of the seeker's own applications,
 * each card showing the role, its current status, and the job's terms.
 *
 * Figma: Qelsa-Screen — applied jobs (649:2877).
 */

import { timeAgo } from "@/components/job/jobBrowseShared";
import { TrackedJobsListSkeleton } from "@/components/job/jobSkeletons";
import { JobCardHeading, JobCardShell, MyJobsHeader, SkillChips, TermChips } from "@/components/job/myJobsShared";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useWithdrawApplicationMutation } from "@/features/api/jobApplicationsApi";
import { useGetAppliedJobsQuery } from "@/features/api/jobsApi";
import { toastUnknownError } from "@/lib/errors";
import Layout from "@/layout";
import { JobApplication, JobApplicationStatus } from "@/types/jobApplication";
import { ExternalLink, FileText, MoreVertical, Undo2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";

/* -------------------------------- status ---------------------------------- */

const STATUS_META: Record<JobApplicationStatus, { label: string; className: string }> = {
  applied: { label: "Applied", className: "bg-neon-cyan/15 text-neon-cyan" },
  viewed: { label: "In Review", className: "bg-neon-cyan/15 text-neon-cyan" },
  sorted: { label: "Shortlisted", className: "bg-neon-green/15 text-neon-green" },
  hold: { label: "On Hold", className: "bg-neon-yellow/15 text-neon-yellow" },
  rejected: { label: "Not Selected", className: "bg-destructive/15 text-destructive" },
  cancelled: { label: "Withdrawn", className: "bg-white/10 text-white/60" },
};

/** Statuses that can only be reached after a recruiter opened the application. */
const SEEN_STATUSES: JobApplicationStatus[] = ["viewed", "sorted", "hold", "rejected"];

function wasViewed(application: JobApplication): boolean {
  if (SEEN_STATUSES.includes(application.status)) return true;
  return (application.jobApplicationLogs ?? []).some((log) => SEEN_STATUSES.includes(log.new_status));
}

function canWithdraw(status: JobApplicationStatus) {
  return status !== "cancelled" && status !== "rejected";
}

/* --------------------------------- page ----------------------------------- */

const Applied = () => {
  const router = useRouter();

  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");
  const [withdrawTarget, setWithdrawTarget] = useState<JobApplication | null>(null);

  const { data, isLoading } = useGetAppliedJobsQuery(search ? { search } : {});
  const applications = (data ?? []).filter((row) => row.job);
  const [withdraw, { isLoading: isWithdrawing }] = useWithdrawApplicationMutation();

  const viewedCount = useMemo(() => applications.filter(wasViewed).length, [applications]);
  const withdrawTitle = withdrawTarget?.job?.job_title?.name ?? withdrawTarget?.job?.title ?? "this role";

  const handleConfirmWithdraw = async () => {
    if (!withdrawTarget) return;
    try {
      await withdraw({ applicationId: withdrawTarget.id }).unwrap();
      toast.success("Application withdrawn");
      setWithdrawTarget(null);
    } catch (error: unknown) {
      toastUnknownError(error, "Could not withdraw this application. Please try again.");
    }
  };

  return (
    <Layout activeSection={"jobs"}>
      <div className="mx-auto w-full max-w-[1400px] px-6 py-8 text-white md:px-12">
        <MyJobsHeader
          activeTab="applied"
          subtitle="Monitor your job applications and stay on top of your career moves"
          query={query}
          setQuery={setQuery}
          onSearch={() => setSearch(query.trim())}
          stats={[
            { label: "Total Applied", value: applications.length },
            { label: "Viewed", value: viewedCount },
          ]}
          counts={{ applied: applications.length }}
        />

        <div className="flex flex-col gap-5 pt-6 pb-24">
          {isLoading ? (
            <TrackedJobsListSkeleton variant="applied" />
          ) : applications.length === 0 ? (
            <p className="text-sm text-white/45">No applications yet. Roles you apply to will show up here.</p>
          ) : (
            <>
              {applications.map((application) => (
                <AppliedCard
                  key={application.id}
                  application={application}
                  onOpen={() => router.push(`/jobs/${application.job.id}`)}
                  onWithdraw={() => setWithdrawTarget(application)}
                />
              ))}
              <p className="pt-8 text-center text-sm text-white/45">
                Showing 1-{applications.length} of {applications.length} applications
              </p>
            </>
          )}
        </div>
      </div>

      <AlertDialog
        open={withdrawTarget != null}
        onOpenChange={(open) => {
          if (isWithdrawing) return;
          if (!open) setWithdrawTarget(null);
        }}
      >
        <AlertDialogContent className="glass-strong border-glass-border text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Withdraw application?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes {withdrawTitle} from your applied list. The employer will no longer see this application.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isWithdrawing} className="rounded-full border-white/20 bg-transparent text-white hover:bg-white/5">
              Keep application
            </AlertDialogCancel>
            <Button variant="destructive" className="rounded-full" disabled={isWithdrawing} onClick={() => void handleConfirmWithdraw()}>
              {isWithdrawing ? "Withdrawing…" : "Withdraw"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
};

/* ------------------------------ applied card ------------------------------- */

function AppliedCard({ application, onOpen, onWithdraw }: { application: JobApplication; onOpen: () => void; onWithdraw: () => void }) {
  const { job } = application;
  const score = application.competency?.readiness != null ? Math.round(application.competency.readiness) : null;
  const status = STATUS_META[application.status] ?? STATUS_META.applied;
  const appliedAgo = application.applied_days_ago != null ? `${application.applied_days_ago}d ago` : timeAgo(application.applied_at ?? application.appliedAt);

  return (
    <JobCardShell>
      <JobCardHeading
        job={job}
        score={score}
        badge={<span className={`rounded-md px-2 py-[3px] text-[11px] font-semibold ${status.className}`}>{status.label}</span>}
        trailing={
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="rounded-lg p-1 text-white/60 transition-colors hover:bg-white/5 hover:text-white" aria-label="Application actions">
                <MoreVertical className="size-5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="glass border-glass-border">
              <DropdownMenuItem onClick={onOpen}>
                <ExternalLink className="mr-2 size-4" />
                View Job Posting
              </DropdownMenuItem>
              {canWithdraw(application.status) && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem variant="destructive" onClick={onWithdraw}>
                    <Undo2 className="mr-2 size-4" />
                    Withdraw application
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        }
      />

      <SkillChips job={job} />

      <div className="h-px w-full bg-white/[0.12]" />

      {/* Terms + actions */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <TermChips job={job} />
          <span className="flex items-center gap-1.5 text-[13px] text-white/60">
            <FileText className="size-4" />
            {job.application_count ?? job.applications?.length ?? 0} applications
          </span>
        </div>

        <div className="flex items-center gap-4">
          {appliedAgo && <span className="text-[13px] text-white/45">Applied {appliedAgo}</span>}
          <button onClick={onOpen} className="text-[13px] font-semibold text-neon-cyan transition-colors hover:text-neon-cyan/80">
            View Application
          </button>
        </div>
      </div>
    </JobCardShell>
  );
}

export default Applied;
