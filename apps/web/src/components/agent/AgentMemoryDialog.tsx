"use client";

import { api } from "@/lib/convexApi";
import { toastUnknownError } from "@/lib/errors";
import { useMutation, useQuery } from "convex/react";
import { Brain, Loader2, Plus, Trash2 } from "lucide-react";
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
      <DialogContent className="flex max-h-[85vh] w-[calc(100%-2rem)] max-w-lg flex-col gap-0 overflow-hidden border-white/10 bg-[#0b0b16] p-0 text-white shadow-2xl">
        <DialogHeader className="border-b border-white/[0.08] px-5 py-4 text-left">
          <DialogTitle className="flex items-center gap-2 text-[15px] text-white">
            <span className="flex size-7 items-center justify-center rounded-lg border border-neon-purple/25 bg-neon-purple/10 text-neon-purple">
              <Brain className="size-4" />
            </span>
            What Qelsa remembers
          </DialogTitle>
          <DialogDescription className="text-[11px] leading-relaxed text-white/45">
            Short facts the Agent can use across conversations. Add, edit, or remove them anytime.
          </DialogDescription>
        </DialogHeader>

        <div className="border-b border-white/[0.08] px-5 py-3">
          <div className="flex gap-2">
            <input
              value={text}
              onChange={(event) => setText(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  void handleAdd();
                }
              }}
              maxLength={240}
              placeholder="e.g. I want remote fintech roles, 25–35 LPA"
              className="h-9 min-w-0 flex-1 rounded-lg border border-white/[0.1] bg-white/[0.04] px-3 text-[12px] text-white/85 placeholder:text-white/30 focus:border-neon-purple/50 focus:outline-none"
            />
            <select
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              className="h-9 w-[112px] shrink-0 rounded-lg border border-white/[0.1] bg-[#12121f] px-2 text-[11px] text-white/70 focus:border-neon-purple/50 focus:outline-none"
              aria-label="Memory category"
            >
              {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => void handleAdd()}
              disabled={!text.trim() || busy || count >= max}
              className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#623dd6] via-[#8433ae] to-[#be2680] text-white transition-opacity hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Add memory"
            >
              {busy ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
            </button>
          </div>
          <p className="mt-2 text-[10px] text-white/30">
            {count}/{max} saved. The Agent only keeps durable preferences you state — never passwords or sensitive IDs.
          </p>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-3">
          {!data ? (
            <div className="flex justify-center py-8">
              <Loader2 className="size-5 animate-spin text-white/30" />
            </div>
          ) : memories.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-[13px] font-medium text-white/60">Nothing saved yet.</p>
              <p className="mt-1 text-[11px] text-white/35">
                Tell the Agent something durable, like “remember I only want remote roles.”
              </p>
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
                    className="flex size-7 shrink-0 items-center justify-center rounded-md text-white/25 transition-colors hover:bg-rose-400/10 hover:text-rose-300"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="border-t border-white/[0.08] px-5 py-3 text-[10px] leading-relaxed text-white/30">
          The Agent also reads your profile, applications, and saved searches. Memory is separate so you can control what it carries between chats.
        </div>
      </DialogContent>
    </Dialog>
  );
}
