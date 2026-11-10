import { JobGrid, JobsBrowseHeader, useJobBrowseFilters } from "@/components/job/jobBrowseShared";
import { JOBS_PAGE_SIZE, JobsFeedPager } from "@/components/job/JobsFeedPager";
import { AllJobsGridSkeleton } from "@/components/job/jobSkeletons";
import { Seo } from "@/components/Seo";
import { SetupBanner } from "@/components/SetupBanner";
import { useAuth } from "@/contexts/AuthContext";
import { useCountJobsQuery, useEnsureRankingRecompute, usePaginatedJobsQuery } from "@/features/api/jobsApi";
import { useGetMyResumesQuery } from "@/features/api/resumeApi";
import { api } from "@/lib/convexApi";
import { Job } from "@/types/job";
import { ConvexHttpClient } from "convex/browser";
import type { GetServerSideProps } from "next";
import Link from "next/link";
import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import Layout from "../../layout";

type AllJobsProps = {
  initialJobs?: Job[];
  nextCursor?: string | null;
  serverPage?: boolean;
  indexable?: boolean;
  canonicalPath?: string;
};

const FILTER_KEYS = new Set([
  "q",
  "sort",
  "posted",
  "workplace",
  "type",
  "city",
  "salary_min",
  "salary_max",
  "page",
  "min_readiness",
  "max_readiness",
]);

/**
 * Server-render the first few job links so crawlers do not depend on JavaScript.
 * The interactive list still takes over after hydration; page 2+ uses a real
 * cursor link and is rendered as a simple server list.
 */
export const getServerSideProps: GetServerSideProps<AllJobsProps> = async (ctx) => {
  const query = ctx.query;
  const after = typeof query.after === "string" ? query.after : null;
  const hasFilters = Object.keys(query).some((key) => FILTER_KEYS.has(key));
  if (hasFilters) {
    return { props: { indexable: false, canonicalPath: "/jobs/all" } };
  }

  try {
    const client = new ConvexHttpClient(
      process.env.NEXT_PUBLIC_CONVEX_URL || "http://127.0.0.1:3210",
    );
    const result = (await client.query(api.jobs.listPaginated, {
      paginationOpts: { numItems: 24, cursor: after },
      sort_by: "date",
    })) as {
      page: Job[];
      continueCursor: string;
      isDone: boolean;
    };
    if (!after) {
      ctx.res.setHeader("Cache-Control", "public, s-maxage=60, stale-while-revalidate=300");
    }
    return {
      props: {
        initialJobs: result.page,
        nextCursor: result.isDone ? null : result.continueCursor,
        serverPage: Boolean(after),
        // Paginated cursor pages are crawlable but not competing with the
        // canonical first page in the index.
        indexable: !after,
        canonicalPath: after ? `/jobs/all?after=${encodeURIComponent(after)}` : "/jobs/all",
      },
    };
  } catch (error) {
    console.error("[JobsAll SSR] Could not load initial jobs", error);
    return { props: { indexable: !after, canonicalPath: "/jobs/all" } };
  }
};

/* --------------------------------- page ----------------------------------- */

function AllJobsContent({ initialJobs = [] }: { initialJobs?: Job[] }) {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const defaultSort = isAuthenticated ? "relevance" : "date";
  const { searchInput, setSearchInput, filters, applyFilters, discoverArgs, cityFilter, setCityFilter, commitSearch, hydrated } = useJobBrowseFilters(undefined, defaultSort, isAuthenticated);
  const { results, status, isLoading, loadMore } = usePaginatedJobsQuery(discoverArgs, JOBS_PAGE_SIZE, {
    skip: !hydrated || authLoading,
  });
  // "Best match" reads a whole-catalog cached ranking; make sure one exists.
  useEnsureRankingRecompute(hydrated && isAuthenticated && !authLoading);
  const { data: filteredTotal } = useCountJobsQuery(discoverArgs, { skip: !hydrated || authLoading });
  const { data: myResumes } = useGetMyResumesQuery(undefined, { skip: !isAuthenticated });
  const hasResume = Boolean(myResumes && myResumes.length > 0);
  const hasProfile = Boolean(user?.has_profile || user?.headline?.trim() || user?.professional_summary?.trim() || user?.about?.trim());
  const showResumeBanner = isAuthenticated && myResumes !== undefined && !hasResume;

  const hasFilters = Boolean(
    searchInput.trim() ||
      cityFilter ||
      filters.workplace_types.length ||
      filters.job_types.length ||
      filters.date_posted ||
      filters.salary_min != null ||
      filters.salary_max != null,
  );
  const clientJobs = (results as Job[]) ?? [];
  // The server-rendered page has no user, so its cards cannot carry readiness.
  // Only use it as the guest fallback; showing it while auth resolves is what
  // made the score appear (and the card grow) a beat after paint.
  const fallbackJobs =
    !hasFilters && clientJobs.length === 0 && !authLoading && !isAuthenticated ? initialJobs : [];
  const jobs = clientJobs.length ? clientJobs : fallbackJobs;
  const loaded = jobs.length;
  const total = typeof filteredTotal === "number" ? filteredTotal : undefined;
  const isInitialLoading = authLoading || (isLoading && loaded === 0);

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
            <AllJobsGridSkeleton showScore={isAuthenticated && (hasProfile || hasResume)} />
          ) : loaded > 0 ? (
            <>
              <JobGrid
                jobs={jobs}
                variant="all"
                reserveScore={isAuthenticated && (hasProfile || hasResume)}
              />
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

function ServerJobsPage({
  jobs,
  nextCursor,
}: {
  jobs: Job[];
  nextCursor: string | null;
}) {
  return (
    <div className="mx-auto w-full max-w-[1400px] px-4 py-6 text-white sm:px-6 sm:py-8 md:px-12">
      <Link href="/jobs/all" className="text-xs font-semibold text-white/45 hover:text-white">
        ← All jobs
      </Link>
      <h1 className="mt-4 text-3xl font-extrabold text-white sm:text-4xl md:text-5xl">
        Job opportunities.
      </h1>
      <p className="mt-2 max-w-2xl text-sm text-white/60">
        Browse open roles and see what each one needs before you apply.
      </p>
      <div className="mt-6">
        <JobGrid jobs={jobs} variant="all" />
      </div>
      {nextCursor ? (
        <div className="mt-8 flex justify-center pb-16">
          <Link
            href={`/jobs/all?after=${encodeURIComponent(nextCursor)}`}
            className="rounded-full border border-white/15 bg-white/[0.04] px-5 py-3 text-sm font-semibold text-white/75 transition-colors hover:border-white/30 hover:text-white"
          >
            Next page →
          </Link>
        </div>
      ) : null}
    </div>
  );
}

const All = ({
  initialJobs = [],
  nextCursor = null,
  serverPage = false,
  indexable = true,
  canonicalPath = "/jobs/all",
}: AllJobsProps) => {
  const { isAuthenticated } = useAuth();
  return (
    <Layout activeSection="jobs">
      <Seo
        title="Browse open jobs"
        description="Find roles that match your skills, see what each one needs, and apply when you're ready."
        path={canonicalPath}
        noindex={!indexable}
      />
      {serverPage ? (
        <ServerJobsPage jobs={initialJobs} nextCursor={nextCursor} />
      ) : (
        <>
          <AllJobsContent
            key={isAuthenticated ? "signed-in" : "guest"}
            initialJobs={initialJobs}
          />
          {nextCursor ? (
            <div className="mx-auto w-full max-w-[1400px] px-4 pb-16 sm:px-6 md:px-12">
              <Link
                href={`/jobs/all?after=${encodeURIComponent(nextCursor)}`}
                className="text-xs font-semibold text-white/40 hover:text-white"
              >
                More jobs →
              </Link>
            </div>
          ) : null}
        </>
      )}
    </Layout>
  );
};

export default All;
