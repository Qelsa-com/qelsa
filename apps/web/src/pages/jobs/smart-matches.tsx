import { GoalSetupBanner } from "@/components/goals/GoalSetupBanner";
import { JobGrid, JobsBrowseHeader, MatchEmptyState, MatchSection, ResumePromptBanner, SearchFilters, useJobBrowseFilters } from "@/components/job/jobBrowseShared";
import { SmartMatchesSkeleton } from "@/components/job/jobSkeletons";
import { SkillsModal } from "@/components/profile/modals/SkillsModal";
import { useAuth } from "@/contexts/AuthContext";
import { useMatchTiersQuery } from "@/features/api/jobsApi";
import { useGetMyResumesQuery } from "@/features/api/resumeApi";
import { hasCareerGoal } from "@/lib/careerGoal";
import { GOAL_MATCH, MATCH_TIER } from "@/lib/matchTiers";
import { Search } from "lucide-react";
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
  const { data: myResumes } = useGetMyResumesQuery(undefined, { skip: !isAuthenticated });
  const hasResume = Boolean(myResumes && myResumes.length > 0);
  const hasProfile = Boolean(
    user?.has_profile ||
    user?.headline?.trim() ||
    user?.professional_summary?.trim() ||
    user?.about?.trim()
  );
  const goalMode = data?.matchMode === "goal";
  // Goal-first users already get an explanation + profile CTAs below; don't
  // stack a second resume banner on top of it.
  const showResumeBanner = isAuthenticated && data !== undefined && myResumes !== undefined && !hasResume && !goalMode;
  const showGoalBanner = isAuthenticated && Boolean(user) && !hasCareerGoal(user?.career_goal);
  const [skillsOpen, setSkillsOpen] = useState(false);

  const handleBannerUpload = () => {
    if (hasProfile) {
      router.push("/profile/edit?section=media");
    } else {
      router.push("/profile");
    }
  };

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
          {showResumeBanner && (
            <ResumePromptBanner
              title={hasProfile ? "Upload your resume" : "No matches yet"}
              description={
                hasProfile
                  ? "Upload a resume to easily apply to jobs and manage your application materials."
                  : "Upload your resume, and Qelsa will match you with the right jobs based on your skills, experience, and career goals."
              }
              disclaimer={
                hasProfile
                  ? "Your resume will be saved to your profile and used for job applications."
                  : "Review and edit everything before it is added to your profile."
              }
              onUpload={handleBannerUpload}
            />
          )}
          {showGoalBanner && (
            <GoalSetupBanner onSetGoal={() => router.push("/goals")} />
          )}

          {isLoading || data === undefined ? (
            <SmartMatchesSkeleton />
          ) : goalMode ? (
            <>
              <div className="flex flex-col gap-3 rounded-2xl border border-neon-cyan/20 bg-neon-cyan/[0.04] p-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-white">Matched to your goal, not your experience yet</p>
                  <p className="mt-1 max-w-2xl text-xs leading-relaxed text-white/50">
                    These roles fit your target role, skills, and industries. Add experience or skills to unlock readiness scores and see how close you are.
                  </p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <button
                    type="button"
                    onClick={() => router.push("/profile/work-experience")}
                    className="rounded-lg border border-neon-cyan/30 bg-neon-cyan/10 px-3 py-1.5 text-xs font-semibold text-neon-cyan transition-colors hover:bg-neon-cyan/15"
                  >
                    Add experience
                  </button>
                  <button
                    type="button"
                    onClick={() => router.push("/profile/skills")}
                    className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-semibold text-white/70 transition-colors hover:border-white/20 hover:text-white"
                  >
                    Add skills
                  </button>
                </div>
              </div>

              <MatchSection
                dotColor={GOAL_MATCH.dotColor}
                title={GOAL_MATCH.title}
                subtitle={
                  goalTotal > goalMatches.length
                    ? `${GOAL_MATCH.subtitle} Showing the top ${goalMatches.length} of ${goalTotal} roles.`
                    : GOAL_MATCH.subtitle
                }
              >
                {goalMatches.length > 0 ? (
                  <JobGrid jobs={goalMatches} onOpen={openJob} variant="goal" />
                ) : (
                  <div className="flex flex-col items-center gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.02] px-6 py-12 text-center">
                    <Search className="size-5 text-white/30" />
                    <p className="text-sm font-semibold text-white">No goal matches yet</p>
                    <p className="max-w-md text-xs leading-relaxed text-white/45">
                      Try broadening your target role or updating your goal. We&apos;ll keep scanning new roles.
                    </p>
                    <button
                      type="button"
                      onClick={() => router.push("/goals")}
                      className="mt-1 rounded-lg border border-neon-cyan/30 bg-neon-cyan/10 px-3 py-1.5 text-xs font-semibold text-neon-cyan transition-colors hover:bg-neon-cyan/15"
                    >
                      Update goal
                    </button>
                  </div>
                )}
              </MatchSection>
            </>
          ) : (
            <>
              <MatchSection
                dotColor={MATCH_TIER.ready.dotColor}
                title={MATCH_TIER.ready.title}
                subtitle={MATCH_TIER.ready.subtitle}
                viewAllHref={ready.length > 0 ? MATCH_TIER.ready.href : undefined}
              >
                {ready.length > 0 ? (
                  <JobGrid jobs={ready} onOpen={openJob} variant="smart" />
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
                  <JobGrid jobs={almost} onOpen={openJob} variant="smart" />
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
                  <JobGrid jobs={growth} onOpen={openJob} variant="smart" />
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
