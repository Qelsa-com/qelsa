import { JobGrid, JobsBrowseHeader, useJobBrowseFilters } from "@/components/job/jobBrowseShared";
import { JOBS_PAGE_SIZE, JobsFeedPager } from "@/components/job/JobsFeedPager";
import { AllJobsGridSkeleton } from "@/components/job/jobSkeletons";
import { SetupBanner } from "@/components/SetupBanner";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { useCountJobsQuery, usePaginatedJobsQuery } from "@/features/api/jobsApi";
import { useGetMyResumesQuery } from "@/features/api/resumeApi";
import { Job } from "@/types/job";
import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import Layout from "../../layout";

/* --------------------------------- page ----------------------------------- */

function AllJobsLoading() {
  return (
    <div className="mx-auto w-full max-w-[1400px] px-4 py-6 text-white sm:px-6 sm:py-8 md:px-12">
      <div className="space-y-3">
        <Skeleton className="h-9 w-64 rounded-lg bg-white/[0.08]" />
        <Skeleton className="h-4 w-80 max-w-full rounded bg-white/[0.06]" />
        <Skeleton className="mt-5 h-11 w-full rounded-xl bg-white/[0.06] sm:h-14 sm:rounded-[28px]" />
      </div>
      <div className="mt-8">
        <AllJobsGridSkeleton />
      </div>
    </div>
  );
}

function AllJobsContent() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const defaultSort = isAuthenticated ? "relevance" : "date";
  const { searchInput, setSearchInput, filters, applyFilters, discoverArgs, cityFilter, setCityFilter, commitSearch, hydrated } = useJobBrowseFilters(undefined, defaultSort, isAuthenticated);
  const { results, status, isLoading, loadMore } = usePaginatedJobsQuery(discoverArgs, JOBS_PAGE_SIZE, { skip: !hydrated });
  const { data: filteredTotal } = useCountJobsQuery(discoverArgs, { skip: !hydrated });
  const { data: myResumes } = useGetMyResumesQuery(undefined, { skip: !isAuthenticated });
  const hasResume = Boolean(myResumes && myResumes.length > 0);
  const hasProfile = Boolean(user?.has_profile || user?.headline?.trim() || user?.professional_summary?.trim() || user?.about?.trim());
  const showResumeBanner = isAuthenticated && myResumes !== undefined && !hasResume;

  const jobs = (results as Job[]) ?? [];
  const loaded = jobs.length;
  const total = typeof filteredTotal === "number" ? filteredTotal : undefined;
  const isInitialLoading = isLoading && loaded === 0;

  return (
    <div className="mx-auto w-full max-w-[1400px] px-4 py-6 text-white sm:px-6 sm:py-8 md:px-12">
      <JobsBrowseHeader
          activeTab="all"
          query={searchInput}
          setQuery={setSearchInput}
          onSearch={commitSearch}
          filters={filters}
          onApplyFilters={applyFilters}
          cityFilter={cityFilter}
          setCityFilter={setCityFilter}
          resultsCount={{ loaded, total }}
          suppressGoalBanner
          defaultSort={defaultSort}
        />

        {/* ----------------------------- All jobs ------------------------------ */}
        <div className="mt-6 flex flex-col gap-4 pb-16 sm:mt-10 sm:gap-6 sm:pb-24">
          {showResumeBanner && (
            <SetupBanner
              title={hasProfile ? "Upload your resume" : "Discover your readiness for every role"}
              description={
                hasProfile
                  ? "Upload a resume to easily apply to jobs and manage your application materials."
                  : "Upload your resume and Qelsa will build your profile to show how well your skills and experience align with different roles, and where you can improve."
              }
              actionLabel="Set up profile"
              onAction={() => router.push("/profile")}
            />
          )}
          {isInitialLoading ? (
            <AllJobsGridSkeleton />
          ) : loaded > 0 ? (
            <>
              <JobGrid jobs={jobs} onOpen={(id) => router.push(`/jobs/${id}`)} variant="all" />
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

          <JobsFeedPager status={status} loadMore={loadMore} loadedCount={loaded} />
        </div>
    </div>
  );
}

const All = () => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const authBootstrapping = isLoading && !user;
  return (
    <Layout activeSection="jobs">
      {authBootstrapping ? (
        <AllJobsLoading />
      ) : (
        <AllJobsContent key={isAuthenticated ? "signed-in" : "guest"} />
      )}
    </Layout>
  );
};

export default All;
