"use client";

import { useConvex, useMutation, useQuery } from "convex/react";
import { useCallback, useEffect, useRef, useState } from "react";

export function withUnwrap<T>(promise: Promise<T>) {
  const p = promise as Promise<T> & { unwrap: () => Promise<T> };
  p.unwrap = () => promise;
  return p;
}

export function useConvexQueryHook<Args = any, Result = any>(
  queryRef: any,
  args?: Args | void,
  options?: { skip?: boolean },
) {
  const skip = options?.skip || args === undefined;
  const data = useQuery(queryRef, skip ? "skip" : ((args ?? {}) as never)) as Result | undefined;
  return {
    data,
    isLoading: !skip && data === undefined,
    isFetching: !skip && data === undefined,
    isSuccess: data !== undefined,
    isError: false,
    error: undefined,
    refetch: () => undefined,
  };
}

export function useLazyConvexQueryHook<Args = any, Result = any>(queryRef: any) {
  const convex = useConvex();
  const [args, setArgs] = useState<Args | "skip">("skip");
  const data = useQuery(queryRef, args === "skip" ? "skip" : (args as never)) as Result | undefined;
  const trigger = useCallback(
    (next?: Args, _preferCacheValue?: boolean) => {
      const resolved = (next ?? {}) as Args;
      setArgs(resolved);
      return withUnwrap(convex.query(queryRef, resolved as never) as Promise<Result>);
    },
    [convex, queryRef],
  );
  return [
    trigger,
    {
      data,
      isLoading: args !== "skip" && data === undefined,
      isFetching: args !== "skip" && data === undefined,
      isSuccess: data !== undefined,
      error: undefined,
    },
  ] as const;
}

export function useConvexMutationHook<Args = any, Result = any>(
  mutationRef: any,
  mapArgs?: (input: Args) => unknown,
) {
  const mutate = useMutation(mutationRef);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<unknown>(undefined);

  // The caller usually passes an inline arrow, so the reference changes every
  // render. Keep it in a ref so `trigger` stays stable, and sync the ref in an
  // effect rather than during render.
  const mapArgsRef = useRef(mapArgs);
  useEffect(() => {
    mapArgsRef.current = mapArgs;
  }, [mapArgs]);

  const trigger = useCallback(
    (input: Args) => {
      setIsLoading(true);
      setError(undefined);
      const mapped = mapArgsRef.current ? mapArgsRef.current(input) : input;
      const promise = Promise.resolve(mutate(mapped as never))
        .catch((err) => {
          setError(err);
          throw err;
        })
        .finally(() => setIsLoading(false)) as Promise<Result>;
      return withUnwrap(promise);
    },
    [mutate],
  );

  return [
    trigger,
    {
      isLoading,
      error,
      data: undefined as Result | undefined,
      isSuccess: !isLoading && !error,
      isError: Boolean(error),
    },
  ] as const;
}
