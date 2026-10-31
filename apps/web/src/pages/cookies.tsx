import { PolicyPage } from "@/components/PolicyPage";
import { legalPageProps, type LegalPageContent } from "@/lib/legalPage";
import Layout from "../layout";

const FALLBACK: LegalPageContent = {
  title: "Cookie policy",
  body: "We couldn't load this page right now. Please try again shortly.",
  contactHeading: "Questions about our cookie policy?",
  contactEmail: "help@qelsa.com",
  updatedAt: Date.parse("2025-07-01T00:00:00Z"),
};

export const getServerSideProps = legalPageProps("cookies", FALLBACK);

const Cookies = ({ content }: { content: LegalPageContent }) => {
  return (
    <Layout activeSection={"cookies"}>
      <PolicyPage
        title={content.title}
        lastUpdated={content.updatedAt}
        body={content.body}
        contactHeading={content.contactHeading}
        contactEmail={content.contactEmail}
        path="/cookies"
      />
    </Layout>
  );
};

export default Cookies;
