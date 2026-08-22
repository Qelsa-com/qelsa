export type AtsProviderId = "zoho_recruit" | "greenhouse" | "lever" | "keka" | "ashby" | "bamboohr" | "workday" | "darwinbox" | "icims";

export type AtsAuthType = "board" | "api_key" | "oauth" | "gated";
export type AtsStatus = "connected" | "error" | "pending" | "disconnected";

export type AtsIntegration = {
  id: string;
  provider: AtsProviderId;
  status: AtsStatus;
  auth_type: AtsAuthType;
  subdomain?: string;
  region?: string;
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
  tileClass: string;
  description: string;
  authType: AtsAuthType;
  boardLabel?: string;
  boardPlaceholder?: string;
  credentialsHelp?: string;
};

export const ATS_PROVIDERS: AtsProviderMeta[] = [
  {
    id: "zoho_recruit",
    name: "Zoho Recruit",
    initials: "Z",
    tileClass: "bg-sky-500/20 text-sky-400",
    description: "OAuth integration that pulls Job Openings from your Zoho Recruit org.",
    authType: "oauth",
    credentialsHelp: "Create a Zoho API Console self-client with scope ZohoRecruit.modules.jobopening.READ, then paste the client ID, secret, and refresh token.",
  },
  {
    id: "greenhouse",
    name: "Greenhouse",
    initials: "G",
    tileClass: "bg-emerald-500/20 text-emerald-400",
    description: "Connect your Greenhouse Harvest API key to sync jobs and readiness signals into your hiring pipeline.",
    authType: "api_key",
    boardLabel: "Board slug",
    boardPlaceholder: "your-company",
    credentialsHelp: "Find your Harvest API key in Greenhouse under Configure → Dev Center → API Credential Management. The board slug is the last segment of boards.greenhouse.io/your-company.",
  },
  {
    id: "lever",
    name: "Lever",
    initials: "L",
    tileClass: "bg-orange-500/20 text-orange-400",
    description: "Import published postings from your Lever job site.",
    authType: "board",
    boardLabel: "Site slug",
    boardPlaceholder: "your-company",
    credentialsHelp: "Lever’s Postings API uses your public site name from jobs.lever.co/your-company.",
  },
  {
    id: "keka",
    name: "Keka",
    initials: "K",
    tileClass: "bg-rose-500/20 text-rose-400",
    description: "Connect with Keka Hire client credentials and sync published jobs.",
    authType: "oauth",
    boardLabel: "Company subdomain",
    boardPlaceholder: "your-company",
    credentialsHelp: "From Keka API settings: company subdomain, client ID, and client secret. We exchange these for a Hire API token.",
  },
  {
    id: "ashby",
    name: "Ashby",
    initials: "A",
    tileClass: "bg-violet-500/20 text-violet-400",
    description: "Sync published postings from your Ashby job board.",
    authType: "board",
    boardLabel: "Job board name",
    boardPlaceholder: "your-company",
    credentialsHelp: "Ashby’s public Job Postings API uses the last segment of jobs.ashbyhq.com/your-company.",
  },
  {
    id: "bamboohr",
    name: "BambooHR",
    initials: "B",
    tileClass: "bg-lime-500/20 text-lime-400",
    description: "Sync open jobs from BambooHR Applicant Tracking with your API key.",
    authType: "api_key",
    boardLabel: "Company subdomain",
    boardPlaceholder: "your-company",
    credentialsHelp: "Create an API key under your BambooHR profile → API Keys. Subdomain is the your-company part of your-company.bamboohr.com.",
  },
  {
    id: "workday",
    name: "Workday",
    initials: "W",
    tileClass: "bg-amber-500/20 text-amber-400",
    description: "Enterprise-grade sync for offer letters, employee profiles, and candidate pipelines.",
    authType: "gated",
    credentialsHelp: "Workday Recruiting APIs require a tenant integration user and vendor setup.",
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

export type PublicBoardProviderId = "greenhouse" | "lever" | "ashby";

export type AtsPublicBoard = {
  id: string;
  provider: PublicBoardProviderId;
  status: AtsStatus;
  auth_type: "board";
  kind: "public_board";
  subdomain?: string;
  sync_jobs: boolean;
  sync_candidates: boolean;
  records_synced: number;
  connected_since?: number;
  last_synced_at?: number;
  next_sync_at?: number;
  error_message?: string;
  error_detected_at?: number;
  has_api_key: boolean;
};

export const PUBLIC_BOARD_PROVIDERS: AtsProviderMeta[] = [
  {
    id: "greenhouse",
    name: "Greenhouse",
    initials: "G",
    tileClass: "bg-emerald-500/20 text-emerald-400",
    description: "Public Job Board API. Add as many board slugs as you want.",
    authType: "board",
    boardLabel: "Board slug",
    boardPlaceholder: "airbnb",
    credentialsHelp: "Use the last segment of boards.greenhouse.io/your-company. No API key — this is the public board.",
  },
  {
    id: "lever",
    name: "Lever",
    initials: "L",
    tileClass: "bg-orange-500/20 text-orange-400",
    description: "Public Lever postings API.",
    authType: "board",
    boardLabel: "Site slug",
    boardPlaceholder: "your-company",
    credentialsHelp: "The site name from jobs.lever.co/your-company.",
  },
  {
    id: "ashby",
    name: "Ashby",
    initials: "A",
    tileClass: "bg-violet-500/20 text-violet-400",
    description: "Public Ashby job board.",
    authType: "board",
    boardLabel: "Job board name",
    boardPlaceholder: "your-company",
    credentialsHelp: "The last segment of jobs.ashbyhq.com/your-company.",
  },
];

export const providerById = (id: AtsProviderId): AtsProviderMeta => ATS_PROVIDERS.find((p) => p.id === id) ?? ATS_PROVIDERS[0];
export const publicBoardProviderById = (id: PublicBoardProviderId): AtsProviderMeta => PUBLIC_BOARD_PROVIDERS.find((p) => p.id === id) ?? PUBLIC_BOARD_PROVIDERS[0];

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
