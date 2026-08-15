"use client";

/**
 * Applied tab of the job tracker — the list of the seeker's own applications,
 * each card showing the role, its current status, the application timeline and
 * the job's terms.
 *
 * Figma: Qelsa-Screen — applied jobs (649:2877).
 */

import { timeAgo } from "@/components/job/jobBrowseShared";
import { CardAction, JobCardHeading, JobCardShell, MyJobsHeader, SkillChips, TermChips } from "@/components/job/myJobsShared";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useLazyGetAppliedJobsQuery } from "@/features/api/jobsApi";
import Layout from "@/layout";
import { JobApplication, JobApplicationStatus } from "@/types/jobApplication";
import { Archive, Check, ExternalLink, FileText, MessageSquare, MoreVertical } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

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

/* --------------------------------- page ----------------------------------- */

const Applied = () => {
  const router = useRouter();

  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [query, setQuery] = useState("");

  const [triggerGetJobs, { isLoading }] = useLazyGetAppliedJobsQuery();

  const runSearch = async (nextQuery: string) => {
    try {
      const result = await triggerGetJobs({ search: nextQuery }, false).unwrap();
      setApplications(result ?? []);
    } catch {
      setApplications([]);
    }
  };

  useEffect(() => {
    runSearch(query);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const viewedCount = useMemo(() => applications.filter(wasViewed).length, [applications]);

  return (
    <Layout activeSection={"jobs"}>
      <div className="mx-auto w-full max-w-[1400px] px-6 py-8 text-white md:px-12">
        <MyJobsHeader
          activeTab="applied"
          subtitle="Monitor your job applications and stay on top of your career moves"
          query={query}
          setQuery={setQuery}
          onSearch={() => runSearch(query)}
          stats={[
            { label: "Total Applied", value: applications.length },
            { label: "Viewed", value: viewedCount },
          ]}
          counts={{ applied: applications.length }}
        />

        <div className="flex flex-col gap-5 pt-6 pb-24">
          {isLoading ? (
            <p className="text-sm text-white/45">Loading applications...</p>
          ) : applications.length === 0 ? (
            <p className="text-sm text-white/45">No applications yet. Roles you apply to will show up here.</p>
          ) : (
            <>
              {applications.map((application) => (
                <AppliedCard key={application.id} application={application} onOpen={() => router.push(`/jobs/${application.job.id}`)} />
              ))}
              <p className="pt-8 text-center text-sm text-white/45">
                Showing 1-{applications.length} of {applications.length} applications
              </p>
            </>
          )}
        </div>
      </div>
    </Layout>
  );
};

/* ------------------------------ applied card ------------------------------- */

function AppliedCard({ application, onOpen }: { application: JobApplication; onOpen: () => void }) {
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
              <DropdownMenuItem>
                <MessageSquare className="mr-2 size-4" />
                Add Note
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Archive className="mr-2 size-4" />
                Archive
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        }
      />

      <SkillChips job={job} />

      {/* Timeline */}
      <div className="flex flex-col gap-4">
        <p className="text-[13px] font-semibold uppercase text-white/45">Application Timeline</p>
        <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
          <TimelineStage label="Application Submitted" done />
          <TimelineStage label="Application Viewed" done={wasViewed(application)} />
        </div>
      </div>

      <div className="h-px w-full bg-white/[0.12]" />

      {/* Terms + actions */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <TermChips job={job} />
          {job.applications && (
            <span className="flex items-center gap-1.5 text-[13px] text-white/60">
              <FileText className="size-4" />
              {job.applications.length} applications
            </span>
          )}
        </div>

        <div className="flex items-center gap-4">
          {appliedAgo && <span className="text-[13px] text-white/45">Applied {appliedAgo}</span>}
          <CardAction label="View Application" onClick={onOpen} />
        </div>
      </div>
    </JobCardShell>
  );
}

function TimelineStage({ label, done }: { label: string; done: boolean }) {
  return (
    <div className="flex flex-1 items-center gap-2">
      {done ? (
        <span className="flex size-[18px] shrink-0 items-center justify-center rounded-full bg-neon-green">
          <Check className="size-3 text-background" strokeWidth={3} />
        </span>
      ) : (
        <span className="size-[18px] shrink-0 rounded-full border border-white/20" />
      )}
      <p className={`truncate text-[13px] font-semibold ${done ? "text-white" : "text-white/45"}`}>{label}</p>
    </div>
  );
}

export default Applied;
