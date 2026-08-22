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

const ATS_HOST =
  /(^|\.)(greenhouse\.io|lever\.co|ashbyhq\.com|bamboohr\.com|myworkdayjobs\.com|zohorecruit\.(com|in|eu|com\.au)|keka\.com|darwinbox\.(in|com|io)|icims\.com)$/i;

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

export async function fetchLever(subdomain: string): Promise<NormalizedJob[]> {
  const slug = slugFromInput(subdomain, /\.lever\.co$/i);
  if (!slug) throw new Error("Lever board slug is required");
  const res = await fetch(`https://api.lever.co/v0/postings/${slug}?mode=json`, { headers: { "User-Agent": REQUEST_UA } });
  if (!res.ok) throw new Error(`Lever board "${slug}" was not found (${res.status})`);
  const data = (await res.json()) as Array<Record<string, unknown>>;
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
    case "workday":
    case "darwinbox":
    case "icims":
      throw new Error(`${args.provider} requires vendor-approved API access. Submit a request from Integrations.`);
    default:
      throw new Error(`No sync is implemented for ${args.provider}`);
  }
}

