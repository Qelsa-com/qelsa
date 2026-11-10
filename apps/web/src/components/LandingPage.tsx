"use client";

import { QelsaLogo } from "@/components/QelsaLogo";
import { ArrowRight, Briefcase, Check, ChevronDown } from "lucide-react";
import Head from "next/head";
import Link from "next/link";
import { useEffect, useRef, useState, type KeyboardEvent } from "react";

/* -------------------------------------------------------------------------- */
/*  Links + content                                                            */
/* -------------------------------------------------------------------------- */

const JOIN_HREF = "/auth?returnUrl=/profile";
const AGENT_HREF = "/auth?returnUrl=/agent";

type Audience = {
  key: string;
  label: string;
  who: string;
  role: string;
  score: number;
  status: "Ready" | "Almost there";
  next: string;
  skills: Array<{ name: string; level: string; tone: "good" | "warm" }>;
};

const AUDIENCES: Audience[] = [
  {
    key: "students",
    label: "Students",
    who: "A fresher, BCom, aiming for",
    role: "Data Analyst",
    score: 78,
    status: "Ready",
    next: "Add one dashboard project to show Power BI.",
    skills: [
      { name: "Excel", level: "Advanced", tone: "good" },
      { name: "SQL", level: "Intermediate", tone: "good" },
      { name: "Power BI", level: "Beginner", tone: "warm" },
    ],
  },
  {
    key: "early",
    label: "Early Professionals",
    who: "A sales executive, 2 years, aiming for",
    role: "Business Analyst",
    score: 64,
    status: "Almost there",
    next: "Close SQL — it's asked for in most analyst roles.",
    skills: [
      { name: "Excel", level: "Advanced", tone: "good" },
      { name: "Stakeholder management", level: "Advanced", tone: "good" },
      { name: "SQL", level: "Missing", tone: "warm" },
    ],
  },
  {
    key: "experienced",
    label: "Experienced",
    who: "A developer, 4 years, aiming for",
    role: "Senior Frontend Engineer",
    score: 86,
    status: "Ready",
    next: "Add system-design evidence from your last role.",
    skills: [
      { name: "React", level: "Expert", tone: "good" },
      { name: "TypeScript", level: "Advanced", tone: "good" },
      { name: "System design", level: "Intermediate", tone: "good" },
    ],
  },
];

const WORK_ITEMS = [
  { title: "Internship · 6 months", detail: "Excel, SQL" },
  { title: "College project", detail: "Power BI" },
  { title: "Sales executive · 2 years", detail: "Stakeholder management" },
];

const FIT_JOBS = [
  { title: "Business Analyst", ready: true },
  { title: "Data Analyst", ready: true },
  { title: "MIS Executive", ready: true },
  { title: "Sales Ops Analyst", ready: false },
];

const STEPS = [
  "Add your skills and where you used them",
  "Qelsa rates each skill",
  "Get a readiness for every job",
  "See what's holding you back",
];

const AGENT_POINTS = [
  "Explains your score",
  "Finds jobs that fit",
  "Plans your next skills",
  "Tailors your resume",
  "Prepares applications",
];

const FAQS = [
  {
    q: "How much does Qelsa cost?",
    a: (
      <>
        Start on the Free plan. Upgrade to Plus or Pro when you need more Agent time and applications.{" "}
        <Link href="/pricing" className="text-[#00D4FF] underline-offset-2 hover:underline">
          See plans
        </Link>
      </>
    ),
  },
  {
    q: "How is my readiness worked out?",
    a: "Qelsa checks how you've used each skill in your work and projects, rates it from Beginner to Expert, and compares that with what the job needs.",
  },
  {
    q: "I'm a fresher. Will this work for me?",
    a: "Yes. Projects and internships count as evidence, and strong work can earn an Advanced or Expert rating.",
  },
  {
    q: "Is my data safe?",
    a: (
      <>
        Your profile is used to score jobs and match you with roles.{" "}
        <Link href="/privacy" className="text-[#00D4FF] underline-offset-2 hover:underline">
          Read the Privacy Policy
        </Link>
      </>
    ),
  },
];

/* -------------------------------------------------------------------------- */
/*  Company catalog (kept from the existing jobs section)                      */
/* -------------------------------------------------------------------------- */

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
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={
        stage === "icon"
          ? (company.icon ?? `https://cdn.simpleicons.org/${company.slug}/white`)
          : `https://www.google.com/s2/favicons?sz=128&domain=${company.domain}`
      }
      alt=""
      aria-hidden="true"
      width={24}
      height={24}
      loading="lazy"
      decoding="async"
      draggable={false}
      onError={() => setStage((current) => (current === "icon" ? "favicon" : "text"))}
      className={`h-6 w-6 object-contain ${company.invert || stage === "favicon" ? "brightness-0 invert" : ""}`}
    />
  );
}

function CompanyMarqueeRow({ companies, direction }: { companies: Company[]; direction: "right" | "left" }) {
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
              <span className="truncate text-[11px] font-semibold uppercase tracking-[0.06em] text-white/45">{company.name}</span>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Hero — audience tabs + readiness card                                      */
/* -------------------------------------------------------------------------- */

const FOCUS_RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00D4FF] focus-visible:ring-offset-2 focus-visible:ring-offset-[#06060f]";

function HeroReadiness() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [userPicked, setUserPicked] = useState(false);
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

  useEffect(() => {
    if (paused || userPicked) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setInterval(() => setActive((current) => (current + 1) % AUDIENCES.length), 6500);
    return () => window.clearInterval(id);
  }, [paused, userPicked]);

  const select = (index: number) => {
    setActive(index);
    setUserPicked(true);
  };

  const handleTabKey = (event: KeyboardEvent<HTMLDivElement>) => {
    const last = AUDIENCES.length - 1;
    let next: number | null = null;
    if (event.key === "ArrowRight") next = active === last ? 0 : active + 1;
    else if (event.key === "ArrowLeft") next = active === 0 ? last : active - 1;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = last;
    if (next === null) return;
    event.preventDefault();
    select(next);
    tabRefs.current[next]?.focus();
  };

  const current = AUDIENCES[active];

  return (
    <div
      className="w-full max-w-[480px] lg:mx-0"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      <div role="tablist" aria-label="Readiness examples" onKeyDown={handleTabKey} className="flex flex-wrap gap-1 sm:gap-2">
        {AUDIENCES.map((audience, index) => {
          const selected = index === active;
          return (
            <button
              key={audience.key}
              ref={(element) => {
                tabRefs.current[index] = element;
              }}
              id={`readiness-tab-${audience.key}`}
              type="button"
              role="tab"
              aria-selected={selected}
              aria-controls="readiness-panel"
              tabIndex={selected ? 0 : -1}
              onClick={() => select(index)}
              className={`min-h-11 rounded-full border px-2.5 py-2 text-[13px] font-medium transition-colors sm:min-h-9 sm:px-3.5 ${FOCUS_RING} ${
                selected
                  ? "border-[#7c2ff3]/80 bg-[#7c2ff3]/[0.18] text-white"
                  : "border-white/[0.12] text-white/45 hover:border-white/25 hover:text-white/80"
              }`}
            >
              {audience.label}
            </button>
          );
        })}
      </div>

      <div className="relative mt-5">
        <div
          aria-hidden="true"
          className="absolute inset-x-3 bottom-[-10px] top-3 rotate-3 rounded-3xl border border-white/[0.08] bg-white/[0.02]"
        />
        <div
          aria-hidden="true"
          className="absolute inset-x-1.5 bottom-[-6px] top-1.5 rotate-[1.5deg] rounded-3xl border border-white/[0.1] bg-white/[0.03]"
        />

        <div
          id="readiness-panel"
          role="tabpanel"
          aria-labelledby={`readiness-tab-${current.key}`}
          tabIndex={0}
          className={`landing-card-border relative flex min-h-[400px] flex-col overflow-hidden rounded-3xl p-7 shadow-[0_40px_100px_-30px_rgba(124,47,243,0.55)] ${FOCUS_RING}`}
        >
          <span className="absolute right-6 top-6 text-[10px] font-medium text-white/50">Example</span>

          <div key={current.key} className="qelsa-card-in flex flex-1 flex-col gap-5">
          <div className="flex flex-col gap-1.5 pr-14">
            <span className="text-[14px] text-white/60">{current.who}</span>
            <span className="text-[24px] font-semibold leading-tight tracking-[-0.2px]">{current.role}</span>
          </div>

          <div className="flex items-baseline gap-3">
            <span className="text-[56px] font-bold leading-none tracking-[-0.5px]">{current.score}%</span>
            <span
              className={`text-[15px] font-semibold ${
                current.status === "Ready" ? "text-[#40D480]" : "text-[#FFC740]"
              }`}
            >
              {current.status}
            </span>
          </div>

          <div className="relative pt-5">
            <span
              className="absolute left-[70%] top-0 -translate-x-1/2 text-[10px] font-semibold uppercase tracking-[0.08em] text-white/50"
              aria-hidden="true"
            >
              Ready
            </span>
            <div className="h-2 overflow-hidden rounded-full bg-white/[0.08]">
              <div
                className="qelsa-bar-fill h-full rounded-full bg-[linear-gradient(90deg,#7C2FF3,#D73E9D)]"
                style={{ width: `${current.score}%` }}
              />
            </div>
            <span
              aria-hidden="true"
              className="absolute left-[70%] top-[18px] h-4 w-0.5 -translate-x-1/2 rounded-sm bg-white"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {current.skills.map((skill) => (
              <span
                key={skill.name}
                className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.12] bg-white/[0.04] px-2.5 py-1.5 text-[13px] text-white"
              >
                {skill.name}
                <span className={skill.tone === "good" ? "text-[#40D480]" : "text-[#FFC740]"}>{skill.level}</span>
              </span>
            ))}
          </div>

          <div className="mt-auto border-t border-white/[0.08] pt-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-white/45">Next step</p>
            <p className="mt-1 text-[12px] leading-snug text-white/70">{current.next}</p>
          </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Page                                                                       */
/* -------------------------------------------------------------------------- */

export function LandingPage({ homeJobsStat = "20K+" }: { homeJobsStat?: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      videoRef.current?.pause();
    }
  }, []);

  return (
    <div className="font-landing relative isolate overflow-x-clip text-white antialiased selection:bg-[#00D4FF]/20 selection:text-[#00D4FF]">
      <Head>
        <link rel="preload" href="/fonts/inter-latin-var.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
        <link rel="preload" href="/fonts/instrument-serif-regular.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
        <link rel="preload" href="/fonts/instrument-serif-italic.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
      </Head>

      <div aria-hidden="true" className="landing-aurora pointer-events-none absolute inset-x-0 top-0 -z-10 h-[900px]" />

      <main>
        {/* ------------------------------ Hero ---------------------------------- */}
        <section className="mx-auto w-full max-w-[1240px] px-4 pb-12 pt-14 sm:px-6 sm:pb-16 lg:pb-16 lg:pt-24">
          <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,460px)] lg:items-center lg:gap-14">
            <div className="min-w-0">
              <h1 className="font-editorial max-w-[720px] text-balance text-[44px] leading-[0.98] tracking-[-0.02em] sm:text-[60px] lg:text-[78px] xl:text-[84px]">
                Are you <em className="text-[#C4B5FD]">ready</em> for the job you want?
              </h1>
              <div className="mt-7 flex max-w-[500px] gap-4">
                <span
                  aria-hidden="true"
                  className="w-0.5 shrink-0 rounded-full bg-[linear-gradient(180deg,#A78BFA,#F472B6)]"
                />
                <p className="text-pretty text-[19px] leading-relaxed text-white/65 sm:text-[21px]">
                  A readiness score for every job —{" "}
                  <span className="text-white">and the skills to close the gap.</span>
                </p>
              </div>
              <div className="mt-8">
                <Link
                  href={JOIN_HREF}
                  className={`gradient-landing group inline-flex h-12 items-center justify-center gap-2 rounded-full px-6 text-[16px] font-medium text-white transition-opacity hover:opacity-95 ${FOCUS_RING}`}
                >
                  Check my readiness
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                </Link>
              </div>
              <p className="mt-5 flex items-center gap-2 text-[13px] text-white/50">
                <span aria-hidden="true" className="size-1.5 rounded-full bg-[#40D480]" />
                Free to start · No credit card
              </p>
            </div>

            <HeroReadiness />
          </div>
        </section>

        {/* --------------------------- Jobs proof ------------------------------- */}
        <section aria-labelledby="jobs-heading" className="mx-auto w-full max-w-[1240px] px-4 py-14 sm:px-6 lg:py-20">
          <h2
            id="jobs-heading"
            className="font-editorial mx-auto max-w-[820px] text-balance text-center text-[34px] leading-[1.02] tracking-[-0.02em] sm:text-[48px] lg:text-[60px]"
          >
            Jobs from the world&apos;s top companies, in one place.
          </h2>

          <div className="mt-10 rounded-[28px] border border-white/[0.07] bg-white/[0.015] py-3 sm:mt-12 sm:py-5">
            <div role="region" className="company-marquee-mask space-y-2.5 py-1" aria-label="Popular companies hiring on Qelsa">
              <CompanyMarqueeRow companies={COMPANY_LOGOS_TOP} direction="right" />
              <CompanyMarqueeRow companies={COMPANY_LOGOS_BOTTOM} direction="left" />
            </div>
          </div>

          <div className="mx-auto mt-7 flex max-w-2xl flex-col gap-4 rounded-2xl border border-white/[0.08] bg-[#0F0F23] p-3 sm:flex-row sm:items-center sm:justify-between sm:px-4">
            <div className="flex items-center gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-[#00D4FF]/25 bg-[#00D4FF]/[0.07] text-[#00D4FF]">
                <Briefcase className="size-4" aria-hidden="true" />
              </span>
              <div>
                <p className="text-[14px] font-bold text-white">{homeJobsStat} live jobs</p>
                <p className="mt-0.5 text-[12px] text-white/55">Each one scored for you</p>
              </div>
            </div>
            <Link
              href="/jobs/all"
              className={`gradient-landing inline-flex h-11 items-center justify-center gap-1.5 rounded-full px-5 text-[13px] font-semibold text-white transition-opacity hover:opacity-90 ${FOCUS_RING}`}
            >
              Browse all jobs
              <ArrowRight className="size-3.5" aria-hidden="true" />
            </Link>
          </div>
        </section>

        {/* ------------------------- Readiness flow ----------------------------- */}
        <section aria-labelledby="how-heading" className="mx-auto w-full max-w-[1240px] px-4 py-14 sm:px-6 sm:py-20 lg:py-[120px]">
          <h2
            id="how-heading"
            className="font-editorial mx-auto max-w-[760px] text-balance text-center text-[38px] leading-[1.02] tracking-[-0.02em] sm:text-[50px] lg:text-[62px]"
          >
            Know your readiness for every job
          </h2>
          <span
            aria-hidden="true"
            className="mx-auto mt-6 block h-px w-12 bg-[linear-gradient(90deg,transparent,#7C2FF3,#D73E9D,transparent)]"
          />
          <p className="mx-auto mt-5 max-w-[720px] text-balance text-center text-[20px] leading-[1.35] tracking-[-0.2px] text-white/70 sm:text-[24px]">
            Scored against <span className="text-white">every live job</span>, based on the evidence.
          </p>

          <div className="mt-10 grid gap-10 lg:mt-14 lg:grid-cols-[0.65fr_1.35fr] lg:items-center lg:gap-14">
            <div className="min-w-0">
              <div>
                <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-white/50">How it works</p>
                <ol className="mt-2">
                  {STEPS.map((step, index) => (
                    <li key={step} className="flex items-center gap-3.5 py-2 text-[16px] text-white">
                      <span className="grid size-7 shrink-0 place-items-center rounded-full bg-[linear-gradient(135deg,#7C2FF3,#D73E9D)] text-[13px] font-bold text-white">
                        {index + 1}
                      </span>
                      {step}
                    </li>
                  ))}
                </ol>
              </div>
            </div>

            <div
              className="qelsa-reveal landing-diagram-border rounded-[20px] p-6 shadow-[0_30px_80px_-30px_rgba(124,47,243,0.45)] sm:p-8"
              role="img"
              aria-label="Your work goes into Qelsa AI, which rates each skill and shows the jobs you fit"
            >
              <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:gap-0">
                <div className="min-w-0 lg:w-[220px] lg:shrink-0">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-white/50">Your work</p>
                  <div className="mt-2.5 space-y-2.5">
                    {WORK_ITEMS.map((item, index) => (
                      <div
                        key={item.title}
                        className="qelsa-flow-in rounded-xl border border-white/[0.12] bg-white/[0.04] px-3.5 py-3"
                        style={{ animationDelay: `${index * 0.15}s` }}
                      >
                        <p className="text-[14px] font-semibold text-white">{item.title}</p>
                        <p className="mt-0.5 text-[13px] text-white/60">{item.detail}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="qelsa-flow-v lg:hidden">
                  <i />
                </div>
                <div className="qelsa-flow-h mx-3.5 hidden lg:block">
                  <i />
                </div>

                <div className="flex shrink-0 flex-col items-center gap-3 text-center">
                  <div className="qelsa-flow-node grid size-24 place-items-center rounded-full bg-[radial-gradient(circle_at_30%_30%,#9B5CFF,#7C2FF3_45%,#D73E9D)] text-[15px] font-bold tracking-[0.02em] text-white">
                    Qelsa AI
                  </div>
                  <p className="max-w-[130px] text-[13px] leading-snug text-white/70">
                    Rates each skill
                    <br />
                    <span className="text-white/50">Beginner → Expert</span>
                  </p>
                </div>

                <div className="qelsa-flow-v lg:hidden">
                  <i style={{ animationDelay: "1.1s" }} />
                </div>
                <div className="qelsa-flow-h mx-3.5 hidden lg:block">
                  <i style={{ animationDelay: "1.1s" }} />
                </div>

                <div className="min-w-0 lg:w-[200px] lg:shrink-0">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-white/50">Jobs you fit</p>
                  <div className="mt-2.5 space-y-2.5">
                    {FIT_JOBS.map((job, index) => (
                      <div
                        key={job.title}
                        className="qelsa-flow-in flex items-center gap-2.5 rounded-full border border-white/[0.12] bg-white/[0.04] px-3.5 py-2.5 text-[14px] text-white"
                        style={{ animationDelay: `${0.9 + index * 0.15}s` }}
                      >
                        <span
                          className={`size-2 shrink-0 rounded-full ${job.ready ? "bg-[#40D480]" : "bg-[#FFC740]"}`}
                        />
                        {job.title}
                      </div>
                    ))}
                    <p className="qelsa-flow-in pl-1 text-[13px] text-white/50" style={{ animationDelay: "1.5s" }}>
                      + every other job you open
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap justify-center gap-x-5 gap-y-2 border-t border-white/[0.12] pt-4 text-[13px] text-white/60">
                <span className="inline-flex items-center gap-2">
                  <span className="size-2 rounded-full bg-[#40D480]" /> Ready
                </span>
                <span className="inline-flex items-center gap-2">
                  <span className="size-2 rounded-full bg-[#FFC740]" /> Almost there
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* ------------------------------- Agent -------------------------------- */}
        <section aria-labelledby="agent-heading" className="mx-auto w-full max-w-[1240px] px-4 py-14 sm:px-6 sm:py-20 lg:py-[120px]">
          <h2
            id="agent-heading"
            className="font-editorial mx-auto max-w-[760px] text-balance text-center text-[38px] leading-[1.02] tracking-[-0.02em] sm:text-[50px] lg:text-[62px]"
          >
            Meet Qelsa Agent, your AI career guide
          </h2>
          <span
            aria-hidden="true"
            className="mx-auto mt-6 block h-px w-12 bg-[linear-gradient(90deg,transparent,#7C2FF3,#D73E9D,transparent)]"
          />
          <p className="mx-auto mt-5 max-w-[680px] text-balance text-center text-[20px] leading-[1.35] tracking-[-0.2px] text-white/70 sm:text-[24px]">
            Ask anything about <span className="text-white">jobs, skills or your next move.</span>
          </p>

          <div className="mt-10 grid gap-10 lg:mt-14 lg:grid-cols-[1.25fr_0.75fr] lg:items-center lg:gap-16">
            <div className="qelsa-reveal landing-card-border rounded-[20px] p-2 shadow-[0_30px_80px_-30px_rgba(124,47,243,0.45)]">
              <video
                ref={videoRef}
                src="/qelsa-agent-demo.mp4"
                poster="/qelsa-agent-poster.jpg"
                autoPlay
                muted
                loop
                playsInline
                preload="metadata"
                aria-label="Qelsa Agent checking a candidate's fit for a job and preparing their application"
                className="block h-auto w-full rounded-[10px]"
              />
            </div>

            <div className="min-w-0">
              <div>
                <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-white/50">What it does</p>
                <ul className="mt-2">
                  {AGENT_POINTS.map((point) => (
                    <li key={point} className="flex items-center gap-3 py-2 text-[16px] text-white">
                      <Check className="size-[18px] shrink-0 text-[#00D4FF]" strokeWidth={2.5} aria-hidden="true" />
                      {point}
                    </li>
                  ))}
                </ul>
              </div>

              <Link
                href={AGENT_HREF}
                className={`group mt-6 inline-flex min-h-11 items-center gap-2 text-[16px] font-medium text-[#00D4FF] transition-colors hover:text-white ${FOCUS_RING}`}
              >
                Try Qelsa Agent
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </section>

        {/* -------------------------------- FAQ --------------------------------- */}
        <section aria-labelledby="faq-heading" className="mx-auto w-full max-w-[1240px] px-4 py-14 sm:px-6 sm:py-20 lg:py-[120px]">
          <h2
            id="faq-heading"
            className="font-editorial mx-auto max-w-[760px] text-center text-[38px] leading-[1.02] tracking-[-0.02em] sm:text-[50px] lg:text-[62px]"
          >
            Questions
          </h2>

          <div className="mx-auto mt-10 flex max-w-[820px] flex-col gap-3 lg:mt-14">
            {FAQS.map((faq) => (
              <details
                key={faq.q}
                className="group rounded-2xl border border-white/[0.12] bg-white/[0.04] px-6 py-5 transition-colors open:bg-white/[0.05]"
              >
                <summary
                  className={`flex min-h-11 cursor-pointer list-none items-center justify-between gap-4 text-[18px] tracking-[-0.2px] [&::-webkit-details-marker]:hidden ${FOCUS_RING}`}
                >
                  {faq.q}
                  <ChevronDown className="faq-chevron size-5 shrink-0 text-white/50 transition-transform" aria-hidden="true" />
                </summary>
                <p className="mt-3 text-[16px] leading-relaxed text-white/70">{faq.a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* ------------------------------ Closing ------------------------------- */}
        <section aria-label="Get started" className="mx-auto w-full max-w-[1100px] px-4 pb-20 pt-6 sm:px-6 sm:pb-24 lg:pb-[120px]">
          <div className="landing-cta-card rounded-[32px] px-5 py-14 text-center sm:px-12 sm:py-16 lg:py-24">
            <h2 className="font-editorial text-balance text-[44px] leading-[1.02] tracking-[-0.02em] sm:text-[58px] lg:text-[72px]">
              <span className="block">Be ready before you apply.</span>
              <span className="block italic bg-[linear-gradient(90deg,#A78BFA,#F472B6)] bg-clip-text text-transparent">
                Know your readiness.
              </span>
            </h2>
            <div className="mt-8 flex justify-center">
              <Link
                href={JOIN_HREF}
                className={`gradient-landing inline-flex h-12 items-center justify-center rounded-full px-6 text-[16px] font-medium text-white transition-opacity hover:opacity-95 ${FOCUS_RING}`}
              >
                Check my readiness
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* ------------------------------- Footer -------------------------------- */}
      <footer className="border-t border-white/[0.06] bg-[#070913] py-12">
        <div className="mx-auto flex w-full max-w-[1240px] flex-col items-center gap-6 px-4 sm:flex-row sm:px-6 sm:items-center sm:justify-between">
          <div className="flex flex-col items-center sm:items-start">
            <Link href="/" aria-label="Qelsa home" className={`inline-flex min-h-11 items-center ${FOCUS_RING}`}>
              <QelsaLogo className="h-6 w-auto" />
            </Link>
            <p className="text-[12px] text-white/50">Copyright © 2026 Qelsa</p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-1 text-[12px] text-white/60">
            <Link href="/privacy" className={`inline-flex min-h-11 items-center transition-colors hover:text-white ${FOCUS_RING}`}>
              Privacy
            </Link>
            <Link href="/terms" className={`inline-flex min-h-11 items-center transition-colors hover:text-white ${FOCUS_RING}`}>
              Terms
            </Link>
            <Link href="/cookies" className={`inline-flex min-h-11 items-center transition-colors hover:text-white ${FOCUS_RING}`}>
              Cookies
            </Link>
            <a href="mailto:support@qelsa.com" className={`inline-flex min-h-11 items-center transition-colors hover:text-white ${FOCUS_RING}`}>
              Contact
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
