import type { Id } from "../_generated/dataModel";
import type { MutationCtx } from "../_generated/server";

/** Accepts either a resolved `{ id }` / `{ id, name }` option or free text. */
export type NamedRefInput = { id?: string; name?: string } | string | null | undefined;

export function refId(value: NamedRefInput): string | undefined {
  return typeof value === "object" && value ? value.id : undefined;
}

export function refName(value: NamedRefInput): string {
  if (typeof value === "string") return value.trim();
  return (value?.name ?? "").trim();
}

type NamedTable =
  | "skills"
  | "companies"
  | "colleges"
  | "job_titles"
  | "degree_names"
  | "fields_of_study"
  | "issuing_bodies"
  | "certifications";

/**
 * Resolves a catalog reference: an existing id passes through, a name is matched
 * exactly against the table's by_name index, and unknown names are created so
 * free-text form entries still link (and can match other profiles/jobs later).
 */
export async function resolveNamedRef<T extends NamedTable>(
  ctx: MutationCtx,
  table: T,
  value: NamedRefInput,
): Promise<Id<T> | undefined> {
  const direct = refId(value);
  if (direct) return direct as Id<T>;
  const name = refName(value);
  if (!name) return undefined;
  const existing = await ctx.db
    .query(table)
    // The union of catalog tables defeats the index field typing; name is always a string.
    .withIndex("by_name", (q) => (q as { eq: (field: string, value: string) => unknown }).eq("name", name) as never)
    .unique();
  if (existing) return existing._id as Id<T>;
  return (await ctx.db.insert(table, { name } as never)) as Id<T>;
}
