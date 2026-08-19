"use client";

import { MatchChatThread } from "@/components/job/MatchChatThread";
import { useStartQelsaMatchAction } from "@/features/api/jobsApi";
import { useAuth } from "@/contexts/AuthContext";
import type { Id } from "@qelsa/backend";
import { Sparkles, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toastUnknownError } from "@/lib/errors";

export function MatchChatDrawer({
  isOpen,
  onClose,
  jobId,
  jobTitle,
  company,
  existingSessionId,
}: {
  isOpen: boolean;
  onClose: () => void;
  jobId?: string;
  jobTitle: string;
  company?: string;
  existingSessionId?: string;
}) {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const start = useStartQelsaMatchAction();
  const startRef = useRef(start);
  startRef.current = start;
  const requestIdRef = useRef(0);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [preparing, setPreparing] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [chatEpoch, setChatEpoch] = useState(0);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!isOpen) {
      setSessionId(null);
      setPreparing(false);
      setUpdating(false);
      setChatEpoch(0);
      return;
    }
    if (!jobId) return;
    if (!isAuthenticated) {
      router.push(`/auth?actionType=profile&returnUrl=${encodeURIComponent(`/jobs/${jobId}`)}`);
      onCloseRef.current();
      return;
    }

    const requestId = ++requestIdRef.current;
    let updateTimer: ReturnType<typeof setTimeout> | undefined;
    if (existingSessionId) {
      setSessionId(existingSessionId);
      setPreparing(false);
      updateTimer = setTimeout(() => {
        if (requestId === requestIdRef.current) setUpdating(true);
      }, 600);
    } else {
      setSessionId(null);
      setPreparing(true);
    }

    void startRef
      .current({ jobId: jobId as Id<"jobs"> })
      .then((session) => {
        if (requestId !== requestIdRef.current) return;
        setSessionId(session.id);
        setPreparing(false);
        setUpdating(false);
      })
      .catch((err: unknown) => {
        if (requestId !== requestIdRef.current) return;
        toastUnknownError(err, "Could not start AI Match. Please try again.");
        setPreparing(false);
        setUpdating(false);
        if (!existingSessionId) onCloseRef.current();
      })
      .finally(() => {
        if (updateTimer) clearTimeout(updateTimer);
      });

    return () => {
      requestIdRef.current += 1;
      if (updateTimer) clearTimeout(updateTimer);
    };
  }, [isOpen, jobId, isAuthenticated, existingSessionId, router]);

  const handleStartOver = () => {
    if (!jobId || preparing) return;
    const requestId = ++requestIdRef.current;
    setPreparing(true);
    setUpdating(false);
    void startRef
      .current({ jobId: jobId as Id<"jobs">, refresh: true })
      .then((session) => {
        if (requestId !== requestIdRef.current) return;
        setSessionId(session.id);
        setChatEpoch((n) => n + 1);
        setPreparing(false);
      })
      .catch((err: unknown) => {
        if (requestId !== requestIdRef.current) return;
        toastUnknownError(err, "Could not start over. Please try again.");
        setPreparing(false);
      });
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="glass-strong fixed inset-y-0 right-0 z-50 flex w-full flex-col overflow-hidden border-l border-glass-border md:w-[500px] lg:w-[560px]">
        <div className="flex items-center justify-between border-b border-glass-border px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-r from-neon-purple to-neon-cyan">
              <Sparkles className="size-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">Qelsa AI</h2>
              <p className="text-xs text-white/50">
                {jobTitle}
                {company ? ` · ${company}` : ""}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {sessionId ? (
              <button
                type="button"
                disabled={preparing}
                onClick={handleStartOver}
                className="rounded-full px-3 py-1.5 text-xs text-white/45 hover:text-white disabled:opacity-40"
              >
                Start over
              </button>
            ) : null}
            <button onClick={onClose} className="flex size-9 items-center justify-center rounded-full text-white/70 hover:bg-white/10 hover:text-white" aria-label="Close">
              <X className="size-5" />
            </button>
          </div>
        </div>
        <div className="flex min-h-0 flex-1 flex-col">
          <MatchChatThread
            key={`${sessionId ?? "none"}-${chatEpoch}`}
            sessionId={sessionId ?? undefined}
            preparing={preparing || !sessionId}
            updating={updating}
          />
        </div>
        <button
          type="button"
          onClick={() => router.push("/jobs/match")}
          className="border-t border-white/10 px-5 py-3 text-left text-xs text-white/45 hover:text-neon-cyan"
        >
          Checking a job that isn&apos;t listed on Qelsa?
        </button>
      </div>
    </>
  );
}
