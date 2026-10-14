import { cn } from "@/components/ui/utils";

interface GoalSetupBannerProps {
  onSetGoal?: () => void;
  className?: string;
}

/** Owner-only nudge used on profile and the jobs browse header. */
export function GoalSetupBanner({ onSetGoal, className }: GoalSetupBannerProps) {
  return (
    <div
      className={cn(
        "flex w-full flex-wrap items-center gap-2 rounded-2xl border border-glass-border bg-white/[0.04] px-4 py-4 sm:rounded-[20px] sm:px-6 sm:py-5",
        className,
      )}
    >
      <p className="flex-1 text-[13px] text-white/50 sm:text-sm">Define your career goal and let Qelsa match you with opportunities aligned with your ambitions.</p>
      <button type="button" onClick={onSetGoal} className="shrink-0 font-semibold text-neon-cyan transition-opacity hover:opacity-80">
        Set goal →
      </button>
    </div>
  );
}
