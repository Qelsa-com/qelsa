"use client";

import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useGetFeatureFlagsQuery,
  useUpdateFeatureFlagMutation,
  type AdminFeatureFlag,
} from "@/features/api/adminApi";
import { toast } from "sonner";

const FLAG_COPY: Record<string, { label: string; description: string }> = {
  smart_matches: {
    label: "Smart Matches",
    description:
      "Shows the Smart Matches tab and route in the candidate jobs experience. Keep this off until the feature is ready.",
  },
};

function FlagCard({ flag }: { flag: AdminFeatureFlag }) {
  const [updateFlag, { isLoading }] = useUpdateFeatureFlagMutation();
  const copy = FLAG_COPY[flag.key] ?? {
    label: flag.key,
    description: "Candidate-facing feature switch.",
  };

  const onToggle = async () => {
    try {
      await updateFlag({ key: flag.key, enabled: !flag.enabled });
      toast.success(`${copy.label} ${flag.enabled ? "disabled" : "enabled"}.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update the flag.");
    }
  };

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold text-foreground">{copy.label}</h2>
          <span
            className={`rounded-md px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${
              flag.enabled
                ? "bg-emerald-500/15 text-emerald-400"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {flag.enabled ? "Enabled" : "Disabled"}
          </span>
        </div>
        <p className="mt-1 max-w-2xl text-xs leading-relaxed text-muted-foreground">
          {copy.description}
        </p>
      </div>
      <Button
        type="button"
        variant={flag.enabled ? "outline" : "default"}
        onClick={() => void onToggle()}
        disabled={isLoading}
        className="shrink-0"
      >
        {isLoading ? "Saving…" : flag.enabled ? "Disable" : "Enable"}
      </Button>
    </div>
  );
}

export default function FeaturesPage() {
  const { data, isLoading } = useGetFeatureFlagsQuery();
  const flags = data?.flags ?? [];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Feature flags"
        description="Control candidate-facing features without a deploy."
      />
      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-24 w-full rounded-xl" />
          <Skeleton className="h-24 w-full rounded-xl" />
        </div>
      ) : (
        <div className="space-y-3">
          {flags.map((flag) => (
            <FlagCard key={flag.key} flag={flag} />
          ))}
        </div>
      )}
    </div>
  );
}
