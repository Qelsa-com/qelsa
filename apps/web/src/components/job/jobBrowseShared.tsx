"use client";

/**
 * Shared building blocks for the job-browse pages (Smart Matches + All Jobs).
 *
 * Both pages share the same Figma header (title row, search, view tabs, filter
 * pills, goal-setup banner) and the same job card (company logo, match
 * ring, title/company/location, chip row, salary + posted). They live here so
 * the two pages stay visually identical.
 *
 * Figma: Qelsa-Screen — smart matches (246:11) / all jobs (261:10),
 * mobile (777:17). The `sm:` breakpoint is the desktop/mobile line: bare
 * classes are the mobile frame, `sm:` restores the wide layout.
 */

import { GoalSetupBanner } from "@/components/goals/GoalSetupBanner";
import { Autocomplete } from "@/components/ui/autocomplete";
import { cn } from "@/components/ui/utils";
import { formatCity } from "@/constants/city";
import { useAuth } from "@/contexts/AuthContext";
import { useLazySearchJobLocationsQuery } from "@/features/api/seedApi";
import { hasCareerGoal } from "@/lib/careerGoal";
import { ALMOST_MAX, ALMOST_MIN, GOAL_MATCH, MATCH_TIER, matchRingColor, type MatchTierId } from "@/lib/matchTiers";
import { City } from "@/types/city";
import { Job } from "@/types/job";
import { BarChart3, Building2, Check, ChevronDown, MapPin, Search, Sparkle, Target, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRouter as usePagesRouter } from "next/router";
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { createPortal } from "react-dom";

/* --------------------------------- types ---------------------------------- */

export interface SearchFilters {
  cities: string[];
  job_types: string[];
  experience_levels: string[];
  departments: string[];
  salary_min?: number;
  salary_max?: number;
  /** on-site | remote | hybrid — multi-select, matching the Job model's enum. */
  workplace_types: string[];
  sort_by: "relevance" | "date" | "salary";
  /** Recency window. Empty string = any time (pill stays labeled "Date posted"). */
  date_posted: "" | "24h" | "week" | "month";
  min_readiness?: number;
  max_readiness?: number;
}

export const EMPTY_SEARCH_FILTERS: SearchFilters = {
  cities: [],
  job_types: [],
  experience_levels: [],
  departments: [],
  workplace_types: [],
  sort_by: "relevance",
  date_posted: "",
};

export const DATE_POSTED_OPTIONS: { label: string; value: SearchFilters["date_posted"] }[] = [
  { label: "Any time", value: "" },
  { label: "Past 24 hours", value: "24h" },
  { label: "Past week", value: "week" },
  { label: "Past month", value: "month" },
];

export const SORT_OPTIONS: { label: string; value: SearchFilters["sort_by"] }[] = [
  { label: "Best match", value: "relevance" },
  { label: "Newest", value: "date" },
  { label: "Highest salary", value: "salary" },
];

export const WORKPLACE_TYPE_OPTIONS = [
  { label: "On-site", value: "on-site" },
  { label: "Remote", value: "remote" },
  { label: "Hybrid", value: "hybrid" },
];

export const WORK_TYPE_OPTIONS = [
  { label: "Full-time", value: "Full-time" },
  { label: "Part-time", value: "Part-time" },
  { label: "Contract", value: "Contract" },
  { label: "Internship", value: "Internship" },
];

/* -------------------------------- helpers --------------------------------- */

const EXPERIENCE_LEVEL_RANGES: Record<string, string> = {
  EN: "0-2 yrs",
  MI: "2-5 yrs",
  SE: "5-8 yrs",
  EX: "10+ yrs",
};

export function experienceChip(job: Job): string | null {
  if (job.experience != null) {
    const years = job.experience;
    if (years <= 1) return "0-1 yrs";
    if (years <= 4) return "2-4 yrs";
    if (years <= 8) return "5-8 yrs";
    if (years <= 12) return "8-12 yrs";
    return `${years}+ yrs`;
  }
  if (job.experience_level) return EXPERIENCE_LEVEL_RANGES[job.experience_level] ?? job.experience_level;
  return null;
}

export function workTypeChip(job: Job): string | null {
  if (job.work_type) return job.work_type;
  const types = (job.other_info?.types ?? []) as { name?: string }[];
  const names = types.map((t) => t?.name).filter(Boolean) as string[];
  return names.length ? names[0] : null;
}

export function workplaceChip(job: Job): string | null {
  if (job.workplace_type) return job.workplace_type.charAt(0).toUpperCase() + job.workplace_type.slice(1);
  return job.has_remote ? "Remote" : null;
}

export function displayCompanyName(name?: string | null) {
  const raw = (name ?? "").trim();
  if (!raw) return "Company";
  if (/[a-z]/.test(raw) && /[A-Z]/.test(raw)) return raw;
  return raw
    .replace(/[-_]+/g, " ")
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

export function displayLocation(job: Job): string | null {
  if (job.city) return formatCity(job.city);
  const location = typeof job.other_info?.location === "string" ? job.other_info.location.trim() : "";
  return location || null;
}

function companyDomainFromJob(job: Job) {
  const url = job.company_website_url || job.application_url;
  if (url) {
    try {
      const host = new URL(url).hostname.replace(/^www\./i, "");
      if (!/(greenhouse\.io|lever\.co)$/i.test(host)) {
        const parts = host.split(".");
        return parts.length >= 2 ? parts.slice(-2).join(".") : host;
      }
    } catch {
      /* ignore */
    }
  }
  const slug = (job.company_name ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");
  return slug ? `${slug}.com` : undefined;
}

function logoUrlForDomain(domain: string) {
  return `https://www.google.com/s2/favicons?sz=128&domain=${encodeURIComponent(domain)}`;
}

function isUsableLogo(url?: string | null) {
  return Boolean(url) && !/logo\.clearbit\.com/i.test(url ?? "");
}

export function companyLogoUrl(job: Job) {
  if (isUsableLogo(job.company_logo)) return job.company_logo!;
  if (isUsableLogo(job.page?.logo)) return job.page!.logo!;
  const domain = companyDomainFromJob(job);
  return domain ? logoUrlForDomain(domain) : undefined;
}

export function CompanyLogo({ job, name, className = "size-full object-cover", fallback }: { job: Job; name?: string; className?: string; fallback: ReactNode }) {
  const src = companyLogoUrl(job);
  const [failed, setFailed] = useState(false);
  if (!src || failed) return <>{fallback}</>;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={name || job.company_name || "Company"} className={className} onError={() => setFailed(true)} />
  );
}

function formatMoney(value: number, currency?: string | null): string {
  const cur = currency || "USD";
  const locale = cur === "INR" ? "en-IN" : "en-US";
  try {
    return new Intl.NumberFormat(locale, { style: "currency", currency: cur, maximumFractionDigits: 0, notation: "compact" }).format(value);
  } catch {
    return `${cur} ${value.toLocaleString(locale)}`;
  }
}

export function salaryText(job: Job): string | null {
  const { salary_min: min, salary_max: max, salary, salary_currency: cur } = job;
  if (min != null && max != null) return min === max ? formatMoney(min, cur) : `${formatMoney(min, cur)} - ${formatMoney(max, cur)}`;
  if (min != null) return `${formatMoney(min, cur)}+`;
  if (max != null) return `Up to ${formatMoney(max, cur)}`;
  if (salary != null) return formatMoney(salary, cur);
  return null;
}

export function timeAgo(raw?: string | Date | number | null): string | null {
  if (!raw) return null;
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return null;
  const s = (Date.now() - date.getTime()) / 1000;
  if (s < 3600) return `${Math.max(1, Math.floor(s / 60))}m ago`;
  if (s < 86_400) return `${Math.floor(s / 3600)}h ago`;
  const days = Math.floor(s / 86_400);
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
}

export function postedAgo(job: Job): string | null {
  return timeAgo(job.published_date ?? job.createdAt);
}

export function readinessScore(job: Job): number | null {
  if (job.competency?.readiness != null) return Math.round(job.competency.readiness);
  return null;
}

export function matchScore(job: Job): number | null {
  if (job.competency?.smart_match != null) return Math.round(job.competency.smart_match);
  if (job.competency?.readiness != null) return Math.round(job.competency.readiness);
  if (typeof job.fitScore === "number") return Math.round(job.fitScore);
  return null;
}

/** Goal fit is career alignment only — never presented as job readiness. */
export function goalMatchScore(job: Job): number | null {
  const alignment = job.career_alignment ?? job.competency?.career_alignment;
  return alignment != null ? Math.round(alignment) : null;
}

export function gapLine(job: Job): string | null {
  const score = matchScore(job) ?? readinessScore(job);
  const gap = job.competency?.gap;
  if (score == null || score < ALMOST_MIN || score > ALMOST_MAX || !gap) return null;
  if (gap.blocker === "experience") return "You're close — experience is what keeps this below Ready Now.";
  if (gap.blocker === "education") return "You're close — education is what keeps this below Ready Now.";
  if (gap.blocker === "profile") return "You're close — experience and education keep this below Ready Now.";
  if (gap.skills.length === 0) return null;
  const names = gap.skills.join(", ");
  return gap.reachesReady ? `You're close — missing: ${names} to reach Ready Now.` : `You're close — missing: ${names}.`;
}

function ringColor(score: number): string {
  return matchRingColor(score);
}

const LOGO_TINTS = ["#0ea5e9", "#7c3aed", "#10b981", "#ec4899", "#f59e0b"];

function logoTint(key: string): string {
  let hash = 0;
  for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) | 0;
  return LOGO_TINTS[Math.abs(hash) % LOGO_TINTS.length] ?? "#0ea5e9";
}

/** Bucket recency so `now` stays stable and Convex can cache the query. */
const RECENCY_BUCKET_MS = 5 * 60 * 1000;

/** Args for `api.jobs.listPaginated`. `now` is required when a recency window is set — queries cannot call Date.now(). */
export function toDiscoverArgs(filters: SearchFilters, search: string) {
  return {
    cities: filters.cities,
    job_types: filters.job_types,
    workplace_types: filters.workplace_types,
    salary_min: filters.salary_min,
    salary_max: filters.salary_max,
    search: search.trim() || undefined,
    sort_by: filters.sort_by,
    posted_within: filters.date_posted || undefined,
    now: filters.date_posted ? Math.floor(Date.now() / RECENCY_BUCKET_MS) * RECENCY_BUCKET_MS : undefined,
    min_readiness: filters.min_readiness,
    max_readiness: filters.max_readiness,
  };
}

const FILTER_QUERY_KEYS = ["q", "sort", "posted", "workplace", "type", "city"];

type FilterQuery = Record<string, string | string[] | undefined>;

function firstQueryValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function listQueryValues(value: string | string[] | undefined) {
  const values = Array.isArray(value) ? value : value ? [value] : [];
  return values.flatMap((entry) => entry.split(",")).map((entry) => entry.trim()).filter(Boolean);
}

function filtersFromUrl(raw: FilterQuery, tier?: MatchTierId) {
  if (!FILTER_QUERY_KEYS.some((key) => raw[key] != null)) return null;

  const workplace = new Set(WORKPLACE_TYPE_OPTIONS.map((option) => option.value));
  const jobTypes = new Set(WORK_TYPE_OPTIONS.map((option) => option.value));
  const sort = firstQueryValue(raw.sort);
  const posted = firstQueryValue(raw.posted);
  const city = firstQueryValue(raw.city)?.trim() || "";
  const filters: SearchFilters = {
    ...EMPTY_SEARCH_FILTERS,
    min_readiness: tier ? MATCH_TIER[tier].minReadiness : undefined,
    max_readiness: tier ? MATCH_TIER[tier].maxReadiness : undefined,
    sort_by: SORT_OPTIONS.some((option) => option.value === sort) ? (sort as SearchFilters["sort_by"]) : "relevance",
    date_posted: DATE_POSTED_OPTIONS.some((option) => option.value === posted) ? (posted as SearchFilters["date_posted"]) : "",
    workplace_types: listQueryValues(raw.workplace).filter((value) => workplace.has(value)),
    job_types: listQueryValues(raw.type).filter((value) => jobTypes.has(value)),
    cities: city ? [city] : [],
  };

  return {
    search: firstQueryValue(raw.q)?.trim() ?? "",
    filters,
    cityFilter: city ? { id: `location:${city.toLowerCase()}`, name: city } : null,
  };
}

function filtersToQueryString(search: string, filters: SearchFilters, cityFilter: City | null, raw: FilterQuery) {
  const params = new URLSearchParams();

  // Preserve campaign/analytics parameters and any future non-filter params.
  for (const [key, value] of Object.entries(raw)) {
    if (FILTER_QUERY_KEYS.includes(key)) continue;
    const values = Array.isArray(value) ? value : value == null ? [] : [value];
    for (const entry of values) params.append(key, entry);
  }

  if (search.trim()) params.set("q", search.trim());
  if (filters.sort_by !== "relevance") params.set("sort", filters.sort_by);
  if (filters.date_posted) params.set("posted", filters.date_posted);
  if (filters.workplace_types.length) params.set("workplace", filters.workplace_types.join(","));
  if (filters.job_types.length) params.set("type", filters.job_types.join(","));
  if (cityFilter) params.set("city", cityFilter.name);

  return params.toString();
}

export function useJobBrowseFilters(tier?: MatchTierId) {
  const router = usePagesRouter();
  const [hydrated, setHydrated] = useState(false);
  const [query, setQuery] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [cityFilter, setCityFilter] = useState<City | null>(null);
  const [filters, setFilters] = useState<SearchFilters>(() => ({
    ...EMPTY_SEARCH_FILTERS,
    min_readiness: tier ? MATCH_TIER[tier].minReadiness : undefined,
    max_readiness: tier ? MATCH_TIER[tier].maxReadiness : undefined,
  }));

  // URL is the source of truth so a filtered list survives refresh, sharing,
  // and browser back/forward from a job-detail page.
  useEffect(() => {
    if (!router.isReady || hydrated) return;
    const parsed = filtersFromUrl(router.query as FilterQuery, tier);
    if (parsed) {
      setSearchInput(parsed.search);
      setQuery(parsed.search);
      setFilters(parsed.filters);
      setCityFilter(parsed.cityFilter);
    }
    setHydrated(true);
  }, [router.isReady, router.query, hydrated, tier]);

  useEffect(() => {
    if (!router.isReady || !hydrated) return;
    const search = filtersToQueryString(query, filters, cityFilter, router.query as FilterQuery);
    const target = `${router.pathname}${search ? `?${search}` : ""}`;
    if (router.asPath === target) return;
    void router.replace(target, undefined, { shallow: true, scroll: false });
  }, [router, router.isReady, hydrated, query, filters, cityFilter]);

  useEffect(() => {
    const t = setTimeout(() => setQuery(searchInput), 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const commitSearch = useCallback(() => {
    setQuery(searchInput);
  }, [searchInput]);

  const discoverArgs = useMemo(() => toDiscoverArgs(filters, query), [filters, query]);
  const applyFilters = (partial: Partial<SearchFilters>) => {
    setFilters((prev) => ({ ...prev, ...partial }));
  };

  return { searchInput, setSearchInput, query, filters, applyFilters, discoverArgs, cityFilter, setCityFilter, commitSearch, hydrated };
}

/* ------------------------------ job card ---------------------------------- */

export function JobCard({ job, onClick, variant = "all" }: { job: Job; onClick: () => void; variant?: "all" | "smart" | "goal" }) {
  const title = job.job_title?.name ?? job.title;
  const company = displayCompanyName(job.page?.name || job.company_name);
  const location = displayLocation(job);
  const readiness = readinessScore(job);
  const alignment = job.career_alignment ?? job.competency?.career_alignment;
  const goalFit = alignment != null ? Math.round(alignment) : null;
  const smartMatch = job.competency?.smart_match != null ? Math.round(job.competency.smart_match) : null;
  const score = variant === "goal" ? goalFit : variant === "smart" ? (smartMatch ?? readiness) : readiness;
  const ringLabel = variant === "goal" ? "Goal" : variant === "smart" ? "Match" : "Ready";
  const chips = [experienceChip(job), workTypeChip(job), workplaceChip(job)].filter(Boolean) as string[];
  const salary = salaryText(job);
  const posted = postedAgo(job);
  const tint = logoTint(String(job.id ?? title ?? "job"));
  const hasLogo = Boolean(companyLogoUrl(job));

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-col gap-4 rounded-2xl border border-glass-border bg-white/[0.04] p-4 text-left transition-all hover:-translate-y-0.5 hover:border-neon-cyan/30 hover:bg-white/[0.06] sm:rounded-[20px] sm:p-5"
    >
      <div className="flex items-center justify-between">
        <div className="flex size-9 items-center justify-center overflow-hidden rounded-lg" style={hasLogo ? undefined : { backgroundColor: `${tint}22`, border: `1px solid ${tint}55` }}>
          <CompanyLogo job={job} name={company} fallback={<Building2 className="size-4" style={{ color: tint }} />} />
        </div>
        {score != null && <MatchRing value={score} tone={score} color={variant === "goal" ? GOAL_MATCH.color : undefined} label={ringLabel} />}
      </div>

      <div className="flex flex-col gap-1">
        <p className="line-clamp-1 text-[15px] font-bold text-white" title={title}>
          {title}
        </p>
        {company && <p className="line-clamp-1 text-[13px] text-white/55">{company}</p>}
        {location && <p className="line-clamp-1 text-xs text-white/40">{location}</p>}
      </div>

      {variant !== "all" && <div className="border-t border-glass-border/60 -my-1" />}

      {chips.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {chips.map((chip) => (
            <span key={chip} className="rounded-md bg-white/[0.08] px-2 py-[3px] text-[11px] font-medium text-white/60">
              {chip}
            </span>
          ))}
        </div>
      )}

      {variant === "smart" && readiness != null && (
        <div className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-1 text-xs text-white/70 w-fit">
          <span className="font-semibold text-white">Ready</span>
          <span className="text-white">{readiness}%</span>
          {alignment != null && (
            <>
              <span className="text-white/20 px-0.5">|</span>
              <span className="font-semibold text-white">Goal</span>
              <span className="text-white">{Math.round(alignment)}%</span>
            </>
          )}
        </div>
      )}

      <div className="mt-auto flex items-center justify-between gap-2">
        {salary && <span className="text-[13px] font-bold text-white">{salary}</span>}
        {posted && <span className="ml-auto text-[11px] text-white/40 sm:text-xs">{posted}</span>}
      </div>
    </button>
  );
}

export function MatchRing({
  value,
  tone,
  label = "Ready",
  color,
}: {
  value: number;
  tone?: number;
  label?: string;
  /** Override the readiness palette (used for goal-fit rings). */
  color?: string;
}) {
  const r = 18;
  const circumference = 2 * Math.PI * r;
  const offset = circumference * (1 - Math.min(100, Math.max(0, value)) / 100);
  const ringStroke = color ?? ringColor(tone ?? value);
  return (
    <div className="relative size-11 sm:size-12">
      <svg className="absolute inset-0 size-full -rotate-90" viewBox="0 0 40 40">
        <circle cx="20" cy="20" r={r} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="3" />
        <circle cx="20" cy="20" r={r} fill="none" stroke={ringStroke} strokeWidth="3" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center leading-none">
        <span className="text-[11px] font-bold text-white sm:text-xs">{value}%</span>
        <span className="mt-0.5 text-[8px] font-medium text-white/60">{label}</span>
      </div>
    </div>
  );
}

/* --------------------------- multi-select pill ---------------------------- */

/** Keep filter menus above the scroll container that clips absolutely positioned children on mobile. */
function filterMenuStyle(rect: DOMRect, width: number): CSSProperties {
  const maxWidth = window.innerWidth - 16;
  const menuWidth = Math.min(width, maxWidth);
  return {
    position: "fixed",
    top: rect.bottom + 8,
    left: Math.max(8, Math.min(rect.left, window.innerWidth - menuWidth - 8)),
    width: menuWidth,
    zIndex: 10_000,
  };
}

/**
 * Filter pill whose dropdown holds checkboxes rather than radio-style options.
 * Figma: Qelsa-Screen — all-jobs-filter-active (262:10); the pill turns cyan
 * once anything is picked, and the picks surface as chips under the row.
 */
export function MultiSelectPill({ label, options, values, onChange }: { label: string; options: { label: string; value: string }[]; values: string[]; onChange: (values: string[]) => void }) {
  const [open, setOpen] = useState(false);
  const [menuStyle, setMenuStyle] = useState<CSSProperties | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const active = values.length > 0;

  useEffect(() => {
    if (!open) return;
    const closeOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (containerRef.current?.contains(target) || menuRef.current?.contains(target)) return;
      setOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", closeOutside);
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeOutside);
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  useEffect(() => {
    if (!open) {
      setMenuStyle(null);
      return;
    }
    const update = () => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (rect) setMenuStyle(filterMenuStyle(rect, 220));
    };
    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [open]);

  const toggle = (value: string) => {
    onChange(values.includes(value) ? values.filter((v) => v !== value) : [...values, value]);
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className={`flex h-[34px] items-center gap-1 rounded-full border py-2 pl-3 pr-2.5 text-xs font-medium transition-colors sm:h-[42px] sm:gap-1.5 sm:py-3 sm:pl-5 sm:pr-4 sm:text-[13px] ${
          active ? "border-neon-cyan bg-neon-cyan/10 text-neon-cyan" : "border-glass-border text-white/70 hover:border-white/25"
        }`}
      >
        <span>{label}</span>
        {active && <span className="text-[11px]">({values.length})</span>}
        <ChevronDown className={`size-3.5 transition-transform sm:size-4 ${open ? "rotate-180" : ""}`} />
      </button>

      {open && menuStyle
        ? createPortal(
            <div
              ref={menuRef}
              role="menu"
              style={menuStyle}
              className="flex max-h-[min(60vh,320px)] flex-col gap-0.5 overflow-y-auto rounded-xl border border-glass-border bg-[#1a1a24] p-2 shadow-2xl"
            >
                {options.map((o) => {
                  const checked = values.includes(o.value);
                  return (
                    <button
                      key={o.value}
                      type="button"
                      role="menuitemcheckbox"
                      aria-checked={checked}
                      onClick={() => toggle(o.value)}
                      className={`flex w-full items-center gap-3 rounded-lg p-3 text-left transition-colors ${checked ? "bg-white/[0.08]" : "hover:bg-white/5"}`}
                    >
                      <span className={`flex size-[18px] shrink-0 items-center justify-center rounded border-2 ${checked ? "border-neon-cyan bg-neon-cyan" : "border-white/35"}`}>
                        {checked && <Check className="size-2.5 text-[#06060f]" strokeWidth={4} />}
                      </span>
                      <span className="text-sm font-medium text-white/90">{o.label}</span>
                    </button>
                  );
                })}
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}

/** The "Applied:" chip row (Figma 265:76) — one chip per active selection. */
export function AppliedFilters({ chips, onClear }: { chips: { key: string; label: string; onRemove: () => void }[]; onClear: () => void }) {
  if (chips.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm font-medium text-white/70">Applied:</span>
      {chips.map((chip) => (
        <span key={chip.key} className="flex items-center gap-2 rounded-lg border border-neon-cyan/20 bg-neon-cyan/10 py-1.5 pl-3 pr-2 text-[13px] font-medium text-neon-cyan">
          {chip.label}
          <button onClick={chip.onRemove} aria-label={`Remove ${chip.label}`} className="transition-opacity hover:opacity-70">
            <X className="size-3.5" />
          </button>
        </span>
      ))}
      <button onClick={onClear} className="pl-2 text-sm font-semibold text-neon-cyan underline transition-opacity hover:opacity-80">
        Clear all
      </button>
    </div>
  );
}

/* ------------------------------ filter pill ------------------------------- */

export function PillDropdown({ label, value, options, onSelect }: { label: string; value: string; options: { label: string; value: string }[]; onSelect: (value: string) => void }) {
  const [open, setOpen] = useState(false);
  const [menuStyle, setMenuStyle] = useState<CSSProperties | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const closeOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (containerRef.current?.contains(target) || menuRef.current?.contains(target)) return;
      setOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", closeOutside);
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeOutside);
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  useEffect(() => {
    if (!open) {
      setMenuStyle(null);
      return;
    }
    const update = () => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (rect) setMenuStyle(filterMenuStyle(rect, 220));
    };
    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [open]);

  const current = options.find((o) => o.value === value && o.value !== "");
  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className={`flex h-[34px] items-center gap-1 rounded-full border py-2 pl-3 pr-2.5 text-xs font-medium transition-colors sm:h-[42px] sm:gap-1.5 sm:py-3 sm:pl-5 sm:pr-4 sm:text-[13px] ${
          current ? "border-neon-cyan/40 text-white" : "border-glass-border text-white/70 hover:border-white/25"
        }`}
      >
        <span>{current?.label ?? label}</span>
        <ChevronDown className={`size-3.5 transition-transform sm:size-4 ${open ? "rotate-180" : ""}`} />
      </button>
      {open && menuStyle
        ? createPortal(
            <div
              ref={menuRef}
              role="menu"
              style={menuStyle}
              className="max-h-[min(60vh,320px)] overflow-y-auto rounded-xl border border-glass-border bg-[#0d0d1a] p-1 shadow-2xl"
            >
              {options.map((o) => (
                <button
                  key={o.value || "any"}
                  type="button"
                  role="menuitemradio"
                  aria-checked={o.value === value}
                  onClick={() => {
                    onSelect(o.value);
                    setOpen(false);
                  }}
                  className={`block w-full rounded-lg px-3 py-2 text-left text-[13px] transition-colors hover:bg-white/5 ${o.value === value ? "text-neon-cyan" : "text-white/80"}`}
                >
                  {o.label}
                </button>
              ))}
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}

/* ------------------------------ page header ------------------------------- */

/**
 * Tracks the `sm` breakpoint for the handful of spots a media query can't reach
 * (a placeholder string). Starts false so SSR renders the desktop copy and the
 * first client effect corrects it.
 */
function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 639px)");
    const sync = () => setIsMobile(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);
  return isMobile;
}

interface JobsBrowseHeaderProps {
  activeTab: "smart-matches" | "all" | "my-jobs";
  query: string;
  setQuery: (v: string) => void;
  onSearch: () => void;
  filters: SearchFilters;
  onApplyFilters: (partial: Partial<SearchFilters>) => void;
  cityFilter: City | null;
  setCityFilter: (city: City | null) => void;
  resultsCount?: { loaded: number; total?: number };
  suppressGoalBanner?: boolean;
}

export function JobsBrowseHeader({ activeTab, query, setQuery, onSearch, filters, onApplyFilters, cityFilter, setCityFilter, resultsCount, suppressGoalBanner = false }: JobsBrowseHeaderProps) {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const showGoalBanner = !suppressGoalBanner && isAuthenticated && Boolean(user) && !hasCareerGoal(user?.career_goal);
  const [searchJobLocations, { data: cityResults = [] }] = useLazySearchJobLocationsQuery();
  const isMobile = useIsMobile();

  // The listing filters on the bare city name (`cities=Pune`), which is what the
  // backend matches against — both the job's city relation and the scraped
  // `other_info` blob. The input shows the fuller "Pune, Maharashtra, India" label.
  const handleCitySelect = (city: City | null) => {
    setCityFilter(city);
    onApplyFilters({ cities: city ? [city.name] : [] });
  };

  // Keep the active filters when moving between the two job-list tabs. The
  // detail/back path is already covered by the URL sync in useJobBrowseFilters.
  const withCurrentFilters = (href: string) => `${href}${typeof window !== "undefined" ? window.location.search : ""}`;

  // Search as you type — Enter still fires it immediately. Kept in a ref because
  // both pages pass a fresh inline `onSearch` on every render, which would
  // otherwise restart the timer continuously.
  const onSearchRef = useRef(onSearch);
  onSearchRef.current = onSearch;
  const skipInitialSearch = useRef(true);

  useEffect(() => {
    if (skipInitialSearch.current) {
      skipInitialSearch.current = false;
      return;
    }
    const timer = setTimeout(() => onSearchRef.current(), 400);
    return () => clearTimeout(timer);
  }, [query]);

  // One chip per active selection, in the order the pills appear.
  const labelFor = (options: { label: string; value: string }[], value: string) => options.find((o) => o.value === value)?.label ?? value;

  const appliedChips = [
    ...filters.workplace_types.map((v) => ({
      key: `workplace-${v}`,
      label: labelFor(WORKPLACE_TYPE_OPTIONS, v),
      onRemove: () => onApplyFilters({ workplace_types: filters.workplace_types.filter((x) => x !== v) }),
    })),
    ...filters.job_types.map((v) => ({
      key: `work-${v}`,
      label: labelFor(WORK_TYPE_OPTIONS, v),
      onRemove: () => onApplyFilters({ job_types: filters.job_types.filter((x) => x !== v) }),
    })),
    ...(cityFilter ? [{ key: `city-${cityFilter.id}`, label: cityFilter.name, onRemove: () => handleCitySelect(null) }] : []),
    ...(filters.date_posted
      ? [
          {
            key: `date-${filters.date_posted}`,
            label: DATE_POSTED_OPTIONS.find((o) => o.value === filters.date_posted)?.label ?? filters.date_posted,
            onRemove: () => onApplyFilters({ date_posted: "" }),
          },
        ]
      : []),
  ];

  const clearAll = () => {
    setCityFilter(null);
    onApplyFilters({ workplace_types: [], job_types: [], cities: [], date_posted: "", sort_by: "relevance" });
  };

  return (
    <div className="flex flex-col gap-5 sm:gap-6">
      {/* Title row */}
      <div className="flex flex-wrap items-start justify-between gap-5 sm:gap-4">
        <div className="flex flex-col gap-2 sm:gap-3">
          <h1 className="text-[30px] font-extrabold text-white sm:text-4xl md:text-5xl">Job opportunities.</h1>
          <p className="text-sm text-white/70 sm:text-lg">{hasCareerGoal(user?.career_goal) ? `Roles matched to your goal: ${user?.career_goal?.target_role}.` : "Find your next career move with AI-powered matching."}</p>
        </div>
        {/* Posting and managing are recruiter-only — hidden for candidates and while signed out. */}
        {isAuthenticated && user?.account_type === "recruiter" && (
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <button onClick={() => router.push("/jobs/create-job")} className="rounded-full gradient-primary px-4 py-2.5 text-[13px] font-bold text-white transition-opacity hover:opacity-90 sm:px-6 sm:py-3 sm:text-sm">
              Post job
            </button>
            <button onClick={() => router.push("/jobs/posted")} className="rounded-full border border-white/20 px-4 py-2.5 text-[13px] font-bold text-white transition-colors hover:bg-white/5 sm:px-6 sm:py-3 sm:text-sm">
              <span className="sm:hidden">Manage</span>
              <span className="hidden sm:inline">Manage job post</span>
            </button>
          </div>
        )}
      </div>

      {/* Search */}
      <div className="flex h-11 items-center gap-2.5 rounded-xl border border-glass-border bg-white/[0.04] px-4 sm:h-14 sm:gap-3 sm:rounded-[28px] sm:px-5">
        <Search className="size-4 shrink-0 text-white/45 sm:size-5" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onSearch()}
          placeholder={isMobile ? "Search title, skill, or company..." : "Search jobs by title, skill, or company..."}
          className="min-w-0 flex-1 bg-transparent text-sm text-white placeholder:text-white/45 focus:outline-none sm:text-[15px]"
        />
      </div>

      {/* Smart Matches and My Jobs are account-only — guests stay on the public All Jobs list. */}
      {isAuthenticated && (
        <div className="flex items-center gap-2 sm:gap-0">
          <TabButton active={activeTab === "all"} label="All Jobs" onClick={() => router.push(withCurrentFilters("/jobs/all"))} />
          <TabButton active={activeTab === "smart-matches"} label="Smart Matches" onClick={() => router.push(withCurrentFilters("/jobs/smart-matches"))} />
          <TabButton active={activeTab === "my-jobs"} label="My Jobs" onClick={() => router.push("/jobs/my-jobs/saved")} />
        </div>
      )}

      {/* Filter pills — mobile scrolls horizontally; desktop wraps in one row. */}
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
        <div className="scrollbar-hide flex items-center gap-2 overflow-x-auto [&>*]:shrink-0 sm:contents">
          {activeTab === "all" && <PillDropdown label="Sort" value={filters.sort_by} options={SORT_OPTIONS} onSelect={(v) => onApplyFilters({ sort_by: v as SearchFilters["sort_by"] })} />}
          <PillDropdown label="Date posted" value={filters.date_posted} options={DATE_POSTED_OPTIONS} onSelect={(v) => onApplyFilters({ date_posted: v as SearchFilters["date_posted"] })} />
          <MultiSelectPill label="Workplace type" options={WORKPLACE_TYPE_OPTIONS} values={filters.workplace_types} onChange={(v) => onApplyFilters({ workplace_types: v })} />
          <MultiSelectPill label="Work type" options={WORK_TYPE_OPTIONS} values={filters.job_types} onChange={(v) => onApplyFilters({ job_types: v })} />
        </div>
        <Autocomplete
          className="w-full sm:w-[221px] sm:flex-none"
          value={cityFilter}
          onChange={handleCitySelect}
          onSearch={searchJobLocations}
          options={cityResults}
          placeholder="Enter location"
          allowFreeText
          makeFreeTextValue={(query) => {
            const name = query.split(",")[0]?.trim() || query.trim();
            return { id: `location:${name.toLowerCase()}`, name };
          }}
          icon={<MapPin className="size-3.5 shrink-0 text-white/45 sm:size-4" />}
          iconClassName="left-2.5 sm:left-3.5"
          getInputLabel={formatCity}
          renderOption={(city) => (
            <>
              <MapPin className="size-3.5 shrink-0 text-white/45" />
              {formatCity(city)}
            </>
          )}
          inputClassName="h-[34px] rounded-full border-glass-border pl-7 pr-2.5 text-xs font-medium text-white placeholder:text-[13px] placeholder:text-white/45 sm:h-[42px] sm:pl-9 sm:pr-4 sm:text-[13px]"
        />
      </div>

      {/* Applied filter chips */}
      <AppliedFilters chips={appliedChips} onClear={clearAll} />

      {resultsCount && resultsCount.loaded > 0 && (
        <p className="text-xs font-semibold text-white/80 sm:text-sm">
          {typeof resultsCount.total === "number"
            ? resultsCount.loaded === 1
              ? `Showing 1 of ${resultsCount.total} jobs`
              : `Showing 1-${resultsCount.loaded} of ${resultsCount.total} jobs`
            : resultsCount.loaded === 1
              ? "Showing 1 job"
              : `Showing 1-${resultsCount.loaded} jobs`}
        </p>
      )}

      {showGoalBanner && <GoalSetupBanner onSetGoal={() => router.push("/goals")} />}
    </div>
  );
}

export function TabButton({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex flex-col items-center justify-center px-3 py-2 sm:px-5 sm:py-2.5">
      <span className={`text-sm font-semibold transition-colors sm:text-[15px] ${active ? "text-white" : "text-white/50 hover:text-white/80"}`}>{label}</span>
      <span className={`mt-1 h-0.5 w-full rounded-full ${active ? "bg-white" : "bg-transparent"}`} />
    </button>
  );
}

export function MatchSection({ dotColor, title, subtitle, viewAllHref, children }: { dotColor: string; title: string; subtitle: string; viewAllHref?: string; children: ReactNode }) {
  const router = useRouter();
  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 flex-col gap-1 sm:gap-2">
          <div className="flex items-center gap-2 sm:gap-3">
            <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: dotColor }} />
            <h2 className="text-xl font-bold text-white sm:text-2xl">{title}</h2>
          </div>
          <p className="text-[13px] text-white/45 sm:text-sm">{subtitle}</p>
        </div>
        {viewAllHref && (
          <button type="button" onClick={() => router.push(viewAllHref)} className="shrink-0 pt-0.5 text-[13px] font-semibold text-white/50 transition-colors hover:text-white sm:text-sm">
            View All
          </button>
        )}
      </div>
      {children}
    </div>
  );
}

export type SmartMatchTier = "strong" | "almost" | "growth";

export function MatchEmptyState({ tier = "strong", title, subtitle, actionLabel, onAction }: { tier?: SmartMatchTier; title?: string; subtitle?: string; actionLabel?: string; onAction?: () => void }) {
  if (title && !actionLabel && !onAction) {
    // If just custom title was passed without tier, keep simple fallback
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-glass-border bg-white/[0.03] px-6 py-12 text-center sm:rounded-[20px] sm:px-10 sm:py-16">
        <Sparkle className="size-6 text-neon-cyan sm:size-7" strokeWidth={1.75} />
        <p className="mt-5 text-lg font-bold text-white sm:text-xl">{title}</p>
        {subtitle && <p className="mt-2 max-w-md text-[13px] leading-relaxed text-white/45 sm:text-sm">{subtitle}</p>}
      </div>
    );
  }

  const content = {
    strong: {
      statusTitle: null,
      statusSubtitle: null,
      readinessText: "Your skills and experience align well with these roles. Keep building on your strengths to stay competitive.",
      goalText: "Set a career goal that aligns with the roles and career path you're targeting.",
    },
    almost: {
      statusTitle: "Your opportunities are taking shape",
      statusSubtitle: "Jobs will appear here when your match score reaches 60%.",
      readinessText: "You're close to meeting these roles requirements. Strengthen relevant skills and experience to improve your readiness.",
      goalText: "Set a career goal that aligns with the roles and career path you're targeting.",
    },
    growth: {
      statusTitle: "Discover new possibilities",
      statusSubtitle: "Jobs will appear here when your match score reaches 60%.",
      readinessText: "Build relevant skills, strengthen your experience, and validate your qualifications against role requirements.",
      goalText: "Set a career goal that aligns with the roles and career path you're targeting.",
    },
  }[tier];

  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-glass-border bg-white/[0.02] p-6 text-center sm:rounded-[20px] sm:p-8 md:p-10">
      <div className="flex size-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-neon-cyan">
        <Sparkle className="size-5 fill-current" />
      </div>

      {content.statusTitle && <h3 className="mt-3.5 text-base font-semibold text-white sm:text-lg">{content.statusTitle}</h3>}
      {content.statusSubtitle && <p className="mt-1 text-xs text-white/50 sm:text-sm">{content.statusSubtitle}</p>}

      <h4 className={`${content.statusTitle ? "mt-4 sm:mt-5" : "mt-3.5"} text-base font-bold text-white sm:text-lg`}>How to improve your match score</h4>

      {/* Two explanation boxes */}
      <div className="mt-6 sm:mt-8 grid w-full grid-cols-1 gap-4 text-left md:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
          <div className="flex items-center gap-2.5">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-neon-cyan/25 bg-neon-cyan/10 text-neon-cyan">
              <BarChart3 className="size-4" />
            </div>
            <span className="text-sm font-semibold text-neon-cyan">Readiness score</span>
          </div>
          <p className="mt-3 text-xs leading-relaxed text-white/60 sm:text-[13px]">{content.readinessText}</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
          <div className="flex items-center gap-2.5">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-neon-cyan/25 bg-neon-cyan/10 text-neon-cyan">
              <Target className="size-4" />
            </div>
            <span className="text-sm font-semibold text-neon-cyan">Career goal alignment</span>
          </div>
          <p className="mt-3 text-xs leading-relaxed text-white/60 sm:text-[13px]">{content.goalText}</p>
        </div>
      </div>

      {/* Formula banner */}
      <div className="mt-4 flex w-full flex-wrap items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white/[0.02] px-6 py-4 sm:gap-6">
        <div className="flex flex-col items-center leading-none">
          <span className="text-[10px] font-bold uppercase tracking-wider text-neon-cyan">READY</span>
          <span className="mt-1 text-xs font-semibold text-white sm:text-sm">Readiness</span>
        </div>
        <span className="text-sm font-bold text-white/40">+</span>
        <div className="flex flex-col items-center leading-none">
          <span className="text-[10px] font-bold uppercase tracking-wider text-neon-cyan">GOAL</span>
          <span className="mt-1 text-xs font-semibold text-white sm:text-sm">Goal Alignment</span>
        </div>
        <span className="text-sm font-bold text-white/40">=</span>
        <div className="rounded-xl border border-neon-cyan/40 bg-neon-cyan/10 px-4 py-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-neon-cyan sm:text-xs">YOUR MATCH SCORE</span>
        </div>
      </div>
    </div>
  );
}

export function JobGrid({ jobs, onOpen, variant = "all" }: { jobs: Job[]; onOpen: (id: string | number) => void; variant?: "all" | "smart" | "goal" }) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">
      {jobs.map((job) => (
        <JobCard key={job.id} job={job} onClick={() => onOpen(job.id)} variant={variant} />
      ))}
    </div>
  );
}
