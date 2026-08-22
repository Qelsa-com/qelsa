import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/components/ui/utils";

function Bone({ className }: { className?: string }) {
  return <Skeleton className={cn("bg-white/[0.08]", className)} />;
}

/** Mirrors `IntegrationCard` on the ATS integrations grid. */
export function IntegrationCardSkeleton() {
  return (
    <div className="flex flex-col rounded-2xl border border-glass-border glass p-5">
      <div className="mb-4 flex items-start justify-between">
        <Bone className="size-11 rounded-xl" />
        <Bone className="h-5 w-[88px] rounded-md" />
      </div>
      <Bone className="h-5 w-36" />
      <div className="mt-2 flex flex-1 flex-col gap-1.5">
        <Bone className="h-3.5 w-full" />
        <Bone className="h-3.5 w-5/6" />
      </div>
      <div className="mt-5 flex items-center justify-between border-t border-glass-border pt-4">
        <Bone className="h-3 w-24" />
        <Bone className="h-8 w-[84px] rounded-full" />
      </div>
    </div>
  );
}

/** Mirrors a public-board row in the admin section. */
export function PublicBoardRowSkeleton() {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-glass-border glass px-5 py-4">
      <Bone className="size-10 shrink-0 rounded-xl" />
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <Bone className="h-4 w-24" />
          <Bone className="h-3.5 w-28" />
          <Bone className="h-5 w-12 rounded-md" />
        </div>
        <Bone className="h-3 w-44" />
      </div>
      <Bone className="h-8 w-[84px] shrink-0 rounded-full" />
    </div>
  );
}
