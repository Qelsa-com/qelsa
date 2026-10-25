export type PublicBoardProviderId =
  | "greenhouse"
  | "lever"
  | "ashby"
  | "smartrecruiters"
  | "workday"
  | "workable"
  | "oracle_cloud"
  | "eightfold"
  | "rippling"
  | "breezy"
  | "recruitee"
  | "personio"
  | "teamtailor"
  | "darwinbox"
  | "keka"
  | "zoho_recruit";

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
  {
    id: "smartrecruiters",
    name: "SmartRecruiters",
    initials: "SR",
    tileClass: "bg-sky-500/20 text-sky-400",
    description: "Public SmartRecruiters postings. Strong enterprise coverage.",
    boardLabel: "Company identifier",
    boardPlaceholder: "Freshworks",
    credentialsHelp: "The company identifier in jobs.smartrecruiters.com/Freshworks/…, or paste that careers URL.",
  },
  {
    id: "workday",
    name: "Workday",
    initials: "W",
    tileClass: "bg-amber-500/20 text-amber-400",
    description: "Public Workday careers sites. The biggest enterprise source.",
    boardLabel: "Careers URL",
    boardPlaceholder: "https://nvidia.wd5.myworkdayjobs.com/NVIDIAExternalCareerSite",
    credentialsHelp: "Paste the public Workday careers URL. We derive tenant, wd host, and site. You can also use tenant|wd5|site.",
  },
  {
    id: "workable",
    name: "Workable",
    initials: "Wk",
    tileClass: "bg-cyan-500/20 text-cyan-400",
    description: "Public Workable account jobs, including descriptions.",
    boardLabel: "Account subdomain",
    boardPlaceholder: "huggingface",
    credentialsHelp: "The subdomain from apply.workable.com/your-company.",
  },
  {
    id: "oracle_cloud",
    name: "Oracle Cloud HCM",
    initials: "O",
    tileClass: "bg-rose-500/20 text-rose-300",
    description: "Oracle Cloud HCM candidate-experience job requisitions.",
    boardLabel: "Careers URL",
    boardPlaceholder: "https://jpmc.fa.oraclecloud.com/hcmUI/CandidateExperience/en/sites/CX_1001",
    credentialsHelp: "Paste the public Oracle careers URL containing /sites/CX_…, or use host|siteNumber.",
  },
  {
    id: "eightfold",
    name: "Eightfold",
    initials: "8",
    tileClass: "bg-indigo-500/20 text-indigo-300",
    description: "Eightfold-powered career sites, including large tech firms.",
    boardLabel: "Careers host | company domain",
    boardPlaceholder: "explore.jobs.netflix.net|netflix.com",
    credentialsHelp: "Use careers-host|company-domain, or paste a careers URL containing ?domain=company.com.",
  },
  {
    id: "rippling",
    name: "Rippling",
    initials: "R",
    tileClass: "bg-blue-500/20 text-blue-400",
    description: "Public Rippling ATS boards. Good US startup coverage.",
    boardLabel: "Board slug",
    boardPlaceholder: "rippling",
    credentialsHelp: "The board slug from ats.rippling.com/board-slug/jobs.",
  },
  {
    id: "breezy",
    name: "Breezy HR",
    initials: "B",
    tileClass: "bg-lime-500/20 text-lime-300",
    description: "Public Breezy HR career sites.",
    boardLabel: "Company subdomain",
    boardPlaceholder: "prageru",
    credentialsHelp: "The company part of your-company.breezy.hr.",
  },
  {
    id: "recruitee",
    name: "Recruitee",
    initials: "Rc",
    tileClass: "bg-teal-500/20 text-teal-300",
    description: "Public Recruitee offers. Good EU coverage.",
    boardLabel: "Company subdomain",
    boardPlaceholder: "bunq",
    credentialsHelp: "The company part of your-company.recruitee.com.",
  },
  {
    id: "personio",
    name: "Personio",
    initials: "P",
    tileClass: "bg-fuchsia-500/20 text-fuchsia-300",
    description: "Public Personio XML feeds for European companies.",
    boardLabel: "Company subdomain",
    boardPlaceholder: "personio",
    credentialsHelp: "The company part of your-company.jobs.personio.de.",
  },
  {
    id: "teamtailor",
    name: "Teamtailor",
    initials: "T",
    tileClass: "bg-pink-500/20 text-pink-300",
    description: "Public Teamtailor careers RSS feeds. Nordic and EU coverage.",
    boardLabel: "Careers host",
    boardPlaceholder: "career.teamtailor.com",
    credentialsHelp: "The hostname of the public Teamtailor careers site. We read its /jobs.rss feed.",
  },
  {
    id: "darwinbox",
    name: "Darwinbox",
    initials: "D",
    tileClass: "bg-blue-500/20 text-blue-300",
    description: "Darwinbox career portals, strong in Indian and APAC enterprises.",
    boardLabel: "Careers URL or host | company ID",
    boardPlaceholder: "https://dbx.darwinbox.in/ms/candidatev2/main/careers/allJobs",
    credentialsHelp: "Paste the public Darwinbox careers URL, or use host|companyId. The default company ID is main.",
  },
  {
    id: "keka",
    name: "Keka",
    initials: "K",
    tileClass: "bg-orange-500/20 text-orange-300",
    description: "Keka Hire career portals for Indian startups and mid-market teams.",
    boardLabel: "Company subdomain",
    boardPlaceholder: "jupiter",
    credentialsHelp: "The company part of your-company.keka.com. No API key needed.",
  },
  {
    id: "zoho_recruit",
    name: "Zoho Recruit",
    initials: "ZR",
    tileClass: "bg-red-500/20 text-red-300",
    description: "Public Zoho Recruit career sites.",
    boardLabel: "Company subdomain",
    boardPlaceholder: "redfordrecruiters",
    credentialsHelp: "The company part of your-company.zohorecruit.com, using its /jobs/careers page.",
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
