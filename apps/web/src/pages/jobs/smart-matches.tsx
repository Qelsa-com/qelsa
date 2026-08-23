import { JobGrid, JobsBrowseHeader, MatchEmptyState, MatchSection, SearchFilters, useJobBrowseFilters } from "@/components/job/jobBrowseShared";
import { SmartMatchesSkeleton } from "@/components/job/jobSkeletons";
import { useMatchTiersQuery } from "@/features/api/jobsApi";
import { MATCH_TIER } from "@/lib/matchTiers";
import { useRouter } from "next/navigation";
import Layout from "../../layout";

// Re-exported so other jobs pages can keep importing the type from this route.
export type { SearchFilters };

const SmartMatches = () => {
  const router = useRouter();
  const { searchInput, setSearchInput, filters, applyFilters, discoverArgs, cityFilter, setCityFilter } = useJobBrowseFilters();
  const { data, isLoading } = useMatchTiersQuery(discoverArgs);
  const ready = data?.ready ?? [];
  const almost = data?.almost ?? [];
  const shown = ready.length + almost.length;
  const total = data ? data.readyTotal + data.almostTotal : undefined;

  const openJob = (id: string | number) => router.push(`/jobs/${id}`);

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
          resultsCount={shown > 0 ? { loaded: shown, total } : undefined}
        />

        <div className="mt-6 flex flex-col gap-12 pb-16 sm:mt-12 sm:gap-16 sm:pb-24">
          {isLoading || data === undefined ? (
            <SmartMatchesSkeleton />
          ) : (
            <>
              <MatchSection
                dotColor={MATCH_TIER.ready.dotColor}
                title={MATCH_TIER.ready.title}
                subtitle={MATCH_TIER.ready.subtitle}
                viewAllHref={ready.length > 0 ? MATCH_TIER.ready.href : undefined}
              >
                {ready.length > 0 ? (
                  <JobGrid jobs={ready} onOpen={openJob} />
                ) : (
                  <MatchEmptyState
                    title="No ready matches yet."
                    subtitle="Complete your profile and add more skills to unlock roles that match your experience."
                    actionLabel="Complete Profile"
                    onAction={() => router.push("/profile/edit")}
                  />
                )}
              </MatchSection>

              <MatchSection
                dotColor={MATCH_TIER.almost.dotColor}
                title={MATCH_TIER.almost.title}
                subtitle={MATCH_TIER.almost.subtitle}
                viewAllHref={almost.length > 0 ? MATCH_TIER.almost.href : undefined}
              >
                {almost.length > 0 ? (
                  <JobGrid jobs={almost} onOpen={openJob} />
                ) : (
                  <MatchEmptyState
                    title="No close matches yet."
                    subtitle="Add more skills and experience to surface roles where you're almost there."
                    actionLabel="Update Skills"
                    onAction={() => router.push("/profile/skills")}
                  />
                )}
              </MatchSection>
            </>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default SmartMatches;
