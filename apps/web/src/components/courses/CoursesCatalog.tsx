"use client";

import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/convexApi";
import { cn } from "@/components/ui/utils";
import { ArrowRight, ArrowUpRight, BookOpen, GraduationCap, Search, Sparkles, Timer } from "lucide-react";
import Link from "next/link";
import { useMutation, useQuery } from "convex/react";
import { useMemo, useState, type ReactNode } from "react";

type InterviewTrack = {
  id: string;
  slug: string;
  title: string;
  role_family: string;
  level: string;
  summary: string;
  skills: string[];
  interview_types: string[];
  question_count: number;
  estimated_minutes: number;
  quality_score: number;
  demand_score: number;
};

type ExternalCourse = {
  course_id: string;
  title: string;
  provider: string;
  url: string;
  level: string;
  duration: string;
  free: boolean;
  description: string;
  skills: string[];
  affiliate: boolean;
};

type Tab = "interview" | "skills";

function Chip({ children }: { children: ReactNode }) {
  return (
    <span className="rounded-md border border-white/[0.1] bg-white/[0.04] px-2.5 py-1 text-[11px] font-medium text-white/55">
      {children}
    </span>
  );
}

function SkeletonCard() {
  return (
    <div className="h-64 animate-pulse rounded-[22px] border border-white/[0.07] bg-white/[0.025]" />
  );
}

export function CoursesCatalog() {
  const { isAuthenticated } = useAuth();
  const tracksQuery = useQuery(api.interviewPrep.listPublished, {});
  const externalQuery = useQuery(api.interviewPrep.listExternal, {});
  const trackClick = useMutation(api.agentCourseTracking.trackClick);
  const [tab, setTab] = useState<Tab>("interview");
  const [query, setQuery] = useState("");

  const tracks = (tracksQuery ?? []) as InterviewTrack[];
  const external = (externalQuery ?? []) as ExternalCourse[];

  const filteredTracks = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return tracks;
    return tracks.filter((track) =>
      [track.title, track.role_family, track.summary, ...track.skills].join(" ").toLowerCase().includes(term),
    );
  }, [query, tracks]);

  const filteredExternal = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return external;
    return external.filter((course) =>
      [course.title, course.provider, course.description, ...course.skills].join(" ").toLowerCase().includes(term),
    );
  }, [external, query]);

  const trackExternal = (course: ExternalCourse) => {
    if (!isAuthenticated) return;
    void trackClick({
      courseId: course.course_id,
      provider: course.provider,
      source: "courses_page",
      matchedSkills: course.skills.slice(0, 8),
    }).catch(() => undefined);
  };

  return (
    <main className="relative isolate min-h-screen overflow-hidden text-white">
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute left-1/2 top-0 h-[520px] w-[780px] -translate-x-1/2 rounded-full bg-neon-purple/[0.12] blur-[150px]" />
        <div className="absolute -left-48 top-[420px] size-[420px] rounded-full bg-neon-cyan/[0.06] blur-[130px]" />
      </div>

      <div className="mx-auto w-full max-w-6xl px-5 py-12 sm:px-8 lg:py-16">
        <div className="max-w-2xl">
          <p className="inline-flex items-center gap-2 text-[11px] font-mono font-semibold uppercase tracking-[0.18em] text-neon-cyan">
            <GraduationCap className="size-4" />
            Qelsa learning
          </p>
          <h1 className="mt-4 text-4xl font-extrabold tracking-[-0.035em] sm:text-5xl">Walk in ready.</h1>
          <p className="mt-4 text-sm leading-relaxed text-white/55 sm:text-base">
            Role-based interview practice, built and quality-checked by Qelsa.
          </p>
        </div>

        <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="inline-flex w-fit rounded-full border border-white/10 bg-white/[0.03] p-1">
            <button
              type="button"
              onClick={() => setTab("interview")}
              className={cn(
                "inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold transition",
                tab === "interview" ? "bg-white text-[#06060f]" : "text-white/55 hover:text-white",
              )}
            >
              <Sparkles className="size-3.5" />
              Interview prep
              {tracks.length ? <span className="text-[10px] opacity-60">{tracks.length}</span> : null}
            </button>
            <button
              type="button"
              onClick={() => setTab("skills")}
              className={cn(
                "inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold transition",
                tab === "skills" ? "bg-white text-[#06060f]" : "text-white/55 hover:text-white",
              )}
            >
              <BookOpen className="size-3.5" />
              Skill courses
              {external.length ? <span className="text-[10px] opacity-60">{external.length}</span> : null}
            </button>
          </div>

          <div className="flex w-full items-center gap-2 rounded-xl border border-white/[0.1] bg-white/[0.035] px-3 sm:max-w-xs">
            <Search className="size-4 shrink-0 text-white/35" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={tab === "interview" ? "Search roles or skills" : "Search courses or skills"}
              aria-label="Search courses"
              className="h-10 min-w-0 flex-1 bg-transparent text-sm text-white placeholder:text-white/35 focus:outline-none"
            />
          </div>
        </div>

        {tab === "interview" ? (
          <section className="mt-8">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold">Interview prep tracks</h2>
                <p className="mt-1 text-xs text-white/40">Frequently asked questions with answer frameworks.</p>
              </div>
            </div>

            {tracksQuery === undefined ? (
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <SkeletonCard />
                <SkeletonCard />
              </div>
            ) : filteredTracks.length ? (
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                {filteredTracks.map((track) => (
                  <Link
                    key={track.id}
                    href={`/courses/interview/${encodeURIComponent(track.slug)}`}
                    className="group relative overflow-hidden rounded-[22px] border border-white/[0.09] bg-[#0b0b16] p-5 transition-all hover:-translate-y-0.5 hover:border-neon-cyan/35 hover:shadow-[0_18px_50px_-24px_rgba(34,211,238,0.35)] sm:p-6"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-[10px] font-mono font-semibold uppercase tracking-[0.16em] text-neon-cyan">{track.role_family}</p>
                        <h3 className="mt-2 text-lg font-bold leading-snug text-white">{track.title}</h3>
                      </div>
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-white/55 transition-colors group-hover:border-neon-cyan/30 group-hover:text-neon-cyan">
                        <ArrowRight className="size-4" />
                      </span>
                    </div>
                    <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-white/50">{track.summary}</p>
                    <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[11px] text-white/35">
                      <span>{track.level}</span>
                      <span className="size-1 rounded-full bg-white/20" />
                      <span>{track.question_count} questions</span>
                      <span className="size-1 rounded-full bg-white/20" />
                      <span className="inline-flex items-center gap-1">
                        <Timer className="size-3" />
                        {track.estimated_minutes} min
                      </span>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-1.5">
                      {track.skills.slice(0, 3).map((skill) => (
                        <Chip key={skill}>{skill}</Chip>
                      ))}
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="mt-5 rounded-[22px] border border-dashed border-white/15 bg-white/[0.02] px-6 py-14 text-center">
                <GraduationCap className="mx-auto size-8 text-white/25" />
                <p className="mt-3 text-sm font-semibold">
                  {tracks.length ? "No tracks match that search." : "New tracks are being built."}
                </p>
                <p className="mt-1 text-xs text-white/40">
                  {tracks.length ? "Try a role family or skill." : "Check back soon."}
                </p>
              </div>
            )}
          </section>
        ) : (
          <section className="mt-8">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold">Skill courses</h2>
                <p className="mt-1 text-xs text-white/40">Curated courses for deeper skill gaps.</p>
              </div>
            </div>

            {externalQuery === undefined ? (
              <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                <SkeletonCard />
                <SkeletonCard />
                <SkeletonCard />
              </div>
            ) : filteredExternal.length ? (
              <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {filteredExternal.map((course) => (
                  <a
                    key={course.course_id}
                    href={course.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => trackExternal(course)}
                    className="group flex flex-col rounded-[22px] border border-white/[0.08] bg-white/[0.025] p-5 transition-all hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/[0.04]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/35">{course.provider}</p>
                        <h3 className="mt-2 text-[15px] font-bold leading-snug text-white">{course.title}</h3>
                      </div>
                      <ArrowUpRight className="size-4 shrink-0 text-white/30 transition-colors group-hover:text-neon-cyan" />
                    </div>
                    <p className="mt-3 line-clamp-2 text-xs leading-relaxed text-white/45">{course.description}</p>
                    <div className="mt-4 flex flex-wrap gap-1.5">
                      {course.skills.slice(0, 3).map((skill) => (
                        <Chip key={skill}>{skill}</Chip>
                      ))}
                    </div>
                    <div className="mt-auto flex items-center justify-between pt-5 text-[11px] text-white/35">
                      <span>{course.level} · {course.duration}</span>
                      <span className={course.free ? "font-semibold text-emerald-300" : "font-semibold text-white/55"}>
                        {course.free ? "Free" : "Paid"}
                      </span>
                    </div>
                    {course.affiliate ? <p className="mt-2 text-[10px] text-white/25">Partner link</p> : null}
                  </a>
                ))}
              </div>
            ) : (
              <div className="mt-5 rounded-[22px] border border-dashed border-white/15 bg-white/[0.02] px-6 py-14 text-center text-sm text-white/40">
                No courses match that search.
              </div>
            )}
          </section>
        )}
      </div>
    </main>
  );
}
