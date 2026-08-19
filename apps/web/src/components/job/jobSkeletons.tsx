"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/components/ui/utils";

function Bone({ className }: { className?: string }) {
  return <Skeleton className={cn("bg-white/[0.08]", className)} />;
}

function range(count: number) {
  return Array.from({ length: count }, (_, i) => i);
}

/** Mirrors `JobCard` on Smart Matches / All Jobs. */
export function JobCardSkeleton() {
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-glass-border bg-white/[0.04] p-4 sm:rounded-[20px] sm:p-5">
      <div className="flex items-center justify-between">
        <Bone className="size-9 rounded-lg" />
        <Bone className="size-11 rounded-full sm:size-12" />
      </div>
      <div className="flex flex-col gap-2">
        <Bone className="h-4 w-4/5" />
        <Bone className="h-3.5 w-2/5" />
        <Bone className="h-3 w-1/2" />
      </div>
      <div className="flex gap-1.5">
        <Bone className="h-5 w-14 rounded-md" />
        <Bone className="h-5 w-16 rounded-md" />
        <Bone className="h-5 w-14 rounded-md" />
      </div>
      <div className="mt-auto flex items-center justify-between gap-2">
        <Bone className="h-3.5 w-24" />
        <Bone className="h-3 w-12" />
      </div>
    </div>
  );
}

export function JobCardGridSkeleton({ count = 8, columns = 4 }: { count?: number; columns?: 3 | 4 }) {
  const grid =
    columns === 3
      ? "grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3"
      : "grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4";
  return (
    <div className={grid}>
      {range(count).map((i) => (
        <JobCardSkeleton key={i} />
      ))}
    </div>
  );
}

/** Ready Now + Almost There grids, matching Smart Matches. */
export function SmartMatchesSkeleton() {
  return (
    <div className="flex flex-col gap-12 sm:gap-16" role="status" aria-label="Loading matches">
      <span className="sr-only">Loading matches</span>
      {range(2).map((section) => (
        <div key={section} className="flex flex-col gap-4 sm:gap-6">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <Bone className="size-2 rounded-full" />
              <Bone className="h-7 w-36" />
            </div>
            <Bone className="h-4 w-72 max-w-full" />
          </div>
          <JobCardGridSkeleton count={4} columns={4} />
        </div>
      ))}
    </div>
  );
}

export function AllJobsGridSkeleton() {
  return (
    <div className="flex flex-col gap-4 sm:gap-6" role="status" aria-label="Loading jobs">
      <span className="sr-only">Loading jobs</span>
      <Bone className="h-4 w-40" />
      <JobCardGridSkeleton count={12} columns={3} />
    </div>
  );
}

export function SimilarJobCardSkeleton() {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-glass-border bg-white/[0.03] p-4">
      <Bone className="size-10 shrink-0 rounded-xl" />
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <Bone className="h-3.5 w-3/4" />
        <Bone className="h-3 w-1/2" />
        <Bone className="h-3 w-1/3" />
      </div>
      <Bone className="h-4 w-12 shrink-0" />
    </div>
  );
}

/** Full job-detail layout: hero, left sections, similar-jobs sidebar. */
export function JobDetailSkeleton() {
  return (
    <div className="text-white" role="status" aria-label="Loading job">
      <span className="sr-only">Loading job</span>
      <div className="relative mx-auto flex max-w-[1280px] flex-col gap-4 px-4 pb-8 pt-4 sm:px-6 lg:gap-6 lg:px-20 lg:pb-12 lg:pt-8">
        <Bone className="hidden h-4 w-28 lg:block" />

        <div className="rounded-xl border border-glass-border bg-white/[0.03] p-4 lg:rounded-[20px] lg:p-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3">
              <Bone className="size-12 rounded-2xl lg:size-16" />
              <div className="flex flex-col gap-2">
                <Bone className="h-4 w-28" />
                <Bone className="h-3 w-40" />
              </div>
            </div>
            <div className="hidden gap-3 lg:flex">
              <Bone className="h-11 w-24 rounded-full" />
              <Bone className="h-11 w-28 rounded-full" />
            </div>
          </div>
          <Bone className="mt-6 h-8 w-2/3 max-w-md" />
          <div className="mt-6 flex gap-3">
            {range(3).map((i) => (
              <div key={i} className="flex min-w-0 flex-1 flex-col gap-2 rounded-xl border border-glass-border bg-white/[0.03] p-3 lg:rounded-2xl lg:p-4">
                <Bone className="h-3 w-16" />
                <Bone className="h-6 w-12" />
              </div>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {range(5).map((i) => (
              <Bone key={i} className="h-7 w-20 rounded-full" />
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:gap-6">
          <div className="flex min-w-0 flex-1 flex-col gap-4 lg:gap-6">
            <div className="flex flex-col gap-3 rounded-[20px] border border-neon-cyan/20 bg-white/[0.03] p-4 lg:flex-row lg:items-center lg:p-5">
              <Bone className="size-10 rounded-[20px]" />
              <div className="flex flex-1 flex-col gap-2">
                <Bone className="h-4 w-56" />
                <Bone className="h-3 w-full max-w-md" />
              </div>
              <Bone className="h-10 w-40 rounded-full" />
            </div>
            <div className="flex flex-col gap-3 rounded-[20px] border border-glass-border bg-white/[0.03] p-4 lg:p-6">
              <Bone className="h-5 w-40" />
              <Bone className="h-3 w-full" />
              <Bone className="h-3 w-full" />
              <Bone className="h-3 w-4/5" />
            </div>
            <div className="flex flex-col gap-3 rounded-[20px] border border-glass-border bg-white/[0.03] p-4 lg:p-6">
              <Bone className="h-5 w-52" />
              <div className="flex flex-wrap gap-2">
                {range(6).map((i) => (
                  <Bone key={i} className="h-7 w-16 rounded-full" />
                ))}
              </div>
            </div>
          </div>
          <div className="w-full lg:w-80 lg:shrink-0">
            <div className="flex flex-col gap-3 rounded-[20px] border border-glass-border bg-white/[0.03] p-4 lg:p-6">
              <Bone className="h-5 w-28" />
              {range(4).map((i) => (
                <SimilarJobCardSkeleton key={i} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Saved / In Progress tracker cards. */
export function TrackedJobCardSkeleton() {
  return (
    <div className="flex flex-col gap-4 rounded-[20px] border border-glass-border bg-white/[0.04] px-7 py-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <Bone className="size-12 rounded-xl" />
          <div className="flex flex-col gap-2">
            <Bone className="h-5 w-48" />
            <Bone className="h-3.5 w-56" />
          </div>
        </div>
        <Bone className="size-11 rounded-full" />
      </div>
      <div className="flex gap-2">
        {range(4).map((i) => (
          <Bone key={i} className="h-6 w-16 rounded-full" />
        ))}
      </div>
      <div className="h-px w-full bg-white/[0.08]" />
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <Bone className="h-6 w-16 rounded-md" />
          <Bone className="h-6 w-20 rounded-md" />
          <Bone className="h-6 w-16 rounded-md" />
        </div>
        <Bone className="h-9 w-28 rounded-full" />
      </div>
    </div>
  );
}

export function AppliedJobCardSkeleton() {
  return (
    <div className="flex flex-col gap-4 rounded-[20px] border border-glass-border bg-white/[0.04] px-7 py-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <Bone className="size-12 rounded-xl" />
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <Bone className="h-5 w-44" />
              <Bone className="h-5 w-16 rounded-md" />
            </div>
            <Bone className="h-3.5 w-52" />
          </div>
        </div>
        <Bone className="size-11 rounded-full" />
      </div>
      <div className="flex gap-2">
        {range(3).map((i) => (
          <Bone key={i} className="h-6 w-16 rounded-full" />
        ))}
      </div>
      <div className="flex flex-col gap-3">
        <Bone className="h-3 w-36" />
        <div className="flex gap-4">
          <Bone className="h-4 w-44" />
          <Bone className="h-4 w-36" />
        </div>
      </div>
      <div className="h-px w-full bg-white/[0.08]" />
      <div className="flex items-center justify-between">
        <Bone className="h-4 w-48" />
        <Bone className="h-9 w-36 rounded-full" />
      </div>
    </div>
  );
}

export function TrackedJobsListSkeleton({ variant = "tracked", count = 4 }: { variant?: "tracked" | "applied"; count?: number }) {
  const Card = variant === "applied" ? AppliedJobCardSkeleton : TrackedJobCardSkeleton;
  return (
    <div className="flex flex-col gap-5" role="status" aria-label="Loading applications">
      <span className="sr-only">Loading applications</span>
      {range(count).map((i) => (
        <Card key={i} />
      ))}
    </div>
  );
}

/** Recruiter "Job posts" list row. */
export function PostedJobCardSkeleton() {
  return (
    <div className="flex flex-col gap-4 rounded-[20px] border border-white/12 bg-white/4 px-7 py-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Bone className="h-5 w-48" />
          <Bone className="h-5 w-16 rounded-full" />
        </div>
        <Bone className="size-8 rounded-lg" />
      </div>
      <div className="flex gap-2">
        {range(4).map((i) => (
          <Bone key={i} className="h-6 w-16 rounded-full" />
        ))}
      </div>
      <div className="h-px w-full bg-white/8" />
      <div className="flex items-center justify-between">
        <Bone className="h-4 w-32" />
        <Bone className="h-4 w-36" />
      </div>
    </div>
  );
}

export function PostedJobsSkeleton() {
  return (
    <div className="flex flex-col gap-8" role="status" aria-label="Loading job posts">
      <span className="sr-only">Loading job posts</span>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {range(4).map((i) => (
          <div key={i} className="flex flex-col gap-2 rounded-2xl border border-white/12 bg-white/3 p-4">
            <Bone className="h-3 w-16" />
            <Bone className="h-7 w-10" />
          </div>
        ))}
      </div>
      <div className="flex flex-col gap-5">
        {range(3).map((i) => (
          <PostedJobCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

export function MatchSessionSkeleton() {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-8 text-white sm:px-6" role="status" aria-label="Loading match">
      <span className="sr-only">Loading your match</span>
      <Bone className="h-4 w-28" />
      <div className="flex flex-col gap-2">
        <Bone className="h-3 w-32" />
        <Bone className="h-8 w-2/3 max-w-md" />
        <Bone className="h-4 w-40" />
      </div>
      <div className="grid gap-5 lg:grid-cols-[minmax(280px,380px)_1fr]">
        <div className="flex flex-col gap-4 rounded-[20px] border border-glass-border bg-white/[0.03] p-5">
          <div className="flex items-center gap-4">
            <Bone className="size-[112px] rounded-full" />
            <Bone className="h-12 flex-1" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            {range(4).map((i) => (
              <div key={i} className="space-y-2">
                <Bone className="h-3 w-20" />
                <Bone className="h-1.5 w-full rounded-full" />
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {range(5).map((i) => (
              <Bone key={i} className="h-6 w-16 rounded-full" />
            ))}
          </div>
        </div>
        <div className="flex min-h-[320px] flex-col gap-3 rounded-[20px] border border-glass-border bg-white/[0.03] p-5">
          {range(3).map((i) => (
            <Bone key={i} className={i % 2 === 0 ? "h-16 w-4/5 self-start rounded-2xl" : "h-12 w-3/5 self-end rounded-2xl"} />
          ))}
          <div className="mt-auto flex gap-2">
            <Bone className="h-11 flex-1 rounded-full" />
            <Bone className="size-11 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function CandidateRowSkeleton() {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-white/12 bg-white/4 p-4">
      <Bone className="size-4 rounded" />
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <div className="flex items-center justify-between gap-2">
          <Bone className="h-4 w-28" />
          <Bone className="h-5 w-16 rounded" />
        </div>
        <Bone className="h-3 w-40" />
      </div>
    </div>
  );
}

export function ApplicantDetailSkeleton() {
  return (
    <div className="flex flex-col gap-6 p-6" role="status" aria-label="Loading applicant">
      <span className="sr-only">Loading applicant details</span>
      <div className="flex items-center gap-4">
        <Bone className="size-16 rounded-full" />
        <div className="flex flex-1 flex-col gap-2">
          <Bone className="h-5 w-40" />
          <Bone className="h-3.5 w-56" />
          <Bone className="h-3 w-32" />
        </div>
      </div>
      <div className="flex gap-2">
        {range(4).map((i) => (
          <Bone key={i} className="h-7 w-16 rounded-full" />
        ))}
      </div>
      <Bone className="h-24 w-full rounded-2xl" />
      <Bone className="h-40 w-full rounded-2xl" />
    </div>
  );
}
