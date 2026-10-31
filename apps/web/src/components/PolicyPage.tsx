/**
 * Shared shell for the legal pages (Terms of service, Privacy policy, Cookies).
 *
 * Figma: Qelsa-Screen — terms-of-service-page (508:111) / privacy-policy
 * (655:4000). Cyan top accent, header, a 720px content column, a contact card,
 * and a tail spacer. The body is Markdown authored in the admin panel.
 */

import { Mail } from "lucide-react";
import { Seo } from "./Seo";
import { LegalMarkdown, markdownSummary } from "./LegalMarkdown";

interface PolicyPageProps {
  title: string;
  lastUpdated: number;
  body: string;
  contactHeading: string;
  contactEmail: string;
  /** Canonical path, e.g. "/terms". */
  path: string;
}

export function PolicyPage({
  title,
  lastUpdated,
  body,
  contactHeading,
  contactEmail,
  path,
}: PolicyPageProps) {
  return (
    <>
      <Seo title={title} description={markdownSummary(body)} path={path} />

      {/* top-accent */}
      <div className="h-1 w-full bg-neon-cyan" />

      <div className="w-full px-4 text-white sm:px-8 lg:px-[120px]">
        {/* header */}
        <div className="flex flex-col gap-2 pb-10 pt-12 lg:pb-16 lg:pt-20">
          <h1 className="text-3xl font-extrabold text-white lg:text-[40px]">{title}</h1>
          <p className="text-sm text-white/50">
            Last updated:{" "}
            {new Date(lastUpdated).toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </p>
        </div>

        {/* content column */}
        <div className="w-full max-w-[720px]">
          <div className="pb-14">
            <LegalMarkdown markdown={body} />
          </div>

          {/* contact-card */}
          <div className="flex flex-col gap-4 rounded-xl border border-glass-border bg-white/[0.04] p-6 lg:p-8">
            <p className="text-lg font-semibold text-white">{contactHeading}</p>
            <div className="flex items-center gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-white/[0.04]">
                <Mail className="size-5 text-neon-cyan" strokeWidth={2} />
              </span>
              <a
                href={`mailto:${contactEmail}`}
                className="text-base font-medium text-neon-cyan transition-opacity hover:opacity-80"
              >
                {contactEmail}
              </a>
            </div>
          </div>

          <div className="h-[100px]" />
        </div>
      </div>
    </>
  );
}
