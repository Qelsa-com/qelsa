"use client";

import { AiMarkdown } from "@/components/ai/AiMarkdown";
import { useSendMatchMessageAction } from "@/features/api/jobsApi";
import { api } from "@/lib/convexApi";
import { toastUnknownError } from "@/lib/errors";
import type { Id } from "@qelsa/backend";
import { usePaginatedQuery } from "convex/react";
import { Send } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

const SUGGESTIONS = [
  "Why this score?",
  "What skills am I missing?",
  "Can I still apply?",
  "How can I improve my match to 90%?",
  "Rewrite my resume for this job.",
];

function visibleMessageText(text: string) {
  return text.split(/\n+JOB SNAPSHOT\n/)[0]?.split(/\n+CANDIDATE\n/)[0]?.trim() ?? text;
}

export function MatchChatThread({
  sessionId,
  preparing,
  updating,
  autoPrompt,
}: {
  sessionId?: string;
  preparing?: boolean;
  updating?: boolean;
  autoPrompt?: string;
}) {
  const sendMessage = useSendMatchMessageAction();
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const sentAuto = useRef<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  const { results } = usePaginatedQuery(
    api.jobMatch.listMessages,
    sessionId ? { sessionId: sessionId as Id<"job_match_sessions"> } : "skip",
    { initialNumItems: 40 },
  );

  const messages = useMemo(
    () => (results ?? []).filter((message) => message.role === "user" || message.role === "assistant"),
    [results],
  );

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, sending, preparing, updating]);

  const submit = async (text: string) => {
    const prompt = text.trim();
    if (!prompt || sending || !sessionId) return;
    setSending(true);
    setDraft("");
    try {
      await sendMessage({ sessionId: sessionId as Id<"job_match_sessions">, prompt });
    } catch (err) {
      toastUnknownError(err, "Could not send that question. Please try again.");
      setDraft(prompt);
    } finally {
      setSending(false);
    }
  };

  useEffect(() => {
    if (!autoPrompt || !sessionId || preparing || sending) return;
    if (!messages.some((message) => message.role === "assistant")) return;
    if (sentAuto.current === `${sessionId}:${autoPrompt}`) return;
    if (messages.some((message) => message.role === "user" && visibleMessageText(message.text) === autoPrompt)) {
      sentAuto.current = `${sessionId}:${autoPrompt}`;
      return;
    }
    sentAuto.current = `${sessionId}:${autoPrompt}`;
    void submit(autoPrompt);
  }, [autoPrompt, sessionId, preparing, messages, sending]);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="scrollbar-hide flex-1 space-y-4 overflow-y-auto p-4 sm:p-5">
        {preparing && (
          <div className="flex items-center gap-3 py-6 text-sm text-white/70">
            <div className="flex gap-1">
              <span className="size-2 animate-bounce rounded-full bg-neon-cyan" style={{ animationDelay: "0ms" }} />
              <span className="size-2 animate-bounce rounded-full bg-neon-purple" style={{ animationDelay: "150ms" }} />
              <span className="size-2 animate-bounce rounded-full bg-neon-pink" style={{ animationDelay: "300ms" }} />
            </div>
            Preparing analysis...
          </div>
        )}
        {!preparing && messages.length === 0 && (
          <p className="text-sm text-white/45">Preparing your match coach…</p>
        )}
        {!preparing && messages.map((message) => {
          const text = visibleMessageText(message.text);
          if (!text) return null;
          return (
            <div key={message.key} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  message.role === "user"
                    ? "bg-gradient-to-r from-neon-purple to-neon-pink text-white"
                    : "border border-glass-border bg-white/[0.04] text-white/85"
                }`}
              >
                {message.role === "assistant" ? <AiMarkdown markdown={text} /> : text}
              </div>
            </div>
          );
        })}
        {updating && !preparing && (
          <p className="text-xs text-white/45">Updating your match…</p>
        )}
        {sending && !preparing && <p className="text-xs text-white/45">Match coach is thinking…</p>}
        <div ref={endRef} />
      </div>

      <div className="border-t border-white/10 p-4">
        <div className="mb-3 flex flex-wrap gap-2">
          {SUGGESTIONS.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              disabled={sending || preparing || !sessionId}
              onClick={() => {
                void submit(suggestion);
              }}
              className="rounded-full border border-white/25 bg-white/[0.08] px-3 py-1.5 text-xs font-semibold text-white hover:border-white/40 hover:bg-white/[0.14] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {suggestion}
            </button>
          ))}
        </div>
        <form
          className="flex items-end gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            void submit(draft);
          }}
        >
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void submit(draft);
              }
            }}
            rows={2}
            disabled={preparing || !sessionId}
            placeholder="Ask how to get ready for this role…"
            className="min-h-[44px] flex-1 resize-none rounded-xl border border-glass-border bg-white/[0.04] px-3 py-2.5 text-sm text-white placeholder:text-white/40 focus:border-neon-cyan focus:outline-none disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={sending || preparing || !draft.trim() || !sessionId}
            className="flex size-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-neon-purple to-neon-pink text-white disabled:opacity-40"
            aria-label="Send"
          >
            <Send className="size-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
