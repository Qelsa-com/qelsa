"use client";

/**
 * In Progress tab of the job tracker — applications the seeker has started but
 * not yet submitted.
 *
 * Figma: Qelsa-Screen — in progress jobs (649:2727).
 */

import { MyJobsHeader, TrackedJobCard } from "@/components/job/myJobsShared";
import { useLazyGetInProgressJobsQuery } from "@/features/api/jobsApi";
import Layout from "@/layout";
import { Job } from "@/types/job";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const InProgress = () => {
  const router = useRouter();

  const [jobs, setJobs] = useState<Job[]>([]);
  const [query, setQuery] = useState("");

  const [triggerGetJobs, { isLoading }] = useLazyGetInProgressJobsQuery();

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

  return (
    <Layout activeSection={"jobs"}>
      <div className="mx-auto w-full max-w-[1400px] px-6 py-8 text-white md:px-12">
        <MyJobsHeader
          activeTab="in_progress"
          subtitle="Monitor progress and next steps for your active applications"
          query={query}
          setQuery={setQuery}
          onSearch={() => runSearch(query)}
          stats={[{ label: "In Progress", value: jobs.length }]}
          counts={{ in_progress: jobs.length }}
        />

        <div className="flex flex-col gap-5 pt-6 pb-24">
          {isLoading ? (
            <p className="text-sm text-white/45">Loading applications...</p>
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
