"use client";

import { X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface GoalTagFieldProps {
  values: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  suggestions?: string[];
  onSearch?: (query: string) => void;
  max?: number;
}

/**
 * Tag field styled to match Qelsa goal setup screen:
 * Displays chips in a flex-wrap container with an 'x' icon,
 * followed by an input below to add more tags with autocomplete suggestions.
 */
export function GoalTagField({
  values,
  onChange,
  placeholder = "Add…",
  suggestions = [],
  onSearch,
  max = 12,
}: GoalTagFieldProps) {
  const [draft, setDraft] = useState("");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
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
    }, 200);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [draft, onSearch]);

  useEffect(() => {
    const onOutside = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
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

  const remove = (tagToRemove: string) => {
    onChange(values.filter((item) => item !== tagToRemove));
  };

  const visibleSuggestions = suggestions
    .filter((name) => !values.some((tag) => tag.toLowerCase() === name.toLowerCase()))
    .slice(0, 8);

  return (
    <div ref={containerRef} className="relative w-full">
      <div
        onClick={() => inputRef.current?.focus()}
        className="w-full cursor-text rounded-2xl border border-white/10 bg-[#090B16] p-4 transition-colors focus-within:border-white/20 min-h-[76px] flex flex-col justify-between gap-3"
      >
        {values.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            {values.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.08] px-3.5 py-1.5 text-sm font-medium text-white/90 shadow-sm transition-colors hover:bg-white/[0.12]"
              >
                <span>{tag}</span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    remove(tag);
                  }}
                  className="rounded p-0.5 text-white/40 transition-colors hover:bg-white/10 hover:text-white"
                  aria-label={`Remove ${tag}`}
                >
                  <X className="size-3.5" />
                </button>
              </span>
            ))}
          </div>
        )}

        {values.length < max && (
          <input
            ref={inputRef}
            type="text"
            value={draft}
            onChange={(e) => {
              setDraft(e.target.value);
              if (e.target.value.trim().length > 0) setOpen(true);
            }}
            onFocus={() => {
              if (draft.trim().length > 0) setOpen(true);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === ",") {
                e.preventDefault();
                add(draft);
              } else if (e.key === "Backspace" && !draft && values.length > 0) {
                remove(values[values.length - 1]);
              } else if (e.key === "Escape") {
                setOpen(false);
              }
            }}
            placeholder={values.length === 0 ? placeholder : placeholder}
            className="w-full bg-transparent text-sm text-white placeholder:text-white/35 focus:outline-none"
          />
        )}
      </div>

      {open && visibleSuggestions.length > 0 && (
        <ul className="absolute z-30 mt-1.5 max-h-52 w-full overflow-auto rounded-xl border border-white/15 bg-[#101324] p-1.5 shadow-2xl backdrop-blur-md">
          {visibleSuggestions.map((name) => (
            <li key={name}>
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  add(name);
                }}
                className="flex w-full items-center rounded-lg px-3 py-2 text-left text-sm text-white/85 transition-colors hover:bg-white/10 hover:text-white"
              >
                {name}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
