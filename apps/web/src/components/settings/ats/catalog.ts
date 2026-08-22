export type AtsProviderId = "zoho_recruit" | "greenhouse" | "lever" | "keka" | "ashby" | "bamboohr" | "workday" | "darwinbox" | "icims";

export type AtsAuthType = "oauth" | "api_key" | "gated";
export type AtsStatus = "connected" | "error" | "pending" | "disconnected";

export type AtsIntegration = {
  id: string;
  provider: AtsProviderId;
  status: AtsStatus;
  auth_type: AtsAuthType;
  subdomain?: string;
  sync_jobs: boolean;
  sync_candidates: boolean;
  records_synced: number;
  connected_since?: number;
  last_synced_at?: number;
  next_sync_at?: number;
  error_message?: string;
  error_detected_at?: number;
  requested_at?: number;
  has_api_key: boolean;
};

export type AtsProviderMeta = {
  id: AtsProviderId;
  name: string;
  initials: string;
  /** Tailwind classes for the logo tile. */
  tileClass: string;
  description: string;
  authType: AtsAuthType;
  /** Shown under the API-key field in the connect dialog. */
  credentialsHelp?: string;
};

export const ATS_PROVIDERS: AtsProviderMeta[] = [
  {
    id: "zoho_recruit",
    name: "Zoho Recruit",
    initials: "Z",
    tileClass: "bg-sky-500/20 text-sky-400",
    description: "Auto-sync active requisitions and route candidates with match quality scores into your pipeline.",
    authType: "oauth",
  },
  {
    id: "greenhouse",
    name: "Greenhouse",
    initials: "G",
    tileClass: "bg-emerald-500/20 text-emerald-400",
    description: "Sync candidates, jobs, and readiness signals directly to your Greenhouse pipeline.",
    authType: "api_key",
    credentialsHelp: "Find your API key in Greenhouse under Configure → Dev Center → API Credential Management",
  },
  {
    id: "lever",
    name: "Lever",
    initials: "L",
    tileClass: "bg-orange-500/20 text-orange-400",
    description: "Import job postings and manage candidate applications with shortlist confidence scores.",
    authType: "oauth",
  },
  {
    id: "keka",
    name: "Keka",
    initials: "K",
    tileClass: "bg-rose-500/20 text-rose-400",
    description: "Sync requisitions and push candidates with readiness signals into your Keka hiring pipeline.",
    authType: "oauth",
  },
  {
    id: "ashby",
    name: "Ashby",
    initials: "A",
    tileClass: "bg-violet-500/20 text-violet-400",
    description: "Fast-growing team sync with consolidated candidate management and match quality scores.",
    authType: "api_key",
    credentialsHelp: "Find your API key in Ashby under Admin → Integrations → API Keys",
  },
  {
    id: "bamboohr",
    name: "BambooHR",
    initials: "B",
    tileClass: "bg-lime-500/20 text-lime-400",
    description: "Sync onboarding data and push fewer, better profiles with readiness signals into BambooHR.",
    authType: "oauth",
  },
  {
    id: "workday",
    name: "Workday",
    initials: "W",
    tileClass: "bg-amber-500/20 text-amber-400",
    description: "Enterprise-grade sync for offer letters, employee profiles, and candidate pipelines.",
    authType: "oauth",
  },
  {
    id: "darwinbox",
    name: "Darwinbox",
    initials: "D",
    tileClass: "bg-orange-500/20 text-orange-400",
    description: "Enterprise HRMS integration requiring vendor approval. Request access to begin setup.",
    authType: "gated",
  },
  {
    id: "icims",
    name: "iCIMS",
    initials: "i",
    tileClass: "bg-blue-500/20 text-blue-400",
    description: "Complex recruitment workflow sync requiring vendor approval for API access.",
    authType: "gated",
  },
];

export const providerById = (id: AtsProviderId): AtsProviderMeta => ATS_PROVIDERS.find((p) => p.id === id) ?? ATS_PROVIDERS[0];

export function relativeTime(timestamp?: number): string {
  if (!timestamp) return "Never";
  const diff = timestamp - Date.now();
  const future = diff > 0;
  const abs = Math.abs(diff);
  const minutes = Math.floor(abs / 60_000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const unit = minutes < 1 ? null : minutes < 60 ? `${minutes} min` : hours < 24 ? `${hours} hour${hours === 1 ? "" : "s"}` : `${days} day${days === 1 ? "" : "s"}`;
  if (unit === null) return future ? "Shortly" : "Just now";
  return future ? `In ${unit}` : `${unit} ago`;
}

export function formatDate(timestamp?: number): string {
  if (!timestamp) return "—";
  return new Date(timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}
