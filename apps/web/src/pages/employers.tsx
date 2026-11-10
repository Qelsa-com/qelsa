import { Seo } from "@/components/Seo";
import {
  ClosingCta,
  MARKETING_FOCUS,
  MARKETING_SECTION,
  MarketingPage,
  PANEL,
  PRIMARY_CTA,
  SECONDARY_CTA,
  SectionIntro,
} from "@/components/marketing/MarketingPage";
import { ArrowRight, Check, TriangleAlert } from "lucide-react";
import Link from "next/link";
import Layout from "../layout";

/**
 * /employers — the employer deep-dive.
 *
 * Everything here is presentational; the only live behaviour is the CTAs,
 * which send guests to the employer auth flow. The company names below are
 * examples, not claims about customers.
 */

const EMPLOYER_AUTH = "/employer/auth?returnUrl=/jobs/posted";

const SHORTLIST = [
  {
    initials: "PS",
    name: "Priya Sharma",
    meta: "5 yrs in operations",
    gap: "Gap: SQL basics",
    score: 81,
    tone: "text-[#40D480]",
    avatar: "border-emerald-500/30 bg-emerald-950/70 text-emerald-400",
  },
  {
    initials: "DO",
    name: "Daniel Okafor",
    meta: "Switching from sales",
    gap: "Gap: Power BI",
    score: 77,
    tone: "text-[#40D480]",
    avatar: "border-teal-500/30 bg-teal-950/70 text-teal-400",
  },
  {
    initials: "SM",
    name: "Sofia Martinez",
    meta: "Recent graduate",
    gap: "Gaps: SQL, Power BI",
    score: 72,
    tone: "text-[#40D480]",
    avatar: "border-emerald-500/30 bg-emerald-950/70 text-emerald-400",
  },
];

/** Only providers the backend actually syncs. */
const ATS = [
  "Greenhouse",
  "Lever",
  "Ashby",
  "Workday",
  "SmartRecruiters",
  "Workable",
  "Oracle Cloud",
  "Eightfold",
];

const WORKFLOW = [
  {
    step: "01",
    title: "Define",
    body: "Start with the skills that matter, not a wall of requirements.",
    visual: (
      <>
        <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-white/50">Required</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          <span className="rounded-md border border-[#00D4FF]/25 bg-[#00D4FF]/[0.08] px-2 py-1 text-[12px] text-[#00D4FF]">
            Rust Core
          </span>
          <span className="rounded-md border border-[#00D4FF]/25 bg-[#00D4FF]/[0.08] px-2 py-1 text-[12px] text-[#00D4FF]">
            gRPC
          </span>
        </div>
      </>
    ),
  },
  {
    step: "02",
    title: "Find",
    body: "See who has done the work — not who used the right keywords.",
    visual: (
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-white/[0.12] text-[10px] font-bold text-white">
            AK
          </span>
          <div className="min-w-0">
            <p className="truncate text-[14px] font-semibold text-white">Alex K.</p>
            <p className="text-[12px] text-[#40D480]">96% skills match</p>
          </div>
        </div>
        <span className="rounded-full border border-white/[0.12] px-2 py-1 text-[10px] text-white/50">Top match</span>
      </div>
    ),
  },
  {
    step: "03",
    title: "Understand",
    body: "Know what they bring and what they'd need to learn.",
    visual: (
      <div className="flex items-center gap-2 text-[#FFC740]">
        <TriangleAlert className="size-4 shrink-0" aria-hidden="true" />
        <span className="text-[13px]">Gap: Kubernetes</span>
      </div>
    ),
  },
];

function ShortlistCard() {
  return (
    <div className="landing-card-border relative overflow-hidden rounded-3xl p-6 shadow-[0_40px_100px_-30px_rgba(124,47,243,0.55)]">
      <span className="absolute right-6 top-6 text-[10px] font-medium text-white/50">Example</span>

      <p className="text-[14px] text-white/60">Ranked shortlist</p>
      <p className="mt-1 text-[22px] font-semibold leading-tight tracking-[-0.02em]">Associate Business Analyst</p>
      <p className="mt-1 text-[12px] text-white/45">3 candidates above 70%</p>

      <div className="mt-5 space-y-2.5">
        {SHORTLIST.map((candidate) => (
          <div
            key={candidate.name}
            className="flex items-center justify-between gap-3 rounded-xl border border-white/[0.08] bg-white/[0.03] p-3"
          >
            <div className="flex min-w-0 items-center gap-3">
              <span
                className={`flex size-9 shrink-0 items-center justify-center rounded-lg border text-[11px] font-bold ${candidate.avatar}`}
              >
                {candidate.initials}
              </span>
              <div className="min-w-0">
                <p className="truncate text-[13px] font-semibold text-white">{candidate.name}</p>
                <p className="text-[11px] leading-snug text-white/50">
                  {candidate.meta} · {candidate.gap}
                </p>
              </div>
            </div>
            <span className={`shrink-0 text-[15px] font-semibold ${candidate.tone}`}>{candidate.score}%</span>
          </div>
        ))}
      </div>

      <p className="mt-5 border-t border-white/[0.08] pt-4 text-[12px] text-white/50">
        Ranked by evidence, not keyword count.
      </p>
    </div>
  );
}

export default function Employers() {
  return (
    <Layout activeSection="employers">
      <Seo
        title="Know who fits the role"
        description="See candidate readiness, the skill gaps and the evidence behind each score before the first call."
        path="/employers"
      />

      <MarketingPage>
        {/* Hero */}
        <section className="mx-auto w-full max-w-[1240px] px-4 pb-12 pt-14 sm:px-6 sm:pb-16 lg:pb-16 lg:pt-24">
          <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,460px)] lg:items-center lg:gap-14">
            <div className="min-w-0">
              <h1 className="font-editorial max-w-[720px] text-balance text-[44px] leading-[0.98] tracking-[-0.02em] sm:text-[60px] lg:text-[78px] xl:text-[84px]">
                Know who <em className="text-[#C4B5FD]">fits</em> the role.
              </h1>

              <div className="mt-7 flex max-w-[500px] gap-4">
                <span
                  aria-hidden="true"
                  className="w-0.5 shrink-0 rounded-full bg-[linear-gradient(180deg,#A78BFA,#F472B6)]"
                />
                <p className="text-pretty text-[19px] leading-relaxed text-white/65 sm:text-[21px]">
                  Readiness and evidence for every candidate —{" "}
                  <span className="text-white">before the first call.</span>
                </p>
              </div>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link href={EMPLOYER_AUTH} className={PRIMARY_CTA}>
                  Hire talent
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                </Link>
                <Link href="#workflow" className={SECONDARY_CTA}>
                  See how it works
                </Link>
              </div>

              <p className="mt-5 flex items-center gap-2 text-[13px] text-white/50">
                <span aria-hidden="true" className="size-1.5 rounded-full bg-[#40D480]" />
                Works with your current ATS
              </p>
            </div>

            <ShortlistCard />
          </div>
        </section>

        {/* Workflow */}
        <section id="workflow" aria-labelledby="workflow-heading" className={`${MARKETING_SECTION} scroll-mt-24`}>
          <SectionIntro
            id="workflow-heading"
            title="From role to shortlist, in three steps."
            lead="Define the skills, find the evidence, understand the gap."
          />

          <div className="mt-10 grid gap-4 lg:mt-14 lg:grid-cols-3">
            {WORKFLOW.map((item) => (
              <div key={item.step} className={`${PANEL} flex flex-col p-6 sm:p-7`}>
                <div className="flex items-center gap-2">
                  <span className="grid size-7 place-items-center rounded-full bg-[linear-gradient(135deg,#7C2FF3,#D73E9D)] text-[12px] font-bold text-white">
                    {item.step}
                  </span>
                </div>
                <h3 className="mt-4 text-[18px] font-semibold text-white">{item.title}</h3>
                <p className="mt-1.5 text-[14px] leading-relaxed text-white/55">{item.body}</p>
                <div className="mt-5 rounded-xl bg-white/[0.03] p-4">{item.visual}</div>
              </div>
            ))}
          </div>
          <p className="mt-6 text-center text-[12px] text-white/50">Examples, not live candidate data.</p>
        </section>

        {/* Evidence */}
        <section aria-labelledby="evidence-heading" className={MARKETING_SECTION}>
          <SectionIntro
            id="evidence-heading"
            title="Know why a candidate fits."
            lead="Every score comes with the evidence behind it."
          />

          <div className="mt-10 grid gap-6 lg:mt-14 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
            <div className="landing-card-border rounded-[24px] p-6 sm:p-8">
              <div className="flex items-center justify-between gap-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-white/50">Shortlisted · #1</p>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-white/50">Example</span>
                  <span className="text-[15px] font-semibold text-[#40D480]">81%</span>
                </div>
              </div>

              <div className="mt-4 flex items-center gap-3">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-emerald-500/30 bg-emerald-950/70 text-[13px] font-bold text-emerald-400">
                  PS
                </span>
                <div>
                  <p className="text-[18px] font-semibold text-white">Priya Sharma</p>
                  <p className="text-[13px] text-white/50">Associate Business Analyst · 5 yrs</p>
                </div>
              </div>

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-[11px] font-medium text-white/50">Strong</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {["Excel", "Communication", "Presentations"].map((skill) => (
                      <span
                        key={skill}
                        className="rounded-full border border-white/[0.12] bg-white/[0.04] px-2.5 py-1 text-[12px] text-white/80"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-[11px] font-medium text-white/50">Missing</p>
                  <div className="mt-2">
                    <span className="rounded-full border border-[#FFC740]/30 bg-[#FFC740]/[0.08] px-2.5 py-1 text-[12px] text-[#FFC740]">
                      SQL basics
                    </span>
                  </div>
                </div>
              </div>

              <p className="mt-5 border-t border-white/[0.08] pt-4 text-[12px] leading-relaxed text-white/60">
                Evidence: built the weekly Excel reporting for three regions and led the operations review deck.
              </p>
            </div>

            <div className="min-w-0">
              <ul className="space-y-4">
                {[
                  "Readiness, not a resume keyword score.",
                  "The gap, named before the first call.",
                  "Every score traces back to evidence.",
                ].map((point) => (
                  <li key={point} className="flex items-start gap-3 text-[16px] leading-relaxed text-white/70">
                    <Check className="mt-0.5 size-4 shrink-0 text-[#00D4FF]" strokeWidth={2.5} aria-hidden="true" />
                    {point}
                  </li>
                ))}
              </ul>

              <Link
                href="/candidates"
                className={`mt-7 inline-flex min-h-11 items-center gap-2 text-[15px] font-medium text-[#00D4FF] transition-colors hover:text-white ${MARKETING_FOCUS}`}
              >
                See the candidate side
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </section>

        {/* ATS */}
        <section aria-labelledby="ats-heading" className={MARKETING_SECTION}>
          <SectionIntro
            id="ats-heading"
            title="Works with your hiring stack."
            lead="Sync the boards you already use — no new ATS required."
          />

          <div className="mx-auto mt-8 flex max-w-[900px] flex-wrap justify-center gap-2.5">
            {ATS.map((name) => (
              <span
                key={name}
                className="rounded-full border border-white/[0.12] bg-white/[0.04] px-4 py-2 text-[13px] text-white/70"
              >
                {name}
              </span>
            ))}
          </div>
        </section>

        <ClosingCta
          title="Hire the people who are ready."
          accent="Before the first call."
          href={EMPLOYER_AUTH}
          label="Hire talent"
        />
      </MarketingPage>
    </Layout>
  );
}
