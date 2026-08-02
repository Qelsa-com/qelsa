"use client";

/**
 * Saved tab of the job tracker — bookmarked roles the seeker hasn't started
 * applying to yet.
 *
 * Figma: Qelsa-Screen — saved jobs (649:2560).
 */

import { MyJobsHeader, TrackedJobCard } from "@/components/job/myJobsShared";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useLazyGetSavedJobsQuery, useToggleSaveJobMutation } from "@/features/api/jobsApi";
import Layout from "@/layout";
import { Job } from "@/types/job";
import { Archive, Eye, MoreVertical, Share2, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const Saved = () => {
  const router = useRouter();
  const [toggleSaveJob] = useToggleSaveJobMutation();

  const [jobs, setJobs] = useState<Job[]>([]);
  const [query, setQuery] = useState("");

  const [triggerGetJobs, { isLoading }] = useLazyGetSavedJobsQuery();

  const runSearch = async (nextQuery: string) => {
    try {
      const result = await triggerGetJobs({ search: nextQuery }, false).unwrap();
      setJobs(result ?? []);
    } catch {
      setJobs([]);
    }
  };

  useEffect(() => {
    runSearch(query);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openJob = (id: number) => router.push(`/jobs/${id}`);

  return (
    <Layout activeSection={"jobs"}>
      <div className="mx-auto w-full max-w-[1400px] px-6 py-8 text-white md:px-12">
        <MyJobsHeader
          activeTab="saved"
          subtitle="Monitor your job applications and stay on top of your career moves"
          query={query}
          setQuery={setQuery}
          onSearch={() => runSearch(query)}
          searchPlaceholder="Search applications by company or role..."
          stats={[{ label: "Saved Jobs", value: jobs.length }]}
          counts={{ saved: jobs.length }}
        />

        <div className="flex flex-col gap-5 pt-6 pb-24">
          {isLoading ? (
            <p className="text-sm text-white/45">Loading saved jobs...</p>
          ) : jobs.length === 0 ? (
            <p className="text-sm text-white/45">Nothing saved yet. Bookmark a role and it will show up here.</p>
          ) : (
            <>
              {jobs.map((job) => (
                <TrackedJobCard
                  key={job.id}
                  job={job}
                  actionLabel="Apply now"
                  onAction={() => openJob(job.id)}
                  menu={
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="rounded-lg p-1 text-white/60 transition-colors hover:bg-white/5 hover:text-white" aria-label="Saved job actions">
                          <MoreVertical className="size-5" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="glass border-glass-border">
                        <DropdownMenuItem onClick={() => openJob(job.id)}>
                          <Eye className="mr-2 size-4" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Share2 className="mr-2 size-4" />
                          Share
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Archive className="mr-2 size-4" />
                          Archive
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive" onClick={() => toggleSaveJob(job.id)}>
                          <Trash2 className="mr-2 size-4" />
                          Remove
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  }
                />
              ))}
              <p className="pt-8 text-center text-sm text-white/45">
                Showing 1-{jobs.length} of {jobs.length} saved jobs
              </p>
            </>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Saved;
