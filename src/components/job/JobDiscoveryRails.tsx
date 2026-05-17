import { Job } from "@/types/job";
import { Award, Bookmark, BookmarkCheck, Briefcase, ChevronLeft, ChevronRight, Clock, EyeOff, MapPin, MoreVertical, Pin, Sparkles, Star } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../ui/dropdown-menu";

interface Rail {
  id: string;
  title: string;
  description: string;
  icon: any;
  color: "cyan" | "purple" | "pink" | "green" | "yellow";
  isPinned: boolean;
  isHidden: boolean;
  category: "personalized" | "momentum" | "strategic" | "context" | "social" | "hygiene";
}

interface JobDiscoveryRailsProps {
  onToggleCompare?: (job: Job) => void;
  comparedJobs?: Job[];
  onToggleBookmark?: (job: Job) => void;
  bookmarkedJobs?: Job[];
  jobs: Job[];
}

export function JobDiscoveryRails({ onToggleCompare, comparedJobs = [], onToggleBookmark, bookmarkedJobs = [], jobs }: JobDiscoveryRailsProps) {
  const [rails, setRails] = useState<Rail[]>(generateMockRails());
  const [scrollPositions, setScrollPositions] = useState<{ [key: string]: number }>({});

  const togglePin = (railId: string) => {
    setRails((prev) =>
      prev
        .map((rail) => (rail.id === railId ? { ...rail, isPinned: !rail.isPinned } : rail))
        .sort((a, b) => {
          if (a.isPinned && !b.isPinned) return -1;
          if (!a.isPinned && b.isPinned) return 1;
          return 0;
        })
    );
  };

  const toggleHide = (railId: string) => {
    setRails((prev) => prev.map((rail) => (rail.id === railId ? { ...rail, isHidden: !rail.isHidden } : rail)));
  };

  const scroll = (railId: string, direction: "left" | "right") => {
    const container = document.getElementById(`rail-${railId}`);
    if (!container) return;

    const scrollAmount = 400;
    const newPosition = direction === "left" ? container.scrollLeft - scrollAmount : container.scrollLeft + scrollAmount;

    container.scrollTo({ left: newPosition, behavior: "smooth" });
  };

  function generateMockRails(): Rail[] {
    return [
      {
        id: "recommended",
        title: "Recommended for You",
        description: "Based on your profile, skills, and recent activity",
        icon: Sparkles,
        color: "cyan",
        category: "personalized",
        isPinned: true,
        isHidden: false,
      },
      {
        id: "based-skills",
        title: "Based on Your Skills",
        description: "Roles matching your verified skills and adjacent upskilling paths",
        icon: Award,
        color: "purple",
        category: "personalized",
        isPinned: false,
        isHidden: false,
      },
    ];
  }

  const visibleRails = rails.filter((rail) => !rail.isHidden);

  return (
    <div className="space-y-8">
      {visibleRails.map((rail) => (
        <RailSection
          key={rail.id}
          rail={rail}
          onToggleCompare={onToggleCompare}
          comparedJobs={comparedJobs}
          onScroll={scroll}
          onTogglePin={togglePin}
          onToggleHide={toggleHide}
          onToggleBookmark={onToggleBookmark}
          bookmarkedJobs={bookmarkedJobs}
          jobs={jobs}
        />
      ))}

      {/* Manage Rails Button */}
      <div className="flex justify-center pt-4">
        <Button variant="outline" className="glass border-glass-border hover:border-neon-cyan/50 transition-all">
          <MoreVertical className="w-4 h-4 mr-2" />
          Manage Rails
        </Button>
      </div>
    </div>
  );
}

interface RailSectionProps {
  rail: Rail;
  onToggleCompare?: (job: Job) => void;
  comparedJobs: Job[];
  onScroll: (railId: string, direction: "left" | "right") => void;
  onTogglePin: (railId: string) => void;
  onToggleHide: (railId: string) => void;
  onToggleBookmark?: (job: Job) => void;
  bookmarkedJobs: Job[];
  jobs: Job[];
}

function RailSection({ rail, onToggleCompare, comparedJobs, onScroll, onTogglePin, onToggleHide, onToggleBookmark, bookmarkedJobs, jobs }: RailSectionProps) {
  const router = useRouter();
  const Icon = rail.icon;
  const colorClasses = {
    cyan: "text-neon-cyan",
    purple: "text-neon-purple",
    pink: "text-neon-pink",
    green: "text-neon-green",
    yellow: "text-neon-yellow",
  };

  return (
    <div className="space-y-4">
      {/* Rail Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className={`p-2 rounded-lg glass ${colorClasses[rail.color]}`}>
            <Icon className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="text-white">{rail.title}</h3>
              {rail.isPinned && <Pin className="w-3.5 h-3.5 text-neon-cyan fill-neon-cyan" />}
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">{rail.description}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Navigation Buttons */}
          <Button variant="ghost" size="sm" onClick={() => onScroll(rail.id, "left")} className="h-8 w-8 p-0 hover:bg-white/5">
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => onScroll(rail.id, "right")} className="h-8 w-8 p-0 hover:bg-white/5">
            <ChevronRight className="w-4 h-4" />
          </Button>

          {/* Rail Options */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-white/5">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="glass-strong border-glass-border">
              <DropdownMenuItem onClick={() => onTogglePin(rail.id)}>
                <Pin className="w-4 h-4 mr-2" />
                {rail.isPinned ? "Unpin Rail" : "Pin Rail"}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onToggleHide(rail.id)}>
                <EyeOff className="w-4 h-4 mr-2" />
                Hide Rail
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Job Cards Carousel */}
      <div className="relative">
        <div id={`rail-${rail.id}`} className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory" style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
          {jobs?.map((job) => (
            <JobRailCard
              key={job.id}
              job={job}
              onToggleCompare={onToggleCompare}
              isCompared={comparedJobs.some((j) => j.id === job.id)}
              onToggleBookmark={onToggleBookmark}
              is_bookmarked={job.is_bookmarked}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

interface JobRailCardProps {
  job: Job;
  onToggleCompare?: (job: Job) => void;
  isCompared: boolean;
  onToggleBookmark?: (job: Job) => void;
  is_bookmarked: boolean;
}

function JobRailCard({ job, onToggleCompare, isCompared, onToggleBookmark, is_bookmarked }: JobRailCardProps) {
  const router = useRouter();
  const getSourceColor = (platform: string) => {
    switch (platform) {
      case "Qelsa":
        return "neon-cyan";
      case "LinkedIn":
        return "blue-500";
      case "Indeed":
        return "blue-600";
      case "Naukri":
        return "purple-500";
      case "AngelList":
        return "gray-400";
      case "Glassdoor":
        return "green-500";
      default:
        return "gray-400";
    }
  };

  return (
    <Card
      className="glass hover:glass-strong border-glass-border hover:border-neon-cyan/30 transition-all cursor-pointer flex-shrink-0 w-[340px] snap-start group"
      onClick={() => router.push(`/jobs/${job.id}`)}
    >
      <div className="p-5 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {job.company_logo && <img src={job.company_logo} alt={job.company_name || job.page?.name} className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />}
            <div className="flex-1 min-w-0">
              <h4 className="text-white line-clamp-1 group-hover:text-neon-cyan transition-colors">{job.job_title?.name ?? job.title}</h4>
              <p className="text-sm text-muted-foreground line-clamp-1">{job.company_name || job.page?.name}</p>
            </div>
          </div>

          {/* Compare Checkbox */}
          {onToggleCompare && (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onToggleCompare(job);
              }}
              className={`h-8 w-8 p-0 flex-shrink-0 ${isCompared ? "bg-neon-cyan/20 text-neon-cyan hover:bg-neon-cyan/30" : "hover:bg-white/5"}`}
            >
              {isCompared ? <Star className="w-4 h-4 fill-current" /> : <Star className="w-4 h-4" />}
            </Button>
          )}

          {/* Bookmark Checkbox */}
          {onToggleBookmark && (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onToggleBookmark(job);
              }}
              className={`h-8 w-8 p-0 flex-shrink-0 ${is_bookmarked ? "bg-neon-cyan/20 text-neon-cyan hover:bg-neon-cyan/30" : "hover:bg-white/5"}`}
            >
              {is_bookmarked ? <BookmarkCheck className="w-4 h-4 fill-current" /> : <Bookmark className="w-4 h-4" />}
            </Button>
          )}
        </div>

        {/* Job Details */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="w-4 h-4 flex-shrink-0" />
            <span className="line-clamp-1">{job.location}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap">
            <Briefcase className="w-4 h-4 flex-shrink-0" />
            <span>{job.work_type}</span>
            {job.workplace_type && (
              <>
                <span className="text-muted-foreground/50">•</span>
                <span>{job.workplace_type}</span>
              </>
            )}
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="w-4 h-4 flex-shrink-0" />
            <span>{job.experience}</span>
          </div>
          {job.salary && <div className="text-sm text-neon-green font-medium">{job.salary}</div>}
        </div>

        {/* Skills */}
        <div className="flex flex-wrap gap-1.5">
          {job.job_skills.slice(0, 3).map((skill, index) => (
            <Badge key={index} variant="secondary" className="text-xs bg-white/5 hover:bg-white/10 border-white/10">
              {skill.skill?.name ?? skill.title}
            </Badge>
          ))}
          {job.job_skills.length > 3 && (
            <Badge variant="secondary" className="text-xs bg-white/5 border-white/10">
              +{job.job_skills.length - 3}
            </Badge>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-white/5">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={`text-xs border-${getSourceColor(job.resource)}`}>
              {job.resource}
            </Badge>
          </div>

          {/* {job.fitScore && (
            <div className="flex items-center gap-1.5 text-xs">
              <Target className="w-3.5 h-3.5 text-neon-green" />
              <span className="text-neon-green">{job.fitScore}% fit</span>
            </div>
          )} */}
        </div>
      </div>
    </Card>
  );
}
