import { JobGrid, JobsBrowseHeader, ResumePromptBanner, useJobBrowseFilters } from "@/components/job/jobBrowseShared";
import { JOBS_PAGE_SIZE, JobsFeedPager } from "@/components/job/JobsFeedPager";
import { AllJobsGridSkeleton } from "@/components/job/jobSkeletons";
import { ResumeCreateProfileModal } from "@/components/profile/ResumeCreateProfileModal";
import { useAuth } from "@/contexts/AuthContext";
import { useCountJobsQuery, usePaginatedJobsQuery } from "@/features/api/jobsApi";
import { useGetMyResumesQuery } from "@/features/api/resumeApi";
import { Job } from "@/types/job";
import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import Layout from "../../layout";

/* --------------------------------- page ----------------------------------- */

const All = () => {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const { searchInput, setSearchInput, filters, applyFilters, discoverArgs, cityFilter, setCityFilter, commitSearch } = useJobBrowseFilters();
  const { results, status, isLoading, loadMore } = usePaginatedJobsQuery(discoverArgs, JOBS_PAGE_SIZE);
  const { data: filteredTotal } = useCountJobsQuery(discoverArgs);
  const { data: myResumes } = useGetMyResumesQuery(undefined, { skip: !isAuthenticated });
  const hasResume = Boolean(myResumes && myResumes.length > 0);
  const hasProfile = Boolean(
    user?.has_profile ||
    user?.headline?.trim() ||
    user?.professional_summary?.trim() ||
    user?.about?.trim()
  );
  const showResumeBanner = isAuthenticated && myResumes !== undefined && !hasResume && !hasProfile;

  const [createProfileOpen, setCreateProfileOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleStartUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      e.target.value = "";
      setSelectedFile(file);
      setCreateProfileOpen(true);
    }
  };

  const jobs = (results as Job[]) ?? [];
  const loaded = jobs.length;
  const total = typeof filteredTotal === "number" ? filteredTotal : undefined;
  const isInitialLoading = isLoading && loaded === 0;

  return (
    <Layout activeSection={"jobs"}>
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
        />

        {/* ----------------------------- All jobs ------------------------------ */}
        <div className="mt-6 flex flex-col gap-4 pb-16 sm:mt-10 sm:gap-6 sm:pb-24">
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.docx,.doc,.png,.jpg,.jpeg,.webp"
            className="hidden"
            onChange={handleFileChange}
          />
          {showResumeBanner && (
            <ResumePromptBanner
              title="Discover your readiness for every role"
              description="Upload your resume and Qelsa will build your profile to show how well your skills and experience align with different roles, and where you can improve."
              disclaimer="Review and edit your profile before saving. Your resume is just the starting point."
              onUpload={handleStartUpload}
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

      <ResumeCreateProfileModal
        isOpen={createProfileOpen}
        initialFile={selectedFile}
        onClose={() => {
          setCreateProfileOpen(false);
          setSelectedFile(null);
        }}
      />
    </Layout>
  );
};

export default All;
