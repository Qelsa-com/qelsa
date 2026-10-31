import JobDetail from "@/components/job/JobDetail";
import { RESERVED_JOB_SLUGS } from "@/features/api/jobsApi";
import { api } from "@/lib/convexApi";
import { ConvexHttpClient } from "convex/browser";
import type { GetServerSideProps } from "next";
import Head from "next/head";
import Layout from "../../../layout";

export interface JobMeta {
  title: string;
  description: string;
  canonicalUrl: string;
  imageUrl: string;
  companyName: string;
  location?: string | null;
  workType?: string | null;
  noindex?: boolean;
}

export interface JobDetailsPageProps {
  meta?: JobMeta;
  /** JobPosting + BreadcrumbList JSON-LD, built on the server. */
  structuredData?: Record<string, unknown> | null;
}

const PREVIEW_MIN = 120;
const PREVIEW_MAX = 160;

function clipPreview(text: string) {
  const trimmed = text.replace(/\s+/g, " ").trim();
  if (trimmed.length <= PREVIEW_MAX) return trimmed;
  const slice = trimmed.slice(0, PREVIEW_MAX);
  const breakAt = slice.lastIndexOf(" ");
  const cut = breakAt >= PREVIEW_MIN ? breakAt : PREVIEW_MAX;
  return `${slice.slice(0, cut).trimEnd()}…`;
}

function stripHtml(value: string) {
  return value.replace(/<[^>]*>?/gm, " ").replace(/\s+/g, " ").trim();
}

function formatWorkType(raw?: string | null) {
  if (!raw) return undefined;
  return raw.replace(/_/g, "-").replace(/\b[a-z]/g, (char) => char.toUpperCase());
}

function employmentType(raw?: string | null) {
  switch ((raw ?? "").toLowerCase().replace(/[\s_]+/g, "-")) {
    case "full-time":
      return "FULL_TIME";
    case "part-time":
      return "PART_TIME";
    case "contract":
    case "contractor":
    case "freelance":
      return "CONTRACTOR";
    case "internship":
    case "intern":
      return "INTERN";
    case "temporary":
      return "TEMPORARY";
    default:
      return undefined;
  }
}

/** Best-effort country from a free-form location ("City, State, Country"). */
const COUNTRY_CODES: Record<string, string> = {
  india: "IN",
  "united states": "US",
  "united states of america": "US",
  usa: "US",
  "united kingdom": "GB",
  uk: "GB",
  canada: "CA",
  australia: "AU",
  singapore: "SG",
  philippines: "PH",
  germany: "DE",
  france: "FR",
  netherlands: "NL",
  ireland: "IE",
  "united arab emirates": "AE",
  uae: "AE",
  "saudi arabia": "SA",
  qatar: "QA",
  japan: "JP",
  malaysia: "MY",
  indonesia: "ID",
  vietnam: "VN",
  thailand: "TH",
  brazil: "BR",
  mexico: "MX",
  "south africa": "ZA",
  nigeria: "NG",
  kenya: "KE",
  poland: "PL",
  spain: "ES",
  italy: "IT",
  sweden: "SE",
  switzerland: "CH",
  "new zealand": "NZ",
  china: "CN",
  "hong kong": "HK",
  taiwan: "TW",
};

function countryFromLocation(value: unknown, hasRegion = false) {
  if (typeof value !== "string") return undefined;
  const parts = value.split(",").map((part) => part.trim()).filter(Boolean);
  if (parts.length === 0) return undefined;
  const last = parts[parts.length - 1];
  const code = COUNTRY_CODES[last.toLowerCase()];
  if (code) return code;
  if (parts.length >= 3) return last;
  if (parts.length === 2 && !hasRegion) return last;
  return undefined;
}

function localityFromOtherInfo(value: unknown) {
  if (!value || typeof value !== "object") return undefined;
  const cities = (value as { cities?: Array<{ name?: unknown }> }).cities;
  const first = Array.isArray(cities) ? cities[0]?.name : undefined;
  return typeof first === "string" && first.trim() ? first : undefined;
}

function absoluteUrl(url: string, siteUrl: string) {
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  if (url.startsWith("/")) return `${siteUrl}${url}`;
  return `${siteUrl}/${url}`;
}

/** Reserved slugs — do not treat them as a job id. */
export const getServerSideProps: GetServerSideProps<JobDetailsPageProps> = async (ctx) => {
  const id = ctx.params?.id;
  if (typeof id !== "string" || RESERVED_JOB_SLUGS.has(id)) {
    return { notFound: true };
  }

  const host = (ctx.req.headers["x-forwarded-host"] || ctx.req.headers.host) as string | undefined;
  const proto = (ctx.req.headers["x-forwarded-proto"] || "https") as string;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || (host ? `${proto}://${host}` : "https://qelsa.com");
  const canonicalUrl = `${siteUrl.replace(/\/$/, "")}/jobs/${id}`;
  const defaultImage = `${siteUrl.replace(/\/$/, "")}/qelsa-og.png`;

  try {
    const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL || "http://127.0.0.1:3210";
    const client = new ConvexHttpClient(convexUrl);
    const job = await client.query(api.jobs.getById, { id: id as never });

    if (!job) return { notFound: true };

    const title = job.title || "Job Details";
    const companyName = job.company_name || job.page?.name || "Qelsa";
    const location = job.city?.name
      ? `${job.city.name}${job.city.state?.name ? `, ${job.city.state.name}` : ""}`
      : job.workplace_type === "remote" || job.has_remote
        ? "Remote"
        : "";
    const workType = formatWorkType(job.work_type);

    const facts = [location, workType].filter(Boolean).join(" · ");
    const jd = stripHtml(job.description || job.ai_summary?.role_overview || "");
    const fallback = `${companyName} is hiring a ${title}${location ? ` in ${location}` : ""}. Apply on Qelsa.`;
    const description = clipPreview(facts ? `${facts}. ${jd || fallback}` : jd || fallback);

    const logo = job.company_logo || job.page?.logo;
    const absoluteLogo = logo ? absoluteUrl(logo, siteUrl.replace(/\/$/, "")) : undefined;

    const ogParams = new URLSearchParams({
      title,
      company: companyName,
      ...(location ? { location } : {}),
      ...(workType ? { workType } : {}),
      ...(job.workplace_type ? { workplaceType: job.workplace_type } : {}),
      ...(absoluteLogo ? { logo: absoluteLogo } : {}),
    });
    const imageUrl = `${siteUrl.replace(/\/$/, "")}/api/og/job?${ogParams.toString()}`;

    // JobPosting data for Google Jobs. Keep this server-rendered: the job body
    // itself is client-rendered, so crawlers only see what we pass here.
    const otherInfo = job.other_info as { location?: string; cities?: Array<{ name?: string }> } | undefined;
    const locality = job.city?.name || localityFromOtherInfo(otherInfo);
    const region = job.city?.state?.name;
    const country = countryFromLocation(otherInfo?.location, Boolean(region));
    const remote = job.workplace_type === "remote" || (!job.workplace_type && job.has_remote);
    const datePosted =
      typeof job.published_date === "string"
        ? job.published_date
        : typeof job.createdAt === "string"
          ? job.createdAt
          : new Date().toISOString();

    const jobLocation: Record<string, unknown> = {
      "@type": "Place",
      address: {
        "@type": "PostalAddress",
        ...(locality ? { addressLocality: locality } : {}),
        ...(region ? { addressRegion: region } : {}),
        ...(country ? { addressCountry: country } : {}),
      },
    };

    const salaryMin = typeof job.salary_min === "number" ? job.salary_min : undefined;
    const salaryMax = typeof job.salary_max === "number" ? job.salary_max : undefined;
    const salary = typeof job.salary === "number" ? job.salary : undefined;
    const salaryValue: Record<string, unknown> = {
      "@type": "QuantitativeValue",
      unitText: "YEAR",
      ...(salaryMin != null ? { minValue: salaryMin } : {}),
      ...(salaryMax != null ? { maxValue: salaryMax } : {}),
      ...(salaryMin == null && salaryMax == null && salary != null ? { value: salary } : {}),
    };
    const baseSalary =
      job.salary_currency && (salaryMin != null || salaryMax != null || salary != null)
        ? { "@type": "MonetaryAmount", currency: job.salary_currency, value: salaryValue }
        : undefined;

    const jobPosting: Record<string, unknown> = {
      "@type": "JobPosting",
      title,
      description: (jd || fallback).slice(0, 10000),
      datePosted,
      hiringOrganization: {
        "@type": "Organization",
        name: companyName,
        ...(absoluteLogo ? { logo: absoluteLogo } : {}),
        ...(job.company_website_url ? { sameAs: job.company_website_url } : {}),
      },
      identifier: { "@type": "PropertyValue", name: "Qelsa", value: id },
      url: canonicalUrl,
      ...(employmentType(job.work_type) ? { employmentType: employmentType(job.work_type) } : {}),
      ...(job.page?.industry ? { industry: job.page.industry } : {}),
      ...(job.job_title?.name ? { occupationalCategory: job.job_title.name } : {}),
      ...(remote
        ? {
            jobLocationType: "TELECOMMUTE",
            ...(country
              ? { applicantLocationRequirements: { "@type": "Country", name: country } }
              : {}),
          }
        : Object.keys(jobLocation.address as Record<string, unknown>).length > 1
          ? { jobLocation }
          : {}),
      ...(baseSalary ? { baseSalary } : {}),
    };

    const breadcrumb = {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: `${siteUrl.replace(/\/$/, "")}/` },
        {
          "@type": "ListItem",
          position: 2,
          name: "Jobs",
          item: `${siteUrl.replace(/\/$/, "")}/jobs/all`,
        },
        { "@type": "ListItem", position: 3, name: title, item: canonicalUrl },
      ],
    };

    return {
      props: {
        meta: {
          title: `${title} at ${companyName} | Qelsa`,
          description,
          canonicalUrl,
          imageUrl,
          companyName,
          location: location || null,
          workType: workType ?? null,
          noindex: job.status !== "open",
        },
        structuredData: {
          "@context": "https://schema.org",
          "@graph": job.status === "open" ? [jobPosting, breadcrumb] : [breadcrumb],
        },
      },
    };
  } catch (err) {
    console.error("[JobDetails SSR] Error fetching job metadata:", err);
  }

  return {
    props: {
      meta: {
        title: "Job Details | Qelsa",
        description: "Discover opportunities, analyze skill match, and apply on Qelsa.",
        canonicalUrl,
        imageUrl: defaultImage,
        companyName: "Qelsa",
        noindex: true,
      },
    },
  };
};

export default function JobDetails({ meta, structuredData }: JobDetailsPageProps) {
  const pageTitle = meta?.title || "Job Details | Qelsa";
  const ogTitle = meta?.title ? meta.title.replace(/ \| Qelsa$/, "") : "Job Opportunity on Qelsa";
  const ogDescription = meta?.description || "Explore and apply for this job on Qelsa.";
  const canonicalUrl = meta?.canonicalUrl || "https://qelsa.com/jobs/all";
  const ogImage = meta?.imageUrl || "https://qelsa.com/qelsa-og.png";

  return (
    <>
      <Head>
        <title>{pageTitle}</title>
        <meta name="description" content={ogDescription} />
        <meta
          name="robots"
          content={meta?.noindex ? "noindex, follow" : "index, follow, max-image-preview:large"}
        />
        <link rel="canonical" href={canonicalUrl} />

        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Qelsa" />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:title" content={ogTitle} />
        <meta property="og:description" content={ogDescription} />
        <meta property="og:image" content={ogImage} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:type" content="image/png" />
        <meta property="og:image:alt" content={ogTitle} />

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:url" content={canonicalUrl} />
        <meta name="twitter:title" content={ogTitle} />
        <meta name="twitter:description" content={ogDescription} />
        <meta name="twitter:image" content={ogImage} />
        <meta name="twitter:image:alt" content={ogTitle} />

        {structuredData ? (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify(structuredData).replace(/</g, "\\u003c"),
            }}
          />
        ) : null}
      </Head>
      <Layout activeSection="jobs" hideMobileTabBar>
        <JobDetail />
      </Layout>
    </>
  );
}
