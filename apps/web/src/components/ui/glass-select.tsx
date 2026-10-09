"use client";

import { Check, ChevronDown } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";

export interface GlassSelectOption {
  value: string;
  label: string;
}

export interface GlassSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: GlassSelectOption[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  buttonClassName?: string;
  size?: "sm" | "default";
}

export function GlassSelect({
  value,
  onChange,
  options,
  placeholder = "Select...",
  disabled = false,
  className = "",
  buttonClassName = "",
  size = "default",
}: GlassSelectProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [alignRight, setAlignRight] = useState(false);

  useEffect(() => {
    if (open && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setAlignRight(rect.left + 220 > window.innerWidth);
    }
  }, [open]);

  const selectedOption = options.find((o) => o.value === value);
  const heightClass = size === "sm" ? "h-9 text-xs" : "h-11 sm:h-12 text-sm";
  const paddingClass = size === "sm" ? "px-3" : "px-4";

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((prev) => !prev)}
        className={`flex w-full items-center justify-between gap-2 rounded-xl border border-glass-border bg-white/[0.04] ${heightClass} ${paddingClass} font-medium text-white transition-colors hover:border-white/20 focus:border-neon-cyan focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 ${buttonClassName}`}
      >
        <span className={`truncate text-left ${selectedOption ? "text-white" : "text-white/45"}`}>
          {selectedOption?.label ?? placeholder}
        </span>
        <ChevronDown
          className={`size-4 shrink-0 text-white/50 transition-transform ${open ? "rotate-180 text-neon-cyan" : ""}`}
        />
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={(e) => {
              e.stopPropagation();
              setOpen(false);
            }}
          />
          <div
            className={`absolute z-50 mt-1.5 w-full min-w-[160px] max-h-60 overflow-y-auto no-scrollbar rounded-xl border border-glass-border bg-[#1a1a24] p-1.5 shadow-2xl ${
              alignRight ? "right-0" : "left-0"
            }`}
          >
            {options.map((option) => {
              const isSelected = option.value === value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onChange(option.value);
                    setOpen(false);
                  }}
                  className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-white/5 ${
                    isSelected
                      ? "bg-neon-cyan/10 font-semibold text-neon-cyan"
                      : "text-white/80 hover:text-white"
                  }`}
                >
                  <span className="truncate">{option.label}</span>
                  {isSelected && <Check className="size-3.5 shrink-0 text-neon-cyan" />}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
