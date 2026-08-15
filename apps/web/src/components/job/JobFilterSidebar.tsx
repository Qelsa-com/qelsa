import { Building2, CheckCircle, Clock, DollarSign, Filter, GraduationCap, MapPin, Star, X } from "lucide-react";
import { useState } from "react";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Checkbox } from "../ui/checkbox";
import { Slider } from "../ui/slider";

interface JobFilterSidebarProps {
  isOpen: boolean;
}

export interface JobFilters {
  location: string[];
  experience: string[];
  salary: [number, number];
  workType: string[];
  company: string[];
  jobSource: string[];
}

const locationOptions = [
  { id: "bangalore", label: "Bangalore", count: 156 },
  { id: "mumbai", label: "Mumbai", count: 128 },
  { id: "delhi", label: "Delhi/NCR", count: 98 },
  { id: "hyderabad", label: "Hyderabad", count: 76 },
  { id: "pune", label: "Pune", count: 54 },
  { id: "chennai", label: "Chennai", count: 43 },
  { id: "remote", label: "Remote", count: 89 },
];

const experienceOptions = [
  { id: "0-1", label: "0-1 years", count: 45 },
  { id: "1-3", label: "1-3 years", count: 134 },
  { id: "3-5", label: "3-5 years", count: 178 },
  { id: "5-8", label: "5-8 years", count: 98 },
  { id: "8+", label: "8+ years", count: 67 },
];

const workTypeOptions = [
  { id: "full-time", label: "Full-time", count: 398 },
  { id: "part-time", label: "Part-time", count: 23 },
  { id: "contract", label: "Contract", count: 56 },
  { id: "freelance", label: "Freelance", count: 34 },
  { id: "internship", label: "Internship", count: 78 },
];

const companyOptions = [
  { id: "startup", label: "Startup (1-50)", count: 145 },
  { id: "scale-up", label: "Scale-up (51-500)", count: 167 },
  { id: "enterprise", label: "Enterprise (500+)", count: 234 },
  { id: "unicorn", label: "Unicorn", count: 23 },
  { id: "mnc", label: "MNC", count: 98 },
];

const jobSourceOptions = [
  { id: "kelsa", label: "Kelsa Exclusive", count: 89, exclusive: true },
  { id: "linkedin", label: "LinkedIn", count: 234 },
  { id: "indeed", label: "Indeed", count: 156 },
  { id: "naukri", label: "Naukri", count: 198 },
  { id: "angellist", label: "AngelList", count: 67 },
  { id: "glassdoor", label: "Glassdoor", count: 45 },
];

export function JobFilterSidebar({ isOpen }: JobFilterSidebarProps) {
  const [filters, setFilters] = useState<JobFilters>({
    location: [],
    experience: [],
    salary: [0, 50],
    workType: [],
    company: [],
    jobSource: [],
  });

  const [appliedFiltersCount, setAppliedFiltersCount] = useState(0);

  const handleFilterChange = (category: keyof JobFilters, value: string | [number, number]) => {
    setFilters((prev) => {
      if (category === "salary") {
        return { ...prev, [category]: value as [number, number] };
      } else {
        const currentValues = prev[category] as string[];
        const stringValue = value as string;
        const updatedValues = currentValues.includes(stringValue) ? currentValues.filter((v) => v !== stringValue) : [...currentValues, stringValue];
        return { ...prev, [category]: updatedValues };
      }
    });
  };

  const handleApplyFilters = () => {
    const totalFilters =
      filters.location.length + filters.experience.length + filters.workType.length + filters.company.length + filters.jobSource.length + (filters.salary[0] > 0 || filters.salary[1] < 50 ? 1 : 0);

    setAppliedFiltersCount(totalFilters);
  };

  const handleClearFilters = () => {
    setFilters({
      location: [],
      experience: [],
      salary: [0, 50],
      workType: [],
      company: [],
      jobSource: [],
    });
    setAppliedFiltersCount(0);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden" />

      {/* Sidebar */}
      <div className="fixed top-0 right-0 h-full w-80 glass-strong border-l border-glass-border z-50 overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 glass-strong border-b border-glass-border p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-xl bg-neon-purple/20 flex items-center justify-center">
              <Filter className="h-4 w-4 text-neon-purple" />
            </div>
            <h2 className="font-bold text-foreground">Job Filters</h2>
            {appliedFiltersCount > 0 && <Badge className="bg-neon-purple/20 text-neon-purple border-neon-purple/30">{appliedFiltersCount}</Badge>}
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-foreground hover:text-neon-cyan hover:bg-glass-bg transition-all duration-300">
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="p-4 space-y-6">
          {/* Job Source */}
          <div>
            <h3 className="font-bold text-foreground mb-3 flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-neon-cyan" />
              Job Source
            </h3>
            <div className="space-y-2">
              {jobSourceOptions.map((option) => (
                <div key={option.id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id={`source-${option.id}`}
                      checked={filters.jobSource.includes(option.id)}
                      onCheckedChange={() => handleFilterChange("jobSource", option.id)}
                      className="border-glass-border data-[state=checked]:bg-neon-purple data-[state=checked]:border-neon-purple"
                    />
                    <label htmlFor={`source-${option.id}`} className="text-sm text-foreground cursor-pointer flex items-center gap-2">
                      {option.label}
                      {option.exclusive && <Star className="h-3 w-3 text-neon-yellow fill-current" />}
                    </label>
                  </div>
                  <span className="text-xs text-muted-foreground">{option.count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Location */}
          <div>
            <h3 className="font-bold text-foreground mb-3 flex items-center gap-2">
              <MapPin className="h-4 w-4 text-neon-cyan" />
              Location
            </h3>
            <div className="space-y-2">
              {locationOptions.map((option) => (
                <div key={option.id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id={`location-${option.id}`}
                      checked={filters.location.includes(option.id)}
                      onCheckedChange={() => handleFilterChange("location", option.id)}
                      className="border-glass-border data-[state=checked]:bg-neon-cyan data-[state=checked]:border-neon-cyan"
                    />
                    <label htmlFor={`location-${option.id}`} className="text-sm text-foreground cursor-pointer">
                      {option.label}
                    </label>
                  </div>
                  <span className="text-xs text-muted-foreground">{option.count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Experience */}
          <div>
            <h3 className="font-bold text-foreground mb-3 flex items-center gap-2">
              <GraduationCap className="h-4 w-4 text-neon-purple" />
              Experience
            </h3>
            <div className="space-y-2">
              {experienceOptions.map((option) => (
                <div key={option.id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id={`experience-${option.id}`}
                      checked={filters.experience.includes(option.id)}
                      onCheckedChange={() => handleFilterChange("experience", option.id)}
                      className="border-glass-border data-[state=checked]:bg-neon-purple data-[state=checked]:border-neon-purple"
                    />
                    <label htmlFor={`experience-${option.id}`} className="text-sm text-foreground cursor-pointer">
                      {option.label}
                    </label>
                  </div>
                  <span className="text-xs text-muted-foreground">{option.count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Salary Range */}
          <div>
            <h3 className="font-bold text-foreground mb-3 flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-neon-green" />
              Salary (LPA)
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>₹{filters.salary[0]} LPA</span>
                <span>₹{filters.salary[1] >= 50 ? "50+" : filters.salary[1]} LPA</span>
              </div>
              <Slider
                value={filters.salary}
                onValueChange={(value) => handleFilterChange("salary", value as [number, number])}
                max={50}
                min={0}
                step={1}
                className="[&_[role=slider]]:border-neon-green [&_[role=slider]]:bg-neon-green [&_[data-orientation=horizontal]]:bg-glass-bg"
              />
            </div>
          </div>

          {/* Work Type */}
          <div>
            <h3 className="font-bold text-foreground mb-3 flex items-center gap-2">
              <Clock className="h-4 w-4 text-neon-pink" />
              Work Type
            </h3>
            <div className="space-y-2">
              {workTypeOptions.map((option) => (
                <div key={option.id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id={`worktype-${option.id}`}
                      checked={filters.workType.includes(option.id)}
                      onCheckedChange={() => handleFilterChange("workType", option.id)}
                      className="border-glass-border data-[state=checked]:bg-neon-pink data-[state=checked]:border-neon-pink"
                    />
                    <label htmlFor={`worktype-${option.id}`} className="text-sm text-foreground cursor-pointer">
                      {option.label}
                    </label>
                  </div>
                  <span className="text-xs text-muted-foreground">{option.count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Company Size */}
          <div>
            <h3 className="font-bold text-foreground mb-3 flex items-center gap-2">
              <Building2 className="h-4 w-4 text-neon-yellow" />
              Company Size
            </h3>
            <div className="space-y-2">
              {companyOptions.map((option) => (
                <div key={option.id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id={`company-${option.id}`}
                      checked={filters.company.includes(option.id)}
                      onCheckedChange={() => handleFilterChange("company", option.id)}
                      className="border-glass-border data-[state=checked]:bg-neon-yellow data-[state=checked]:border-neon-yellow"
                    />
                    <label htmlFor={`company-${option.id}`} className="text-sm text-foreground cursor-pointer">
                      {option.label}
                    </label>
                  </div>
                  <span className="text-xs text-muted-foreground">{option.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="sticky bottom-0 glass-strong border-t border-glass-border p-4 flex gap-3">
          <Button variant="outline" onClick={handleClearFilters} className="flex-1 border-glass-border text-muted-foreground hover:text-foreground hover:border-neon-cyan">
            Clear All
          </Button>
          <Button onClick={handleApplyFilters} className="flex-1 gradient-animated text-black font-bold hover:scale-105 transition-all duration-300 glow-cyan">
            Apply Filters
          </Button>
        </div>
      </div>
    </>
  );
}
