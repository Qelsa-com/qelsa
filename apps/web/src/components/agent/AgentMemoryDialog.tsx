"use client";

import { api } from "@/lib/convexApi";
import { toastUnknownError } from "@/lib/errors";
import { useMutation, useQuery } from "convex/react";
import { Brain, ChevronDown, Loader2, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const CATEGORY_LABELS: Record<string, string> = {
  preference: "Preference",
  constraint: "Constraint",
  goal: "Goal",
  experience: "Experience",
  coaching: "Coaching",
  other: "Other",
};

type Memory = {
  memory_id: string;
  text: string;
  category: string;
  updated_at: number;
  expires_at: number | null;
};

export function AgentMemoryDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const data = useQuery(api.agentMemory.listMemories, open ? {} : "skip");
  const addMemory = useMutation(api.agentMemory.addMemory);
  const deleteMemory = useMutation(api.agentMemory.deleteMemory);
  const [text, setText] = useState("");
  const [category, setCategory] = useState("preference");
  const [busy, setBusy] = useState(false);

  const memories = (data?.memories ?? []) as Memory[];
  const count = data?.count ?? 0;
  const max = data?.max ?? 40;

  const handleAdd = async () => {
    const value = text.trim();
    if (!value || busy) return;
    setBusy(true);
    try {
      await addMemory({ text: value, category: category as any });
      setText("");
      toast.success("Saved to Agent memory");
    } catch (error) {
      toastUnknownError(error, "Couldn't save that memory.");
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (memoryId: string) => {
    try {
      await deleteMemory({ memoryId: memoryId as any });
      toast.success("Memory removed");
    } catch (error) {
      toastUnknownError(error, "Couldn't remove that memory.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[85dvh] w-[calc(100%-2rem)] max-w-lg flex-col gap-0 overflow-hidden border-white/10 bg-[#0b0b16] p-0 text-white shadow-2xl [&>button]:top-2 [&>button]:right-2 [&>button]:size-11">
        <DialogHeader className="border-b border-white/[0.08] px-4 py-3.5 text-left sm:px-5">
          <DialogTitle className="flex items-center gap-2 text-[15px] text-white">
            <span className="flex size-7 items-center justify-center rounded-lg border border-neon-purple/25 bg-neon-purple/10 text-neon-purple">
              <Brain className="size-4" />
            </span>
            What Qelsa remembers
          </DialogTitle>
          <DialogDescription className="sr-only">
            Facts Qelsa remembers about you.
          </DialogDescription>
        </DialogHeader>

        <div className="border-b border-white/[0.08] px-4 py-3 sm:px-5">
          <div className="flex items-center justify-between gap-3">
            <label htmlFor="agent-memory-input" className="text-[11px] font-medium text-white/60">
              Add a memory
            </label>
            <span className="shrink-0 text-[10px] tabular-nums text-white/30">{data ? `${count}/${max}` : ""}</span>
          </div>
          <div className="mt-2 flex flex-col gap-2 sm:flex-row">
            <input
              id="agent-memory-input"
              value={text}
              onChange={(event) => setText(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  void handleAdd();
                }
              }}
              maxLength={240}
              placeholder="e.g. Remote roles, 25–35 LPA"
              className="h-11 min-w-0 w-full rounded-xl border border-white/[0.1] bg-[#12121f] px-3.5 text-[13px] text-white/85 placeholder:text-white/30 focus:border-neon-purple/50 focus:outline-none focus:ring-1 focus:ring-neon-purple/20 sm:flex-1"
            />
            <div className="flex shrink-0 gap-2">
              <div className="relative min-w-0 flex-1 sm:w-[136px] sm:flex-none">
                <select
                  value={category}
                  onChange={(event) => setCategory(event.target.value)}
                  className="h-11 w-full appearance-none rounded-xl border border-white/[0.1] bg-[#12121f] pl-3.5 pr-9 text-[12px] text-white/75 focus:border-neon-purple/50 focus:outline-none focus:ring-1 focus:ring-neon-purple/20"
                  aria-label="Memory category"
                >
                  {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-white/35" />
              </div>
              <button
                type="button"
                onClick={() => void handleAdd()}
                disabled={!text.trim() || busy || count >= max}
                className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#623dd6] via-[#8433ae] to-[#be2680] text-white transition-opacity hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Add memory"
              >
                {busy ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-5" />}
              </button>
            </div>
          </div>
          <p className="mt-2 text-[11px] leading-relaxed text-white/35">
            Short, lasting facts only. Avoid passwords and sensitive IDs.
          </p>
        </div>

        <div className="max-h-[45dvh] min-h-0 overflow-y-auto px-4 py-3 sm:px-5">
          {!data ? (
            <div className="flex justify-center py-8">
              <Loader2 className="size-5 animate-spin text-white/30" />
            </div>
          ) : memories.length === 0 ? (
            <div className="py-6 text-center sm:py-8">
              <p className="text-[12px] text-white/45">Nothing saved yet.</p>
            </div>
          ) : (
            <ul className="space-y-2">
              {memories.map((memory) => (
                <li
                  key={memory.memory_id}
                  className="group flex items-start gap-2 rounded-xl border border-white/[0.07] bg-white/[0.03] px-3 py-2.5"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="rounded-full border border-white/[0.08] bg-white/[0.04] px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-white/40">
                        {CATEGORY_LABELS[memory.category] ?? "Other"}
                      </span>
                      {memory.expires_at ? (
                        <span className="text-[9px] text-amber-300/60">
                          expires {new Date(memory.expires_at).toLocaleDateString()}
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-1 text-[12px] leading-relaxed text-white/75">{memory.text}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => void handleDelete(memory.memory_id)}
                    aria-label="Remove memory"
                    className="flex size-11 shrink-0 items-center justify-center rounded-lg text-white/25 transition-colors hover:bg-rose-400/10 hover:text-rose-300 sm:size-9"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
