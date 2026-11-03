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

/** Static pages, blog posts, and company pages. Jobs live in monthly files. */
export const getServerSideProps: GetServerSideProps = async ({ req, res }) => {
  const host = (req.headers["x-forwarded-host"] || req.headers.host) as string | undefined;
  const proto = (req.headers["x-forwarded-proto"] || "https") as string;
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
    (host ? `${proto}://${host}` : "https://qelsa.com");
  const client = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL || "http://127.0.0.1:3210");

  let blogs: Array<{ slug: string; updated_at: number }> = [];
  try {
    blogs = (await client.query(api.blog.listSitemap, {})) as Array<{
      slug: string;
      updated_at: number;
    }>;
  } catch (error) {
    console.error("[Sitemap] Could not load blog posts", error);
  }

  const companies: Array<{ id: string; createdAt: number }> = [];
  let cursor: string | null = null;
  try {
    for (let page = 0; page < 225; page += 1) {
      const result = (await client.query(api.pages.sitemap, {
        cursor,
        limit: 200,
      })) as {
        pages: Array<{ id: string; createdAt: number }>;
        cursor: string | null;
        isDone: boolean;
      };
      companies.push(...result.pages);
      if (result.isDone || !result.cursor || result.pages.length === 0) break;
      cursor = result.cursor;
    }
  } catch (error) {
    console.error("[Sitemap] Could not load company pages", error);
  }

  const entries: SitemapEntry[] = [
    ...STATIC_PATHS.map((path) => ({ loc: `${siteUrl}${path}` })),
    ...blogs.map((post) => ({
      loc: `${siteUrl}/blog/${post.slug}`,
      lastmod: iso(post.updated_at),
    })),
    ...companies.map((company) => ({
      loc: `${siteUrl}/pages/${company.id}`,
      lastmod: iso(company.createdAt),
    })),
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

export default function StaticSitemap() {
  return null;
}
