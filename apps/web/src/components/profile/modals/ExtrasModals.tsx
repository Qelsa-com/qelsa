"use client";

import { useUpdateProfileMutation } from "@/features/api/authApi";
import { toastUnknownError } from "@/lib/errors";
import { UserLanguage } from "@/types/user";
import { Plus, X } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Field, Select, TagChip, inputClass } from "./fields";
import { GradientButton, GhostButton, ModalShell } from "./ModalShell";

const LANGUAGE_LEVELS = ["Native / Bilingual", "Professional Working", "Limited Working", "Elementary"];

/* -------------------------------- Languages ------------------------------- */

export function LanguagesModal({ open, onClose, languages }: { open: boolean; onClose: () => void; languages: UserLanguage[] }) {
  const [rows, setRows] = useState<UserLanguage[]>([]);
  const [saving, setSaving] = useState(false);
  const [updateProfile] = useUpdateProfileMutation();

  useEffect(() => {
    if (open) setRows(languages.length ? languages : [{ name: "", proficiency: "" }]);
  }, [open, languages]);

  if (!open) return null;

  const update = (index: number, patch: Partial<UserLanguage>) => setRows(rows.map((row, i) => (i === index ? { ...row, ...patch } : row)));

  const handleSave = async () => {
    const cleaned = rows.filter((row) => row.name.trim());
    setSaving(true);
    try {
      await updateProfile({ languages: cleaned }).unwrap();
      toast.success("Languages saved");
      onClose();
    } catch (error) {
      toastUnknownError(error, "Could not save languages. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalShell
      title="Languages"
      subtitle="Add the languages you speak"
      onClose={onClose}
      footer={
        <>
          <GhostButton onClick={onClose} disabled={saving}>
            Cancel
          </GhostButton>
          <GradientButton onClick={handleSave} disabled={saving}>
            {saving ? "Saving…" : "Save changes"}
          </GradientButton>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        {rows.map((row, index) => (
          <div key={index} className="flex items-center gap-3">
            <input value={row.name} onChange={(e) => update(index, { name: e.target.value })} placeholder="Language" className={inputClass} />
            <div className="w-48 shrink-0">
              <Select value={row.proficiency} onChange={(value) => update(index, { proficiency: value })} placeholder="Level">
                {LANGUAGE_LEVELS.map((level) => (
                  <option key={level} value={level} className="bg-[#12122a]">
                    {level}
                  </option>
                ))}
              </Select>
            </div>
            <button
              type="button"
              onClick={() => setRows(rows.filter((_, i) => i !== index))}
              aria-label="Remove language"
              className="shrink-0 text-white/30 transition-colors hover:text-white"
            >
              <X className="size-4" />
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => setRows([...rows, { name: "", proficiency: "" }])}
          className="flex w-fit items-center gap-1.5 text-sm font-medium text-neon-cyan transition-opacity hover:opacity-80"
        >
          <Plus className="size-4" />
          Add language
        </button>
      </div>
    </ModalShell>
  );
}

/* -------------------------------- Interests ------------------------------- */

export function InterestsModal({ open, onClose, interests }: { open: boolean; onClose: () => void; interests: string[] }) {
  const [tags, setTags] = useState<string[]>([]);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const [updateProfile] = useUpdateProfileMutation();

  useEffect(() => {
    if (open) {
      setTags(interests);
      setDraft("");
    }
  }, [open, interests]);

  if (!open) return null;

  const addTag = () => {
    const value = draft.trim();
    if (!value) return;
    if (!tags.some((tag) => tag.toLowerCase() === value.toLowerCase())) setTags([...tags, value]);
    setDraft("");
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateProfile({ interests: tags }).unwrap();
      toast.success("Interests saved");
      onClose();
    } catch (error) {
      toastUnknownError(error, "Could not save interests. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalShell
      title="Interests"
      subtitle="Topics you follow and care about"
      onClose={onClose}
      footer={
        <>
          <GhostButton onClick={onClose} disabled={saving}>
            Cancel
          </GhostButton>
          <GradientButton onClick={handleSave} disabled={saving}>
            {saving ? "Saving…" : "Save changes"}
          </GradientButton>
        </>
      }
    >
      <Field label="Interests" hint="Press Enter to add">
        <div className={`${inputClass} flex min-h-[48px] flex-wrap items-center gap-2 py-2`}>
          {tags.map((tag) => (
            <TagChip key={tag} onRemove={() => setTags(tags.filter((t) => t !== tag))}>
              {tag}
            </TagChip>
          ))}
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addTag();
              }
            }}
            placeholder={tags.length === 0 ? "Add an interest…" : ""}
            className="min-w-[120px] flex-1 bg-transparent text-sm text-white placeholder:text-white/35 focus:outline-none"
          />
        </div>
      </Field>
    </ModalShell>
  );
}
