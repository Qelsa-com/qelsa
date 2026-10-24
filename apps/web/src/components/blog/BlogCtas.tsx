"use client";

import { useAuth } from "@/contexts/AuthContext";
import { ArrowRight, BriefcaseBusiness, Sparkles } from "lucide-react";
import { useRouter } from "next/router";

export function BlogCtas({ postTitle }: { postTitle: string }) {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();

  const go = (target: string) => {
    if (isLoading) return;
    router.push(isAuthenticated ? target : `/auth?returnUrl=${encodeURIComponent(target)}`);
  };

  const agentPrompt = `Help me apply the advice from "${postTitle}" to my job search. Ask me about my experience first, then give me a practical next step.`;
  const agentHref = `/agent?prompt=${encodeURIComponent(agentPrompt)}`;

  return (
    <div className="flex flex-col gap-2 sm:flex-row">
      <button
        type="button"
        disabled={isLoading}
        onClick={() => go("/jobs")}
        className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-white px-5 text-sm font-semibold text-[#06060f] transition-opacity hover:opacity-90 disabled:cursor-wait disabled:opacity-60"
      >
        <BriefcaseBusiness className="size-4" />
        Browse jobs
        <ArrowRight className="size-4" />
      </button>
      <button
        type="button"
        disabled={isLoading}
        onClick={() => go(agentHref)}
        className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-white/15 bg-white/[0.04] px-5 text-sm font-semibold text-white/80 transition-colors hover:border-neon-cyan/30 hover:text-white disabled:cursor-wait disabled:opacity-60"
      >
        <Sparkles className="size-4 text-neon-cyan" />
        Prep with Qelsa Agent
      </button>
    </div>
  );
}
