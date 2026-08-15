import { Bookmark, BookmarkCheck, Brain, Briefcase, CheckCircle, Clock, DollarSign, Eye, Filter, MapPin, Search, Send, Star, Target } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { Input } from "../ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { JobDetailsModal } from "./JobDetailsModal";
import { JobFilters } from "./JobFilterSidebar";
import { JobFitModal } from "./JobFitModal";

interface JobsPageProps {
  searchQuery: string;
  filters: JobFilters;
  aiJobResults?: ResponseData[];
  onSearchChange?: (query: string) => void;
  onFilterClick?: () => void;
}

interface ResponseData {
  id: string;
  title: string;
  description: string;
  relevance: string;
  actionLabel: string;
  actionType: "view" | "learn" | "apply";
  category: "student" | "professional" | "job" | "skill";
  source?: {
    platform: "Qelsa" | "LinkedIn" | "Indeed" | "Naukri" | "AngelList" | "Glassdoor";
    verified?: boolean;
    exclusive?: boolean;
  };
  jobDetails?: {
    company: string;
    location: string;
    salary?: string;
    workType?: string;
    experience: string;
    responsibilities: string[];
    requirements: string[];
    preferred: string[];
    benefits: string[];
    logo?: string;
    aiMatchScore?: number;
    growthIndicators?: string[];
    cultureFit?: string;
  };
}

// Enhanced mock job data with 8 jobs to show 4 per row
const mockJobData: ResponseData[] = [
  {
    id: "1",
    title: "Senior AI Product Manager",
    description: "Lead AI product strategy for next-generation machine learning platforms, driving innovation in conversational AI and computer vision.",
    relevance: "Perfect match: Your analytics background + AI interest makes you ideal for this role",
    actionLabel: "Apply Now",
    actionType: "apply",
    category: "job",
    source: {
      platform: "Qelsa",
      verified: true,
      exclusive: true,
    },
    jobDetails: {
      company: "AI Dynamics",
      location: "Bangalore, Karnataka",
      salary: "₹25-35 LPA",
      workType: "Hybrid (3 days office)",
      experience: "4-6 years",
      logo: "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=150&h=150&fit=crop",
      aiMatchScore: 94,
      growthIndicators: ["Series B funding: $50M", "200% team growth", "Expanding to US market"],
      cultureFit: "Innovation-focused, data-driven decision making, collaborative team",
      responsibilities: [],
      requirements: [],
      preferred: [],
      benefits: [],
    },
  },
  {
    id: "2",
    title: "Fintech Product Manager - Digital Banking",
    description: "Shape the future of digital banking by building innovative financial products for India's growing fintech ecosystem.",
    relevance: "Great fit: Your analytical skills align with fintech requirements",
    actionLabel: "View Details",
    actionType: "view",
    category: "job",
    source: {
      platform: "LinkedIn",
      verified: true,
    },
    jobDetails: {
      company: "NeoBank Solutions",
      location: "Mumbai, Maharashtra",
      salary: "₹20-28 LPA",
      workType: "Remote-first with monthly office visits",
      experience: "3-5 years",
      logo: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=150&h=150&fit=crop",
      aiMatchScore: 87,
      growthIndicators: ["RBI banking license approved", "Processing $2B+ transactions", "Unicorn valuation"],
      cultureFit: "Fast-paced, customer-obsessed, regulatory compliance focus",
      responsibilities: [],
      requirements: [],
      preferred: [],
      benefits: [],
    },
  },
  {
    id: "3",
    title: "E-commerce Product Manager - Marketplace",
    description: "Drive growth for India's fastest-growing marketplace platform, focusing on seller tools and buyer experience optimization.",
    relevance: "Strong match: Your user research experience is valuable for marketplace products",
    actionLabel: "Apply Now",
    actionType: "apply",
    category: "job",
    source: {
      platform: "Indeed",
      verified: false,
    },
    jobDetails: {
      company: "QuickCommerce",
      location: "Bangalore, Karnataka",
      experience: "2-4 years",
      logo: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=150&h=150&fit=crop",
      aiMatchScore: 82,
      growthIndicators: ["GMV growth: 300% YoY", "Expanding to 50+ cities", "10M+ active users"],
      cultureFit: "Growth-minded, data-driven, customer-first approach",
      responsibilities: [],
      requirements: [],
      preferred: [],
      benefits: [],
    },
  },
  {
    id: "4",
    title: "DevOps Engineer - Cloud Infrastructure",
    description: "Build and maintain scalable cloud infrastructure supporting millions of users across global markets.",
    relevance: "Great match: Your technical skills and automation experience align perfectly",
    actionLabel: "Apply Now",
    actionType: "apply",
    category: "job",
    source: {
      platform: "Qelsa",
      verified: true,
      exclusive: false,
    },
    jobDetails: {
      company: "TechScale Solutions",
      location: "Pune, Maharashtra",
      salary: "₹18-30 LPA",
      workType: "Remote-first",
      experience: "3-5 years",
      logo: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=150&h=150&fit=crop",
      aiMatchScore: 88,
      growthIndicators: ["AWS Premier Partner", "300% infrastructure growth", "IPO-bound company"],
      cultureFit: "Engineering excellence, automation-first, continuous learning culture",
      responsibilities: [],
      requirements: [],
      preferred: [],
      benefits: [],
    },
  },
  {
    id: "5",
    title: "UX Designer - Mobile Apps",
    description: "Design intuitive mobile experiences for consumer apps used by millions of users worldwide.",
    relevance: "Perfect fit: Your design thinking and user-centric approach are exactly what we need",
    actionLabel: "View Details",
    actionType: "view",
    category: "job",
    source: {
      platform: "LinkedIn",
      verified: true,
    },
    jobDetails: {
      company: "Design Studio Pro",
      location: "Delhi, India",
      salary: "₹12-22 LPA",
      workType: "Hybrid (2 days office)",
      experience: "2-4 years",
      logo: "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=150&h=150&fit=crop",
      aiMatchScore: 85,
      growthIndicators: ["Design team expansion", "New product launches", "Series A funding"],
      cultureFit: "Creative freedom, user research focus, collaborative design process",
      responsibilities: [],
      requirements: [],
      preferred: [],
      benefits: [],
    },
  },
  {
    id: "6",
    title: "Full Stack Developer - React & Node.js",
    description: "Develop end-to-end web applications using modern technologies and best practices.",
    relevance: "Strong match: Your full-stack skills and React experience are in high demand",
    actionLabel: "Apply Now",
    actionType: "apply",
    category: "job",
    source: {
      platform: "Indeed",
      verified: false,
    },
    jobDetails: {
      company: "StartupNext",
      location: "Bangalore, Karnataka",
      salary: "₹15-25 LPA",
      workType: "Office-based",
      experience: "2-5 years",
      logo: "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=150&h=150&fit=crop",
      aiMatchScore: 91,
      growthIndicators: ["Rapid team growth", "Multiple product lines", "International expansion"],
      cultureFit: "Fast-paced startup, ownership mindset, modern tech stack",
      responsibilities: [],
      requirements: [],
      preferred: [],
      benefits: [],
    },
  },
  {
    id: "7",
    title: "Data Scientist - Machine Learning",
    description: "Build predictive models and analytics solutions to drive business insights and automation.",
    relevance: "Excellent fit: Your analytical background and ML interest make this role perfect",
    actionLabel: "Apply Now",
    actionType: "apply",
    category: "job",
    source: {
      platform: "Qelsa",
      verified: true,
      exclusive: true,
    },
    jobDetails: {
      company: "DataTech Analytics",
      location: "Hyderabad, Telangana",
      salary: "₹20-32 LPA",
      workType: "Hybrid (3 days office)",
      experience: "3-6 years",
      logo: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=150&h=150&fit=crop",
      aiMatchScore: 93,
      growthIndicators: ["AI research lab", "Fortune 500 clients", "Patent portfolio"],
      cultureFit: "Research-driven, data-first culture, continuous innovation",
      responsibilities: [],
      requirements: [],
      preferred: [],
      benefits: [],
    },
  },
  {
    id: "8",
    title: "Digital Marketing Manager",
    description: "Lead digital marketing campaigns and growth strategies for B2B SaaS products.",
    relevance: "Good match: Your marketing experience and analytical skills complement this role",
    actionLabel: "View Details",
    actionType: "view",
    category: "job",
    source: {
      platform: "AngelList",
      verified: true,
    },
    jobDetails: {
      company: "GrowthTech Marketing",
      location: "Mumbai, Maharashtra",
      salary: "₹14-24 LPA",
      workType: "Remote-friendly",
      experience: "2-4 years",
      logo: "https://images.unsplash.com/photo-1553484771-371a605b060b?w=150&h=150&fit=crop",
      aiMatchScore: 78,
      growthIndicators: ["Marketing automation platform", "Client retention 95%", "Revenue growth 200%"],
      cultureFit: "Growth-hacking mindset, data-driven decisions, performance culture",
      responsibilities: [],
      requirements: [],
      preferred: [],
      benefits: [],
    },
  },
];

export function JobsPageFixed({ searchQuery, filters, aiJobResults, onSearchChange, onFilterClick }: JobsPageProps) {
  const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery);
  const [activeTab, setActiveTab] = useState("all-jobs");
  const [savedJobs, setSavedJobs] = useState<string[]>([]);
  const [appliedJobs, setAppliedJobs] = useState<string[]>([]);
  const [jobFitModal, setJobFitModal] = useState<{ isOpen: boolean; jobId: string; jobTitle: string }>({
    isOpen: false,
    jobId: "",
    jobTitle: "",
  });
  const [jobDetailsModal, setJobDetailsModal] = useState<{ isOpen: boolean; jobId: string }>({
    isOpen: false,
    jobId: "",
  });

  // Load saved and applied jobs from localStorage on component mount
  useEffect(() => {
    const storedSavedJobs = localStorage.getItem("qelsa-saved-jobs");
    const storedAppliedJobs = localStorage.getItem("qelsa-applied-jobs");

    if (storedSavedJobs) {
      setSavedJobs(JSON.parse(storedSavedJobs));
    }

    if (storedAppliedJobs) {
      setAppliedJobs(JSON.parse(storedAppliedJobs));
    }
  }, []);

  // Save to localStorage whenever savedJobs or appliedJobs change
  useEffect(() => {
    localStorage.setItem("qelsa-saved-jobs", JSON.stringify(savedJobs));
  }, [savedJobs]);

  useEffect(() => {
    localStorage.setItem("qelsa-applied-jobs", JSON.stringify(appliedJobs));
  }, [appliedJobs]);

  useEffect(() => {
    setLocalSearchQuery(searchQuery);
  }, [searchQuery]);

  const jobData = aiJobResults && aiJobResults.length > 0 ? aiJobResults : mockJobData;

  const handleCheckFit = (jobId: string, jobTitle: string) => {
    setJobFitModal({
      isOpen: true,
      jobId,
      jobTitle,
    });
  };

  const handleViewJobDetails = (jobId: string) => {
    setJobDetailsModal({
      isOpen: true,
      jobId,
    });
  };

  const handleSaveJob = (jobId: string) => {
    if (savedJobs.includes(jobId)) {
      setSavedJobs(savedJobs.filter((id) => id !== jobId));
      toast("Job removed from saved jobs", {
        description: "You can find it again in the All Jobs tab.",
      });
    } else {
      setSavedJobs([...savedJobs, jobId]);
      toast("Job saved successfully!", {
        description: "You can find it in the Saved Jobs tab.",
      });
    }
  };

  const handleApplyToJob = (jobId: string, jobTitle: string) => {
    if (!appliedJobs.includes(jobId)) {
      setAppliedJobs([...appliedJobs, jobId]);
      // Remove from saved jobs if it was saved
      if (savedJobs.includes(jobId)) {
        setSavedJobs(savedJobs.filter((id) => id !== jobId));
      }
      toast("Application submitted!", {
        description: `Your application for ${jobTitle} has been submitted successfully.`,
      });
    }
  };

  const getCurrentJob = () => {
    return jobData.find((job) => job.id === jobDetailsModal.jobId);
  };

  const getFilteredJobs = () => {
    let jobs = jobData;

    // Filter by tab
    switch (activeTab) {
      case "saved-jobs":
        jobs = jobs.filter((job) => savedJobs.includes(job.id));
        break;
      case "applied-jobs":
        jobs = jobs.filter((job) => appliedJobs.includes(job.id));
        break;
      default:
        // All jobs - no additional filtering needed
        break;
    }

    // Apply search filters
    return jobs.filter((job) => {
      const matchesSearch =
        job.title.toLowerCase().includes(localSearchQuery.toLowerCase()) ||
        job.description.toLowerCase().includes(localSearchQuery.toLowerCase()) ||
        job.jobDetails?.company.toLowerCase().includes(localSearchQuery.toLowerCase());

      return matchesSearch;
    });
  };

  const filteredJobs = getFilteredJobs();

  const renderJobCard = (job: ResponseData) => {
    const matchScore = job.jobDetails?.aiMatchScore || 85;
    const isQelsaExclusive = job.source?.platform === "Qelsa" && job.source?.exclusive;
    const isSaved = savedJobs.includes(job.id);
    const isApplied = appliedJobs.includes(job.id);

    return (
      <Card
        key={job.id}
        className="glass border-glass-border rounded-2xl p-5 transition-all duration-300 hover:glow-cyan hover:scale-[1.02] group cursor-pointer relative overflow-hidden h-full flex flex-col"
      >
        {/* Exclusive Badge */}
        {isQelsaExclusive && (
          <div className="absolute -top-2 -right-2 w-12 h-12">
            <div className="absolute inset-0 bg-gradient-to-br from-neon-yellow to-neon-yellow rounded-full animate-pulse"></div>
            <div className="absolute inset-1 bg-background rounded-full flex items-center justify-center">
              <Star className="h-3 w-3 text-neon-yellow" />
            </div>
          </div>
        )}

        {/* Applied Badge */}
        {isApplied && (
          <div className="absolute top-3 left-3 z-10">
            <Badge className="bg-neon-green/20 text-neon-green border-neon-green/30 text-xs">Applied</Badge>
          </div>
        )}

        {/* Header */}
        <div className="flex items-start gap-3 mb-3">
          <Avatar className="h-10 w-10 ring-2 ring-glass-border group-hover:ring-neon-cyan/50 transition-all flex-shrink-0">
            <AvatarImage src={job.jobDetails?.logo} alt={job.jobDetails?.company} />
            <AvatarFallback className="bg-gradient-to-br from-neon-cyan to-neon-purple text-black font-bold text-sm">{job.jobDetails?.company?.[0] || "C"}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-white text-base line-clamp-2 group-hover:text-neon-cyan transition-colors mb-1">{job.title}</h3>
            <p className="text-neon-cyan font-medium text-sm">{job.jobDetails?.company}</p>
          </div>
        </div>

        {/* Source & Match Score */}
        <div className="flex items-center justify-between mb-3">
          <Badge variant="secondary" className={`text-xs ${job.source?.platform === "Qelsa" ? "bg-neon-cyan/10 text-neon-cyan border-neon-cyan/30" : "glass border-glass-border"}`}>
            {job.source?.platform || "External"}
          </Badge>
          <div className="flex items-center gap-1">
            <Target className="h-3 w-3 text-neon-green" />
            <span className="text-neon-green font-bold text-sm">{matchScore}% match</span>
          </div>
        </div>

        {/* Job Details */}
        <div className="space-y-2 mb-3 flex-1">
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              <span className="truncate">{job.jobDetails?.location}</span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">{job.jobDetails?.experience}</span>
          </div>
          {job.jobDetails?.salary && (
            <div className="flex items-center gap-1">
              <DollarSign className="h-3 w-3 text-neon-green" />
              <span className="text-xs font-medium text-neon-green">{job.jobDetails.salary}</span>
            </div>
          )}
        </div>

        {/* AI Relevance - Compact */}
        <div className="mb-3 p-2 glass rounded-lg border border-neon-purple/30">
          <div className="flex items-start gap-2">
            <Brain className="h-3 w-3 text-neon-purple mt-0.5 flex-shrink-0" />
            <p className="text-xs text-muted-foreground line-clamp-2">{job.relevance}</p>
          </div>
        </div>

        {/* Action Buttons - Compact */}
        <div className="flex gap-1 mt-auto">
          {!isApplied ? (
            <Button
              size="sm"
              className="flex-1 gradient-animated text-black hover:scale-105 transition-all text-xs h-8"
              onClick={(e) => {
                e.stopPropagation();
                handleApplyToJob(job.id, job.title);
              }}
            >
              <Send className="h-3 w-3 mr-1" />
              Apply
            </Button>
          ) : (
            <Button size="sm" variant="outline" className="flex-1 glass border-neon-green text-neon-green cursor-default text-xs h-8" disabled>
              <CheckCircle className="h-3 w-3 mr-1" />
              Applied
            </Button>
          )}
          <Button
            size="sm"
            variant="outline"
            className="px-2 glass border-glass-border hover:border-neon-cyan hover:text-neon-cyan transition-all h-8"
            onClick={(e) => {
              e.stopPropagation();
              handleViewJobDetails(job.id);
            }}
          >
            <Eye className="h-3 w-3" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            className={`px-2 glass border-glass-border transition-all h-8 ${isSaved ? "border-neon-pink text-neon-pink bg-neon-pink/10" : "hover:border-neon-pink hover:text-neon-pink"}`}
            onClick={(e) => {
              e.stopPropagation();
              handleSaveJob(job.id);
            }}
          >
            {isSaved ? <BookmarkCheck className="h-3 w-3" /> : <Bookmark className="h-3 w-3" />}
          </Button>
        </div>
      </Card>
    );
  };

  return (
    <div className="min-h-screen relative">
      {/* Enhanced Background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-background via-background/95 to-background"></div>
        <div className="absolute top-1/4 left-1/6 w-96 h-96 bg-neon-cyan/4 rounded-full blur-3xl opacity-80 animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/6 w-80 h-80 bg-neon-purple/4 rounded-full blur-3xl opacity-70"></div>
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-neon-pink/3 rounded-full blur-3xl opacity-60"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-8">
        {/* Header Section */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-neon-cyan via-neon-purple to-neon-pink bg-clip-text text-transparent">Qelsa Jobs – Future of Work</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">AI-powered job discovery tailored to your career journey</p>
        </div>

        {/* Job Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
            <TabsList className="glass border-glass-border bg-transparent p-1">
              <TabsTrigger value="all-jobs" className="data-[state=active]:bg-neon-cyan/20 data-[state=active]:text-neon-cyan">
                All Jobs
                <Badge variant="secondary" className="ml-2 text-xs">
                  {jobData.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="saved-jobs" className="data-[state=active]:bg-neon-pink/20 data-[state=active]:text-neon-pink">
                Saved Jobs
                <Badge variant="secondary" className="ml-2 text-xs">
                  {savedJobs.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="applied-jobs" className="data-[state=active]:bg-neon-green/20 data-[state=active]:text-neon-green">
                Applied Jobs
                <Badge variant="secondary" className="ml-2 text-xs">
                  {appliedJobs.length}
                </Badge>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Tab Content */}
          <TabsContent value={activeTab} className="space-y-6">
            {/* Search Bar */}
            <div className="flex flex-col md:flex-row items-center gap-4">
              <div className="flex-1 w-full relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search jobs by title, company, or location..."
                  value={localSearchQuery}
                  onChange={(e) => setLocalSearchQuery(e.target.value)}
                  className="pl-12 h-12 glass border-glass-border bg-input-background text-foreground placeholder:text-muted-foreground"
                />
              </div>
              <Button
                onClick={onFilterClick}
                variant="outline"
                className="flex items-center gap-2 h-12 px-6 glass border-glass-border text-foreground hover:bg-neon-cyan/10 hover:text-neon-cyan hover:border-neon-cyan transition-all duration-300"
              >
                <Filter className="h-5 w-5" />
                <span>Filters</span>
              </Button>
            </div>

            {/* Job Results Summary */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-neon-cyan" />
                <span className="text-white font-medium">
                  {filteredJobs.length} {filteredJobs.length === 1 ? "job" : "jobs"} found
                </span>
              </div>
            </div>

            {/* Jobs Grid - 4 Cards Per Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">{filteredJobs.map((job) => renderJobCard(job))}</div>

            {/* No Results State */}
            {filteredJobs.length === 0 && (
              <div className="text-center py-12">
                <div className="w-20 h-20 rounded-full glass flex items-center justify-center mx-auto mb-4">
                  <Search className="h-10 w-10 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">No jobs found</h3>
                <p className="text-muted-foreground">Try adjusting your search filters or check back later for new opportunities.</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Modals */}
      <JobFitModal isOpen={jobFitModal.isOpen} onClose={() => setJobFitModal({ isOpen: false, jobId: "", jobTitle: "" })} jobId={jobFitModal.jobId} jobTitle={jobFitModal.jobTitle} />

      {jobDetailsModal.isOpen &&
        (() => {
          const currentJob = getCurrentJob();
          return currentJob && currentJob.jobDetails ? (
            <JobDetailsModal
              isOpen={jobDetailsModal.isOpen}
              onClose={() => setJobDetailsModal({ isOpen: false, jobId: "" })}
              jobTitle={currentJob.title}
              jobDescription={currentJob.description}
              jobDetails={currentJob.jobDetails}
              onApply={() => {
                handleApplyToJob(currentJob.id, currentJob.title);
                setJobDetailsModal({ isOpen: false, jobId: "" });
              }}
              onCheckFit={() => {
                setJobDetailsModal({ isOpen: false, jobId: "" });
                handleCheckFit(currentJob.id, currentJob.title);
              }}
            />
          ) : null;
        })()}
    </div>
  );
}
