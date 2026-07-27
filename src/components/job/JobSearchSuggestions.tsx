import { formatCity } from "@/constants/city";
import { Award, Briefcase, Building2, MapPin, Search } from "lucide-react";
import { Badge } from "../ui/badge";
import { Card } from "../ui/card";
import { Job } from "@/types/job";

interface JobSearchSuggestionsProps {
  query: string;
  allJobs: Job[];
  onSelectSuggestion: (suggestion: string) => void;
  onSelectJob: (job: Job) => void;
}

export function JobSearchSuggestions({ query, allJobs, onSelectSuggestion, onSelectJob }: JobSearchSuggestionsProps) {
  if (!query || query.length < 2) return null;

  const lowerQuery = query.toLowerCase();

  // Get unique job titles/roles that match
  const roleSuggestions = Array.from(new Set(allJobs.filter((job) => job.title.toLowerCase().includes(lowerQuery)).map((job) => job.title))).slice(0, 5);

  // Get matching companies
  const companySuggestions = Array.from(new Set(allJobs.filter((job) => job.company_name.toLowerCase().includes(lowerQuery)).map((job) => job.company_name))).slice(0, 3);

  // Get matching skills
  // const skillSuggestions = Array.from(new Set(allJobs.flatMap((job) => job.skills).filter((skill) => skill.toLowerCase().includes(lowerQuery)))).slice(0, 5);
  const skillSuggestions = []

  // Get matching locations
  const locationSuggestions = Array.from(new Set(allJobs.filter((job) => job.city).map((job) => formatCity(job.city!)).filter((location) => location.toLowerCase().includes(lowerQuery)))).slice(0, 3);

  const hasAnySuggestions = roleSuggestions.length > 0 || companySuggestions.length > 0 || skillSuggestions.length > 0 || locationSuggestions.length > 0;

  if (!hasAnySuggestions) return null;

  return (
    <Card className="absolute top-full left-0 right-0 mt-2 bg-[#0a0a0f]/98 backdrop-blur-2xl border-2 border-neon-cyan/40 shadow-2xl shadow-neon-cyan/30 z-[10000] max-h-[600px] overflow-y-auto">
      <div className="p-4 space-y-4">
        {/* Job Title Suggestions */}
        {roleSuggestions.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Briefcase className="w-4 h-4 text-neon-purple" />
              <h3 className="text-sm font-semibold text-muted-foreground">Job Roles</h3>
            </div>
            <div className="space-y-1">
              {roleSuggestions.map((title, index) => {
                const jobCount = allJobs.filter((job) => job.title === title).length;
                return (
                  <button
                    key={index}
                    onClick={() => onSelectSuggestion(title)}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/5 transition-colors text-sm flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-2">
                      <Search className="w-3.5 h-3.5 text-muted-foreground group-hover:text-neon-cyan transition-colors" />
                      <span className="group-hover:text-neon-cyan transition-colors">{title}</span>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {jobCount} jobs
                    </Badge>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Company Suggestions */}
        {companySuggestions.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Building2 className="w-4 h-4 text-neon-pink" />
              <h3 className="text-sm font-semibold text-muted-foreground">Companies</h3>
            </div>
            <div className="space-y-1">
              {companySuggestions.map((company, index) => (
                <button
                  key={index}
                  onClick={() => onSelectSuggestion(company)}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/5 transition-colors text-sm flex items-center gap-2 group"
                >
                  <Search className="w-3.5 h-3.5 text-muted-foreground group-hover:text-neon-cyan transition-colors" />
                  <span className="group-hover:text-neon-cyan transition-colors">{company}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Skill Suggestions */}
        {skillSuggestions.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Award className="w-4 h-4 text-neon-green" />
              <h3 className="text-sm font-semibold text-muted-foreground">Skills</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {skillSuggestions.map((skill, index) => (
                <button
                  key={index}
                  onClick={() => onSelectSuggestion(skill)}
                  className="px-3 py-1.5 rounded-full text-xs bg-white/5 hover:bg-neon-cyan/20 border border-white/10 hover:border-neon-cyan/50 transition-all hover:text-neon-cyan"
                >
                  {skill}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Location Suggestions */}
        {locationSuggestions.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="w-4 h-4 text-neon-yellow" />
              <h3 className="text-sm font-semibold text-muted-foreground">Locations</h3>
            </div>
            <div className="space-y-1">
              {locationSuggestions.map((location, index) => (
                <button
                  key={index}
                  onClick={() => onSelectSuggestion(location)}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/5 transition-colors text-sm flex items-center gap-2 group"
                >
                  <Search className="w-3.5 h-3.5 text-muted-foreground group-hover:text-neon-cyan transition-colors" />
                  <span className="group-hover:text-neon-cyan transition-colors">{location}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Search All Footer */}
        <div className="pt-3 border-t border-glass-border">
          <button onClick={() => onSelectSuggestion(query)} className="w-full px-3 py-2 rounded-lg hover:bg-neon-cyan/10 transition-colors text-sm flex items-center justify-between group">
            <span className="flex items-center gap-2">
              <Search className="w-4 h-4 text-neon-cyan" />
              <span className="text-neon-cyan">Search for &quot;{query}&quot;</span>
            </span>
            <span className="text-xs text-muted-foreground group-hover:text-neon-cyan transition-colors">Press Enter</span>
          </button>
        </div>
      </div>
    </Card>
  );
}
