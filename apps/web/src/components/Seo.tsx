import Head from "next/head";
import type { ReactNode } from "react";

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://qelsa.com").replace(/\/$/, "");
export const DEFAULT_TITLE = "Qelsa – Know Your Job Readiness Before You Apply";
export const DEFAULT_DESCRIPTION =
  "Get a Readiness Score (0–100) for the role you want. See your skill gaps, know what to learn next, and be ready before you apply.";
export const DEFAULT_OG_IMAGE = `${SITE_URL}/qelsa-og.png`;

export function absoluteUrl(value: string) {
  if (/^https?:\/\//i.test(value)) return value;
  return `${SITE_URL}${value.startsWith("/") ? value : `/${value}`}`;
}

interface SeoProps {
  /** Page name, e.g. "Jobs". Ignored when `absoluteTitle` is set. */
  title?: string;
  description?: string;
  /** Canonical path such as "/jobs/all", or an absolute URL. */
  path?: string;
  image?: string;
  type?: "website" | "article";
  noindex?: boolean;
  /** Use `title` verbatim instead of appending " | Qelsa". */
  absoluteTitle?: boolean;
  children?: ReactNode;
}

/**
 * One place for title, description, canonical, Open Graph and Twitter tags.
 * Every public page should render this (once) so crawlers and link previews see
 * the same metadata.
 */
export function Seo({
  title = DEFAULT_TITLE,
  description = DEFAULT_DESCRIPTION,
  path,
  image,
  type = "website",
  noindex = false,
  absoluteTitle = false,
  children,
}: SeoProps) {
  const fullTitle = absoluteTitle ? title : `${title} | Qelsa`;
  const canonical = path ? absoluteUrl(path) : undefined;
  const ogImage = absoluteUrl(image || DEFAULT_OG_IMAGE);
  return (
    <Head>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      {canonical ? <link rel="canonical" href={canonical} /> : null}
      <meta name="robots" content={noindex ? "noindex, follow" : "index, follow, max-image-preview:large"} />

      <meta property="og:type" content={type} />
      <meta property="og:site_name" content="Qelsa" />
      {canonical ? <meta property="og:url" content={canonical} /> : null}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content={fullTitle} />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />
      {children}
    </Head>
  );
}

/** JSON-LD helper. Escapes `<` so content cannot terminate the script tag. */
export function JsonLd({ data }: { data: unknown }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}
