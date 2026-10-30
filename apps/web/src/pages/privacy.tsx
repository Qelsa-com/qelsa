import { PolicyPage } from "@/components/PolicyPage";
import { legalPageProps, type LegalPageContent } from "@/lib/legalPage";
import Layout from "../layout";

const FALLBACK: LegalPageContent = {
  title: "Privacy policy",
  body: "We couldn't load this page right now. Please try again shortly.",
  contactHeading: "Questions about our privacy policy?",
  contactEmail: "help@qelsa.com",
  updatedAt: Date.parse("2025-07-01T00:00:00Z"),
};

export const getServerSideProps = legalPageProps("privacy", FALLBACK);

const Privacy = ({ content }: { content: LegalPageContent }) => {
  return (
    <Layout activeSection={"privacy"}>
      <PolicyPage
        title={content.title}
        lastUpdated={content.updatedAt}
        body={content.body}
        contactHeading={content.contactHeading}
        contactEmail={content.contactEmail}
      />
    </Layout>
  );
};

export default Privacy;
