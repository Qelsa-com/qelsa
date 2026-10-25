#!/usr/bin/env node
/**
 * Re-verify every board slug in the admin public-board company catalog.
 *
 * The catalog is curated by hand, so board tokens rot: companies delete
 * boards, move ATS, or close hiring. Run this before trusting the list after
 * a long gap:
 *
 *   pnpm check:board-catalog                       # report dead boards
 *   pnpm check:board-catalog -- --fix              # also drop them from the file
 *
 * A transient network or rate-limit error is reported as "dead", so a non-zero
 * exit means "re-run me and eyeball the list" rather than "definitely edit the
 * catalog".
 *
 * Exits non-zero when anything is dead, so it can gate CI.
 */
import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CATALOG = path.join(ROOT, "apps/admin/src/components/ats/boardCatalog.ts");
const FIX = process.argv.includes("--fix");
const CONCURRENCY = 8;
const PROVIDERS = [
  "greenhouse",
  "lever",
  "ashby",
  "smartrecruiters",
  "workday",
  "workable",
  "oracle_cloud",
  "eightfold",
  "rippling",
  "breezy",
  "recruitee",
  "personio",
  "teamtailor",
  "darwinbox",
  "keka",
  "zoho_recruit",
];
const PROVIDER_RE = PROVIDERS.join("|");
const headers = { "user-agent": "qelsa-board-catalog-check/1.0" };

const LEVER_HOSTS = ["https://api.lever.co", "https://api.eu.lever.co"];

async function json(url, init) {
  const res = await fetch(url, { ...init, headers: { ...headers, accept: "application/json", ...(init?.headers ?? {}) } });
  if (!res.ok) return null;
  return await res.json();
}

function split(value, count) {
  const parts = value.split("|").map((part) => part.trim());
  return parts.length >= count ? parts : null;
}

function decodeEntities(value) {
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

function hiddenInputJson(html, id) {
  for (const tag of html.match(/<input\b[^>]*>/gi) ?? []) {
    if (!new RegExp(`\\bid\\s*=\\s*["']${id}["']`, "i").test(tag)) continue;
    const value = tag.match(/\bvalue\s*=\s*"([\s\S]*?)"(?=\s|\/?>)/i)?.[1];
    if (!value) return undefined;
    try {
      return JSON.parse(decodeEntities(value));
    } catch {
      return undefined;
    }
  }
  return undefined;
}

/** @returns {Promise<number|null>} open roles, or null when the board is gone */
async function probe(provider, slug) {
  try {
    if (provider === "lever") {
      for (const host of LEVER_HOSTS) {
        const body = await json(`${host}/v0/postings/${encodeURIComponent(slug)}?mode=json`);
        if (Array.isArray(body)) return body.length;
      }
      return null;
    }

    if (provider === "greenhouse") {
      const body = await json(`https://boards-api.greenhouse.io/v1/boards/${encodeURIComponent(slug)}/jobs`);
      return Array.isArray(body?.jobs) ? body.jobs.length : null;
    }

    if (provider === "ashby") {
      const body = await json(`https://api.ashbyhq.com/posting-api/job-board/${encodeURIComponent(slug)}`);
      return Array.isArray(body?.jobs) ? body.jobs.length : null;
    }

    if (provider === "smartrecruiters") {
      const body = await json(`https://api.smartrecruiters.com/v1/companies/${encodeURIComponent(slug)}/postings?limit=1`);
      return typeof body?.totalFound === "number" ? body.totalFound : null;
    }

    if (provider === "workday") {
      const parts = split(slug, 3);
      if (!parts) return null;
      const [tenant, wd, site] = parts;
      const body = await json(`https://${tenant}.${wd}.myworkdayjobs.com/wday/cxs/${encodeURIComponent(tenant)}/${encodeURIComponent(site)}/jobs`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ appliedFacets: {}, limit: 1, offset: 0, searchText: "" }),
      });
      return typeof body?.total === "number" ? body.total : Array.isArray(body?.jobPostings) ? body.jobPostings.length : null;
    }

    if (provider === "workable") {
      const body = await json(`https://apply.workable.com/api/v1/widget/accounts/${encodeURIComponent(slug)}?details=true`);
      return Array.isArray(body?.jobs) ? body.jobs.length : null;
    }

    if (provider === "oracle_cloud") {
      const parts = split(slug, 2);
      if (!parts) return null;
      const [host, site] = parts;
      const body = await json(
        `https://${host}/hcmRestApi/resources/latest/recruitingCEJobRequisitions?finder=findReqs;siteNumber=${encodeURIComponent(site)}&limit=1&offset=0&expand=requisitionList`,
      );
      return typeof body?.items?.[0]?.TotalJobsCount === "number"
        ? body.items[0].TotalJobsCount
        : Array.isArray(body?.items?.[0]?.requisitionList)
          ? body.items[0].requisitionList.length
          : null;
    }

    if (provider === "eightfold") {
      const parts = split(slug, 2);
      if (!parts) return null;
      const [host, domain] = parts;
      const body = await json(`https://${host}/api/apply/v2/jobs?domain=${encodeURIComponent(domain)}&start=0&num=1`);
      return typeof body?.count === "number" ? body.count : null;
    }


    if (provider === "darwinbox") {
      const parts = split(slug, 2);
      if (!parts) return null;
      const [host, companyId] = parts;
      const origin = `https://${host}`;
      const body = await json(`${origin}/ms/candidateapi/job/alljobs?companyId=${encodeURIComponent(companyId)}`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          origin,
          referer: `${origin}/ms/candidatev2/${encodeURIComponent(companyId)}/careers/allJobs`,
        },
        body: JSON.stringify({ companyId, page: 1, sort_option: "new", limit: 1 }),
      });
      return typeof body?.job_counts === "number" ? body.job_counts : Array.isArray(body?.data) ? body.data.length : null;
    }

    if (provider === "keka") {
      const origin = `https://${encodeURIComponent(slug)}.keka.com`;
      const pageRes = await fetch(`${origin}/careers`, { headers });
      if (!pageRes.ok) return null;
      const page = await pageRes.text();
      const portalDocument = page.match(/\/ats\/documents\/[^'"\s]+\.html/)?.[0];
      if (!portalDocument) return null;
      const portal = await (await fetch(`${origin}${portalDocument}`, { headers })).text();
      const identifier = portal.match(/identifier\s*:\s*['"]([^'"]+)['"]/i)?.[1];
      if (!identifier) return null;
      const portalName = portal.match(/portalName\s*:\s*['"]([^'"]+)['"]/i)?.[1] || "default";
      const body = await json(`${origin}/careers/api/embedjobs/${encodeURIComponent(portalName)}/active/${encodeURIComponent(identifier)}`);
      return Array.isArray(body) ? body.length : null;
    }

    if (provider === "zoho_recruit") {
      const origin = `https://${encodeURIComponent(slug)}.zohorecruit.com`;
      const res = await fetch(`${origin}/jobs/careers`, { headers });
      if (!res.ok) return null;
      const jobs = hiddenInputJson(await res.text(), "jobs");
      return Array.isArray(jobs) ? jobs.length : null;
    }

    if (provider === "rippling") {
      const body = await json(`https://ats.rippling.com/api/v2/board/${encodeURIComponent(slug)}/jobs?page=1&pageSize=1`);
      return typeof body?.totalItems === "number" ? body.totalItems : null;
    }

    if (provider === "breezy") {
      const body = await json(`https://${encodeURIComponent(slug)}.breezy.hr/json`);
      return Array.isArray(body) ? body.length : null;
    }

    if (provider === "recruitee") {
      const body = await json(`https://${encodeURIComponent(slug)}.recruitee.com/api/offers/`);
      return Array.isArray(body?.offers) ? body.offers.length : null;
    }

    if (provider === "personio" || provider === "teamtailor") {
      const url =
        provider === "personio"
          ? `https://${encodeURIComponent(slug)}.jobs.personio.de/xml`
          : `https://${encodeURIComponent(slug)}/jobs.rss`;
      const res = await fetch(url, { headers });
      if (!res.ok) return null;
      const text = await res.text();
      return (text.match(provider === "personio" ? /<position>/g : /<item>/g) ?? []).length;
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Parse `{ slug: "foo", label: "Foo", region: "global", roles: 12 },`
 * grouped under each provider's array section.
 */
function parseCatalog(source) {
  const entries = [];
  let provider = null;
  source.split("\n").forEach((line, lineNo) => {
    const header = line.match(new RegExp(`^\\s*(${PROVIDER_RE}):\\s*\\[$`));
    if (header) {
      provider = header[1];
      return;
    }
    if (!provider) return;
    const entry = line.match(
      /^\s*\{\s*slug:\s*"([^"]+)",\s*label:\s*"([^"]*)",\s*region:\s*"([^"]+)",\s*roles:\s*(\d+)\s*\},$/,
    );
    if (entry) entries.push({ provider, slug: entry[1], roles: Number(entry[4]), line: lineNo });
  });
  return entries;
}

const source = await readFile(CATALOG, "utf8");
const entries = parseCatalog(source);
if (entries.length === 0) {
  console.error(`No catalog entries parsed from ${path.relative(ROOT, CATALOG)}`);
  process.exit(2);
}

const dead = [];
const empty = [];
const drifted = [];
let checked = 0;

for (let i = 0; i < entries.length; i += CONCURRENCY) {
  const slice = entries.slice(i, i + CONCURRENCY);
  const results = await Promise.all(slice.map((entry) => probe(entry.provider, entry.slug)));
  results.forEach((roles, j) => {
    const entry = slice[j];
    checked += 1;
    if (roles === null) dead.push(entry);
    else if (roles === 0) empty.push(entry);
    else if (roles !== entry.roles) drifted.push({ ...entry, now: roles });
  });
}

console.log(`Checked ${checked} boards.`);

if (drifted.length) {
  console.log(`\nRole counts drifted (${drifted.length}) — informational only:`);
  for (const entry of drifted.slice(0, 40)) {
    console.log(`   ${entry.provider}/${entry.slug}: ${entry.roles} -> ${entry.now}`);
  }
}
if (empty.length) {
  console.log(`\nBoards with no open roles (${empty.length}) — still valid:`);
  for (const entry of empty) console.log(`   ${entry.provider}/${entry.slug}`);
}
if (dead.length) {
  console.log(`\nDead boards (${dead.length}) — no longer resolvable:`);
  for (const entry of dead) console.log(`   ${entry.provider}/${entry.slug}`);
}

if (dead.length && FIX) {
  const dropLines = new Set(dead.map((entry) => entry.line));
  const cleaned = source
    .split("\n")
    .filter((_, index) => !dropLines.has(index))
    .join("\n");
  await writeFile(CATALOG, cleaned, "utf8");
  console.log(`\nRemoved ${dead.length} dead entries from the catalog.`);
}

process.exit(dead.length ? 1 : 0);
