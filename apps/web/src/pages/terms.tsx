import { PolicyPage, PolicySection } from "@/components/PolicyPage";
import Layout from "../layout";

/**
 * Terms of service.
 *
 * Figma: Qelsa-Screen — terms-of-service-page (508:111). Copy is reproduced
 * verbatim from the design, including the `[support email]` and `[7/14]`
 * placeholders the legal text still carries.
 */

const SECTIONS: PolicySection[] = [
  {
    title: "1. Introduction",
    blocks: [
      `These Terms and Conditions ("Terms") govern access to and use of the website, mobile applications, and services (collectively, the "Platform") operated by Qelsa, having its registered office at HSR Layout, Karnataka, India ("Qelsa", "we", "us", "our").`,
      `By creating an account, accessing, or using the Platform, you ("User", "you") agree to be bound by these Terms. If you do not agree, do not use the Platform.`,
      `If you are between 16 and 18 years of age, you may use the Platform only with the involvement and consent of a parent or legal guardian, who agrees to be bound by these Terms on your behalf where required by applicable law. Qelsa does not knowingly permit use of the Platform by anyone under 16.`,
    ],
  },
  {
    title: "2. Description of Service",
    blocks: [
      `Qelsa is an AI-powered Skill Intelligence Platform. Qelsa provides:`,
      {
        list: [
          `A Readiness Score and related assessments indicating a candidate's preparedness for specific roles ("Job Seeker Services");`,
          `Tools for employers and HR/talent teams to identify, evaluate, and shortlist candidates based on readiness and skill-match signals ("Employer Services"); and`,
          `A hiring marketplace connecting qualified candidates with employers ("Marketplace Services").`,
        ],
      },
      `Qelsa is not a recruitment agency, staffing agency, or employer, and does not guarantee employment, interviews, or hiring outcomes to any User.`,
    ],
  },
  {
    title: "3. Eligibility and Account Registration",
    blocks: [
      `3.1 You must provide accurate, current, and complete information during registration and keep it updated.`,
      `3.2 You are responsible for maintaining the confidentiality of your login credentials and for all activity under your account.`,
      `3.3 Accounts may be created via Google OAuth or other supported methods. By signing in through a third-party provider, you authorize Qelsa to access the basic profile information permitted by that provider.`,
      `3.4 Qelsa reserves the right to suspend or terminate accounts that provide false information, violate these Terms, or are used fraudulently.`,
    ],
  },
  {
    title: "4. User Categories and Applicable Terms",
    blocks: [
      `4.1 Job Seekers. Individuals using the Platform to build profiles, receive Readiness Scores, identify skill gaps, and apply to opportunities. Section 6 (Subscriptions) applies.`,
      `4.2 Employers / HR Teams. Organizations using the Platform to source, evaluate, and shortlist candidates, including via Applicant Tracking System (ATS) integrations. Section 7 (B2B Services) applies.`,
      `4.3 Marketplace Users. Job seekers and employers participating in paid candidate-matching or hiring transactions. Section 8 (Marketplace) applies.`,
    ],
  },
  {
    title: "5. The Readiness Score",
    blocks: [
      `5.1 The Readiness Score is generated using a proprietary, structured skill-matching methodology and, in certain features, AI-assisted analysis. It reflects an estimate of preparedness based on information you provide and data available to Qelsa; it is not a guarantee of job performance, interview success, or hiring outcome.`,
      `5.2 Qelsa discloses skill names, proficiency gaps, and general priority tiers (e.g., Core / Preferred / Nice-to-have) to job seekers. The underlying scoring weights and formula are proprietary and are not disclosed, in order to preserve the integrity of the assessment.`,
      `5.3 Employers receive readiness and match signals as a pre-interview aid. Qelsa does not make hiring decisions and is not responsible for any employer's hiring decision made using this information.`,
    ],
  },
  {
    title: "6. Subscriptions and Billing (Job Seekers)",
    blocks: [
      `6.1 Certain features (detailed readiness reports, mock interviews, advanced skill-gap analysis) require a paid subscription, billed monthly or as otherwise stated at checkout.`,
      `6.2 Payments are processed through Razorpay, a third-party payment processor. Qelsa does not store your full payment card or bank details; such information is handled directly by Razorpay in accordance with its own terms and applicable payment security standards.`,
      `6.3 Subscriptions renew automatically at the end of each billing cycle unless cancelled before the renewal date. You may cancel anytime through your account settings; cancellation takes effect at the end of the current billing period.`,
      `6.4 Refunds: Fees already paid are generally non-refundable, except where required by applicable Indian consumer protection law or where Qelsa, at its discretion, determines a refund is warranted (e.g., a duplicate or erroneous charge). Refund requests should be raised within 7 days of the charge via [support email].`,
      `6.5 Qelsa may change subscription pricing with reasonable prior notice. Changes will not apply to a billing cycle already paid for.`,
    ],
  },
  {
    title: "7. B2B Services (Employers)",
    blocks: [
      `7.1 Employers accessing skill mapping, AI hiring tools, or internal mobility features under a B2B subscription are billed per-employee/month or per agreed commercial terms in a separate order form or agreement, which will govern in case of conflict with these Terms.`,
      `7.2 Employers integrating an Applicant Tracking System (ATS) authorize Qelsa to access and process candidate and job data from that ATS solely to provide the Employer Services, subject to the Privacy Policy and any data processing terms agreed separately.`,
      `7.3 Invoicing for B2B Services will be issued in accordance with applicable GST requirements. Employers are responsible for providing accurate GSTIN and billing details.`,
      `7.4 Employers are solely responsible for ensuring their use of the Platform (including candidate sourcing and shortlisting) complies with applicable employment and anti-discrimination laws.`,
    ],
  },
  {
    title: "8. Hiring Marketplace",
    blocks: [
      `8.1 Marketplace fees (per qualified candidate introduced, or per successful hire) apply as disclosed to the employer at the time of engagement.`,
      `8.2 "Successful hire" and "qualified candidate" will be defined in the applicable commercial terms provided to the employer; disputes over qualification are resolved per those terms.`,
      `8.3 Candidates participating in the marketplace consent to their profile and readiness information being shared with prospective employers as described in the Privacy Policy.`,
    ],
  },
  {
    title: "9. AI-Assisted Features",
    blocks: [
      `9.1 Qelsa uses artificial intelligence — including Claude, developed by Anthropic — to power certain features such as resume review, job-match explanations, competency assessment, and profile building.`,
      {
        tight: true,
        text: `9.2 AI-generated outputs (summaries, suggestions, scores) are provided as informational aids and are reviewed against Qelsa's own data before being used to update your profile. AI outputs may occasionally be inaccurate or incomplete; you should review AI-assisted content before relying on it.`,
      },
      `9.3 Do not submit sensitive personal data (e.g., health information, government ID numbers beyond what is requested, financial account details) into free-text fields or chat-based features unless specifically required by the Platform.`,
    ],
  },
  {
    title: "10. User Content and Conduct",
    blocks: [
      `10.1 You retain ownership of the content you submit (resume, profile details, etc.), and grant Qelsa a license to use it to operate and improve the Platform, including generating your Readiness Score and, in anonymized/aggregated form, improving Qelsa's underlying models, as described in the Privacy Policy.`,
      `10.2 You agree not to: submit false or misleading information (including fabricated credentials or experience); scrape or reverse-engineer the Platform; attempt to manipulate or game the Readiness Score; use the Platform to harass, discriminate against, or defraud other Users; or upload malicious code.`,
      `10.3 Qelsa may remove content or suspend accounts that violate this Section.`,
    ],
  },
  {
    title: "11. Intellectual Property",
    blocks: [
      `11.1 The Platform, including its software, design, Readiness Score methodology, trademarks, and content (excluding User Content), is owned by Qelsa or its licensors and protected under applicable Indian intellectual property law.`,
      `11.2 Nothing in these Terms transfers any Qelsa intellectual property to you, except the limited right to use the Platform as intended.`,
    ],
  },
  {
    title: "12. Third-Party Services",
    blocks: [
      `The Platform integrates with third-party services, including but not limited to Google (authentication), Razorpay (payments), ATS providers (for employer integrations), and Anthropic (AI infrastructure powering Claude-based features). Your use of such integrations may also be subject to those providers' own terms. Qelsa is not responsible for the acts or omissions of independent third-party providers.`,
    ],
  },
  {
    title: "13. Disclaimers",
    blocks: [
      `13.1 THE PLATFORM IS PROVIDED "AS IS" AND "AS AVAILABLE." QELSA DISCLAIMS ALL WARRANTIES, EXPRESS OR IMPLIED, INCLUDING FITNESS FOR A PARTICULAR PURPOSE, TO THE MAXIMUM EXTENT PERMITTED BY LAW.`,
      `13.2 Qelsa does not guarantee that use of the Platform will result in employment, interviews, candidate placements, or any specific hiring or career outcome.`,
      `13.3 Qelsa does not guarantee uninterrupted or error-free operation of the Platform.`,
    ],
  },
  {
    title: "14. Limitation of Liability",
    blocks: [
      `To the maximum extent permitted under applicable Indian law, Qelsa's aggregate liability arising out of or relating to these Terms or use of the Platform shall not exceed the amount paid by the User to Qelsa in the 12 months preceding the claim. Qelsa shall not be liable for indirect, incidental, consequential, or special damages, including loss of employment opportunity, business, or profits.`,
    ],
  },
  {
    title: "15. Termination",
    blocks: [
      `Qelsa may suspend or terminate your access to the Platform, with or without notice, for violation of these Terms, suspected fraud, or as required by law. You may close your account at any time via account settings or by contacting [support email]; certain data may be retained as described in the Privacy Policy.`,
    ],
  },
  {
    title: "16. Governing Law and Dispute Resolution",
    blocks: [
      `These Terms are governed by the laws of India. Subject to Section 16.1, courts at Bengaluru, Karnataka shall have exclusive jurisdiction over disputes arising from these Terms.`,
      {
        tight: true,
        text: `16.1 Qelsa and the User will first attempt to resolve any dispute through good-faith negotiation for 30 days before initiating formal proceedings. Qelsa may, at its discretion, refer disputes to arbitration under the Arbitration and Conciliation Act, 1996, with the seat of arbitration in Bengaluru, Karnataka, and proceedings conducted in English.`,
      },
    ],
  },
  {
    title: "17. International Users",
    blocks: [
      `Qelsa is based in India and primarily governed by Indian law. If you access the Platform from outside India, you are responsible for compliance with local laws applicable to you. As Qelsa expands to additional jurisdictions, region-specific terms may be added and will be communicated to affected Users.`,
    ],
  },
  {
    title: "18. Changes to These Terms",
    blocks: [
      `Qelsa may update these Terms from time to time. Material changes will be notified via the Platform or email at least [7/14] days before taking effect. Continued use after changes take effect constitutes acceptance.`,
    ],
  },
];

const Terms = () => {
  return (
    <Layout activeSection={"terms"}>
      <PolicyPage
        title="Terms of service"
        lastUpdated="Last updated: July 1, 2025"
        sections={SECTIONS}
        contactHeading="Questions about our terms?"
        contactEmail="help@qelsa.com"
      />
    </Layout>
  );
};

export default Terms;
