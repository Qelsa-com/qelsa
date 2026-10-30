/**
 * Default legal copy and the home-page jobs stat.
 *
 * This is the fallback used until an admin saves a version in `site_content`.
 * The legal text is stored here as structured blocks and converted to Markdown
 * on read; the admin editor sees the Markdown form.
 */
export type PolicyBlock =
  | string
  | { text: string; tight?: boolean }
  | { list: string[] }
  | { numbered: string[] };
export type PolicySection = { title: string; blocks: PolicyBlock[] };
export type LegalKey = "terms" | "privacy" | "cookies";
export const SITE_CONTENT_KEYS = ["terms", "privacy", "cookies", "home_jobs_stat"] as const;
export type SiteContentKey = (typeof SITE_CONTENT_KEYS)[number];

/** Shown on the home page next to “live jobs”. */
export const DEFAULT_HOME_JOBS_STAT = "20K+";

const TERMS_SECTIONS: PolicySection[] = [] = [
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

const PRIVACY_SECTIONS: PolicySection[] = [] = [
  {
    title: "1. Introduction",
    blocks: [
      `This Privacy Policy explains how Qelsa, having its registered office at HSR Layout, Karnataka, India ("Qelsa", "we", "us", "our"), collects, uses, discloses, and protects personal data of Users of the Qelsa Platform (website and mobile applications).`,
      {
        tight: true,
        text: `Qelsa processes personal data in accordance with the Digital Personal Data Protection Act, 2023 (DPDP Act) and, where applicable to Users outside India, relevant international data protection principles.`,
      },
      {
        tight: true,
        text: `If you are between 16 and 18 years of age, you may use the Platform only with parental or guardian consent, and we process such consent in line with the DPDP Act's provisions for children's/minor's data.`,
      },
    ],
  },
  {
    title: "2. Data Fiduciary and Grievance Officer",
    blocks: [
      `Qelsa acts as the Data Fiduciary for personal data processed on the Platform.`,
      { tight: true, text: `Grievance Officer Name: [NAME] Email: [GRIEVANCE EMAIL] Address: HSR Layout, Karnataka, India` },
      {
        tight: true,
        text: `Any complaints or queries regarding processing of your personal data may be directed to the Grievance Officer, who will respond within the timeline prescribed under applicable law.`,
      },
    ],
  },
  {
    title: "3. Personal Data We Collect",
    blocks: [
      `3.1 Provided directly by you:`,
      {
        list: [
          `Name, email address, phone number, date of birth`,
          `Educational background, work history, certifications, skills`,
          `Resume/CV files and free-text profile content`,
          `Job preferences, location, industry interests`,
          `Account credentials (or Google OAuth identifiers, if you sign in with Google)`,
          `Payment-related information processed via Razorpay (Qelsa itself does not store full card/bank details)`,
        ],
      },
      `3.2 Collected automatically:`,
      {
        list: [
          `Device information, IP address, browser type`,
          `Usage data: pages visited, features used, session duration`,
          `Cookies and similar tracking technologies (see Section 9)`,
        ],
      },
      `3.3 Collected from third parties (with consent, where applicable):`,
      {
        list: [
          `Basic profile information from Google, if you sign in via Google OAuth`,
          `Candidate or job data received via ATS integrations when an employer connects their ATS to Qelsa`,
          `Publicly available professional information, where lawfully sourced, used to enrich company/industry/skills reference data (not scraped personal profiles)`,
        ],
      },
      `3.4 Generated by Qelsa:`,
      {
        list: [
          `Readiness Score and underlying skill-match assessments`,
          `AI-generated summaries, suggestions, and competency evaluations`,
          `Aggregated/anonymized usage and training data`,
        ],
      },
    ],
  },
  {
    title: "4. How We Use Personal Data",
    blocks: [
      `We use personal data to:`,
      {
        numbered: [
          `Create and manage your account and profile`,
          `Generate your Readiness Score and skill-gap analysis`,
          `Match job seekers with relevant roles and employers with relevant candidates`,
          `Power AI-assisted features (resume review, job-match explanations, competency assessment) using Qelsa's AI agents, which run on third-party AI infrastructure (Anthropic)`,
          `Process payments for subscriptions via Razorpay`,
          `Facilitate ATS integrations for employer customers`,
          `Send service communications, updates, and (with consent, where required) marketing communications`,
          `Improve the Platform, including training and refining Qelsa's proprietary scoring models, in anonymized/aggregated form`,
          `Detect fraud, enforce our Terms, and comply with legal obligations`,
          `Respond to grievances and support requests`,
        ],
      },
    ],
  },
  {
    title: "5. Legal Basis / Consent",
    blocks: [
      `Under the DPDP Act, we process your personal data on the basis of your consent, obtained through clear notice at the point of collection (e.g., account creation, ATS connection, cookie banner), or where processing is otherwise permitted by law (e.g., compliance with legal obligations, certain "legitimate use" categories under the Act). You may withdraw consent at any time as described in Section 8, subject to the effect withdrawal may have on your ability to use certain features.`,
    ],
  },
  {
    title: "6. Disclosure of Personal Data",
    blocks: [
      `We disclose personal data as follows:`,
      {
        tight: true,
        text: `6.1 To employers (Job Seekers only): When you apply to a role or participate in the hiring marketplace, employers may receive your profile, skill names, proficiency gaps, and general readiness/priority tier information. We do not disclose the exact numeric weights or internal formula behind your Readiness Score to employers or candidates.`,
      },
      `6.2 To service providers (processors):`,
      {
        list: [
          `Google — authentication (OAuth)`,
          `Razorpay — payment processing`,
          `ATS providers — where an employer customer has connected their Applicant Tracking System for integration purposes`,
          `Anthropic — AI infrastructure powering Qelsa's agents (resume review, job matching, competency assessment, etc.)`,
          `DigitalOcean — cloud hosting and database infrastructure`,
        ],
      },
      {
        tight: true,
        text: `These providers process data on Qelsa's behalf and are contractually/technically restricted from using it for their own purposes beyond providing their service to Qelsa, except as governed by their own applicable terms.`,
      },
      `6.3 Legal disclosures: We may disclose data if required by law, court order, or governmental authority, or to protect the rights, safety, or property of Qelsa, our Users, or the public.`,
      `6.4 Business transfers: If Qelsa is involved in a merger, acquisition, or asset sale, personal data may be transferred as part of that transaction, subject to equivalent privacy protections.`,
      `6.5 We do not sell personal data to third parties.`,
    ],
  },
  {
    title: "7. AI Processing and Model Training",
    blocks: [
      `7.1 Certain features send relevant profile or query data to Qelsa's AI agents (built on Anthropic's models) to generate outputs such as resume feedback, job-match explanations, or competency assessments.`,
      `7.2 Conversations and interactions with AI features may be logged (in a table referred to internally as training_candidates) for quality improvement and, over time, to support development of Qelsa's own proprietary AI models. Where used for this purpose, data is anonymized/de-identified before being used in model training or evaluation.`,
      `7.3 The Readiness Score itself is generated primarily through a deterministic, structured skill-matching methodology (not free-text AI scoring), which limits reliance on AI interpretation for your core score.`,
    ],
  },
  {
    title: "8. Your Rights (DPDP Act)",
    blocks: [
      `Subject to applicable law, you have the right to:`,
      {
        list: [
          `Access a summary of personal data we hold about you and the processing activities`,
          `Correction and updating of inaccurate or incomplete personal data`,
          `Erasure of personal data that is no longer necessary for the purpose it was collected, subject to legal retention requirements`,
          `Withdraw consent at any time, without affecting the lawfulness of processing before withdrawal`,
          `Grievance redressal via our Grievance Officer (Section 2), and thereafter, if unresolved, escalation to the Data Protection Board of India`,
          `Nominate another individual to exercise your rights in the event of death or incapacity, as provided under the DPDP Act`,
        ],
      },
      { tight: true, text: `To exercise these rights, contact [privacy/support email]. We may need to verify your identity before acting on a request.` },
    ],
  },
  {
    title: "9. Cookies and Tracking",
    blocks: [
      `We use cookies and similar technologies to keep you logged in, remember preferences, and understand Platform usage (analytics). You can control cookies through your browser settings; disabling certain cookies may limit Platform functionality. [Add specifics once analytics/ad tools are finalized, e.g. Google Analytics.]`,
    ],
  },
  {
    title: "10. Data Retention",
    blocks: [
      `We retain personal data for as long as your account is active and as necessary to provide the Platform, comply with legal obligations (e.g., tax/GST records for B2B invoicing), resolve disputes, and enforce agreements. Anonymized/aggregated data used for model improvement may be retained beyond account closure, since it is no longer personal data.`,
    ],
  },
  {
    title: "11. Data Security",
    blocks: [
      `We use reasonable technical and organizational measures to protect personal data, including encrypted storage of credentials and sensitive configuration, access controls, and secure hosting infrastructure (DigitalOcean, managed PostgreSQL). No system is completely secure; we cannot guarantee absolute security.`,
    ],
  },
  {
    title: `12. Children's / Minors' Data`,
    blocks: [
      `Qelsa permits use by Users aged 16 and above. For Users between 16–18, we seek to obtain verifiable parental/guardian consent where required under the DPDP Act, and limit certain processing (e.g., behavioral tracking for advertising) accordingly. Qelsa does not knowingly collect personal data from individuals under 16; if we become aware that we have, we will delete it.`,
    ],
  },
  {
    title: "13. Cross-Border Data Transfer",
    blocks: [
      `As Qelsa expands internationally, personal data may be processed or stored on servers located outside India. Where required, we will implement appropriate safeguards for such transfers consistent with the DPDP Act and applicable destination-country laws. [To be finalized upon confirming international hosting/processing arrangements.]`,
    ],
  },
  {
    title: "14. Employer / B2B Data Handling",
    blocks: [
      `Where an employer connects an ATS or otherwise submits candidate data to Qelsa, the employer is responsible for ensuring it had a lawful basis to share that data with Qelsa. Qelsa processes such candidate data solely to provide the Employer Services (matching, readiness signals, shortlisting support) as instructed by the employer customer.`,
    ],
  },
  {
    title: "15. Changes to This Policy",
    blocks: [
      `We may update this Privacy Policy periodically. Material changes will be notified via the Platform or email at least [7/14] days in advance. The "Last Updated" date at the top reflects the most recent revision.`,
    ],
  },
];

const COOKIES_SECTIONS: PolicySection[] = [] = [
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

function isTight(block: PolicyBlock): boolean {
  return typeof block !== "string" && "text" in block && block.tight === true;
}

function blockToMarkdown(block: PolicyBlock): string {
  if (typeof block === "string") return block;
  if ("numbered" in block) {
    return block.numbered.map((item, index) => `${index + 1}. ${item}`).join("\n");
  }
  if ("list" in block) {
    return block.list.map((item) => `- ${item}`).join("\n");
  }
  return block.text;
}

export function sectionsToMarkdown(sections: PolicySection[]): string {
  return sections
    .map((section) => {
      let body = "";
      section.blocks.forEach((block, index) => {
        const text = blockToMarkdown(block);
        if (index === 0) {
          body = text;
          return;
        }
        const tight = isTight(block) || isTight(section.blocks[index - 1]);
        body += (tight ? "\n" : "\n\n") + text;
      });
      return `## ${section.title}\n\n${body}`;
    })
    .join("\n\n");
}
export type LegalDefault = {
  title: string;
  contactHeading: string;
  contactEmail: string;
  body: string;
};

export const DEFAULT_LEGAL_CONTENT: Record<LegalKey, LegalDefault> = {
  terms: {
    title: 'Terms of service',
    contactHeading: 'Questions about our terms?',
    contactEmail: 'help@qelsa.com',
    body: sectionsToMarkdown(TERMS_SECTIONS),
  },
  privacy: {
    title: 'Privacy policy',
    contactHeading: 'Questions about our privacy policy?',
    contactEmail: 'help@qelsa.com',
    body: sectionsToMarkdown(PRIVACY_SECTIONS),
  },
  cookies: {
    title: 'Cookie policy',
    contactHeading: 'Questions about our cookie policy?',
    contactEmail: 'help@qelsa.com',
    body: sectionsToMarkdown(COOKIES_SECTIONS),
  },
};

export const LEGAL_DEFAULT_UPDATED_AT = Date.parse("2025-07-01T00:00:00Z");

export function isLegalKey(value: string): value is LegalKey {
  return value === "terms" || value === "privacy" || value === "cookies";
}
