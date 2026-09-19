"use client";

/**
 * In Progress tab of the job tracker — applications the seeker has started but
 * not yet submitted.
 *
 * Figma: Qelsa-Screen — in progress jobs (649:2727).
 */

import { MyJobsHeader, TrackedJobCard } from "@/components/job/myJobsShared";
import { TrackedJobsListSkeleton } from "@/components/job/jobSkeletons";
import { useGetInProgressJobsQuery } from "@/features/api/jobsApi";
import Layout from "@/layout";
import { Job } from "@/types/job";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

const InProgress = () => {
  const router = useRouter();

  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");

  const { data = [], isLoading } = useGetInProgressJobsQuery();
  const rawJobs: Job[] = data ?? [];

  const jobs = useMemo(() => {
    if (!search) return rawJobs;
    const q = search.toLowerCase();
    return rawJobs.filter((job) => {
      const title = (job.job_title?.name ?? job.title ?? "").toLowerCase();
      const company = (job.company_name ?? job.page?.name ?? "").toLowerCase();
      return title.includes(q) || company.includes(q);
    });
  }, [rawJobs, search]);

  useEffect(() => {
    const timer = setTimeout(() => setSearch(query.trim()), 350);
    return () => clearTimeout(timer);
  }, [query]);

  return (
    <Layout activeSection={"jobs"}>
      <div className="mx-auto w-full max-w-[1400px] px-6 py-8 text-white md:px-12">
        <MyJobsHeader
          activeTab="in_progress"
          query={query}
          setQuery={setQuery}
          onSearch={() => setSearch(query.trim())}
          searchPlaceholder="Search jobs by title, skill, or company..."
        />

        <div className="flex flex-col gap-5 pt-6 pb-24">
          {isLoading ? (
            <TrackedJobsListSkeleton />
          ) : jobs.length === 0 ? (
            <p className="text-sm text-white/45">Nothing in progress. Applications you start will show up here.</p>
          ) : (
            <>
              {jobs.map((job) => (
                <TrackedJobCard key={job.id} job={job} actionLabel="Continue" onAction={() => router.push(`/jobs/${job.id}`)} />
              ))}
              <p className="pt-8 text-center text-sm text-white/45">
                Showing 1-{jobs.length} of {jobs.length} applications
              </p>
            </>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default InProgress;
