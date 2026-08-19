import { Loader2, Search, Sparkles, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

export type ApplicantSearchChip = {
  id: string;
  label: string;
  category: "skill" | "experience" | "location" | "education" | "status" | "readiness" | "other";
};

export function CandidateNLPSearch({
  query,
  onQueryChange,
  onSubmit,
  onClear,
  chips = [],
  isLoading = false,
  className = "",
  placeholder = "Search applicants...",
}: {
  query: string;
  onQueryChange: (query: string) => void;
  onSubmit: (query: string) => void;
  onClear: () => void;
  chips?: ApplicantSearchChip[];
  isLoading?: boolean;
  className?: string;
  placeholder?: string;
}) {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const handleInputChange = (value: string) => {
    onQueryChange(value);
    setIsTyping(true);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      onSubmit(value);
    }, 450);
  };

  const handleClear = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsTyping(false);
    onQueryChange("");
    onClear();
  };

  return (
    <div className="space-y-3">
      <div className="relative">
        <div className="absolute left-4 top-1/2 z-10 -translate-y-1/2">
          <Search className="h-5 w-5 text-neon-cyan" />
        </div>

        <Input
          value={query}
          onChange={(event) => handleInputChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              if (timeoutRef.current) clearTimeout(timeoutRef.current);
              setIsTyping(false);
              onSubmit(query);
            }
          }}
          placeholder={placeholder}
          className={`glass h-14 border-glass-border pl-12 pr-40 text-base transition-all focus:border-neon-cyan/50 ${className}`}
        />

        <div className="absolute right-4 top-1/2 flex -translate-y-1/2 items-center gap-2">
          {isTyping || isLoading ? <Loader2 className="h-4 w-4 animate-spin text-neon-cyan" /> : <Sparkles className="h-4 w-4 text-neon-purple" />}
          {query && !isLoading ? (
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleClear}>
              <X className="h-4 w-4" />
            </Button>
          ) : null}
          <span className="whitespace-nowrap text-xs text-muted-foreground">Powered by Qelsa AI</span>
        </div>
      </div>

      {chips.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {chips.map((chip) => (
            <Badge key={chip.id} variant="outline" className={`${chipColor(chip.category)} px-3 py-1.5 text-sm`}>
              {chip.label}
            </Badge>
          ))}
          <Button variant="ghost" size="sm" onClick={handleClear} className="h-7 text-xs text-muted-foreground hover:text-foreground">
            Clear all
          </Button>
        </div>
      ) : null}

      {isLoading && query ? (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Sparkles className="h-3 w-3 text-neon-cyan" />
          <span>Searching applicants…</span>
        </div>
      ) : null}
    </div>
  );
}

function chipColor(category: ApplicantSearchChip["category"]) {
  switch (category) {
    case "skill":
      return "border-neon-purple/40 bg-neon-purple/10 text-neon-purple";
    case "experience":
      return "border-neon-cyan/40 bg-neon-cyan/10 text-neon-cyan";
    case "location":
      return "border-neon-pink/40 bg-neon-pink/10 text-neon-pink";
    case "education":
      return "border-neon-yellow/40 bg-neon-yellow/10 text-neon-yellow";
    case "status":
      return "border-neon-green/40 bg-neon-green/10 text-neon-green";
    case "readiness":
      return "border-neon-cyan/40 bg-neon-cyan/10 text-neon-cyan";
    default:
      return "border-white/20 bg-white/5 text-white/70";
  }
}
