"use client";

import { LegalMarkdownPreview } from "@/components/LegalMarkdownPreview";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  useGetSiteContentQuery,
  useUpdateSiteContentMutation,
  type SiteContentKey,
} from "@/features/api/adminApi";
import { Bold, Heading2, Italic, Link2, List, ListOrdered, Save } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

type LegalKey = "terms" | "privacy" | "cookies";
type TabKey = LegalKey | "home_jobs_stat";

type LegalItem = {
  key: LegalKey;
  title: string;
  body: string;
  contactHeading: string;
  contactEmail: string;
  updatedAt: number;
  isDefault: boolean;
};

type HomeStat = {
  key: "home_jobs_stat";
  value: string;
  updatedAt: number;
  isDefault: boolean;
};

type SiteContentData = { legal: LegalItem[]; homeJobsStat: HomeStat };

type Draft = {
  title: string;
  body: string;
  contactHeading: string;
  contactEmail: string;
  value: string;
};

const TABS: Array<{ key: TabKey; label: string }> = [
  { key: "terms", label: "Terms" },
  { key: "privacy", label: "Privacy" },
  { key: "cookies", label: "Cookies" },
  { key: "home_jobs_stat", label: "Home stat" },
];

const TOOL =
  "inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 text-white/60 transition-colors hover:bg-white/5 hover:text-white";

function buildDrafts(data: SiteContentData): Record<TabKey, Draft> {
  const drafts = {} as Record<TabKey, Draft>;
  for (const item of data.legal) {
    drafts[item.key] = {
      title: item.title,
      body: item.body,
      contactHeading: item.contactHeading,
      contactEmail: item.contactEmail,
      value: "",
    };
  }
  drafts.home_jobs_stat = {
    title: "",
    body: "",
    contactHeading: "",
    contactEmail: "",
    value: data.homeJobsStat.value,
  };
  return drafts;
}

export default function ContentPage() {
  const { data, isLoading } = useGetSiteContentQuery();
  const [updateContent, { isLoading: isSaving }] = useUpdateSiteContentMutation();
  const [drafts, setDrafts] = useState<Record<TabKey, Draft> | null>(null);
  const [active, setActive] = useState<TabKey>("terms");
  const [note, setNote] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!data) return;
    setDrafts((current) => current ?? buildDrafts(data as SiteContentData));
  }, [data]);

  const content = data as SiteContentData | undefined;
  const draft = drafts?.[active];
  const legal = active !== "home_jobs_stat";
  const currentLegal = content?.legal.find((item) => item.key === active);
  const currentStat = content?.homeJobsStat;
  const lastUpdated = legal ? currentLegal?.updatedAt : currentStat?.updatedAt;
  const isDefault = legal ? currentLegal?.isDefault : currentStat?.isDefault;

  const updateDraft = (patch: Partial<Draft>) => {
    if (!drafts || !draft) return;
    setDrafts({ ...drafts, [active]: { ...draft, ...patch } });
  };

  const wrapSelection = (before: string, after = before) => {
    const element = textareaRef.current;
    if (!element || !draft) return;
    const start = element.selectionStart;
    const end = element.selectionEnd;
    const selected = draft.body.slice(start, end);
    const inner = selected || "text";
    updateDraft({
      body: `${draft.body.slice(0, start)}${before}${inner}${after}${draft.body.slice(end)}`,
    });
    requestAnimationFrame(() => {
      element.focus();
      const cursor = start + before.length + inner.length + after.length;
      element.setSelectionRange(cursor, cursor);
    });
  };

  const prefixLine = (prefix: string) => {
    const element = textareaRef.current;
    if (!element || !draft) return;
    const start = element.selectionStart;
    const lineStart = draft.body.lastIndexOf("\n", start - 1) + 1;
    updateDraft({
      body: `${draft.body.slice(0, lineStart)}${prefix}${draft.body.slice(lineStart)}`,
    });
    requestAnimationFrame(() => {
      element.focus();
      element.setSelectionRange(start + prefix.length, start + prefix.length);
    });
  };

  const handleSave = async () => {
    if (!draft) return;
    try {
      await updateContent({
        key: active as SiteContentKey,
        body: legal ? draft.body : draft.value,
        ...(legal
          ? {
              title: draft.title,
              contactHeading: draft.contactHeading,
              contactEmail: draft.contactEmail,
            }
          : {}),
        note: note.trim() || undefined,
      }).unwrap();
      toast.success("Content saved.");
      setNote("");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save the content.");
    }
  };

  return (
    <>
      <PageHeader
        title="Content"
        description="Terms, privacy, cookies, and the home-page jobs stat. Edited content is live immediately."
      />

      <div className="px-5 py-6 md:px-8">
        <div className="flex flex-wrap gap-2">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActive(tab.key)}
              className={`rounded-full border px-4 py-2 text-xs font-semibold transition-colors ${
                active === tab.key
                  ? "border-white/20 bg-white/10 text-white"
                  : "border-white/10 bg-transparent text-white/55 hover:bg-white/5 hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {isLoading || !draft ? (
          <div className="mt-6">
            <Skeleton className="h-96 w-full" />
          </div>
        ) : (
          <div className="mt-6 grid gap-5 xl:grid-cols-2">
            <section className="rounded-2xl border border-glass-border glass p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-sm font-semibold">
                    {TABS.find((tab) => tab.key === active)?.label}
                  </h2>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Markdown only — images and embedded media are not supported.
                  </p>
                </div>
                <span className="rounded-md bg-white/[0.06] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white/50">
                  {isDefault ? "Default" : "Edited"}
                </span>
              </div>

              {legal ? (
                <div className="mt-5 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="content-title">Title</Label>
                    <Input
                      id="content-title"
                      value={draft.title}
                      maxLength={160}
                      onChange={(event) => updateDraft({ title: event.target.value })}
                    />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="contact-heading">Contact heading</Label>
                      <Input
                        id="contact-heading"
                        value={draft.contactHeading}
                        maxLength={160}
                        onChange={(event) => updateDraft({ contactHeading: event.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="contact-email">Contact email</Label>
                      <Input
                        id="contact-email"
                        type="email"
                        value={draft.contactEmail}
                        onChange={(event) => updateDraft({ contactEmail: event.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="content-body">Body</Label>
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        type="button"
                        className={TOOL}
                        title="Heading"
                        onClick={() => prefixLine("## ")}
                      >
                        <Heading2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        className={TOOL}
                        title="Bold"
                        onClick={() => wrapSelection("**")}
                      >
                        <Bold className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        className={TOOL}
                        title="Italic"
                        onClick={() => wrapSelection("_")}
                      >
                        <Italic className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        className={TOOL}
                        title="Bullet list"
                        onClick={() => prefixLine("- ")}
                      >
                        <List className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        className={TOOL}
                        title="Numbered list"
                        onClick={() => prefixLine("1. ")}
                      >
                        <ListOrdered className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        className={TOOL}
                        title="Link"
                        onClick={() => wrapSelection("[", "](https://)")}
                      >
                        <Link2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <Textarea
                      id="content-body"
                      ref={textareaRef}
                      value={draft.body}
                      onChange={(event) => updateDraft({ body: event.target.value })}
                      className="min-h-[420px] font-mono text-[13px] leading-relaxed"
                    />
                  </div>
                </div>
              ) : (
                <div className="mt-5 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="content-stat">Jobs stat</Label>
                    <Input
                      id="content-stat"
                      value={draft.value}
                      maxLength={16}
                      placeholder="20K+"
                      onChange={(event) => updateDraft({ value: event.target.value })}
                    />
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                    <p className="text-sm font-bold text-white">
                      {draft.value || "20K+"} live jobs
                    </p>
                    <p className="mt-0.5 text-xs text-white/45">Each one scored for you</p>
                  </div>
                </div>
              )}

              <div className="mt-5 space-y-2">
                <Label htmlFor="content-note">Audit note (optional)</Label>
                <Input
                  id="content-note"
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  placeholder="Why is this changing?"
                />
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-3">
                <Button
                  onClick={() => void handleSave()}
                  disabled={isSaving}
                  className="rounded-full bg-gradient-to-r from-neon-purple to-neon-pink text-white hover:opacity-90"
                >
                  <Save className="mr-1.5 h-4 w-4" />
                  {isSaving ? "Saving…" : "Save"}
                </Button>
                {lastUpdated ? (
                  <span className="text-xs text-muted-foreground">
                    Last updated {new Date(lastUpdated).toLocaleString()}
                  </span>
                ) : null}
              </div>
            </section>

            <section className="rounded-2xl border border-glass-border glass p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Preview
              </p>
              <div className="mt-4 max-h-[720px] overflow-y-auto pr-1">
                {legal ? (
                  <LegalMarkdownPreview markdown={draft.body} />
                ) : (
                  <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                    <p className="text-sm font-bold text-white">
                      {draft.value || "20K+"} live jobs
                    </p>
                    <p className="mt-0.5 text-xs text-white/45">Each one scored for you</p>
                  </div>
                )}
              </div>
            </section>
          </div>
        )}
      </div>
    </>
  );
}
