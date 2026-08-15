import { City } from "@/types/city";
import { JobCard, JobsBrowseHeader, SearchFilters } from "@/components/job/jobBrowseShared";
import { useOpenQelsaMatch } from "@/features/job/useOpenQelsaMatch";
import { useLazyGetDiscoverJobsQuery } from "@/features/api/jobsApi";
import { Job } from "@/types/job";
import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import Layout from "../../layout";

const PAGE_SIZE = 12;

/* --------------------------------- page ----------------------------------- */

const All = () => {
  const router = useRouter();
  const { open: openMatch, pendingId } = useOpenQelsaMatch();

  const [jobs, setJobs] = useState<Job[]>([]);
  const [query, setQuery] = useState("");
  const [cityFilter, setCityFilter] = useState<City | null>(null);
  const [page, setPage] = useState(1);

  const [filters, setFilters] = useState<SearchFilters>({
    cities: [],
    job_types: [],
    experience_levels: [],
    departments: [],
    workplace_types: [],
    sort_by: "relevance",
  });

  const [triggerGetJobs, { isLoading }] = useLazyGetDiscoverJobsQuery();

  const runSearch = async (nextFilters: SearchFilters, nextQuery: string) => {
    setPage(1);
    try {
      const result = await triggerGetJobs({ ...nextFilters, search: nextQuery }, false).unwrap();
      setJobs((result as Job[]) ?? []);
    } catch {
      setJobs([]);
    }
  };

  useEffect(() => {
    runSearch(filters, query);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const applyFilters = (partial: Partial<SearchFilters>) => {
    const next = { ...filters, ...partial };
    setFilters(next);
    runSearch(next, query);
  };

  const total = jobs.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageJobs = useMemo(() => jobs.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE), [jobs, currentPage]);
  const rangeStart = total === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(currentPage * PAGE_SIZE, total);

  return (
    <Layout activeSection={"jobs"}>
      <div className="mx-auto w-full max-w-[1400px] px-4 py-6 text-white sm:px-6 sm:py-8 md:px-12">
        <JobsBrowseHeader
          activeTab="all"
          query={query}
          setQuery={setQuery}
          onSearch={() => runSearch(filters, query)}
          filters={filters}
          onApplyFilters={applyFilters}
          cityFilter={cityFilter}
          setCityFilter={setCityFilter}
          profileBanner={{ text: "Completing your profile could unlock more strongly-matched roles", percent: 70 }}
        />

        {/* ----------------------------- All jobs ------------------------------ */}
        <div className="mt-6 flex flex-col gap-4 pb-16 sm:mt-10 sm:gap-6 sm:pb-24">
          <p className="text-[13px] text-white/45 sm:text-sm">
            {isLoading ? "Loading jobs..." : total === 0 ? "No jobs found" : `Showing ${rangeStart}-${rangeEnd} of ${total} jobs`}
          </p>

          {total > 0 && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">
              {pageJobs.map((job) => (
                <JobCard
                  key={job.id}
                  job={job}
                  onClick={() => router.push(`/jobs/${job.id}`)}
                  onMatch={() => openMatch(job.id)}
                  matching={pendingId === String(job.id)}
                />
              ))}
            </div>
          )}

          {total === 0 && !isLoading && (
            <div className="flex flex-col items-center gap-4 py-12 text-center sm:py-16">
              <div className="flex size-16 items-center justify-center rounded-full border border-glass-border bg-white/[0.04] sm:size-20">
                <Search className="size-7 text-white/45 sm:size-9" />
              </div>
              <p className="text-lg font-semibold text-white sm:text-xl">No jobs found</p>
              <p className="max-w-md text-[13px] text-white/70 sm:text-sm">Try adjusting your search or filters to find more opportunities.</p>
            </div>
          )}

          {totalPages > 1 && <Pagination page={currentPage} totalPages={totalPages} onChange={setPage} />}
        </div>
      </div>
    </Layout>
  );
};

/* ------------------------------ sub-components ----------------------------- */

function Pagination({ page, totalPages, onChange }: { page: number; totalPages: number; onChange: (page: number) => void }) {
  const pages: (number | "…")[] = [];
  const push = (n: number | "…") => pages.push(n);
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) push(i);
  } else {
    push(1);
    if (page > 3) push("…");
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) push(i);
    if (page < totalPages - 2) push("…");
    push(totalPages);
  }

  return (
    <div className="flex flex-wrap items-center justify-center gap-1.5 pt-4 sm:gap-2">
      <button
        onClick={() => onChange(Math.max(1, page - 1))}
        disabled={page === 1}
        className="rounded-full border border-glass-border px-3 py-1.5 text-xs font-medium text-white/70 transition-colors hover:bg-white/5 disabled:opacity-40 sm:px-4 sm:py-2 sm:text-[13px]"
      >
        Previous
      </button>
      {pages.map((p, i) =>
        p === "…" ? (
          <span key={`e${i}`} className="px-2 text-white/45">
            …
          </span>
        ) : (
          <button
            key={p}
            onClick={() => onChange(p)}
            className={`flex size-8 items-center justify-center rounded-full text-xs font-semibold transition-colors sm:size-9 sm:text-[13px] ${
              p === page ? "bg-neon-cyan text-[#06060f]" : "text-white/70 hover:bg-white/5"
            }`}
          >
            {p}
          </button>
        )
      )}
      <button
        onClick={() => onChange(Math.min(totalPages, page + 1))}
        disabled={page === totalPages}
        className="rounded-full border border-glass-border px-3 py-1.5 text-xs font-medium text-white/70 transition-colors hover:bg-white/5 disabled:opacity-40 sm:px-4 sm:py-2 sm:text-[13px]"
      >
        Next
      </button>
    </div>
  );
}

export default All;
