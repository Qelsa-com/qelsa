"use client";

import {
  useConnectAtsApiKeyMutation,
  useConnectAtsOAuthMutation,
  useDisconnectAtsMutation,
  useReconnectAtsMutation,
  useRemoveAtsMutation,
  useRequestAtsAccessMutation,
  useUpdateAtsSyncSettingsMutation,
} from "@/features/api/atsIntegrationsApi";
import { toastUnknownError } from "@/lib/errors";
import { AlertTriangle, CheckCircle2, Info } from "lucide-react";
import { useState } from "react";
import { Button } from "../../ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../../ui/dialog";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import { Switch } from "../../ui/switch";
import { formatDate, relativeTime, type AtsIntegration, type AtsProviderMeta } from "./catalog";

const gradientButton = "rounded-full bg-gradient-to-r from-neon-purple to-neon-pink px-6 text-white hover:opacity-90";
const outlineButton = "rounded-full border-glass-border bg-transparent px-6 text-white hover:bg-white/5";

const contentClass = "glass-strong border-glass-border gap-0 p-0 sm:max-w-md sm:rounded-2xl";
const headerClass = "border-b border-glass-border px-6 py-5";
const bodyClass = "px-6 py-5";
const footerClass = "flex flex-row items-center justify-between gap-3 border-t border-glass-border px-6 py-4";

type DialogProps = {
  provider: AtsProviderMeta;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

type BannerTone = "info" | "warning" | "error" | "success";

function Banner({ tone, children }: { tone: BannerTone; children: React.ReactNode }) {
  const tones: Record<BannerTone, string> = {
    info: "border-neon-cyan/30 bg-neon-cyan/10 text-sky-200",
    warning: "border-neon-yellow/30 bg-neon-yellow/10 text-amber-200",
    error: "border-destructive/40 bg-destructive/10 text-rose-200",
    success: "border-neon-green/30 bg-neon-green/10 text-emerald-200",
  };
  const Icon = tone === "success" ? CheckCircle2 : tone === "error" ? AlertTriangle : Info;
  return (
    <div className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-sm ${tones[tone]}`}>
      <Icon className="mt-0.5 h-4 w-4 shrink-0" />
      <p>{children}</p>
    </div>
  );
}

function MetaRow({ label, value, badge }: { label: string; value: string; badge?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-1.5 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="flex items-center gap-2 text-white">
        {value}
        {badge}
      </span>
    </div>
  );
}

function StatusPill({ tone, children }: { tone: "green" | "red" | "amber" | "gray"; children: React.ReactNode }) {
  const tones = {
    green: "bg-emerald-500/15 text-emerald-400",
    red: "bg-destructive/15 text-rose-400",
    amber: "bg-amber-500/15 text-amber-400",
    gray: "bg-white/10 text-white/60",
  };
  return <span className={`rounded-md px-2 py-0.5 text-[11px] font-semibold tracking-wide uppercase ${tones[tone]}`}>{children}</span>;
}

/* ------------------------------------------------------------------ */
/* API-key connect (Greenhouse, Ashby)                                 */
/* ------------------------------------------------------------------ */

export function ApiKeyConnectDialog({ provider, open, onOpenChange, onSuccess }: DialogProps & { onSuccess: () => void }) {
  const [connect, { isLoading }] = useConnectAtsApiKeyMutation();
  const [apiKey, setApiKey] = useState("");
  const [subdomain, setSubdomain] = useState("");

  const handleConnect = async () => {
    try {
      await connect({ provider: provider.id, apiKey: apiKey.trim(), subdomain: subdomain.trim() || undefined }).unwrap();
      setApiKey("");
      setSubdomain("");
      onSuccess();
    } catch (err) {
      toastUnknownError(err, `Could not connect ${provider.name}. Check your credentials and try again.`);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={contentClass}>
        <DialogHeader className={headerClass}>
          <DialogTitle>Connect {provider.name}</DialogTitle>
          <DialogDescription className="sr-only">Enter your {provider.name} API credentials</DialogDescription>
        </DialogHeader>
        <div className={`${bodyClass} space-y-4`}>
          <div className="space-y-2">
            <Label htmlFor={`${provider.id}-api-key`}>API Key *</Label>
            <Input id={`${provider.id}-api-key`} type="password" value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder={`Enter your ${provider.name} API key`} autoComplete="off" disabled={isLoading} />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`${provider.id}-subdomain`}>Subdomain *</Label>
            <Input id={`${provider.id}-subdomain`} value={subdomain} onChange={(e) => setSubdomain(e.target.value)} placeholder={`your-company.${provider.id}.io`} autoComplete="off" disabled={isLoading} />
          </div>
          {provider.credentialsHelp && <p className="text-xs text-neon-cyan">{provider.credentialsHelp}</p>}
        </div>
        <DialogFooter className={footerClass}>
          <Button variant="outline" className={outlineButton} onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button className={gradientButton} disabled={!apiKey.trim() || isLoading} onClick={() => void handleConnect()}>
            {isLoading ? "Connecting…" : "Connect Integration"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ------------------------------------------------------------------ */
/* OAuth connect (Zoho Recruit, Lever, Keka, BambooHR, Workday)        */
/* ------------------------------------------------------------------ */

export function OAuthConnectDialog({ provider, open, onOpenChange, onSuccess }: DialogProps & { onSuccess: () => void }) {
  const [connect, { isLoading }] = useConnectAtsOAuthMutation();

  const handleConnect = async () => {
    try {
      await connect(provider.id).unwrap();
      onSuccess();
    } catch (err) {
      toastUnknownError(err, `Could not connect ${provider.name}. Please try again.`);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={contentClass}>
        <DialogHeader className={headerClass}>
          <DialogTitle>Connect {provider.name}</DialogTitle>
          <DialogDescription className="sr-only">Authorize the {provider.name} integration</DialogDescription>
        </DialogHeader>
        <div className={`${bodyClass} space-y-5`}>
          <Banner tone="info">Connecting will sync your active job requisitions into Qelsa and route qualified candidates with readiness scores back into your {provider.name} pipeline.</Banner>
          <div>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Data synced</span>
              <StatusPill tone="gray">OAuth</StatusPill>
            </div>
            <MetaRow label="Job requisitions" value="Automatic" />
            <MetaRow label="Candidate applications" value="Automatic" />
          </div>
        </div>
        <DialogFooter className={footerClass}>
          <Button variant="outline" className={outlineButton} onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button className={gradientButton} disabled={isLoading} onClick={() => void handleConnect()}>
            {isLoading ? "Connecting…" : `Connect ${provider.name}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ------------------------------------------------------------------ */
/* Gated providers (Darwinbox, iCIMS)                                  */
/* ------------------------------------------------------------------ */

export function RequestAccessDialog({ provider, open, onOpenChange }: DialogProps) {
  const [requestAccess, { isLoading }] = useRequestAtsAccessMutation();

  const handleRequest = async () => {
    try {
      await requestAccess(provider.id).unwrap();
      onOpenChange(false);
    } catch (err) {
      toastUnknownError(err, "Could not submit your request. Please try again.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={contentClass}>
        <DialogHeader className={headerClass}>
          <DialogTitle>Request {provider.name} Integration</DialogTitle>
          <DialogDescription className="sr-only">Request vendor approval for {provider.name}</DialogDescription>
        </DialogHeader>
        <div className={`${bodyClass} space-y-5`}>
          <Banner tone="warning">{provider.name} requires vendor approval before API access can be provisioned. Submit a request and our team will coordinate setup on your behalf.</Banner>
          <div>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">What happens next</span>
              <StatusPill tone="amber">Gated</StatusPill>
            </div>
            <MetaRow label={`We contact ${provider.name}`} value="1–3 business days" />
            <MetaRow label="You receive setup instructions" value="Via email" />
          </div>
        </div>
        <DialogFooter className={footerClass}>
          <Button variant="outline" className={outlineButton} onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button className="rounded-full border border-neon-yellow/50 bg-neon-yellow/10 px-6 text-neon-yellow hover:bg-neon-yellow/20" variant="outline" disabled={isLoading} onClick={() => void handleRequest()}>
            {isLoading ? "Submitting…" : "Submit Request"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ------------------------------------------------------------------ */
/* Disconnect confirmation                                             */
/* ------------------------------------------------------------------ */

export function DisconnectDialog({ provider, integration, open, onOpenChange }: DialogProps & { integration: AtsIntegration }) {
  const [disconnect, { isLoading }] = useDisconnectAtsMutation();

  const handleDisconnect = async () => {
    try {
      await disconnect(provider.id).unwrap();
      onOpenChange(false);
    } catch (err) {
      toastUnknownError(err, `Could not disconnect ${provider.name}. Please try again.`);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={contentClass}>
        <DialogHeader className={headerClass}>
          <DialogTitle>Disconnect Integration</DialogTitle>
          <DialogDescription className="sr-only">Confirm disconnecting {provider.name}</DialogDescription>
        </DialogHeader>
        <div className={`${bodyClass} space-y-5`}>
          <Banner tone="error">Disconnecting will stop syncing job requisitions and candidate applications immediately. You can reconnect at any time without losing your sync configuration.</Banner>
          <div>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-medium text-white">{provider.name}</span>
              <StatusPill tone="green">Connected</StatusPill>
            </div>
            <MetaRow label="Records synced" value={`${integration.records_synced.toLocaleString()} candidates`} />
            <MetaRow label="Connected since" value={formatDate(integration.connected_since)} />
          </div>
        </div>
        <DialogFooter className={footerClass}>
          <Button variant="outline" className={outlineButton} onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button variant="destructive" className="rounded-full px-6" disabled={isLoading} onClick={() => void handleDisconnect()}>
            {isLoading ? "Disconnecting…" : "Yes, Disconnect"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ------------------------------------------------------------------ */
/* Reconnect with new API key (error state, api_key providers)         */
/* ------------------------------------------------------------------ */

export function ReconnectApiKeyDialog({ provider, integration, open, onOpenChange, onSuccess }: DialogProps & { integration: AtsIntegration; onSuccess: () => void }) {
  const [reconnect, { isLoading }] = useReconnectAtsMutation();
  const [apiKey, setApiKey] = useState("");

  const handleReconnect = async () => {
    try {
      await reconnect({ provider: provider.id, apiKey: apiKey.trim() }).unwrap();
      setApiKey("");
      onSuccess();
    } catch (err) {
      toastUnknownError(err, `Could not reconnect ${provider.name}. Check your API key and try again.`);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={contentClass}>
        <DialogHeader className={headerClass}>
          <DialogTitle>Reconnect {provider.name}</DialogTitle>
          <DialogDescription className="sr-only">Re-enter credentials for {provider.name}</DialogDescription>
        </DialogHeader>
        <div className={`${bodyClass} space-y-5`}>
          <Banner tone="error">API key expired — re-enter credentials to resume syncing.</Banner>
          <div>
            <MetaRow label="Last successful sync" value={relativeTime(integration.last_synced_at)} />
            <MetaRow label="Error detected" value={formatDate(integration.error_detected_at)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`${provider.id}-reconnect-key`}>API Key *</Label>
            <Input id={`${provider.id}-reconnect-key`} type="password" value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder="Enter your new API key" autoComplete="off" disabled={isLoading} />
          </div>
        </div>
        <DialogFooter className={footerClass}>
          <Button variant="outline" className={outlineButton} onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button className={gradientButton} disabled={!apiKey.trim() || isLoading} onClick={() => void handleReconnect()}>
            {isLoading ? "Reconnecting…" : "Reconnect"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ------------------------------------------------------------------ */
/* Manage connected integration                                        */
/* ------------------------------------------------------------------ */

export function ManageIntegrationDialog({ provider, integration, open, onOpenChange, onDisconnect }: DialogProps & { integration: AtsIntegration; onDisconnect: () => void }) {
  const [updateSettings] = useUpdateAtsSyncSettingsMutation();

  const toggle = async (key: "syncJobs" | "syncCandidates", value: boolean) => {
    try {
      await updateSettings({ provider: provider.id, [key]: value }).unwrap();
    } catch (err) {
      toastUnknownError(err, "Could not update sync settings. Please try again.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={contentClass}>
        <DialogHeader className={headerClass}>
          <DialogTitle>{provider.name} Integration</DialogTitle>
          <DialogDescription className="sr-only">Manage the {provider.name} integration</DialogDescription>
        </DialogHeader>
        <div className={`${bodyClass} space-y-6`}>
          <div className="flex items-center gap-3">
            <StatusPill tone="green">Connected</StatusPill>
            <span className="text-sm text-muted-foreground">Connected since {formatDate(integration.connected_since)}</span>
          </div>

          <div className="space-y-1 rounded-xl border border-glass-border bg-white/5 px-4 py-3">
            <MetaRow label="Last successful sync" value={relativeTime(integration.last_synced_at)} />
            <MetaRow label="Next scheduled sync" value={relativeTime(integration.next_sync_at)} />
            <MetaRow label="Total records synced" value={`${integration.records_synced.toLocaleString()} candidates`} />
          </div>

          <div>
            <p className="mb-3 text-xs font-semibold tracking-wider text-muted-foreground uppercase">Data sync settings</p>
            <div className="divide-y divide-glass-border">
              <div className="flex items-center justify-between py-3">
                <span className="text-sm text-white">Job Requisitions</span>
                <Switch checked={integration.sync_jobs} onCheckedChange={(value) => void toggle("syncJobs", value)} />
              </div>
              <div className="flex items-center justify-between py-3">
                <span className="text-sm text-white">Candidates / Applications</span>
                <Switch checked={integration.sync_candidates} onCheckedChange={(value) => void toggle("syncCandidates", value)} />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between rounded-xl border border-destructive/40 bg-destructive/5 px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-destructive">Danger Zone</p>
              <p className="mt-1 max-w-[260px] text-xs text-muted-foreground">This will stop syncing requisitions and candidates. You can reconnect at any time without losing your configuration.</p>
            </div>
            <Button variant="outline" className="rounded-full border-destructive/50 text-destructive hover:bg-destructive/10" onClick={onDisconnect}>
              Disconnect
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ------------------------------------------------------------------ */
/* Error state details (expired token / revoked access)                */
/* ------------------------------------------------------------------ */

export function ErrorIntegrationDialog({
  provider,
  integration,
  open,
  onOpenChange,
  onReconnect,
  onReconnectWithKey,
}: DialogProps & {
  integration: AtsIntegration;
  onReconnect: () => void;
  onReconnectWithKey: () => void;
}) {
  const [remove, { isLoading }] = useRemoveAtsMutation();

  const handleRemove = async () => {
    try {
      await remove(provider.id).unwrap();
      onOpenChange(false);
    } catch (err) {
      toastUnknownError(err, `Could not remove ${provider.name}. Please try again.`);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={contentClass}>
        <DialogHeader className={headerClass}>
          <DialogTitle>{provider.name} Integration</DialogTitle>
          <DialogDescription className="sr-only">Resolve the {provider.name} connection error</DialogDescription>
        </DialogHeader>
        <div className={`${bodyClass} space-y-5`}>
          <Banner tone="error">Authentication expired — {integration.error_message ?? "your access token has been revoked"}. Reconnect to resume syncing requisitions and candidates.</Banner>
          <div>
            <div className="flex items-center justify-between py-1.5 text-sm">
              <span className="text-muted-foreground">Current Status</span>
              <StatusPill tone="red">Disconnected</StatusPill>
            </div>
            <MetaRow label="Last successful sync" value={relativeTime(integration.last_synced_at)} />
            <MetaRow label="Error detected since" value={formatDate(integration.error_detected_at)} />
          </div>
          <div className="flex flex-col items-center gap-3 pt-1">
            <Button className={`${gradientButton} w-full`} onClick={provider.authType === "api_key" ? onReconnectWithKey : onReconnect}>
              Reconnect {provider.name}
            </Button>
            <button type="button" className="text-sm text-destructive underline-offset-4 hover:underline disabled:opacity-50" disabled={isLoading} onClick={() => void handleRemove()}>
              {isLoading ? "Removing…" : "Remove Integration"}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ------------------------------------------------------------------ */
/* Connection success                                                  */
/* ------------------------------------------------------------------ */

export function ConnectionSuccessDialog({ provider, open, onOpenChange, onViewDetails }: DialogProps & { onViewDetails: () => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={contentClass}>
        <DialogHeader className={headerClass}>
          <DialogTitle>Connection Successful</DialogTitle>
          <DialogDescription className="sr-only">{provider.name} connected successfully</DialogDescription>
        </DialogHeader>
        <div className={`${bodyClass} space-y-5`}>
          <Banner tone="success">Your ATS has been successfully connected. Job requisitions and candidate data will begin syncing shortly.</Banner>
          <div>
            <div className="flex items-center justify-between py-1.5 text-sm">
              <span className="text-muted-foreground">Status</span>
              <StatusPill tone="green">Connected</StatusPill>
            </div>
            <MetaRow label="First sync begins" value="In a few minutes" />
            <MetaRow label="Data synced" value="Requisitions, Candidates" />
          </div>
        </div>
        <DialogFooter className={footerClass}>
          <Button variant="outline" className={outlineButton} onClick={() => onOpenChange(false)}>
            Back to Integrations
          </Button>
          <Button className={gradientButton} onClick={onViewDetails}>
            View Connection Details
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
