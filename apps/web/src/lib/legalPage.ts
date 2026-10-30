import { ConvexHttpClient } from "convex/browser";
import type { GetServerSideProps } from "next";
import { api } from "@/lib/convexApi";

export type LegalPageContent = {
  title: string;
  body: string;
  contactHeading: string;
  contactEmail: string;
  updatedAt: number;
};

/**
 * Legal copy lives in Convex so admins can edit it. `getServerSideProps` keeps
 * the page server-rendered (SEO) and always current; the fallback only shows
 * when the deployment cannot be reached.
 */
export function legalPageProps(
  key: "terms" | "privacy" | "cookies",
  fallback: LegalPageContent,
): GetServerSideProps<{ content: LegalPageContent }> {
  return async () => {
    try {
      const client = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
      const content = (await client.query(api.content.getPublic, { key })) as LegalPageContent;
      return { props: { content } };
    } catch {
      return { props: { content: fallback } };
    }
  };
}
