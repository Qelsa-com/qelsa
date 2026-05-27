"use client";

import { Check, X } from "lucide-react";
import React, { useCallback, useEffect, useRef, useState } from "react";
import ReactDOM from "react-dom";
import { Badge } from "./badge";
import { cn } from "./utils";

export interface MultiAutocompleteOption {
  id: number;
  name: string;
}

interface MultiAutocompleteProps<T extends MultiAutocompleteOption> {
  value: T[];
  onChange: (value: T[]) => void;
  onSearch: (query: string) => void;
  options: T[];
  placeholder?: string;
  icon?: React.ReactNode;
  renderOption?: (option: T, isSelected: boolean, isActive: boolean) => React.ReactNode;
  minChars?: number;
  debounceMs?: number;
  className?: string;
  inputClassName?: string;
  id?: string;
}

export function MultiAutocomplete<T extends MultiAutocompleteOption>({
  value,
  onChange,
  onSearch,
  options,
  placeholder = "Search...",
  icon,
  renderOption,
  minChars = 1,
  debounceMs = 300,
  className,
  inputClassName,
  id,
}: MultiAutocompleteProps<T>) {
  const [inputValue, setInputValue] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [portalStyle, setPortalStyle] = useState<React.CSSProperties>({});
  const [mounted, setMounted] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const isFocusedRef = useRef(false);

  const selectedIds = new Set(value.map((v) => v.id));

  useEffect(() => { setMounted(true); }, []);

  const updatePortalStyle = useCallback(() => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setPortalStyle({
        position: "fixed",
        top: rect.bottom + 4,
        left: rect.left,
        width: rect.width,
        zIndex: 9999,
      });
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    updatePortalStyle();
    window.addEventListener("scroll", updatePortalStyle, true);
    window.addEventListener("resize", updatePortalStyle);
    return () => {
      window.removeEventListener("scroll", updatePortalStyle, true);
      window.removeEventListener("resize", updatePortalStyle);
    };
  }, [open, updatePortalStyle]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (isFocusedRef.current && inputValue.length >= minChars) {
        onSearch(inputValue);
        setOpen(true);
      } else if (inputValue.length < minChars) {
        setOpen(false);
      }
    }, debounceMs);
    return () => clearTimeout(timer);
  }, [inputValue]);

  // Close dropdown on outside click — check both input container and portal list
  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (!containerRef.current?.contains(target) && !listRef.current?.contains(target)) {
        setOpen(false);
        setActiveIndex(-1);
      }
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  // Scroll highlighted item into view
  useEffect(() => {
    if (activeIndex >= 0 && listRef.current) {
      const el = listRef.current.children[activeIndex] as HTMLElement;
      el?.scrollIntoView({ block: "nearest" });
    }
  }, [activeIndex]);

  const toggle = (option: T) => {
    if (selectedIds.has(option.id)) {
      onChange(value.filter((v) => v.id !== option.id));
    } else {
      onChange([...value, option]);
    }
    // Keep input focused so the user can keep searching
    inputRef.current?.focus();
  };

  const remove = (id: number) => onChange(value.filter((v) => v.id !== id));

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!open && options.length > 0) { setOpen(true); return; }
      setActiveIndex((i) => Math.min(i + 1, options.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, -1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (open && activeIndex >= 0 && activeIndex < options.length) {
        toggle(options[activeIndex]);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
      setActiveIndex(-1);
    } else if (e.key === "Backspace" && inputValue === "" && value.length > 0) {
      onChange(value.slice(0, -1));
    }
  };

  // Show unselected options first, selected ones at the bottom
  const sorted = [...options].sort((a, b) => {
    const aSelected = selectedIds.has(a.id) ? 1 : 0;
    const bSelected = selectedIds.has(b.id) ? 1 : 0;
    return aSelected - bSelected;
  });

  const dropdown = open && sorted.length > 0 ? (
    <ul
      ref={listRef}
      role="listbox"
      style={portalStyle}
      className="rounded-lg border border-glass-border bg-gray-900 shadow-xl overflow-y-auto max-h-52"
    >
      {sorted.map((option, index) => {
        const isSelected = selectedIds.has(option.id);
        const isActive = index === activeIndex;
        return (
          <li
            key={option.id}
            role="option"
            aria-selected={isSelected}
            onMouseDown={(e) => {
              e.preventDefault();
              toggle(option);
            }}
            onMouseEnter={() => setActiveIndex(index)}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 text-sm text-white cursor-pointer transition-colors",
              isActive ? "bg-neon-cyan/20" : "hover:bg-neon-cyan/10"
            )}
          >
            {renderOption ? renderOption(option, isSelected, isActive) : (
              <>
                <Check className={cn("h-4 w-4 flex-shrink-0 transition-opacity", isSelected ? "opacity-100 text-neon-cyan" : "opacity-0")} />
                {option.name}
              </>
            )}
          </li>
        );
      })}
    </ul>
  ) : null;

  return (
    <div className={cn("space-y-2", className)}>
      <div ref={containerRef} className="relative">
        {icon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none flex items-center">
            {icon}
          </span>
        )}
        <input
          ref={inputRef}
          id={id}
          type="text"
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            setActiveIndex(-1);
          }}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            isFocusedRef.current = true;
            if (inputValue.length >= minChars && sorted.length > 0) setOpen(true);
          }}
          onBlur={() => {
            isFocusedRef.current = false;
            setInputValue("");
            setOpen(false);
            setActiveIndex(-1);
          }}
          placeholder={placeholder}
          autoComplete="off"
          role="combobox"
          aria-expanded={open}
          aria-autocomplete="list"
          aria-haspopup="listbox"
          className={cn(
            "flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm transition-colors outline-none",
            "placeholder:text-muted-foreground",
            "disabled:cursor-not-allowed disabled:opacity-50",
            icon && "pl-9",
            inputClassName
          )}
        />
        {mounted && dropdown ? ReactDOM.createPortal(dropdown, document.body) : null}
      </div>

      {value.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {value.map((item) => (
            <Badge
              key={item.id}
              className="bg-neon-purple/20 text-neon-purple border border-neon-purple/30 px-3 py-1.5 flex items-center gap-2 hover:bg-neon-purple/30 transition-all"
            >
              <span>{item.name}</span>
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  remove(item.id);
                }}
                className="hover:text-white transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
