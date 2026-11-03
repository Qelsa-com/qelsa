import { api } from "@/lib/convexApi";
import { ConvexHttpClient } from "convex/browser";
import type { GetServerSideProps } from "next";

function escapeXml(value: string) {
  return value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" })[char] ?? char);
}

function monthKeys(minMs: number, maxMs: number) {
  const start = new Date(minMs);
  const end = new Date(maxMs);
  const keys: string[] = [];
  let year = start.getUTCFullYear();
  let month = start.getUTCMonth();
  const endYear = end.getUTCFullYear();
  const endMonth = end.getUTCMonth();
  for (let guard = 0; guard < 240; guard += 1) {
    keys.push(`${year}-${String(month + 1).padStart(2, "0")}`);
    if (year === endYear && month === endMonth) break;
    month += 1;
    if (month > 11) {
      month = 0;
      year += 1;
    }
  }
  return keys;
}

/** Sitemap index: static/blog/company pages plus one file per month of jobs. */
export const getServerSideProps: GetServerSideProps = async ({ req, res }) => {
  const host = (req.headers["x-forwarded-host"] || req.headers.host) as string | undefined;
  const proto = (req.headers["x-forwarded-proto"] || "https") as string;
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
    (host ? `${proto}://${host}` : "https://qelsa.com");
  const client = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL || "http://127.0.0.1:3210");

  let bounds: { min: number | null; max: number | null } = { min: null, max: null };
  try {
    bounds = (await client.query(api.jobs.sitemapBounds, {})) as {
      min: number | null;
      max: number | null;
    };
  } catch (error) {
    console.error("[Sitemap] Could not load job date bounds", error);
  }

  const locs = [`${siteUrl}/sitemap-static.xml`];
  if (bounds.min != null && bounds.max != null) {
    for (const month of monthKeys(bounds.min, bounds.max)) {
      locs.push(`${siteUrl}/sitemap-jobs/${month}`);
    }
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${locs.map((loc) => `  <sitemap><loc>${escapeXml(loc)}</loc></sitemap>`).join("\n")}
</sitemapindex>`;
  res.setHeader("Content-Type", "application/xml; charset=utf-8");
  res.setHeader("Cache-Control", "public, s-maxage=3600, stale-while-revalidate=86400");
  res.write(xml);
  res.end();
  return { props: {} };
};

export default function SitemapIndex() {
  return null;
}
