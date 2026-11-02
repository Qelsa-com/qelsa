"use client";

import { BlogPreview, type BlogPreviewData } from "@/components/blog/BlogPreview";
import { useAlert } from "@/components/ui/alert-modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  useGetAdminBlogQuery,
  useSetBlogStatusMutation,
  useUpdateBlogMutation,
  type AdminBlog,
  type BlogLink,
} from "@/features/api/blogApi";
import { Eye, Loader2, Plus, Save, Trash2, X } from "lucide-react";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import { toast } from "sonner";

type SectionDraft = {
  heading: string;
  paragraphs: string;
  bullets: string;
};

type FaqDraft = {
  question: string;
  answer: string;
};

type Draft = {
  title: string;
  slug: string;
  excerpt: string;
  category: string;
  tagsText: string;
  coverImageAlt: string;
  coverImageUrl: string | null;
  intro: string;
  keyTakeawaysText: string;
  sections: SectionDraft[];
  faq: FaqDraft[];
  relatedLinks: BlogLink[];
  metaTitle: string;
  metaDescription: string;
  primaryKeyword: string;
  searchIntent: string;
  status: "draft" | "published";
  publishedAt: number | null;
};

function parseLines(value: string) {
  return value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function parseParagraphs(value: string) {
  return value
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.replace(/\s+/g, " ").trim())
    .filter(Boolean);
}

function parseTags(value: string) {
  return [
    ...new Set(
      value
        .split(/[,\n]/)
        .map((tag) => tag.trim())
        .filter(Boolean),
    ),
  ];
}

function toDraft(post: AdminBlog): Draft {
  return {
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt,
    category: post.category,
    tagsText: post.tags.join(", "),
    coverImageAlt: post.cover_image_alt,
    coverImageUrl: post.cover_image_url,
    intro: post.intro,
    keyTakeawaysText: post.key_takeaways.join("\n"),
    sections: post.sections.map((section) => ({
      heading: section.heading,
      paragraphs: section.paragraphs.join("\n\n"),
      bullets: section.bullets.join("\n"),
    })),
    faq: post.faq.map((item) => ({ question: item.question, answer: item.answer })),
    relatedLinks: post.related_links,
    metaTitle: post.meta_title,
    metaDescription: post.meta_description,
    primaryKeyword: post.primary_keyword,
    searchIntent: post.search_intent,
    status: post.status,
    publishedAt: post.published_at,
  };
}

function wordCount(draft: Draft) {
  const text = [
    draft.title,
    draft.intro,
    ...parseLines(draft.keyTakeawaysText),
    ...draft.sections.flatMap((section) => [
      section.heading,
      ...parseParagraphs(section.paragraphs),
      ...parseLines(section.bullets),
    ]),
    ...draft.faq.flatMap((item) => [item.question, item.answer]),
  ].join(" ");
  return text.split(/\s+/).filter(Boolean).length;
}

function toPreview(draft: Draft): BlogPreviewData {
  const words = wordCount(draft);
  return {
    title: draft.title,
    slug: draft.slug,
    excerpt: draft.excerpt,
    category: draft.category,
    tags: parseTags(draft.tagsText),
    cover_image_url: draft.coverImageUrl,
    cover_image_alt: draft.coverImageAlt,
    meta_title: draft.metaTitle,
    meta_description: draft.metaDescription,
    primary_keyword: draft.primaryKeyword,
    intro: draft.intro,
    key_takeaways: parseLines(draft.keyTakeawaysText),
    sections: draft.sections.map((section) => ({
      heading: section.heading,
      paragraphs: parseParagraphs(section.paragraphs),
      bullets: parseLines(section.bullets),
    })),
    faq: draft.faq,
    word_count: words,
    reading_minutes: Math.max(1, Math.round(words / 220)),
    status: draft.status,
    published_at: draft.publishedAt,
  };
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
      {hint ? <p className="text-[11px] leading-relaxed text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

export function BlogEditor({
  blogId,
  onClose,
}: {
  blogId: string;
  onClose: () => void;
}) {
  const alert = useAlert();
  const { data, isLoading } = useGetAdminBlogQuery(blogId);
  const post = data as AdminBlog | undefined;
  const [updateBlog, { isLoading: isSaving }] = useUpdateBlogMutation();
  const [setStatus, { isLoading: isChangingStatus }] = useSetBlogStatusMutation();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [dirty, setDirty] = useState(false);
  const [mobileView, setMobileView] = useState<"edit" | "preview">("edit");

  useEffect(() => {
    if (post && !draft) {
      setDraft(toDraft(post));
      setDirty(false);
    }
  }, [post, draft]);

  const requestClose = useCallback(async () => {
    if (!dirty) {
      onClose();
      return;
    }
    const discard = await alert({
      title: "Discard unsaved changes?",
      description: "Your edits will be lost if you close this editor.",
      confirmText: "Discard",
      cancelText: "Keep editing",
      tone: "danger",
    });
    if (discard) onClose();
  }, [alert, dirty, onClose]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") void requestClose();
    };
    document.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [requestClose]);

  const update = (patch: Partial<Draft>) => {
    setDraft((current) => (current ? { ...current, ...patch } : current));
    setDirty(true);
  };

  const updateSection = (index: number, patch: Partial<SectionDraft>) => {
    setDraft((current) =>
      current
        ? {
            ...current,
            sections: current.sections.map((section, sectionIndex) =>
              sectionIndex === index ? { ...section, ...patch } : section,
            ),
          }
        : current,
    );
    setDirty(true);
  };

  const updateFaq = (index: number, patch: Partial<FaqDraft>) => {
    setDraft((current) =>
      current
        ? {
            ...current,
            faq: current.faq.map((item, itemIndex) =>
              itemIndex === index ? { ...item, ...patch } : item,
            ),
          }
        : current,
    );
    setDirty(true);
  };

  const handleSave = async () => {
    if (!draft) return false;
    if (!draft.title.trim()) {
      toast.error("Add a title before saving.");
      return false;
    }
    if (!draft.slug.trim()) {
      toast.error("Add a slug before saving.");
      return false;
    }
    const sections = draft.sections.map((section) => ({
      heading: section.heading.trim(),
      paragraphs: parseParagraphs(section.paragraphs),
      bullets: parseLines(section.bullets),
    }));
    if (sections.some((section) => !section.heading && (section.paragraphs.length || section.bullets.length))) {
      toast.error("Add a heading to every section with content.");
      return false;
    }
    try {
      await updateBlog({
        blogId,
        title: draft.title.trim(),
        slug: draft.slug.trim(),
        excerpt: draft.excerpt.trim(),
        metaTitle: draft.metaTitle.trim(),
        metaDescription: draft.metaDescription.trim(),
        primaryKeyword: draft.primaryKeyword.trim(),
        searchIntent: draft.searchIntent.trim(),
        category: draft.category.trim(),
        tags: parseTags(draft.tagsText),
        intro: draft.intro.trim(),
        keyTakeaways: parseLines(draft.keyTakeawaysText),
        sections,
        faq: draft.faq
          .map((item) => ({ question: item.question.trim(), answer: item.answer.trim() }))
          .filter((item) => item.question || item.answer),
        relatedLinks: draft.relatedLinks,
        coverImageAlt: draft.coverImageAlt.trim(),
      });
      setDirty(false);
      toast.success("Blog post saved.");
      return true;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save the post.");
      return false;
    }
  };

  const handleStatus = async () => {
    if (!draft) return;
    const nextStatus = draft.status === "published" ? "draft" : "published";
    if (dirty) {
      const saved = await handleSave();
      if (!saved) return;
    }
    try {
      await setStatus({ blogId, status: nextStatus });
      setDraft((current) =>
        current
          ? {
              ...current,
              status: nextStatus,
              publishedAt: nextStatus === "published" ? current.publishedAt ?? Date.now() : null,
            }
          : current,
      );
      toast.success(nextStatus === "published" ? "Post published." : "Post moved back to drafts.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update the post.");
    }
  };

  if (isLoading || !draft) {
    return (
      <div className="fixed inset-0 z-[45] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
        <div className="flex items-center gap-3 rounded-2xl border border-glass-border bg-[#08080f] px-5 py-4 text-sm text-white/65">
          <Loader2 className="size-4 animate-spin" />
          Loading editor…
        </div>
      </div>
    );
  }

  const preview = toPreview(draft);
  const busy = isSaving || isChangingStatus;

  return (
    <div
      className="fixed inset-0 z-[45] flex flex-col bg-[#06060f] text-white"
      role="dialog"
      aria-modal="true"
      aria-label="Edit blog post"
    >
      <header className="flex shrink-0 flex-wrap items-center gap-3 border-b border-glass-border bg-[#08080f] px-4 py-3 sm:px-6">
        <button
          type="button"
          onClick={() => void requestClose()}
          aria-label="Close editor"
          className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-glass-border text-white/60 transition-colors hover:bg-white/5 hover:text-white"
        >
          <X className="size-4" />
        </button>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Edit post
          </p>
          <h2 className="truncate text-sm font-bold sm:text-base">{draft.title || "Untitled post"}</h2>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            className="h-11 rounded-xl border-glass-border bg-white/[0.03] px-3 text-[11px] lg:hidden"
            onClick={() => setMobileView((current) => (current === "edit" ? "preview" : "edit"))}
          >
            <Eye className="size-3.5" />
            {mobileView === "edit" ? "Preview" : "Edit"}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="h-11 rounded-xl border-glass-border bg-white/[0.03] px-3 text-[11px] sm:h-9"
            disabled={!dirty || busy}
            onClick={() => void handleSave()}
          >
            {isSaving ? <Loader2 className="size-3.5 animate-spin" /> : <Save className="size-3.5" />}
            {isSaving ? "Saving…" : "Save"}
          </Button>
          <Button
            type="button"
            variant={draft.status === "published" ? "outline" : "default"}
            className={`h-11 rounded-xl px-4 text-[11px] font-semibold sm:h-9 ${
              draft.status === "published"
                ? "border-glass-border bg-white/[0.03] text-white/65 hover:bg-white/[0.06]"
                : "text-white"
            }`}
            disabled={busy}
            onClick={() => void handleStatus()}
          >
            {isChangingStatus ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : null}
            {draft.status === "published" ? "Unpublish" : "Publish"}
          </Button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        <div
          className={`${mobileView === "preview" ? "hidden" : "block"} min-w-0 flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6 lg:block lg:max-w-[58%]`}
        >
          <div className="mx-auto max-w-3xl space-y-5">
            {dirty ? (
              <div className="rounded-xl border border-amber-400/20 bg-amber-400/[0.06] px-3 py-2 text-[11px] text-amber-200">
                Unsaved changes.
              </div>
            ) : null}

            <section className="rounded-2xl border border-glass-border bg-white/[0.025] p-4 sm:p-5">
              <h3 className="text-sm font-bold">Post</h3>
              <div className="mt-4 space-y-4">
                <Field label="Title">
                  <Input
                    value={draft.title}
                    maxLength={160}
                    onChange={(event) => update({ title: event.target.value })}
                  />
                </Field>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field
                    label="Slug"
                    hint="Changing a published slug changes its public URL."
                  >
                    <Input
                      value={draft.slug}
                      maxLength={90}
                      onChange={(event) => update({ slug: event.target.value })}
                    />
                  </Field>
                  <Field label="Category">
                    <Input
                      value={draft.category}
                      maxLength={80}
                      onChange={(event) => update({ category: event.target.value })}
                    />
                  </Field>
                </div>
                <Field label="Excerpt">
                  <Textarea
                    value={draft.excerpt}
                    maxLength={300}
                    rows={3}
                    onChange={(event) => update({ excerpt: event.target.value })}
                  />
                </Field>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Tags" hint="Comma-separated.">
                    <Input
                      value={draft.tagsText}
                      onChange={(event) => update({ tagsText: event.target.value })}
                    />
                  </Field>
                  <Field label="Cover image alt text">
                    <Input
                      value={draft.coverImageAlt}
                      maxLength={180}
                      onChange={(event) => update({ coverImageAlt: event.target.value })}
                    />
                  </Field>
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-glass-border bg-white/[0.025] p-4 sm:p-5">
              <h3 className="text-sm font-bold">Content</h3>
              <div className="mt-4 space-y-4">
                <Field label="Intro">
                  <Textarea
                    value={draft.intro}
                    rows={5}
                    onChange={(event) => update({ intro: event.target.value })}
                  />
                </Field>
                <Field label="Key takeaways" hint="One per line.">
                  <Textarea
                    value={draft.keyTakeawaysText}
                    rows={6}
                    onChange={(event) => update({ keyTakeawaysText: event.target.value })}
                  />
                </Field>

                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Sections
                    </h4>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-9 rounded-lg border-glass-border bg-white/[0.03] text-[11px]"
                      onClick={() =>
                        update({
                          sections: [...draft.sections, { heading: "", paragraphs: "", bullets: "" }],
                        })
                      }
                    >
                      <Plus className="size-3.5" />
                      Add section
                    </Button>
                  </div>
                  {draft.sections.map((section, index) => (
                    <div
                      key={index}
                      className="rounded-xl border border-white/[0.08] bg-black/20 p-3 sm:p-4"
                    >
                      <div className="flex items-start gap-2">
                        <Input
                          value={section.heading}
                          maxLength={160}
                          placeholder="Section heading"
                          onChange={(event) => updateSection(index, { heading: event.target.value })}
                        />
                        <button
                          type="button"
                          aria-label="Remove section"
                          className="flex size-11 shrink-0 items-center justify-center rounded-lg text-white/35 hover:bg-rose-500/10 hover:text-rose-300"
                          onClick={() =>
                            update({
                              sections: draft.sections.filter(
                                (_, sectionIndex) => sectionIndex !== index,
                              ),
                            })
                          }
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                      <div className="mt-3 grid gap-3">
                        <Field label="Paragraphs" hint="Blank line between paragraphs.">
                          <Textarea
                            value={section.paragraphs}
                            rows={5}
                            onChange={(event) =>
                              updateSection(index, { paragraphs: event.target.value })
                            }
                          />
                        </Field>
                        <Field label="Bullets" hint="One per line.">
                          <Textarea
                            value={section.bullets}
                            rows={4}
                            onChange={(event) => updateSection(index, { bullets: event.target.value })}
                          />
                        </Field>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      FAQ
                    </h4>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-9 rounded-lg border-glass-border bg-white/[0.03] text-[11px]"
                      onClick={() => update({ faq: [...draft.faq, { question: "", answer: "" }] })}
                    >
                      <Plus className="size-3.5" />
                      Add FAQ
                    </Button>
                  </div>
                  {draft.faq.map((item, index) => (
                    <div
                      key={index}
                      className="rounded-xl border border-white/[0.08] bg-black/20 p-3 sm:p-4"
                    >
                      <div className="flex items-start gap-2">
                        <Input
                          value={item.question}
                          maxLength={240}
                          placeholder="Question"
                          onChange={(event) => updateFaq(index, { question: event.target.value })}
                        />
                        <button
                          type="button"
                          aria-label="Remove FAQ"
                          className="flex size-11 shrink-0 items-center justify-center rounded-lg text-white/35 hover:bg-rose-500/10 hover:text-rose-300"
                          onClick={() =>
                            update({
                              faq: draft.faq.filter((_, itemIndex) => itemIndex !== index),
                            })
                          }
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                      <div className="mt-3">
                        <Field label="Answer">
                          <Textarea
                            value={item.answer}
                            rows={4}
                            onChange={(event) => updateFaq(index, { answer: event.target.value })}
                          />
                        </Field>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-glass-border bg-white/[0.025] p-4 sm:p-5">
              <h3 className="text-sm font-bold">SEO</h3>
              <div className="mt-4 space-y-4">
                <Field label="Meta title">
                  <Input
                    value={draft.metaTitle}
                    maxLength={80}
                    onChange={(event) => update({ metaTitle: event.target.value })}
                  />
                </Field>
                <Field label="Meta description">
                  <Textarea
                    value={draft.metaDescription}
                    maxLength={180}
                    rows={3}
                    onChange={(event) => update({ metaDescription: event.target.value })}
                  />
                </Field>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Primary keyword">
                    <Input
                      value={draft.primaryKeyword}
                      maxLength={120}
                      onChange={(event) => update({ primaryKeyword: event.target.value })}
                    />
                  </Field>
                  <Field label="Search intent">
                    <Input
                      value={draft.searchIntent}
                      maxLength={80}
                      onChange={(event) => update({ searchIntent: event.target.value })}
                    />
                  </Field>
                </div>
              </div>
            </section>

            <div className="flex flex-wrap items-center justify-between gap-3 pb-6">
              <p className="text-[11px] text-muted-foreground">
                {dirty ? "Save before publishing to apply these changes." : "Saved."}
              </p>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="h-11 rounded-xl border-glass-border bg-white/[0.03] px-4 text-xs sm:h-9"
                  disabled={!dirty || busy}
                  onClick={() => void handleSave()}
                >
                  <Save className="size-3.5" />
                  Save changes
                </Button>
                <Button
                  type="button"
                  variant={draft.status === "published" ? "outline" : "default"}
                  className={`h-11 rounded-xl px-4 text-xs font-semibold sm:h-9 ${
                    draft.status === "published"
                      ? "border-glass-border bg-white/[0.03] text-white/65"
                      : "text-white"
                  }`}
                  disabled={busy}
                  onClick={() => void handleStatus()}
                >
                  {draft.status === "published" ? "Unpublish" : "Publish post"}
                </Button>
              </div>
            </div>
          </div>
        </div>

        <aside
          className={`${mobileView === "preview" ? "block" : "hidden"} min-w-0 flex-1 overflow-y-auto overscroll-contain border-l border-glass-border bg-[#08080f] p-4 sm:p-6 lg:block lg:max-w-[42%]`}
        >
          <p className="mb-4 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Preview
          </p>
          <div className="mx-auto max-w-2xl">
            <BlogPreview post={preview} />
          </div>
        </aside>
      </div>
    </div>
  );
}
