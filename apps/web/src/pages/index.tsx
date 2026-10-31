import { LandingPage } from "@/components/LandingPage";
import { DEFAULT_DESCRIPTION, DEFAULT_TITLE, JsonLd, Seo, SITE_URL } from "@/components/Seo";
import { MySpaceDashboard } from "@/components/space/MySpaceDashboard";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/convexApi";
import { ConvexHttpClient } from "convex/browser";
import type { GetServerSideProps } from "next";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Layout from "../layout";

type HomeProps = {
  /** Admin-editable "20K+" shown in the home jobs stat. */
  homeJobsStat: string;
};

const HOME_STRUCTURED_DATA = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: "Qelsa",
      url: SITE_URL,
      logo: `${SITE_URL}/qelsa-logo.svg`,
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      name: "Qelsa",
      url: SITE_URL,
      publisher: { "@id": `${SITE_URL}/#organization` },
      potentialAction: {
        "@type": "SearchAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate: `${SITE_URL}/jobs/all?q={search_term_string}`,
        },
        "query-input": "required name=search_term_string",
      },
    },
  ],
};

const HOME_SEO = (
  <>
    <Seo title={DEFAULT_TITLE} absoluteTitle description={DEFAULT_DESCRIPTION} path="/" />
    <JsonLd data={HOME_STRUCTURED_DATA} />
  </>
);

/**
 * Server-render the marketing page (and the editable jobs stat) so crawlers see
 * it. Signed-in users still see My Space once the client session resolves; the
 * boot loader covers the swap.
 */
export const getServerSideProps: GetServerSideProps<HomeProps> = async () => {
  try {
    const client = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
    const stat = (await client.query(api.content.getPublic, { key: "home_jobs_stat" })) as {
      value?: string;
    };
    return { props: { homeJobsStat: stat?.value ?? "20K+" } };
  } catch {
    return { props: { homeJobsStat: "20K+" } };
  }
};

export default function App({ homeJobsStat }: HomeProps) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    if (user && user.account_type === "recruiter") {
      router.replace(user.active_page_id ? `/pages/${user.active_page_id}` : "/pages");
    }
  }, [isLoading, router, user]);

  if (isLoading || !isAuthenticated || !user) {
    return (
      <>
        {HOME_SEO}
        <Layout activeSection="home">
          <LandingPage homeJobsStat={homeJobsStat} />
        </Layout>
      </>
    );
  }

  return (
    <>
      {HOME_SEO}
      <Layout activeSection={"space"}>
        <MySpaceDashboard />
      </Layout>
    </>
  );
}
