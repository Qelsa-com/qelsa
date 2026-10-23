"use client";

import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  useGetPlanConfigsQuery,
  useUpdatePlanConfigMutation,
  type AdminPlanAudience,
  type AdminPlanConfig,
  type AdminPlanTier,
} from "@/features/api/adminApi";
import { toast } from "sonner";
import { useState } from "react";

const PLAN_LABELS: Record<AdminPlanTier, string> = {
  free: "Free",
  plus: "Plus",
  pro: "Pro",
};

const AUDIENCES: Array<{
  id: AdminPlanAudience;
  title: string;
  description: string;
}> = [
  {
    id: "candidate",
    title: "Candidates",
    description: "Application caps and Agent time for job seekers.",
  },
  {
    id: "employer",
    title: "Employers",
    description: "Agent time and benefits shown to hiring teams.",
  },
];

const TOKEN_HELP =
  "Use {{agent_benefit}}, {{agent_limit}}, {{application_benefit}}, and {{application_limit}} in benefit lines to insert the live limits.";

function PlanConfigCard({ config }: { config: AdminPlanConfig }) {
  const [updateConfig, { isLoading }] = useUpdatePlanConfigMutation();
  const [agentLimit, setAgentLimit] = useState(String(config.agent_daily_limit));
  const [applicationLimit, setApplicationLimit] = useState(
    config.application_limit === null ? "" : String(config.application_limit),
  );
  const [description, setDescription] = useState(config.description);
  const [features, setFeatures] = useState(config.features.join("\n"));
  const [error, setError] = useState<string | null>(null);

  const isFree = config.plan === "free";

  const handleSave = async () => {
    const parsedAgentLimit = Number(agentLimit);
    if (!Number.isInteger(parsedAgentLimit) || parsedAgentLimit < 0) {
      setError("Agent messages per day must be a whole number of 0 or more.");
      return;
    }

    let parsedApplicationLimit: number | null = null;
    if (config.audience === "candidate" && applicationLimit.trim()) {
      parsedApplicationLimit = Number(applicationLimit);
      if (!Number.isInteger(parsedApplicationLimit) || parsedApplicationLimit < 0) {
        setError("Applications must be blank (unlimited) or a whole number of 0 or more.");
        return;
      }
    }

    setError(null);
    try {
      await updateConfig({
        audience: config.audience,
        plan: config.plan,
        agentDailyLimit: parsedAgentLimit,
        applicationLimit: parsedApplicationLimit,
        description,
        features: features.split("\n").map((line) => line.trim()).filter(Boolean),
      }).unwrap();
      toast.success(`${AUDIENCES.find((item) => item.id === config.audience)?.title} ${PLAN_LABELS[config.plan]} plan saved.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save this plan.");
    }
  };

  return (
    <section className="rounded-2xl border border-glass-border glass p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-white">{PLAN_LABELS[config.plan]}</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {config.updated_at ? "Custom settings" : "Using defaults"}
          </p>
        </div>
        <Button
          type="button"
          size="sm"
          onClick={() => void handleSave()}
          disabled={isLoading}
          className="rounded-full"
        >
          {isLoading ? "Saving…" : "Save"}
        </Button>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor={`${config.audience}-${config.plan}-agent`}>Agent messages / day</Label>
          <Input
            id={`${config.audience}-${config.plan}-agent`}
            type="number"
            min={0}
            step={1}
            value={agentLimit}
            onChange={(event) => setAgentLimit(event.target.value)}
          />
        </div>

        {config.audience === "candidate" ? (
          <div className="space-y-2">
            <Label htmlFor={`${config.audience}-${config.plan}-applications`}>Active applications</Label>
            <Input
              id={`${config.audience}-${config.plan}-applications`}
              type="number"
              min={0}
              step={1}
              placeholder="Unlimited"
              value={applicationLimit}
              onChange={(event) => setApplicationLimit(event.target.value)}
            />
            <p className="text-[11px] text-muted-foreground">Leave blank for unlimited.</p>
          </div>
        ) : null}
      </div>

      {!isFree ? (
        <div className="mt-4 space-y-4">
          <div className="space-y-2">
            <Label htmlFor={`${config.audience}-${config.plan}-description`}>Description</Label>
            <Input
              id={`${config.audience}-${config.plan}-description`}
              value={description}
              maxLength={240}
              onChange={(event) => setDescription(event.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor={`${config.audience}-${config.plan}-features`}>Benefits</Label>
            <Textarea
              id={`${config.audience}-${config.plan}-features`}
              value={features}
              rows={6}
              onChange={(event) => setFeatures(event.target.value)}
            />
            <p className="text-[11px] leading-relaxed text-muted-foreground">
              One benefit per line.
            </p>
          </div>
        </div>
      ) : null}

      {error ? <p className="mt-3 text-xs text-rose-400">{error}</p> : null}
    </section>
  );
}

export default function PlansPage() {
  const { data, isLoading } = useGetPlanConfigsQuery();
  const configs = data?.configs ?? [];

  return (
    <>
      <PageHeader
        title="Plans & limits"
        description="Change candidate and employer plan limits and the benefits shown on pricing."
      />

      <div className="space-y-10 px-5 py-6 md:px-8">
        <p className="rounded-xl border border-glass-border bg-white/[0.03] px-4 py-3 text-xs leading-relaxed text-muted-foreground">
          {TOKEN_HELP}
        </p>
        {isLoading ? (
          <div className="grid gap-4 lg:grid-cols-3">
            {[0, 1, 2].map((key) => (
              <Skeleton key={key} className="h-80 w-full rounded-2xl" />
            ))}
          </div>
        ) : (
          AUDIENCES.map((audience) => (
            <section key={audience.id}>
              <div>
                <h2 className="text-lg font-semibold text-white">{audience.title}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{audience.description}</p>
              </div>
              <div className="mt-4 grid gap-4 lg:grid-cols-3">
                {(["free", "plus", "pro"] as const).map((plan) => {
                  const config = configs.find(
                    (item) => item.audience === audience.id && item.plan === plan,
                  );
                  if (!config) return null;
                  return (
                    <PlanConfigCard
                      key={`${config.audience}-${config.plan}-${config.updated_at ?? "default"}`}
                      config={config}
                    />
                  );
                })}
              </div>
            </section>
          ))
        )}
      </div>
    </>
  );
}
