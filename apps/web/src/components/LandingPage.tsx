"use client";

import { QelsaLogo } from "@/components/QelsaLogo";
import { ArrowRight, BarChart3, Briefcase, Check, ChevronRight, ShieldCheck, Sparkles, TriangleAlert, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

const AGENT_HIGHLIGHTS = [
  "Build your profile",
  "Explain your score",
  "Find jobs that fit",
  "Plan next steps",
  "Check and tailor resumes",
  "Write cover letters",
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
      <section className="relative mx-auto w-full max-w-7xl px-6 pt-12 pb-20 sm:pt-16 sm:pb-28 lg:pt-16 lg:pb-28">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-8">
          {/* Left Text */}
          <div className="flex flex-col lg:col-span-6 xl:col-span-6">
            <p className="text-[11px] font-mono font-semibold uppercase tracking-[0.2em] text-[#5ee3f2] sm:text-xs">SKILL CLARITY FOR BOTH SIDES</p>

            <h1 className="mt-6 text-4xl font-extrabold tracking-[-0.03em] leading-[1.05] sm:text-5xl lg:text-[62px]">
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
          <div className="lg:col-span-6 xl:col-span-6">
            <div className="rounded-[28px] border border-white/[0.08] bg-[#0d1020]/80 p-5 shadow-2xl backdrop-blur-xl sm:p-7">
              <div className="rounded-2xl border border-white/[0.08] bg-[#090b15]/90 p-4 sm:p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-purple-400/25 bg-gradient-to-br from-purple-600/40 to-pink-600/30 text-sm font-bold text-purple-200">KM</div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-white">Karthik Menon</p>
                      <p className="truncate text-xs text-white/50">AI Engineer</p>
                    </div>
                  </div>
                  <span className="hidden whitespace-nowrap rounded-full border border-white/[0.1] bg-white/[0.04] px-2.5 py-1 text-[10px] font-semibold text-white/55 sm:inline-flex">AI Engineer</span>
                </div>

                <div className="mt-5 grid gap-4 sm:grid-cols-[1.15fr_0.85fr]">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/35">Your skills</p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {["Python", "API design", "AWS", "SQL"].map((skill) => (
                        <span key={skill} className="rounded-md border border-white/[0.1] bg-white/[0.04] px-2 py-1 text-[11px] text-white/75">{skill}</span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-amber-300/70">Missing</p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {["LLM apps", "RAG"].map((skill) => (
                        <span key={skill} className="rounded-md border border-amber-400/20 bg-amber-400/[0.06] px-2 py-1 text-[11px] text-amber-200/80">{skill}</span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-5 rounded-xl border border-white/[0.08] bg-white/[0.025] p-4">
                  <div className="flex items-end justify-between gap-3">
                    <span className="text-xs font-medium text-white/65">Readiness for AI Engineer job</span>
                    <span className="text-2xl font-extrabold text-emerald-300">79%</span>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/[0.08]">
                    <div className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-[#5ee3f2]" style={{ width: "79%" }} />
                  </div>
                  <p className="mt-3 flex items-start gap-1.5 text-[11px] leading-relaxed text-white/45">
                    <ArrowRight className="mt-0.5 size-3 shrink-0 text-emerald-300" />
                    <span><span className="font-semibold text-white/70">Next step:</span> build one LLM app; it&apos;s asked for in 9 of your 12 closest jobs.</span>
                  </p>
                </div>
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
            <h2 className="mx-auto mt-4 max-w-3xl text-3xl font-bold tracking-[-0.02em] text-white sm:text-4xl lg:text-5xl">One platform. Two paths.</h2>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-8 lg:mt-16 lg:grid-cols-2">
            {/* Card 1: For Candidates */}
            <div className="flex flex-col justify-between rounded-[28px] border border-white/[0.08] bg-[#0d1020]/60 p-6 sm:p-9 backdrop-blur">
              <div>
                <p className="text-[11px] font-mono font-semibold uppercase tracking-wider text-[#5ee3f2]">FOR CANDIDATES</p>
                <h3 className="mt-3 text-2xl font-bold text-white sm:text-3xl">Know exactly where you stand</h3>
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
                        <span className="rounded-full border border-white/12 bg-white/[0.04] px-2.5 py-1 text-xs text-white/80">Presentation</span>
                      </div>
                    </div>

                    <div className="rounded-xl border border-amber-500/25 bg-amber-500/[0.04] p-4">
                      <p className="text-[10px] font-mono font-semibold uppercase tracking-wider text-amber-400">FOCUS NEXT</p>
                      <p className="mt-1.5 text-xs font-bold text-white sm:text-sm">SQL basics</p>
                      <p className="mt-1 text-[11px] text-white/50">Recommended: SQL for business analysis</p>
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
                <h3 className="mt-3 text-2xl font-bold text-white sm:text-3xl">A ranked shortlist, not a crowded inbox</h3>
                <p className="mt-2 text-sm leading-relaxed text-white/60">Share your job description. Every candidate arrives with a readiness score and a ranked gap.</p>

                {/* Employers visual block */}
                <div className="mt-8 rounded-2xl border border-white/[0.06] bg-[#070913] p-5 sm:p-6">
                  <div className="flex items-end justify-between border-b border-white/[0.06] pb-3">
                    <div>
                      <p className="text-[10px] font-mono font-semibold uppercase tracking-wider text-white/40">RANKED SHORTLIST</p>
                      <p className="mt-1 text-base font-bold text-white sm:text-lg">Associate Business Analyst</p>
                    </div>
                    <span className="text-xs font-medium text-white/50">Ranked by readiness</span>
                  </div>

                  <div className="mt-4 space-y-2.5">
                    {/* Candidate 1 */}
                    <div className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 sm:p-3.5">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-emerald-500/30 bg-emerald-950/70 text-xs font-bold text-emerald-400">PS</div>
                        <div className="min-w-0">
                          <p className="truncate text-xs font-semibold text-white sm:text-sm">Priya Sharma</p>
                          <p className="truncate text-[11px] text-white/50">Gap: SQL basics</p>
                        </div>
                      </div>
                      <span className="font-mono text-sm font-bold text-emerald-400 sm:text-base">81%</span>
                    </div>

                    {/* Candidate 2 */}
                    <div className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 sm:p-3.5">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-teal-500/30 bg-teal-950/70 text-xs font-bold text-teal-400">DO</div>
                        <div className="min-w-0">
                          <p className="truncate text-xs font-semibold text-white sm:text-sm">Daniel Okafor</p>
                          <p className="truncate text-[11px] text-white/50">Gap: analytics</p>
                        </div>
                      </div>
                      <span className="font-mono text-sm font-bold text-emerald-400 sm:text-base">77%</span>
                    </div>

                    {/* Candidate 3 */}
                    <div className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 sm:p-3.5">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-amber-500/30 bg-amber-950/70 text-xs font-bold text-amber-400">SM</div>
                        <div className="min-w-0">
                          <p className="truncate text-xs font-semibold text-white sm:text-sm">Sofia Martinez</p>
                          <p className="truncate text-[11px] text-white/50">Gaps: Excel, SQL</p>
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
          <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
            <div>
              <p className="text-[11px] font-mono font-semibold uppercase tracking-[0.2em] text-[#5ee3f2] sm:text-xs">THE READINESS SCORE</p>
              <h2 className="mt-4 max-w-xl text-3xl font-bold leading-tight tracking-[-0.02em] text-white sm:text-4xl lg:text-5xl">
                Your job readiness score, broken down skill by skill.
              </h2>
              <p className="mt-5 max-w-xl text-sm leading-relaxed text-white/55 sm:text-base">
                For every job, Qelsa shows how your skills, experience and education compare with what the role asks for, skill by skill.
              </p>
              <ul className="mt-8 space-y-5">
                <li className="flex items-start gap-3 text-sm leading-relaxed text-white/60">
                  <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border border-emerald-400/25 bg-emerald-400/[0.08] text-emerald-300"><Check className="size-3" /></span>
                  <span><span className="font-semibold text-white/80">Where you&apos;re already strong.</span> Skills you meet or beat the target level.</span>
                </li>
                <li className="flex items-start gap-3 text-sm leading-relaxed text-white/60">
                  <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border border-amber-400/25 bg-amber-400/[0.08] text-amber-300"><TriangleAlert className="size-3" /></span>
                  <span><span className="font-semibold text-white/80">Skills to close the gap.</span> Your level against the target, marked core or preferred.</span>
                </li>
                <li className="flex items-start gap-3 text-sm leading-relaxed text-white/60">
                  <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border border-rose-400/25 bg-rose-400/[0.08] text-rose-300"><X className="size-3" /></span>
                  <span><span className="font-semibold text-white/80">Not on your resume yet.</span> What the job wants that you haven&apos;t shown.</span>
                </li>
              </ul>
              <Link href="/auth?returnUrl=/profile" className="gradient-primary mt-8 inline-flex h-11 items-center justify-center gap-2 rounded-full px-6 text-sm font-semibold text-white transition-opacity hover:opacity-90">
                See my readiness
                <ArrowRight className="size-4" />
              </Link>
            </div>

            <div className="rounded-[28px] border border-white/[0.08] bg-[#0d1020]/70 p-5 shadow-2xl backdrop-blur sm:p-7">
              <div className="flex items-center gap-2">
                <BarChart3 className="size-4 text-[#5ee3f2]" />
                <p className="text-sm font-bold text-white">How you fit this role</p>
              </div>

              <div className="mt-6 grid gap-5 sm:grid-cols-[112px_1fr] sm:items-center">
                <div className="relative mx-auto flex size-24 items-center justify-center rounded-full" style={{ background: "conic-gradient(#5ee3f2 0 78%, rgba(255,255,255,0.08) 78% 100%)" }}>
                  <div className="flex size-[78px] flex-col items-center justify-center rounded-full bg-[#0d1020]">
                    <span className="text-xl font-extrabold text-[#5ee3f2]">78%</span>
                    <span className="mt-0.5 text-[9px] font-medium uppercase tracking-[0.12em] text-white/35">Fit score</span>
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
                        <span className="font-semibold text-white/80">{value}</span>
                      </div>
                      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/[0.08]">
                        <div className="h-full rounded-full bg-gradient-to-r from-[#5ee3f2] to-neon-purple" style={{ width }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-7 grid gap-4 border-t border-white/[0.07] pt-5 sm:grid-cols-2">
                <div>
                  <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-emerald-300"><Check className="size-3" /> Where you&apos;re already strong</p>
                  <div className="mt-2.5 space-y-2">
                    {[["TypeScript", "Advanced"], ["REST APIs", "Advanced"]].map(([skill, level]) => (
                      <div key={skill} className="flex items-center justify-between rounded-lg border border-white/[0.06] bg-white/[0.025] px-2.5 py-2 text-xs">
                        <span className="text-white/75">{skill}</span>
                        <span className="text-[10px] text-white/35">{level}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-amber-300"><TriangleAlert className="size-3" /> 3 skills to close the gap</p>
                  <div className="mt-2.5 space-y-2">
                    {[["React", "Core"], ["Accessibility", "Core"], ["GraphQL", "Preferred"]].map(([skill, type]) => (
                      <div key={skill} className="flex items-center justify-between rounded-lg border border-amber-400/[0.12] bg-amber-400/[0.035] px-2.5 py-2 text-xs">
                        <span className="text-white/75">{skill}</span>
                        <span className="text-[10px] text-amber-200/70">{type}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-5">
                <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-white/35"><X className="size-3" /> Not on your resume yet</p>
                <div className="mt-2.5 grid grid-cols-2 gap-2">
                  {["Docker", "AWS"].map((skill) => (
                    <div key={skill} className="flex items-center justify-between rounded-lg border border-white/[0.06] bg-white/[0.02] px-2.5 py-2 text-xs">
                      <span className="text-white/55">{skill}</span>
                      <span className="text-[10px] text-[#5ee3f2]">How to level</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-5 flex items-center justify-between gap-3 rounded-xl border border-[#5ee3f2]/15 bg-[#5ee3f2]/[0.04] px-3.5 py-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="size-4 text-[#5ee3f2]" />
                  <span className="text-xs font-semibold text-white/80">Ask Qelsa why</span>
                </div>
                <ChevronRight className="size-4 text-white/35" />
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
            <h2 className="mx-auto mt-4 max-w-3xl text-3xl font-bold tracking-[-0.02em] text-white sm:text-4xl lg:text-5xl">Your AI career agent. Ask anything, apply ready.</h2>
          </div>
          <div className="mt-6 grid grid-cols-1 items-start gap-12 lg:mt-16 lg:grid-cols-12 lg:gap-12">
            {/* Left copy */}
            <div className="lg:col-span-5">
              <p className="mt-4 max-w-xl text-sm leading-relaxed text-white/55 sm:text-base">
                It knows your profile and your goal, and answers like a senior mentor. Build your profile, understand your score, find jobs that fit, and prepare every application with one thread.
              </p>

              <ul className="mt-6 grid grid-cols-1 gap-x-5 gap-y-3 sm:grid-cols-2">
                {AGENT_HIGHLIGHTS.map((highlight) => (
                  <li key={highlight} className="flex items-start gap-2.5 text-sm leading-relaxed text-white/70">
                    <span className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border border-[#5ee3f2]/30 bg-[#5ee3f2]/[0.08]">
                      <Check className="size-2.5 text-[#5ee3f2]" />
                    </span>
                    <span>{highlight}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-8 flex flex-col items-start gap-3">
                <Link
                  href="/auth?returnUrl=/agent"
                  className="inline-flex items-center gap-2 whitespace-nowrap rounded-full bg-gradient-to-r from-[#623dd6] via-[#8433ae] to-[#be2680] px-7 py-3.5 text-sm font-semibold text-white shadow-xl shadow-purple-950/40 transition-all hover:opacity-95 sm:text-base"
                >
                  <Sparkles className="size-4" />
                  <span>Try Qelsa Agent</span>
                  <ArrowRight className="size-4" />
                </Link>
                <span className="text-xs leading-relaxed text-white/40">Your agent picks up right after you sign in.</span>
              </div>

            </div>

            {/* Right agent preview */}
            <div className="lg:col-span-7">
              <div className="relative">
                <div aria-hidden="true" className="absolute -inset-3 rounded-[36px] bg-gradient-to-br from-[#5ee3f2]/10 via-purple-600/10 to-pink-600/10 blur-2xl" />

                <div className="relative overflow-hidden rounded-[28px] border border-white/[0.08] bg-[#0d1020]/85 shadow-2xl backdrop-blur-xl">
                  <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-neon-cyan via-neon-purple to-neon-pink shadow-lg shadow-purple-900/30">
                        <Sparkles className="size-4 text-black" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-white">Qelsa Agent</p>
                        <p className="truncate text-[11px] text-white/45">Working with your verified profile</p>
                      </div>
                    </div>
                    <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/[0.06] px-2.5 py-1 text-[10px] font-medium text-emerald-300">
                      <span className="size-1.5 rounded-full bg-emerald-400" />
                      Ready
                    </span>
                  </div>

                  <div className="space-y-4 p-5 sm:p-6">
                    <div className="ml-auto max-w-[85%] rounded-2xl rounded-br-md border border-white/[0.06] bg-white/[0.06] px-4 py-3 text-sm text-white/80">I'm a BCom graduate looking for my first job. Where do I start?</div>

                    <div className="max-w-[92%] space-y-3">
                      <p className="text-sm leading-relaxed text-white/60">
                        You're close to <span className="font-semibold text-white">Accounts Executive (82%)</span>, <span className="font-semibold text-white">Junior Financial Analyst (76%)</span> and <span className="font-semibold text-white">Business Analyst (74%)</span>. Advanced Excel would lift all three.
                      </p>

                      <div className="rounded-2xl border border-white/[0.08] bg-[#070913] p-3.5">
                        <p className="px-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/35">Your top 3 matches</p>
                        <div className="mt-2 divide-y divide-white/[0.06]">
                          {[
                            { role: "Accounts Executive", company: "Meridian Finance", score: "82%" },
                            { role: "Junior Financial Analyst", company: "Northstar", score: "76%" },
                            { role: "Business Analyst", company: "Lattice Labs", score: "74%" },
                          ].map((job) => (
                            <div key={job.role} className="flex items-center justify-between gap-3 py-2.5">
                              <div className="min-w-0">
                                <p className="truncate text-xs font-semibold text-white">{job.role}</p>
                                <p className="mt-0.5 truncate text-[11px] text-white/45">{job.company}</p>
                              </div>
                              <div className="flex shrink-0 items-center gap-2.5">
                                <span className="font-mono text-[11px] font-bold text-emerald-300">{job.score}</span>
                                <span className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-[#5ee3f2]">
                                  Apply <ArrowRight className="size-3" />
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="rounded-2xl border border-[#5ee3f2]/20 bg-[#5ee3f2]/[0.04] p-4">
                        <div className="flex items-center gap-2">
                          <ShieldCheck className="size-4 shrink-0 text-[#5ee3f2]" />
                          <p className="text-xs font-semibold text-white">Prepare applications for the top 3</p>
                        </div>
                        <p className="mt-1.5 text-xs leading-relaxed text-white/50">Done. Each has a tailored resume and cover letter. Apply on the company site when you're ready.</p>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-white/[0.06] px-5 py-3">
                    <div className="flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.02] px-3 py-2.5">
                      <span className="text-xs text-white/30">Ask Qelsa Agent anything…</span>
                      <span className="ml-auto flex size-6 items-center justify-center rounded-lg bg-gradient-to-br from-[#623dd6] to-[#be2680]">
                        <ArrowRight className="size-3.5 text-white" />
                      </span>
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
