"use client";

import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { usePlatformSummaryQuery, useRebuildStatsMutation } from "@/features/api/adminApi";
import { Briefcase, RefreshCw, ShieldCheck, UserCheck, UserPlus, Users } from "lucide-react";
import { toast } from "sonner";

function StatCard({
  label,
  value,
  icon: Icon,
  tone = "default",
  hint,
}: {
  label: string;
  value: number;
  icon: typeof Users;
  tone?: "default" | "warning" | "accent";
  hint?: string;
}) {
  const toneClass =
    tone === "warning"
      ? "bg-amber-500/15 text-amber-400"
      : tone === "accent"
        ? "bg-neon-purple/20 text-neon-purple"
        : "bg-white/10 text-white";

  return (
    <div className="rounded-2xl border border-glass-border glass p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            {label}
          </p>
          <p className="mt-2 text-3xl font-bold tabular-nums">{value.toLocaleString()}</p>
          {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
        </div>
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${toneClass}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

function timeAgo(timestamp: number) {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(timestamp).toLocaleDateString();
}

export default function DashboardPage() {
  const { data, isLoading } = usePlatformSummaryQuery();
  const [rebuildStats, { isLoading: isRebuilding }] = useRebuildStatsMutation();

  const handleRebuild = async () => {
    try {
      await rebuildStats({}).unwrap();
      toast.success("Recalculating platform counters in the background.");
    } catch {
      toast.error("Could not start the counter rebuild.");
    }
  };

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Platform totals and recent admin activity."
        actions={
          <Button
            variant="outline"
            onClick={() => void handleRebuild()}
            disabled={isRebuilding}
            className="rounded-full border-glass-border bg-transparent text-white hover:bg-white/5"
          >
            <RefreshCw className={`h-4 w-4 ${isRebuilding ? "animate-spin" : ""}`} />
            {isRebuilding ? "Recalculating…" : "Recalculate counters"}
          </Button>
        }
      />

      <div className="px-5 py-6 md:px-8">
        {isLoading && !data ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[0, 1, 2, 3, 4, 5, 6, 7].map((key) => (
              <Skeleton key={key} className="h-[104px] rounded-2xl" />
            ))}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Total users" value={data?.users ?? 0} icon={Users} />
            <StatCard
              label="Candidates"
              value={data?.seekers ?? 0}
              icon={UserCheck}
              hint={`${data?.recruiters ?? 0} recruiters`}
            />
            <StatCard
              label="Admins"
              value={data?.admins ?? 0}
              icon={ShieldCheck}
              tone="accent"
              hint={`${data?.inactiveUsers ?? 0} suspended`}
            />
            <StatCard label="Jobs" value={data?.jobs ?? 0} icon={Briefcase} hint={`${data?.openJobs ?? 0} open`} />
          </div>
        )}

        <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Applications"
            value={data?.applications ?? 0}
            icon={UserPlus}
            tone="accent"
          />
          <StatCard
            label="Public boards"
            value={data?.publicBoards ?? 0}
            icon={Briefcase}
            hint="ATS boards in the global feed"
          />
          <StatCard
            label="Suspended users"
            value={data?.inactiveUsers ?? 0}
            icon={UserCheck}
            tone="warning"
          />
          <StatCard label="Recruiters" value={data?.recruiters ?? 0} icon={Users} />
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <section className="rounded-2xl border border-glass-border glass p-5">
            <h2 className="text-sm font-semibold">Recent signups</h2>
            <p className="mt-1 text-xs text-muted-foreground">The five newest accounts.</p>
            <ul className="mt-4 space-y-2">
              {(data?.recentSignups ?? []).map((signup) => (
                <li
                  key={signup.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-glass-border/60 px-3 py-2.5"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{signup.name ?? "Unnamed"}</p>
                    <p className="truncate text-xs text-muted-foreground">{signup.email}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-[11px] font-medium text-muted-foreground">
                      {signup.role === "admin" ? "Admin" : (signup.account_type ?? "—")}
                    </p>
                    <p className="text-[11px] text-muted-foreground">{timeAgo(signup.created_at)}</p>
                  </div>
                </li>
              ))}
              {!data?.recentSignups?.length && (
                <li className="rounded-xl border border-dashed border-glass-border px-3 py-6 text-center text-xs text-muted-foreground">
                  No signups yet.
                </li>
              )}
            </ul>
          </section>

          <section className="rounded-2xl border border-glass-border glass p-5">
            <h2 className="text-sm font-semibold">Recent admin activity</h2>
            <p className="mt-1 text-xs text-muted-foreground">The last ten privileged actions.</p>
            <ul className="mt-4 space-y-2">
              {(data?.recentAudit ?? []).map((entry) => (
                <li
                  key={entry.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-glass-border/60 px-3 py-2.5"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{entry.action}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {entry.admin_email ?? "unknown"}
                    </p>
                  </div>
                  <p className="shrink-0 text-[11px] text-muted-foreground">
                    {timeAgo(entry.created_at)}
                  </p>
                </li>
              ))}
              {!data?.recentAudit?.length && (
                <li className="rounded-xl border border-dashed border-glass-border px-3 py-6 text-center text-xs text-muted-foreground">
                  No admin actions recorded yet.
                </li>
              )}
            </ul>
          </section>
        </div>
      </div>
    </>
  );
}