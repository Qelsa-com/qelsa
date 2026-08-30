/**
 * "For candidates" marketing landing page.
 *
 * Figma: for-candidates frame supplied with the request — hero with the
 * four-step intelligence pipeline, the origin-to-action row, job matching,
 * skill gaps, the AI chat, resume/JD match, and the learning path.
 *
 * The page carries its own marketing header and footer rather than the app
 * shell (Layout/PublicNavbar), because the design's nav is a marketing nav
 * (For Candidates / For Employers / Jobs / Blogs + Sign in) and the footer
 * carries the brand and tagline the app footer does not.
 */

import { Check, ChevronRight, MoreHorizontal, Target } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Fragment, type ReactNode } from "react";

/** `href: null` renders a plain label — For Employers has no route yet. */
const NAV_LINKS: { label: string; href: string | null; active?: boolean }[] = [
  { label: "For Candidates", href: "/for_candidates", active: true },
  { label: "For Employers", href: null },
  { label: "Jobs", href: "/jobs/all" },
  { label: "Blogs", href: "/blogs" },
];

const FOOTER_LINKS = [
  { label: "Privacy Policy", href: "/privacy" },
  { label: "Terms of Service", href: "/terms" },
  { label: "Cookie Policy", href: "/cookies" },
];

const HERO = {
  eyebrow: "Career intelligence",
  lines: ["Know where", "you fit"],
  body: "Qelsa connects your skills, goals, and opportunities so you can see what fits and what to focus on next.",
  cta: "See where you fit",
};

const PIPELINE = [
  { label: "01 / Identity", title: "Your Profile", person: { name: "John Doe", role: "Product Architect" } },
  { label: "02 / Skills Map", title: "Verified Skills", chips: ["React", "TypeScript", "System Design"] },
  { label: "03 / Evaluation", title: "Job Matches", score: "92%", note: "Ready for target roles" },
  { label: "04 / Focus", title: "Next Action", pill: "Build 1 core skill" },
];

const JOURNEY = [
  { label: "01 / Origin", title: "Your Experience", text: "Decentralized accomplishments & background" },
  { label: "02 / Intelligence", title: "Your Skills", text: "Real-time verified matrix of capabilities" },
  { label: "03 / Direction", title: "Your Goals", text: "Target roles, trajectories, and parameters" },
  { label: "04 / Outcome", title: "Relevant Roles", text: "Open positions aligned with your profile" },
  { label: "05 / Analytics", title: "Skill Gaps", text: "Precise delta between you and target requirements" },
  { label: "06 / Action", title: "What's Next", pill: "Targeted study" },
];

const MATCHES = [
  {
    status: "Ready now",
    score: "92%",
    role: "Staff UI Architect",
    listLabel: "Your matching skills",
    items: ["React", "TypeScript", "Component Design", "CSS/HTML"],
    tone: "green" as const,
  },
  {
    status: "Almost there",
    score: "76%",
    role: "Lead Product Engineer",
    listLabel: "Remaining gaps",
    items: ["GraphQL", "Kubernetes"],
    tone: "amber" as const,
  },
];

const GAPS = {
  targetRole: "Target role: Product Manager",
  title: "Focus on what matters",
  body: "Rather than attempting to master every tech skill, target the high-leverage proficiencies that unlock candidate readiness.",
  have: ["Product strategy", "UX Fundamentals", "Agile", "Stakeholder Management"],
  next: ["Product analytics", "SQL", "Experimentation"],
};

const CHAT = {
  title: "Qelsa Career Intelligence",
  question: "Why am I a 76% match for the Lead Product Engineer role at Aurora?",
  answer:
    "You have strong alignment in Product Strategy, Stakeholder Management, and React (Staff-level). Your core remaining gap is Kubernetes Orchestration & GraphQL.",
  suggestions: ["What should I focus on next?", "Which roles fit my experience?"],
};

const RESUME = {
  label: "Resume builder",
  title: "Build a resume that fits the role",
  body: "Qelsa generates a tailored resume based on your profile, skills, and the role you're targeting. No templates — a resume built from what you actually bring.",
  name: "John Doe",
  role: "Product Architect",
  target: "Target: Staff UI Architect",
  summary:
    "Product leader with 8+ years of experience building scalable UI systems, design systems, and cross-functional product roadmaps.",
  skills: ["React", "TypeScript", "System Design"],
  experience: {
    title: "Senior Product Architect",
    meta: "Aurora • 2021–Present",
    text: "Led the design system and component architecture for the core product surface.",
  },
};

const JD_MATCH = {
  label: "JD match",
  title: "Check your match with any job",
  body: "Paste a job description, upload a JD file, or drop a job link. Qelsa shows you where you stand — even for jobs outside the platform.",
  role: "Lead Product Engineer",
  meta: "Aurora • Remote",
  score: "84%",
  skills: ["React", "TypeScript", "System Design"],
  stats: [
    { label: "Skills", value: "9/10" },
    { label: "Experience", value: "8/10" },
    { label: "Gaps", value: "2" },
  ],
};

const LEARNING = {
  progress: 65,
  steps: [
    { label: "Target role", value: "Systems Engineer" },
    { label: "Skill to build", value: "Kubernetes Orchestration", accent: true },
    { label: "Recommended learning", value: "Architecting with GKE" },
  ],
};

const CARD = "rounded-xl border border-white/[0.07] bg-white/[0.03]";
const INNER_CARD = "rounded-lg border border-white/[0.06] bg-[#0a0a13]";

function Mono({ children, className = "text-neon-cyan" }: { children: ReactNode; className?: string }) {
  return <p className={`text-[10px] font-semibold uppercase tracking-[0.16em] ${className}`}>{children}</p>;
}

function Chip({ children, tone = "cyan" }: { children: ReactNode; tone?: "cyan" | "neutral" | "green" }) {
  const tones = {
    cyan: "border-neon-cyan/25 bg-neon-cyan/[0.08] text-neon-cyan/90",
    neutral: "border-white/[0.1] bg-white/[0.04] text-white/60",
    green: "border-neon-green/30 bg-neon-green/[0.08] text-neon-green",
  };
  return <span className={`rounded-md border px-2 py-1 text-[10px] font-medium ${tones[tone]}`}>{children}</span>;
}

function SectionHeading({ eyebrow, title, sub }: { eyebrow?: string; title: string; sub?: string }) {
  return (
    <div className="flex flex-col items-center gap-3 text-center">
      {eyebrow && <Mono>{eyebrow}</Mono>}
      <h2 className="max-w-[720px] text-[28px] font-bold leading-tight tracking-[-0.02em] text-white lg:text-[40px]">{title}</h2>
      {sub && <p className="max-w-[560px] text-sm text-white/50 lg:text-[15px]">{sub}</p>}
    </div>
  );
}

/** Every band shares the content column and vertical rhythm. */
function Section({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <section className={`relative mx-auto w-full max-w-[1180px] px-6 py-14 lg:px-10 lg:py-24 ${className}`}>{children}</section>
  );
}

export function ForCandidatesPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#05050c] text-white">
      {/* The blurred orbs bleeding off the hero corners in the design. */}
      <div aria-hidden="true" className="pointer-events-none absolute -right-40 -top-64 size-[560px] rounded-full bg-neon-cyan/[0.18] blur-[140px]" />
      <div aria-hidden="true" className="pointer-events-none absolute -left-56 top-[380px] size-[440px] rounded-full bg-neon-purple/[0.18] blur-[140px]" />

      <header className="sticky top-0 z-50 border-b border-white/[0.08] bg-[#05050c]/85 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-[1180px] items-center justify-between gap-6 px-6 py-4 lg:px-10">
          <Link href="/" className="flex shrink-0 items-center gap-2" aria-label="Qelsa home">
            <span className="gradient-primary flex size-6 items-center justify-center rounded-md text-[11px] font-bold leading-none text-white">q</span>
            <Image src="/qelsa-logo.svg" alt="Qelsa" width={91} height={29} unoptimized className="h-[15px] w-auto" />
          </Link>

          <nav className="hidden items-center gap-8 md:flex">
            {NAV_LINKS.map((link) => {
              if (!link.href) {
                return (
                  <span key={link.label} title="Coming soon" className="cursor-default text-[13px] font-medium text-white/40">
                    {link.label}
                  </span>
                );
              }
              return (
                <Link
                  key={link.label}
                  href={link.href}
                  aria-current={link.active ? "page" : undefined}
                  className={`relative text-[13px] font-medium transition-colors ${link.active ? "text-neon-cyan" : "text-white/60 hover:text-white"}`}
                >
                  {link.label}
                  {link.active && <span className="absolute -bottom-[17px] left-0 h-0.5 w-full bg-neon-cyan" />}
                </Link>
              );
            })}
          </nav>

          <Link href="/auth" className="shrink-0 text-[13px] font-medium text-white/70 transition-colors hover:text-white">
            Sign in
          </Link>
        </div>
      </header>

      {/* Hero */}
      <Section className="lg:pb-28 lg:pt-24">
        <div className="grid items-center gap-14 lg:grid-cols-2 lg:gap-16">
          <div className="flex flex-col gap-6">
            <Mono>{HERO.eyebrow}</Mono>
            <h1 className="text-[44px] font-extrabold leading-[1.02] tracking-[-0.03em] text-white sm:text-6xl lg:text-[72px]">
              {HERO.lines.map((line) => (
                <span key={line} className="block">
                  {line}
                </span>
              ))}
            </h1>
            <p className="max-w-[420px] text-sm leading-relaxed text-white/55 lg:text-[15px]">{HERO.body}</p>
            <div>
              <Link
                href="/start"
                className="gradient-primary inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-[13px] font-semibold text-white transition-opacity hover:opacity-90"
              >
                {HERO.cta}
                <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>

          {/* The four-step pipeline, each card feeding the next. */}
          <div className="flex flex-col gap-1.5">
            {PIPELINE.map((step, i) => (
              <Fragment key={step.label}>
                {i > 0 && (
                  <span aria-hidden="true" className="pl-4 text-xs leading-none text-white/25">
                    ↓
                  </span>
                )}
                <div className={`${CARD} p-4`}>
                  <Mono>{step.label}</Mono>
                  <p className="mt-2 text-[15px] font-semibold text-white">{step.title}</p>

                  {step.person && (
                    <div className="mt-3 flex items-center gap-2.5">
                      <span className="size-7 shrink-0 rounded-full border border-white/[0.1] bg-white/[0.06]" />
                      <div>
                        <p className="text-xs font-medium text-white/85">{step.person.name}</p>
                        <p className="text-[10px] text-white/40">{step.person.role}</p>
                      </div>
                    </div>
                  )}

                  {step.chips && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {step.chips.map((chip) => (
                        <Chip key={chip}>{chip}</Chip>
                      ))}
                    </div>
                  )}

                  {step.score && (
                    <div className="mt-3 flex items-baseline gap-2">
                      <span className="text-2xl font-bold text-neon-green">{step.score}</span>
                      <span className="text-[11px] text-white/45">{step.note}</span>
                    </div>
                  )}

                  {step.pill && (
                    <div className="mt-3">
                      <Chip tone="green">↑ {step.pill}</Chip>
                    </div>
                  )}
                </div>
              </Fragment>
            ))}
          </div>
        </div>
      </Section>

      {/* Origin → action */}
      <Section>
        <SectionHeading title="From where you are to what's next" sub="Qelsa connects these so you know what to focus on next." />
        <div className="mt-10 flex flex-wrap items-stretch gap-3 lg:mt-14 lg:flex-nowrap lg:gap-2">
          {JOURNEY.map((step, i) => (
            <Fragment key={step.label}>
              {i > 0 && <ChevronRight aria-hidden="true" className="hidden size-4 shrink-0 self-center text-white/20 lg:block" />}
              <div className={`${CARD} min-w-[calc(50%-0.375rem)] flex-1 p-3.5 sm:min-w-[calc(33%-0.75rem)] lg:min-w-0`}>
                <Mono>{step.label}</Mono>
                <p className="mt-2 text-[13px] font-semibold text-white">{step.title}</p>
                {step.text && <p className="mt-1.5 text-[10px] leading-relaxed text-white/45">{step.text}</p>}
                {step.pill && (
                  <div className="mt-2.5">
                    <Chip tone="green">{step.pill}</Chip>
                  </div>
                )}
              </div>
            </Fragment>
          ))}
        </div>
      </Section>

      {/* Job matching */}
      <Section>
        <SectionHeading
          eyebrow="Job matching"
          title="Know where you stand"
          sub="See what matches, what's missing, and what to focus on next before you apply."
        />
        <div className="mt-10 grid gap-4 md:grid-cols-2 lg:mt-14">
          {MATCHES.map((match) => {
            const accent = match.tone === "green" ? "text-neon-green" : "text-neon-yellow";
            const edge = match.tone === "green" ? "border-neon-green/20" : "border-neon-yellow/20";
            return (
              <div key={match.role} className={`rounded-xl border bg-white/[0.03] p-5 lg:p-6 ${edge}`}>
                <div className="flex items-start justify-between gap-4">
                  <Mono className={accent}>{match.status}</Mono>
                  <span className={`text-2xl font-bold lg:text-[28px] ${accent}`}>{match.score}</span>
                </div>
                <p className="mt-2 text-base font-semibold text-white lg:text-lg">{match.role}</p>
                <div className="mt-5 border-t border-white/[0.06] pt-4">
                  <Mono className="text-white/35">{match.listLabel}</Mono>
                  <div className="mt-2.5 flex flex-wrap gap-1.5">
                    {match.items.map((item) => (
                      <Chip key={item} tone={match.tone === "green" ? "cyan" : "neutral"}>
                        {item}
                      </Chip>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Section>

      {/* Skill gaps */}
      <Section>
        <SectionHeading
          eyebrow="Skill gaps"
          title="3 skills to close the gap"
          sub="Qelsa identifies the skills that could move you closer to the role you're working toward."
        />
        <div className={`mt-10 ${CARD} p-5 lg:mt-14 lg:p-7`}>
          <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr_1fr] lg:gap-8">
            <div>
              <Mono className="text-neon-yellow">{GAPS.targetRole}</Mono>
              <p className="mt-3 text-lg font-semibold text-white lg:text-xl">{GAPS.title}</p>
              <p className="mt-2.5 max-w-[420px] text-xs leading-relaxed text-white/50 lg:text-[13px]">{GAPS.body}</p>
            </div>
            <div className={`${INNER_CARD} p-4`}>
              <Mono className="text-white/35">You already have</Mono>
              <ul className="mt-3 flex flex-col gap-2">
                {GAPS.have.map((item) => (
                  <li key={item} className="flex items-center gap-2 text-[11px] text-white/70">
                    <Check aria-hidden="true" className="size-3.5 shrink-0 text-neon-green" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className={`${INNER_CARD} p-4`}>
              <Mono className="text-white/35">Focus next</Mono>
              <ul className="mt-3 flex flex-col gap-2">
                {GAPS.next.map((item) => (
                  <li key={item} className="flex items-center gap-2 text-[11px] text-white/70">
                    <Target aria-hidden="true" className="size-3.5 shrink-0 text-neon-yellow" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </Section>

      {/* AI intelligence */}
      <Section>
        <SectionHeading
          eyebrow="AI intelligence"
          title="When you need clarity, ask Qelsa"
          sub="Get intelligence on-demand based on your goals, profile, and current opportunities."
        />
        <div className={`mt-10 ${CARD} p-4 lg:mt-14 lg:p-6`}>
          <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
            <div className="flex items-center gap-2">
              <span aria-hidden="true" className="size-1.5 rounded-full bg-neon-green" />
              <p className="text-[11px] font-medium text-white/60">{CHAT.title}</p>
            </div>
            <MoreHorizontal aria-hidden="true" className="size-4 text-white/25" />
          </div>

          <div className="flex flex-col gap-4 py-5">
            <div className="flex justify-end">
              <p className="max-w-[85%] rounded-xl rounded-br-sm border border-white/[0.08] bg-white/[0.05] px-3.5 py-2.5 text-[11px] leading-relaxed text-white/75 lg:max-w-[60%]">
                {CHAT.question}
              </p>
            </div>
            <div className="flex items-start gap-2.5">
              <span aria-hidden="true" className="gradient-primary mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-md text-[10px] font-bold leading-none text-white">
                q
              </span>
              <p className="max-w-[85%] rounded-xl rounded-bl-sm border border-white/[0.06] bg-white/[0.03] px-3.5 py-2.5 text-[11px] leading-relaxed text-white/65 lg:max-w-[60%]">
                {CHAT.answer}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 border-t border-white/[0.06] pt-4">
            {CHAT.suggestions.map((suggestion) => (
              <span key={suggestion} className="rounded-full border border-white/[0.1] bg-white/[0.04] px-3 py-1.5 text-[11px] text-white/55">
                {suggestion}
              </span>
            ))}
          </div>
        </div>
      </Section>

      {/* Clarity into action */}
      <Section>
        <SectionHeading
          eyebrow="More ways to move forward"
          title="Turn clarity into action"
          sub="Turn what Qelsa knows about you into stronger applications and better decisions."
        />
        <div className="mt-10 grid gap-4 lg:mt-14 lg:grid-cols-2">
          {/* Resume builder */}
          <div className={`${CARD} p-5 lg:p-6`}>
            <Mono>{RESUME.label}</Mono>
            <p className="mt-3 text-base font-semibold text-white lg:text-lg">{RESUME.title}</p>
            <p className="mt-2.5 text-xs leading-relaxed text-white/50 lg:text-[13px]">{RESUME.body}</p>

            <div className={`mt-5 ${INNER_CARD} p-4`}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[13px] font-semibold text-white">{RESUME.name}</p>
                  <p className="text-[10px] text-white/40">{RESUME.role}</p>
                </div>
                <Chip>{RESUME.target}</Chip>
              </div>

              <div className="mt-4">
                <Mono className="text-white/30">Summary</Mono>
                <p className="mt-1.5 text-[10px] leading-relaxed text-white/55">{RESUME.summary}</p>
              </div>

              <div className="mt-3">
                <Mono className="text-white/30">Skills</Mono>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {RESUME.skills.map((skill) => (
                    <Chip key={skill}>{skill}</Chip>
                  ))}
                </div>
              </div>

              <div className="mt-3">
                <Mono className="text-white/30">Experience</Mono>
                <p className="mt-1.5 text-[11px] font-semibold text-white">{RESUME.experience.title}</p>
                <p className="text-[10px] text-white/40">{RESUME.experience.meta}</p>
                <p className="mt-1 text-[10px] leading-relaxed text-white/55">{RESUME.experience.text}</p>
              </div>
            </div>
          </div>

          {/* JD match */}
          <div className={`${CARD} p-5 lg:p-6`}>
            <Mono>{JD_MATCH.label}</Mono>
            <p className="mt-3 text-base font-semibold text-white lg:text-lg">{JD_MATCH.title}</p>
            <p className="mt-2.5 text-xs leading-relaxed text-white/50 lg:text-[13px]">{JD_MATCH.body}</p>

            <div className={`mt-5 ${INNER_CARD} p-4`}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[13px] font-semibold text-white">{JD_MATCH.role}</p>
                  <p className="text-[10px] text-white/40">{JD_MATCH.meta}</p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold leading-none text-neon-green">{JD_MATCH.score}</p>
                  <p className="mt-1 text-[9px] font-semibold uppercase tracking-[0.16em] text-white/35">Match</p>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-1.5">
                {JD_MATCH.skills.map((skill) => (
                  <Chip key={skill}>{skill}</Chip>
                ))}
              </div>

              <dl className="mt-4 flex flex-col gap-2 border-t border-white/[0.06] pt-3">
                {JD_MATCH.stats.map((stat) => (
                  <div key={stat.label} className="flex items-center justify-between text-[10px]">
                    <dt className="text-white/40">{stat.label}</dt>
                    <dd className="font-medium text-white/70">{stat.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </div>
      </Section>

      {/* Learning path */}
      <Section className="pb-6 lg:pb-10">
        <SectionHeading
          eyebrow="Learning path"
          title="Learn with a reason"
          sub="Qelsa connects learning to actual career objectives, not arbitrary courses."
        />
        <div className={`mt-10 ${CARD} p-5 lg:mt-14 lg:p-6`}>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:gap-3">
            {LEARNING.steps.map((step, i) => (
              <Fragment key={step.label}>
                {i > 0 && <ChevronRight aria-hidden="true" className="hidden size-4 shrink-0 text-white/20 lg:block" />}
                <div className="flex-1">
                  <Mono className="text-white/35">{step.label}</Mono>
                  <p className={`mt-1.5 text-[13px] font-semibold ${step.accent ? "text-neon-cyan" : "text-white"}`}>{step.value}</p>
                </div>
              </Fragment>
            ))}
            <ChevronRight aria-hidden="true" className="hidden size-4 shrink-0 text-white/20 lg:block" />
            <div className="flex-1">
              <Mono className="text-white/35">Progress</Mono>
              <div className="mt-2.5 flex items-center gap-3">
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/[0.08]">
                  <div className="gradient-primary h-full rounded-full" style={{ width: `${LEARNING.progress}%` }} />
                </div>
                <span className="text-[11px] font-semibold text-white/70">{LEARNING.progress}%</span>
              </div>
            </div>
          </div>
        </div>
      </Section>

      <footer className="relative mx-auto w-full max-w-[1180px] px-6 pb-12 lg:px-10">
        <div className="flex flex-col gap-6 border-t border-white/[0.08] pt-8">
          <div className="flex flex-col items-start justify-between gap-5 sm:flex-row sm:items-center">
            <Link href="/" className="flex items-center gap-2" aria-label="Qelsa home">
              <span className="gradient-primary flex size-6 items-center justify-center rounded-md text-[11px] font-bold leading-none text-white">q</span>
              <Image src="/qelsa-logo.svg" alt="Qelsa" width={91} height={29} unoptimized className="h-[15px] w-auto" />
            </Link>
            <div className="flex flex-wrap items-center gap-6">
              {FOOTER_LINKS.map((link) => (
                <Link key={link.label} href={link.href} className="text-[11px] text-white/45 transition-colors hover:text-white/70">
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-2 text-[10px] text-white/35 sm:flex-row sm:items-center sm:justify-between">
            {/* The design reads "© 2026"; the year stays dynamic so it cannot go stale. */}
            <p>© {new Date().getFullYear()} Qelsa. All rights reserved.</p>
            <p>Providing precise career direction.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
