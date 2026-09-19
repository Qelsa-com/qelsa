import { Briefcase, ShieldCheck, User } from "lucide-react";

export const HIRING_ROLE_LABELS: Record<string, string> = {
  founder_cxo: "Founder / CXO",
  hr_ta: "HR / Talent Acquisition",
  hiring_manager: "Hiring Manager",
  recruitment_agency: "Recruitment Agency",
};

export function formatHiringRole(role?: string | null): string {
  if (!role) return "";
  return HIRING_ROLE_LABELS[role] || role.replace(/_/g, " ");
}

export interface AccountBadgeProps {
  accountType?: "seeker" | "recruiter" | null;
  role?: string | null;
  hiringRole?: string | null;
  size?: "sm" | "md" | "lg";
  showRoleDetail?: boolean;
  className?: string;
}

export function AccountBadge({
  accountType,
  role,
  hiringRole,
  size = "sm",
  showRoleDetail = false,
  className = "",
}: AccountBadgeProps) {
  // If explicitly rendering an admin badge
  if (role === "admin") {
    const sizeClasses =
      size === "lg"
        ? "px-3 py-1 text-xs gap-1.5"
        : size === "md"
        ? "px-2.5 py-0.5 text-xs gap-1.5"
        : "px-2 py-0.5 text-[11px] gap-1";
    const iconSize = size === "lg" ? "size-3.5" : "size-3";

    return (
      <span
        className={`inline-flex items-center rounded-full border border-amber-400/40 bg-amber-400/10 font-semibold text-amber-300 uppercase tracking-wider ${sizeClasses} ${className}`}
      >
        <ShieldCheck className={iconSize} />
        <span>Admin</span>
      </span>
    );
  }

  if (!accountType) return null;

  const isRecruiter = accountType === "recruiter";

  const sizeClasses =
    size === "lg"
      ? "px-3 py-1.5 text-sm gap-2"
      : size === "md"
      ? "px-2.5 py-1 text-xs gap-1.5"
      : "px-2 py-0.5 text-[11px] gap-1";

  const iconSize = size === "lg" ? "size-4" : size === "md" ? "size-3.5" : "size-3";

  if (isRecruiter) {
    const detailLabel = formatHiringRole(hiringRole);
    const label = showRoleDetail && detailLabel ? `Hiring Partner • ${detailLabel}` : "Hiring Partner";

    return (
      <span
        title={detailLabel ? `Hiring Partner (${detailLabel})` : "Hiring Partner"}
        className={`inline-flex items-center rounded-full border border-[#d73e9d]/40 bg-[#d73e9d]/10 font-semibold text-[#f27bb8] ${sizeClasses} ${className}`}
      >
        <Briefcase className={`${iconSize} shrink-0 text-[#f27bb8]`} />
        <span className="truncate">{label}</span>
      </span>
    );
  }

  return (
    <span
      title="Candidate / Job Seeker"
      className={`inline-flex items-center rounded-full border border-neon-cyan/40 bg-neon-cyan/10 font-semibold text-neon-cyan ${sizeClasses} ${className}`}
    >
      <User className={`${iconSize} shrink-0 text-neon-cyan`} />
      <span className="truncate">Candidate</span>
    </span>
  );
}
