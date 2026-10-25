import { BlogArticle } from "@/components/blog/BlogArticle";
import { api } from "@/lib/convexApi";
import { ConvexHttpClient } from "convex/browser";
import type { GetServerSideProps } from "next";
import Head from "next/head";
import Layout from "../../layout";
import type { PublicBlog } from "@/types/blog";

function siteOrigin(headers: Record<string, string | string[] | undefined>) {
  const host = (headers["x-forwarded-host"] || headers.host) as string | undefined;
  const proto = (headers["x-forwarded-proto"] || "https") as string;
  return (
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
    (host ? `${proto}://${host}` : "https://qelsa.com")
  );
}

export const getServerSideProps: GetServerSideProps<{ post: PublicBlog; siteUrl: string }> = async (ctx) => {
  const slug = typeof ctx.params?.slug === "string" ? ctx.params.slug : "";
  if (!slug) return { notFound: true };
  const siteUrl = siteOrigin(ctx.req.headers);
  try {
    const client = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL || "http://127.0.0.1:3210");
    const post = (await client.query(api.blog.getPublishedBySlug, { slug })) as PublicBlog | null;
    if (!post) return { notFound: true };
    ctx.res.setHeader("Cache-Control", "public, s-maxage=120, stale-while-revalidate=600");
    return { props: { post, siteUrl } };
  } catch (error) {
    console.error("[BlogDetail SSR] Could not load post", error);
    return { notFound: true };
  }
};

export default function BlogDetailPage({ post, siteUrl }: { post: PublicBlog; siteUrl: string }) {
  const canonical = `${siteUrl}/blog/${post.slug}`;
  const image = post.cover_image_url || `${siteUrl}/qelsa-og.png`;
  const published = new Date(post.published_at ?? post.created_at).toISOString();
  const modified = new Date(post.updated_at).toISOString();
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BlogPosting",
        "@id": `${canonical}#article`,
        headline: post.title,
        description: post.meta_description,
        image: [image],
        datePublished: published,
        dateModified: modified,
        articleSection: post.category,
        keywords: post.tags.join(", "),
        wordCount: post.word_count,
        timeRequired: `PT${post.reading_minutes}M`,
        inLanguage: "en",
        author: {
          "@type": "Organization",
          name: "Qelsa Editorial",
          url: siteUrl,
        },
        publisher: {
          "@type": "Organization",
          name: "Qelsa",
          url: siteUrl,
          logo: { "@type": "ImageObject", url: `${siteUrl}/qelsa-og.png` },
        },
        mainEntityOfPage: { "@type": "WebPage", "@id": canonical },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Qelsa", item: siteUrl },
          { "@type": "ListItem", position: 2, name: "Blog", item: `${siteUrl}/blog` },
          { "@type": "ListItem", position: 3, name: post.title, item: canonical },
        ],
      },
      ...(post.faq.length
        ? [
            {
              "@type": "FAQPage",
              mainEntity: post.faq.map((item) => ({
                "@type": "Question",
                name: item.question,
                acceptedAnswer: { "@type": "Answer", text: item.answer },
              })),
            },
          ]
        : []),
    ],
  };

  return (
    <>
      <Head>
        <title>{post.meta_title || post.title}</title>
        <meta name="description" content={post.meta_description} />
        <link rel="canonical" href={canonical} />
        <meta name="robots" content="index, follow, max-image-preview:large" />
        <meta property="og:type" content="article" />
        <meta property="og:title" content={post.meta_title || post.title} />
        <meta property="og:description" content={post.meta_description} />
        <meta property="og:url" content={canonical} />
        <meta property="og:image" content={image} />
        <meta property="article:published_time" content={published} />
        <meta property="article:modified_time" content={modified} />
        <meta property="article:section" content={post.category} />
        {post.tags.map((tag) => (
          <meta key={tag} property="article:tag" content={tag} />
        ))}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={post.meta_title || post.title} />
        <meta name="twitter:description" content={post.meta_description} />
        <meta name="twitter:image" content={image} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, "\\u003c") }}
        />
      </Head>
      <Layout activeSection="blog">
        <BlogArticle post={post} />
      </Layout>
    </>
  );
}
