"use client";

import { useLazySearchSkillsQuery, useResolveSkillMutation } from "@/features/api/userSkillsApi";
import { toastUnknownError } from "@/lib/errors";
import { Plus } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { inputClass, TagChip } from "./fields";

export type PickedSkill = { id: string | number; name: string };

interface SkillPickerProps {
  /** Currently attached skills — shown as removable chips inside the field. */
  selected: PickedSkill[];
  onChange: (skills: PickedSkill[]) => void;
  placeholder?: string;
  /** Hides already-selected skills from the dropdown. */
  excludeSelected?: boolean;
}

/**
 * Skill search box with a dropdown of catalog matches plus an
 * "Add as new skill" row that get-or-creates the catalog entry on submit.
 */
export function SkillPicker({ selected, onChange, placeholder = "Add a skill...", excludeSelected = true }: SkillPickerProps) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [searchSkills, { data: results = [] }] = useLazySearchSkillsQuery();
  const [resolveSkill] = useResolveSkillMutation();
  const containerRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(null);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      if (query.trim().length >= 1) {
        searchSkills(query.trim());
        setOpen(true);
      } else {
        setOpen(false);
      }
    }, 250);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  useEffect(() => {
    const onOutside = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, []);

  const selectedIds = new Set(selected.map((s) => String(s.id)));
  const options = (excludeSelected ? (results as PickedSkill[]).filter((r) => !selectedIds.has(String(r.id))) : (results as PickedSkill[])) ?? [];
  const trimmed = query.trim();
  const exactMatch = options.some((o) => o.name.toLowerCase() === trimmed.toLowerCase()) || selected.some((s) => s.name.toLowerCase() === trimmed.toLowerCase());

  const add = (skill: PickedSkill) => {
    if (selectedIds.has(String(skill.id))) return;
    onChange([...selected, skill]);
    setQuery("");
    setOpen(false);
  };

  const addNew = async () => {
    if (!trimmed) return;
    try {
      const skill = (await resolveSkill(trimmed).unwrap()) as PickedSkill;
      add({ id: skill.id, name: skill.name });
    } catch (error) {
      toastUnknownError(error, "Could not add that skill. Please try again.");
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <div className={`${inputClass} flex min-h-[48px] flex-wrap items-center gap-2 py-2`}>
        {selected.map((skill) => (
          <TagChip key={String(skill.id)} onRemove={() => onChange(selected.filter((s) => String(s.id) !== String(skill.id)))}>
            {skill.name}
          </TagChip>
        ))}
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => trimmed && setOpen(true)}
          placeholder={selected.length === 0 ? placeholder : "Add a skill..."}
          className="min-w-[120px] flex-1 bg-transparent text-sm text-white placeholder:text-white/35 focus:outline-none"
        />
      </div>

      {open && (options.length > 0 || (trimmed && !exactMatch)) && (
        <ul className="absolute left-0 right-0 top-full z-20 mt-1 max-h-52 overflow-y-auto rounded-xl border border-white/10 bg-[#15152b] shadow-xl">
          {options.map((option) => (
            <li key={String(option.id)}>
              <button type="button" onClick={() => add(option)} className="w-full px-4 py-2.5 text-left text-sm text-white/85 transition-colors hover:bg-neon-cyan/10">
                {option.name}
              </button>
            </li>
          ))}
          {trimmed && !exactMatch && (
            <li>
              <button type="button" onClick={addNew} className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-neon-cyan transition-colors hover:bg-neon-cyan/10">
                <Plus className="size-3.5" />
                Add &quot;{trimmed}&quot; as new skill
              </button>
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
