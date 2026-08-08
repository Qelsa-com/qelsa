/**
 * Shared shell for the legal pages (Terms of service, Privacy policy).
 *
 * Figma: Qelsa-Screen — terms-of-service-page (508:111) / privacy-policy
 * (655:4000). Both designs are the same frame with different copy: cyan top
 * accent, header, a 720px content column of numbered sections, a contact card,
 * and a tail spacer. Keeping one component keeps the two pages identical.
 */

import { Mail } from "lucide-react";
import { Fragment } from "react";

/**
 * A block of body copy. The designs separate most clauses with a blank line,
 * so a plain string carries that gap; `tight` is for the places a clause runs
 * straight on from the line above, and lists always do.
 */
export type PolicyBlock = string | { text: string; tight: true } | { list: string[] } | { numbered: string[] };

export interface PolicySection {
  title: string;
  blocks: PolicyBlock[];
}

interface PolicyPageProps {
  title: string;
  lastUpdated: string;
  sections: PolicySection[];
  contactHeading: string;
  contactEmail: string;
}

export function PolicyPage({ title, lastUpdated, sections, contactHeading, contactEmail }: PolicyPageProps) {
  return (
    <>
      {/* top-accent */}
      <div className="h-1 w-full bg-neon-cyan" />

      <div className="w-full px-4 text-white sm:px-8 lg:px-[120px]">
        {/* header */}
        <div className="flex flex-col gap-2 pb-10 pt-12 lg:pb-16 lg:pt-20">
          <h1 className="text-3xl font-extrabold text-white lg:text-[40px]">{title}</h1>
          <p className="text-sm text-white/50">{lastUpdated}</p>
        </div>

        {/* content column */}
        <div className="w-full max-w-[720px]">
          <div className="flex flex-col gap-6 pb-14">
            {sections.map((section) => (
              <Fragment key={section.title}>
                <h2 className="text-xl font-semibold text-white lg:text-2xl">{section.title}</h2>
                <div className="text-[15px] text-white/70">
                  {section.blocks.map((block, i) => (
                    <PolicyBlockView key={i} block={block} isFirst={i === 0} />
                  ))}
                </div>
              </Fragment>
            ))}
          </div>

          {/* contact-card */}
          <div className="flex flex-col gap-4 rounded-xl border border-glass-border bg-white/[0.04] p-6 lg:p-8">
            <p className="text-lg font-semibold text-white">{contactHeading}</p>
            <div className="flex items-center gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-white/[0.04]">
                <Mail className="size-5 text-neon-cyan" strokeWidth={2} />
              </span>
              <a href={`mailto:${contactEmail}`} className="text-base font-medium text-neon-cyan transition-opacity hover:opacity-80">
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

function PolicyBlockView({ block, isFirst }: { block: PolicyBlock; isFirst: boolean }) {
  // A blank line in the design is one line of 1.7 leading at 15px, i.e. 25px.
  const gap = isFirst ? "" : "mt-[25px]";

  if (typeof block === "string") return <p className={`leading-[1.7] ${gap}`}>{block}</p>;

  if ("text" in block) return <p className="leading-[1.7]">{block.text}</p>;

  if ("numbered" in block) {
    return (
      <ol className="list-decimal">
        {block.numbered.map((item) => (
          <li key={item} className="ms-[22.5px] leading-[1.7]">
            {item}
          </li>
        ))}
      </ol>
    );
  }

  return (
    <ul className="list-disc">
      {block.list.map((item) => (
        <li key={item} className="ms-[22.5px] leading-[1.7]">
          {item}
        </li>
      ))}
    </ul>
  );
}
