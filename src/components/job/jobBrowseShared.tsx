"use client";

/**
 * Shared building blocks for the job-browse pages (Smart Matches + All Jobs).
 *
 * Both pages share the same Figma header (title row, search, view tabs, filter
 * pills, profile-completion banner) and the same job card (company logo, match
 * ring, title/company/location, chip row, salary + posted). They live here so
 * the two pages stay visually identical.
 *
 * Figma: Qelsa-Screen — smart matches (246:11) / all jobs (261:10),
 * mobile (777:17). The `sm:` breakpoint is the desktop/mobile line: bare
 * classes are the mobile frame, `sm:` restores the wide layout.
 */

import { Autocomplete } from "@/components/ui/autocomplete";
import { formatCity } from "@/constants/city";
import { useAuth } from "@/contexts/AuthContext";
import { useLazySearchCitiesQuery } from "@/features/api/seedApi";
import { City } from "@/types/city";
import { Job } from "@/types/job";
import { Building2, Check, ChevronDown, MapPin, Search, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

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
}

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

const EXPERIENCE_LEVEL_LABELS: Record<string, string> = { EN: "Entry", MI: "Mid", SE: "Senior", EX: "Executive" };

export function experienceChip(job: Job): string | null {
  if (job.experience_level) return EXPERIENCE_LEVEL_LABELS[job.experience_level] ?? job.experience_level;
  if (job.experience != null) return job.experience === 0 ? "Entry" : `${job.experience}+ yrs`;
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

export function timeAgo(raw?: string | Date | null): string | null {
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

export function matchScore(job: Job): number | null {
  if (job.competency?.readiness != null) return Math.round(job.competency.readiness);
  if (typeof job.fitScore === "number") return Math.round(job.fitScore);
  return null;
}

function ringColor(score: number): string {
  if (score >= 80) return "#10b981"; // green
  if (score >= 60) return "#0ea5e9"; // cyan
  return "#f59e0b"; // amber
}

/* ------------------------------ job card ---------------------------------- */

export function JobCard({ job, onClick }: { job: Job; onClick: () => void }) {
  const title = job.job_title?.name ?? job.title;
  const company = job.page?.name || job.company_name;
  const score = matchScore(job);
  const chips = [experienceChip(job), workTypeChip(job), workplaceChip(job)].filter(Boolean) as string[];
  const salary = salaryText(job);
  const posted = postedAgo(job);

  return (
    <button
      onClick={onClick}
      className="flex flex-col gap-4 rounded-2xl border border-glass-border bg-white/[0.04] p-4 text-left transition-all hover:-translate-y-0.5 hover:border-neon-cyan/30 hover:bg-white/[0.06] sm:h-72 sm:justify-between sm:gap-0 sm:rounded-[20px] sm:p-5"
    >
      <div className="flex min-h-0 flex-col gap-4 sm:flex-1">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex size-9 items-center justify-center overflow-hidden rounded-lg border border-glass-border bg-white/[0.04]">
            {job.company_logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={job.company_logo} alt={company ?? "Company"} className="size-full object-cover" />
            ) : (
              <Building2 className="size-4 text-white/70" />
            )}
          </div>
          {score != null && <MatchRing value={score} />}
        </div>

        {/* Body */}
        <div className="flex flex-col gap-1.5">
          <p className="line-clamp-2 text-[15px] font-bold text-white">{title}</p>
          {company && <p className="line-clamp-1 text-[13px] text-white/70">{company}</p>}
          {job.city && <p className="line-clamp-1 text-xs text-white/45">{formatCity(job.city)}</p>}
        </div>

        {chips.length > 0 && (
          <>
            <div className="h-px w-full bg-white/[0.08]" />
            <div className="flex flex-wrap gap-1.5">
              {chips.map((c) => (
                <span key={c} className="rounded-md border border-glass-border bg-white/[0.1] px-2 py-[3px] text-[11px] font-medium text-white/70">
                  {c}
                </span>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between">
        <span className="text-[13px] font-semibold text-white/70">{salary ?? "—"}</span>
        {posted && <span className="text-[11px] text-white/35 sm:text-xs">{posted}</span>}
      </div>
    </button>
  );
}

export function MatchRing({ value }: { value: number }) {
  const r = 18;
  const circumference = 2 * Math.PI * r;
  const offset = circumference * (1 - Math.min(100, Math.max(0, value)) / 100);
  const color = ringColor(value);
  return (
    // The ring itself stays 36px at every breakpoint (Figma 777:77 / 246:11) —
    // only the box around it shrinks, so the svg is centred rather than filled.
    <div className="relative size-11 sm:size-12">
      <svg className="absolute left-1/2 top-1/2 size-10 -translate-x-1/2 -translate-y-1/2 -rotate-90" viewBox="0 0 40 40">
        <circle cx="20" cy="20" r={r} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="3" />
        <circle cx="20" cy="20" r={r} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset} />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white sm:text-[11px]">{value}%</span>
    </div>
  );
}

/* --------------------------- multi-select pill ---------------------------- */

/**
 * Filter pill whose dropdown holds checkboxes rather than radio-style options.
 * Figma: Qelsa-Screen — all-jobs-filter-active (262:10); the pill turns cyan
 * once anything is picked, and the picks surface as chips under the row.
 */
export function MultiSelectPill({
  label,
  options,
  values,
  onChange,
}: {
  label: string;
  options: { label: string; value: string }[];
  values: string[];
  onChange: (values: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const active = values.length > 0;

  const toggle = (value: string) => {
    onChange(values.includes(value) ? values.filter((v) => v !== value) : [...values, value]);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className={`flex items-center gap-1 rounded-full border py-2 pl-3 pr-2.5 text-xs font-medium transition-colors sm:gap-1.5 sm:py-3 sm:pl-5 sm:pr-4 sm:text-[13px] ${
          active ? "border-neon-cyan bg-neon-cyan/10 text-neon-cyan" : "border-glass-border text-white/70 hover:border-white/25"
        }`}
      >
        <span>{label}</span>
        {active && <span className="text-[11px]">({values.length})</span>}
        <ChevronDown className={`size-3.5 transition-transform sm:size-4 ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute left-0 z-20 mt-2 flex w-[220px] flex-col gap-0.5 rounded-xl border border-glass-border bg-[#1a1a24] p-2 shadow-2xl">
            {options.map((o) => {
              const checked = values.includes(o.value);
              return (
                <button
                  key={o.value}
                  onClick={() => toggle(o.value)}
                  className={`flex w-full items-center gap-3 rounded-lg p-3 text-left transition-colors ${checked ? "bg-white/[0.08]" : "hover:bg-white/5"}`}
                >
                  <span
                    className={`flex size-[18px] shrink-0 items-center justify-center rounded border-2 ${
                      checked ? "border-neon-cyan bg-neon-cyan" : "border-white/35"
                    }`}
                  >
                    {checked && <Check className="size-2.5 text-[#06060f]" strokeWidth={4} />}
                  </span>
                  <span className="text-sm font-medium text-white/90">{o.label}</span>
                </button>
              );
            })}

            <div className="my-1 h-px w-full bg-white/[0.12]" />
            <button onClick={() => setOpen(false)} className="flex w-full items-center justify-center p-2.5 text-[13px] font-semibold text-neon-cyan">
              Show results
            </button>
          </div>
        </>
      )}
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

export function PillDropdown({
  label,
  value,
  options,
  onSelect,
}: {
  label: string;
  value: string;
  options: { label: string; value: string }[];
  onSelect: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const current = options.find((o) => o.value === value && o.value !== "");
  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className={`flex items-center gap-1 rounded-full border py-2 pl-3 pr-2.5 text-xs font-medium transition-colors sm:gap-1.5 sm:py-3 sm:pl-5 sm:pr-4 sm:text-[13px] ${
          current ? "border-neon-cyan/40 text-white" : "border-glass-border text-white/70 hover:border-white/25"
        }`}
      >
        <span>{current?.label ?? label}</span>
        <ChevronDown className={`size-3.5 transition-transform sm:size-4 ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute left-0 z-20 mt-2 min-w-[180px] overflow-hidden rounded-xl border border-glass-border bg-[#0d0d1a] p-1 shadow-2xl">
            {options.map((o) => (
              <button
                key={o.value || "any"}
                onClick={() => {
                  onSelect(o.value);
                  setOpen(false);
                }}
                className={`block w-full rounded-lg px-3 py-2 text-left text-[13px] transition-colors hover:bg-white/5 ${o.value === value ? "text-neon-cyan" : "text-white/80"}`}
              >
                {o.label}
              </button>
            ))}
          </div>
        </>
      )}
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
  activeTab: "smart_matches" | "all";
  query: string;
  setQuery: (v: string) => void;
  onSearch: () => void;
  filters: SearchFilters;
  onApplyFilters: (partial: Partial<SearchFilters>) => void;
  cityFilter: City | null;
  setCityFilter: (city: City | null) => void;
  /** Optional profile-completion banner (shown to authenticated users). */
  profileBanner?: { text: string; percent: number };
}

export function JobsBrowseHeader({
  activeTab,
  query,
  setQuery,
  onSearch,
  filters,
  onApplyFilters,
  cityFilter,
  setCityFilter,
  profileBanner,
}: JobsBrowseHeaderProps) {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [searchCities, { data: cityResults = [] }] = useLazySearchCitiesQuery();
  const isMobile = useIsMobile();

  // The listing filters on the bare city name (`cities=Pune`), which is what the
  // backend matches against — both the job's city relation and the scraped
  // `other_info` blob. The input shows the fuller "Pune, Maharashtra" label.
  const handleCitySelect = (city: City | null) => {
    setCityFilter(city);
    onApplyFilters({ cities: city ? [city.name] : [] });
  };

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
  ];

  const clearAll = () => {
    setCityFilter(null);
    onApplyFilters({ workplace_types: [], job_types: [], cities: [] });
  };

  return (
    <div className="flex flex-col gap-5 sm:gap-6">
      {/* Title row */}
      <div className="flex flex-wrap items-start justify-between gap-5 sm:gap-4">
        <div className="flex flex-col gap-2 sm:gap-3">
          <h1 className="text-[30px] font-extrabold text-white sm:text-4xl md:text-5xl">Job opportunities</h1>
          <p className="text-sm text-white/70 sm:text-lg">Find your next career move with AI-powered matching</p>
        </div>
        {/* Posting and tracking all need an account — hidden while signed out. */}
        {isAuthenticated && (
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <button
              onClick={() => router.push("/jobs/create-job")}
              className="rounded-full gradient-primary px-4 py-2.5 text-[13px] font-bold text-white transition-opacity hover:opacity-90 sm:px-6 sm:py-3 sm:text-sm"
            >
              Post job
            </button>
            <button
              onClick={() => router.push("/jobs/my-jobs/applied")}
              className="rounded-full border border-white/20 px-4 py-2.5 text-[13px] font-bold text-white transition-colors hover:bg-white/5 sm:px-6 sm:py-3 sm:text-sm"
            >
              Track jobs
            </button>
            <button
              onClick={() => router.push("/jobs/posted")}
              className="rounded-full border border-white/20 px-4 py-2.5 text-[13px] font-bold text-white transition-colors hover:bg-white/5 sm:px-6 sm:py-3 sm:text-sm"
            >
              {/* The mobile frame trims this to fit alongside the other two pills. */}
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

      {/* View tabs */}
      <div className="flex items-center gap-2 sm:gap-0">
        <TabButton active={activeTab === "smart_matches"} label="Smart Matches" onClick={() => router.push("/jobs/smart_matches")} />
        <TabButton active={activeTab === "all"} label="All Jobs" onClick={() => router.push("/jobs/all")} />
      </div>

      {/* Filter pills */}
      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        <PillDropdown
          label="Date posted"
          value={filters.sort_by}
          options={[
            { label: "Most relevant", value: "relevance" },
            { label: "Newest first", value: "date" },
            { label: "Highest salary", value: "salary" },
          ]}
          onSelect={(v) => onApplyFilters({ sort_by: v as SearchFilters["sort_by"] })}
        />
        <MultiSelectPill
          label="Workplace type"
          options={WORKPLACE_TYPE_OPTIONS}
          values={filters.workplace_types}
          onChange={(v) => onApplyFilters({ workplace_types: v })}
        />
        <MultiSelectPill label="Work type" options={WORK_TYPE_OPTIONS} values={filters.job_types} onChange={(v) => onApplyFilters({ job_types: v })} />
        <Autocomplete
          className="w-[141px] sm:w-[221px]"
          value={cityFilter}
          onChange={handleCitySelect}
          onSearch={searchCities}
          options={cityResults}
          placeholder="Enter location"
          icon={<MapPin className="size-3.5 shrink-0 text-white/45" />}
          getInputLabel={formatCity}
          renderOption={(city) => (
            <>
              <MapPin className="size-3.5 shrink-0 text-white/45" />
              {formatCity(city)}
            </>
          )}
          inputClassName="h-auto rounded-full border-glass-border py-2 text-xs font-medium text-white placeholder:text-white/45 sm:py-3 sm:text-[13px]"
        />
      </div>

      {/* Applied filter chips */}
      <AppliedFilters chips={appliedChips} onClear={clearAll} />

      {/* Profile completion banner */}
      {isAuthenticated && profileBanner && (
        <div className="flex flex-col gap-3 rounded-2xl border border-glass-border bg-white/[0.04] p-4 sm:flex-row sm:items-center sm:gap-5 sm:rounded-[20px] sm:p-6">
          <div className="flex flex-1 flex-col gap-3">
            <p className="text-[13px] font-semibold text-white sm:text-[15px]">{profileBanner.text}</p>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
              <div className="h-full rounded-full bg-neon-cyan" style={{ width: `${profileBanner.percent}%` }} />
            </div>
          </div>
          <button
            onClick={() => router.push("/profile/edit")}
            className="shrink-0 self-start text-[13px] font-bold text-neon-cyan transition-opacity hover:opacity-80 sm:self-auto sm:text-sm"
          >
            Complete Profile
          </button>
        </div>
      )}
    </div>
  );
}

function TabButton({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex flex-col items-center justify-center px-3 py-2 sm:px-5 sm:py-2.5">
      <span className={`text-sm font-semibold transition-colors sm:text-[15px] ${active ? "text-white" : "text-white/50 hover:text-white/80"}`}>{label}</span>
      <span className={`mt-1 h-0.5 w-full rounded-full ${active ? "bg-neon-cyan" : "bg-transparent"}`} />
    </button>
  );
}
