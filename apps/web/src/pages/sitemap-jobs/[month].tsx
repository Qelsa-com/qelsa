import { api } from "@/lib/convexApi";
import { ConvexHttpClient } from "convex/browser";
import type { GetServerSideProps } from "next";

interface SitemapEntry {
  loc: string;
  lastmod?: string;
}

function escapeXml(value: string) {
  return value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" })[char] ?? char);
}

function iso(value?: number | null) {
  if (value == null) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

const MAX_URLS = 50_000;

export const getServerSideProps: GetServerSideProps = async ({ req, res, params }) => {
  const monthKey = typeof params?.month === "string" ? params.month : "";
  const match = /^(\d{4})-(\d{2})$/.exec(monthKey);
  if (!match) return { notFound: true };
  const year = Number(match[1]);
  const month = Number(match[2]);
  if (month < 1 || month > 12) return { notFound: true };

  const host = (req.headers["x-forwarded-host"] || req.headers.host) as string | undefined;
  const proto = (req.headers["x-forwarded-proto"] || "https") as string;
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
    (host ? `${proto}://${host}` : "https://qelsa.com");
  const client = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL || "http://127.0.0.1:3210");

  const entries: SitemapEntry[] = [];
  let cursor: string | null = null;
  try {
    for (;;) {
      const result = (await client.query(api.jobs.sitemapMonthPage, {
        year,
        month,
        cursor,
        limit: 200,
      })) as {
        jobs: Array<{
          id: string;
          slug: string | null;
          published: number | null;
          hasDescription: boolean;
        }>;
        cursor: string | null;
        isDone: boolean;
      };
      entries.push(
        ...result.jobs
          .filter((job) => job.hasDescription)
          .map((job) => ({
            loc: `${siteUrl}/jobs/${job.slug ?? job.id}`,
            lastmod: iso(job.published),
          })),
      );
      if (result.isDone || !result.cursor || result.jobs.length === 0) break;
      if (entries.length >= MAX_URLS) break;
      cursor = result.cursor;
    }
  } catch (error) {
    console.error(`[Sitemap] Could not load jobs for ${monthKey}`, error);
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries
  .map(
    (entry) =>
      `  <url><loc>${escapeXml(entry.loc)}</loc>${entry.lastmod ? `<lastmod>${entry.lastmod}</lastmod>` : ""}</url>`,
  )
  .join("\n")}
</urlset>`;
  res.setHeader("Content-Type", "application/xml; charset=utf-8");
  res.setHeader("Cache-Control", "public, s-maxage=3600, stale-while-revalidate=86400");
  res.write(xml);
  res.end();
  return { props: {} };
};

export default function JobsSitemap() {
  return null;
}
