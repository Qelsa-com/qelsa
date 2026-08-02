import { ReactNode } from "react";
import { cn } from "../ui/utils";

interface ProfileCardProps {
  title: string;
  /** Owner-only affordances — omitted entirely on someone else's profile. */
  onAdd?: () => void;
  onEdit?: () => void;
  className?: string;
  children: ReactNode;
}

/** Glass card shell shared by every section of the profile screens. */
export function ProfileCard({ title, onAdd, onEdit, className, children }: ProfileCardProps) {
  return (
    <section className={cn("w-full rounded-[16px] border border-white/12 bg-white/4 p-6 shadow-[0_4px_16px_rgba(0,0,0,0.25)]", className)}>
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-lg font-semibold text-white">{title}</h2>

        {(onAdd || onEdit) && (
          <div className="flex shrink-0 items-center gap-3">
            {onAdd && (
              <button type="button" onClick={onAdd} className="flex items-center gap-1 font-medium text-neon-cyan transition-opacity hover:opacity-80">
                <span className="text-sm leading-none">+</span>
                <span className="text-xs">Add</span>
              </button>
            )}
            {onEdit && (
              <button type="button" onClick={onEdit} className="rounded-full bg-neon-cyan/6 px-3 py-1 text-xs font-medium text-neon-cyan transition-colors hover:bg-neon-cyan/15">
                Edit
              </button>
            )}
          </div>
        )}
      </div>

      <div className="mt-5">{children}</div>
    </section>
  );
}

/** Hairline used between repeated entries inside a card. */
export function ProfileCardDivider() {
  return <div className="h-px w-full bg-white/8" />;
}

/** Shown in place of a card's body when the section has nothing in it yet. */
export function ProfileCardEmpty({ message }: { message: string }) {
  return <p className="text-sm text-white/45">{message}</p>;
}

/** Rounded pill used for skills, interests and certification tags. */
export function ProfileTag({ children, size = "md" }: { children: ReactNode; size?: "sm" | "md" }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border border-white/12 bg-white/10 font-medium text-white/70",
        size === "sm" ? "px-2 py-[3px] text-[11px]" : "px-2.5 py-1 text-xs"
      )}
    >
      {children}
    </span>
  );
}

/** "+2" counter that follows a truncated list of tags. */
export function ProfileOverflowTag({ count }: { count: number }) {
  return <span className="inline-flex items-center rounded-full bg-neon-cyan/6 px-2 py-[3px] text-[11px] font-medium text-neon-cyan">+{count}</span>;
}
