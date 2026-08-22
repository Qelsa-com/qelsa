import { JobCard, JobsBrowseHeader, SearchFilters, toDiscoverArgs } from "@/components/job/jobBrowseShared";
import { JOBS_PAGE_SIZE, JobsFeedPager } from "@/components/job/JobsFeedPager";
import { AllJobsGridSkeleton } from "@/components/job/jobSkeletons";
import { usePaginatedJobsQuery } from "@/features/api/jobsApi";
import { City } from "@/types/city";
import { Job } from "@/types/job";
import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import Layout from "../../layout";

/* --------------------------------- page ----------------------------------- */

const All = () => {
  const router = useRouter();

  const [query, setQuery] = useState("");
  const [cityFilter, setCityFilter] = useState<City | null>(null);

  const [filters, setFilters] = useState<SearchFilters>({
    cities: [],
    job_types: [],
    experience_levels: [],
    departments: [],
    workplace_types: [],
    sort_by: "relevance",
    date_posted: "",
  });

  // Debounce the search box so each keystroke doesn't restart the pagination.
  const [searchInput, setSearchInput] = useState("");
  useEffect(() => {
    const t = setTimeout(() => setQuery(searchInput), 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  // Reactive paginated query — Convex caches each loaded page and reuses them
  // across filter/search changes, so we never refetch the whole set.
  const discoverArgs = useMemo(() => toDiscoverArgs(filters, query), [filters, query]);
  const { results, status, isLoading, loadMore } = usePaginatedJobsQuery(discoverArgs, JOBS_PAGE_SIZE);
  const jobs = (results as Job[]) ?? [];
  const total = jobs.length;
  const canLoadMore = status === "CanLoadMore";

  const applyFilters = (partial: Partial<SearchFilters>) => {
    setFilters((prev) => ({ ...prev, ...partial }));
  };

  const isInitialLoading = isLoading && total === 0;

  return (
    <Layout activeSection={"jobs"}>
      <div className="mx-auto w-full max-w-[1400px] px-4 py-6 text-white sm:px-6 sm:py-8 md:px-12">
        <JobsBrowseHeader activeTab="all" query={searchInput} setQuery={setSearchInput} onSearch={() => setQuery(searchInput)} filters={filters} onApplyFilters={applyFilters} cityFilter={cityFilter} setCityFilter={setCityFilter} />

        {/* ----------------------------- All jobs ------------------------------ */}
        <div className="mt-6 flex flex-col gap-4 pb-16 sm:mt-10 sm:gap-6 sm:pb-24">
          {isInitialLoading ? (
            <AllJobsGridSkeleton />
          ) : total > 0 ? (
            <>
              <p className="text-[13px] text-white/45 sm:text-sm">
                Showing {total} job{total === 1 ? "" : "s"}
                {canLoadMore || status === "LoadingMore" ? " (more available)" : ""}
              </p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
                {jobs.map((job) => (
                  <JobCard key={job.id} job={job} onClick={() => router.push(`/jobs/${job.id}`)} />
                ))}
              </div>
            </>
          ) : status === "Exhausted" ? (
            <div className="flex flex-col items-center gap-4 py-12 text-center sm:py-16">
              <div className="flex size-16 items-center justify-center rounded-full border border-glass-border bg-white/[0.04] sm:size-20">
                <Search className="size-7 text-white/45 sm:size-9" />
              </div>
              <p className="text-lg font-semibold text-white sm:text-xl">No jobs found</p>
              <p className="max-w-md text-[13px] text-white/70 sm:text-sm">Try adjusting your search or filters to find more opportunities.</p>
            </div>
          ) : null}

          <JobsFeedPager status={status} loadMore={loadMore} loadedCount={total} />
        </div>
      </div>
    </Layout>
  );
};

export default All;
