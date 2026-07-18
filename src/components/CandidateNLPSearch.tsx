import { Loader2, Sparkles, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

interface FilterChip {
  id: string;
  label: string;
  category: "skill" | "experience" | "location" | "education" | "other";
}

interface CandidateNLPSearchProps {
  onSearch: (query: string, filters: FilterChip[]) => void;
  onClear: () => void;
  isLoading?: boolean;
  className?: string;
  placeholder?: string;
}

export function CandidateNLPSearch({ onSearch, onClear, isLoading = false, className = "", placeholder = "Filter candidates using natural language…" }: CandidateNLPSearchProps) {
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<FilterChip[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(null);

  // Simulate NLP parsing to extract filters from query
  const parseQueryToFilters = (searchQuery: string): FilterChip[] => {
    if (!searchQuery.trim()) return [];

    const extractedFilters: FilterChip[] = [];
    const lowerQuery = searchQuery.toLowerCase();

    // Extract skills
    const skillKeywords = ["react", "typescript", "javascript", "python", "java", "node.js", "aws", "docker", "kubernetes", "next.js", "vue", "angular", "graphql", "redux", "tailwind"];
    skillKeywords.forEach((skill) => {
      if (lowerQuery.includes(skill)) {
        extractedFilters.push({
          id: `skill-${skill}`,
          label: skill.charAt(0).toUpperCase() + skill.slice(1),
          category: "skill",
        });
      }
    });

    // Extract experience
    const experienceMatch = lowerQuery.match(/(\d+)\+?\s*(years?|yrs?)\s*(experience|exp)?/i);
    if (experienceMatch) {
      const years = experienceMatch[1];
      extractedFilters.push({
        id: `experience-${years}`,
        label: `${years}+ years experience`,
        category: "experience",
      });
    }

    // Extract locations
    const locationKeywords = ["bangalore", "mumbai", "delhi", "hyderabad", "san francisco", "new york", "austin", "remote", "seattle", "boston"];
    locationKeywords.forEach((location) => {
      if (lowerQuery.includes(location)) {
        extractedFilters.push({
          id: `location-${location}`,
          label: location
            .split(" ")
            .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
            .join(" "),
          category: "location",
        });
      }
    });

    // Extract education
    const educationKeywords = ["phd", "masters", "bachelor", "mba", "degree", "m.s.", "b.s."];
    educationKeywords.forEach((edu) => {
      if (lowerQuery.includes(edu)) {
        let label = edu.toUpperCase();
        if (edu === "masters") label = "Master's Degree";
        if (edu === "bachelor") label = "Bachelor's Degree";
        extractedFilters.push({
          id: `education-${edu}`,
          label: label,
          category: "education",
        });
      }
    });

    // Extract industry/domain keywords
    const industryKeywords = ["fintech", "healthcare", "e-commerce", "startup", "enterprise", "saas", "b2b", "b2c"];
    industryKeywords.forEach((industry) => {
      if (lowerQuery.includes(industry)) {
        extractedFilters.push({
          id: `industry-${industry}`,
          label: `${industry.charAt(0).toUpperCase() + industry.slice(1)} experience`,
          category: "other",
        });
      }
    });

    return extractedFilters;
  };

  const handleInputChange = (value: string) => {
    setQuery(value);
    setIsTyping(true);

    // Clear existing timeout
    if (typingTimeout) {
      clearTimeout(typingTimeout);
    }

    // Set new timeout to parse query after user stops typing
    const timeout = setTimeout(() => {
      setIsTyping(false);
      if (value.trim()) {
        const parsedFilters = parseQueryToFilters(value);
        setFilters(parsedFilters);
        onSearch(value, parsedFilters);
      } else {
        setFilters([]);
        onClear();
      }
    }, 800); // Wait 800ms after user stops typing

    setTypingTimeout(timeout);
  };

  const handleRemoveFilter = (filterId: string) => {
    const updatedFilters = filters.filter((f) => f.id !== filterId);
    setFilters(updatedFilters);

    // Trigger search with updated filters
    onSearch(query, updatedFilters);
  };

  const handleClear = () => {
    setQuery("");
    setFilters([]);
    onClear();
  };

  const getCategoryColor = (category: FilterChip["category"]) => {
    switch (category) {
      case "skill":
        return "border-neon-purple/40 text-neon-purple bg-neon-purple/10";
      case "experience":
        return "border-neon-cyan/40 text-neon-cyan bg-neon-cyan/10";
      case "location":
        return "border-neon-pink/40 text-neon-pink bg-neon-pink/10";
      case "education":
        return "border-neon-yellow/40 text-neon-yellow bg-neon-yellow/10";
      default:
        return "border-neon-green/40 text-neon-green bg-neon-green/10";
    }
  };

  useEffect(() => {
    return () => {
      if (typingTimeout) {
        clearTimeout(typingTimeout);
      }
    };
  }, [typingTimeout]);

  return (
    <div className="space-y-3">
      {/* Search Input */}
      <div className="relative">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10">
          <Sparkles className="w-5 h-5 text-neon-cyan" />
        </div>

        <Input
          value={query}
          onChange={(e) => handleInputChange(e.target.value)}
          placeholder={placeholder}
          className={`glass border-glass-border pl-12 pr-32 h-14 text-base focus:border-neon-cyan/50 transition-all ${className}`}
        />

        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
          {isTyping || isLoading ? <Loader2 className="w-4 h-4 text-neon-cyan animate-spin" /> : null}

          {query && !isLoading && (
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleClear}>
              <X className="w-4 h-4" />
            </Button>
          )}

          <span className="text-xs text-muted-foreground whitespace-nowrap">Powered by Qelsa AI</span>
        </div>
      </div>

      {/* Filter Chips */}
      {filters.length > 0 && (
        <div className="flex flex-wrap gap-2 animate-in fade-in slide-in-from-top-2 duration-300">
          {filters.map((filter) => (
            <Badge key={filter.id} variant="outline" className={`${getCategoryColor(filter.category)} pl-3 pr-2 py-1.5 text-sm transition-all hover:scale-105`}>
              {filter.label}
              <button onClick={() => handleRemoveFilter(filter.id)} className="ml-2 hover:bg-white/10 rounded-full p-0.5 transition-colors">
                <X className="w-3 h-3" />
              </button>
            </Badge>
          ))}

          {filters.length > 1 && (
            <Button variant="ghost" size="sm" onClick={handleClear} className="h-7 text-xs text-muted-foreground hover:text-foreground">
              Clear all
            </Button>
          )}
        </div>
      )}

      {/* Typing indicator */}
      {isTyping && query && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground animate-pulse">
          <Sparkles className="w-3 h-3 text-neon-cyan" />
          <span>Analyzing query...</span>
        </div>
      )}
    </div>
  );
}
