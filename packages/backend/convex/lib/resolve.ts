import type { Id } from "../_generated/dataModel";
import type { MutationCtx } from "../_generated/server";

/** Accepts either a resolved `{ id }` / `{ id, name }` option or free text. */
export type NamedRefInput = { id?: string; name?: string } | string | null | undefined;

export type CityRefInput = {
  id?: string;
  name?: string;
  state?: { id?: string; name?: string } | null;
} | null | undefined;

/** Convex document ids are long lowercase tokens, not recruiter-typed labels. */
export function looksLikeConvexId(value: string | undefined): boolean {
  return typeof value === "string" && /^[a-z0-9]{26,}$/i.test(value);
}

export function refId(value: NamedRefInput): string | undefined {
  const id = typeof value === "object" && value ? value.id : undefined;
  return looksLikeConvexId(id) ? id : undefined;
}

export function refName(value: NamedRefInput): string {
  if (typeof value === "string") return value.trim();
  return (value?.name ?? "").trim();
}

export function catalogKey(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9+#]+/g, "");
}

const CATALOG_TOKENS: Record<string, string> = {
  ai: "AI",
  aws: "AWS",
  hr: "HR",
  ii: "II",
  iii: "III",
  ios: "iOS",
  ipad: "iPad",
  iv: "IV",
  jr: "Jr",
  macos: "macOS",
  ml: "ML",
  qa: "QA",
  sr: "Sr",
  svp: "SVP",
  ui: "UI",
  ux: "UX",
  vp: "VP",
};

const SMALL_WORDS = new Set(["and", "at", "for", "in", "of", "or", "the", "to"]);

/**
 * Display form for catalog rows. Matching is still case-insensitive via
 * catalogKey — this only decides what we store when creating a new row.
 * Skills keep the typed spelling so C++ / Node.js are not title-cased.
 */
export function canonicalizeCatalogName(name: string, kind: "title" | "place" | "company" | "skill" = "title"): string {
  const trimmed = name.replace(/\s+/g, " ").trim();
  if (!trimmed) return trimmed;
  if (kind === "skill") return trimmed;
  // Recruiter already mixed case (iOS Engineer) — keep it, just collapse space.
  if (/[a-z]/.test(trimmed) && /[A-Z]/.test(trimmed)) return trimmed;
  return trimmed
    .split(" ")
    .map((word, index) => {
      const key = word.toLowerCase();
      if (CATALOG_TOKENS[key]) return CATALOG_TOKENS[key];
      if (index > 0 && SMALL_WORDS.has(key)) return key;
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(" ");
}

function rowName(row: unknown): string {
  if (row && typeof row === "object" && "name" in row && typeof (row as { name?: unknown }).name === "string") {
    return (row as { name: string }).name;
  }
  return "";
}

type NamedTable = "skills" | "companies" | "colleges" | "job_titles" | "degree_names" | "fields_of_study" | "issuing_bodies" | "certifications";

function namedKind(table: NamedTable): "title" | "company" | "skill" {
  if (table === "skills") return "skill";
  if (table === "companies" || table === "colleges" || table === "issuing_bodies") return "company";
  return "title";
}

async function alignCatalogName(ctx: MutationCtx, id: string, existingName: string, canonical: string): Promise<void> {
  if (existingName === canonical) return;
  if (existingName.toLowerCase() !== canonical.toLowerCase()) return;
  await ctx.db.patch(id as never, { name: canonical });
}

/**
 * Resolves a catalog reference: an existing id passes through, a name is matched
 * against the table, and unknown names are created so free-text form entries
 * still link (and can match other profiles/jobs later).
 */
export async function resolveNamedRef<T extends NamedTable>(ctx: MutationCtx, table: T, value: NamedRefInput): Promise<Id<T> | undefined> {
  const direct = refId(value);
  if (direct) return direct as Id<T>;
  const raw = refName(value);
  if (!raw) return undefined;
  const name = canonicalizeCatalogName(raw, namedKind(table));
  const key = catalogKey(name);
  if (!key) return undefined;

  const exact = await ctx.db
    .query(table)
    .withIndex("by_name", (q) => (q as { eq: (field: string, value: string) => unknown }).eq("name", name) as never)
    .unique();
  if (exact) return exact._id as Id<T>;

  if (name !== raw) {
    const original = await ctx.db
      .query(table)
      .withIndex("by_name", (q) => (q as { eq: (field: string, value: string) => unknown }).eq("name", raw) as never)
      .unique();
    if (original) {
      await alignCatalogName(ctx, original._id, rowName(original), name);
      return original._id as Id<T>;
    }
  }

  const hits = await ctx.db
    .query(table)
    .withSearchIndex("search_name", (q) => q.search("name", name))
    .take(8);
  const match = hits.find((row) => catalogKey(rowName(row)) === key);
  if (match) {
    await alignCatalogName(ctx, match._id, rowName(match), name);
    return match._id as Id<T>;
  }

  return (await ctx.db.insert(table, { name } as never)) as Id<T>;
}

const OTHER_STATE = "Other";

/** Match an existing city, or create one (and its state) from a typed "City, State" string. */
export async function resolveCityRef(ctx: MutationCtx, value: CityRefInput): Promise<Id<"cities"> | undefined> {
  const direct = looksLikeConvexId(value?.id) ? value!.id : undefined;
  if (direct) return direct as Id<"cities">;

  const rawName = (value?.name ?? "").trim();
  if (!rawName) return undefined;

  const stateFromRef = value?.state?.name?.trim();
  const parts = rawName.split(",").map((part) => part.trim()).filter(Boolean);
  const cityName = canonicalizeCatalogName(parts[0] ?? rawName, "place");
  const stateName = stateFromRef ? canonicalizeCatalogName(stateFromRef, "place") : parts[1] ? canonicalizeCatalogName(parts[1], "place") : undefined;
  const key = catalogKey(cityName);
  if (!key) return undefined;

  const hits = await ctx.db
    .query("cities")
    .withSearchIndex("search_name", (q) => q.search("name", cityName))
    .take(8);

  if (stateName) {
    const stateKey = catalogKey(stateName);
    for (const row of hits) {
      if (catalogKey(row.name) !== key) continue;
      const state = await ctx.db.get(row.state_id);
      if (state && catalogKey(state.name) === stateKey) {
        await alignCatalogName(ctx, row._id, row.name, cityName);
        return row._id;
      }
    }
  } else {
    const match = hits.find((row) => catalogKey(row.name) === key);
    if (match) {
      await alignCatalogName(ctx, match._id, match.name, cityName);
      return match._id;
    }
  }

  const stateId = await findOrCreateState(ctx, stateName || OTHER_STATE);
  const existing = await ctx.db
    .query("cities")
    .withIndex("by_name_and_state", (q) => q.eq("name", cityName).eq("state_id", stateId))
    .unique();
  if (existing) return existing._id;

  const inState = await ctx.db
    .query("cities")
    .withIndex("by_state", (q) => q.eq("state_id", stateId))
    .take(80);
  const caseMatch = inState.find((row) => catalogKey(row.name) === key);
  if (caseMatch) {
    await alignCatalogName(ctx, caseMatch._id, caseMatch.name, cityName);
    return caseMatch._id;
  }

  return await ctx.db.insert("cities", { name: cityName, state_id: stateId });
}

async function findOrCreateState(ctx: MutationCtx, name: string): Promise<Id<"states">> {
  const trimmed = canonicalizeCatalogName(name, "place");
  const exact = await ctx.db
    .query("states")
    .withIndex("by_name", (q) => q.eq("name", trimmed))
    .unique();
  if (exact) return exact._id;
  const key = catalogKey(trimmed);
  if (key) {
    const states = await ctx.db.query("states").take(80);
    const match = states.find((row) => catalogKey(row.name) === key);
    if (match) {
      await alignCatalogName(ctx, match._id, match.name, trimmed);
      return match._id;
    }
  }
  return await ctx.db.insert("states", { name: trimmed });
}
