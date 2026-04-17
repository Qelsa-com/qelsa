import { useGetCitiesQuery, useGetJobTypesQuery } from "@/features/api/jobsApi";
import { BarChart3, Briefcase, Building2, Clock, DollarSign, Filter, History, MapPin, Search, SlidersHorizontal, Sparkles, TrendingUp, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Input } from "./ui/input";

export interface SearchFilters {
  cities: string[];
  job_types: string[];
  experience_levels: string[];
  departments: string[];
  salary_min?: number;
  salary_max?: number;
  remote: boolean;
  sort_by: "relevance" | "date" | "salary";
}

const EXAMPLE_QUERIES = [
  "software engineering roles with Python and cloud experience",
  "entry-level marketing positions with remote work",
  "product manager jobs in fintech with Agile experience",
  "senior data scientist with machine learning",
  "frontend developer React TypeScript remote",
  "DevOps engineer with Kubernetes AWS experience",
];

const TRENDING_SEARCHES = ["remote software engineer", "AI/ML engineer", "product designer", "data scientist", "DevOps engineer"];

// const EXPERIENCE_LEVELS = ['Entry Level', 'Mid Level', 'Senior', 'Lead', 'Executive'];
const DEPARTMENTS = [
  { value: "technology", name: "Technology" },
  { value: "finance", name: "Finance" },
  { value: "healthcare", name: "Healthcare" },
  { value: "education", name: "Education" },
  { value: "ecommerce", name: "commerce" },
  { value: "entertainment", name: "Entertainment" },
  { value: "consulting", name: "Consulting" },
  { value: "manufacturing", name: "Manufacturing" },
  { value: "other", name: "Other" },
];

export function NLPJobSearch({ filters, setFilters, query, setQuery, onSearch }) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const searchRef = useRef<HTMLDivElement>(null);

  const { data: cities, error: cityError, isLoading: cityLoading } = useGetCitiesQuery();
  const { data: job_types, error: typeError, isLoading: typeLoading } = useGetJobTypesQuery();

  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % EXAMPLE_QUERIES.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem("recentJobSearches");
    if (saved) {
      setRecentSearches(JSON.parse(saved));
    }
  }, []);

  const handleSearch = () => {
    const updated = [query, ...recentSearches.filter((s) => s !== query)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem("recentJobSearches", JSON.stringify(updated));

    onSearch(query, filters);
    setShowSuggestions(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const handleClear = () => {
    setQuery({});
    setFilters({
      cities: [],
      job_types: [],
      experience_levels: [],
      departments: [],
      remote: false,
      sort_by: "relevance",
    });
    // onClear();
  };

  const handleSelectSuggestion = (suggestion: string) => {
    setQuery(suggestion);
    setShowSuggestions(false);
    onSearch(suggestion, filters);

    // Save to recent searches
    const updated = [suggestion, ...recentSearches.filter((s) => s !== suggestion)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem("recentJobSearches", JSON.stringify(updated));
  };

  const toggleFilter = <K extends keyof SearchFilters>(key: K, value: SearchFilters[K] extends Array<infer T> ? T : never) => {
    setFilters((prev) => {
      const current = prev[key];
      if (Array.isArray(current)) {
        const newArray = current.includes(value as any) ? current.filter((v: any) => v !== value) : [...current, value];
        return { ...prev, [key]: newArray };
      }
      return prev;
    });
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem("recentJobSearches");
  };

  const activeFilterCount = filters.cities.length + filters.job_types.length + filters.experience_levels.length + filters.departments.length + (filters.salary_min ? 1 : 0) + (filters.remote ? 1 : 0);

  return (
    <div className="w-full space-y-4">
      {/* Main Search Bar */}
      <div ref={searchRef} className="relative">
        <Card className="glass border-glass-border overflow-hidden">
          <div className="flex items-center gap-3 p-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neon-cyan" />
              <Sparkles className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neon-purple animate-pulse" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => setShowSuggestions(true)}
                onKeyDown={handleKeyDown}
                // placeholder={placeholder || EXAMPLE_QUERIES[placeholderIndex]}
                className="pl-11 pr-11 h-12 bg-background/50 border-0 text-base focus-visible:ring-2 focus-visible:ring-neon-cyan/50"
              />
            </div>

            {query && (
              <Button variant="ghost" size="icon" onClick={handleClear} className="text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </Button>
            )}

            <Button onClick={() => setShowFilters(!showFilters)} variant="outline" className="relative border-glass-border hover:border-neon-purple/50">
              <SlidersHorizontal className="w-4 h-4 mr-2" />
              Filters
              {activeFilterCount > 0 && <Badge className="ml-2 bg-neon-cyan text-black border-0 text-xs">{activeFilterCount}</Badge>}
            </Button>

            <Button onClick={handleSearch} className="gradient-animated px-6">
              <Search className="w-4 h-4 mr-2" />
              Search
            </Button>
          </div>

          {/* Suggestions Dropdown */}
          {showSuggestions && (
            <div className="border-t border-glass-border bg-background/95 backdrop-blur-xl">
              <div className="p-4 space-y-4 max-h-96 overflow-y-auto">
                {/* Recent Searches */}
                {recentSearches.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <History className="w-3 h-3" />
                        <span>Recent Searches</span>
                      </div>
                      <Button variant="ghost" size="sm" onClick={clearRecentSearches} className="h-6 text-xs text-muted-foreground hover:text-foreground">
                        Clear
                      </Button>
                    </div>
                    <div className="space-y-1">
                      {recentSearches.map((search, index) => (
                        <button key={index} onClick={() => handleSelectSuggestion(search)} className="w-full text-left px-3 py-2 rounded-lg hover:bg-muted/50 text-sm flex items-center gap-2 transition-colors">
                          <Clock className="w-3 h-3 text-muted-foreground" />
                          {search}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Trending Searches */}
                <div>
                  <div className="flex items-center gap-2 mb-2 text-xs text-muted-foreground">
                    <TrendingUp className="w-3 h-3" />
                    <span>Trending Searches</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {TRENDING_SEARCHES.map((search, index) => (
                      <Badge key={index} variant="outline" className="cursor-pointer border-glass-border hover:border-neon-cyan/50 hover:bg-neon-cyan/10 transition-all" onClick={() => handleSelectSuggestion(search)}>
                        {search}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Example Queries */}
                <div>
                  <div className="flex items-center gap-2 mb-2 text-xs text-muted-foreground">
                    <Sparkles className="w-3 h-3" />
                    <span>Try These Examples</span>
                  </div>
                  <div className="space-y-1">
                    {EXAMPLE_QUERIES.slice(0, 4).map((example, index) => (
                      <button key={index} onClick={() => handleSelectSuggestion(example)} className="w-full text-left px-3 py-2 rounded-lg hover:bg-muted/50 text-sm text-muted-foreground hover:text-foreground transition-colors">
                        {example}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Advanced Filters Panel */}
      {showFilters && (
        <Card className="glass border-glass-border p-6 animate-in slide-in-from-top-2 duration-200">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold flex items-center gap-2">
                <Filter className="w-4 h-4 text-neon-cyan" />
                Advanced Filters
              </h3>
              {activeFilterCount > 0 && (
                <Button variant="ghost" size="sm" onClick={handleClear} className="text-xs text-muted-foreground hover:text-foreground">
                  Clear All
                </Button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Location */}
              <div>
                <label className="text-sm flex items-center gap-2 mb-3 text-muted-foreground">
                  <MapPin className="w-3 h-3" />
                  Location
                </label>
                <div className="space-y-2">
                  {cities?.map((location) => (
                    <label key={location} className="flex items-center gap-2 cursor-pointer group">
                      <input type="checkbox" checked={filters.cities.includes(location)} onChange={() => toggleFilter("cities", location)} className="rounded border-glass-border bg-background/50 text-neon-cyan focus:ring-neon-cyan/50" />
                      <span className="text-sm group-hover:text-foreground transition-colors">{location}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Job Type */}
              <div>
                <label className="text-sm flex items-center gap-2 mb-3 text-muted-foreground">
                  <Briefcase className="w-3 h-3" />
                  Job Type
                </label>
                <div className="space-y-2">
                  {job_types?.map((type) => (
                    <label key={type} className="flex items-center gap-2 cursor-pointer group">
                      <input type="checkbox" checked={filters.job_types.includes(type)} onChange={() => toggleFilter("job_types", type)} className="rounded border-glass-border bg-background/50 text-neon-cyan focus:ring-neon-cyan/50" />
                      <span className="text-sm group-hover:text-foreground transition-colors">{type}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Experience Level */}
              {/* <div>
                <label className="text-sm flex items-center gap-2 mb-3 text-muted-foreground">
                  <BarChart3 className="w-3 h-3" />
                  Experience Level
                </label>
                <div className="space-y-2">
                  {EXPERIENCE_LEVELS.map((level) => (
                    <label key={level} className="flex items-center gap-2 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={filters.experience_levels.includes(level)}
                        onChange={() => toggleFilter('experience_levels', level)}
                        className="rounded border-glass-border bg-background/50 text-neon-cyan focus:ring-neon-cyan/50"
                      />
                      <span className="text-sm group-hover:text-foreground transition-colors">
                        {level}
                      </span>
                    </label>
                  ))}
                </div>
              </div> */}

              {/* Department */}
              <div>
                <label className="text-sm flex items-center gap-2 mb-3 text-muted-foreground">
                  <Building2 className="w-3 h-3" />
                  Department
                </label>
                <div className="space-y-2">
                  {DEPARTMENTS.map((department) => (
                    <label key={department.value} className="flex items-center gap-2 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={filters.departments.includes(department.value)}
                        onChange={() => toggleFilter("departments", department.value)}
                        className="rounded border-glass-border bg-background/50 text-neon-cyan focus:ring-neon-cyan/50"
                      />
                      <span className="text-sm group-hover:text-foreground transition-colors">{department.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Salary Range */}
              <div className="md:col-span-2">
                <label className="text-sm flex items-center gap-2 mb-3 text-muted-foreground">
                  <DollarSign className="w-3 h-3" />
                  Salary Range
                </label>
                <div className="flex items-center gap-4">
                  <Input
                    type="number"
                    placeholder="Min"
                    value={filters.salary_min || ""}
                    onChange={(e) =>
                      setFilters((prev) => ({
                        ...prev,
                        salary_min: e.target.value ? parseInt(e.target.value) : undefined,
                      }))
                    }
                    className="glass border-glass-border"
                  />
                  <span className="text-muted-foreground">to</span>
                  <Input
                    type="number"
                    placeholder="Max"
                    value={filters.salary_max || ""}
                    onChange={(e) =>
                      setFilters((prev) => ({
                        ...prev,
                        salary_max: e.target.value ? parseInt(e.target.value) : undefined,
                      }))
                    }
                    className="glass border-glass-border"
                  />
                </div>
              </div>

              {/* Sort By */}
              <div>
                <label className="text-sm flex items-center gap-2 mb-3 text-muted-foreground">
                  <SlidersHorizontal className="w-3 h-3" />
                  Sort By
                </label>
                <select
                  value={filters.sort_by}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      sort_by: e.target.value as SearchFilters["sort_by"],
                    }))
                  }
                  className="w-full px-3 py-2 rounded-lg glass border-glass-border bg-background/50 text-sm focus:ring-2 focus:ring-neon-cyan/50 focus:border-neon-cyan"
                >
                  <option value="relevance">Relevance</option>
                  <option value="date">Date Posted</option>
                  <option value="salary">Salary</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-glass-border">
              <Button variant="outline" onClick={() => setShowFilters(false)} className="border-glass-border">
                Cancel
              </Button>
              <Button onClick={handleSearch} className="gradient-animated">
                Apply Filters
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Active Filters Display */}
      {activeFilterCount > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-muted-foreground">Active filters:</span>
          {filters.cities.map((loc) => (
            <Badge key={loc} variant="outline" className="border-neon-cyan/30 text-neon-cyan">
              <MapPin className="w-3 h-3 mr-1" />
              {loc}
              <X className="w-3 h-3 ml-1 cursor-pointer" onClick={() => toggleFilter("cities", loc)} />
            </Badge>
          ))}
          {filters.job_types.map((type) => (
            <Badge key={type} variant="outline" className="border-neon-purple/30 text-neon-purple">
              <Briefcase className="w-3 h-3 mr-1" />
              {type}
              <X className="w-3 h-3 ml-1 cursor-pointer" onClick={() => toggleFilter("job_types", type)} />
            </Badge>
          ))}
          {filters.experience_levels.map((level) => (
            <Badge key={level} variant="outline" className="border-neon-pink/30 text-neon-pink">
              <BarChart3 className="w-3 h-3 mr-1" />
              {level}
              <X className="w-3 h-3 ml-1 cursor-pointer" onClick={() => toggleFilter("experience_levels", level)} />
            </Badge>
          ))}
          {filters.departments.map((department) => (
            <Badge key={department} variant="outline" className="border-neon-blue/30 text-neon-blue">
              <Building2 className="w-3 h-3 mr-1" />
              {department}
              <X className="w-3 h-3 ml-1 cursor-pointer" onClick={() => toggleFilter("departments", department)} />
            </Badge>
          ))}
          {filters.salary_min && (
            <Badge variant="outline" className="border-neon-green/30 text-neon-green">
              <DollarSign className="w-3 h-3 mr-1" />
              Min: ${filters.salary_min.toLocaleString()}
              <X className="w-3 h-3 ml-1 cursor-pointer" onClick={() => setFilters((prev) => ({ ...prev, salary_min: undefined }))} />
            </Badge>
          )}
          {filters.salary_max && (
            <Badge variant="outline" className="border-neon-green/30 text-neon-green">
              <DollarSign className="w-3 h-3 mr-1" />
              Max: ${filters.salary_max.toLocaleString()}
              <X className="w-3 h-3 ml-1 cursor-pointer" onClick={() => setFilters((prev) => ({ ...prev, salary_max: undefined }))} />
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}
