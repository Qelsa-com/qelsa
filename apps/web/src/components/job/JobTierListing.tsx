import { JobGrid, JobsBrowseHeader, MatchSection, useJobBrowseFilters } from "@/components/job/jobBrowseShared";
import { JOBS_PAGE_SIZE, JobsFeedPager } from "@/components/job/JobsFeedPager";
import { JobCardGridSkeleton } from "@/components/job/jobSkeletons";
import { useCountJobsQuery, usePaginatedJobsQuery } from "@/features/api/jobsApi";
import { MATCH_TIER, type MatchTierId } from "@/lib/matchTiers";
import { Job } from "@/types/job";
import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import Layout from "@/layout";

export function JobTierListing({ tier }: { tier: MatchTierId }) {
  const router = useRouter();
  const meta = MATCH_TIER[tier];
  const { searchInput, setSearchInput, filters, applyFilters, discoverArgs, cityFilter, setCityFilter } = useJobBrowseFilters(tier);
  const { results, status, isLoading, loadMore } = usePaginatedJobsQuery(discoverArgs, JOBS_PAGE_SIZE);
  const { data: filteredTotal } = useCountJobsQuery(discoverArgs);
  const jobs = (results as Job[]) ?? [];
  const loaded = jobs.length;
  const total = typeof filteredTotal === "number" ? filteredTotal : undefined;
  const isInitialLoading = isLoading && loaded === 0;

  return (
    <Layout activeSection={"jobs"}>
      <div className="mx-auto w-full max-w-[1400px] px-4 py-6 text-white sm:px-6 sm:py-8 md:px-12">
        <JobsBrowseHeader
          activeTab="smart-matches"
          query={searchInput}
          setQuery={setSearchInput}
          onSearch={() => undefined}
          filters={filters}
          onApplyFilters={applyFilters}
          cityFilter={cityFilter}
          setCityFilter={setCityFilter}
          resultsCount={{ loaded, total }}
        />

        <div className="mt-6 flex flex-col gap-4 pb-16 sm:mt-12 sm:gap-6 sm:pb-24">
          <MatchSection dotColor={meta.dotColor} title={meta.title} subtitle={meta.subtitle}>
            {isInitialLoading ? (
              <JobCardGridSkeleton count={20} columns={4} />
            ) : loaded > 0 ? (
              <JobGrid jobs={jobs} onOpen={(id) => router.push(`/jobs/${id}`)} />
            ) : status === "Exhausted" ? (
              <div className="flex flex-col items-center gap-4 py-12 text-center sm:py-16">
                <div className="flex size-16 items-center justify-center rounded-full border border-glass-border bg-white/[0.04] sm:size-20">
                  <Search className="size-7 text-white/45 sm:size-9" />
                </div>
                <p className="text-lg font-semibold text-white sm:text-xl">No {meta.title.toLowerCase()} roles</p>
                <p className="max-w-md text-[13px] text-white/70 sm:text-sm">Try adjusting your search or filters, or add more experience to your profile.</p>
              </div>
            ) : null}
          </MatchSection>

          <JobsFeedPager status={status} loadMore={loadMore} loadedCount={loaded} moreLabel="Load more matches" />
        </div>
      </div>
    </Layout>
  );
}
