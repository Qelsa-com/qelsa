/** Provider fetchers. Each ATS uses the auth path that vendor documents. */

export type WorkplaceType = "on-site" | "hybrid" | "remote";

export type NormalizedJob = {
  external_id: string;
  title?: string;
  description?: string;
  application_url?: string;
  company_name?: string;
  company_logo?: string;
  company_website_url?: string;
  location?: string;
  departments?: string[];
  has_remote?: boolean;
  workplace_type?: WorkplaceType;
  work_type?: string;
  language?: string;
  salary_min?: number;
  salary_max?: number;
  salary_currency?: string;
  published_date?: number;
};

/** Soft cap on a single board pull. Reconcile skips close if this many jobs are returned. */
export const ATS_JOB_FETCH_LIMIT = 2000;
const MAX_JOBS = ATS_JOB_FETCH_LIMIT;
const REQUEST_UA = "QelsaAtsSync/1.0";

/**
 * Lever hosts boards in two regions. A 404 on the .com host only means the
 * board is not on that region, so fall through to the EU host before failing.
 */
const LEVER_API_HOSTS = ["https://api.lever.co", "https://api.eu.lever.co"];

const ATS_HOST =
  /(^|\.)(greenhouse\.io|lever\.co|ashbyhq\.com|bamboohr\.com|myworkdayjobs\.com|smartrecruiters\.com|workable\.com|oraclecloud\.com|rippling\.com|breezy\.hr|recruitee\.com|teamtailor\.com|personio\.de|zohorecruit\.(com|in|eu|com\.au)|keka\.com|darwinbox\.(in|com|io)|icims\.com)$/i;

export function titleCaseCompany(name: string) {
  const trimmed = name.replace(/[-_]+/g, " ").replace(/\s+/g, " ").trim();
  if (!trimmed) return name;
  if (/[a-z]/.test(trimmed) && /[A-Z]/.test(trimmed)) return trimmed;
  return trimmed
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

export function logoForDomain(domain?: string) {
  return domain ? `https://www.google.com/s2/favicons?sz=128&domain=${encodeURIComponent(domain)}` : undefined;
}

export function companyDomain(applicationUrl?: string, slug?: string) {
  if (applicationUrl) {
    try {
      const host = new URL(applicationUrl).hostname.replace(/^www\./i, "");
      if (!ATS_HOST.test(host)) {
        const parts = host.split(".");
        return parts.length >= 2 ? parts.slice(-2).join(".") : host;
      }
    } catch {
      /* ignore invalid apply URLs */
    }
  }
  if (slug && /^[a-z0-9-]+$/i.test(slug)) return `${slug.toLowerCase()}.com`;
  return undefined;
}

export function workplaceFromLabel(value?: string): WorkplaceType | undefined {
  if (!value) return undefined;
  const v = value.toLowerCase().replace(/[_-]+/g, " ");
  if (v.includes("hybrid")) return "hybrid";
  if (v.includes("remote")) return "remote";
  if (v.includes("on site") || v.includes("onsite") || v.includes("office")) return "on-site";
  return undefined;
}

export function workTypeFromLabel(value?: string) {
  if (!value) return undefined;
  const v = value.toLowerCase();
  if (v.includes("full")) return "Full-time";
  if (v.includes("part")) return "Part-time";
  if (v.includes("intern")) return "Internship";
  if (v.includes("contract") || v.includes("temp")) return "Contract";
  return value;
}

function decodeHtmlEntities(value: string) {
  let text = value;
  for (let i = 0; i < 3; i++) {
    const next = text
      .replace(/&nbsp;|&#160;/gi, " ")
      .replace(/&quot;|&#34;/g, '"')
      .replace(/&apos;|&#39;/g, "'")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
      .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCharCode(parseInt(code, 16)))
      .replace(/&amp;/g, "&");
    if (next === text) break;
    text = next;
  }
  return text;
}

export function normalizeAtsHtml(html?: string): string | undefined {
  if (!html) return undefined;
  let text = html.trim();
  if (/&lt;\s*\/?\s*[a-z]/i.test(text) || /&amp;lt;/.test(text)) {
    text = decodeHtmlEntities(text);
  }
  return text || undefined;
}

function metadataValues(metadata: unknown) {
  const out: Record<string, string> = {};
  if (!Array.isArray(metadata)) return out;
  for (const row of metadata) {
    if (!row || typeof row !== "object" || !("name" in row)) continue;
    const name = String((row as { name?: unknown }).name ?? "").trim().toLowerCase();
    const value = (row as { value?: unknown }).value;
    if (name && value != null && value !== "") out[name] = String(value);
  }
  return out;
}

function payFromRanges(ranges: unknown) {
  if (!Array.isArray(ranges) || ranges.length === 0) return {};
  const first = ranges[0] as { min_cents?: number; max_cents?: number; currency_type?: string };
  return {
    salary_min: typeof first.min_cents === "number" ? first.min_cents / 100 : undefined,
    salary_max: typeof first.max_cents === "number" ? first.max_cents / 100 : undefined,
    salary_currency: first.currency_type,
  };
}

function stripBoardHost(value: string, hosts: RegExp) {
  const trimmed = value.trim();
  if (!trimmed) return "";
  try {
    const url = trimmed.includes("://") ? new URL(trimmed) : new URL(`https://${trimmed}`);
    const host = url.hostname.replace(/^www\./i, "");
    const match = host.match(hosts);
    if (match?.[1]) return match[1];
    const first = host.split(".")[0];
    return first && !hosts.test(first) ? first : host;
  } catch {
    return trimmed.replace(/^https?:\/\//i, "").split("/")[0]?.split(".")[0] ?? trimmed;
  }
}

function slugFromInput(value: string, suffix: RegExp) {
  return value.replace(suffix, "").replace(/^https?:\/\//i, "").replace(/\/.*$/, "").trim();
}

/** Accept a slug or a full board URL and return the normalised board identifier. */
export function normalizePublicBoardSlug(input: string, provider?: string): string {
  const trimmed = input.trim();
  if (!trimmed) return "";

  const asUrl = () => {
    try {
      return new URL(trimmed.includes("://") ? trimmed : `https://${trimmed}`);
    } catch {
      return null;
    }
  };

  if (provider === "workday") {
    if (trimmed.includes("|")) {
      const [tenant, wd, site] = trimmed.split("|").map((part) => part.trim());
      if (!tenant || !wd || !site) throw new Error("Use Workday input as tenant|wdN|site, or paste the careers URL.");
      return `${tenant}|${wd.startsWith("wd") ? wd : `wd${wd}`}|${site}`;
    }
    const url = asUrl();
    const host = url?.hostname.match(/^([^.]+)\.(wd\d+)\.myworkdayjobs\.com$/i);
    if (url && host) {
      const path = url.pathname
        .split("/")
        .filter(Boolean)
        .filter((part) => !/^[a-z]{2}(-[A-Z]{2})?$/.test(part));
      const site = path[0];
      if (site) return `${host[1]}|${host[2]}|${site}`;
    }
    throw new Error("Paste a Workday careers URL like https://tenant.wd5.myworkdayjobs.com/Site.");
  }

  if (provider === "oracle_cloud") {
    if (trimmed.includes("|")) {
      const [host, site] = trimmed.split("|").map((part) => part.trim());
      if (!host || !site) throw new Error("Use Oracle input as host|siteNumber, or paste the careers URL.");
      return `${host}|${site}`;
    }
    const url = asUrl();
    if (!url) throw new Error("Paste an Oracle Cloud HCM careers URL.");
    const site =
      url.searchParams.get("siteNumber") ||
      url.pathname.match(/\/sites\/([^/]+)/i)?.[1] ||
      url.pathname.match(/\/site\/([^/]+)/i)?.[1];
    if (!url.hostname.endsWith(".oraclecloud.com") || !site) {
      throw new Error("Paste an Oracle Cloud HCM careers URL containing /sites/CX_… .");
    }
    return `${url.hostname}|${site}`;
  }

  if (provider === "eightfold") {
    if (trimmed.includes("|")) {
      const [host, domain] = trimmed.split("|").map((part) => part.trim());
      if (!host || !domain) throw new Error("Use Eightfold input as careers-host|company-domain.");
      return `${host.replace(/^https?:\/\//i, "").replace(/\/.*$/, "")}|${domain}`;
    }
    const url = asUrl();
    if (!url) throw new Error("Paste the Eightfold careers URL or careers-host|company-domain.");
    const domain = url.searchParams.get("domain") || url.hostname.split(".").slice(-2).join(".");
    return `${url.hostname}|${domain}`;
  }

  if (provider === "teamtailor") {
    const url = asUrl();
    if (!url) throw new Error("Paste the Teamtailor careers host or URL.");
    return url.hostname;
  }

  try {
    const asUrlValue = trimmed.includes("://") ? new URL(trimmed) : trimmed.includes("/") ? new URL(`https://${trimmed}`) : null;
    const pathSlug = asUrlValue?.pathname.split("/").filter(Boolean)[0];
    if (pathSlug) return pathSlug.toLowerCase();
  } catch {
    /* fall through to plain slug */
  }
  return trimmed
    .replace(/^https?:\/\//i, "")
    .replace(/\/+$/, "")
    .split("/")[0]
    ?.replace(/\.(greenhouse\.io|lever\.co|ashbyhq\.com)$/i, "")
    .split(".")[0]
    ?.toLowerCase() ?? "";
}

async function getJson(url: string, init?: RequestInit) {
  const res = await fetch(url, {
    ...init,
    headers: { Accept: "application/json", "User-Agent": REQUEST_UA, ...(init?.headers ?? {}) },
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`${url} failed: ${res.status}`);
  if (text.trimStart().startsWith("<")) throw new Error(`${url} returned HTML instead of JSON`);
  return JSON.parse(text) as unknown;
}

function basicAuth(user: string, password: string) {
  return `Basic ${btoa(`${user}:${password}`)}`;
}

function joinLocation(parts: Array<string | undefined | null>) {
  const unique = parts.map((part) => part?.trim()).filter((part): part is string => Boolean(part));
  return unique.length ? unique.join(", ") : undefined;
}

/* ------------------------------------------------------------------ */
/* Greenhouse / Lever (existing public boards)                         */
/* ------------------------------------------------------------------ */

export async function fetchGreenhouse(subdomain: string): Promise<NormalizedJob[]> {
  const slug = slugFromInput(subdomain, /\.greenhouse\.io$/i);
  if (!slug) throw new Error("Greenhouse board slug is required");
  const [boardRes, jobsRes] = await Promise.all([
    fetch(`https://boards-api.greenhouse.io/v1/boards/${slug}`, { headers: { "User-Agent": REQUEST_UA } }),
    fetch(`https://boards-api.greenhouse.io/v1/boards/${slug}/jobs?content=true`, { headers: { "User-Agent": REQUEST_UA } }),
  ]);
  if (!jobsRes.ok) throw new Error(`Greenhouse board "${slug}" was not found (${jobsRes.status})`);
  const board = boardRes.ok ? ((await boardRes.json()) as { name?: string }) : {};
  const data = (await jobsRes.json()) as { jobs?: Array<Record<string, unknown>> };
  return (data.jobs ?? []).slice(0, MAX_JOBS).map((j) => {
    const location = String((j.location as { name?: string } | undefined)?.name ?? "").trim() || undefined;
    const application_url = typeof j.absolute_url === "string" ? j.absolute_url : undefined;
    const domain = companyDomain(application_url, slug);
    const meta = metadataValues(j.metadata);
    const workplace = workplaceFromLabel(meta["workplace type"] ?? meta.workplace) ?? (location && /remote/i.test(location) ? "remote" : undefined);
    const pay = payFromRanges(j.pay_input_ranges);
    const departments = ((j.departments as Array<{ name?: string }> | undefined) ?? []).map((d) => d.name).filter((name): name is string => Boolean(name));
    const company_name = titleCaseCompany(String(j.company_name || board.name || slug));
    const published = typeof j.first_published === "string" ? j.first_published : typeof j.updated_at === "string" ? j.updated_at : undefined;
    return {
      external_id: `gh_${slug}_${j.id}`,
      title: typeof j.title === "string" ? j.title : undefined,
      description: normalizeAtsHtml(typeof j.content === "string" ? j.content : undefined),
      application_url,
      company_name,
      company_logo: logoForDomain(domain),
      company_website_url: domain ? `https://${domain}` : undefined,
      location,
      departments,
      has_remote: workplace === "remote" || /remote/i.test(location ?? ""),
      workplace_type: workplace,
      work_type: workTypeFromLabel(meta["employment type"] ?? meta["job type"] ?? meta.type),
      language: typeof j.language === "string" ? j.language : undefined,
      published_date: published ? new Date(published).getTime() : undefined,
      ...pay,
    };
  });
}

/** Pull the raw postings array, trying each Lever region in turn. */
async function fetchLeverPostings(slug: string): Promise<Array<Record<string, unknown>>> {
  for (const host of LEVER_API_HOSTS) {
    const res = await fetch(`${host}/v0/postings/${slug}?mode=json`, { headers: { "User-Agent": REQUEST_UA } });
    if (res.ok) {
      const data = (await res.json()) as Array<Record<string, unknown>>;
      // A 200 is authoritative for this region, even when the board is empty.
      if (Array.isArray(data)) return data;
      throw new Error(`Lever board "${slug}" returned an unexpected payload`);
    }
    // Only a 404 means "not on this region". Anything else (rate limit, 5xx)
    // is a real failure — surface it rather than let the other region answer.
    if (res.status !== 404) throw new Error(`Lever board "${slug}" could not be fetched (${res.status})`);
  }
  throw new Error(`Lever board "${slug}" was not found (404)`);
}

export async function fetchLever(subdomain: string): Promise<NormalizedJob[]> {
  const slug = slugFromInput(subdomain, /\.lever\.co$/i);
  if (!slug) throw new Error("Lever board slug is required");
  const data = await fetchLeverPostings(slug);
  const domain = companyDomain(undefined, slug);
  return (data ?? []).slice(0, MAX_JOBS).map((j) => {
    const categories = (j.categories as { location?: string; team?: string; department?: string; commitment?: string } | undefined) ?? {};
    const application_url = typeof j.hostedUrl === "string" ? j.hostedUrl : typeof j.applyUrl === "string" ? j.applyUrl : undefined;
    const location = categories.location;
    const workplace = workplaceFromLabel(typeof j.workplaceType === "string" ? j.workplaceType : undefined) ?? (location && /remote/i.test(location) ? "remote" : undefined);
    return {
      external_id: `lever_${slug}_${j.id}`,
      title: typeof j.text === "string" ? j.text.trim() : undefined,
      description: normalizeAtsHtml(typeof j.description === "string" ? j.description : typeof j.descriptionPlain === "string" ? j.descriptionPlain : undefined),
      application_url,
      company_name: titleCaseCompany(slug),
      company_logo: logoForDomain(domain),
      company_website_url: domain ? `https://${domain}` : undefined,
      location,
      departments: [categories.team, categories.department].filter((name): name is string => Boolean(name)),
      has_remote: workplace === "remote",
      workplace_type: workplace,
      work_type: workTypeFromLabel(categories.commitment),
      published_date: typeof j.createdAt === "number" ? j.createdAt : undefined,
    };
  });
}

export async function fetchAshby(subdomain: string): Promise<NormalizedJob[]> {
  const slug = slugFromInput(subdomain, /\.ashbyhq\.com$/i);
  if (!slug) throw new Error("Ashby board slug is required");
  const data = (await getJson(`https://api.ashbyhq.com/posting-api/job-board/${encodeURIComponent(slug)}?includeCompensation=true`)) as {
    jobs?: Array<Record<string, unknown>>;
  };
  const domain = companyDomain(undefined, slug);
  return (data.jobs ?? [])
    .filter((j) => j.isListed !== false)
    .slice(0, MAX_JOBS)
    .map((j) => {
      const location = typeof j.location === "string" ? j.location.trim() : undefined;
      const workplace = workplaceFromLabel(typeof j.workplaceType === "string" ? j.workplaceType : undefined);
      const salary = Array.isArray((j.compensation as { summaryComponents?: Array<Record<string, unknown>> } | undefined)?.summaryComponents)
        ? (j.compensation as { summaryComponents: Array<Record<string, unknown>> }).summaryComponents.find((c) => c.compensationType === "Salary")
        : undefined;
      return {
        external_id: `ashby_${slug}_${j.id ?? j.jobUrl}`,
        title: typeof j.title === "string" ? j.title.trim() : undefined,
        description: normalizeAtsHtml(typeof j.descriptionHtml === "string" ? j.descriptionHtml : typeof j.descriptionPlain === "string" ? j.descriptionPlain : undefined),
        application_url: typeof j.jobUrl === "string" ? j.jobUrl : typeof j.applyUrl === "string" ? j.applyUrl : undefined,
        company_name: titleCaseCompany(slug),
        company_logo: logoForDomain(domain),
        company_website_url: domain ? `https://${domain}` : undefined,
        location,
        departments: [typeof j.department === "string" ? j.department : undefined, typeof j.team === "string" ? j.team : undefined].filter((name): name is string => Boolean(name)),
        has_remote: j.isRemote === true || workplace === "remote" || /remote/i.test(location ?? ""),
        workplace_type: workplace,
        work_type: workTypeFromLabel(typeof j.employmentType === "string" ? j.employmentType : undefined),
        published_date: typeof j.publishedAt === "string" ? new Date(j.publishedAt).getTime() : undefined,
        salary_min: typeof salary?.minValue === "number" ? salary.minValue : undefined,
        salary_max: typeof salary?.maxValue === "number" ? salary.maxValue : undefined,
        salary_currency: typeof salary?.currencyCode === "string" ? salary.currencyCode : undefined,
      };
    });
}

/** Official BambooHR ATS API — Basic auth with API key as username. */
export async function fetchBambooHR(subdomain: string, apiKey?: string): Promise<NormalizedJob[]> {
  const slug = stripBoardHost(subdomain, /^([a-z0-9-]+)\.bamboohr\.com$/i);
  if (!slug) throw new Error("BambooHR company subdomain is required");
  if (!apiKey) throw new Error("BambooHR API key is required");
  const data = await getJson(`https://${slug}.bamboohr.com/api/v1/applicant_tracking/jobs?statusGroups=Open`, {
    headers: { Authorization: basicAuth(apiKey, "x") },
  });
  const rows = Array.isArray(data) ? data : ((data as { jobs?: unknown }).jobs as unknown);
  if (!Array.isArray(rows)) throw new Error("BambooHR returned an unexpected jobs response");
  const domain = companyDomain(undefined, slug);
  return (rows as Array<Record<string, unknown>>).slice(0, MAX_JOBS).map((job) => {
    const title = typeof job.title === "object" && job.title && "label" in job.title ? String((job.title as { label?: string }).label ?? "") : typeof job.title === "string" ? job.title : undefined;
    const location = typeof job.location === "object" && job.location && "label" in job.location ? String((job.location as { label?: string }).label ?? "") : undefined;
    const department = typeof job.department === "object" && job.department && "label" in job.department ? String((job.department as { label?: string }).label ?? "") : undefined;
    return {
      external_id: `bamboo_${slug}_${job.id}`,
      title,
      application_url: `https://${slug}.bamboohr.com/careers/${job.id}`,
      company_name: titleCaseCompany(slug),
      company_logo: logoForDomain(domain),
      company_website_url: domain ? `https://${domain}` : undefined,
      location,
      departments: department ? [department] : undefined,
      has_remote: /remote/i.test(location ?? ""),
      workplace_type: workplaceFromLabel(location),
      published_date: typeof job.postedDate === "string" ? new Date(job.postedDate).getTime() : undefined,
    };
  });
}

/** Keka Hire — client-credentials OAuth, then official jobs API. */
export async function fetchKeka(subdomain: string, clientId?: string, clientSecret?: string): Promise<NormalizedJob[]> {
  const slug = stripBoardHost(subdomain, /^([a-z0-9-]+)\.keka\.com$/i);
  if (!slug) throw new Error("Keka company subdomain is required");
  if (!clientId || !clientSecret) throw new Error("Keka client ID and client secret are required");
  const tokenRes = await fetch("https://login.kekad.com/connect/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", "User-Agent": REQUEST_UA },
    body: new URLSearchParams({ grant_type: "client_credentials", scope: "kekaapi", client_id: clientId, client_secret: clientSecret }),
  });
  const tokenJson = (await tokenRes.json()) as { access_token?: string; error?: string };
  if (!tokenRes.ok || !tokenJson.access_token) throw new Error(tokenJson.error ?? "Keka token exchange failed");
  const data = await getJson(`https://${slug}.keka.com/api/v1/hire/jobs?JobStatus=1&pageSize=200`, {
    headers: { Authorization: `Bearer ${tokenJson.access_token}` },
  });
  const rows = Array.isArray(data) ? data : ((data as { data?: unknown }).data as unknown);
  if (!Array.isArray(rows)) throw new Error("Keka Hire API returned an unexpected response");
  const domain = companyDomain(undefined, slug);
  return (rows as Array<Record<string, unknown>>).slice(0, MAX_JOBS).map((job) => {
    const locs = (job.jobLocations as Array<{ city?: string; state?: string; countryName?: string; name?: string }> | undefined) ?? [];
    const location = joinLocation([locs[0]?.name, locs[0]?.city, locs[0]?.state, locs[0]?.countryName]);
    return {
      external_id: `keka_${slug}_${job.id ?? job.orgJobId}`,
      title: typeof job.title === "string" ? job.title : undefined,
      description: normalizeAtsHtml(typeof job.description === "string" ? job.description : undefined),
      application_url: typeof job.careerPortalUrl === "string" ? job.careerPortalUrl : `https://${slug}.keka.com/careers`,
      company_name: titleCaseCompany(slug),
      company_logo: logoForDomain(domain),
      company_website_url: domain ? `https://${domain}` : undefined,
      location,
      departments: typeof job.departmentName === "string" && job.departmentName ? [job.departmentName] : undefined,
      has_remote: /remote/i.test(location ?? ""),
      workplace_type: workplaceFromLabel(location),
      work_type: workTypeFromLabel(typeof job.jobType === "string" ? job.jobType : undefined),
      published_date: typeof job.publishedOn === "string" ? new Date(job.publishedOn).getTime() : undefined,
    };
  });
}

const ZOHO_DC: Record<string, { accounts: string; recruit: string }> = {
  com: { accounts: "https://accounts.zoho.com", recruit: "https://recruit.zoho.com" },
  in: { accounts: "https://accounts.zoho.in", recruit: "https://recruit.zoho.in" },
  eu: { accounts: "https://accounts.zoho.eu", recruit: "https://recruit.zoho.eu" },
  au: { accounts: "https://accounts.zoho.com.au", recruit: "https://recruit.zoho.com.au" },
  jp: { accounts: "https://accounts.zoho.jp", recruit: "https://recruit.zoho.jp" },
};

/** Zoho Recruit — refresh-token OAuth, then Job Openings API. */
export async function fetchZohoRecruit(clientId?: string, clientSecret?: string, refreshToken?: string, region?: string): Promise<NormalizedJob[]> {
  if (!clientId || !clientSecret || !refreshToken) throw new Error("Zoho client ID, client secret, and refresh token are required");
  const dc = ZOHO_DC[region === "com.au" ? "au" : (region ?? "com")] ?? ZOHO_DC.com!;
  const tokenRes = await fetch(`${dc.accounts}/oauth/v2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", "User-Agent": REQUEST_UA },
    body: new URLSearchParams({ grant_type: "refresh_token", client_id: clientId, client_secret: clientSecret, refresh_token: refreshToken }),
  });
  const tokenJson = (await tokenRes.json()) as { access_token?: string; error?: string };
  if (!tokenRes.ok || !tokenJson.access_token) throw new Error(tokenJson.error ?? "Zoho token refresh failed");
  const data = (await getJson(`${dc.recruit}/recruit/v2/JobOpenings`, {
    headers: { Authorization: `Zoho-oauthtoken ${tokenJson.access_token}` },
  })) as { data?: Array<Record<string, unknown>> };
  return (data.data ?? []).slice(0, MAX_JOBS).map((job) => {
    const title = String(job.Posting_Title || job.Job_Opening_Name || job.Name || "").trim();
    const location = joinLocation([typeof job.City === "string" ? job.City : undefined, typeof job.State === "string" ? job.State : undefined, typeof job.Country === "string" ? job.Country : undefined]);
    return {
      external_id: `zoho_${job.id}`,
      title,
      description: normalizeAtsHtml(typeof job.Job_Description === "string" ? job.Job_Description : undefined),
      application_url: undefined,
      company_name: typeof job.Client_Name === "string" ? job.Client_Name : undefined,
      location,
      departments: typeof job.Industry === "string" && job.Industry ? [job.Industry] : undefined,
      has_remote: /remote/i.test(location ?? "") || /remote/i.test(String(job.Job_Type ?? "")),
      workplace_type: workplaceFromLabel(location),
      work_type: workTypeFromLabel(typeof job.Job_Type === "string" ? job.Job_Type : undefined),
      published_date: typeof job.Date_Opened === "string" ? new Date(job.Date_Opened).getTime() : undefined,
    };
  });
}


/* ------------------------------------------------------------------ */
/* Additional public boards                                            */
/* ------------------------------------------------------------------ */

const SMART_DETAIL_LIMIT = 300;
const WORKDAY_DETAIL_LIMIT = 200;
const EIGHTFOLD_DETAIL_LIMIT = 150;
const RIPPLING_DETAIL_LIMIT = 150;

async function getText(url: string, accept = "text/plain") {
  const res = await fetch(url, {
    headers: { Accept: accept, "User-Agent": REQUEST_UA },
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`${url} failed: ${res.status}`);
  return text;
}

async function mapLimit<T, R>(items: T[], limit: number, mapper: (item: T, index: number) => Promise<R>) {
  const results: R[] = [];
  let cursor = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    for (;;) {
      const index = cursor++;
      if (index >= items.length) return;
      results[index] = await mapper(items[index], index);
    }
  });
  await Promise.all(workers);
  return results;
}

function splitIdentifier(value: string, count: number) {
  const parts = value.split("|").map((part) => part.trim());
  if (parts.length < count || parts.some((part) => !part)) {
    throw new Error("Board identifier is incomplete.");
  }
  return parts;
}

function xmlTag(block: string, tag: string) {
  const match = block.match(new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)</${tag}>`, "i"));
  if (!match) return "";
  return decodeHtmlEntities(match[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1").trim());
}

function xmlBlocks(xml: string, tag: string) {
  const regex = new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)</${tag}>`, "gi");
  const blocks: string[] = [];
  for (const match of xml.matchAll(regex)) blocks.push(match[1]);
  return blocks;
}

/** SmartRecruiters public postings API. */
export async function fetchSmartRecruiters(identifier: string): Promise<NormalizedJob[]> {
  const slug = slugFromInput(identifier.replace(/\|.*$/, ""), /$/i).trim();
  if (!slug) throw new Error("SmartRecruiters company identifier is required");
  const base = `https://api.smartrecruiters.com/v1/companies/${encodeURIComponent(slug)}/postings`;
  const postings: Array<Record<string, unknown>> = [];
  let offset = 0;
  for (;;) {
    const page = (await getJson(`${base}?limit=100&offset=${offset}`)) as {
      content?: Array<Record<string, unknown>>;
      totalFound?: number;
    };
    const rows = page.content ?? [];
    postings.push(...rows);
    if (rows.length < 100 || postings.length >= MAX_JOBS || offset >= Math.max(0, page.totalFound ?? 0)) break;
    offset += 100;
  }

  const details = new Map<string, Record<string, unknown>>();
  await mapLimit(postings.slice(0, SMART_DETAIL_LIMIT), 8, async (row) => {
    const id = String(row.id ?? "");
    if (!id) return null;
    try {
      details.set(id, (await getJson(`${base}/${encodeURIComponent(id)}`)) as Record<string, unknown>);
    } catch {
      // List data is still useful if one detail call fails.
    }
    return null;
  });

  return postings.slice(0, MAX_JOBS).map((row) => {
    const id = String(row.id ?? "");
    const detail = details.get(id);
    const locationObj = (row.location ?? detail?.location) as
      | { city?: string; country?: string; fullLocation?: string; remote?: boolean; hybrid?: boolean }
      | undefined;
    const location = locationObj?.fullLocation || joinLocation([locationObj?.city, locationObj?.country]);
    const remote = Boolean(locationObj?.remote);
    const hybrid = Boolean(locationObj?.hybrid);
    const department = (row.department as { label?: string } | undefined)?.label;
    const fn = (row.function as { label?: string } | undefined)?.label;
    const employment = (detail?.typeOfEmployment ?? row.typeOfEmployment) as { label?: string } | undefined;
    const released = detail?.releasedDate ?? row.releasedDate;
    const jobAd = (detail?.jobAd as { sections?: Record<string, { text?: string }> } | undefined) ?? undefined;
    const description = jobAd?.sections
      ? Object.values(jobAd.sections)
          .map((section) => section?.text)
          .filter((text): text is string => typeof text === "string" && text.trim().length > 0)
          .join("\n")
      : undefined;
    const company = (row.company ?? detail?.company) as { name?: string } | undefined;
    return {
      external_id: `sr_${slug}_${id}`,
      title: typeof row.name === "string" ? row.name.trim() : undefined,
      description: normalizeAtsHtml(description),
      application_url:
        typeof detail?.postingUrl === "string"
          ? detail.postingUrl
          : `https://jobs.smartrecruiters.com/${encodeURIComponent(slug)}/${encodeURIComponent(id)}`,
      company_name: company?.name ? titleCaseCompany(company.name) : titleCaseCompany(slug),
      company_logo: logoForDomain(companyDomain(undefined, slug)),
      company_website_url: companyDomain(undefined, slug) ? `https://${companyDomain(undefined, slug)}` : undefined,
      location,
      departments: [department, fn].filter((name): name is string => Boolean(name)),
      has_remote: remote || /remote/i.test(location ?? ""),
      workplace_type: remote ? "remote" : hybrid ? "hybrid" : location ? "on-site" : undefined,
      work_type: employment?.label ? workTypeFromLabel(employment.label) : undefined,
      language: typeof row.language === "object" && row.language && "code" in row.language ? String((row.language as { code?: string }).code ?? "") : undefined,
      published_date: typeof released === "string" ? new Date(released).getTime() : undefined,
    } satisfies NormalizedJob;
  });
}

function parseWorkdayIdentifier(identifier: string) {
  const [tenant, wd, site] = splitIdentifier(identifier, 3);
  return { tenant, wd, site, host: `${tenant}.${wd}.myworkdayjobs.com` };
}

/** Workday's public careers endpoint. List responses do not include descriptions, so details are bounded. */
export async function fetchWorkday(identifier: string): Promise<NormalizedJob[]> {
  const { tenant, wd, site, host } = parseWorkdayIdentifier(identifier);
  const endpoint = `https://${host}/wday/cxs/${encodeURIComponent(tenant)}/${encodeURIComponent(site)}/jobs`;
  const postings: Array<Record<string, unknown>> = [];
  let total = MAX_JOBS;
  for (let offset = 0; offset < MAX_JOBS; offset += 20) {
    const page = (await getJson(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ appliedFacets: {}, limit: 20, offset, searchText: "" }),
    })) as { jobPostings?: Array<Record<string, unknown>>; total?: number };
    const rows = page.jobPostings ?? [];
    postings.push(...rows);
    // Workday returns total=0 on later pages; only trust the first page.
    if (offset === 0 && typeof page.total === "number" && page.total > 0) total = page.total;
    if (rows.length < 20 || postings.length >= Math.min(MAX_JOBS, total)) break;
  }

  const details = new Map<string, Record<string, unknown>>();
  await mapLimit(postings.slice(0, WORKDAY_DETAIL_LIMIT), 6, async (posting) => {
    const externalPath = typeof posting.externalPath === "string" ? posting.externalPath : "";
    if (!externalPath) return null;
    try {
      const detail = (await getJson(`https://${host}/wday/cxs/${encodeURIComponent(tenant)}/${encodeURIComponent(site)}${externalPath}`)) as Record<string, unknown>;
      const info = detail.jobPostingInfo as Record<string, unknown> | undefined;
      if (info) details.set(externalPath, info);
    } catch {
      // Fall back to the list row.
    }
    return null;
  });

  return postings.slice(0, MAX_JOBS).map((posting) => {
    const externalPath = typeof posting.externalPath === "string" ? posting.externalPath : "";
    const info = details.get(externalPath);
    const bulletFields = Array.isArray(posting.bulletFields) ? posting.bulletFields : [];
    const firstBullet = typeof bulletFields[0] === "string" ? bulletFields[0] : undefined;
    const jobReqId = typeof info?.jobReqId === "string" ? info.jobReqId : firstBullet ?? externalPath.split("/").pop();
    const location = typeof info?.location === "string" ? info.location : typeof posting.locationsText === "string" ? posting.locationsText : undefined;
    const start = typeof info?.startDate === "string" ? new Date(`${info.startDate}T00:00:00Z`).getTime() : undefined;
    const posted = typeof info?.postedOn === "string" ? info.postedOn : typeof posting.postedOn === "string" ? posting.postedOn : undefined;
    return {
      external_id: `wd_${tenant}_${site}_${String(jobReqId ?? externalPath).replace(/[^a-z0-9_-]+/gi, "_")}`,
      title: typeof posting.title === "string" ? posting.title : typeof info?.title === "string" ? info.title : undefined,
      description: normalizeAtsHtml(typeof info?.jobDescription === "string" ? info.jobDescription : undefined),
      application_url: `https://${host}/en-US/${encodeURIComponent(site)}${externalPath}`,
      company_name: titleCaseCompany(tenant),
      company_logo: logoForDomain(`${tenant}.com`),
      company_website_url: `https://${tenant}.com`,
      location,
      departments: [],
      has_remote: /remote/i.test(location ?? ""),
      workplace_type: workplaceFromLabel(location),
      work_type: typeof info?.timeType === "string" ? workTypeFromLabel(info.timeType) : undefined,
      published_date: start ?? (posted && !Number.isNaN(Date.parse(posted)) ? new Date(posted).getTime() : undefined),
    } satisfies NormalizedJob;
  });
}

/** Workable's widget API includes descriptions with details=true. */
export async function fetchWorkable(identifier: string): Promise<NormalizedJob[]> {
  const slug = slugFromInput(identifier, /$/i).trim();
  if (!slug) throw new Error("Workable account subdomain is required");
  const data = (await getJson(`https://apply.workable.com/api/v1/widget/accounts/${encodeURIComponent(slug)}?details=true`)) as {
    name?: string;
    jobs?: Array<Record<string, unknown>>;
  };
  const domain = companyDomain(undefined, slug);
  return (data.jobs ?? []).slice(0, MAX_JOBS).map((job) => {
    const location = joinLocation([
      typeof job.city === "string" ? job.city : undefined,
      typeof job.state === "string" ? job.state : undefined,
      typeof job.country === "string" ? job.country : undefined,
    ]);
    const workplace = workplaceFromLabel(typeof job.workplace_type === "string" ? job.workplace_type : undefined) ?? (job.telecommuting === true ? "remote" : undefined);
    const created = typeof job.published_on === "string" ? job.published_on : typeof job.created_at === "string" ? job.created_at : undefined;
    return {
      external_id: `workable_${slug}_${String(job.shortcode ?? job.code ?? job.title ?? "")}`,
      title: typeof job.title === "string" ? job.title.trim() : undefined,
      description: normalizeAtsHtml(typeof job.description === "string" ? job.description : undefined),
      application_url: typeof job.application_url === "string" ? job.application_url : typeof job.url === "string" ? job.url : undefined,
      company_name: data.name ? titleCaseCompany(data.name) : titleCaseCompany(slug),
      company_logo: logoForDomain(domain),
      company_website_url: domain ? `https://${domain}` : undefined,
      location,
      departments: typeof job.department === "string" && job.department ? [job.department] : undefined,
      has_remote: workplace === "remote" || job.telecommuting === true,
      workplace_type: workplace,
      work_type: typeof job.employment_type === "string" ? workTypeFromLabel(job.employment_type) : undefined,
      published_date: created ? new Date(created).getTime() : undefined,
    } satisfies NormalizedJob;
  });
}

function parseOracleIdentifier(identifier: string) {
  const [host, site] = splitIdentifier(identifier, 2);
  return { host, site };
}

function oracleDescription(row: Record<string, unknown>) {
  return [row.ShortDescriptionStr, row.ExternalQualificationsStr, row.ExternalResponsibilitiesStr]
    .filter((value): value is string => typeof value === "string" && value.trim().length > 0)
    .join("\n");
}

/** Oracle Cloud HCM candidate-experience search API. */
export async function fetchOracleCloud(identifier: string): Promise<NormalizedJob[]> {
  const { host, site } = parseOracleIdentifier(identifier);
  const base = `https://${host}/hcmRestApi/resources/latest/recruitingCEJobRequisitions`;
  const results: NormalizedJob[] = [];
  for (let offset = 0; offset < MAX_JOBS; offset += 25) {
    const data = (await getJson(`${base}?finder=findReqs;siteNumber=${encodeURIComponent(site)}&limit=25&offset=${offset}&expand=requisitionList`)) as {
      items?: Array<{ requisitionList?: Array<Record<string, unknown>>; TotalJobsCount?: number }>;
    };
    const search = data.items?.[0];
    const rows = search?.requisitionList ?? [];
    for (const row of rows) {
      const id = String(row.Id ?? "");
      const location = typeof row.PrimaryLocation === "string" ? row.PrimaryLocation : undefined;
      const legal = typeof row.LegalEmployer === "string" ? row.LegalEmployer : undefined;
      results.push({
        external_id: `oracle_${site}_${id}`,
        title: typeof row.Title === "string" ? row.Title : undefined,
        description: normalizeAtsHtml(oracleDescription(row)),
        application_url: `https://${host}/hcmUI/CandidateExperience/en/sites/${encodeURIComponent(site)}/job/${encodeURIComponent(id)}`,
        company_name: legal || titleCaseCompany(host.split(".")[0] ?? site),
        company_logo: logoForDomain(companyDomain(undefined, host.split(".")[0])),
        location,
        departments: [row.Department, row.Organization, row.JobFamily].filter((value): value is string => typeof value === "string" && value.length > 0),
        has_remote: /remote/i.test(location ?? "") || /remote/i.test(String(row.WorkplaceType ?? "")),
        workplace_type: workplaceFromLabel(typeof row.WorkplaceType === "string" ? row.WorkplaceType : location),
        work_type: workTypeFromLabel(typeof row.JobType === "string" ? row.JobType : typeof row.JobSchedule === "string" ? row.JobSchedule : undefined),
        published_date: typeof row.PostedDate === "string" ? new Date(row.PostedDate).getTime() : undefined,
      });
      if (results.length >= MAX_JOBS) break;
    }
    if (rows.length < 25 || results.length >= MAX_JOBS || offset + 25 >= (search?.TotalJobsCount ?? 0)) break;
  }
  return results;
}

function parseEightfoldIdentifier(identifier: string) {
  const [host, domain] = splitIdentifier(identifier, 2);
  return { host: host.replace(/^https?:\/\//i, "").replace(/\/.*$/, ""), domain };
}

/** Eightfold-powered career sites. */
export async function fetchEightfold(identifier: string): Promise<NormalizedJob[]> {
  const { host, domain } = parseEightfoldIdentifier(identifier);
  const base = `https://${host}/api/apply/v2/jobs?domain=${encodeURIComponent(domain)}`;
  const positions: Array<Record<string, unknown>> = [];
  let start = 0;
  let total = Number.POSITIVE_INFINITY;
  while (positions.length < MAX_JOBS && start < total) {
    const page = (await getJson(`${base}&start=${start}&num=10`)) as {
      positions?: Array<Record<string, unknown>>;
      count?: number;
    };
    const rows = page.positions ?? [];
    if (typeof page.count === "number") total = page.count;
    positions.push(...rows);
    if (rows.length < 10) break;
    start += 10;
  }

  const details = new Map<string, Record<string, unknown>>();
  await mapLimit(positions.slice(0, EIGHTFOLD_DETAIL_LIMIT), 6, async (row) => {
    const id = String(row.id ?? "");
    if (!id) return null;
    try {
      details.set(id, (await getJson(`https://${host}/api/apply/v2/jobs/${encodeURIComponent(id)}?domain=${encodeURIComponent(domain)}`)) as Record<string, unknown>);
    } catch {
      // Keep the list row.
    }
    return null;
  });

  const company = titleCaseCompany(domain.split(".")[0] ?? domain);
  return positions.slice(0, MAX_JOBS).map((row) => {
    const id = String(row.id ?? row.ats_job_id ?? "");
    const detail = details.get(id);
    const location = typeof row.location === "string" ? row.location : undefined;
    const option = typeof row.work_location_option === "string" ? row.work_location_option : undefined;
    const created = typeof row.t_create === "number" ? row.t_create * 1000 : undefined;
    const description = detail?.job_description ?? row.job_description;
    return {
      external_id: `ef_${host}_${id}`,
      title: typeof row.name === "string" ? row.name : typeof row.posting_name === "string" ? row.posting_name : undefined,
      description: normalizeAtsHtml(typeof description === "string" ? description : undefined),
      application_url: typeof row.canonicalPositionUrl === "string" ? row.canonicalPositionUrl : undefined,
      company_name: titleCaseCompany(company),
      company_logo: logoForDomain(domain),
      company_website_url: `https://${domain}`,
      location,
      departments: typeof row.department === "string" && row.department ? [row.department] : undefined,
      has_remote: /remote/i.test(option ?? "") || /remote/i.test(location ?? ""),
      workplace_type: workplaceFromLabel(option) ?? workplaceFromLabel(location),
      work_type: typeof detail?.type === "string" ? workTypeFromLabel(detail.type) : undefined,
      published_date: created,
    } satisfies NormalizedJob;
  });
}

/** Rippling public job boards. */
export async function fetchRippling(identifier: string): Promise<NormalizedJob[]> {
  const slug = slugFromInput(identifier, /$/i).trim();
  if (!slug) throw new Error("Rippling board slug is required");
  const base = `https://ats.rippling.com/api/v2/board/${encodeURIComponent(slug)}/jobs`;
  const items: Array<Record<string, unknown>> = [];
  let page = 1;
  for (;;) {
    const data = (await getJson(`${base}?page=${page}&pageSize=50`)) as {
      items?: Array<Record<string, unknown>>;
      totalItems?: number;
    };
    const rows = data.items ?? [];
    items.push(...rows);
    if (rows.length < 50 || items.length >= MAX_JOBS || items.length >= (data.totalItems ?? 0)) break;
    page += 1;
  }

  const details = new Map<string, Record<string, unknown>>();
  await mapLimit(items.slice(0, RIPPLING_DETAIL_LIMIT), 6, async (item) => {
    const id = String(item.id ?? item.uuid ?? "");
    if (!id) return null;
    try {
      details.set(id, (await getJson(`${base}/${encodeURIComponent(id)}`)) as Record<string, unknown>);
    } catch {
      // Keep list data.
    }
    return null;
  });

  return items.slice(0, MAX_JOBS).map((item) => {
    const id = String(item.id ?? item.uuid ?? "");
    const detail = details.get(id);
    const listLocations = (item.locations as Array<{ name?: string; workplaceType?: string }> | undefined) ?? [];
    const detailLocations = (detail?.workLocations as string[] | undefined) ?? [];
    const location = listLocations[0]?.name ?? detailLocations[0] ?? undefined;
    const workplace = workplaceFromLabel(listLocations[0]?.workplaceType);
    const description = detail?.description as { company?: string; role?: string } | undefined;
    const pay = ((detail?.payRangeDetails as Array<{ currency?: string; rangeStart?: number; rangeEnd?: number; frequency?: string }> | undefined) ?? [])[0];
    const created = typeof detail?.createdOn === "string" ? detail.createdOn : undefined;
    return {
      external_id: `rippling_${slug}_${id}`,
      title: typeof item.name === "string" ? item.name : typeof detail?.name === "string" ? detail.name : undefined,
      description: normalizeAtsHtml([description?.company, description?.role].filter(Boolean).join("\n")),
      application_url: typeof item.url === "string" ? item.url : typeof detail?.url === "string" ? detail.url : undefined,
      company_name: titleCaseCompany(slug),
      company_logo: logoForDomain(companyDomain(undefined, slug)),
      company_website_url: `https://${companyDomain(undefined, slug)}`,
      location,
      departments: (item.department as { name?: string } | undefined)?.name ? [String((item.department as { name?: string }).name)] : undefined,
      has_remote: workplace === "remote",
      workplace_type: workplace,
      work_type: (detail?.employmentType as { id?: string } | undefined)?.id ?? undefined,
      salary_min: typeof pay?.rangeStart === "number" ? pay.rangeStart : undefined,
      salary_max: typeof pay?.rangeEnd === "number" ? pay.rangeEnd : undefined,
      salary_currency: typeof pay?.currency === "string" ? pay.currency : undefined,
      published_date: created ? new Date(created).getTime() : undefined,
    } satisfies NormalizedJob;
  });
}

/** Breezy HR public board JSON. */
export async function fetchBreezy(identifier: string): Promise<NormalizedJob[]> {
  const slug = slugFromInput(identifier, /\.breezy\.hr$/i).trim();
  if (!slug) throw new Error("Breezy HR company subdomain is required");
  const data = (await getJson(`https://${encodeURIComponent(slug)}.breezy.hr/json`)) as Array<Record<string, unknown>>;
  const company = data[0]?.company as { name?: string; logo_url?: string } | undefined;
  const domain = companyDomain(undefined, slug);
  return data.slice(0, MAX_JOBS).map((job) => {
    const locationObj = job.location as { name?: string; is_remote?: boolean } | undefined;
    const location = locationObj?.name;
    const type = job.type as { name?: string } | undefined;
    return {
      external_id: `breezy_${slug}_${job.id ?? job.friendly_id}`,
      title: typeof job.name === "string" ? job.name : undefined,
      application_url: typeof job.url === "string" ? job.url : undefined,
      company_name: company?.name ? titleCaseCompany(company.name) : titleCaseCompany(slug),
      company_logo: company?.logo_url || logoForDomain(domain),
      company_website_url: domain ? `https://${domain}` : undefined,
      location,
      departments: typeof job.department === "string" && job.department ? [job.department] : undefined,
      has_remote: Boolean(locationObj?.is_remote) || /remote/i.test(location ?? ""),
      workplace_type: locationObj?.is_remote ? "remote" : undefined,
      work_type: type?.name ? workTypeFromLabel(type.name) : undefined,
      published_date: typeof job.published_date === "string" ? new Date(job.published_date).getTime() : undefined,
    } satisfies NormalizedJob;
  });
}

/** Recruitee public offers API. */
export async function fetchRecruitee(identifier: string): Promise<NormalizedJob[]> {
  const slug = slugFromInput(identifier, /$/i).trim();
  if (!slug) throw new Error("Recruitee company subdomain is required");
  const data = (await getJson(`https://${encodeURIComponent(slug)}.recruitee.com/api/offers/`)) as {
    offers?: Array<Record<string, unknown>>;
  };
  const domain = companyDomain(undefined, slug);
  return (data.offers ?? []).slice(0, MAX_JOBS).map((offer) => {
    const salary = offer.salary as { min?: number; max?: number; currency?: string } | undefined;
    const workplace = offer.remote === true ? "remote" : offer.hybrid === true ? "hybrid" : offer.on_site === true ? "on-site" : undefined;
    return {
      external_id: `recruitee_${slug}_${offer.id ?? offer.guid ?? offer.slug}`,
      title: typeof offer.title === "string" ? offer.title : undefined,
      description: normalizeAtsHtml([offer.description, offer.requirements].filter((value): value is string => typeof value === "string" && value.length > 0).join("\n")),
      application_url: typeof offer.careers_url === "string" ? offer.careers_url : typeof offer.careers_apply_url === "string" ? offer.careers_apply_url : undefined,
      company_name: typeof offer.company_name === "string" ? titleCaseCompany(offer.company_name) : titleCaseCompany(slug),
      company_logo: logoForDomain(domain),
      company_website_url: domain ? `https://${domain}` : undefined,
      location:
        typeof offer.location === "string"
          ? offer.location
          : joinLocation([
              typeof offer.city === "string" ? offer.city : undefined,
              typeof offer.country === "string" ? offer.country : undefined,
            ]),
      departments: typeof offer.department === "string" && offer.department ? [offer.department] : undefined,
      has_remote: workplace === "remote",
      workplace_type: workplace,
      work_type: workTypeFromLabel(typeof offer.employment_type_code === "string" ? offer.employment_type_code : undefined),
      published_date: typeof offer.published_at === "string" ? new Date(offer.published_at).getTime() : undefined,
      salary_min: typeof salary?.min === "number" ? salary.min : undefined,
      salary_max: typeof salary?.max === "number" ? salary.max : undefined,
      salary_currency: typeof salary?.currency === "string" ? salary.currency : undefined,
    } satisfies NormalizedJob;
  });
}

/** Personio public XML feed. */
export async function fetchPersonio(identifier: string): Promise<NormalizedJob[]> {
  const slug = slugFromInput(identifier, /\.jobs\.personio\.de$/i).trim();
  if (!slug) throw new Error("Personio company subdomain is required");
  const xml = await getText(`https://${encodeURIComponent(slug)}.jobs.personio.de/xml`, "application/xml");
  const domain = companyDomain(undefined, slug);
  return xmlBlocks(xml, "position").slice(0, MAX_JOBS).map((block) => {
    const descriptionBlocks = xmlBlocks(block, "jobDescription")
      .map((desc) => [xmlTag(desc, "name"), xmlTag(desc, "value")].filter(Boolean).join(": "))
      .filter(Boolean)
      .join("\n");
    const additionalOffices = xmlTag(block, "additionalOffices").replace(/<[^>]+>/g, " ").trim();
    const location = joinLocation([xmlTag(block, "office"), additionalOffices]);
    const published = xmlTag(block, "createdAt");
    return {
      external_id: `personio_${slug}_${xmlTag(block, "id")}`,
      title: xmlTag(block, "name") || undefined,
      description: normalizeAtsHtml(descriptionBlocks || undefined),
      application_url: `https://${slug}.jobs.personio.de/job/${encodeURIComponent(xmlTag(block, "id"))}`,
      company_name: xmlTag(block, "subcompany") ? titleCaseCompany(xmlTag(block, "subcompany")) : titleCaseCompany(slug),
      company_logo: logoForDomain(domain),
      company_website_url: domain ? `https://${domain}` : undefined,
      location,
      departments: [xmlTag(block, "department"), xmlTag(block, "recruitingCategory")].filter(Boolean),
      has_remote: /remote/i.test(location ?? ""),
      workplace_type: workplaceFromLabel(location),
      work_type: workTypeFromLabel(xmlTag(block, "schedule") || xmlTag(block, "employmentType")),
      published_date: published ? new Date(published).getTime() : undefined,
    } satisfies NormalizedJob;
  });
}

/** Teamtailor publishes an RSS feed at /jobs.rss on a company's careers host. */
export async function fetchTeamtailor(identifier: string): Promise<NormalizedJob[]> {
  const host = identifier.replace(/^https?:\/\//i, "").replace(/\/.*$/, "").trim();
  if (!host) throw new Error("Teamtailor careers host is required");
  const xml = await getText(`https://${encodeURIComponent(host)}/jobs.rss`, "application/rss+xml");
  const channel = xmlBlocks(xml, "channel")[0] ?? "";
  const channelTitle = channel ? xmlTag(channel, "title") : "";
  const hostRoot = host.split(".").slice(-2).join(".");
  const domain = host.endsWith(".teamtailor.com") ? "teamtailor.com" : hostRoot;
  return xmlBlocks(xml, "item").slice(0, MAX_JOBS).map((item) => {
    const locations = xmlBlocks(item, "tt:location");
    const location = locations[0]
      ? [xmlTag(locations[0], "tt:city"), xmlTag(locations[0], "tt:country")].filter(Boolean).join(", ")
      : undefined;
    const published = xmlTag(item, "pubDate");
    return {
      external_id: `teamtailor_${xmlTag(item, "guid") || xmlTag(item, "link")}`,
      title: xmlTag(item, "title") || undefined,
      description: normalizeAtsHtml(xmlTag(item, "description") || undefined),
      application_url: xmlTag(item, "link") || undefined,
      company_name: channelTitle ? titleCaseCompany(channelTitle) : titleCaseCompany(host.split(".")[0]),
      company_logo: logoForDomain(domain),
      company_website_url: domain ? `https://${domain}` : undefined,
      location,
      departments: [xmlTag(item, "tt:department")].filter(Boolean),
      has_remote: /remote/i.test(xmlTag(item, "remoteStatus")) || /remote/i.test(location ?? ""),
      workplace_type: workplaceFromLabel(xmlTag(item, "remoteStatus") || location),
      published_date: published ? new Date(published).getTime() : undefined,
    } satisfies NormalizedJob;
  });
}


export type ProviderFetchArgs = {
  provider: string;
  subdomain?: string;
  apiKey?: string;
  clientId?: string;
  refreshToken?: string;
  region?: string;
};

export async function fetchJobsForProvider(args: ProviderFetchArgs): Promise<NormalizedJob[]> {
  switch (args.provider) {
    case "greenhouse":
      if (!args.subdomain) throw new Error("Greenhouse board slug is required");
      return await fetchGreenhouse(args.subdomain);
    case "lever":
      if (!args.subdomain) throw new Error("Lever site slug is required");
      return await fetchLever(args.subdomain);
    case "ashby":
      if (!args.subdomain) throw new Error("Ashby job board name is required");
      return await fetchAshby(args.subdomain);
    case "bamboohr":
      if (!args.subdomain) throw new Error("BambooHR company subdomain is required");
      return await fetchBambooHR(args.subdomain, args.apiKey);
    case "keka":
      if (!args.subdomain) throw new Error("Keka company subdomain is required");
      return await fetchKeka(args.subdomain, args.clientId, args.apiKey);
    case "zoho_recruit":
      return await fetchZohoRecruit(args.clientId, args.apiKey, args.refreshToken, args.region);
    case "smartrecruiters":
      if (!args.subdomain) throw new Error("SmartRecruiters company identifier is required");
      return await fetchSmartRecruiters(args.subdomain);
    case "workday":
      if (!args.subdomain) throw new Error("Workday board identifier is required");
      return await fetchWorkday(args.subdomain);
    case "workable":
      if (!args.subdomain) throw new Error("Workable account subdomain is required");
      return await fetchWorkable(args.subdomain);
    case "oracle_cloud":
      if (!args.subdomain) throw new Error("Oracle Cloud HCM board identifier is required");
      return await fetchOracleCloud(args.subdomain);
    case "eightfold":
      if (!args.subdomain) throw new Error("Eightfold board identifier is required");
      return await fetchEightfold(args.subdomain);
    case "rippling":
      if (!args.subdomain) throw new Error("Rippling board slug is required");
      return await fetchRippling(args.subdomain);
    case "breezy":
      if (!args.subdomain) throw new Error("Breezy HR company subdomain is required");
      return await fetchBreezy(args.subdomain);
    case "recruitee":
      if (!args.subdomain) throw new Error("Recruitee company subdomain is required");
      return await fetchRecruitee(args.subdomain);
    case "personio":
      if (!args.subdomain) throw new Error("Personio company subdomain is required");
      return await fetchPersonio(args.subdomain);
    case "teamtailor":
      if (!args.subdomain) throw new Error("Teamtailor careers host is required");
      return await fetchTeamtailor(args.subdomain);
    case "darwinbox":
    case "icims":
      throw new Error(`${args.provider} requires vendor-approved API access. Submit a request from Integrations.`);
    default:
      throw new Error(`No sync is implemented for ${args.provider}`);
  }
}

