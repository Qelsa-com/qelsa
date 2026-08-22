"use client";

import { Loader2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

export const JOBS_PAGE_SIZE = 12;

type PaginatedStatus = "LoadingFirstPage" | "CanLoadMore" | "LoadingMore" | "Exhausted";

/**
 * Infinite scroll for job feeds, with a Load more button as the accessible
 * fallback. While the sentinel stays on screen we keep a single loading
 * label so the button text does not flash between pages.
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
  const pendingRef = useRef(false);
  const emptyAdvances = useRef(0);
  const [sentinelInView, setSentinelInView] = useState(false);

  const requestMore = useCallback(() => {
    if (status !== "CanLoadMore" || pendingRef.current) return;
    pendingRef.current = true;
    loadMore(pageSize);
  }, [status, loadMore, pageSize]);

  useEffect(() => {
    if (status === "CanLoadMore") pendingRef.current = false;
    if (status === "LoadingFirstPage") emptyAdvances.current = 0;
  }, [status]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.some((entry) => entry.isIntersecting);
        setSentinelInView(visible);
        if (visible) requestMore();
      },
      { rootMargin: "400px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [requestMore]);

  useEffect(() => {
    if (!canLoadMore || loadedCount > 0 || emptyAdvances.current >= 6) return;
    emptyAdvances.current += 1;
    requestMore();
  }, [canLoadMore, loadedCount, requestMore]);

  if (status === "LoadingFirstPage") return null;

  const showFooter = canLoadMore || isLoadingMore;
  const showSpinner = isLoadingMore || (canLoadMore && sentinelInView);

  return (
    <>
      <div ref={sentinelRef} className="h-px w-full" aria-hidden="true" />
      {showFooter && (
        <div className="flex min-h-11 items-center justify-center pt-2">
          {showSpinner ? (
            <Loader2 className="size-5 animate-spin text-white/45" aria-label="Loading more" />
          ) : (
            <button
              type="button"
              onClick={requestMore}
              className="rounded-full border border-glass-border bg-white/[0.04] px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-white/[0.08]"
            >
              {moreLabel}
            </button>
          )}
        </div>
      )}
      {status === "Exhausted" && loadedCount > 0 && <p className="pt-2 text-center text-[13px] text-white/40">{doneLabel}</p>}
    </>
  );
}
