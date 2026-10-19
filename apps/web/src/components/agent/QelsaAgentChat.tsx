"use client";

/**
 * Qelsa Agent chat.
 *
 * Desktop: conversation rail + chat column. Mobile: single column with the
 * conversation rail in an overlay panel. Streams assistant output and tool
 * calls from the Agent component and pauses write tools for human approval.
 */

import { AiMarkdown } from "@/components/ai/AiMarkdown";
import { Button } from "@/components/ui/button";
import { cn } from "@/components/ui/utils";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/convexApi";
import { toastUnknownError } from "@/lib/errors";
import { useUIMessages } from "@convex-dev/agent/react";
import { useMutation, useQuery } from "convex/react";
import {
  ArrowUp,
  Loader2,
  MessageSquarePlus,
  PanelLeft,
  Plus,
  Sparkles,
  Trash2,
  WifiOff,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { AgentToolCard } from "./AgentToolCard";
import {
  type AgentToolPart,
  type AgentUIMessage,
  SUGGESTIONS,
  toolNameOf,
} from "./agentToolMeta";

type Conversation = { threadId: string; title: string; updatedAt: number };

function firstNameOf(name?: string | null) {
  const trimmed = name?.trim();
  if (!trimmed) return "there";
  const first = trimmed.split(/\s+/)[0];
  if (first === first.toUpperCase()) {
    // Imported profiles often store the name in all caps; soften it for greetings.
    return first.charAt(0) + first.slice(1).toLowerCase();
  }
  return first;
}

function relativeStamp(timestamp: number) {
  const seconds = Math.max(1, (Date.now() - timestamp) / 1000);
  if (seconds < 60) return "Just now";
  if (seconds < 3_600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86_400) return `${Math.floor(seconds / 3_600)}h ago`;
  const days = Math.floor(seconds / 86_400);
  if (days < 7) return `${days}d ago`;
  return new Date(timestamp).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function isTextPart(part: any): part is { type: "text"; text: string } {
  return part?.type === "text" && typeof part.text === "string";
}

function isToolPart(part: any): part is AgentToolPart {
  return typeof part?.type === "string" && part.type.startsWith("tool-");
}

function AssistantAvatar() {
  return (
    <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-neon-cyan via-neon-purple to-neon-pink shadow-lg shadow-purple-900/25">
      <Sparkles className="size-4 text-black" />
    </div>
  );
}

function TypingDots() {
  return (
    <div className="flex items-center gap-1 py-2">
      <span className="size-1.5 animate-pulse rounded-full bg-neon-cyan" />
      <span className="size-1.5 animate-pulse rounded-full bg-neon-purple [animation-delay:150ms]" />
      <span className="size-1.5 animate-pulse rounded-full bg-neon-pink [animation-delay:300ms]" />
    </div>
  );
}

function MessageBubble({
  message,
  resolvingApprovalId,
  onApprove,
  onDeny,
}: {
  message: AgentUIMessage;
  resolvingApprovalId: string | null;
  onApprove: (approvalId: string) => void;
  onDeny: (approvalId: string) => void;
}) {
  const parts = (message.parts ?? []) as any[];

  if (message.role === "user") {
    const text =
      typeof message.text === "string" && message.text.trim()
        ? message.text
        : parts.filter(isTextPart).map((part) => part.text).join("\n");
    if (!text.trim()) return null;
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] rounded-2xl rounded-br-md border border-sky-400/20 bg-gradient-to-br from-sky-500/[0.14] to-purple-500/[0.14] px-4 py-2.5 text-[14px] leading-relaxed text-white/90 whitespace-pre-wrap">
          {text}
        </div>
      </div>
    );
  }

  if (message.role !== "assistant") return null;

  const streaming = message.status === "streaming";
  const visibleParts = parts.filter((part) => {
    if (isTextPart(part)) return part.text.trim().length > 0;
    return isToolPart(part);
  });
  // A provider hiccup can leave an empty placeholder behind. Don't stream dots
  // forever: surface a retry hint once the message has clearly gone stale.
  const stalled =
    streaming &&
    visibleParts.length === 0 &&
    typeof message._creationTime === "number" &&
    Date.now() - message._creationTime > 120_000;

  return (
    <div className="flex gap-3">
      <AssistantAvatar />
      <div className="min-w-0 flex-1 space-y-2.5">
        {visibleParts.map((part, index) => {
          if (isTextPart(part)) {
            return (
              <AiMarkdown
                key={`text-${index}`}
                markdown={part.text}
                newTabLinks
                className="max-w-none text-[14px] leading-relaxed text-white/85"
              />
            );
          }
          const tool = part as AgentToolPart;
          return (
            <AgentToolCard
              key={tool.toolCallId ?? `${toolNameOf(tool)}-${index}`}
              part={tool}
              resolving={Boolean(tool.approval?.id && tool.approval.id === resolvingApprovalId)}
              onApprove={onApprove}
              onDeny={onDeny}
            />
          );
        })}
        {streaming && visibleParts.length === 0 && !stalled && <TypingDots />}
        {stalled && (
          <p className="text-[12px] text-white/40">No response came back — send that again and I&apos;ll retry.</p>
        )}
      </div>
    </div>
  );
}

function ConversationList({
  conversations,
  activeThreadId,
  loading,
  onSelect,
  onDelete,
}: {
  conversations: Conversation[];
  activeThreadId: string | null;
  loading: boolean;
  onSelect: (threadId: string) => void;
  onDelete: (threadId: string) => void;
}) {
  if (loading) {
    return (
      <div className="space-y-1.5 px-1">
        {[0, 1, 2].map((index) => (
          <div key={index} className="h-9 animate-pulse rounded-lg bg-white/[0.04]" />
        ))}
      </div>
    );
  }
  if (!conversations.length) {
    return <p className="px-3 py-2 text-[12px] text-white/35">No conversations yet.</p>;
  }
  return (
    <div className="space-y-0.5">
      {conversations.map((conversation) => {
        const active = conversation.threadId === activeThreadId;
        return (
          <div
            key={conversation.threadId}
            className={cn(
              "group flex items-center gap-1 rounded-lg transition-colors",
              active ? "bg-white/[0.07]" : "hover:bg-white/[0.04]",
            )}
          >
            <button
              type="button"
              onClick={() => onSelect(conversation.threadId)}
              className="flex min-w-0 flex-1 flex-col items-start px-2.5 py-2 text-left"
            >
              <span className={cn("w-full truncate text-[13px] font-medium", active ? "text-white" : "text-white/65")}>
                {conversation.title}
              </span>
              <span className="text-[10px] text-white/30">{relativeStamp(conversation.updatedAt)}</span>
            </button>
            <button
              type="button"
              aria-label="Delete conversation"
              onClick={(event) => {
                event.stopPropagation();
                onDelete(conversation.threadId);
              }}
              className="mr-1 flex size-7 shrink-0 items-center justify-center rounded-md text-white/25 opacity-0 transition-all hover:bg-rose-400/10 hover:text-rose-300 focus-visible:opacity-100 group-hover:opacity-100 lg:size-6"
            >
              <Trash2 className="size-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}

function RailHeader({ onClose }: { onClose?: () => void }) {
  return (
    <div className="flex items-center gap-3 border-b border-white/[0.08] px-4 py-4">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-neon-cyan via-neon-purple to-neon-pink shadow-lg shadow-purple-900/30">
        <Sparkles className="size-4 text-black" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-white">Qelsa Agent</p>
        <p className="truncate text-[11px] text-white/45">Your career copilot</p>
      </div>
      {onClose && (
        <button
          type="button"
          aria-label="Close conversations"
          onClick={onClose}
          className="flex size-8 shrink-0 items-center justify-center rounded-full border border-white/[0.1] bg-white/[0.04] text-white/60"
        >
          <X className="size-4" />
        </button>
      )}
    </div>
  );
}

export function QelsaAgentChat() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [mobileRailOpen, setMobileRailOpen] = useState(false);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [awaitingReply, setAwaitingReply] = useState(false);
  const [resolvingApprovalId, setResolvingApprovalId] = useState<string | null>(null);

  const conversationQuery = useQuery(api.qelsaAgent.listConversations, isAuthenticated ? {} : "skip");
  const agentStatus = useQuery(api.qelsaAgent.agentStatus, {});
  const createConversation = useMutation(api.qelsaAgent.createConversation);
  const deleteConversation = useMutation(api.qelsaAgent.deleteConversation);
  const sendPrompt = useMutation(api.qelsaAgent.sendPrompt);
  const submitApproval = useMutation(api.qelsaAgent.submitApproval);

  const conversations = useMemo(() => (conversationQuery ?? []) as Conversation[], [conversationQuery]);
  const configured = agentStatus?.configured ?? true;

  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const stickToBottom = useRef(true);
  const initializedRail = useRef(false);
  const pendingThread = useRef<string | null>(null);

  // Restore the last opened conversation, then reconcile stale local state.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem("qelsa-agent-thread");
    if (stored) setActiveThreadId(stored);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !activeThreadId) return;
    window.localStorage.setItem("qelsa-agent-thread", activeThreadId);
  }, [activeThreadId]);

  useEffect(() => {
    if (!conversationQuery) return;
    if (pendingThread.current && conversations.some((item) => item.threadId === pendingThread.current)) {
      pendingThread.current = null;
    }
    if (!initializedRail.current) {
      initializedRail.current = true;
      if (activeThreadId && conversations.some((item) => item.threadId === activeThreadId)) return;
      setActiveThreadId(conversations[0]?.threadId ?? null);
      return;
    }
    // A conversation deleted elsewhere should not leave the chat pointed at it.
    if (
      activeThreadId &&
      activeThreadId !== pendingThread.current &&
      !conversations.some((item) => item.threadId === activeThreadId)
    ) {
      setActiveThreadId(conversations[0]?.threadId ?? null);
    }
  }, [conversationQuery, conversations, activeThreadId]);

  const messagesQuery = useUIMessages(
    api.qelsaAgent.listMessages,
    isAuthenticated && activeThreadId ? { threadId: activeThreadId } : "skip",
    { initialNumItems: 20, stream: true },
  );

  const messages = useMemo(
    () => (((messagesQuery as any)?.results ?? []) as AgentUIMessage[]),
    [messagesQuery],
  );
  const messageStatus = (messagesQuery as any)?.status as string | undefined;
  const loadMore = (messagesQuery as any)?.loadMore as ((count: number) => void) | undefined;
  const streaming = messages.some((message) => message.status === "streaming");

  // Clear the "agent is thinking" indicator once anything starts streaming back.
  useEffect(() => {
    if (!awaitingReply) return;
    if (streaming) {
      setAwaitingReply(false);
      return;
    }
    const last = messages[messages.length - 1];
    if (last?.role === "assistant") setAwaitingReply(false);
  }, [awaitingReply, streaming, messages]);

  useEffect(() => {
    if (!awaitingReply) return;
    const timeout = window.setTimeout(() => setAwaitingReply(false), 90_000);
    return () => window.clearTimeout(timeout);
  }, [awaitingReply]);

  // Keep the view pinned to the newest content unless the user scrolled up.
  useEffect(() => {
    if (!stickToBottom.current) return;
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages, awaitingReply, activeThreadId]);

  useEffect(() => {
    const element = textareaRef.current;
    if (!element) return;
    element.style.height = "0px";
    element.style.height = `${Math.min(element.scrollHeight, 152)}px`;
  }, [input]);

  const handleScroll = useCallback(() => {
    const element = scrollRef.current;
    if (!element) return;
    stickToBottom.current = element.scrollHeight - element.scrollTop - element.clientHeight < 120;
  }, []);

  const ensureThread = useCallback(async () => {
    if (activeThreadId) return activeThreadId;
    const { threadId } = await createConversation({});
    pendingThread.current = threadId;
    setActiveThreadId(threadId);
    return threadId;
  }, [activeThreadId, createConversation]);

  const handleSend = useCallback(
    async (override?: string) => {
      const text = (override ?? input).trim();
      if (!text || sending) return;
      setSending(true);
      setInput("");
      stickToBottom.current = true;
      try {
        const threadId = await ensureThread();
        await sendPrompt({ threadId, prompt: text });
        setAwaitingReply(true);
      } catch (error) {
        toastUnknownError(error, "Couldn't send that message.");
        setInput((current) => (current ? current : text));
      } finally {
        setSending(false);
      }
    },
    [ensureThread, input, sendPrompt, sending],
  );

  const handleNewChat = useCallback(async () => {
    try {
      const { threadId } = await createConversation({});
      pendingThread.current = threadId;
      setActiveThreadId(threadId);
      setInput("");
      setMobileRailOpen(false);
      stickToBottom.current = true;
    } catch (error) {
      toastUnknownError(error, "Couldn't start a new chat.");
    }
  }, [createConversation]);

  const handleDelete = useCallback(
    async (threadId: string) => {
      try {
        await deleteConversation({ threadId });
        if (threadId === activeThreadId) {
          const next = conversations.find((item) => item.threadId !== threadId)?.threadId ?? null;
          setActiveThreadId(next);
        }
        toast.success("Conversation deleted");
      } catch (error) {
        toastUnknownError(error, "Couldn't delete that conversation.");
      }
    },
    [activeThreadId, conversations, deleteConversation],
  );

  const handleApproval = useCallback(
    async (approvalId: string, approved: boolean) => {
      if (!activeThreadId) return;
      setResolvingApprovalId(approvalId);
      if (approved) setAwaitingReply(true);
      try {
        await submitApproval({ threadId: activeThreadId, approvalId, approved });
      } catch (error) {
        toastUnknownError(error, "Couldn't update that action.");
        setAwaitingReply(false);
      } finally {
        setResolvingApprovalId(null);
      }
    },
    [activeThreadId, submitApproval],
  );

  const activeConversation = conversations.find((item) => item.threadId === activeThreadId);
  const title = activeConversation?.title ?? "Qelsa Agent";
  const renderRail = (onClose?: () => void) => (
    <>
      <RailHeader onClose={onClose} />
      <div className="px-3 py-3">
        <Button
          type="button"
          onClick={() => void handleNewChat()}
          className="h-9 w-full justify-start gap-2 rounded-xl border border-white/[0.08] bg-white/[0.05] px-3 text-[13px] font-semibold text-white/80 shadow-none hover:bg-white/[0.08] hover:text-white"
        >
          <Plus className="size-4" />
          New chat
        </Button>
      </div>
      <div className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-white/30">Recent</div>
      <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-3">
        <ConversationList
          conversations={conversations}
          activeThreadId={activeThreadId}
          loading={!conversationQuery}
          onSelect={(threadId) => {
            setActiveThreadId(threadId);
            stickToBottom.current = true;
            setMobileRailOpen(false);
          }}
          onDelete={(threadId) => void handleDelete(threadId)}
        />
      </div>
      <div className="border-t border-white/[0.08] px-4 py-3 text-[10px] text-white/30">
        {agentStatus?.configured ? agentStatus.model : "AI not configured"}
      </div>
    </>
  );

  if (authLoading) {
    return (
      <div className="flex h-[calc(100dvh-47px)] items-center justify-center lg:h-[calc(100dvh-59px)]">
        <Loader2 className="size-6 animate-spin text-white/40" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex h-[calc(100dvh-47px)] items-center justify-center px-4 lg:h-[calc(100dvh-59px)]">
        <div className="w-full max-w-md rounded-2xl border border-white/[0.1] bg-white/[0.04] p-8 text-center backdrop-blur-xl">
          <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-neon-cyan via-neon-purple to-neon-pink shadow-lg shadow-purple-900/30">
            <Sparkles className="size-7 text-black" />
          </div>
          <h1 className="mt-5 text-xl font-semibold text-white">Sign in to use Qelsa Agent</h1>
          <p className="mt-2 text-sm leading-relaxed text-white/55">
            Qelsa Agent works inside your account — it can search jobs, check your fit, and prepare applications.
            Anything that changes your data needs your approval.
          </p>
          <Button
            type="button"
            onClick={() => router.push("/auth?returnUrl=/agent")}
            className="mt-6 h-10 w-full rounded-xl bg-gradient-to-r from-[#623dd6] via-[#8433ae] to-[#be2680] text-sm font-semibold text-white shadow-lg shadow-purple-900/25"
          >
            Sign in
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100dvh-47px)] w-full overflow-hidden lg:h-[calc(100dvh-59px)]">
      <aside className="hidden w-72 shrink-0 flex-col border-r border-white/[0.08] bg-[#080812]/80 lg:flex">
        {renderRail()}
      </aside>

      {mobileRailOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/65 backdrop-blur-sm"
            onClick={() => setMobileRailOpen(false)}
            aria-hidden
          />
          <div className="absolute inset-y-0 left-0 flex w-[86%] max-w-xs flex-col border-r border-white/[0.1] bg-[#080812] shadow-2xl">
            {renderRail(() => setMobileRailOpen(false))}
          </div>
        </div>
      )}

      <main className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 shrink-0 items-center gap-2 border-b border-white/[0.08] bg-[#06060f]/80 px-3 backdrop-blur-xl sm:px-4">
          <button
            type="button"
            aria-label="Open conversations"
            onClick={() => setMobileRailOpen(true)}
            className="flex size-9 items-center justify-center rounded-full border border-white/[0.1] bg-white/[0.04] text-white/70 lg:hidden"
          >
            <PanelLeft className="size-4" />
          </button>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-semibold text-white sm:text-sm">{title}</p>
            <p className="truncate text-[10px] text-white/40 sm:text-[11px]">
              {configured ? "Can search jobs, check fit, and prepare applications" : "AI is not configured"}
            </p>
          </div>
          <button
            type="button"
            aria-label="New chat"
            onClick={() => void handleNewChat()}
            className="flex size-9 items-center justify-center rounded-full border border-white/[0.1] bg-white/[0.04] text-white/70 lg:hidden"
          >
            <MessageSquarePlus className="size-4" />
          </button>
        </header>

        {!configured && (
          <div className="flex items-center justify-center gap-2 border-b border-amber-400/20 bg-amber-400/[0.07] px-4 py-2 text-[11px] text-amber-200">
            <WifiOff className="size-3.5" />
            Qelsa Agent needs OPENROUTER_API_KEY on this deployment.
          </div>
        )}

        <div ref={scrollRef} onScroll={handleScroll} className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          <div className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6">
            {messageStatus === "CanLoadMore" && (
              <div className="mb-4 flex justify-center">
                <button
                  type="button"
                  onClick={() => loadMore?.(20)}
                  className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] font-medium text-white/55 hover:text-white"
                >
                  Load earlier messages
                </button>
              </div>
            )}

            {activeThreadId && messageStatus === "LoadingFirstPage" && messages.length === 0 ? (
              <div className="flex justify-center py-16">
                <Loader2 className="size-5 animate-spin text-white/35" />
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center py-6 text-center sm:py-10">
                <div className="flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br from-neon-cyan via-neon-purple to-neon-pink shadow-xl shadow-purple-900/30">
                  <Sparkles className="size-8 text-black" />
                </div>
                <h1 className="mt-5 text-2xl font-semibold text-white sm:text-3xl">
                  Hi {firstNameOf(user?.name)},{" "}
                  <span className="bg-gradient-to-r from-neon-cyan via-neon-purple to-neon-pink bg-clip-text text-transparent">
                    what&apos;s next?
                  </span>
                </h1>
                <p className="mt-2 max-w-md text-[13px] leading-relaxed text-white/50 sm:text-sm">
                  Search jobs, check your fit, draft a cover letter, or prepare an application. I&apos;ll do the work —
                  you approve anything that changes your account.
                </p>

                <div className="mt-6 grid w-full gap-2 text-left sm:grid-cols-2">
                  {SUGGESTIONS.map((suggestion) => {
                    const Icon = suggestion.icon;
                    return (
                      <button
                        key={suggestion.prompt}
                        type="button"
                        disabled={!configured}
                        onClick={() => void handleSend(suggestion.prompt)}
                        className="group flex items-center gap-3 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3.5 py-3 transition-all hover:-translate-y-0.5 hover:border-neon-purple/40 hover:bg-white/[0.06] disabled:pointer-events-none disabled:opacity-50"
                      >
                        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.05] text-neon-cyan">
                          <Icon className="size-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-[13px] font-semibold text-white/85">{suggestion.title}</p>
                          <p className="truncate text-[11px] text-white/40">{suggestion.subtitle}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="space-y-5">
                {messages.map((message) => (
                  <MessageBubble
                    key={message.key}
                    message={message}
                    resolvingApprovalId={resolvingApprovalId}
                    onApprove={(approvalId) => void handleApproval(approvalId, true)}
                    onDeny={(approvalId) => void handleApproval(approvalId, false)}
                  />
                ))}
              </div>
            )}

            {awaitingReply && !streaming && (
              <div className="mt-5 flex gap-3">
                <AssistantAvatar />
                <div className="flex items-center rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-1.5">
                  <TypingDots />
                </div>
              </div>
            )}

            <div ref={bottomRef} className="h-1" />
          </div>
        </div>

        <div className="shrink-0 border-t border-white/[0.08] bg-[#06060f]/85 px-3 py-3 backdrop-blur-xl sm:px-6">
          <div className="mx-auto w-full max-w-3xl">
            <div
              className={cn(
                "flex items-end gap-2 rounded-2xl border bg-white/[0.04] p-2 pl-3 transition-colors",
                configured ? "border-white/[0.1] focus-within:border-neon-purple/50" : "border-white/[0.06] opacity-60",
              )}
            >
              <textarea
                ref={textareaRef}
                rows={1}
                value={input}
                disabled={!configured}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
                    event.preventDefault();
                    void handleSend();
                  }
                }}
                placeholder={configured ? "Ask Qelsa Agent anything…" : "AI is not configured on this deployment"}
                className="max-h-[152px] min-h-[36px] flex-1 resize-none bg-transparent py-1.5 text-[14px] leading-relaxed text-white/90 placeholder:text-white/30 focus:outline-none disabled:cursor-not-allowed"
              />
              <button
                type="button"
                aria-label="Send message"
                disabled={!configured || sending || !input.trim()}
                onClick={() => void handleSend()}
                className="mb-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#623dd6] via-[#8433ae] to-[#be2680] text-white shadow-lg shadow-purple-900/25 transition-all hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {sending ? <Loader2 className="size-4 animate-spin" /> : <ArrowUp className="size-4" />}
              </button>
            </div>
            <p className="mt-2 hidden text-center text-[10px] text-white/30 sm:block">
              Enter to send · Shift + Enter for a new line · Approve anything that changes your data
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
