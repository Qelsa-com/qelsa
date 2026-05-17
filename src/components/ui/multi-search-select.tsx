"use client";

import { Check, ChevronsUpDown, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Badge } from "./badge";
import { Button } from "./button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "./command";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import { cn } from "./utils";

interface Option {
  id: number;
  name: string;
}

interface MultiSearchSelectProps {
  value: Option[];
  onChange: (value: Option[]) => void;
  onSearch: (query: string) => void;
  options: Option[];
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  className?: string;
}

export function MultiSearchSelect({
  value,
  onChange,
  onSearch,
  options,
  placeholder = "Select...",
  searchPlaceholder = "Search...",
  emptyMessage = "No results found.",
  className,
}: MultiSearchSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  // Re-fire search on open so results are always fresh
  useEffect(() => {
    if (open) onSearch(query);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const selectedIds = new Set(value.map((v) => v.id));

  const toggle = (option: Option) => {
    if (selectedIds.has(option.id)) {
      onChange(value.filter((v) => v.id !== option.id));
    } else {
      onChange([...value, option]);
    }
  };

  const remove = (id: number) => onChange(value.filter((v) => v.id !== id));

  // Show unselected options first, selected ones at the bottom
  const sorted = [...options].sort((a, b) => {
    const aSelected = selectedIds.has(a.id) ? 1 : 0;
    const bSelected = selectedIds.has(b.id) ? 1 : 0;
    return aSelected - bSelected;
  });

  return (
    <div className={cn("space-y-2", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between glass border-glass-border font-normal text-muted-foreground"
          >
            <span>{value.length > 0 ? `${value.length} skill${value.length !== 1 ? "s" : ""} selected` : placeholder}</span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] p-0 glass-strong border-glass-border" align="start">
          <Command shouldFilter={false}>
            <CommandInput
              placeholder={searchPlaceholder}
              value={query}
              onValueChange={(q) => {
                setQuery(q);
                onSearch(q);
              }}
            />
            <CommandList>
              <CommandEmpty>{query.length === 0 ? "Type to search..." : emptyMessage}</CommandEmpty>
              <CommandGroup>
                {sorted.map((option) => (
                  <CommandItem
                    key={option.id}
                    value={String(option.id)}
                    onSelect={() => toggle(option)}
                    className="cursor-pointer"
                  >
                    <Check className={cn("mr-2 h-4 w-4", selectedIds.has(option.id) ? "opacity-100" : "opacity-0")} />
                    {option.name}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {value.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {value.map((skill) => (
            <Badge
              key={skill.id}
              className="bg-neon-purple/20 text-neon-purple border border-neon-purple/30 px-3 py-1.5 flex items-center gap-2 hover:bg-neon-purple/30 transition-all"
            >
              <span>{skill.name}</span>
              <button
                type="button"
                onClick={() => remove(skill.id)}
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
