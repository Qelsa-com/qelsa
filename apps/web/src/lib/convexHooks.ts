"use client";

import { useConvex, useMutation, useQuery } from "convex/react";
import { useState } from "react";

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
  const trigger = (next?: Args, _preferCacheValue?: boolean) => {
    const resolved = (next ?? {}) as Args;
    setArgs(resolved);
    return withUnwrap(convex.query(queryRef, resolved as never) as Promise<Result>);
  };
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

export function useConvexMutationHook<Args = any, Result = any>(mutationRef: any, mapArgs?: (input: Args) => unknown) {
  const mutate = useMutation(mutationRef);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<unknown>(undefined);
  const trigger = (input: Args) => {
    setIsLoading(true);
    setError(undefined);
    const promise = Promise.resolve(mutate((mapArgs ? mapArgs(input) : input) as never))
      .catch((err) => {
        setError(err);
        throw err;
      })
      .finally(() => setIsLoading(false)) as Promise<Result>;
    return withUnwrap(promise);
  };
  return [trigger, { isLoading, error, data: undefined as Result | undefined, isSuccess: !isLoading && !error, isError: Boolean(error) }] as const;
}
