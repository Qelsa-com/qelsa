import { api } from "@/lib/convexApi";
import { ConvexHttpClient } from "convex/browser";
import type { GetServerSideProps } from "next";

const STATIC_PATHS = ["/", "/jobs", "/jobs/all", "/courses", "/blogs", "/candidates", "/employers", "/privacy", "/terms"];

function escapeXml(value: string) {
  return value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" })[char] ?? char);
}

export const getServerSideProps: GetServerSideProps = async ({ req, res }) => {
  const host = (req.headers["x-forwarded-host"] || req.headers.host) as string | undefined;
  const proto = (req.headers["x-forwarded-proto"] || "https") as string;
  const siteUrl = (
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
    (host ? `${proto}://${host}` : "https://qelsa.com")
  );
  let blogs: Array<{ slug: string; updated_at: number }> = [];
  try {
    const client = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL || "http://127.0.0.1:3210");
    blogs = (await client.query(api.blog.listSitemap, {})) as Array<{ slug: string; updated_at: number }>;
  } catch (error) {
    console.error("[Sitemap] Could not load blog posts", error);
  }
  const entries = [
    ...STATIC_PATHS.map((path) => ({ loc: `${siteUrl}${path}`, lastmod: undefined })),
    ...blogs.map((post) => ({ loc: `${siteUrl}/blogs/${post.slug}`, lastmod: new Date(post.updated_at).toISOString() })),
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
