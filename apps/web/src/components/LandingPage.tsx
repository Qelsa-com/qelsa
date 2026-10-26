"use client";

import { QelsaLogo } from "@/components/QelsaLogo";
import { ArrowRight, ArrowUpRight, Briefcase, Check, ChevronRight, Sparkles, Zap } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

const AGENT_HIGHLIGHTS = [
  "Builds your profile",
  "Explains your score",
  "Finds jobs that fit",
  "Plans your career path",
  "Checks and tailors resumes",
  "Writes cover letters",
];

type Company = {
  name: string;
  slug?: string;
  domain: string;
  icon?: string;
  invert?: boolean;
};

const COMPANY_LOGOS_TOP: Company[] = [
  { name: "Anthropic", slug: "anthropic", domain: "anthropic.com" },
  { name: "Stripe", slug: "stripe", domain: "stripe.com" },
  { name: "NVIDIA", slug: "nvidia", domain: "nvidia.com" },
  { name: "Airbnb", slug: "airbnb", domain: "airbnb.com" },
  { name: "Figma", slug: "figma", domain: "figma.com" },
  { name: "Notion", slug: "notion", domain: "notion.so" },
  { name: "OpenAI", slug: "openai", domain: "openai.com", icon: "https://svgl.app/library/openai.svg", invert: true },
  { name: "Swiggy", slug: "swiggy", domain: "swiggy.com" },
  { name: "PhonePe", slug: "phonepe", domain: "phonepe.com" },
  { name: "Bosch", slug: "bosch", domain: "bosch.com" },
];

const COMPANY_LOGOS_BOTTOM: Company[] = [
  { name: "Netflix", slug: "netflix", domain: "netflix.com" },
  { name: "Databricks", slug: "databricks", domain: "databricks.com" },
  { name: "Razorpay", slug: "razorpay", domain: "razorpay.com" },
  { name: "Atlassian", slug: "atlassian", domain: "atlassian.com" },
  { name: "Google", slug: "google", domain: "google.com" },
  { name: "Meta", slug: "meta", domain: "meta.com" },
  { name: "Apple", slug: "apple", domain: "apple.com" },
  { name: "Uber", slug: "uber", domain: "uber.com" },
  { name: "Infosys", slug: "infosys", domain: "infosys.com" },
  { name: "Zomato", slug: "zomato", domain: "zomato.com" },
];

function CompanyMark({ company }: { company: Company }) {
  const [stage, setStage] = useState<"icon" | "favicon" | "text">("icon");
  if (stage === "text") {
    return (
      <span className="flex size-5 items-center justify-center rounded border border-white/15 text-[9px] font-bold text-white/45">
        {company.name.slice(0, 1)}
      </span>
    );
  }
  return (
    <img
      src={
        stage === "icon"
          ? company.icon ?? `https://cdn.simpleicons.org/${company.slug}/white`
          : `https://www.google.com/s2/favicons?sz=128&domain=${company.domain}`
      }
      alt=""
      aria-hidden="true"
      width={24}
      height={24}
      decoding="async"
      draggable={false}
      onError={() => setStage((current) => (current === "icon" ? "favicon" : "text"))}
      className={`h-6 w-6 object-contain ${company.invert || stage === "favicon" ? "brightness-0 invert" : ""}`}
    />
  );
}

function CompanyMarqueeRow({
  companies,
  direction,
}: {
  companies: Company[];
  direction: "right" | "left";
}) {
  return (
    <div className={`company-marquee ${direction === "right" ? "company-marquee-right" : "company-marquee-left"}`}>
      {[0, 1].map((copy) => (
        <div key={copy} className="flex shrink-0 items-center gap-2 pr-2" aria-hidden={copy === 1}>
          {companies.map((company) => (
            <div
              key={`${copy}-${company.name}`}
              className="flex h-14 w-[145px] shrink-0 items-center gap-2.5 rounded-xl border border-white/[0.06] bg-white/[0.025] px-3 sm:w-[164px]"
            >
              <CompanyMark company={company} />
              <span className="truncate text-[11px] font-semibold uppercase tracking-[0.06em] text-white/45">
                {company.name}
              </span>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

function FitSkillRow({
  skill,
  yours,
  target,
  badge,
}: {
  skill: string;
  yours: string;
  target: string;
  badge: "core" | "preferred" | "nice";
}) {
  const badgeClass =
    badge === "core"
      ? "border-amber-400 bg-amber-400 text-[#2a1700]"
      : badge === "preferred"
        ? "border-amber-400/40 text-amber-300"
        : "border-white/15 text-white/55";
  return (
    <div className="flex items-center justify-between gap-2 py-1.5 text-[10px]">
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
        <span className="w-20 shrink-0 font-medium text-white/85 sm:w-24">{skill}</span>
        <span
          className={`rounded-full border px-2 py-0.5 text-[10px] ${
            yours === "Not listed"
              ? "border-white/[0.08] text-white/40"
              : "border-cyan-400/25 bg-cyan-400/[0.03] text-[#5ee3f2]"
          }`}
        >
          {yours}
        </span>
        <span className="rounded-full border border-white/[0.08] px-2 py-0.5 text-[10px] text-white/40">
          {target}
        </span>
      </div>
      <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${badgeClass}`}>
        {badge === "core" ? "Core" : badge === "preferred" ? "Preferred" : "Nice to have"}
      </span>
    </div>
  );
}

export function LandingPage() {
  return (
    <div className="relative isolate min-h-screen overflow-hidden text-white selection:bg-neon-cyan/20 selection:text-neon-cyan font-sans">
      {/* Top glows sit in a fixed layer so they continue behind the
          transparent header instead of starting below it. */}
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute -left-40 -top-40 size-[500px] rounded-full bg-cyan-500/[0.07] blur-[150px]" />
        <div className="absolute -right-40 top-32 size-[600px] rounded-full bg-purple-600/[0.09] blur-[160px]" />
      </div>
      <div aria-hidden="true" className="pointer-events-none absolute left-1/3 top-[2200px] size-[700px] rounded-full bg-indigo-600/[0.06] blur-[180px]" />

      {/* ------------------------------ Hero ---------------------------------- */}
      <section className="relative mx-auto w-full max-w-7xl px-6 pt-12 pb-20 sm:pt-16 sm:pb-28 lg:pt-16 lg:pb-16">
        <div className="grid grid-cols-1 items-start gap-12 lg:grid-cols-12 lg:gap-8">
          {/* Left Text */}
          <div className="flex flex-col lg:col-span-6 xl:col-span-6">
            <p className="text-[11px] font-mono font-semibold uppercase tracking-[0.2em] text-[#5ee3f2] sm:text-xs">SKILL CLARITY FOR BOTH SIDES</p>

            <h1 className="mt-6 text-4xl font-extrabold tracking-[-0.03em] leading-[1.02] sm:text-5xl lg:text-[68px] xl:text-[76px]">
              <span className="block text-white">Know where you fit.</span>
              <span className="mt-1 block text-white/45">Know who fits the role.</span>
            </h1>

            <p className="mt-6 max-w-xl text-base leading-relaxed text-white/60 sm:text-lg">Get a job readiness score and skills gap analysis for every job. Candidates know what to focus on next. Hiring teams know who to talk to first.</p>

            <div className="mt-8 flex flex-wrap items-center gap-4 sm:mt-10">
              <Link
                href="/auth?returnUrl=/profile"
                className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#623dd6] via-[#8433ae] to-[#be2680] px-7 py-3.5 text-sm font-semibold text-white shadow-xl shadow-purple-950/40 transition-all hover:opacity-95 sm:text-base"
              >
                <span>Check my readiness</span>
                <ArrowRight className="size-4" />
              </Link>

              <Link href="/employer/auth?returnUrl=/jobs/posted" className="rounded-full border border-white/20 bg-white/[0.04] px-7 py-3.5 text-sm font-semibold text-white transition-colors hover:border-white/35 hover:bg-white/[0.08] sm:text-base">
                Hire talent
              </Link>
            </div>
          </div>

          {/* Right live readiness card */}
          <div className="lg:col-span-6 lg:mt-10 xl:col-span-6">
            <div className="rounded-[28px] border border-white/[0.08] bg-[#111327]/90 p-4 shadow-2xl backdrop-blur-xl sm:p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[#c026d3] text-sm font-bold text-[#1c0720]">KM</div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-white">Karthik Menon</p>
                    <p className="truncate text-[11px] text-white/45">Software Engineer · 4 yrs</p>
                  </div>
                </div>
                <div className="hidden shrink-0 text-right sm:block">
                  <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-white/35">Goal</p>
                  <p className="mt-0.5 whitespace-nowrap text-[11px] font-semibold text-white/80">AI Engineer</p>
                </div>
              </div>

              <div className="mt-4 grid gap-2.5 sm:grid-cols-[1.3fr_1fr]">
                <div className="rounded-xl border border-white/[0.08] bg-white/[0.025] p-3.5">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/40">You have</p>
                  <div className="mt-2.5 flex flex-wrap gap-1.5">
                    {["Python", "API design", "AWS", "SQL"].map((skill) => (
                      <span key={skill} className="rounded-full border border-white/[0.1] bg-white/[0.04] px-2.5 py-1 text-[11px] text-white/75">{skill}</span>
                    ))}
                  </div>
                </div>
                <div className="rounded-xl border border-amber-500/30 bg-amber-950/25 p-3.5">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-amber-300/80">Missing</p>
                  <div className="mt-2.5 flex flex-wrap gap-1.5">
                    {["LLM apps", "RAG"].map((skill) => (
                      <span key={skill} className="rounded-full border border-amber-500/30 bg-amber-500/[0.08] px-2.5 py-1 text-[11px] text-amber-200/90">{skill}</span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-2.5 rounded-xl border border-white/[0.08] bg-[#090d20] p-3.5">
                <div className="flex items-end justify-between gap-3">
                  <span className="text-xs font-medium text-white/65">Readiness for AI Engineer jobs</span>
                  <span className="text-2xl font-extrabold text-emerald-400">79%</span>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/[0.08]">
                  <div className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-[#5ee3f2]" style={{ width: "79%" }} />
                </div>
              </div>

              <div className="mt-2.5 flex items-start gap-2 rounded-xl border border-emerald-500/20 bg-emerald-950/20 px-3.5 py-3">
                <ArrowUpRight className="mt-0.5 size-3.5 shrink-0 text-emerald-300" />
                <p className="text-[10px] leading-relaxed text-white/55 sm:text-[11px]">
                  <span className="font-semibold text-white/80">Next step:</span> build one LLM app. It&apos;s asked for in 9 of your 12 closest jobs.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------- Company catalog --------------------------- */}
      <section className="border-t border-white/[0.06] bg-[#090a13]/60 py-20 lg:py-28">
        <div className="mx-auto w-full max-w-7xl px-6">
          <div className="text-center">
            <h2 className="mx-auto max-w-3xl text-3xl font-bold tracking-[-0.02em] text-white sm:text-4xl lg:text-5xl">
              Jobs from the world&apos;s top companies, in one place.
            </h2>
          </div>

          <div className="mt-10 rounded-[28px] border border-white/[0.07] bg-white/[0.015] py-3 sm:mt-14 sm:py-5">
            <div role="region" className="company-marquee-mask space-y-2.5 py-1" aria-label="Popular companies hiring on Qelsa">
              <CompanyMarqueeRow companies={COMPANY_LOGOS_TOP} direction="right" />
              <CompanyMarqueeRow companies={COMPANY_LOGOS_BOTTOM} direction="left" />
            </div>
          </div>

          <div className="mx-auto mt-7 flex max-w-2xl flex-col gap-4 rounded-2xl border border-white/[0.08] bg-[#0b0d18]/75 p-3 sm:flex-row sm:items-center sm:justify-between sm:px-4">
            <div className="flex items-center gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-[#5ee3f2]/25 bg-[#5ee3f2]/[0.07] text-[#5ee3f2]">
                <Briefcase className="size-4" />
              </span>
              <div>
                <p className="text-sm font-bold text-white">10K+ live jobs</p>
                <p className="mt-0.5 text-xs text-white/45">Each one scored for you</p>
              </div>
            </div>
            <Link href="/jobs/all" className="gradient-primary inline-flex h-11 items-center justify-center gap-1.5 rounded-full px-5 text-xs font-bold text-white transition-opacity hover:opacity-90">
              Browse all jobs
              <ArrowRight className="size-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* ----------------------- One Platform, Two Paths ---------------------- */}
      <section className="border-t border-white/[0.06] py-20 lg:py-28">
        <div className="mx-auto w-full max-w-7xl px-6">
          <div className="text-center">
            <p className="text-[11px] font-mono font-semibold uppercase tracking-[0.2em] text-[#5ee3f2] sm:text-xs">ONE PLATFORM, TWO PATHS</p>
            <h2 className="mx-auto mt-4 max-w-4xl text-3xl font-bold tracking-[-0.02em] text-white sm:text-4xl lg:text-[40px]">AI job matching for candidates and hiring teams.</h2>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-8 lg:mt-16 lg:grid-cols-2">
            {/* Card 1: For Candidates */}
            <div className="flex flex-col justify-between rounded-[28px] border border-white/[0.08] bg-[#0d1020]/60 p-6 sm:p-9 backdrop-blur">
              <div>
                <p className="text-[11px] font-mono font-semibold uppercase tracking-wider text-[#5ee3f2]">FOR CANDIDATES</p>
                <h3 className="mt-3 text-2xl font-bold text-white lg:text-[28px]">Know exactly where you stand</h3>
                <p className="mt-2 text-sm leading-relaxed text-white/60">A readiness score for every job you look at, the one skill between you and it, and how to close the gap.</p>

                {/* Candidate visual block */}
                <div className="mt-8 rounded-2xl border border-white/[0.06] bg-[#070913] p-5 sm:p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-[10px] font-mono font-semibold uppercase tracking-wider text-white/40">TARGET ROLE</p>
                      <p className="mt-1 text-base font-bold text-white sm:text-lg">Associate Business Analyst</p>
                    </div>
                    <span className="text-2xl font-extrabold text-emerald-400 font-mono sm:text-3xl">74%</span>
                  </div>

                  <div className="mt-3.5 h-2 w-full overflow-hidden rounded-full bg-white/10">
                    <div className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-[#5ee3f2]" style={{ width: "74%" }} />
                  </div>

                  <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                      <p className="text-[10px] font-mono font-semibold uppercase tracking-wider text-emerald-400">MATCHING SKILLS</p>
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        <span className="rounded-full border border-white/12 bg-white/[0.04] px-2.5 py-1 text-xs text-white/80">Excel</span>
                        <span className="rounded-full border border-white/12 bg-white/[0.04] px-2.5 py-1 text-xs text-white/80">Communication</span>
                        <span className="rounded-full border border-white/12 bg-white/[0.04] px-2.5 py-1 text-xs text-white/80">Presentations</span>
                      </div>
                    </div>

                    <div className="rounded-xl border border-amber-500/25 bg-amber-500/[0.04] p-4">
                      <p className="text-[10px] font-mono font-semibold uppercase tracking-wider text-amber-400">FOCUS NEXT</p>
                      <p className="mt-1.5 text-xs font-bold text-white sm:text-sm">SQL basics</p>
                      <p className="mt-1 text-[10px] leading-snug text-white/50 sm:whitespace-nowrap">Recommended: SQL for beginners · 6h</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <Link href="/candidates" className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#5ee3f2] transition-colors hover:text-white">
                  <span>See how it works for candidates</span>
                  <ArrowRight className="size-4" />
                </Link>
              </div>
            </div>

            {/* Card 2: For Employers */}
            <div className="flex flex-col justify-between rounded-[28px] border border-white/[0.08] bg-[#0d1020]/60 p-6 sm:p-9 backdrop-blur">
              <div>
                <p className="text-[11px] font-mono font-semibold uppercase tracking-wider text-[#d73e9d]">FOR EMPLOYERS</p>
                <h3 className="mt-3 text-2xl font-bold text-white lg:text-[28px]">A ranked shortlist, not a crowded inbox</h3>
                <p className="mt-2 text-sm leading-relaxed text-white/60">Share your job description. Every candidate arrives with a readiness score and a named gap.</p>

                {/* Employers visual block */}
                <div className="mt-8 rounded-2xl border border-white/[0.06] bg-[#070913] p-5 sm:p-6">
                  <div className="flex flex-col gap-2 border-b border-white/[0.06] pb-3 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                      <p className="text-[10px] font-mono font-semibold uppercase tracking-wider text-white/40">RANKED SHORTLIST</p>
                      <p className="mt-1 text-base font-bold text-white sm:text-lg">Associate Business Analyst</p>
                    </div>
                    <span className="text-xs font-medium text-white/50">3 candidates above 70%</span>
                  </div>

                  <div className="mt-4 space-y-2.5">
                    {/* Candidate 1 */}
                    <div className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 sm:p-3.5">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-emerald-500/30 bg-emerald-950/70 text-xs font-bold text-emerald-400">PS</div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold leading-tight text-white sm:text-sm">Priya Sharma</p>
                          <p className="text-[10px] leading-snug text-white/50 sm:text-[11px]">
                            <span className="hidden sm:inline">5 yrs in operations · </span>Gap: SQL basics
                          </p>
                        </div>
                      </div>
                      <span className="font-mono text-sm font-bold text-emerald-400 sm:text-base">81%</span>
                    </div>

                    {/* Candidate 2 */}
                    <div className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 sm:p-3.5">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-teal-500/30 bg-teal-950/70 text-xs font-bold text-teal-400">DO</div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold leading-tight text-white sm:text-sm">Daniel Okafor</p>
                          <p className="text-[10px] leading-snug text-white/50 sm:text-[11px]">
                            <span className="hidden sm:inline">Switching from sales · </span>Gap: Power BI
                          </p>
                        </div>
                      </div>
                      <span className="font-mono text-sm font-bold text-emerald-400 sm:text-base">77%</span>
                    </div>

                    {/* Candidate 3 */}
                    <div className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 sm:p-3.5">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-amber-500/30 bg-amber-950/70 text-xs font-bold text-amber-400">SM</div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold leading-tight text-white sm:text-sm">Sofia Martinez</p>
                          <p className="text-[10px] leading-snug text-white/50 sm:text-[11px]">
                            <span className="hidden sm:inline">Recent graduate · </span>Gaps: SQL, Power BI
                          </p>
                        </div>
                      </div>
                      <span className="font-mono text-sm font-bold text-amber-400 sm:text-base">72%</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <Link href="/employers" className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#5ee3f2] transition-colors hover:text-white">
                  <span>See how it works for hiring teams</span>
                  <ArrowRight className="size-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------------------- Readiness score ------------------------- */}
      <section className="border-t border-white/[0.06] bg-[#080a14]/60 py-20 lg:py-28">
        <div className="mx-auto w-full max-w-7xl px-6">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-16">
            <div className="min-w-0">
              <p className="text-[11px] font-mono font-semibold uppercase tracking-[0.2em] text-[#5ee3f2] sm:text-xs">THE READINESS SCORE</p>
              <h2 className="mt-4 max-w-lg text-3xl font-bold leading-tight tracking-[-0.02em] text-white sm:text-4xl lg:text-5xl">
                Your job readiness score, broken down skill by skill.
              </h2>
              <p className="mt-5 max-w-xl text-sm leading-relaxed text-white/55 sm:text-base">
                For every job, Qelsa shows how your skills, experience and education compare with what the role asks for, skill by skill.
              </p>
              <ul className="mt-8 space-y-5">
                <li className="flex items-start gap-3 text-sm leading-relaxed text-white/60">
                  <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-emerald-400" />
                  <span><span className="font-semibold text-white/80">Where you&apos;re already strong.</span> Skills where you meet or beat the target level.</span>
                </li>
                <li className="flex items-start gap-3 text-sm leading-relaxed text-white/60">
                  <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-amber-400" />
                  <span><span className="font-semibold text-white/80">Skills to close the gap.</span> Your level against the target, marked core or preferred.</span>
                </li>
                <li className="flex items-start gap-3 text-sm leading-relaxed text-white/60">
                  <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-white/30" />
                  <span><span className="font-semibold text-white/80">Not on your resume yet.</span> What the job wants that you haven&apos;t shown.</span>
                </li>
              </ul>
              <Link href="/auth?returnUrl=/profile" className="gradient-primary mt-8 inline-flex h-11 items-center justify-center gap-2 rounded-full px-6 text-sm font-semibold text-white transition-opacity hover:opacity-90">
                See my readiness
                <ArrowRight className="size-4" />
              </Link>
            </div>

            <div className="min-w-0 rounded-[28px] border border-white/[0.08] bg-[#0b0d1b]/90 p-5 shadow-2xl backdrop-blur sm:p-7">
              <div className="flex items-center gap-2">
                <Zap className="size-4 text-white/80" />
                <p className="text-sm font-bold text-white">How you fit this role</p>
              </div>

              <div className="mt-6 grid gap-5 sm:grid-cols-[104px_1fr] sm:items-center">
                <div
                  className="relative mx-auto flex size-24 items-center justify-center rounded-full"
                  style={{ background: "conic-gradient(#f97316 0 76%, rgba(255,255,255,0.08) 76% 100%)" }}
                >
                  <div className="flex size-[76px] flex-col items-center justify-center rounded-full bg-[#0b0d1b]">
                    <span className="text-xl font-extrabold text-white">76%</span>
                    <span className="mt-0.5 text-[9px] font-medium text-white/40">Ready</span>
                  </div>
                </div>
                <div className="space-y-3">
                  {[
                    ["Skills match", "84%", "84%"],
                    ["Experience match", "72%", "72%"],
                    ["Education match", "68%", "68%"],
                  ].map(([label, value, width]) => (
                    <div key={label}>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-white/55">{label}</span>
                        <span className="font-semibold text-[#5ee3f2]">{value}</span>
                      </div>
                      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/[0.08]">
                        <div className="h-full rounded-full bg-[#5ee3f2]" style={{ width }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-7 space-y-5 border-t border-white/[0.07] pt-5">
                <div>
                  <p className="flex items-center gap-2 text-[11px] font-semibold text-white/80">
                    <span className="size-1.5 rounded-full bg-emerald-400" /> Where you&apos;re already strong
                  </p>
                  <div className="mt-1.5">
                    <FitSkillRow skill="TypeScript" yours="You: Advanced" target="Target: Advanced" badge="core" />
                    <FitSkillRow skill="REST APIs" yours="You: Expert" target="Target: Advanced" badge="preferred" />
                  </div>
                </div>

                <div>
                  <p className="flex items-center gap-2 text-[11px] font-semibold text-white/80">
                    <span className="size-1.5 rounded-full bg-amber-400" /> 3 skills to close the gap
                  </p>
                  <div className="mt-1.5">
                    <FitSkillRow skill="React" yours="You: Advanced" target="Target: Expert" badge="core" />
                    <FitSkillRow skill="Accessibility" yours="You: Intermediate" target="Target: Advanced" badge="core" />
                    <FitSkillRow skill="GraphQL" yours="You: Beginner" target="Target: Intermediate" badge="preferred" />
                  </div>
                </div>

                <div>
                  <p className="flex items-center gap-2 text-[11px] font-semibold text-white/80">
                    <span className="size-1.5 rounded-full bg-white/30" /> Not on your resume yet
                  </p>
                  <div className="mt-1.5">
                    <FitSkillRow skill="Docker" yours="Not listed" target="Target: Beginner" badge="nice" />
                    <FitSkillRow skill="AWS" yours="Not listed" target="Target: Intermediate" badge="nice" />
                  </div>
                </div>
              </div>

              <div className="mt-5 flex items-center justify-between gap-3 rounded-xl border border-purple-500/25 bg-gradient-to-r from-purple-600/[0.18] via-purple-600/[0.08] to-transparent px-3.5 py-3">
                <div className="flex min-w-0 items-center gap-2.5">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-purple-500/15 text-purple-300">
                    <Sparkles className="size-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-white/80">Ask Qelsa why</p>
                    <p className="mt-0.5 text-[10px] leading-snug text-white/40">Explains each target level and how to reach it</p>
                  </div>
                </div>
                <ChevronRight className="size-4 shrink-0 text-white/35" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------ Qelsa Agent ---------------------------- */}
      <section className="relative overflow-hidden border-t border-white/[0.06] py-20 lg:py-28">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 top-0 h-[420px] w-[720px] -translate-x-1/2 rounded-full bg-[#5ee3f2]/[0.05] blur-[140px]" />
        </div>

        <div className="relative mx-auto w-full max-w-7xl px-6">
          <div className="text-center">
            <p className="text-[11px] font-mono font-semibold uppercase tracking-[0.2em] text-[#5ee3f2] sm:text-xs">MEET QELSA AGENT</p>
            <h2 className="mx-auto mt-4 max-w-2xl text-3xl font-bold tracking-[-0.02em] text-white sm:text-4xl lg:text-5xl">Your AI career agent. Ask anything, apply ready.</h2>
          </div>
          <div className="mt-6 grid grid-cols-1 items-start gap-12 lg:mt-16 lg:grid-cols-12 lg:gap-12">
            {/* Left copy */}
            <div className="lg:col-span-6">
              <p className="mt-4 max-w-xl text-sm leading-relaxed text-white/55 sm:text-base">
                It knows your profile and your goal, and answers like a senior mentor.
              </p>

              <ul className="mt-6 grid grid-cols-1 gap-x-5 gap-y-3 sm:grid-cols-2">
                {AGENT_HIGHLIGHTS.map((highlight) => (
                  <li key={highlight} className="flex items-start gap-2 text-sm leading-relaxed text-white/70">
                    <Check className="mt-1 size-3 shrink-0 text-[#5ee3f2]" />
                    <span>{highlight}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-8">
                <Link
                  href="/auth?returnUrl=/agent"
                  className="inline-flex items-center whitespace-nowrap rounded-full border border-white/15 bg-white/[0.04] px-6 py-3 text-sm font-semibold text-white transition-colors hover:border-white/30 hover:bg-white/[0.08]"
                >
                  Try Qelsa Agent
                </Link>
              </div>

            </div>

            {/* Right agent preview */}
            <div className="lg:col-span-6">
              <div className="relative overflow-hidden rounded-[24px] border border-white/[0.08] bg-[#10152d]/95 shadow-2xl backdrop-blur-xl">
                <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#4f46e5]">
                      <Sparkles className="size-4 text-white" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-white">Qelsa Agent</p>
                      <p className="mt-0.5 flex items-center gap-1.5 text-[11px] text-emerald-300">
                        <span className="size-1.5 rounded-full bg-emerald-400" />
                        Online
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 p-5 sm:p-6">
                  <div className="ml-auto max-w-[88%] rounded-lg bg-[#29305a] px-3.5 py-2.5 text-[12px] leading-relaxed text-white/75">
                    I&apos;m a BCom graduate looking for my first job. Where do I fit?
                  </div>

                  <div className="max-w-[92%] rounded-lg bg-[#171d3a] px-3.5 py-3 text-[12px] leading-relaxed text-white/60">
                    You&apos;re closest to <span className="font-semibold text-white">Accounts Executive (82)</span>, <span className="font-semibold text-white">Junior Financial Analyst (76)</span> and <span className="font-semibold text-white">Business Analyst (74)</span>. Advanced Excel would lift all three.
                  </div>

                  <div className="ml-auto w-fit rounded-lg bg-[#29305a] px-3.5 py-2.5 text-[11px] text-white/70">
                    Prepare applications for the top 3.
                  </div>

                  <div className="rounded-lg bg-[#171d3a] p-3.5 text-[12px] leading-relaxed text-white/60">
                    Done. Each has a tailored resume and cover letter. Apply on the company site when you&apos;re ready.
                    <div className="mt-3 space-y-1.5">
                      {["Accounts Executive", "Junior Financial Analyst", "Business Analyst"].map((role) => (
                        <div key={role} className="flex items-center justify-between gap-3 rounded-md border border-white/[0.08] bg-[#10152c] px-3 py-2 text-[11px] text-white/75">
                          <span className="truncate">{role}</span>
                          <span className="inline-flex shrink-0 items-center gap-1 font-semibold text-[#5ee3f2]">
                            Apply <ArrowUpRight className="size-3" />
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* -------------------------- Bottom CTA Box --------------------------- */}
      <section className="py-16 sm:py-24">
        <div className="mx-auto w-full max-w-5xl px-6">
          <div className="rounded-[32px] border border-white/[0.08] bg-[#0d1020]/70 p-8 text-center shadow-2xl backdrop-blur sm:p-14 lg:p-16">
            <h2 className="mx-auto max-w-2xl text-3xl font-extrabold tracking-[-0.02em] leading-tight text-white sm:text-4xl lg:text-5xl">See where you stand, or who's ready now.</h2>
            <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-white/60 sm:text-base">Build your profile in minutes, or share a job description and get a ranked shortlist. Free to start.</p>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-4 sm:mt-10">
              <Link
                href="/auth?returnUrl=/profile"
                className="rounded-full bg-gradient-to-r from-[#623dd6] via-[#8433ae] to-[#be2680] px-7 py-3.5 text-sm font-semibold text-white shadow-xl shadow-purple-950/40 transition-opacity hover:opacity-95 sm:text-base"
              >
                Check my readiness
              </Link>
              <Link href="/employer/auth?returnUrl=/jobs/posted" className="rounded-full border border-white/20 bg-white/[0.04] px-7 py-3.5 text-sm font-semibold text-white transition-colors hover:border-white/35 hover:bg-white/[0.08] sm:text-base">
                Hire talent
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------ Footer -------------------------------- */}
      <footer className="border-t border-white/[0.06] bg-[#070913] py-12">
        <div className="mx-auto flex w-full max-w-7xl flex-col items-center justify-between gap-6 px-6 sm:flex-row">
          <div className="flex flex-col items-center sm:items-start">
            <Link href="/" className="flex items-center">
              <QelsaLogo priority className="h-6 w-auto" />
            </Link>
            <p className="mt-2 text-xs text-white/40">Copyright © 2026 Qelsa</p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-white/60 sm:gap-8">
            <Link href="/privacy" className="transition-colors hover:text-white">
              Privacy
            </Link>
            <Link href="/terms" className="transition-colors hover:text-white">
              Terms
            </Link>
            <Link href="/cookies" className="transition-colors hover:text-white">
              Cookies
            </Link>
            <a href="mailto:support@qelsa.com" className="transition-colors hover:text-white">
              Contact
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
