interface ProfileCompletionBarProps {
  /** 0–100. */
  percent: number;
  onComplete?: () => void;
}

/** Owner-only nudge that sits between the hero and the section grid. */
export function ProfileCompletionBar({ percent, onComplete }: ProfileCompletionBarProps) {
  const clamped = Math.min(100, Math.max(0, Math.round(percent)));

  return (
    <div className="mx-auto flex w-full max-w-[1280px] flex-col gap-2.5 px-6 pb-3 pt-5 md:px-12 lg:px-20">
      <div className="flex flex-wrap items-center gap-2 text-[13px]">
        <p className="flex-1 text-white/50">Your profile is {clamped}% complete — add more details to unlock better job matches</p>
        <button type="button" onClick={onComplete} className="shrink-0 font-semibold text-neon-cyan transition-opacity hover:opacity-80">
          Complete Profile →
        </button>
      </div>
      <div className="h-1 w-full overflow-hidden rounded-[2px] bg-white/6">
        <div className="h-full rounded-[2px] bg-gradient-to-r from-[#7c2ff3] to-neon-cyan transition-[width] duration-500" style={{ width: `${clamped}%` }} />
      </div>
    </div>
  );
}
