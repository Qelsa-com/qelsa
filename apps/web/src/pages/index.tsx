import { LandingPage } from "@/components/LandingPage";
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

  if (isLoading) {
    return (
      <Layout activeSection="home">
        <LandingPage homeJobsStat={homeJobsStat} />
      </Layout>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <Layout activeSection="home">
        <LandingPage homeJobsStat={homeJobsStat} />
      </Layout>
    );
  }

  return (
    <Layout activeSection={"space"}>
      <MySpaceDashboard />
    </Layout>
  );
}
