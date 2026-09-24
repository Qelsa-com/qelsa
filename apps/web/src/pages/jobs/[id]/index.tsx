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

/** Reserved slugs — do not treat them as a job id. */
export const getServerSideProps: GetServerSideProps<JobDetailsPageProps> = async (ctx) => {
  const id = ctx.params?.id;
  if (typeof id !== "string" || RESERVED_JOB_SLUGS.has(id)) {
    return { notFound: true };
  }

  const host = (ctx.req.headers["x-forwarded-host"] || ctx.req.headers.host) as string | undefined;
  const proto = (ctx.req.headers["x-forwarded-proto"] || "https") as string;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || (host ? `${proto}://${host}` : "https://qelsa.ai");
  const canonicalUrl = `${siteUrl}/jobs/${id}`;

  try {
    const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL || "http://127.0.0.1:3210";
    const client = new ConvexHttpClient(convexUrl);
    const job = await client.query(api.jobs.getById, { id: id as never });

    if (job) {
      const title = job.title || "Job Details";
      const companyName = job.company_name || "Company";
      const location = job.city?.name
        ? `${job.city.name}${job.city.state?.name ? `, ${job.city.state.name}` : ""}`
        : job.has_remote
        ? "Remote"
        : "";
      const workType = job.work_type ? job.work_type.replace(/[-_]/g, " ") : undefined;

      let cleanDesc = (job.description || "")
        .replace(/<[^>]*>?/gm, " ")
        .replace(/\s+/g, " ")
        .trim();

      if (!cleanDesc) {
        cleanDesc = `${companyName} is hiring a ${title}${
          location ? ` in ${location}` : ""
        }. Explore responsibilities, skills, and apply on Qelsa.`;
      } else if (cleanDesc.length > 200) {
        cleanDesc = cleanDesc.slice(0, 197) + "...";
      }

      let imageUrl = job.company_logo || `${siteUrl}/qelsa-logo.svg`;
      if (imageUrl.startsWith("/")) {
        imageUrl = `${siteUrl}${imageUrl}`;
      }

      return {
        props: {
          meta: {
            title: `${title} at ${companyName} | Qelsa`,
            description: cleanDesc,
            canonicalUrl,
            imageUrl,
            companyName,
            location,
            workType,
          },
        },
      };
    }
  } catch (err) {
    // If Convex is unreachable or ID is invalid, fallback cleanly
    console.error("[JobDetails SSR] Error fetching job metadata:", err);
  }

  return {
    props: {
      meta: {
        title: "Job Details | Qelsa",
        description: "Discover opportunities, analyze skill match, and apply on Qelsa.",
        canonicalUrl,
        imageUrl: `${siteUrl}/qelsa-logo.svg`,
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

        {/* Open Graph / Facebook / LinkedIn / WhatsApp */}
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Qelsa" />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:title" content={ogTitle} />
        <meta property="og:description" content={ogDescription} />
        <meta property="og:image" content={ogImage} />
        <meta property="og:image:alt" content={meta?.title || "Job Opportunity"} />

        {/* Twitter */}
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

