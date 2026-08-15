"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useStartQelsaMatchAction } from "@/features/api/jobsApi";
import type { Id } from "@qelsa/backend";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

export function useOpenQelsaMatch() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const start = useStartQelsaMatchAction();
  const [pendingId, setPendingId] = useState<string | null>(null);

  const open = async (jobId: string | number) => {
    const id = String(jobId);
    if (!isAuthenticated) {
      router.push(`/auth?actionType=profile&returnUrl=${encodeURIComponent(`/jobs/${id}`)}`);
      return;
    }
    setPendingId(id);
    try {
      const session = await start({ jobId: id as Id<"jobs"> });
      router.push(`/jobs/match/${session.id}`);
    } catch (err) {
      console.error("Match start failed:", err);
      toast.error(err instanceof Error ? err.message : "Could not start AI Match.");
    } finally {
      setPendingId(null);
    }
  };

  return { open, pendingId };
}
