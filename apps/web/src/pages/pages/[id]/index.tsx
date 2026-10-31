import { CompanyPage } from "@/components/CompanyPage";
import { JsonLd, Seo } from "@/components/Seo";
import { api } from "@/lib/convexApi";
import { ConvexHttpClient } from "convex/browser";
import type { GetServerSideProps } from "next";
import Layout from "@/layout";

interface CompanyMeta {
  id: string;
  name: string;
  description: string;
  canonicalUrl: string;
  imageUrl?: string;
  website?: string;
  industry?: string;
}

interface PageDetailsProps {
  meta: CompanyMeta | null;
  id: string;
}

function stripHtml(value?: string | null) {
  return value?.replace(/<[^>]*>?/gm, " ").replace(/\s+/g, " ").trim() ?? "";
}

function clip(value: string, max = 160) {
  if (value.length <= max) return value;
  const slice = value.slice(0, max);
  const breakAt = slice.lastIndexOf(" ");
  return `${slice.slice(0, breakAt > 80 ? breakAt : max).trimEnd()}…`;
}

function absoluteUrl(value: string, siteUrl: string) {
  if (/^https?:\/\//i.test(value)) return value;
  return `${siteUrl}${value.startsWith("/") ? value : `/${value}`}`;
}

/**
 * Company pages are client-rendered, but the metadata and Organization schema
 * can still be server-rendered here so search and link previews are accurate.
 */
export const getServerSideProps: GetServerSideProps<PageDetailsProps> = async (ctx) => {
  const id = ctx.params?.id;
  if (typeof id !== "string") return { notFound: true };

  const host = (ctx.req.headers["x-forwarded-host"] || ctx.req.headers.host) as string | undefined;
  const proto = (ctx.req.headers["x-forwarded-proto"] || "https") as string;
  const siteUrl = (
    process.env.NEXT_PUBLIC_SITE_URL || (host ? `${proto}://${host}` : "https://qelsa.com")
  ).replace(/\/$/, "");
  const canonicalUrl = `${siteUrl}/pages/${id}`;

  try {
    const client = new ConvexHttpClient(
      process.env.NEXT_PUBLIC_CONVEX_URL || "http://127.0.0.1:3210",
    );
    const page = await client.query(api.pages.getMetaById, { id: id as never });
    if (!page) return { notFound: true };

    const name = (page.name as string) || "Company";
    const summary = stripHtml(page.description) || stripHtml(page.tagline);
    const description = summary
      ? clip(summary)
      : `${name} is hiring on Qelsa. See open roles and what they need.`;
    const logo = typeof page.logo === "string" && page.logo ? absoluteUrl(page.logo, siteUrl) : undefined;

    return {
      props: {
        id,
        meta: {
          id,
          name,
          description,
          canonicalUrl,
          ...(logo ? { imageUrl: logo } : {}),
          ...(typeof page.website === "string" && page.website ? { website: page.website } : {}),
          ...(typeof page.industry === "string" && page.industry ? { industry: page.industry } : {}),
        },
      },
    };
  } catch (error) {
    console.error("[CompanyPage SSR] Error fetching company metadata:", error);
    return { props: { id, meta: null } };
  }
};

const PageDetails = ({ meta, id }: PageDetailsProps) => {
  const website = meta?.website && /^https?:\/\//i.test(meta.website) ? meta.website : meta?.canonicalUrl;
  const orgData = meta
    ? {
        "@context": "https://schema.org",
        "@type": "Organization",
        name: meta.name,
        url: website,
        ...(meta.imageUrl ? { logo: meta.imageUrl } : {}),
        ...(meta.description ? { description: meta.description } : {}),
        ...(meta.industry ? { industry: meta.industry } : {}),
      }
    : null;

  return (
    <Layout activeSection={"pages"}>
      {meta ? (
        <>
          <Seo
            title={meta.name}
            description={meta.description}
            path={`/pages/${meta.id}`}
            image={meta.imageUrl}
          />
          {orgData ? <JsonLd data={orgData} /> : null}
        </>
      ) : (
        <Seo
          title="Company"
          description="Company profile on Qelsa."
          path={`/pages/${id}`}
          noindex
        />
      )}
      <CompanyPage />
    </Layout>
  );
};

export default PageDetails;
