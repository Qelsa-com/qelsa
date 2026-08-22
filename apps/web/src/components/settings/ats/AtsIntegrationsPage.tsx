"use client";

import { useListAtsIntegrationsQuery } from "@/features/api/atsIntegrationsApi";
import { useGetProfileQuery } from "@/features/api/authApi";
import Link from "next/link";
import { useState } from "react";
import { Button } from "../../ui/button";
import { ATS_PROVIDERS, relativeTime, type AtsIntegration, type AtsProviderMeta } from "./catalog";
import { ApiKeyConnectDialog, BoardConnectDialog, ConnectionSuccessDialog, DisconnectDialog, ErrorIntegrationDialog, ManageIntegrationDialog, OAuthConnectDialog, ReconnectApiKeyDialog, RequestAccessDialog } from "./IntegrationDialogs";
import { IntegrationCardSkeleton } from "./atsSkeletons";
import { PublicBoardsSection } from "./PublicBoardsSection";

type DialogState =
  | { kind: "connect"; provider: AtsProviderMeta }
  | { kind: "request"; provider: AtsProviderMeta }
  | { kind: "manage"; provider: AtsProviderMeta; integration: AtsIntegration }
  | { kind: "error"; provider: AtsProviderMeta; integration: AtsIntegration }
  | { kind: "disconnect"; provider: AtsProviderMeta; integration: AtsIntegration }
  | { kind: "reconnectKey"; provider: AtsProviderMeta; integration: AtsIntegration }
  | { kind: "success"; provider: AtsProviderMeta }
  | null;

const gradientButton = "rounded-full bg-gradient-to-r from-neon-purple to-neon-pink px-5 text-white hover:opacity-90";

function StatusBadge({ integration }: { integration?: AtsIntegration }) {
  const status = integration?.status;
  if (status === "connected") return <span className="rounded-md bg-emerald-500/15 px-2 py-0.5 text-[11px] font-semibold tracking-wide text-emerald-400 uppercase">Connected</span>;
  if (status === "error") return <span className="rounded-md bg-destructive/15 px-2 py-0.5 text-[11px] font-semibold tracking-wide text-rose-400 uppercase">Error</span>;
  if (status === "pending") return <span className="rounded-md bg-amber-500/15 px-2 py-0.5 text-[11px] font-semibold tracking-wide text-amber-400 uppercase">Pending</span>;
  return <span className="rounded-md bg-white/10 px-2 py-0.5 text-[11px] font-semibold tracking-wide text-white/50 uppercase">Not connected</span>;
}

function IntegrationCard({ provider, integration, onAction }: { provider: AtsProviderMeta; integration?: AtsIntegration; onAction: (state: DialogState) => void }) {
  const status = integration?.status;

  let footerText: React.ReactNode = "Not integrated";
  let action: React.ReactNode = null;

  if (status === "connected" && integration) {
    footerText = `Last synced ${relativeTime(integration.last_synced_at)}`;
    action = (
      <Button variant="outline" size="sm" className="rounded-full border-glass-border bg-transparent px-5 text-white hover:bg-white/5" onClick={() => onAction({ kind: "manage", provider, integration })}>
        Manage
      </Button>
    );
  } else if (status === "error" && integration) {
    footerText = <span className="text-rose-400">{integration.error_message ?? "Token expired"}</span>;
    action = (
      <Button variant="outline" size="sm" className="rounded-full border-destructive/50 bg-transparent px-5 text-rose-400 hover:bg-destructive/10" onClick={() => onAction({ kind: "error", provider, integration })}>
        Reconnect
      </Button>
    );
  } else if (status === "pending") {
    footerText = <span className="text-amber-400/80">Awaiting approval</span>;
    action = (
      <Button variant="outline" size="sm" disabled className="rounded-full border-amber-500/40 bg-transparent px-5 text-amber-400">
        Requested
      </Button>
    );
  } else if (provider.authType === "gated") {
    footerText = "Vendor approval required";
    action = (
      <Button variant="outline" size="sm" className="rounded-full border-glass-border bg-transparent px-5 text-white/70 hover:bg-white/5" onClick={() => onAction({ kind: "request", provider })}>
        Request Access
      </Button>
    );
  } else {
    action = (
      <Button size="sm" className={gradientButton} onClick={() => onAction({ kind: "connect", provider })}>
        Connect
      </Button>
    );
  }

  return (
    <div className="flex flex-col rounded-2xl border border-glass-border glass p-5">
      <div className="mb-4 flex items-start justify-between">
        <div className={`flex h-11 w-11 items-center justify-center rounded-xl text-lg font-bold ${provider.tileClass}`}>{provider.initials}</div>
        <StatusBadge integration={integration} />
      </div>
      <h3 className="text-base font-semibold text-white">{provider.name}</h3>
      <p className="mt-1.5 flex-1 text-sm leading-relaxed text-muted-foreground">{provider.description}</p>
      <div className="mt-5 flex items-center justify-between border-t border-glass-border pt-4">
        <span className="text-xs text-muted-foreground">{footerText}</span>
        {action}
      </div>
    </div>
  );
}

const AtsIntegrationsPage = () => {
  const { data, isLoading } = useListAtsIntegrationsQuery();
  const { data: profile } = useGetProfileQuery();
  const integrations = (data as AtsIntegration[] | undefined) ?? [];
  const [dialog, setDialog] = useState<DialogState>(null);
  const isAdmin = profile?.role === "admin";

  const integrationFor = (providerId: string) => integrations.find((row) => row.provider === providerId);

  const close = () => setDialog(null);

  return (
    <div className="mx-auto w-full max-w-[1200px] px-6 py-8 text-white md:px-12">
      <nav className="mb-3 flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/settings" className="transition-colors hover:text-white">
          Settings
        </Link>
        <span>›</span>
        <span className="text-neon-cyan">Integrations</span>
      </nav>

      <h1 className="text-3xl font-bold">Integrations</h1>
      <p className="mt-2 max-w-2xl text-sm text-muted-foreground">Connect your ATS to sync job requisitions and route qualified candidates with readiness scores directly into your hiring pipeline.</p>

      {isAdmin && <h2 className="mt-8 text-lg font-semibold text-white">Your ATS</h2>}

      <div className={`${isAdmin ? "mt-4" : "mt-8"} grid gap-6 md:grid-cols-2 lg:grid-cols-3`}>
        {isLoading
          ? ATS_PROVIDERS.map((provider) => <IntegrationCardSkeleton key={provider.id} />)
          : ATS_PROVIDERS.map((provider) => (
              <IntegrationCard key={provider.id} provider={provider} integration={integrationFor(provider.id)} onAction={setDialog} />
            ))}
      </div>

      {dialog?.kind === "connect" &&
        (dialog.provider.authType === "api_key" ? (
          <ApiKeyConnectDialog provider={dialog.provider} open onOpenChange={(open) => !open && close()} onSuccess={() => setDialog({ kind: "success", provider: dialog.provider })} />
        ) : dialog.provider.authType === "oauth" ? (
          <OAuthConnectDialog provider={dialog.provider} open onOpenChange={(open) => !open && close()} onSuccess={() => setDialog({ kind: "success", provider: dialog.provider })} />
        ) : (
          <BoardConnectDialog provider={dialog.provider} open onOpenChange={(open) => !open && close()} onSuccess={() => setDialog({ kind: "success", provider: dialog.provider })} />
        ))}

      {dialog?.kind === "request" && <RequestAccessDialog provider={dialog.provider} open onOpenChange={(open) => !open && close()} />}

      {dialog?.kind === "manage" && (
        <ManageIntegrationDialog
          provider={dialog.provider}
          integration={dialog.integration}
          open
          onOpenChange={(open) => !open && close()}
          onDisconnect={() => setDialog({ kind: "disconnect", provider: dialog.provider, integration: dialog.integration })}
        />
      )}

      {dialog?.kind === "disconnect" && <DisconnectDialog provider={dialog.provider} integration={dialog.integration} open onOpenChange={(open) => !open && close()} />}

      {dialog?.kind === "error" && (
        <ErrorIntegrationDialog
          provider={dialog.provider}
          integration={dialog.integration}
          open
          onOpenChange={(open) => !open && close()}
          onReconnectWithKey={() => setDialog({ kind: "reconnectKey", provider: dialog.provider, integration: dialog.integration })}
        />
      )}

      {dialog?.kind === "reconnectKey" && (
        <ReconnectApiKeyDialog provider={dialog.provider} integration={dialog.integration} open onOpenChange={(open) => !open && close()} onSuccess={() => setDialog({ kind: "success", provider: dialog.provider })} />
      )}

      {dialog?.kind === "success" && (
        <ConnectionSuccessDialog
          provider={dialog.provider}
          open
          onOpenChange={(open) => !open && close()}
          onViewDetails={() => {
            const integration = integrationFor(dialog.provider.id);
            if (integration) setDialog({ kind: "manage", provider: dialog.provider, integration });
            else close();
          }}
        />
      )}

      {isAdmin && <PublicBoardsSection />}

    </div>
  );
};

export default AtsIntegrationsPage;
