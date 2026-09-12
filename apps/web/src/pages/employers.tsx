import { ArrowRight, Check, ChevronRight, CircleArrowUp, CircleCheck, TriangleAlert } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import Layout from "../layout";

// Employers marketing page. Everything here is presentational; the only live
// behaviour is the two CTAs, which send guests to /auth.

const SECTION = "border-t border-white/[0.06] py-20 lg:py-25";
const CONTAINER = "mx-auto w-full max-w-7xl px-6";
const H2 = "text-center text-3xl font-bold tracking-[-0.01em] text-white lg:text-[44px] lg:leading-[1.15]";
const SUB = "mx-auto mt-4 max-w-2xl text-center text-base leading-relaxed text-white/50 lg:text-lg";
const EYEBROW = "text-[13px] font-bold uppercase tracking-[0.18em] text-sky-400";
const PANEL = "rounded-3xl border border-white/[0.08] bg-white/[0.02]";
const CARD = "rounded-2xl border border-white/[0.08] bg-white/[0.02]";
const GRADIENT = "bg-gradient-to-r from-[#7C3AED] to-[#DB2777]";
const CHIP = "rounded-md border border-sky-400/25 bg-sky-400/10 px-2.5 py-1 text-[13px] text-sky-300";

const WORKFLOW_STEPS = [
  {
    step: "01 / Define",
    title: "Precision JDs",
    body: "Start with the skills that matter.",
    visual: (
      <>
        <p className="text-[11px] uppercase tracking-[0.12em] text-white/40">Required capabilities</p>
        <div className="mt-2.5 flex flex-wrap gap-2">
          <span className={CHIP}>Rust Core</span>
          <span className={CHIP}>gRPC</span>
        </div>
      </>
    ),
  },
  {
    step: "02 / Find",
    title: "Skill-Based Search",
    body: "See candidates based on relevant skills and experience.",
    visual: (
      <div className="flex items-center gap-3">
        <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-white/[0.12] text-[10px] font-bold text-white">AK</span>
        <div>
          <p className="text-[15px] font-bold text-white">Alex K.</p>
          <p className="text-[13px] text-emerald-400">96% Skills Match</p>
        </div>
      </div>
    ),
  },
  {
    step: "03 / Understand",
    title: "Gap Analysis",
    body: "Know what they bring and where the gaps are.",
    visual: (
      <div className="flex items-center gap-2 text-amber-400">
        <TriangleAlert className="size-4 shrink-0" />
        <span className="text-[14px]">Gap: Kubernetes</span>
      </div>
    ),
  },
  {
    step: "04 / Assess",
    title: "Structured Verification",
    body: "Go beyond the resume.",
    visual: (
      <div className="flex items-center gap-2 text-emerald-400">
        <Check className="size-4 shrink-0" />
        <span className="text-[14px]">System Architecture Verified</span>
      </div>
    ),
  },
];

const STRENGTHS = ["Product Strategy", "User Research", "Agile Delivery", "Stakeholder Management"];
const GAPS = ["Advanced SQL Database Systems", "Core Cohort Product Analytics"];

const ATS_LEFT = ["Greenhouse", "Lever", "Workday"];
const ATS_RIGHT = ["Ashby", "iCIMS", "BambooHR"];

const CONFIDENCE_CARDS = [
  {
    title: "Know who fits",
    body: "See ranked candidates with match scores based on skills, experience, and role fit - not just keywords.",
  },
  {
    title: "Understand why they fit",
    body: "Qelsa breaks down every match - which skills align, where the gaps are, and what the candidate brings beyond the JD.",
  },
  {
    title: "Decide with clarity",
    body: "Compare candidates side by side, review skill gaps, and move forward knowing exactly what each person offers.",
  },
];

const FOOTER_LINKS = [
  { label: "Privacy Policy", href: "/privacy" },
  { label: "Terms of Service", href: "/terms" },
  { label: "Cookie Policy", href: "/cookies" },
];

function AtsPill({ name }: { name: string }) {
  return (
    <div className="inline-flex items-center gap-2.5 rounded-xl border border-white/[0.08] bg-[#0D0D16] px-5 py-3.5">
      <span className="text-[15px] font-bold text-white">{name}</span>
      <span className="size-1.5 rounded-full bg-emerald-400" />
      <span className="text-[14px] text-emerald-400">Active</span>
    </div>
  );
}

export default function Employers() {
  return (
    <Layout activeSection="employers">
      {/* Hero */}
      <section className="bg-[linear-gradient(180deg,#06060F_0%,#0B1020_100%)] py-20 lg:py-23">
        <div className={`${CONTAINER} grid items-center gap-14 lg:grid-cols-[1fr_520px]`}>
          <div>
            <p className={EYEBROW}>For Employers</p>
            <h1 className="mt-6 text-5xl font-bold tracking-[-0.02em] text-white lg:text-[80px] lg:leading-[1.05]">
              Know who fits
              <br />
              the role
            </h1>
            <p className="mt-8 max-w-[620px] text-lg leading-relaxed text-white/60 lg:text-xl">
              Define the skills you need, find relevant candidates, and understand why they fit.
            </p>
            <Link href="/auth" className={`mt-9 inline-flex items-center gap-2.5 rounded-full px-7 py-3.5 text-base font-bold text-white ${GRADIENT}`}>
              Find who fits
              <ArrowRight className="size-[18px]" />
            </Link>
          </div>

          {/* Dashboard mockup */}
          <div className={`${PANEL} p-6`}>
            <div className="flex items-center justify-between">
              <p className="text-[13px] font-bold uppercase tracking-[0.14em] text-sky-400">Hiring Dashboard</p>
              <span className="flex items-center gap-2 rounded-full bg-emerald-400/10 px-3 py-1">
                <span className="size-1.5 rounded-full bg-emerald-400" />
                <span className="text-[13px] text-emerald-400">Live matches</span>
              </span>
            </div>

            <div className="mt-5 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4">
              <div className="flex items-center gap-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white/[0.12] text-[13px] font-bold text-white">AK</span>
                <div className="min-w-0 flex-1">
                  <p className="text-[17px] font-bold text-white">Alex K.</p>
                  <p className="text-[14px] text-white/50">Staff UI Architect</p>
                </div>
                <span className="rounded-full bg-emerald-400/10 px-3 py-1 text-[14px] font-semibold text-emerald-400">96% Readiness</span>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <span className={CHIP}>React</span>
                <span className={CHIP}>TypeScript</span>
                <span className={CHIP}>System Design</span>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-4">
              <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-4">
                <p className="text-[14px] text-white/50">Open roles</p>
                <p className="mt-1 text-2xl font-bold text-white">12</p>
              </div>
              <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-4">
                <p className="text-[14px] text-white/50">Avg. time-to-shortlist</p>
                <p className="mt-1 text-2xl font-bold text-white">2d</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Workflow */}
      <section className={SECTION}>
        <div className={CONTAINER}>
          <h2 className={H2}>A precision workflow for modern teams</h2>
          <p className={SUB}>Understand candidate fit at every step of your hiring process.</p>

          <div className="mt-14 grid gap-6 lg:grid-cols-4 lg:gap-8">
            {WORKFLOW_STEPS.map((item, index) => (
              <article key={item.step} className={`relative ${CARD} p-6`}>
                <p className="text-[13px] font-bold uppercase tracking-[0.1em] text-sky-400">{item.step}</p>
                <h3 className="mt-3 text-[19px] font-bold text-white">{item.title}</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-white/50">{item.body}</p>
                <div className="mt-5 rounded-lg border border-white/[0.06] bg-black/40 p-3.5">{item.visual}</div>
                {index < WORKFLOW_STEPS.length - 1 && (
                  <ChevronRight className="absolute -right-[22px] top-1/2 hidden size-5 -translate-y-1/2 text-white/25 lg:block" />
                )}
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Match explanation */}
      <section className={SECTION}>
        <div className={CONTAINER}>
          <h2 className={H2}>Know why a candidate fits</h2>
          <p className={SUB}>Understand the match before you make the decision.</p>

          <div className={`mt-14 grid gap-10 p-10 lg:grid-cols-[1.5fr_auto_1.1fr_1.1fr] ${PANEL}`}>
            <div>
              <p className="text-[14px] font-bold uppercase tracking-[0.14em] text-emerald-400">Excellent fit</p>
              <h3 className="mt-6 text-[30px] font-bold text-white">Senior Product Architect</h3>
              <p className="mt-5 text-base leading-relaxed text-white/50">
                We compared this profile against real engineering data. The alignment in core framework architecture outweighs any tertiary infrastructure gaps.
              </p>
            </div>

            <p className="text-[56px] font-bold leading-none text-emerald-400">87%</p>

            <div className="rounded-xl border border-white/[0.08] p-6">
              <p className="text-[13px] font-bold uppercase tracking-[0.12em] text-emerald-400">What they bring</p>
              <ul className="mt-5 space-y-4">
                {STRENGTHS.map((skill) => (
                  <li key={skill} className="flex items-center gap-2.5 text-base text-white/80">
                    <CircleCheck className="size-4 shrink-0 text-emerald-400" />
                    {skill}
                  </li>
                ))}
              </ul>
            </div>

            <div className="h-fit rounded-xl border border-white/[0.08] p-6">
              <p className="text-[13px] font-bold uppercase tracking-[0.12em] text-amber-400">Areas to discuss / Training gaps</p>
              <ul className="mt-5 space-y-4">
                {GAPS.map((gap) => (
                  <li key={gap} className="flex items-center gap-2.5 text-base text-white/80">
                    <CircleArrowUp className="size-4 shrink-0 text-amber-400" />
                    {gap}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Two sides */}
      <section className={SECTION}>
        <div className={CONTAINER}>
          <h2 className={H2}>Skills connect the two sides</h2>
          <p className={SUB}>Qelsa creates a shared language between what people can do and what businesses need.</p>

          <div className={`mt-14 p-10 lg:px-20 lg:py-14 ${PANEL}`}>
            <div className="flex flex-col items-stretch gap-6 lg:flex-row lg:items-center lg:justify-center">
              <div className="flex-1 rounded-xl border border-white/[0.08] bg-white/[0.02] p-6">
                <p className="text-[13px] font-bold uppercase tracking-[0.12em] text-sky-400">Candidates</p>
                <h3 className="mt-3 text-[19px] font-bold text-white">Realized Potential</h3>
                <p className="mt-2 text-[15px] text-white/50">Candidates know what they bring.</p>
              </div>

              <ChevronRight className="mx-auto hidden size-5 shrink-0 text-white/25 lg:block" />

              <div className={`flex-[1.2] rounded-xl p-7 text-center ${GRADIENT}`}>
                <p className="text-[13px] font-bold uppercase tracking-[0.12em] text-white/80">Skill Intelligence</p>
                <p className="mt-3 text-[15px] leading-relaxed text-white">Qelsa connects what candidates bring with what employers need.</p>
              </div>

              <ChevronRight className="mx-auto hidden size-5 shrink-0 text-white/25 lg:block" />

              <div className="flex-1 rounded-xl border border-white/[0.08] bg-white/[0.02] p-6">
                <p className="text-[13px] font-bold uppercase tracking-[0.12em] text-sky-400">Employers</p>
                <h3 className="mt-3 text-[19px] font-bold text-white">Operational Clarity</h3>
                <p className="mt-2 text-[15px] text-white/50">Employers know what they need.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ATS integrations */}
      <section className={SECTION}>
        <div className={CONTAINER}>
          <p className={`text-center ${EYEBROW}`}>ATS Integration</p>
          <h2 className={`mt-4 ${H2}`}>Works with your hiring stack</h2>
          <p className={SUB}>Qelsa connects with the tools your team already uses.</p>

          <div className="relative mt-16 lg:h-[330px]">
            {/* Dashed spokes from the hub out to each tool. Decorative, so it is
                hidden on small screens where the columns stack. */}
            <svg
              aria-hidden="true"
              viewBox="0 0 1280 330"
              preserveAspectRatio="none"
              className="pointer-events-none absolute inset-0 hidden h-full w-full lg:block"
            >
              {[40, 165, 290].map((y) => (
                <line key={`l-${y}`} x1="530" y1="165" x2="270" y2={y} stroke="rgba(56,189,248,0.28)" strokeWidth="1.5" strokeDasharray="7 7" />
              ))}
              {[40, 165, 290].map((y) => (
                <line key={`r-${y}`} x1="750" y1="165" x2="1010" y2={y} stroke="rgba(56,189,248,0.28)" strokeWidth="1.5" strokeDasharray="7 7" />
              ))}
            </svg>

            <div className="relative grid items-center gap-8 lg:h-full lg:grid-cols-3">
              <div className="flex flex-col items-start gap-14">
                {ATS_LEFT.map((name) => (
                  <AtsPill key={name} name={name} />
                ))}
              </div>

              <div className="flex justify-center">
                <div className={`rounded-2xl px-8 py-5 text-center ${GRADIENT}`}>
                  <p className="text-[12px] font-bold uppercase tracking-[0.2em] text-white/80">Qelsa</p>
                  <p className="mt-1 text-xl font-bold leading-tight text-white">
                    Integration
                    <br />
                    Hub
                  </p>
                </div>
              </div>

              <div className="flex flex-col items-start gap-14 lg:items-end">
                {ATS_RIGHT.map((name) => (
                  <AtsPill key={name} name={name} />
                ))}
              </div>
            </div>
          </div>

          <p className="mt-16 text-center text-[15px] text-white/40">New integrations shipping regularly.</p>
        </div>
      </section>

      {/* Closing */}
      <section className={SECTION}>
        <div className={CONTAINER}>
          <h2 className={H2}>Hire with confidence</h2>
          <p className={SUB}>Know who fits the role, understand why they fit, and make better hiring decisions.</p>

          <div className="mt-14 grid gap-8 lg:grid-cols-3">
            {CONFIDENCE_CARDS.map((card) => (
              <article key={card.title} className={`${CARD} p-7`}>
                <h3 className="text-[21px] font-bold text-white">{card.title}</h3>
                <p className="mt-4 text-base leading-relaxed text-white/50">{card.body}</p>
              </article>
            ))}
          </div>

          <div className="mt-14 flex justify-center">
            <Link href="/auth" className={`inline-flex items-center gap-2.5 rounded-lg px-7 py-3.5 text-base font-bold text-white ${GRADIENT}`}>
              Find candidates
              <ArrowRight className="size-[18px]" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="pb-12 pt-20">
        <div className={CONTAINER}>
          <div className="flex flex-wrap items-center justify-between gap-6">
            <Image src="/qelsa-logo.svg" alt="Qelsa" width={91} height={29} unoptimized className="h-[26px] w-auto" />
            <nav className="flex flex-wrap items-center gap-8">
              {FOOTER_LINKS.map((link) => (
                <Link key={link.href} href={link.href} className="text-base text-white/60 transition-colors hover:text-white">
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-between gap-2 border-t border-white/[0.06] pt-8">
            <p className="text-[15px] text-white/35">© 2026 Qelsa. All rights reserved.</p>
            <p className="text-[15px] text-white/35">Providing precise hiring decision.</p>
          </div>
        </div>
      </footer>
    </Layout>
  );
}
