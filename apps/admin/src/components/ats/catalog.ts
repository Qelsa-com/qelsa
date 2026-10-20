export type PublicBoardProviderId = "greenhouse" | "lever" | "ashby";

export type AtsStatus = "connected" | "error" | "pending" | "disconnected";

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
  sync_started_at?: number;
  has_api_key: boolean;
};

export type PublicBoardProviderMeta = {
  id: PublicBoardProviderId;
  name: string;
  initials: string;
  tileClass: string;
  description: string;
  boardLabel?: string;
  boardPlaceholder?: string;
  credentialsHelp?: string;
};

export const PUBLIC_BOARD_PROVIDERS: PublicBoardProviderMeta[] = [
  {
    id: "greenhouse",
    name: "Greenhouse",
    initials: "G",
    tileClass: "bg-emerald-500/20 text-emerald-400",
    description: "Public Job Board API. Add as many board slugs as you want.",
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
    boardLabel: "Job board name",
    boardPlaceholder: "your-company",
    credentialsHelp: "The last segment of jobs.ashbyhq.com/your-company.",
  },
];

export const publicBoardProviderById = (
  id: PublicBoardProviderId,
): PublicBoardProviderMeta =>
  PUBLIC_BOARD_PROVIDERS.find((provider) => provider.id === id) ?? PUBLIC_BOARD_PROVIDERS[0];

export function relativeTime(timestamp?: number): string {
  if (!timestamp) return "Never";
  const diff = timestamp - Date.now();
  const future = diff > 0;
  const abs = Math.abs(diff);
  const minutes = Math.floor(abs / 60_000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const unit =
    minutes < 1
      ? null
      : minutes < 60
        ? `${minutes} min`
        : hours < 24
          ? `${hours} hour${hours === 1 ? "" : "s"}`
          : `${days} day${days === 1 ? "" : "s"}`;
  if (unit === null) return future ? "Shortly" : "Just now";
  return future ? `In ${unit}` : `${unit} ago`;
}
