import { JobGrid, JobsBrowseHeader, MatchEmptyState, MatchSection, SearchFilters, useJobBrowseFilters } from "@/components/job/jobBrowseShared";
import { SmartMatchesSkeleton } from "@/components/job/jobSkeletons";
import { SkillsModal } from "@/components/profile/modals/SkillsModal";
import { useAuth } from "@/contexts/AuthContext";
import { useMatchTiersQuery } from "@/features/api/jobsApi";
import { hasCareerGoal } from "@/lib/careerGoal";
import { MATCH_TIER } from "@/lib/matchTiers";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Layout from "../../layout";

// Re-exported so other jobs pages can keep importing the type from this route.
export type { SearchFilters };

const SmartMatches = () => {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { searchInput, setSearchInput, filters, applyFilters, discoverArgs, cityFilter, setCityFilter, commitSearch } = useJobBrowseFilters();
  const { data, isLoading } = useMatchTiersQuery(discoverArgs, { skip: !isAuthenticated });
  const [skillsOpen, setSkillsOpen] = useState(false);

  useEffect(() => {
    if (authLoading || isAuthenticated) return;
    void router.replace("/jobs/all");
  }, [authLoading, isAuthenticated, router]);

  const ready = data?.ready ?? [];
  const almost = data?.almost ?? [];
  const growth = data?.growth ?? [];
  const shown = ready.length + almost.length + growth.length;
  const total = data ? data.readyTotal + data.almostTotal + (data.growthTotal ?? 0) : undefined;

  const openJob = (id: string | number) => router.push(`/jobs/${id}`);

  if (authLoading || !isAuthenticated) {
    return (
      <Layout activeSection={"jobs"}>
        <div className="mx-auto w-full max-w-[1400px] px-4 py-6 text-white sm:px-6 sm:py-8 md:px-12">
          <SmartMatchesSkeleton />
        </div>
      </Layout>
    );
  }

  return (
    <Layout activeSection={"jobs"}>
      <div className="mx-auto w-full max-w-[1400px] px-4 py-6 text-white sm:px-6 sm:py-8 md:px-12">
        <JobsBrowseHeader
          activeTab="smart-matches"
          query={searchInput}
          setQuery={setSearchInput}
          onSearch={commitSearch}
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
                  <MatchEmptyState tier="strong" />
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
                  <MatchEmptyState tier="almost" />
                )}
              </MatchSection>

              <MatchSection
                dotColor={MATCH_TIER.growth.dotColor}
                title={MATCH_TIER.growth.title}
                subtitle={MATCH_TIER.growth.subtitle}
                viewAllHref={growth.length > 0 ? MATCH_TIER.growth.href : undefined}
              >
                {growth.length > 0 ? (
                  <JobGrid jobs={growth} onOpen={openJob} />
                ) : (
                  <MatchEmptyState tier="growth" />
                )}
              </MatchSection>
            </>
          )}
        </div>
      </div>
      <SkillsModal open={skillsOpen} onClose={() => setSkillsOpen(false)} />
    </Layout>
  );
};

export default SmartMatches;
