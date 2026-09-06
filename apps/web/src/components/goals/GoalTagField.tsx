"use client";

import { TagChip, inputClass } from "@/components/profile/modals/fields";
import { useEffect, useRef, useState } from "react";

interface GoalTagFieldProps {
  values: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  suggestions?: string[];
  onSearch?: (query: string) => void;
  max?: number;
}

/** Free-text chips with optional catalog suggestions. Enter or comma adds a tag. */
export function GoalTagField({ values, onChange, placeholder = "Add…", suggestions = [], onSearch, max = 12 }: GoalTagFieldProps) {
  const [draft, setDraft] = useState("");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!onSearch) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      const query = draft.trim();
      if (query.length >= 1) {
        onSearch(query);
        setOpen(true);
      } else {
        setOpen(false);
      }
    }, 250);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [draft, onSearch]);

  useEffect(() => {
    const onOutside = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, []);

  const add = (raw: string) => {
    const value = raw.trim();
    if (!value || values.length >= max) return;
    if (values.some((tag) => tag.toLowerCase() === value.toLowerCase())) {
      setDraft("");
      setOpen(false);
      return;
    }
    onChange([...values, value]);
    setDraft("");
    setOpen(false);
  };

  const visibleSuggestions = suggestions.filter((name) => !values.some((tag) => tag.toLowerCase() === name.toLowerCase())).slice(0, 8);

  return (
    <div ref={containerRef} className="relative">
      <div className={`${inputClass} flex min-h-[48px] flex-wrap items-center gap-2 py-2`}>
        {values.map((tag) => (
          <TagChip key={tag} onRemove={() => onChange(values.filter((item) => item !== tag))}>
            {tag}
          </TagChip>
        ))}
        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === ",") {
              event.preventDefault();
              add(draft);
            } else if (event.key === "Backspace" && !draft && values.length > 0) {
              onChange(values.slice(0, -1));
            }
          }}
          placeholder={values.length >= max ? "" : placeholder}
          className="min-w-[120px] flex-1 bg-transparent text-sm text-white placeholder:text-white/35 focus:outline-none"
        />
      </div>
      {open && visibleSuggestions.length > 0 && (
        <ul className="absolute z-20 mt-1 max-h-48 w-full overflow-auto rounded-xl border border-white/10 bg-[#12122a] py-1 shadow-xl">
          {visibleSuggestions.map((name) => (
            <li key={name}>
              <button type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => add(name)} className="w-full px-3 py-2 text-left text-sm text-white/85 hover:bg-white/8">
                {name}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
