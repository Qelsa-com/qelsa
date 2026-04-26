import { JobComparisonPage } from "@/components/job/JobComparisonPage";
import JobLayout from "@/components/job/layout";
import { Card } from "@/components/ui/card";
import { useLazyGetDiscoverJobsQuery, useToggleSaveJobMutation } from "@/features/api/jobsApi";
import { Job } from "@/types/job";
import { Bookmark, BookmarkCheck, Briefcase, Clock, Eye, MapPin, Search, Sparkles, Star, Target } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import Layout from "../../layout";
import { SearchFilters } from "./smart_matches";

const All = () => {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [locationFilter, setLocationFilter] = useState("all");
  const [experienceFilter, setExperienceFilter] = useState("all");
  const [workTypeFilter, setWorkTypeFilter] = useState("all");
  const [savedJobs, setSavedJobs] = useState<string[]>([]);
  const [viewedJobs, setViewedJobs] = useState<string[]>([]);
  const [comparedJobs, setComparedJobs] = useState<Job[]>([]);
  const [showComparison, setShowComparison] = useState(false);
  const [toggleSaveJob] = useToggleSaveJobMutation();

  const [jobs, setJobs] = useState([]);
  const [query, setQuery] = useState("");

  const [filters, setFilters] = useState<SearchFilters>({
    cities: [],
    job_types: [],
    experience_levels: [],
    departments: [],
    remote: false,
    sort_by: "relevance",
  });

  const [triggerGetJobs, { data: jobsList, error, isLoading }] = useLazyGetDiscoverJobsQuery();

  useEffect(() => {
    if (jobsList) {
      setJobs(jobsList);
    }
  }, [jobsList]);

  useEffect(() => {
    triggerGetJobs(
      {
        ...filters,
        search: query,
      },
      false
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onSearch = async () => {
    console.log({
      ...filters,
      search: query,
    });

    await triggerGetJobs(
      {
        ...filters,
        search: query,
      },
      false
    ).unwrap();
  };

  const onToggleCompare = (job: Job) => {
    setComparedJobs((prev) => {
      const exists = prev.find((j) => j.id === job.id);
      if (exists) {
        toast.success(`Removed ${job.title} from comparison`);
        return prev.filter((j) => j.id !== job.id);
      } else {
        if (prev.length >= 4) {
          toast.error("You can only compare up to 4 jobs at a time");
          return prev;
        }
        toast.success(`Added ${job.title} to comparison`);
        return [...prev, job];
      }
    });
  };

  const onRemoveFromCompare = (jobId: number) => {
    setComparedJobs((prev) => prev.filter((j) => j.id !== jobId));
  };

  const onCompare = () => {
    console.log(comparedJobs);

    if (comparedJobs.length < 2) {
      toast.error("Please select at least 2 jobs to compare");
      return;
    }
    setShowComparison(true);
  };

  const onClearCompare = () => {
    setComparedJobs([]);
    toast.success("Comparison cleared");
  };

  const filteredJobs = jobs || [];

  const onToggleBookmark = (job: Job) => {
    toggleSaveJob(job.id);
  };

  if (showComparison) {
    return (
      <Layout activeSection={"jobs"}>
        <JobComparisonPage jobs={comparedJobs} onBack={() => setShowComparison(false)} onRemoveJob={onRemoveFromCompare} />
      </Layout>
    );
  }

  return (
    <Layout activeSection={"jobs"}>
      <JobLayout active_job_page="all" {...{ jobs, filters, setFilters, query, setQuery, onSearch, comparedJobs, onToggleCompare, onCompare, onClearCompare, onRemoveFromCompare, showComparison }}>
        <div className="space-y-6">
          {/* Stats Bar */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h2 className="text-xl font-semibold">{filteredJobs.length} Jobs Found</h2>
              {(searchQuery || locationFilter !== "all" || workTypeFilter !== "all" || experienceFilter !== "all") && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearchQuery("");
                    setLocationFilter("all");
                    setWorkTypeFilter("all");
                    setExperienceFilter("all");
                  }}
                  className="border-neon-cyan/30 text-neon-cyan hover:bg-neon-cyan/10"
                >
                  Clear All Filters
                </Button>
              )}
            </div>

            {savedJobs.length > 0 && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <BookmarkCheck className="w-4 h-4 text-neon-cyan" />
                <span>{savedJobs.length} Saved</span>
              </div>
            )}
          </div>

          {/* Recently Viewed Jobs */}
          {viewedJobs.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="flex items-center gap-2">
                  <Eye className="w-5 h-5 text-neon-purple" />
                  <span className="font-semibold">Recently Viewed</span>
                  <Badge variant="secondary" className="ml-1">
                    {viewedJobs.length}
                  </Badge>
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {viewedJobs.slice(0, 4).map((jobId) => {
                  const job = jobs.find((j) => j.id === Number(jobId));
                  if (!job) return null;
                  return (
                    <Card
                      key={job.id}
                      className="bg-transparent p-4 glass border-glass-border cursor-pointer hover:border-neon-cyan/40 hover:shadow-lg hover:shadow-neon-cyan/10 hover:-translate-y-0.5 transition-all rounded-xl group"
                      onClick={() => router.push(`/jobs/${job.id}`)}
                    >
                      <div className="flex items-start gap-3 mb-3">
                        {/* {job.companyLogo && <img src={job.companyLogo} alt={job.page?.name || job.company_name} className="w-10 h-10 rounded-lg object-cover border border-glass-border flex-shrink-0" />} */}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm line-clamp-2 mb-1 group-hover:text-neon-cyan transition-colors">{job.title}</h4>
                          <p className="text-xs text-muted-foreground line-clamp-1">{job.page?.name || job.company_name}</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <Badge variant="secondary" className="text-xs px-2.5 py-1 rounded-full">
                          {job.work_type}
                        </Badge>
                        {/* {job.fitScore && (
                          <div className="flex items-center gap-1">
                            <Target className="w-3 h-3 text-neon-cyan" />
                            <span className="text-xs font-semibold text-neon-cyan">{job.fitScore}%</span>
                          </div>
                        )} */}
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {/* All Jobs Grid */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-neon-cyan" />
                <span className="font-semibold">{searchQuery ? `Results for "${searchQuery}"` : "All Opportunities"}</span>
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
              {filteredJobs.map((job) => (
                <Card
                  key={job.id}
                  className="glass hover:glass-strong border-glass-border hover:border-neon-cyan/30 transition-all cursor-pointer flex-shrink-0 group"
                  // onClick={() => handleJobClick(job)}
                >
                  <div className="p-5 space-y-4">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        {job.companyLogo && <Image src={job.companyLogo} alt={job.company} width={48} height={48} className="rounded-lg object-cover flex-shrink-0" />}
                        <div className="flex-1 min-w-0">
                          <h4 className="text-white line-clamp-1 group-hover:text-neon-cyan transition-colors">{job.title}</h4>
                          <p className="text-sm text-muted-foreground line-clamp-1">{job.company}</p>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-1">
                        {onToggleCompare && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              onToggleCompare(job);
                            }}
                            disabled={!comparedJobs.some((j) => j.id === job.id) && comparedJobs.length >= 4}
                            className={`h-8 w-8 p-0 flex-shrink-0 ${comparedJobs.some((j) => j.id === job.id) ? "bg-neon-cyan/20 text-neon-cyan hover:bg-neon-cyan/30" : "hover:bg-white/5"}`}
                            title={comparedJobs.length >= 4 && !comparedJobs.some((j) => j.id === job.id) ? "Max 4 jobs can be compared" : "Add to compare"}
                          >
                            {comparedJobs.some((j) => j.id === job.id) ? <Star className="w-4 h-4 fill-current" /> : <Star className="w-4 h-4" />}
                          </Button>
                        )}

                        {onToggleBookmark && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              onToggleBookmark(job);
                            }}
                            className={`h-8 w-8 p-0 flex-shrink-0 ${job.is_bookmarked ? "bg-neon-cyan/20 text-neon-cyan hover:bg-neon-cyan/30" : "hover:bg-white/5"}`}
                          >
                            {job.is_bookmarked ? <BookmarkCheck className="w-4 h-4 fill-current" /> : <Bookmark className="w-4 h-4" />}
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Job Details */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="w-4 h-4 flex-shrink-0" />
                        <span className="line-clamp-1">{job.location}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap">
                        <Briefcase className="w-4 h-4 flex-shrink-0" />
                        <span>{job.workType}</span>
                        {job.workplaceType && (
                          <>
                            <span className="text-muted-foreground/50">•</span>
                            <span>{job.workplaceType}</span>
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
                          {skill}
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
                        <Badge variant="outline" className="text-xs">
                          {job.resource}
                        </Badge>
                      </div>

                      {job.fitScore && (
                        <div className="flex items-center gap-1.5 text-xs">
                          <Target className="w-3.5 h-3.5 text-neon-green" />
                          <span className="text-neon-green">{job.fitScore}% fit</span>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {filteredJobs.length === 0 && (
              <div className="text-center py-12">
                <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-glass flex items-center justify-center">
                  <Search className="w-12 h-12 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-semibold mb-2">No jobs found</h3>
                <p className="text-muted-foreground mb-4">Try adjusting your search criteria or filters to find more opportunities.</p>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchQuery("");
                    setLocationFilter("all");
                    setWorkTypeFilter("all");
                    setExperienceFilter("all");
                  }}
                  className="border-neon-cyan/30 text-neon-cyan hover:bg-neon-cyan/10"
                >
                  Clear Filters
                </Button>
              </div>
            )}
          </div>
        </div>
      </JobLayout>
    </Layout>
  );
};

export default All;
