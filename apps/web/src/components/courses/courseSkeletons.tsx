import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/components/ui/utils";

function Bone({ className }: { className?: string }) {
  return <Skeleton className={cn("bg-white/[0.08]", className)} />;
}

function range(count: number) {
  return Array.from({ length: count }, (_, i) => i);
}

/** Mirrors a practice track card on the Learn & Practice listing. */
export function PracticeTrackCardSkeleton() {
  return (
    <div className="flex flex-col rounded-[24px] border border-white/[0.09] bg-[#0b0b16] p-5">
      <div className="flex items-start justify-between gap-3">
        <Bone className="size-11 shrink-0 rounded-xl" />
        <Bone className="h-6 w-16 rounded-lg" />
      </div>
      <Bone className="mt-5 h-5 w-[82%]" />
      <Bone className="mt-2 h-3.5 w-24" />
      <Bone className="mt-3 h-3.5 w-full" />
      <Bone className="mt-2 h-3.5 w-5/6" />
      <div className="mt-4 flex flex-wrap gap-1.5">
        {range(3).map((i) => (
          <Bone key={i} className={cn("h-5 rounded-md", ["w-16", "w-20", "w-14"][i])} />
        ))}
      </div>
      <div className="mt-auto flex items-center justify-between gap-3 border-t border-white/[0.07] pt-4">
        <Bone className="h-4 w-24" />
        <Bone className="h-3.5 w-14" />
      </div>
    </div>
  );
}

/** Mirrors an external course card on the Learn & Practice listing. */
export function ExternalCourseCardSkeleton() {
  return (
    <div className="flex flex-col rounded-[24px] border border-white/[0.09] bg-[#0b0b16] p-5">
      <div className="flex items-start justify-between gap-3">
        <Bone className="size-11 shrink-0 rounded-xl" />
        <Bone className="size-4 rounded" />
      </div>
      <Bone className="mt-5 h-5 w-[90%]" />
      <Bone className="mt-2 h-3.5 w-1/2" />
      <Bone className="mt-3 h-3.5 w-full" />
      <Bone className="mt-2 h-3.5 w-4/5" />
      <div className="mt-4 flex flex-wrap gap-1.5">
        {range(3).map((i) => (
          <Bone key={i} className={cn("h-5 rounded-md", ["w-14", "w-16", "w-20"][i])} />
        ))}
      </div>
      <div className="mt-auto flex items-center justify-between gap-3 pt-5">
        <Bone className="h-3 w-12" />
        <Bone className="h-3 w-24" />
      </div>
    </div>
  );
}

export function PracticeTracksSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div role="status" aria-label="Loading practice tracks">
      <span className="sr-only">Loading practice tracks</span>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {range(count).map((i) => (
          <PracticeTrackCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

export function ExternalCoursesSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div role="status" aria-label="Loading courses">
      <span className="sr-only">Loading courses</span>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {range(count).map((i) => (
          <ExternalCourseCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

/** Mirrors the current interview-track detail page while its query resolves. */
export function InterviewTrackDetailSkeleton() {
  return (
    <main className="min-h-screen text-white" role="status" aria-label="Loading interview track">
      <span className="sr-only">Loading interview track</span>
      <div className="mx-auto w-full max-w-7xl px-5 py-8 sm:px-8 lg:py-12">
        <Bone className="h-3.5 w-28" />

        <div className="mt-5 rounded-[24px] border border-white/[0.09] bg-[#0b0b16] p-5 sm:p-7">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
            <div>
              <div className="flex items-start gap-3">
                <Bone className="size-12 shrink-0 rounded-xl" />
                <div className="flex flex-col gap-2 pt-0.5">
                  <Bone className="h-4 w-28" />
                  <Bone className="h-2.5 w-48" />
                </div>
              </div>

              <Bone className="mt-5 h-8 w-4/5 max-w-xl rounded-lg sm:h-9 lg:h-11" />
              <Bone className="mt-3 h-3.5 w-full max-w-2xl" />
              <Bone className="mt-2 h-3.5 w-3/4 max-w-xl" />

              <div className="mt-4 flex flex-wrap items-center gap-4">
                <Bone className="h-3.5 w-24" />
                <Bone className="h-3.5 w-20" />
                <Bone className="h-3.5 w-24" />
              </div>

              <div className="mt-5 flex flex-wrap gap-1.5">
                {range(7).map((i) => (
                  <Bone key={i} className={cn("h-6 rounded-md", ["w-16", "w-20", "w-14", "w-24", "w-16", "w-20", "w-14"][i])} />
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-white/[0.1] bg-white/[0.025] p-5">
              <Bone className="h-5 w-32" />
              <Bone className="mt-3 h-3 w-full" />
              <Bone className="mt-2 h-3 w-11/12" />
              <Bone className="mt-4 h-11 w-full rounded-full" />
            </div>
          </div>
        </div>

        <div className="mt-7 flex gap-7 border-b border-white/[0.08] pb-3">
          <Bone className="h-4 w-20" />
          <Bone className="h-4 w-20" />
        </div>

        <div className="mt-5 space-y-3">
          <div className="rounded-[18px] border border-white/[0.08] bg-white/[0.025] p-4 sm:p-5">
            <div className="flex items-start gap-3">
              <Bone className="mt-0.5 size-7 shrink-0 rounded-lg" />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Bone className="h-4 w-16 rounded-md" />
                  <Bone className="h-3 w-14" />
                </div>
                <Bone className="mt-2.5 h-4 w-4/5" />
              </div>
              <Bone className="mt-1 size-4 shrink-0 rounded" />
            </div>
            <div className="mt-4 border-t border-white/[0.07] pt-4 sm:pl-[68px]">
              <Bone className="h-3 w-full" />
              <Bone className="mt-2 h-3 w-11/12" />
              <Bone className="mt-2 h-3 w-4/5" />
              <div className="mt-5 rounded-xl border border-emerald-400/15 bg-emerald-400/[0.04] p-3.5">
                <Bone className="h-2.5 w-20" />
                <Bone className="mt-3 h-3 w-5/6" />
                <Bone className="mt-2 h-3 w-3/4" />
              </div>
            </div>
          </div>

          {range(3).map((i) => (
            <div key={i} className="flex items-start gap-3 rounded-[18px] border border-white/[0.08] bg-white/[0.025] p-4 sm:p-5">
              <Bone className="mt-0.5 size-7 shrink-0 rounded-lg" />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Bone className="h-4 w-16 rounded-md" />
                  <Bone className="h-3 w-14" />
                </div>
                <Bone className="mt-2.5 h-4 w-3/4" />
              </div>
              <Bone className="mt-1 size-4 shrink-0 rounded" />
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
