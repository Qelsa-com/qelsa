import { JobCard, JobsBrowseHeader, matchScore, SearchFilters, toDiscoverArgs } from "@/components/job/jobBrowseShared";
import { JOBS_PAGE_SIZE, JobsFeedPager } from "@/components/job/JobsFeedPager";
import { SmartMatchesSkeleton } from "@/components/job/jobSkeletons";
import { useCountJobsQuery, usePaginatedJobsQuery } from "@/features/api/jobsApi";
import { City } from "@/types/city";
import { Job } from "@/types/job";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import Layout from "../../layout";

// Re-exported so /jobs/all and /jobs/my-jobs/* keep importing the type from here.
export type { SearchFilters };

/* -------------------------------- tiers ----------------------------------- */

const READY_MIN = 85; // "Ready Now" — strong matches, go-time.
const ALMOST_MIN = 70; // "Almost There" — close, fill gaps to boost.

type ExploreTab = "moving_fast" | "just_posted" | "easy_apply" | "apps_lt_10" | "following" | "top_scored";

const EXPLORE_TABS: { id: ExploreTab; label: string }[] = [
  { id: "moving_fast", label: "Moving Fast" },
  { id: "just_posted", label: "Just Posted" },
  { id: "easy_apply", label: "Easy Apply" },
  { id: "apps_lt_10", label: "Apps < 10" },
  { id: "following", label: "Companies You Follow" },
  { id: "top_scored", label: "Top Scored Roles" },
];

function postedTime(job: Job): number {
  const raw = job.published_date ?? job.createdAt;
  const t = raw ? new Date(raw).getTime() : NaN;
  return Number.isNaN(t) ? 0 : t;
}

function applyExploreTab(jobs: Job[], tab: ExploreTab): Job[] {
  switch (tab) {
    case "moving_fast":
      return [...jobs].sort((a, b) => (a.application_count ?? a.applications?.length ?? 0) - (b.application_count ?? b.applications?.length ?? 0));
    case "just_posted":
      return [...jobs].sort((a, b) => postedTime(b) - postedTime(a));
    case "easy_apply":
      return jobs.filter((j) => j.isQuickApplyAvailable || !j.application_url);
    case "apps_lt_10":
      return jobs.filter((j) => (j.application_count ?? j.applications?.length ?? 0) < 10);
    case "following":
      // No "followed companies" signal on discover jobs yet — show all for now.
      return jobs;
    case "top_scored":
      return [...jobs].sort((a, b) => (matchScore(b) ?? -1) - (matchScore(a) ?? -1));
    default:
      return jobs;
  }
}

/* --------------------------------- page ----------------------------------- */

const SmartMatches = () => {
  const router = useRouter();

  const [query, setQuery] = useState("");
  const [cityFilter, setCityFilter] = useState<City | null>(null);
  const [exploreTab, setExploreTab] = useState<ExploreTab>("moving_fast");

  const [filters, setFilters] = useState<SearchFilters>({
    cities: [],
    job_types: [],
    experience_levels: [],
    departments: [],
    workplace_types: [],
    sort_by: "relevance",
    date_posted: "",
  });

  // Debounce search so each keystroke doesn't restart pagination.
  const [searchInput, setSearchInput] = useState("");
  useEffect(() => {
    const t = setTimeout(() => setQuery(searchInput), 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  // Reactive paginated feed — pages are cached by the Convex client.
  const discoverArgs = useMemo(() => toDiscoverArgs(filters, query), [filters, query]);
  const { results, status, isLoading, loadMore } = usePaginatedJobsQuery(discoverArgs, JOBS_PAGE_SIZE);
  const { data: filteredTotal } = useCountJobsQuery(discoverArgs);
  const jobs = (results as Job[]) ?? [];
  const total = typeof filteredTotal === "number" ? filteredTotal : undefined;

  const applyFilters = (partial: Partial<SearchFilters>) => {
    setFilters((prev) => ({ ...prev, ...partial }));
  };

  // Bucket jobs into match tiers; unscored jobs fall through to "Explore More".
  const { ready, almost, explore } = useMemo(() => {
    const ready: Job[] = [];
    const almost: Job[] = [];
    const explore: Job[] = [];
    for (const job of jobs) {
      const score = matchScore(job);
      if (score != null && score >= READY_MIN) ready.push(job);
      else if (score != null && score >= ALMOST_MIN) almost.push(job);
      else explore.push(job);
    }
    return { ready, almost, explore };
  }, [jobs]);

  const exploreJobs = useMemo(() => applyExploreTab(explore, exploreTab), [explore, exploreTab]);

  const openJob = (id: string | number) => router.push(`/jobs/${id}`);
  const missingTiers = ready.length === 0 && almost.length === 0;

  return (
    <Layout activeSection={"jobs"}>
      <div className="mx-auto w-full max-w-[1400px] px-4 py-6 text-white sm:px-6 sm:py-8 md:px-12">
        <JobsBrowseHeader
          activeTab="smart_matches"
          query={searchInput}
          setQuery={setSearchInput}
          onSearch={() => setQuery(searchInput)}
          filters={filters}
          onApplyFilters={applyFilters}
          cityFilter={cityFilter}
          setCityFilter={setCityFilter}
          resultsCount={{ loaded: jobs.length, total }}
        />

        {/* ---------------------------- Job sections --------------------------- */}
        <div className="mt-6 flex flex-col gap-12 pb-16 sm:mt-12 sm:gap-16 sm:pb-24">
          {isLoading && jobs.length === 0 ? (
            <SmartMatchesSkeleton />
          ) : jobs.length === 0 && status === "Exhausted" ? (
            <p className="text-[13px] text-white/45 sm:text-sm">No matches found. Try adjusting your search or filters.</p>
          ) : jobs.length > 0 ? (
            <>
              {ready.length > 0 && (
                <MatchSection dotColor="#10b981" title="Ready Now" subtitle="These roles match your experience. It's go time for these roles.">
                  <JobGrid jobs={ready} onOpen={openJob} />
                </MatchSection>
              )}

              {almost.length > 0 && (
                <MatchSection dotColor="#f59e0b" title="Almost There" subtitle="Close to 80% match - stand out! Fill gaps to boost these roles.">
                  <JobGrid jobs={almost} onOpen={openJob} />
                </MatchSection>
              )}

              {explore.length > 0 && (
                <div className="flex flex-col gap-4 sm:gap-8">
                  <div className="flex flex-col gap-1 sm:gap-2">
                    <h2 className="text-xl font-bold text-white sm:text-2xl">Explore More</h2>
                    <p className="text-[13px] text-white/45 sm:text-sm">{missingTiers ? "Roles across your interests — complete your profile to unlock tailored match tiers." : "More roles to explore across your interests."}</p>
                  </div>

                  {/* Sub-tabs */}
                  <div className="flex flex-wrap gap-x-4 gap-y-0 border-b border-glass-border sm:gap-8">
                    {EXPLORE_TABS.map((t) => {
                      const active = t.id === exploreTab;
                      return (
                        <button
                          key={t.id}
                          onClick={() => setExploreTab(t.id)}
                          className={`-mb-px whitespace-nowrap border-b-2 py-2 text-[13px] font-semibold transition-colors sm:py-3 sm:text-sm ${
                            active ? "border-neon-cyan text-white" : "border-transparent text-white/45 hover:text-white/70"
                          }`}
                        >
                          {t.label}
                        </button>
                      );
                    })}
                  </div>

                  {exploreJobs.length > 0 ? <JobGrid jobs={exploreJobs} onOpen={openJob} /> : <p className="text-[13px] text-white/45 sm:text-sm">No roles in this view right now.</p>}
                </div>
              )}
            </>
          ) : null}

          <JobsFeedPager status={status} loadMore={loadMore} loadedCount={jobs.length} moreLabel="Load more matches" doneLabel="You're all caught up." />
        </div>
      </div>
    </Layout>
  );
};

/* ------------------------------ sub-components ----------------------------- */

function MatchSection({ dotColor, title, subtitle, children }: { dotColor: string; title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      <div className="flex flex-col gap-1 sm:gap-2">
        <div className="flex items-center gap-2 sm:gap-3">
          <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: dotColor }} />
          <h2 className="text-xl font-bold text-white sm:text-2xl">{title}</h2>
        </div>
        <p className="text-[13px] text-white/45 sm:text-sm">{subtitle}</p>
      </div>
      {children}
    </div>
  );
}

function JobGrid({ jobs, onOpen }: { jobs: Job[]; onOpen: (id: string | number) => void }) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">
      {jobs.map((job) => (
        <JobCard key={job.id} job={job} onClick={() => onOpen(job.id)} />
      ))}
    </div>
  );
}

export default SmartMatches;
