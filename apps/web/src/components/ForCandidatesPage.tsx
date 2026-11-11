import { ClosingCta, MARKETING_FOCUS, MARKETING_SECTION, MarketingPage, PANEL, PRIMARY_CTA, SECONDARY_CTA, SectionIntro } from "@/components/marketing/MarketingPage";
import { ArrowRight, BookOpen, Check, Sparkles } from "lucide-react";
import Link from "next/link";

/**
 * /candidates — the candidate deep-dive.
 *
 * The home page introduces the product; this page answers the next questions:
 * what the score is made of, how a goal becomes a plan, and what each job
 * verdict looks like.
 */

const AUTH_HREF = "/auth?returnUrl=/profile";
const AGENT_HREF = "/auth?returnUrl=/agent";

const FIT = {
  role: "Product Analyst",
  company: "Lumen",
  score: 78,
  status: "Ready",
  strong: [
    { name: "SQL", level: "Expert", tone: "good" as const },
    { name: "Tables", level: "Advanced", tone: "good" as const },
  ],
  missing: ["A/B testing", "Python"],
  next: "Learn A/B testing — 8 of your 10 closest jobs ask for it.",
};

const BREAKDOWN = [
  { label: "Skills match", value: 84 },
  { label: "Relevant experience", value: 72 },
];

const GAP_GROUPS = [
  {
    tone: "good" as const,
    label: "Already strong",
    rows: [
      { skill: "SQL", you: "You: Advanced", needed: "Needed: Advanced" },
      { skill: "Data visualisation", you: "You: Advanced", needed: "Needed: Intermediate" },
    ],
  },
  {
    tone: "warm" as const,
    label: "To close the gap",
    rows: [
      { skill: "A/B testing", you: "You: Beginner", needed: "Needed: Intermediate" },
      { skill: "Python", you: "Not listed", needed: "Needed: Beginner" },
    ],
  },
];

type PlanStep = { label: string; state: "done" | "active" | "todo"; progress?: number };
type MonthPoint = { label: string; value: number; active?: boolean };

const GOAL: {
  quote: string;
  roles: string[];
  timeline: string;
  plan: PlanStep[];
  months: MonthPoint[];
} = {
  quote: "I want to move into product analytics within 6 months.",
  roles: ["Product Analyst", "Growth Analyst"],
  timeline: "6 months",
  plan: [
    { label: "Set up your profile and goal", state: "done" as const },
    { label: "Learn A/B testing", state: "active" as const, progress: 60 },
    { label: "Python basics", state: "todo" as const },
    { label: "Build one experimentation project", state: "todo" as const },
    { label: "Apply to roles where you're 80%+ ready", state: "todo" as const },
  ],
  months: [
    { label: "Apr", value: 42 },
    { label: "May", value: 55 },
    { label: "Jun", value: 62 },
    { label: "Jul", value: 68 },
    { label: "Aug", value: 72 },
    { label: "Sep–Oct", value: 78, active: true },
  ],
};

const JOBS = [
  {
    status: "Ready",
    tone: "good" as const,
    score: 91,
    role: "Data Analyst II",
    company: "Northstar",
    meta: "Hybrid",
    detail: "All core skills met",
  },
  {
    status: "Ready",
    tone: "good" as const,
    score: 78,
    role: "Product Analyst",
    company: "Lumen",
    meta: "Remote",
    detail: "Gaps: A/B testing, Python",
  },
  {
    status: "Almost there",
    tone: "warm" as const,
    score: 64,
    role: "Growth Analyst",
    company: "Cobalt",
    meta: "On-site",
    detail: "Gaps: A/B testing, SQL, Marketing analytics",
  },
];

const TONE_DOT = { good: "bg-[#40D480]", warm: "bg-[#FFC740]" };
const TONE_TEXT = { good: "text-[#40D480]", warm: "text-[#FFC740]" };

function FitCard() {
  return (
    <div className="landing-card-border relative overflow-hidden rounded-3xl p-7 shadow-[0_40px_100px_-30px_rgba(124,47,243,0.55)]">
      <span className="absolute right-6 top-6 text-[10px] font-medium text-white/50">Example</span>

      <p className="text-[14px] text-white/60">
        {FIT.role} · {FIT.company}
      </p>
      <div className="mt-2 flex items-baseline gap-3">
        <span className="text-[56px] font-semibold leading-none tracking-[-0.02em]">{FIT.score}%</span>
        <span className={`text-[15px] font-semibold ${TONE_TEXT.good}`}>{FIT.status}</span>
      </div>

      <div className="relative mt-5 pt-5">
        <span className="absolute left-[70%] top-0 -translate-x-1/2 text-[10px] font-semibold uppercase tracking-[0.08em] text-white/50" aria-hidden="true">
          Ready
        </span>
        <div className="h-2 overflow-hidden rounded-full bg-white/[0.08]">
          <div className="qelsa-bar-fill h-full rounded-full bg-[linear-gradient(90deg,#7C2FF3,#D73E9D)]" style={{ width: `${FIT.score}%` }} />
        </div>
        <span aria-hidden="true" className="absolute left-[70%] top-[18px] h-4 w-0.5 -translate-x-1/2 rounded-sm bg-white" />
      </div>

      <div className="mt-5 grid grid-cols-2 gap-4">
        <div>
          <p className="text-[11px] font-medium text-white/50">Strong</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {FIT.strong.map((skill) => (
              <span key={skill.name} className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.12] bg-white/[0.04] px-2.5 py-1.5 text-[12px] text-white">
                {skill.name}
                <span className={TONE_TEXT[skill.tone]}>{skill.level}</span>
              </span>
            ))}
          </div>
        </div>
        <div>
          <p className="text-[11px] font-medium text-white/50">Missing</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {FIT.missing.map((skill) => (
              <span key={skill} className="rounded-full border border-[#FFC740]/30 bg-[#FFC740]/[0.08] px-2.5 py-1.5 text-[12px] text-[#FFC740]">
                {skill}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-5 border-t border-white/[0.08] pt-4">
        <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-white/45">Next step</p>
        <p className="mt-1 text-[12px] leading-snug text-white/70">{FIT.next}</p>
      </div>
    </div>
  );
}

function ScoreCard() {
  return (
    <div className="landing-diagram-border rounded-[24px] p-6 sm:p-8">
      <div className="flex items-end justify-between gap-4">
        <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-white/50">Readiness</p>
        <p className="text-[48px] font-semibold leading-none tracking-[-0.02em]">78%</p>
      </div>

      <div className="mt-7 space-y-4">
        {BREAKDOWN.map((row, index) => (
          <div key={row.label}>
            <div className="flex items-center justify-between text-[13px]">
              <span className="text-white/60">{row.label}</span>
              <span className="font-semibold text-white/85">{row.value}%</span>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/[0.08]">
              <div className="qelsa-bar-fill h-full rounded-full bg-[linear-gradient(90deg,#7C2FF3,#D73E9D)]" style={{ width: `${row.value}%`, animationDelay: `${index * 0.12}s` }} />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 flex items-center justify-between gap-4 border-t border-white/[0.08] pt-4">
        <p className="text-[12px] text-white/50">Required skills</p>
        <p className="text-[12px] font-medium text-[#40D480]">5 of 5 met</p>
      </div>
    </div>
  );
}

function GoalCard() {
  return (
    <div className="landing-card-border rounded-[24px] p-6 sm:p-8">
      <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-white/50">Your goal</p>
      <p className="font-editorial mt-3 text-[26px] italic leading-[1.15] tracking-[-0.02em] text-white">“{GOAL.quote}”</p>

      <div className="mt-5 flex flex-wrap gap-2">
        {GOAL.roles.map((role) => (
          <span key={role} className="rounded-full border border-white/[0.12] bg-white/[0.04] px-2.5 py-1 text-[12px] text-white/80">
            {role}
          </span>
        ))}
        <span className="rounded-full border border-[#7C2FF3]/40 bg-[#7C2FF3]/[0.12] px-2.5 py-1 text-[12px] text-white">{GOAL.timeline}</span>
      </div>

      <div className="mt-7">
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-white/50">Readiness track</p>
          <p className="text-[12px] text-white/50">78% now</p>
        </div>
        <div className="mt-4 flex items-end gap-2">
          {GOAL.months.map((month) => (
            <div key={month.label} className="flex flex-1 flex-col items-center gap-2">
              <div className="flex h-24 w-full items-end overflow-hidden rounded-md bg-white/[0.04]">
                <div className="w-full rounded-md bg-[linear-gradient(180deg,#A78BFA,#D73E9D)]" style={{ height: `${month.value}%` }} />
              </div>
              <span className={`text-[10px] ${month.active ? "text-white" : "text-white/50"}`}>{month.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function PlanCard() {
  return (
    <div className={`${PANEL} p-6 sm:p-8`}>
      <div className="flex items-center justify-between gap-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-white/50">Your plan</p>
        <p className="text-[12px] text-white/50">Sep–Oct</p>
      </div>

      <ol className="mt-4">
        {GOAL.plan.map((step) => (
          <li key={step.label} className="flex items-start gap-3 rounded-xl px-2 py-2.5">
            <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border border-white/[0.12]">
              {step.state === "done" ? (
                <Check className="size-3 text-[#40D480]" strokeWidth={3} aria-hidden="true" />
              ) : step.state === "active" ? (
                <span className="size-2 rounded-full bg-[#C4B5FD]" />
              ) : (
                <span className="size-1.5 rounded-full bg-white/20" />
              )}
            </span>
            <div className="min-w-0 flex-1">
              <p className={`text-[14px] ${step.state === "todo" ? "text-white/55" : "text-white"}`}>{step.label}</p>
              {step.progress ? (
                <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/[0.08]">
                  <div className="qelsa-bar-fill h-full rounded-full bg-[#C4B5FD]" style={{ width: `${step.progress}%` }} />
                </div>
              ) : null}
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

export function ForCandidatesPage() {
  return (
    <MarketingPage>
      {/* Hero */}
      <section className="mx-auto w-full max-w-[1240px] px-4 pb-12 pt-14 sm:px-6 sm:pb-16 lg:pb-16 lg:pt-24">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,460px)] lg:items-center lg:gap-14">
          <div className="min-w-0">
            <h1 className="font-editorial max-w-[720px] text-balance text-[44px] leading-[0.98] tracking-[-0.02em] sm:text-[60px] lg:text-[78px] xl:text-[84px]">
              Know where you <em className="text-[#C4B5FD]">fit</em> before you apply.
            </h1>

            <div className="mt-7 flex max-w-[500px] gap-4">
              <span aria-hidden="true" className="w-0.5 shrink-0 rounded-full bg-[linear-gradient(180deg,#A78BFA,#F472B6)]" />
              <p className="text-pretty text-[19px] leading-relaxed text-white/65 sm:text-[21px]">
                The score, the gaps, and the next step — for <span className="text-white">every job you open.</span>
              </p>
            </div>

            <div className="mt-8">
              <Link href={AUTH_HREF} className={PRIMARY_CTA}>
                Check my readiness
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
              </Link>
            </div>

            <p className="mt-5 flex items-center gap-2 text-[13px] text-white/50">
              <span aria-hidden="true" className="size-1.5 rounded-full bg-[#40D480]" />
              Free to start · No credit card
            </p>
          </div>

          <FitCard />
        </div>
      </section>

      {/* Score */}
      <section aria-labelledby="score-heading" className={MARKETING_SECTION}>
        <SectionIntro id="score-heading" title="One score, built from evidence" lead="Skills and relevant experience — compared with what the job asks for." />

        <div className="mt-10 grid gap-6 lg:mt-14 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <div className="qelsa-reveal">
            <ScoreCard />
          </div>

          <div className="space-y-4">
            {GAP_GROUPS.map((group) => (
              <div key={group.label} className={`${PANEL} p-5 sm:p-6`}>
                <div className="flex items-center gap-2">
                  <span className={`size-2 rounded-full ${TONE_DOT[group.tone]}`} aria-hidden="true" />
                  <p className="text-[13px] font-semibold text-white/80">{group.label}</p>
                </div>
                <div className="mt-3 divide-y divide-white/[0.07]">
                  {group.rows.map((row) => (
                    <div key={row.skill} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[14px] text-white">{row.skill}</span>
                        <span className="text-[11px] text-white/50">{row.you}</span>
                      </div>
                      <span className="text-[11px] text-white/50">{row.needed}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Goal */}
      <section aria-labelledby="goal-heading" className={MARKETING_SECTION}>
        <SectionIntro id="goal-heading" title="Set a goal. Get a plan." lead="Turn a target role into milestones — and watch your readiness move." />

        <div className="mt-10 grid gap-6 lg:mt-14 lg:grid-cols-[0.95fr_1.05fr]">
          <GoalCard />
          <PlanCard />
        </div>
      </section>

      {/* Jobs */}
      <section aria-labelledby="jobs-heading" className={MARKETING_SECTION}>
        <SectionIntro id="jobs-heading" title="Every job gets a verdict" lead="Ready or almost there — with the exact gaps for each." />

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:mt-14 lg:grid-cols-3">
          {JOBS.map((job) => (
            <article key={job.role} className={`${PANEL} p-6`}>
              <div className="flex items-center justify-between gap-3">
                <span className={`inline-flex items-center gap-1.5 text-[11px] font-medium ${TONE_TEXT[job.tone]}`}>
                  <span className={`size-1.5 rounded-full ${TONE_DOT[job.tone]}`} aria-hidden="true" />
                  {job.status}
                </span>
                <span className={`text-[18px] font-semibold ${TONE_TEXT[job.tone]}`}>{job.score}%</span>
              </div>
              <h3 className="mt-4 text-[18px] font-semibold text-white">{job.role}</h3>
              <p className="mt-1 text-[13px] text-white/50">
                {job.company} · {job.meta}
              </p>
              <p className="mt-4 border-t border-white/[0.08] pt-3 text-[12px] text-white/55">{job.detail}</p>
            </article>
          ))}
        </div>

        <div className="mt-8 flex justify-center">
          <Link href="/jobs/all" className={SECONDARY_CTA}>
            Browse all jobs
          </Link>
        </div>
      </section>

      {/* Agent + Learn */}
      <section aria-label="More candidate tools" className={MARKETING_SECTION}>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="landing-card-border rounded-[24px] p-6 sm:p-8">
            <span className="flex size-10 items-center justify-center rounded-xl bg-[#4f46e5]">
              <Sparkles className="size-4 text-white" aria-hidden="true" />
            </span>
            <h2 className="font-editorial mt-4 text-[30px] leading-[1.05] tracking-[-0.02em]">The prep, handled.</h2>
            <p className="mt-2 text-[15px] leading-relaxed text-white/55">Explains your score, tailors your resume and drafts the cover letter.</p>
            <Link href={AGENT_HREF} className={`mt-4 inline-flex min-h-11 items-center gap-2 text-[15px] font-medium text-[#00D4FF] transition-colors hover:text-white ${MARKETING_FOCUS}`}>
              Meet Qelsa Agent
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </div>

          <div className={`${PANEL} p-6 sm:p-8`}>
            <span className="flex size-10 items-center justify-center rounded-xl border border-white/[0.12] bg-white/[0.04]">
              <BookOpen className="size-4 text-white/80" aria-hidden="true" />
            </span>
            <h2 className="font-editorial mt-4 text-[30px] leading-[1.05] tracking-[-0.02em]">Learn the gap.</h2>
            <p className="mt-2 text-[15px] leading-relaxed text-white/55">Courses and practice picked from the skills you&apos;re missing.</p>
            <Link href="/courses" className={`mt-4 inline-flex min-h-11 items-center gap-2 text-[15px] font-medium text-[#00D4FF] transition-colors hover:text-white ${MARKETING_FOCUS}`}>
              Browse courses
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>

      <ClosingCta title="Know where you fit." accent="Before you apply." href={AUTH_HREF} label="Check my readiness" />
    </MarketingPage>
  );
}
