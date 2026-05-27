"use client";

import { X } from "lucide-react";
import React, { useCallback, useEffect, useRef, useState } from "react";
import ReactDOM from "react-dom";
import { cn } from "./utils";

export interface AutocompleteOption {
  id: number;
  name: string;
}

interface AutocompleteProps<T extends AutocompleteOption> {
  value: T | null | undefined;
  onChange: (value: T | null) => void;
  onSearch: (query: string) => void;
  options: T[];
  placeholder?: string;
  icon?: React.ReactNode;
  /** Custom label shown in the input when an option is selected. Defaults to option.name. */
  getInputLabel?: (option: T) => string;
  renderOption?: (option: T, isActive: boolean) => React.ReactNode;
  minChars?: number;
  debounceMs?: number;
  className?: string;
  inputClassName?: string;
  id?: string;
}

export function Autocomplete<T extends AutocompleteOption>({
  value,
  onChange,
  onSearch,
  options,
  placeholder = "Search...",
  icon,
  getInputLabel,
  renderOption,
  minChars = 2,
  debounceMs = 300,
  className,
  inputClassName,
  id,
}: AutocompleteProps<T>) {
  const getLabel = (option: T) => (getInputLabel ? getInputLabel(option) : option.name);

  const [inputValue, setInputValue] = useState(value ? getLabel(value) : "");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [portalStyle, setPortalStyle] = useState<React.CSSProperties>({});
  const [mounted, setMounted] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  // Prevents the external-value sync effect from clearing the input mid-keystroke.
  const fromUserRef = useRef(false);
  // Prevents the debounce from reopening the dropdown after the input loses focus.
  const isFocusedRef = useRef(false);

  useEffect(() => { setMounted(true); }, []);

  // Position the portal dropdown below the input, keeping it in sync on scroll/resize.
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

  // Sync value → inputValue when changed externally (not by user typing or selecting)
  useEffect(() => {
    if (fromUserRef.current) {
      fromUserRef.current = false;
      return;
    }
    setInputValue(value ? getLabel(value) : "");
    if (!value) setOpen(false);
  }, [value]);

  // Debounced search — only fires when focused and no option is selected
  useEffect(() => {
    if (value) return;
    const timer = setTimeout(() => {
      if (isFocusedRef.current && inputValue.length >= minChars) {
        onSearch(inputValue);
        setOpen(true);
      } else if (inputValue.length < minChars) {
        setOpen(false);
      }
    }, debounceMs);
    return () => clearTimeout(timer);
  }, [inputValue, value]);

  // Close dropdown on outside click — must check both the input container and the portal list
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    fromUserRef.current = true;
    if (value) onChange(null);
    setInputValue(e.target.value);
    setActiveIndex(-1);
  };

  const handleSelect = (option: T) => {
    fromUserRef.current = true;
    onChange(option);
    setInputValue(getLabel(option));
    setOpen(false);
    setActiveIndex(-1);
  };

  const handleClear = () => {
    if (value) onChange(null);
    setInputValue("");
    setOpen(false);
    setActiveIndex(-1);
    inputRef.current?.focus();
  };

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
        handleSelect(options[activeIndex]);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
      setActiveIndex(-1);
    }
  };

  const showClear = Boolean(value || inputValue);

  const dropdown = open && options.length > 0 ? (
    <ul
      ref={listRef}
      role="listbox"
      style={portalStyle}
      className="rounded-lg border border-glass-border bg-gray-900 shadow-xl overflow-y-auto max-h-52"
    >
      {options.map((option, index) => (
        <li
          key={option.id}
          role="option"
          aria-selected={value?.id === option.id}
          onMouseDown={(e) => {
            e.preventDefault();
            handleSelect(option);
          }}
          onMouseEnter={() => setActiveIndex(index)}
          className={cn(
            "flex items-center gap-2 px-4 py-2.5 text-sm text-white cursor-pointer transition-colors",
            index === activeIndex ? "bg-neon-cyan/20" : "hover:bg-neon-cyan/10"
          )}
        >
          {renderOption ? renderOption(option, index === activeIndex) : option.name}
        </li>
      ))}
    </ul>
  ) : null;

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <div className="relative">
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
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            isFocusedRef.current = true;
            if (!value && inputValue.length >= minChars && options.length > 0) {
              setOpen(true);
            }
          }}
          onBlur={() => {
            isFocusedRef.current = false;
            if (!value) {
              setInputValue("");
              setOpen(false);
              setActiveIndex(-1);
            }
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
            showClear && "pr-8",
            inputClassName
          )}
        />
        {showClear && (
          <button
            type="button"
            onClick={handleClear}
            tabIndex={-1}
            aria-label="Clear"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {mounted && dropdown ? ReactDOM.createPortal(dropdown, document.body) : null}
    </div>
  );
}
