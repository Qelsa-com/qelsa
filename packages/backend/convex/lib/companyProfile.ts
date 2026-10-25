import type { Id } from "../_generated/dataModel";

/** ATS hosts are not company websites; never use one as the profile key. */
const ATS_HOST =
  /(^|\.)(greenhouse\.io|lever\.co|ashbyhq\.com|bamboohr\.com|myworkdayjobs\.com|smartrecruiters\.com|workable\.com|oraclecloud\.com|rippling\.com|breezy\.hr|recruitee\.com|teamtailor\.com|personio\.de|zohorecruit\.(com|in|eu|com\.au)|keka\.com|darwinbox\.(in|com|io)|icims\.com)$/i;

const PRIVATE_HOST =
  /^(localhost|0\.0\.0\.0|127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|169\.254\.)|\.(local|internal|localhost)$/i;

/** Social/profile URLs are not the company's canonical product site. */
const NON_COMPANY_HOST =
  /(^|\.)(linkedin\.com|twitter\.com|x\.com|facebook\.com|instagram\.com|glassdoor\.(com|co\.in)|indeed\.com|youtube\.com|medium\.com|wellfound\.com|angel\.co)$/i;

export type CompanyProfileSeed = {
  key: string;
  name: string;
  website?: string;
  sampleJobId?: Id<"jobs">;
};

export function cleanCompanyName(name?: string | null) {
  return (name ?? "").replace(/\s+/g, " ").trim().slice(0, 120);
}

/** Canonical public website origin for a company, or undefined for ATS/social URLs. */
function normalizeWebsite(value?: string | null) {
  const raw = value?.trim();
  if (!raw) return undefined;
  try {
    const url = new URL(raw.includes("://") ? raw : `https://${raw}`);
    if (url.protocol !== "http:" && url.protocol !== "https:") return undefined;
    const host = url.hostname.toLowerCase().replace(/^www\./, "");
    if (!host || ATS_HOST.test(host) || NON_COMPANY_HOST.test(host) || PRIVATE_HOST.test(host) || host.includes(":")) return undefined;
    return { host, url: `https://${host}` };
  } catch {
    return undefined;
  }
}

/**
 * Stable cache key. Prefer the company's real domain so two companies with the
 * same name do not share a profile; fall back to a normalized name when an ATS
 * does not publish a website.
 */
export function companyProfileKey(input: { website?: string | null; name?: string | null }) {
  const site = normalizeWebsite(input.website);
  if (site) return `domain:${site.host}`;
  const name = cleanCompanyName(input.name).toLowerCase();
  if (!name) return undefined;
  const slug = name
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug ? `name:${slug}` : undefined;
}

export function companyProfileSeed(input: {
  website?: string | null;
  name?: string | null;
  sampleJobId?: Id<"jobs">;
}): CompanyProfileSeed | undefined {
  const name = cleanCompanyName(input.name);
  const site = normalizeWebsite(input.website);
  const key = companyProfileKey({ website: site?.host, name });
  if (!key) return undefined;
  return {
    key,
    name: name || site?.host.split(".")[0] || "Company",
    website: site?.url,
    sampleJobId: input.sampleJobId,
  };
}
