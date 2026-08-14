import { PolicyPage, PolicySection } from "@/components/PolicyPage";
import Layout from "../layout";

/**
 * Cookie policy.
 *
 * Figma: Qelsa-Screen — cookie-policy (654:3875). Copy is reproduced verbatim
 * from the design, including the unnamed analytics tool in §3.3 and the
 * `[Cookie Settings link …]` placeholder in §6.1.
 */

const SECTIONS: PolicySection[] = [
  {
    title: "1. Introduction",
    blocks: [
      `This Cookie Policy explains how Qelsa, having its registered office at HSR Layout, Karnataka, India ("Qelsa", "we", "us", "our"), uses cookies and similar tracking technologies on our website and mobile applications (the "Platform"). This policy supplements our Privacy Policy and should be read alongside it.`,
      {
        tight: true,
        text: `By using the Platform, you consent to our use of cookies as described here, except where we are required by law to obtain your prior consent through a cookie banner (see Section 6).`,
      },
    ],
  },
  {
    title: "2. What Are Cookies",
    blocks: [
      `Cookies are small text files placed on your device when you visit a website. They allow the Platform to recognize your device, remember preferences and actions over time, and collect information about how the Platform is used. Similar technologies covered by this policy include local storage, pixels, and SDKs used in our mobile applications.`,
    ],
  },
  {
    title: "3. Categories of Cookies We Use",
    blocks: [
      `3.1 Strictly Necessary Cookies Required for the Platform to function — e.g., keeping you logged in, maintaining session state, load balancing, and security (CSRF protection). These cannot be disabled without affecting core functionality (such as account access and the Readiness Score dashboard).`,
      `3.2 Functional Cookies Remember your preferences (e.g., language, dashboard layout, previously entered filters) to improve usability across visits.`,
      `3.3 Analytics Cookies Help us understand how Users interact with the Platform — which pages are visited, which features are used, drop-off points, and general usage patterns — so we can improve the product. Currently used tools:`,
      {
        list: [
          `Google Analytics — collects usage and device data in accordance with Google's own privacy practices.`,
          `[External Analytics Tool — NAME TO BE CONFIRMED] — used for additional product/usage analytics. [Placeholder: name the specific tool once finalized, e.g., Mixpanel, Amplitude, PostHog, Hotjar, etc. — the disclosure and any linked Data Processing Agreement should match the actual tool in use.]`,
        ],
      },
      `3.4 Advertising/Marketing Cookies Not currently in use. If Qelsa introduces advertising or retargeting cookies in the future, this Cookie Policy will be updated in advance, and consent will be sought where required.`,
    ],
  },
  {
    title: "4. Third-Party Cookies",
    blocks: [
      `Some cookies are placed by third parties operating on our Platform (e.g., Google Analytics, our external analytics provider). These third parties may use the collected information according to their own privacy policies. Qelsa does not control the cookies set by these third parties beyond configuring them for our own analytics purposes.`,
    ],
  },
  {
    title: "5. How Long Cookies Last",
    blocks: [
      `Session cookies — deleted when you close your browser (e.g., login session cookies).`,
      {
        tight: true,
        text: `Persistent cookies — remain on your device for a set period (e.g., Google Analytics cookies typically persist for up to 2 years, or as configured) or until manually deleted.`,
      },
    ],
  },
  {
    title: "6. Your Cookie Choices",
    blocks: [
      `6.1 Cookie Consent Banner. On your first visit, the Platform will display a cookie consent banner allowing you to accept or customize cookie categories (excluding Strictly Necessary Cookies, which are always active). You can change your preferences at any time via [Cookie Settings link — to be added once the banner is implemented].`,
      `6.2 Browser Controls. Most browsers allow you to block or delete cookies through their settings. Note that disabling Strictly Necessary or Functional cookies may prevent parts of the Platform (such as staying logged in or generating your Readiness Score) from working correctly.`,
      `6.3 Opting Out of Google Analytics. You may opt out of Google Analytics tracking across websites by installing the Google Analytics Opt-out Browser Add-on, available from Google.`,
      `6.4 Mobile Applications. If you use Qelsa's mobile applications, similar tracking may occur via SDKs rather than browser cookies. You can manage tracking permissions through your device's privacy settings.`,
    ],
  },
  {
    title: "7. Legal Basis",
    blocks: [
      `Where required under the Digital Personal Data Protection Act, 2023, or other applicable law, we obtain your consent before placing non-essential cookies (Functional, Analytics, Advertising) via the cookie banner described in Section 6.1. Strictly Necessary cookies are used on the basis that they are essential to providing the service you have requested.`,
    ],
  },
  {
    title: "8. Changes to This Policy",
    blocks: [
      `We may update this Cookie Policy as our use of cookies and tracking technologies changes — for example, if we add a new analytics tool or introduce advertising cookies. Material changes will be reflected in the "Last Updated" date and, where required, notified via the Platform.`,
    ],
  },
];

const Cookies = () => {
  return (
    <Layout activeSection={"cookies"}>
      <PolicyPage
        title="Cookie policy"
        lastUpdated="Last updated: July 1, 2025"
        sections={SECTIONS}
        contactHeading="Questions about our cookie policy?"
        contactEmail="help@qelsa.com"
      />
    </Layout>
  );
};

export default Cookies;
