import { api } from "@/lib/convexApi";
import { ConvexHttpClient } from "convex/browser";
import type { GetServerSideProps } from "next";

const STATIC_PATHS = [
  "/",
  "/jobs/all",
  "/courses",
  "/blog",
  "/candidates",
  "/employers",
  "/privacy",
  "/terms",
  "/cookies",
];

const JOB_PAGE_SIZE = 200;
const MAX_JOB_PAGES = 225; // 45k URLs, leaving room for static, blog, and company pages.
const MAX_PAGE_FEED = 225;

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

export const getServerSideProps: GetServerSideProps = async ({ req, res }) => {
  const host = (req.headers["x-forwarded-host"] || req.headers.host) as string | undefined;
  const proto = (req.headers["x-forwarded-proto"] || "https") as string;
  const siteUrl = (
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
    (host ? `${proto}://${host}` : "https://qelsa.com")
  );

  const client = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL || "http://127.0.0.1:3210");

  let blogs: Array<{ slug: string; updated_at: number }> = [];
  try {
    blogs = (await client.query(api.blog.listSitemap, {})) as Array<{ slug: string; updated_at: number }>;
  } catch (error) {
    console.error("[Sitemap] Could not load blog posts", error);
  }

  const companyPages: Array<{ id: string; createdAt: number }> = [];
  let pageCursor: string | null = null;
  try {
    for (let page = 0; page < MAX_PAGE_FEED; page += 1) {
      const result = (await client.query(api.pages.sitemap, {
        cursor: pageCursor,
        limit: JOB_PAGE_SIZE,
      })) as {
        pages: Array<{ id: string; createdAt: number }>;
        cursor: string | null;
        isDone: boolean;
      };
      companyPages.push(...result.pages);
      if (result.isDone || !result.cursor || result.pages.length === 0) break;
      pageCursor = result.cursor;
    }
  } catch (error) {
    console.error("[Sitemap] Could not load company pages", error);
  }

  // Open jobs are paginated in small batches; descriptions make full job rows
  // large, so a single unbounded read would exceed the query budget.
  const jobEntries: SitemapEntry[] = [];
  let cursor: string | null = null;
  try {
    for (let page = 0; page < MAX_JOB_PAGES; page += 1) {
      const result = (await client.query(api.jobs.sitemapPage, {
        cursor,
        limit: JOB_PAGE_SIZE,
      })) as {
        jobs: Array<{ id: string; published: number | null }>;
        cursor: string | null;
        isDone: boolean;
      };
      jobEntries.push(
        ...result.jobs.map((job) => ({
          loc: `${siteUrl}/jobs/${job.id}`,
          lastmod: iso(job.published),
        })),
      );
      if (result.isDone || !result.cursor || result.jobs.length === 0) break;
      cursor = result.cursor;
    }
  } catch (error) {
    console.error("[Sitemap] Could not load jobs", error);
  }

  const entries: SitemapEntry[] = [
    ...STATIC_PATHS.map((path) => ({ loc: `${siteUrl}${path}` })),
    ...blogs.map((post) => ({
      loc: `${siteUrl}/blog/${post.slug}`,
      lastmod: iso(post.updated_at),
    })),
    ...companyPages.map((page) => ({
      loc: `${siteUrl}/pages/${page.id}`,
      lastmod: iso(page.createdAt),
    })),
    ...jobEntries,
  ];

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

export default function Sitemap() {
  return null;
}
