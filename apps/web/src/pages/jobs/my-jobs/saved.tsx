"use client";

/**
 * Saved tab of the job tracker — bookmarked roles the seeker hasn't started
 * applying to yet.
 *
 * Figma: Qelsa-Screen — saved jobs (649:2560).
 */

import { MyJobsHeader, TrackedJobCard } from "@/components/job/myJobsShared";
import { TrackedJobsListSkeleton } from "@/components/job/jobSkeletons";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useGetSavedJobsQuery, useToggleSaveJobMutation } from "@/features/api/jobsApi";
import Layout from "@/layout";
import { Job } from "@/types/job";
import { Archive, Eye, MoreVertical, Share2, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const Saved = () => {
  const router = useRouter();
  const [toggleSaveJob] = useToggleSaveJobMutation();

  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");

  const { data = [], isLoading } = useGetSavedJobsQuery(search ? { search } : {});
  const jobs: Job[] = data ?? [];

  useEffect(() => {
    const timer = setTimeout(() => setSearch(query.trim()), 350);
    return () => clearTimeout(timer);
  }, [query]);

  const openJob = (id: string | number) => router.push(`/jobs/${id}`);

  return (
    <Layout activeSection={"jobs"}>
      <div className="mx-auto w-full max-w-[1400px] px-6 py-8 text-white md:px-12">
        <MyJobsHeader
          activeTab="saved"
          query={query}
          setQuery={setQuery}
          onSearch={() => setSearch(query.trim())}
          searchPlaceholder="Search jobs by title, skill, or company..."
        />

        <div className="flex flex-col gap-5 pt-6 pb-24">
          {isLoading ? (
            <TrackedJobsListSkeleton />
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
