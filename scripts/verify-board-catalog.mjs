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
 * (Equivalently: `node scripts/verify-board-catalog.mjs [--fix]`.)
 *
 * Note that a transient network or rate-limit error is reported as "dead",
 * so a non-zero exit means "re-run me and eyeball the list" rather than
 * "definitely edit the catalog".
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

const ENDPOINTS = {
  greenhouse: (slug) =>
    `https://boards-api.greenhouse.io/v1/boards/${encodeURIComponent(slug)}/jobs`,
  ashby: (slug) =>
    `https://api.ashbyhq.com/posting-api/job-board/${encodeURIComponent(slug)}`,
};

// Lever boards live in two regions; a 404 on one host just means "try the other".
const LEVER_HOSTS = ["https://api.lever.co", "https://api.eu.lever.co"];

/** @returns {Promise<number|null>} open roles, or null when the board is gone */
async function probe(provider, slug) {
  const headers = { "user-agent": "qelsa-board-catalog-check/1.0" };
  try {
    if (provider === "lever") {
      for (const host of LEVER_HOSTS) {
        const res = await fetch(
          `${host}/v0/postings/${encodeURIComponent(slug)}?mode=json`,
          { headers },
        );
        if (res.ok) {
          const body = await res.json();
          return Array.isArray(body) ? body.length : null;
        }
      }
      return null;
    }
    const res = await fetch(ENDPOINTS[provider](slug), { headers });
    if (!res.ok) return null;
    const body = await res.json();
    return Array.isArray(body?.jobs) ? body.jobs.length : null;
  } catch {
    return null;
  }
}

/**
 * Parse `    { slug: "foo", label: "Foo", region: "global", roles: 12 },`
 * grouped under the `greenhouse: [` / `lever: [` / `ashby: [` section header.
 *
 * @returns {Array<{provider: string, slug: string, roles: number, line: number}>}
 */
function parseCatalog(source) {
  const entries = [];
  let provider = null;
  source.split("\n").forEach((line, lineNo) => {
    const header = line.match(/^\s*(greenhouse|lever|ashby):\s*\[$/);
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
  const results = await Promise.all(slice.map((e) => probe(e.provider, e.slug)));
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
  for (const d of drifted.slice(0, 40)) {
    console.log(`   ${d.provider}/${d.slug}: ${d.roles} -> ${d.now}`);
  }
}
if (empty.length) {
  console.log(`\nBoards with no open roles (${empty.length}) — still valid:`);
  for (const e of empty) console.log(`   ${e.provider}/${e.slug}`);
}
if (dead.length) {
  console.log(`\nDead boards (${dead.length}) — no longer resolvable:`);
  for (const e of dead) console.log(`   ${e.provider}/${e.slug}`);
}

if (dead.length && FIX) {
  const dropLines = new Set(dead.map((e) => e.line));
  const cleaned = source
    .split("\n")
    .filter((_, i) => !dropLines.has(i))
    .join("\n");
  await writeFile(CATALOG, cleaned, "utf8");
  console.log(`\nRemoved ${dead.length} dead entries from the catalog.`);
}

process.exit(dead.length ? 1 : 0);
