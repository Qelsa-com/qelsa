"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/components/ui/utils";

function Bone({ className }: { className?: string }) {
  return <Skeleton className={cn("bg-white/[0.08]", className)} />;
}

function range(count: number) {
  return Array.from({ length: count }, (_, i) => i);
}

export function PageCardSkeleton() {
  return (
    <div className="rounded-xl border border-glass-border bg-white/[0.04] p-6">
      <div className="mb-4 flex items-center gap-3">
        <Bone className="size-12 rounded-lg" />
        <div className="flex flex-1 flex-col gap-2">
          <Bone className="h-4 w-32" />
          <Bone className="h-3 w-44" />
        </div>
      </div>
      <div className="mb-2 grid grid-cols-3 gap-4">
        {range(3).map((i) => (
          <div key={i} className="flex flex-col items-center gap-1">
            <Bone className="h-5 w-8" />
            <Bone className="h-3 w-12" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function PagesHubGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3" role="status" aria-label="Loading pages">
      <span className="sr-only">Loading pages</span>
      {range(count).map((i) => (
        <PageCardSkeleton key={i} />
      ))}
    </div>
  );
}

/** Company / community page: cover, identity card, tabs, body. */
export function CompanyPageSkeleton() {
  return (
    <div className="min-h-screen" role="status" aria-label="Loading page">
      <span className="sr-only">Loading page details</span>
      <div className="border-b border-glass-border px-6 py-4">
        <Bone className="h-8 w-20 rounded-full" />
      </div>
      <Bone className="h-64 w-full rounded-none" />
      <div className="relative z-10 mx-auto max-w-6xl px-6 -mt-16">
        <div className="mb-6 rounded-xl border border-glass-border bg-white/[0.04] p-6">
          <div className="flex items-start gap-6">
            <Bone className="size-24 rounded-xl" />
            <div className="flex flex-1 flex-col gap-3">
              <Bone className="h-7 w-48" />
              <Bone className="h-4 w-72 max-w-full" />
              <div className="flex gap-2">
                <Bone className="h-8 w-24 rounded-full" />
                <Bone className="h-8 w-24 rounded-full" />
              </div>
            </div>
          </div>
        </div>
        <div className="mb-6 flex gap-3">
          {range(3).map((i) => (
            <Bone key={i} className="h-9 w-24 rounded-full" />
          ))}
        </div>
        <div className="flex flex-col gap-3 pb-16">
          <Bone className="h-4 w-full" />
          <Bone className="h-4 w-full" />
          <Bone className="h-4 w-3/4" />
          <Bone className="mt-4 h-32 w-full rounded-2xl" />
        </div>
      </div>
    </div>
  );
}

export function ProfilePageSkeleton() {
  return (
    <div className="flex min-h-screen w-full flex-col bg-[#06060f]" role="status" aria-label="Loading profile">
      <span className="sr-only">Loading profile</span>
      <div className="relative mx-auto flex w-full max-w-[1280px] flex-col items-center gap-10 px-6 py-12 sm:flex-row md:px-12 lg:px-20 lg:py-16">
        <Bone className="size-[140px] shrink-0 rounded-full" />
        <div className="flex w-full flex-1 flex-col items-center gap-3 sm:items-start">
          <Bone className="h-8 w-48" />
          <Bone className="h-4 w-64 max-w-full" />
          <Bone className="h-4 w-40" />
          <div className="mt-2 flex gap-3">
            <Bone className="h-10 w-24 rounded-full" />
            <Bone className="h-10 w-24 rounded-full" />
          </div>
        </div>
      </div>
      <div className="mx-auto grid w-full max-w-[1280px] grid-cols-1 gap-6 px-6 pb-20 pt-6 md:px-12 lg:grid-cols-[minmax(0,1fr)_520px] lg:px-20">
        <div className="flex flex-col gap-6">
          {range(2).map((i) => (
            <div key={i} className="flex flex-col gap-4 rounded-[20px] border border-glass-border bg-white/[0.04] p-6">
              <Bone className="h-5 w-40" />
              {range(2).map((j) => (
                <div key={j} className="flex gap-3">
                  <Bone className="size-10 rounded-lg" />
                  <div className="flex flex-1 flex-col gap-2">
                    <Bone className="h-4 w-1/2" />
                    <Bone className="h-3 w-2/3" />
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-3 rounded-[20px] border border-glass-border bg-white/[0.04] p-6">
            <Bone className="h-5 w-24" />
            <div className="flex flex-wrap gap-2">
              {range(8).map((i) => (
                <Bone key={i} className="h-7 w-16 rounded-full" />
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-4 rounded-[20px] border border-glass-border bg-white/[0.04] p-6">
            <Bone className="h-5 w-28" />
            <Bone className="h-3 w-full" />
            <Bone className="h-3 w-4/5" />
          </div>
        </div>
      </div>
    </div>
  );
}
