/** Stable, human-readable job URLs with a short collision-resistant suffix. */
function slugPart(value: string) {
  return value
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function shortHash(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36).padStart(6, "0").slice(0, 6);
}

export function jobSlug(input: {
  title?: string | null;
  companyName?: string | null;
  location?: string | null;
  identity: string;
}) {
  const base = slugPart(
    [input.title ?? "", input.companyName ?? "", input.location ?? ""].filter(Boolean).join(" "),
  ).slice(0, 72);
  return `${base || "job"}-${shortHash(input.identity)}`;
}
