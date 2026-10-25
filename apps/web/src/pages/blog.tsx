import { BlogIndex } from "@/components/blog/BlogIndex";
import { api } from "@/lib/convexApi";
import { ConvexHttpClient } from "convex/browser";
import type { GetServerSideProps } from "next";
import Head from "next/head";
import Layout from "../layout";
import type { PublicBlogSummary } from "@/types/blog";

const DESCRIPTION =
  "Practical career guides from Qelsa: job search, interviews, skills, and using AI without losing the human edge.";

function siteOrigin(headers: Record<string, string | string[] | undefined>) {
  const host = (headers["x-forwarded-host"] || headers.host) as string | undefined;
  const proto = (headers["x-forwarded-proto"] || "https") as string;
  return (
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
    (host ? `${proto}://${host}` : "https://qelsa.com")
  );
}

export const getServerSideProps: GetServerSideProps<{ posts: PublicBlogSummary[]; siteUrl: string }> = async (ctx) => {
  const siteUrl = siteOrigin(ctx.req.headers);
  try {
    const client = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL || "http://127.0.0.1:3210");
    const posts = (await client.query(api.blog.listPublished, {})) as PublicBlogSummary[];
    ctx.res.setHeader("Cache-Control", "public, s-maxage=60, stale-while-revalidate=300");
    return { props: { posts, siteUrl } };
  } catch (error) {
    console.error("[BlogIndex SSR] Could not load posts", error);
    return { props: { posts: [], siteUrl } };
  }
};

export default function BlogsPage({ posts, siteUrl }: { posts: PublicBlogSummary[]; siteUrl: string }) {
  const canonical = `${siteUrl}/blog`;
  const latestCover = posts.find((post) => post.cover_image_url)?.cover_image_url;
  const image = latestCover || `${siteUrl}/qelsa-og.png`;
  const schema = {
    "@context": "https://schema.org",
    "@type": "Blog",
    name: "Qelsa Blog",
    url: canonical,
    description: DESCRIPTION,
    publisher: {
      "@type": "Organization",
      name: "Qelsa",
      url: siteUrl,
      logo: { "@type": "ImageObject", url: `${siteUrl}/qelsa-og.png` },
    },
    blogPost: posts.slice(0, 12).map((post) => ({
      "@type": "BlogPosting",
      headline: post.title,
      url: `${siteUrl}/blog/${post.slug}`,
      datePublished: post.published_at ? new Date(post.published_at).toISOString() : undefined,
      image: post.cover_image_url || undefined,
    })),
  };

  return (
    <>
      <Head>
        <title>Qelsa Blog | Practical career guides</title>
        <meta name="description" content={DESCRIPTION} />
        <link rel="canonical" href={canonical} />
        <meta name="robots" content="index, follow, max-image-preview:large" />
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Qelsa Blog | Practical career guides" />
        <meta property="og:description" content={DESCRIPTION} />
        <meta property="og:url" content={canonical} />
        <meta property="og:image" content={image} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Qelsa Blog | Practical career guides" />
        <meta name="twitter:description" content={DESCRIPTION} />
        <meta name="twitter:image" content={image} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, "\\u003c") }}
        />
      </Head>
      <Layout activeSection="blog">
        <BlogIndex posts={posts} />
      </Layout>
    </>
  );
}
