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
  location?: string;
  workType?: string;
}

export interface JobDetailsPageProps {
  meta?: JobMeta;
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
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || (host ? `${proto}://${host}` : "https://qelsa.ai");
  const canonicalUrl = `${siteUrl.replace(/\/$/, "")}/jobs/${id}`;
  const defaultImage = `${siteUrl.replace(/\/$/, "")}/qelsa-logo.svg`;

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
    const imageUrl = logo ? absoluteUrl(logo, siteUrl.replace(/\/$/, "")) : defaultImage;

    return {
      props: {
        meta: {
          title: `${title} at ${companyName} | Qelsa`,
          description,
          canonicalUrl,
          imageUrl,
          companyName,
          location: location || undefined,
          workType,
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
      },
    },
  };
};

export default function JobDetails({ meta }: JobDetailsPageProps) {
  const pageTitle = meta?.title || "Job Details | Qelsa";
  const ogTitle = meta?.title ? meta.title.replace(/ \| Qelsa$/, "") : "Job Opportunity on Qelsa";
  const ogDescription = meta?.description || "Explore and apply for this job on Qelsa.";
  const canonicalUrl = meta?.canonicalUrl || "https://qelsa.ai/jobs";
  const ogImage = meta?.imageUrl || "https://qelsa.ai/qelsa-logo.svg";

  return (
    <>
      <Head>
        <title>{pageTitle}</title>
        <meta name="description" content={ogDescription} />
        <link rel="canonical" href={canonicalUrl} />

        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Qelsa" />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:title" content={ogTitle} />
        <meta property="og:description" content={ogDescription} />
        <meta property="og:image" content={ogImage} />
        <meta property="og:image:alt" content={ogTitle} />

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:url" content={canonicalUrl} />
        <meta name="twitter:title" content={ogTitle} />
        <meta name="twitter:description" content={ogDescription} />
        <meta name="twitter:image" content={ogImage} />
      </Head>
      <Layout activeSection="jobs">
        <JobDetail />
      </Layout>
    </>
  );
}
