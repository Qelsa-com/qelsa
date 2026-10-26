"use client";

import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/convexApi";
import { cn } from "@/components/ui/utils";
import { ArrowUpRight, BookOpen, MessagesSquare, Search, Timer } from "lucide-react";
import Link from "next/link";
import { useMutation, useQuery } from "convex/react";
import { useMemo, useState, type ReactNode } from "react";
import { ExternalCoursesSkeleton, PracticeTracksSkeleton } from "./courseSkeletons";

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

type Tab = "practice" | "learn";

function Chip({ children }: { children: ReactNode }) {
  return (
    <span className="rounded-md border border-white/[0.1] bg-white/[0.04] px-2.5 py-1 text-[11px] font-medium text-white/55">
      {children}
    </span>
  );
}

function levelLabel(level?: string) {
  return !level || level.trim().toLowerCase() === "all" ? "All levels" : level;
}

export function CoursesCatalog() {
  const { isAuthenticated } = useAuth();
  const tracksQuery = useQuery(api.interviewPrep.listPublished, {});
  const externalQuery = useQuery(api.interviewPrep.listExternal, {});
  const trackClick = useMutation(api.agentCourseTracking.trackClick);
  const [tab, setTab] = useState<Tab>("practice");
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
    <main className="min-h-screen text-white">
      <div className="mx-auto w-full max-w-7xl px-5 py-10 sm:px-8 lg:py-14">
        <header>
          <h1 className="text-4xl font-extrabold tracking-[-0.035em] sm:text-5xl lg:text-6xl">Learn &amp; Practice</h1>
          <p className="mt-2 text-sm leading-relaxed text-white/55 sm:text-base">
            Build skills and practice for your next career move.
          </p>
        </header>

        <div className="relative mt-7">
          <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-white/35" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={tab === "practice" ? "Search roles or skills..." : "Search courses or skills..."}
            aria-label="Search learning content"
            className="h-12 w-full rounded-2xl border border-white/[0.1] bg-[#0b0b16] pl-11 pr-4 text-sm text-white placeholder:text-white/35 transition-colors focus:border-white/20 focus:outline-none"
          />
        </div>

        <div role="tablist" aria-label="Learn and practice" className="mt-7 flex gap-7 border-b border-white/[0.08]">
          {(["practice", "learn"] as const).map((value) => {
            const active = tab === value;
            return (
              <button
                key={value}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setTab(value)}
                className={cn(
                  "relative -mb-px pb-3 text-sm font-semibold capitalize transition-colors",
                  active ? "text-white" : "text-white/40 hover:text-white/70",
                )}
              >
                {value}
                {active ? <span className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-white" /> : null}
              </button>
            );
          })}
        </div>

        <div className="mt-5 min-h-[12px] text-xs font-semibold text-white/60">
          {tab === "practice" ? (
            tracksQuery === undefined ? (
              <span className="block h-3 w-28 animate-pulse rounded bg-white/[0.08]" aria-hidden />
            ) : (
              `${filteredTracks.length} practice track${filteredTracks.length === 1 ? "" : "s"}`
            )
          ) : externalQuery === undefined ? (
            <span className="block h-3 w-20 animate-pulse rounded bg-white/[0.08]" aria-hidden />
          ) : (
            `${filteredExternal.length} course${filteredExternal.length === 1 ? "" : "s"}`
          )}
        </div>

        {tab === "practice" ? (
          <section className="mt-4" aria-label="Practice tracks">
            {tracksQuery === undefined ? (
              <PracticeTracksSkeleton />
            ) : filteredTracks.length ? (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {filteredTracks.map((track) => (
                  <Link
                    key={track.id}
                    href={`/courses/interview/${encodeURIComponent(track.slug)}`}
                    className="group flex flex-col rounded-[24px] border border-white/[0.09] bg-[#0b0b16] p-5 transition-all hover:-translate-y-0.5 hover:border-neon-cyan/35 hover:shadow-[0_18px_50px_-24px_rgba(34,211,238,0.35)]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <span className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-neon-cyan/25 bg-neon-cyan/[0.08] text-neon-cyan">
                        <MessagesSquare className="size-5" />
                      </span>
                      <span className="rounded-lg border border-white/[0.1] bg-white/[0.04] px-2.5 py-1 text-[11px] font-medium text-white/55">
                        {levelLabel(track.level)}
                      </span>
                    </div>
                    <h2 className="mt-5 text-lg font-bold leading-snug text-white">{track.title}</h2>
                    <p className="mt-1 text-sm text-white/50">Interview track</p>
                    <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-white/45">{track.summary}</p>
                    <div className="mt-4 flex flex-wrap gap-1.5">
                      {track.skills.slice(0, 3).map((skill) => (
                        <Chip key={skill}>{skill}</Chip>
                      ))}
                    </div>
                    <div className="mt-auto flex items-center justify-between gap-3 border-t border-white/[0.07] pt-4 text-sm">
                      <span className="font-semibold text-white">{track.question_count} questions</span>
                      <span className="inline-flex items-center gap-1.5 text-white/40">
                        <Timer className="size-3.5" />
                        {track.estimated_minutes} min
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="mt-1 rounded-[24px] border border-dashed border-white/15 bg-white/[0.02] px-6 py-14 text-center">
                <MessagesSquare className="mx-auto size-8 text-white/25" />
                <p className="mt-3 text-sm font-semibold">
                  {tracks.length ? "No practice tracks match that search." : "New practice tracks are being built."}
                </p>
                <p className="mt-1 text-xs text-white/40">{tracks.length ? "Try a role or skill." : "Check back soon."}</p>
              </div>
            )}
          </section>
        ) : (
          <section className="mt-4" aria-label="Skill courses">
            {externalQuery === undefined ? (
              <ExternalCoursesSkeleton />
            ) : filteredExternal.length ? (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {filteredExternal.map((course) => (
                  <a
                    key={course.course_id}
                    href={course.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => trackExternal(course)}
                    className="group flex flex-col rounded-[24px] border border-white/[0.09] bg-[#0b0b16] p-5 transition-all hover:-translate-y-0.5 hover:border-white/25 hover:bg-[#0d0d1a]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <span className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-neon-cyan/25 bg-neon-cyan/[0.08] text-neon-cyan">
                        <BookOpen className="size-5" />
                      </span>
                      <ArrowUpRight className="size-4 text-white/35 transition-colors group-hover:text-neon-cyan" />
                    </div>
                    <h2 className="mt-5 text-[17px] font-bold leading-snug text-white">{course.title}</h2>
                    <p className="mt-1 text-sm text-white/50">{course.provider}</p>
                    <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-white/45">{course.description}</p>
                    <div className="mt-4 flex flex-wrap gap-1.5">
                      {course.skills.slice(0, 3).map((skill) => (
                        <Chip key={skill}>{skill}</Chip>
                      ))}
                    </div>
                    <div className="mt-auto flex items-center justify-between gap-3 pt-5 text-[11px]">
                      <span className={course.free ? "font-semibold text-emerald-300" : "font-semibold text-white/55"}>
                        {course.free ? "Free" : "Paid"}
                      </span>
                      <span className="text-right text-white/35">
                        {course.level} · {course.duration}
                      </span>
                    </div>
                    {course.affiliate ? <p className="mt-2 text-[10px] text-white/25">Partner link</p> : null}
                  </a>
                ))}
              </div>
            ) : (
              <div className="mt-1 rounded-[24px] border border-dashed border-white/15 bg-white/[0.02] px-6 py-14 text-center text-sm text-white/40">
                No courses match that search.
              </div>
            )}
          </section>
        )}
      </div>
    </main>
  );
}
