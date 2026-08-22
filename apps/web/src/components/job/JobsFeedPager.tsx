"use client";

import { useEffect, useRef } from "react";

export const JOBS_PAGE_SIZE = 12;

type PaginatedStatus = "LoadingFirstPage" | "CanLoadMore" | "LoadingMore" | "Exhausted";

/**
 * Infinite scroll for job feeds, with a Load more button as the accessible
 * fallback. Convex usePaginatedQuery caches each loaded page in the client;
 * this just grows the list when the sentinel enters the viewport.
 */
export function JobsFeedPager({
  status,
  loadMore,
  loadedCount,
  pageSize = JOBS_PAGE_SIZE,
  moreLabel = "Load more jobs",
  doneLabel = "You've reached the end of the list.",
}: {
  status: PaginatedStatus;
  loadMore: (numItems: number) => void;
  loadedCount: number;
  pageSize?: number;
  moreLabel?: string;
  doneLabel?: string;
}) {
  const canLoadMore = status === "CanLoadMore";
  const isLoadingMore = status === "LoadingMore";
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const emptyAdvances = useRef(0);

  useEffect(() => {
    if (status === "LoadingFirstPage") emptyAdvances.current = 0;
  }, [status]);

  useEffect(() => {
    if (!canLoadMore) return;
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) loadMore(pageSize);
      },
      { rootMargin: "800px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [canLoadMore, loadMore, pageSize]);

  // Post-pagination filters can empty a page. Keep walking until we show
  // something or hit the cap, so a rare city/search doesn't look like "no jobs".
  useEffect(() => {
    if (!canLoadMore || loadedCount > 0 || emptyAdvances.current >= 6) return;
    emptyAdvances.current += 1;
    loadMore(pageSize);
  }, [canLoadMore, loadedCount, loadMore, pageSize]);

  if (status === "LoadingFirstPage") return null;

  return (
    <>
      {canLoadMore && <div ref={sentinelRef} className="h-px w-full" aria-hidden="true" />}
      {(canLoadMore || isLoadingMore) && (
        <div className="flex justify-center pt-2">
          <button
            type="button"
            onClick={() => loadMore(pageSize)}
            disabled={isLoadingMore}
            className="rounded-full border border-glass-border bg-white/[0.04] px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-white/[0.08] disabled:opacity-50"
          >
            {isLoadingMore ? "Loading…" : moreLabel}
          </button>
        </div>
      )}
      {status === "Exhausted" && loadedCount > 0 && <p className="pt-2 text-center text-[13px] text-white/40">{doneLabel}</p>}
    </>
  );
}
