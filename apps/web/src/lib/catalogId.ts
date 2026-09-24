/** Convex document ids are long alphanumeric tokens, not recruiter-typed labels. */
export function looksLikeConvexId(value: string | number | undefined | null): value is string {
  return typeof value === "string" && /^[a-z0-9]{26,}$/i.test(value);
}
