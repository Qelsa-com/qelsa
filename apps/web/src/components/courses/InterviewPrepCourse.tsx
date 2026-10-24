"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/components/ui/utils";
import { api } from "@/lib/convexApi";
import { ArrowLeft, ArrowRight, BarChart3, Check, ChevronDown, ChevronLeft, Layers, ListChecks, MessagesSquare, RotateCcw, Shuffle, Sparkles, Timer } from "lucide-react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { useEffect, useState, type ReactNode } from "react";
import { InterviewTrackDetailSkeleton } from "./courseSkeletons";

type Question = {
  id: string;
  order: number;
  category: string;
  question: string;
  answer: string;
  key_points: string[];
  follow_ups: string[];
  difficulty: string;
  skills: string[];
};

type Track = {
  id: string;
  slug: string;
  title: string;
  role_family: string;
  level: string;
  summary: string;
  description: string;
  skills: string[];
  interview_types: string[];
  question_count: number;
  estimated_minutes: number;
  quality_score: number;
  questions: Question[];
};

function Badge({ children }: { children: ReactNode }) {
  return (
    <span className="rounded-md border border-white/[0.1] bg-white/[0.04] px-2.5 py-1 text-[11px] font-medium text-white/55">
      {children}
    </span>
  );
}

function levelLabel(level?: string) {
  return !level || level.trim().toLowerCase() === "all" ? "All levels" : level;
}

function LearnMode({ questions }: { questions: Question[] }) {
  const [openId, setOpenId] = useState<string | null>(questions[0]?.id ?? null);

  return (
    <div className="space-y-3">
      {questions.map((question, index) => {
        const open = openId === question.id;
        return (
          <article key={question.id} className="overflow-hidden rounded-[18px] border border-white/[0.08] bg-white/[0.025]">
            <button
              type="button"
              onClick={() => setOpenId(open ? null : question.id)}
              aria-expanded={open}
              className="flex w-full items-start gap-3 px-4 py-4 text-left sm:px-5"
            >
              <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg bg-white/[0.06] text-[11px] font-bold text-white/45">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-center gap-2">
                  <span className="rounded-md bg-neon-cyan/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-neon-cyan">{question.category}</span>
                  <span className="text-[10px] text-white/30">{question.difficulty}</span>
                </span>
                <span className="mt-2 block text-[15px] font-semibold leading-snug text-white">{question.question}</span>
              </span>
              <ChevronDown className={cn("mt-1 size-4 shrink-0 text-white/35 transition-transform", open && "rotate-180")} />
            </button>
            {open ? (
              <div className="border-t border-white/[0.07] px-4 pb-5 pt-4 sm:px-5 sm:pl-[68px]">
                <p className="whitespace-pre-wrap text-sm leading-7 text-white/65">{question.answer}</p>
                {question.key_points.length ? (
                  <div className="mt-5 rounded-xl border border-emerald-400/15 bg-emerald-400/[0.04] p-3.5">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-emerald-300">What to hit</p>
                    <ul className="mt-2 space-y-1.5">
                      {question.key_points.map((point) => (
                        <li key={point} className="flex items-start gap-2 text-xs leading-relaxed text-white/55">
                          <Check className="mt-0.5 size-3.5 shrink-0 text-emerald-300" />
                          {point}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
                {question.follow_ups.length ? (
                  <div className="mt-4">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/35">Likely follow-ups</p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {question.follow_ups.map((followUp) => (
                        <span key={followUp} className="rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[11px] text-white/50">
                          {followUp}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            ) : null}
          </article>
        );
      })}
    </div>
  );
}

function FlashcardMode({ questions }: { questions: Question[] }) {
  const [order, setOrder] = useState(() => questions.map((_, index) => index));
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  const current = questions[order[index]];
  const progress = questions.length ? ((index + 1) / questions.length) * 100 : 0;

  const move = (next: number) => {
    setIndex(Math.max(0, Math.min(questions.length - 1, next)));
    setFlipped(false);
  };

  const shuffle = () => {
    setOrder((previous) => {
      const next = [...previous];
      for (let i = next.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1));
        [next[i], next[j]] = [next[j], next[i]];
      }
      return next;
    });
    setIndex(0);
    setFlipped(false);
  };

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === " " || event.key === "Enter") {
        event.preventDefault();
        setFlipped((value) => !value);
      }
      if (event.key === "ArrowRight") move(index + 1);
      if (event.key === "ArrowLeft") move(index - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index, questions.length]);

  if (!current) return null;

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/35">
            Flashcard {index + 1} of {questions.length}
          </p>
          <p className="mt-1 text-xs text-white/30">Tap the card or press Space to flip · arrows to move</p>
        </div>
        <button type="button" onClick={shuffle} className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-[11px] font-medium text-white/45 transition-colors hover:text-white">
          <Shuffle className="size-3" />
          Shuffle
        </button>
      </div>

      <div className="h-1 overflow-hidden rounded-full bg-white/[0.06]">
        <div className="h-full rounded-full bg-gradient-to-r from-neon-cyan via-neon-purple to-neon-pink transition-all duration-300" style={{ width: `${progress}%` }} />
      </div>

      <button
        type="button"
        onClick={() => setFlipped((value) => !value)}
        className="relative mt-5 flex min-h-[330px] w-full flex-col rounded-[24px] border border-white/[0.1] bg-[#0b0b16] p-6 text-left shadow-[0_20px_80px_-40px_rgba(124,47,243,0.45)] transition-colors hover:border-white/20 sm:min-h-[360px] sm:p-8"
      >
        <div className="flex items-center justify-between gap-3">
          <span className="rounded-md bg-neon-cyan/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-neon-cyan">{current.category}</span>
          <span className="text-[10px] font-medium text-white/30">{flipped ? "Answer" : "Question"}</span>
        </div>
        <div className="flex flex-1 flex-col justify-center py-8">
          {flipped ? (
            <div className="max-h-[46vh] overflow-y-auto pr-1">
              <p className="whitespace-pre-wrap text-sm leading-7 text-white/70">{current.answer}</p>
              {current.key_points.length ? (
                <ul className="mt-5 space-y-2">
                  {current.key_points.map((point) => (
                    <li key={point} className="flex items-start gap-2 text-xs leading-relaxed text-white/50">
                      <Check className="mt-0.5 size-3.5 shrink-0 text-emerald-300" />
                      {point}
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          ) : (
            <p className="text-center text-xl font-semibold leading-snug text-white sm:text-2xl">{current.question}</p>
          )}
        </div>
        <div className="flex items-center justify-between border-t border-white/[0.07] pt-4 text-[11px] text-white/30">
          <span>{current.difficulty}</span>
          <span className="inline-flex items-center gap-1.5">
            {flipped ? "Tap to see the question" : "Tap to reveal the answer"}
            <Layers className="size-3.5" />
          </span>
        </div>
      </button>

      <div className="mt-4 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => move(index - 1)}
          disabled={index === 0}
          className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-xs font-semibold text-white/60 transition-colors hover:text-white disabled:opacity-35"
        >
          <ChevronLeft className="size-4" />
          Previous
        </button>
        <button
          type="button"
          onClick={index === questions.length - 1 ? shuffle : () => move(index + 1)}
          className="gradient-primary inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold text-white transition-opacity hover:opacity-90"
        >
          {index === questions.length - 1 ? (
            <>
              <RotateCcw className="size-4" />
              Start over
            </>
          ) : (
            <>
              Next
              <ArrowRight className="size-4" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}

export function InterviewPrepCourse({ slug }: { slug?: string }) {
  const router = useRouter();
  const track = useQuery(api.interviewPrep.getBySlug, slug ? { slug } : "skip") as Track | undefined;
  const [mode, setMode] = useState<"questions" | "flashcards">("questions");

  if (!slug || track === undefined) {
    return <InterviewTrackDetailSkeleton />;
  }

  if (track === null) {
    return (
      <div className="mx-auto max-w-xl px-5 py-24 text-center">
        <p className="text-sm font-semibold text-white">This interview prep track is not available.</p>
        <Button type="button" onClick={() => router.push("/courses")} className="mt-5 rounded-full" variant="outline">
          Back to Practice
        </Button>
      </div>
    );
  }

  const prompt = `Help me prepare for a ${track.role_family} interview using the Qelsa track "${track.title}". Ask me questions one at a time and give feedback after each answer.`;
  const tags = Array.from(
    new Map(
      [...track.interview_types, ...track.skills].map((tag) => [tag.trim().toLowerCase(), tag.trim()]),
    ).values(),
  ).filter(Boolean);

  return (
    <main className="min-h-screen text-white">
      <Head>
        <title>{track.title} · Qelsa Learn &amp; Practice</title>
      </Head>
      <div className="mx-auto w-full max-w-7xl px-5 py-8 sm:px-8 lg:py-12">
        <Link href="/courses" className="inline-flex items-center gap-1.5 text-xs font-semibold text-white/45 transition-colors hover:text-white">
          <ArrowLeft className="size-3.5" />
          Back to Practice
        </Link>

        <div className="mt-5 rounded-[24px] border border-white/[0.09] bg-[#0b0b16] p-5 sm:p-7">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
            <div>
              <div className="flex items-start gap-3">
                <span className="flex size-12 shrink-0 items-center justify-center rounded-xl border border-neon-cyan/25 bg-neon-cyan/[0.08] text-neon-cyan">
                  <MessagesSquare className="size-6" />
                </span>
                <div className="pt-0.5">
                  <p className="text-sm font-semibold text-white">Interview track</p>
                  <p className="mt-0.5 text-[11px] text-white/35">Built and quality-checked by Qelsa</p>
                </div>
              </div>

              <h1 className="mt-5 text-3xl font-extrabold tracking-[-0.03em] sm:text-4xl lg:text-5xl">{track.title}</h1>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/50">{track.summary}</p>

              <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-white/45">
                <span className="inline-flex items-center gap-1.5">
                  <ListChecks className="size-3.5" />
                  {track.question_count} questions
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Timer className="size-3.5" />
                  {track.estimated_minutes} min
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <BarChart3 className="size-3.5" />
                  {levelLabel(track.level)}
                </span>
              </div>

              <div className="mt-5 flex flex-wrap gap-1.5">
                {tags.slice(0, 7).map((tag) => (
                  <Badge key={tag}>{tag}</Badge>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-white/[0.1] bg-white/[0.025] p-5">
              <p className="text-base font-semibold text-white">Mock interview</p>
              <p className="mt-2 text-xs leading-relaxed text-white/45">
                The agent asks one question at a time and gives feedback on each answer.
              </p>
              <Link
                href={`/agent?prompt=${encodeURIComponent(prompt)}`}
                className="mt-4 inline-flex h-11 w-full items-center justify-center gap-1.5 rounded-full bg-gradient-to-r from-[#7c3aed] to-[#db2777] px-4 text-sm font-semibold text-white shadow-lg transition-all hover:opacity-95"
              >
                <Sparkles className="size-4" />
                Start mock interview
              </Link>
            </div>
          </div>
        </div>

        <div role="tablist" aria-label="Track content" className="mt-7 flex gap-7 border-b border-white/[0.08]">
          <button
            type="button"
            role="tab"
            aria-selected={mode === "questions"}
            onClick={() => setMode("questions")}
            className={cn(
              "relative -mb-px pb-3 text-sm font-semibold transition-colors",
              mode === "questions" ? "text-white" : "text-white/40 hover:text-white/70",
            )}
          >
            Questions
            {mode === "questions" ? <span className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-white" /> : null}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === "flashcards"}
            onClick={() => setMode("flashcards")}
            className={cn(
              "relative -mb-px pb-3 text-sm font-semibold transition-colors",
              mode === "flashcards" ? "text-white" : "text-white/40 hover:text-white/70",
            )}
          >
            Flashcards
            {mode === "flashcards" ? <span className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-white" /> : null}
          </button>
        </div>

        <div className="mt-5">{mode === "questions" ? <LearnMode questions={track.questions} /> : <FlashcardMode questions={track.questions} />}</div>
      </div>
    </main>
  );
}
