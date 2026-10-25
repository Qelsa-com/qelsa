import { JobGrid, JobsBrowseHeader, MatchSection, SearchFilters, useJobBrowseFilters } from "@/components/job/jobBrowseShared";
import { SmartMatchesSkeleton } from "@/components/job/jobSkeletons";
import { SkillsModal } from "@/components/profile/modals/SkillsModal";
import { SetupBanner } from "@/components/SetupBanner";
import { useAuth } from "@/contexts/AuthContext";
import { useMatchTiersQuery } from "@/features/api/jobsApi";
import { useGetMyResumesQuery } from "@/features/api/resumeApi";
import { hasCareerGoal } from "@/lib/careerGoal";
import { GOAL_MATCH, MATCH_TIER } from "@/lib/matchTiers";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Layout from "../../layout";

// Re-exported so other jobs pages can keep importing the type from this route.
export type { SearchFilters };

const SmartMatches = () => {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { searchInput, setSearchInput, filters, applyFilters, discoverArgs, cityFilter, setCityFilter, commitSearch, hydrated } = useJobBrowseFilters();
  const { data, isLoading } = useMatchTiersQuery(discoverArgs, { skip: !isAuthenticated || !hydrated });
  const { data: myResumes } = useGetMyResumesQuery(undefined, { skip: !isAuthenticated });
  const hasResume = Boolean(myResumes && myResumes.length > 0);
  const hasProfile = Boolean(user?.has_profile || user?.headline?.trim() || user?.professional_summary?.trim() || user?.about?.trim());
  const profileStarted = hasProfile || hasResume;
  const goalReady = hasCareerGoal(user?.career_goal);
  const setupComplete = profileStarted && goalReady;
  const goalMode = data?.matchMode === "goal";
  const [skillsOpen, setSkillsOpen] = useState(false);

  useEffect(() => {
    if (authLoading || isAuthenticated) return;
    void router.replace("/jobs/all");
  }, [authLoading, isAuthenticated, router]);

  const ready = data?.ready ?? [];
  const almost = data?.almost ?? [];
  const growth = data?.growth ?? [];
  const goalMatches = data?.goalMatches ?? [];
  const goalTotal = data?.goalTotal ?? 0;

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
          suppressGoalBanner
        />

        <div className="mt-6 flex flex-col gap-6 sm:mt-10 sm:gap-8 pb-16 sm:pb-24">
          {isLoading || data === undefined ? (
            <SmartMatchesSkeleton />
          ) : !setupComplete && !goalMode ? (
            <div className="flex flex-col gap-3">
              {!profileStarted && (
                <SetupBanner
                  title={goalReady ? "Set up your profile" : "1. Set up your profile"}
                  description="Add your resume, experience, and skills so Qelsa can score your fit."
                  actionLabel="Set up profile"
                  onAction={() => router.push("/profile")}
                />
              )}
              {!goalReady && (
                <SetupBanner
                  title={profileStarted ? "Set your career goal" : "2. Set your career goal"}
                  description="Tell Qelsa the role you're aiming for and we'll rank open roles against it."
                  actionLabel="Set goal"
                  onAction={() => router.push("/goals")}
                />
              )}
            </div>
          ) : goalMode ? (
            <>
              {!profileStarted && (
                <SetupBanner
                  title="Set up your profile"
                  description="Add your resume, education, experience, and skills. A fuller profile unlocks readiness scores."
                  actionLabel="Set up profile"
                  onAction={() => router.push("/profile")}
                />
              )}

              <MatchSection dotColor={GOAL_MATCH.dotColor} title={GOAL_MATCH.title} subtitle={goalTotal > goalMatches.length ? `${GOAL_MATCH.subtitle} Showing the top ${goalMatches.length} of ${goalTotal} roles.` : GOAL_MATCH.subtitle}>
                {goalMatches.length > 0 ? (
                  <JobGrid jobs={goalMatches} onOpen={openJob} variant="goal" />
                ) : (
                  <MatchSectionEmpty message="No goal matches yet. Roles aligned to your goal will show here." />
                )}
              </MatchSection>
            </>
          ) : (
            <>
              {!goalReady && (
                <SetupBanner
                  title="Set your career goal"
                  description="Tell Qelsa the role you're aiming for and we'll rank open roles against it."
                  actionLabel="Set goal"
                  onAction={() => router.push("/goals")}
                />
              )}

              <MatchSection dotColor={MATCH_TIER.ready.dotColor} title={MATCH_TIER.ready.title} subtitle={MATCH_TIER.ready.subtitle} viewAllHref={ready.length > 0 ? MATCH_TIER.ready.href : undefined}>
                {ready.length > 0 ? <JobGrid jobs={ready} onOpen={openJob} variant="smart" /> : <MatchSectionEmpty message="No strong matches yet. Roles where you're an 80%+ match will show here." />}
              </MatchSection>

              <MatchSection dotColor={MATCH_TIER.almost.dotColor} title={MATCH_TIER.almost.title} subtitle={MATCH_TIER.almost.subtitle} viewAllHref={almost.length > 0 ? MATCH_TIER.almost.href : undefined}>
                {almost.length > 0 ? <JobGrid jobs={almost} onOpen={openJob} variant="smart" /> : <MatchSectionEmpty message="Nothing here yet. Roles close to 80% match will show here." />}
              </MatchSection>

              <MatchSection dotColor={MATCH_TIER.growth.dotColor} title={MATCH_TIER.growth.title} subtitle={MATCH_TIER.growth.subtitle} viewAllHref={growth.length > 0 ? MATCH_TIER.growth.href : undefined}>
                {growth.length > 0 ? <JobGrid jobs={growth} onOpen={openJob} variant="smart" /> : <MatchSectionEmpty message="Nothing here yet. Roles beyond your current profile will show here." />}
              </MatchSection>
            </>
          )}
        </div>
      </div>
      <SkillsModal open={skillsOpen} onClose={() => setSkillsOpen(false)} />
    </Layout>
  );
};

function MatchSectionEmpty({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-white/[0.15] bg-white/[0.015] px-5 py-5 text-sm leading-relaxed text-white/55">
      {message}
    </div>
  );
}

export default SmartMatches;
