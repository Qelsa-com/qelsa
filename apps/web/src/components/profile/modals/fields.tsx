"use client";

import { ChevronDown, X } from "lucide-react";
import { ReactNode } from "react";

import {
  Select as RadixSelect,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../ui/select";
import { cn } from "../../ui/utils";

/* Shared form styling + primitives for the profile modals and editor pages. */

export const inputClass = "w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-base sm:text-sm text-white placeholder:text-white/35 focus:border-neon-cyan/60 focus:outline-none transition-colors";

export const selectClass = `${inputClass} appearance-none pr-10 cursor-pointer`;

export interface PopoverSelectOption {
  value: string;
  label: string;
}

/** Sleek scrollable custom select with bounded height matching the dark inputs. */
export function PopoverSelect({
  value,
  onChange,
  options,
  placeholder = "Select",
  disabled,
}: {
  value?: string | null;
  onChange: (value: string) => void;
  options: PopoverSelectOption[];
  placeholder?: string;
  disabled?: boolean;
}) {
  return (
    <RadixSelect
      value={value || undefined}
      onValueChange={(val) => onChange(val)}
      disabled={disabled}
    >
      <SelectTrigger
        className={cn(
          "w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-base sm:text-sm text-white h-auto transition-colors",
          "focus-visible:border-neon-cyan/60 focus-visible:ring-0 outline-none",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          !value && "text-white/35"
        )}
      >
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent
        position="popper"
        className="max-h-56 overflow-y-auto rounded-xl border border-white/12 bg-[#12122a] text-white shadow-2xl z-[99999]"
      >
        {options.map((opt) => (
          <SelectItem
            key={opt.value}
            value={opt.value}
            className="cursor-pointer rounded-lg px-3 py-2 text-sm text-white/80 transition-colors hover:bg-white/10 hover:text-white focus:bg-neon-cyan/20 focus:text-white"
          >
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </RadixSelect>
  );
}

export function Field({ label, required, children, hint }: { label: string; required?: boolean; children: ReactNode; hint?: string }) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium text-white/70">
        {label}
        {required && <span className="ml-0.5 text-[#d73e9d]">*</span>}
      </label>
      {children}
      {hint && <p className="text-xs text-white/50">{hint}</p>}
    </div>
  );
}

/** Native select with a chevron, styled to match the dark inputs. */
export function Select({ value, onChange, children, placeholder = "Select", disabled }: { value: string; onChange: (value: string) => void; children: ReactNode; placeholder?: string; disabled?: boolean }) {
  return (
    <div className="relative">
      <select value={value} onChange={(e) => onChange(e.target.value)} disabled={disabled} className={`${selectClass} disabled:opacity-50`}>
        <option value="" className="bg-[#12122a]">
          {placeholder}
        </option>
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-white/40" />
    </div>
  );
}

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export function yearOptions(from = 1970, to?: number): number[] {
  const current = to ?? new Date().getFullYear();
  const years: number[] = [];
  for (let y = current; y >= from; y--) years.push(y);
  return years;
}

/** "January 2023" style month+year pair, stored as a "YYYY-MM" string. */
export function MonthYearSelect({
  value,
  onChange,
  placeholder = "Select",
  disabled,
  allowFuture = false,
  maxYear,
  minYear = 1970,
}: {
  value?: string | null;
  onChange: (value: string | null) => void;
  placeholder?: string;
  disabled?: boolean;
  allowFuture?: boolean;
  maxYear?: number;
  minYear?: number;
}) {
  const [year = "", month = ""] = (value ?? "").split("-");
  const set = (y: string, m: string) => {
    if (!y && !m) return onChange(null);
    onChange(`${y || new Date().getFullYear()}-${(m || "01").padStart(2, "0")}`);
  };

  const currentYear = new Date().getFullYear();
  const effectiveMaxYear = maxYear ?? (allowFuture ? currentYear + 10 : currentYear);
  const effectiveMinYear = Math.min(minYear, effectiveMaxYear);

  const monthOptions: PopoverSelectOption[] = MONTHS.map((name, i) => ({
    value: String(i + 1).padStart(2, "0"),
    label: name,
  }));

  const yearOptionsList: PopoverSelectOption[] = [];
  for (let y = effectiveMaxYear; y >= effectiveMinYear; y--) {
    yearOptionsList.push({ value: String(y), label: String(y) });
  }

  return (
    <div className="grid grid-cols-2 gap-2">
      <PopoverSelect
        value={month}
        onChange={(m) => set(year, m)}
        options={monthOptions}
        placeholder={placeholder}
        disabled={disabled}
      />
      <PopoverSelect
        value={year}
        onChange={(y) => set(y, month)}
        options={yearOptionsList}
        placeholder="Year"
        disabled={disabled}
      />
    </div>
  );
}

/** Year-only picker for education start/end years with compact scrollable dropdown. */
export function YearSelect({
  value,
  onChange,
  disabled,
  minYear = 1970,
  maxYear,
}: {
  value?: number | null;
  onChange: (year: number | null) => void;
  disabled?: boolean;
  minYear?: number;
  maxYear?: number;
}) {
  const currentYear = new Date().getFullYear();
  const effectiveMaxYear = maxYear ?? currentYear;
  const effectiveMinYear = Math.min(minYear, effectiveMaxYear);

  const options: PopoverSelectOption[] = [];
  for (let y = effectiveMaxYear; y >= effectiveMinYear; y--) {
    options.push({ value: String(y), label: String(y) });
  }

  return (
    <PopoverSelect
      value={value ? String(value) : ""}
      onChange={(v) => onChange(v ? Number(v) : null)}
      options={options}
      placeholder="Select"
      disabled={disabled}
    />
  );
}

/** Blue switch used across the editor (relocate, privacy settings). */
export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (value: boolean) => void; label?: string }) {
  return (
    <button type="button" role="switch" aria-checked={checked} aria-label={label} onClick={() => onChange(!checked)} className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${checked ? "bg-neon-cyan" : "bg-white/15"}`}>
      <span className={`absolute top-0.5 size-5 rounded-full bg-white shadow transition-transform ${checked ? "translate-x-[22px]" : "translate-x-0.5"}`} />
    </button>
  );
}

/** Removable tag chip (skills used, relocation destinations, interests). */
export function TagChip({ children, onRemove }: { children: ReactNode; onRemove?: () => void }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-white/12 bg-white/[0.07] px-3 py-1.5 text-xs font-medium text-white/85">
      {children}
      {onRemove && (
        <button type="button" onClick={onRemove} aria-label="Remove" className="text-white/50 transition-colors hover:text-white">
          <X className="size-3" />
        </button>
      )}
    </span>
  );
}

/** Selectable chip used for workplace/work-type and culture pickers. */
export function ChoiceChip({ selected, onClick, children }: { selected: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${selected ? "border-neon-cyan/60 bg-neon-cyan/15 text-neon-cyan" : "border-white/12 bg-white/[0.03] text-white/60 hover:text-white"}`}
    >
      {children}
    </button>
  );
}

/** Checkbox row matching the design ("I currently work here", "No Expiration"). */
export function CheckboxRow({ checked, onChange, label }: { checked: boolean; onChange: (value: boolean) => void; label: string }) {
  return (
    <button type="button" onClick={() => onChange(!checked)} className="flex w-fit items-center gap-2.5 text-sm text-white/75">
      <span className={`flex size-[18px] items-center justify-center rounded-[5px] border transition-colors ${checked ? "border-neon-cyan bg-neon-cyan text-[#06060f]" : "border-white/25 bg-transparent"}`}>
        {checked && (
          <svg viewBox="0 0 12 12" className="size-3" fill="none" stroke="currentColor" strokeWidth={2.5}>
            <path d="M2 6.5 5 9.5 10 2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </span>
      {label}
    </button>
  );
}

/** ISO date string -> "YYYY-MM" for MonthYearSelect. */
export function toMonthValue(value?: string | Date | null): string | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

/** "YYYY-MM" -> ISO date string for the backend. */
export function monthValueToIso(value?: string | null): string | undefined {
  if (!value) return undefined;
  const [year, month] = value.split("-");
  if (!year || !month) return undefined;
  return new Date(Number(year), Number(month) - 1, 1).toISOString();
}
