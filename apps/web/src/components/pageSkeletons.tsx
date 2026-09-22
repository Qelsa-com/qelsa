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
    <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0c0d18]/90">
      {/* Banner */}
      <Bone className="h-24 sm:h-28 w-full rounded-none" />
      {/* Body */}
      <div className="px-5 pb-5">
        <div className="-mt-8 mb-3 flex items-end justify-between">
          <Bone className="size-16 rounded-xl border-2 border-[#0c0d18]" />
          <Bone className="h-6 w-20 rounded-full" />
        </div>
        <Bone className="h-5 w-44 rounded-md mb-2" />
        <Bone className="h-3.5 w-64 max-w-full rounded-md mb-4" />
        <div className="flex gap-2 mb-4">
          <Bone className="h-5 w-20 rounded-full" />
          <Bone className="h-5 w-24 rounded-full" />
        </div>
        <div className="border-t border-white/[0.06] pt-3.5 flex items-center justify-between">
          <Bone className="h-4 w-24 rounded-md" />
          <Bone className="h-8 w-24 rounded-lg" />
        </div>
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

/** Company / community page: hero with circular avatar, identity cluster, tabs, and 2-column cards. */
export function CompanyPageSkeleton() {
  return (
    <div className="min-h-screen pb-16" role="status" aria-label="Loading page">
      <span className="sr-only">Loading page details</span>
      {/* Hero Header matching CompanyPage */}
      <div className="relative border-b border-white/[0.08] pb-0 pt-10">
        <div className="pointer-events-none absolute -top-24 left-1/2 h-[340px] w-[640px] -translate-x-1/2 rounded-full bg-neon-cyan/[0.06] blur-[120px]" />
        <div className="relative mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
            {/* Identity Cluster */}
            <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start text-center sm:text-left">
              {/* Circular Logo (136px) */}
              <Bone className="size-32 sm:size-36 shrink-0 rounded-full" />
              {/* Title, Tagline, Location, Stats */}
              <div className="flex flex-col items-center sm:items-start gap-2.5">
                <Bone className="h-8 sm:h-9 w-52 sm:w-64 rounded-xl" />
                <Bone className="h-4 w-72 sm:w-80 max-w-full rounded-md" />
                <Bone className="h-4 w-36 rounded-md" />
                <div className="mt-2 flex items-center gap-3">
                  <Bone className="h-6 w-32 rounded-full" />
                  <Bone className="h-6 w-24 rounded-full" />
                </div>
              </div>
            </div>
            {/* Action buttons */}
            <div className="flex items-center justify-center sm:justify-end gap-3 shrink-0">
              <Bone className="h-10 w-32 rounded-full" />
              <Bone className="h-10 w-28 rounded-full" />
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="mt-8 flex gap-8 border-b border-white/[0.08] pb-3">
            <Bone className="h-5 w-20 rounded-md" />
            <Bone className="h-5 w-16 rounded-md" />
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 pt-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column (2 Cols) */}
          <div className="lg:col-span-2 space-y-6">
            {/* About Card */}
            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-7 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-4">
                <Bone className="h-6 w-44 rounded-lg" />
                <Bone className="h-7 w-16 rounded-lg" />
              </div>
              <div className="space-y-2.5">
                <Bone className="h-4 w-full rounded-md" />
                <Bone className="h-4 w-5/6 rounded-md" />
                <Bone className="h-4 w-3/4 rounded-md" />
              </div>
              <div className="mt-6 flex flex-wrap gap-2">
                <Bone className="h-7 w-24 rounded-full" />
                <Bone className="h-7 w-28 rounded-full" />
                <Bone className="h-7 w-20 rounded-full" />
                <Bone className="h-7 w-32 rounded-full" />
              </div>
            </div>

            {/* Company Culture Card */}
            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-7 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-4">
                <Bone className="h-6 w-36 rounded-lg" />
                <Bone className="h-7 w-16 rounded-lg" />
              </div>
              <Bone className="h-4 w-4/5 rounded-md mb-5" />
              <div className="flex flex-wrap gap-2.5">
                <Bone className="h-8 w-36 rounded-full" />
                <Bone className="h-8 w-44 rounded-full" />
                <Bone className="h-8 w-32 rounded-full" />
              </div>
            </div>
          </div>

          {/* Right Rail (1 Col) */}
          <div className="space-y-6">
            {/* Company Details Card */}
            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-5">
                <Bone className="h-5 w-32 rounded-lg" />
                <Bone className="h-6 w-14 rounded-lg" />
              </div>
              <div className="divide-y divide-white/[0.06]">
                <div className="pb-3.5"><Bone className="h-3 w-16 rounded mb-1.5" /><Bone className="h-4 w-32 rounded" /></div>
                <div className="py-3.5"><Bone className="h-3 w-16 rounded mb-1.5" /><Bone className="h-4 w-28 rounded" /></div>
                <div className="py-3.5"><Bone className="h-3 w-16 rounded mb-1.5" /><Bone className="h-4 w-24 rounded" /></div>
                <div className="py-3.5"><Bone className="h-3 w-16 rounded mb-1.5" /><Bone className="h-4 w-36 rounded" /></div>
                <div className="pt-3.5"><Bone className="h-3 w-16 rounded mb-1.5" /><Bone className="h-4 w-20 rounded" /></div>
              </div>
            </div>

            {/* Open Positions Card */}
            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6 backdrop-blur-sm">
              <Bone className="size-10 rounded-xl mb-3" />
              <Bone className="h-5 w-36 rounded-md mb-2" />
              <Bone className="h-3 w-48 rounded mb-4" />
              <Bone className="h-10 w-full rounded-xl" />
            </div>
          </div>
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
