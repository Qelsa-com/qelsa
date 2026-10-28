/**
 * "For candidates" marketing landing page.
 *
 * Figma: for-candidates frame — hero readiness card, career goal + readiness
 * chart, ranked jobs, skill-gap breakdown, the Qelsa Agent, Learn & Practice,
 * and the closing CTA.
 *
 * The page lives inside the app shell so it shares the same scroll-aware header
 * as the rest of the marketing pages.
 */

import { ArrowRight, ArrowUpRight, BookOpen, Check, MessageSquare, Sparkles, Target, type LucideIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

const AUTH_HREF = "/auth?returnUrl=/profile";

const FOOTER_LINKS = [
  { label: "Privacy", href: "/privacy" },
  { label: "Terms", href: "/terms" },
  { label: "Cookies", href: "/cookies" },
];

const HERO = {
  eyebrow: "For job seekers",
  title: ["Know where you fit", "before you apply."],
  body: "Get a job readiness score and skills gap analysis for every job. See what you already have, what's missing, and the one thing to focus on next.",
  cta: "Check my readiness",
};

const PROFILE = {
  initials: "EC",
  name: "Emily Carter",
  role: "Product Analyst",
  best: [
    { skill: "SQL", level: "Expert" },
    { skill: "Tables", level: "Advanced" },
  ],
  missing: [
    { skill: "A/B testing", tone: "amber" as const },
    { skill: "Python", tone: "sky" as const },
  ],
  score: 78,
  nextStep: "Learn A/B testing. It's asked for in 8 of your 10 closest jobs.",
};

const GOAL = {
  eyebrow: "Career goals",
  title: "Set a career goal. Qelsa maps the way there.",
  body: "Say where you want to be in your own words. Qelsa turns it into target roles and a step-by-step plan, then tracks your progress as your readiness grows.",
  points: [
    "Your goal becomes target roles and a timeline",
    "Clear milestones: what to learn, build and apply for",
    "Your readiness tracked month by month",
    "Jobs ranked by how well they fit your goal",
  ],
  quote: "I want to move into product analytics within 6 months.",
  roles: ["Product Analyst", "Growth Analyst"],
  timeline: "6 months",
  plan: [
    { label: "Set up your profile and goal", state: "done" as const },
    { label: "Learn A/B testing", state: "active" as const, progress: 60 },
    { label: "Python basics", state: "todo" as const },
    { label: "Build one experimentation project", state: "todo" as const },
    { label: "Apply to roles where you're 80%+ ready.", state: "todo" as const },
  ],
  target: 85,
  months: [
    { label: "Apr", value: 42 },
    { label: "May", value: 55 },
    { label: "Jun", value: 62 },
    { label: "Jul", value: 68 },
    { label: "Aug", value: 72 },
    { label: "Sep–Oct", value: 78, active: true },
  ],
};

type JobTone = "green" | "amber" | "orange";

const JOB_TONES: Record<JobTone, { border: string; label: string; score: string }> = {
  green: { border: "border-l-emerald-400", label: "text-emerald-400", score: "text-emerald-400" },
  amber: { border: "border-l-amber-400", label: "text-amber-400", score: "text-amber-400" },
  orange: { border: "border-l-orange-400", label: "text-orange-400", score: "text-orange-400" },
};

const JOBS: Array<{
  status: string;
  tone: JobTone;
  score: number;
  role: string;
  company: string;
  meta: string;
  note?: string;
  gaps?: string;
}> = [
  {
    status: "Ready now",
    tone: "green",
    score: 91,
    role: "Data Analyst II",
    company: "Northstar",
    meta: "Hybrid",
    note: "All core skills met",
  },
  {
    status: "Almost there",
    tone: "amber",
    score: 78,
    role: "Product Analyst",
    company: "Lumen",
    meta: "Remote",
    gaps: "A/B testing, Python",
  },
  {
    status: "Stretch",
    tone: "orange",
    score: 64,
    role: "Growth Analyst",
    company: "Cobalt",
    meta: "On-site",
    gaps: "A/B testing, SQL, Marketing analytics",
  },
];

const GAP_GROUPS: Array<{
  tone: "green" | "amber";
  label: string;
  rows: Array<{ skill: string; you?: string; youTone?: "strong" | "gap"; needed: string }>;
}> = [
  {
    tone: "green",
    label: "Already strong",
    rows: [
      { skill: "SQL", you: "You: Advanced", youTone: "strong", needed: "Needed: Advanced" },
      { skill: "Data visualisation", you: "You: Advanced", youTone: "strong", needed: "Needed: Intermediate" },
    ],
  },
  {
    tone: "amber",
    label: "To close the gap",
    rows: [
      { skill: "A/B testing", you: "You: Beginner", youTone: "gap", needed: "Needed: Intermediate" },
      { skill: "Python", needed: "Needed: Beginner" },
    ],
  },
];

const AGENT = {
  eyebrow: "Qelsa Agent",
  titleLines: ["Your AI career agent,", "working toward your goal."],
  body: "Qelsa Agent knows your profile, your goal and your gaps. Ask it anything, or hand it the busywork.",
  capabilities: [
    "Evaluates your score",
    "Tracks your resume",
    "Updates your plan",
    "Writes cover letters",
    "Prepares your applications",
    "Preps you for interviews",
  ],
  footnote: "It prepares everything; you apply on the company's site.",
  messages: [
    { from: "user" as const, text: "Why am I only 78% for Product Analyst?" },
    {
      from: "agent" as const,
      text: "You meet 5 of 7 skills. A/B testing and Python are the gaps. Finishing your A/B testing path should take you to 84%, which puts 6 more jobs in your “ready” list.",
    },
    { from: "user" as const, text: "Tailor my resume for the fintech role." },
    {
      from: "agent" as const,
      text: "Done. I kept your SQL dashboards and the pricing experiment you supported. Nothing goes out until you approve it.",
    },
  ],
};

const PRACTICE = {
  eyebrow: "Learn & practice",
  title: "Learn and practice the skills that move your score.",
  body: "Every lesson and practice set is picked from your gaps, so the time you spend shows up in your readiness.",
};

const CARD = "rounded-2xl border border-white/[0.08] bg-[#0b0d1b]/85";
const INNER_CARD = "rounded-xl border border-white/[0.07] bg-white/[0.025]";
const H2 = "text-[30px] font-bold leading-[1.1] tracking-[-0.03em] text-white sm:text-4xl lg:text-[44px]";
const BODY = "text-sm leading-relaxed text-white/55 sm:text-[15px]";
const PRIMARY_CTA =
  "gradient-primary inline-flex h-11 items-center justify-center gap-2 rounded-full px-6 text-sm font-semibold text-white shadow-lg shadow-purple-950/30 transition-opacity hover:opacity-90";
const SECONDARY_CTA =
  "inline-flex h-11 items-center justify-center rounded-full border border-white/15 bg-white/[0.04] px-6 text-sm font-semibold text-white/80 transition-colors hover:border-white/30 hover:text-white";

function Eyebrow({ children, className = "text-[#5ee3f2]" }: { children: ReactNode; className?: string }) {
  return <p className={`font-mono text-[10px] font-semibold uppercase tracking-[0.18em] sm:text-[11px] ${className}`}>{children}</p>;
}

function SectionHeading({
  eyebrow,
  eyebrowClassName = "text-[#5ee3f2]",
  title,
  sub,
}: {
  eyebrow: string;
  eyebrowClassName?: string;
  title: string;
  sub?: string;
}) {
  return (
    <div className="flex flex-col items-center gap-3 text-center">
      <Eyebrow className={eyebrowClassName}>{eyebrow}</Eyebrow>
      <h2 className={`mx-auto max-w-[720px] ${H2}`}>{title}</h2>
      {sub && <p className={`mx-auto max-w-[620px] ${BODY}`}>{sub}</p>}
    </div>
  );
}

/** Every band shares the content column and vertical rhythm. */
function Section({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`relative mx-auto w-full max-w-7xl px-5 py-16 sm:px-6 lg:py-24 ${className}`}>{children}</section>;
}

function Tick({ className = "text-emerald-400" }: { className?: string }) {
  return <Check aria-hidden="true" className={`mt-0.5 size-4 shrink-0 ${className}`} strokeWidth={2.5} />;
}

function SkillLevel({ children, tone = "neutral" }: { children: ReactNode; tone?: "sky" | "neutral" }) {
  const tones = {
    sky: "border-sky-400/25 bg-sky-400/[0.08] text-sky-300",
    neutral: "border-white/10 bg-white/[0.04] text-white/50",
  };
  return <span className={`shrink-0 rounded-md border px-1.5 py-0.5 text-[9px] font-medium ${tones[tone]}`}>{children}</span>;
}

function HeroCard() {
  return (
    <div className={`min-w-0 ${CARD} p-4 shadow-2xl shadow-black/30 backdrop-blur sm:p-5`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-pink-500 to-orange-400 text-[12px] font-bold text-[#240a17]">
            {PROFILE.initials}
          </span>
          <p className="truncate text-[15px] font-semibold text-white">{PROFILE.name}</p>
        </div>
        <p className="shrink-0 pt-1 text-[10.5px] font-medium text-white/40">{PROFILE.role}</p>
      </div>

      <div className="mt-3 grid grid-cols-[1.35fr_1fr] gap-2 border-t border-white/[0.06] pt-3">
        <div className={`${INNER_CARD} p-3`}>
          <Eyebrow className="text-white/35">Your best</Eyebrow>
          <div className="mt-2 space-y-1.5">
            {PROFILE.best.map((item) => (
              <div key={item.skill} className="flex items-center justify-between gap-2">
                <span className="truncate text-[13px] text-white/80">{item.skill}</span>
                <SkillLevel tone="sky">{item.level}</SkillLevel>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-amber-500/20 bg-amber-500/[0.05] p-3">
          <Eyebrow className="text-amber-300/80">Missing</Eyebrow>
          <div className="mt-2 space-y-1.5">
            {PROFILE.missing.map((item) => (
              <div key={item.skill} className="flex items-center gap-2">
                <span className={`truncate text-[13px] ${item.tone === "amber" ? "text-amber-300" : "text-sky-300"}`}>{item.skill}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-2 rounded-xl border border-white/[0.07] bg-[#090b16] p-3.5">
        <div className="flex items-end justify-between gap-3">
          <p className="text-[12px] font-medium text-white/60">Readiness for Product Analyst jobs</p>
          <span className="text-[26px] font-extrabold leading-none text-emerald-400">{PROFILE.score}%</span>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/[0.08]">
          <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-300" style={{ width: `${PROFILE.score}%` }} />
        </div>
      </div>

      <div className="mt-2 flex items-start gap-2 rounded-xl border-l-2 border-emerald-400/50 bg-emerald-500/[0.06] px-3 py-2.5">
        <ArrowUpRight aria-hidden="true" className="mt-0.5 size-3.5 shrink-0 text-emerald-300" />
        <p className="text-[11px] leading-relaxed text-white/55 sm:text-[11.5px]">
          <span className="font-semibold text-emerald-300">Next step:</span> {PROFILE.nextStep}
        </p>
      </div>
    </div>
  );
}

function GoalChart() {
  return (
    <div className={`${INNER_CARD} p-3.5`}>
      <div className="flex items-center justify-between gap-3">
        <p className="text-[11px] font-medium text-white/55">Readiness for your goal</p>
        <p className="text-[10px] text-white/35">
          Target: <span className="font-medium text-white/60">{GOAL.target}%</span>
        </p>
      </div>

      <div className="mt-3">
        <div className="flex gap-2">
          {GOAL.months.map((month, index) => (
            <span
              key={month.label}
              className={`flex-1 text-center text-[10px] font-medium ${month.active ? "text-emerald-300" : "text-white/35"}`}
            >
              {index >= 2 ? month.value : ""}
            </span>
          ))}
        </div>

        <div className="relative mt-1">
          <div aria-hidden="true" className="absolute inset-x-0 bottom-[85%] border-t border-dashed border-white/15" />
          <div className="flex h-20 items-end gap-2">
            {GOAL.months.map((month) => (
              <div key={month.label} className="flex h-full flex-1 items-end">
                <div
                  className={`w-full rounded-t-[3px] ${month.active ? "bg-emerald-400" : "bg-[#243a5a]"}`}
                  style={{ height: `${month.value}%` }}
                />
              </div>
            ))}
          </div>
        </div>

        <div className="mt-1.5 flex gap-2">
          {GOAL.months.map((month) => (
            <span key={month.label} className="flex-1 truncate text-center text-[9px] text-white/30">
              {month.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function GoalCard() {
  return (
    <div className={`min-w-0 ${CARD} p-4`}>
      <Eyebrow className="text-white/35">Your goal</Eyebrow>
      <div className={`mt-2 ${INNER_CARD} px-3 py-2.5`}>
        <p className="text-[14px] font-medium leading-snug text-white/85">&ldquo;{GOAL.quote}&rdquo;</p>
      </div>

      <div className="mt-3 grid grid-cols-[minmax(0,1fr)_auto] gap-4">
        <div className="min-w-0">
          <Eyebrow className="text-white/35">Target roles</Eyebrow>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {GOAL.roles.map((role, index) => (
              <span
                key={role}
                className={`rounded-md border px-2 py-1 text-[10px] font-medium ${
                  index === 0
                    ? "border-sky-400/30 bg-sky-400/[0.08] text-sky-300"
                    : "border-white/10 bg-white/[0.03] text-white/50"
                }`}
              >
                {role}
              </span>
            ))}
          </div>
        </div>
        <div className="text-right">
          <Eyebrow className="text-white/35">Timeline</Eyebrow>
          <p className="mt-2 text-[12px] font-medium text-white/75">{GOAL.timeline}</p>
        </div>
      </div>

      <div className="mt-4 border-t border-white/[0.06] pt-3.5">
        <Eyebrow className="text-white/35">Your plan</Eyebrow>
        <ul className="mt-2.5 space-y-2.5">
          {GOAL.plan.map((item) => (
            <li key={item.label}>
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2.5">
                  {item.state === "done" ? (
                    <span className="flex size-4 shrink-0 items-center justify-center rounded-full border border-emerald-400/40 bg-emerald-400/15">
                      <Check aria-hidden="true" className="size-2.5 text-emerald-300" strokeWidth={3} />
                    </span>
                  ) : (
                    <span
                      aria-hidden="true"
                      className={`size-4 shrink-0 rounded-full border ${
                        item.state === "active" ? "border-sky-400/60 bg-sky-400/20" : "border-white/20"
                      }`}
                    />
                  )}
                  <span className={`truncate text-[12px] ${item.state === "todo" ? "text-white/50" : "text-white/80"}`}>{item.label}</span>
                </div>
                {item.state === "active" && <span className="shrink-0 text-[10px] text-sky-300">in progress</span>}
              </div>
              {item.state === "active" && item.progress ? (
                <div className="ml-6 mt-1.5 h-1 w-24 overflow-hidden rounded-full bg-white/[0.08]">
                  <div className="h-full rounded-full bg-sky-400" style={{ width: `${item.progress}%` }} />
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-4">
        <GoalChart />
      </div>
    </div>
  );
}

function JobCard({ job }: { job: (typeof JOBS)[number] }) {
  const tone = JOB_TONES[job.tone];

  return (
    <Link
      href="/jobs/all"
      className={`group flex min-w-0 flex-col rounded-xl border border-l-2 border-white/[0.07] bg-white/[0.02] p-5 transition-colors hover:bg-white/[0.04] md:min-h-[210px] ${tone.border}`}
    >
      <div className="flex items-start justify-between gap-3">
        <Eyebrow className={tone.label}>{job.status}</Eyebrow>
        <span className={`text-2xl font-bold leading-none ${tone.score}`}>{job.score}%</span>
      </div>

      <p className="mt-4 text-[15px] font-semibold text-white">{job.role}</p>
      <p className="mt-0.5 text-[11px] text-white/35">
        {job.company} · {job.meta}
      </p>

      <div className="mt-auto border-t border-white/[0.06] pt-3.5">
        {job.note ? (
          <p className="text-[11px] font-medium text-emerald-400">{job.note}</p>
        ) : (
          <p className="text-[11px] text-white/55">
            <span className="text-sky-300">Gaps:</span> {job.gaps}
          </p>
        )}
      </div>
    </Link>
  );
}

function GapCard() {
  return (
    <div className={`mx-auto mt-10 max-w-3xl ${CARD} p-4 sm:mt-12 sm:p-6`}>
      <div className="flex items-center justify-between gap-3 border-b border-white/[0.06] pb-4">
        <p className="text-sm font-semibold text-white">How Emily fits: Product Analyst</p>
        <span className="shrink-0 text-xl font-bold text-emerald-400">78%</span>
      </div>

      <div className="mt-4 space-y-4">
        {GAP_GROUPS.map((group) => (
          <div key={group.label}>
            <div className="flex items-center gap-2">
              <span className={`size-1.5 rounded-full ${group.tone === "green" ? "bg-emerald-400" : "bg-orange-400"}`} />
              <Eyebrow className={group.tone === "green" ? "text-emerald-300" : "text-orange-400"}>{group.label}</Eyebrow>
            </div>

            <div className="mt-1 divide-y divide-white/[0.05]">
              {group.rows.map((row) => (
                <div
                  key={row.skill}
                  className="grid gap-2 py-2.5 sm:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1fr)] sm:items-center sm:gap-3"
                >
                  <span className="text-[12px] font-medium text-white/80">{row.skill}</span>
                  <span>
                    {row.you ? (
                      <span
                        className={`inline-flex rounded-md border px-2 py-0.5 text-[10px] ${
                          row.youTone === "strong"
                            ? "border-emerald-400/25 bg-emerald-400/[0.08] text-emerald-300"
                            : "border-amber-400/25 bg-amber-400/[0.08] text-amber-300"
                        }`}
                      >
                        {row.you}
                      </span>
                    ) : (
                      <span className="text-[10px] text-white/30">Not on your resume</span>
                    )}
                  </span>
                  <span>
                    <span className="inline-flex rounded-md border border-white/10 bg-white/[0.03] px-2 py-0.5 text-[10px] text-white/45">
                      {row.needed}
                    </span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AgentCard() {
  return (
    <div className="min-w-0 overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0d0a19]">
      <div className="flex items-center justify-between gap-3 border-b border-white/[0.06] px-5 py-3.5">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-400 to-cyan-500 text-[#06231c]">
            <Sparkles aria-hidden="true" className="size-4" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-[13px] font-semibold text-white">Qelsa Agent</p>
            <p className="flex items-center gap-1.5 text-[11px] text-emerald-300">
              <span className="size-1.5 rounded-full bg-emerald-400" />
              Online
            </p>
          </div>
        </div>
        <span className="shrink-0 rounded-full border border-emerald-400/20 bg-emerald-400/[0.08] px-2.5 py-1 text-[10px] font-medium text-emerald-300">
          Goal 78% ready
        </span>
      </div>

      <div className="space-y-4 p-5">
        {AGENT.messages.map((message, index) =>
          message.from === "user" ? (
            <div key={index} className="flex justify-end">
              <p className="max-w-[88%] rounded-2xl rounded-br-md bg-[#2b2450] px-4 py-3 text-[12.5px] leading-relaxed text-white/75">
                {message.text}
              </p>
            </div>
          ) : (
            <div key={index} className="flex items-start gap-2.5">
              <span className="gradient-primary mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-md">
                <Sparkles aria-hidden="true" className="size-3.5 text-white" />
              </span>
              <p className="max-w-[90%] rounded-2xl rounded-bl-md border border-white/[0.06] bg-white/[0.03] px-4 py-3 text-[12.5px] leading-relaxed text-white/60">
                {message.text}
              </p>
            </div>
          ),
        )}
      </div>

      <div className="flex flex-wrap gap-2 border-t border-white/[0.06] px-5 py-4">
        <Link href="/auth?returnUrl=/agent" className={PRIMARY_CTA}>
          Update my resume
        </Link>
        <Link href="/auth?returnUrl=/agent" className={SECONDARY_CTA}>
          Write a cover letter
        </Link>
      </div>
    </div>
  );
}

function PracticeCardHeader({ icon: Icon, title, accent, titleClassName }: { icon: LucideIcon; title: string; accent: string; titleClassName: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${accent}`}>
        <Icon aria-hidden="true" className="size-4" />
      </span>
      <h3 className={`text-[15px] font-semibold ${titleClassName}`}>{title}</h3>
    </div>
  );
}

export function ForCandidatesPage() {
  return (
    <div className="relative isolate overflow-hidden text-white">
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute -right-40 -top-64 size-[560px] rounded-full bg-cyan-500/[0.12] blur-[140px]" />
        <div className="absolute -left-56 top-[380px] size-[440px] rounded-full bg-purple-600/[0.12] blur-[140px]" />
      </div>

      {/* Hero */}
      <Section className="lg:pb-24 lg:pt-20">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <div className="flex min-w-0 flex-col items-start">
            <Eyebrow>{HERO.eyebrow}</Eyebrow>
            <h1 className="mt-5 text-[30px] font-extrabold leading-[1.05] tracking-[-0.035em] text-white sm:text-[48px] lg:text-[64px]">
              {HERO.title.map((line) => (
                <span key={line} className="block">
                  {line}
                </span>
              ))}
            </h1>
            <p className={`mt-5 max-w-[470px] ${BODY}`}>{HERO.body}</p>
            <Link href={AUTH_HREF} className={`mt-7 ${PRIMARY_CTA}`}>
              <Sparkles aria-hidden="true" className="size-4" />
              {HERO.cta}
            </Link>
          </div>

          <HeroCard />
        </div>
      </Section>

      {/* Career goal */}
      <div className="border-y border-white/[0.06] bg-[#080810]/60">
        <Section>
          <div className="grid items-start gap-12 lg:grid-cols-2 lg:gap-16">
            <div className="min-w-0 lg:pt-2">
              <Eyebrow>{GOAL.eyebrow}</Eyebrow>
              <h2 className={`mt-4 max-w-[480px] ${H2}`}>{GOAL.title}</h2>
              <p className={`mt-5 max-w-[470px] ${BODY}`}>{GOAL.body}</p>

              <ul className="mt-7 space-y-3">
                {GOAL.points.map((point) => (
                  <li key={point} className="flex items-start gap-3 text-[13px] text-white/60 sm:text-sm">
                    <Tick />
                    {point}
                  </li>
                ))}
              </ul>
            </div>

            <GoalCard />
          </div>
        </Section>
      </div>

      {/* Ranked jobs */}
      <div className="border-b border-white/[0.06] bg-[#0a0b13]/80">
        <Section>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <Eyebrow className="text-emerald-400">Jobs ranked for you</Eyebrow>
              <h2 className={`mt-3 ${H2}`}>Apply where you&apos;re ready.</h2>
              <p className={`mt-3 max-w-[520px] ${BODY}`}>Live jobs ranked by your readiness, so your best chances come first.</p>
            </div>
            <Link href="/jobs/all" className="inline-flex shrink-0 items-center gap-1.5 text-[13px] font-semibold text-[#5ee3f2] transition-colors hover:text-white">
              Browse all jobs
              <ArrowRight aria-hidden="true" className="size-4" />
            </Link>
          </div>

          <div className="mt-8 grid gap-3 md:grid-cols-3 lg:mt-10">
            {JOBS.map((job) => (
              <JobCard key={job.role} job={job} />
            ))}
          </div>
        </Section>
      </div>

      {/* Skill gaps */}
      <Section>
        <SectionHeading
          eyebrow="Skills gap analysis"
          eyebrowClassName="text-orange-400"
          title="See exactly which skills close the gap."
          sub="Your level against what each job asks for, skill by skill. No guessing what to learn next."
        />
        <GapCard />
      </Section>

      {/* Qelsa Agent */}
      <div className="border-y border-white/[0.06] bg-[#080810]/60">
        <Section>
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
            <div className="flex min-w-0 flex-col lg:pt-2">
              <Eyebrow>{AGENT.eyebrow}</Eyebrow>
              <h2 className={`mt-4 max-w-[560px] ${H2}`}>
                {AGENT.titleLines.map((line) => (
                  <span key={line} className="block">
                    {line}
                  </span>
                ))}
              </h2>
              <p className={`mt-5 max-w-[470px] ${BODY}`}>{AGENT.body}</p>

              <ul className="mt-7 grid gap-x-6 gap-y-3 sm:grid-cols-2">
                {AGENT.capabilities.map((capability) => (
                  <li key={capability} className="flex items-start gap-2.5 text-[13px] text-white/60">
                    <Tick />
                    {capability}
                  </li>
                ))}
              </ul>

              <p className="mt-6 text-[11px] text-white/35 lg:mt-auto lg:pt-8">{AGENT.footnote}</p>
            </div>

            <AgentCard />
          </div>
        </Section>
      </div>

      {/* Learn & practice */}
      <Section>
        <SectionHeading eyebrow={PRACTICE.eyebrow} title={PRACTICE.title} sub={PRACTICE.body} />

        <div className="mt-10 grid gap-4 md:grid-cols-3">
          <div className={`min-w-0 ${CARD} flex flex-col p-5 md:min-h-[240px]`}>
            <PracticeCardHeader icon={BookOpen} title="Learning paths" accent="bg-emerald-400/10 text-emerald-400" titleClassName="text-emerald-400" />
            <p className="mt-3 text-[12px] leading-relaxed text-white/45">A short path for the skill that matters most to your goal. Not a list of 40 courses.</p>

            <div className="mt-auto border-t border-white/[0.06] pt-4">
              <p className="text-[11px] font-medium text-white/75">A/B testing fundamentals</p>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/[0.08]">
                <div className="h-full w-3/4 rounded-full bg-gradient-to-r from-sky-400 to-emerald-400" />
              </div>
              <p className="mt-1.5 text-[10px] text-white/35">6 of 8 lessons · 1h 20m left</p>
            </div>
          </div>

          <div className={`min-w-0 ${CARD} flex flex-col p-5 md:min-h-[240px]`}>
            <PracticeCardHeader icon={Target} title="Practice sets" accent="bg-amber-400/10 text-amber-400" titleClassName="text-amber-400" />
            <p className="mt-3 text-[12px] leading-relaxed text-white/45">Hands-on questions for the skills each job asks for. See where you stand before an employer does.</p>

            <div className="mt-auto border-t border-white/[0.06] pt-4">
              <div className="flex items-end justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-[11px] font-medium text-white/75">SQL for product analysts</p>
                  <p className="mt-0.5 text-[10px] text-white/35">12 questions · Self-paced</p>
                </div>
                <span className="shrink-0 text-lg font-bold text-emerald-400">8/10</span>
              </div>
            </div>
          </div>

          <div className={`min-w-0 ${CARD} flex flex-col p-5 md:min-h-[240px]`}>
            <PracticeCardHeader icon={MessageSquare} title="Mock interviews" accent="bg-purple-400/10 text-purple-400" titleClassName="text-purple-400" />
            <p className="mt-3 text-[12px] leading-relaxed text-white/45">Answer real interview questions for your target role in writing, and get feedback on every answer.</p>

            <div className="mt-auto border-t border-white/[0.06] pt-4">
              <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-2.5">
                <p className="text-[11px] leading-relaxed text-white/55">
                  {/* A sample prompt, not a live question. */}
                  You&apos;re the Product Analyst. How would you measure the success of a new checkout flow?
                </p>
              </div>
              <div className="mt-2 flex items-center justify-between gap-2 rounded-lg border border-white/[0.08] bg-white/[0.03] px-2.5 py-2">
                <span className="truncate text-[10px] text-white/30">Write your answer…</span>
                <span className="shrink-0 rounded-full bg-emerald-400/15 px-2 py-0.5 text-[9px] font-semibold text-emerald-300">Start</span>
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* Closing CTA */}
      <Section className="pb-14 pt-4 lg:pb-20 lg:pt-6">
        <div className="relative overflow-hidden rounded-[28px] border border-white/[0.08] bg-[#0b0c18] px-6 py-12 text-center shadow-2xl shadow-black/20 sm:px-10 lg:py-16">
          <div aria-hidden="true" className="pointer-events-none absolute -bottom-32 left-1/4 size-72 rounded-full bg-purple-600/20 blur-[100px]" />
          <div aria-hidden="true" className="pointer-events-none absolute -right-16 top-0 size-64 rounded-full bg-pink-600/10 blur-[100px]" />

          <div className="relative">
            <h2 className={`mx-auto max-w-[560px] text-[30px] font-extrabold leading-[1.08] tracking-[-0.03em] text-white sm:text-[38px] lg:text-[46px]`}>
              See where you stand in a few minutes.
            </h2>
            <p className={`mx-auto mt-4 max-w-[460px] ${BODY}`}>Build your profile once. Get your readiness for every job after that. Free to start.</p>
            <Link href={AUTH_HREF} className={`mt-7 ${PRIMARY_CTA}`}>
              <Sparkles aria-hidden="true" className="size-4" />
              {HERO.cta}
            </Link>
          </div>
        </div>
      </Section>

      <footer className="relative border-t border-white/[0.06]">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-5 px-5 py-7 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center" aria-label="Qelsa home">
              <Image src="/qelsa-logo.svg" alt="Qelsa" width={91} height={29} unoptimized className="h-[22px] w-auto" />
            </Link>
            <span className="text-[11px] text-white/30">Copyright © {new Date().getFullYear()} Qelsa</span>
          </div>

          <div className="flex flex-wrap items-center gap-5 text-[11px] text-white/45 sm:gap-7">
            {FOOTER_LINKS.map((link) => (
              <Link key={link.label} href={link.href} className="transition-colors hover:text-white/80">
                {link.label}
              </Link>
            ))}
            <a href="mailto:support@qelsa.com" className="transition-colors hover:text-white/80">
              Contact
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
