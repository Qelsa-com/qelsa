import { useAuth } from "@/contexts/AuthContext";
import { useLazyGetJobsQuery } from "@/features/api/jobsApi";
import { Briefcase, Filter, Plus, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { CompareJobsTray } from "../CompareJobsTray";
import { NLPJobSearch } from "../NLPJobSearch";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { JobAIAssistantDrawer } from "./JobAIAssistantDrawer";

const Layout = ({ active_job_page, children, jobs, filters, setFilters, query, setQuery, onSearch, comparedJobs, onToggleCompare, onCompare, onClearCompare, onRemoveFromCompare, showComparison }) => {
  const router = useRouter();
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  const [aiAssistantJob, setAiAssistantJob] = useState(null);
  const { user, isAuthenticated } = useAuth();

  const [triggerGetJobs, { data: jobsList, error, isLoading }] = useLazyGetJobsQuery();

  if (isLoading) return <p>Loading jobs...</p>;
  if (error) return <p>Error loading jobs.</p>;
  if (!jobs) return <>No jobs</>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-background">
      {/* Header */}
      <div className="glass-strong border-b border-glass-border">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-neon-cyan via-neon-purple to-neon-pink bg-clip-text text-transparent">Job Opportunities</h1>
              <p className="text-muted-foreground mt-1">Discover your next career move</p>
            </div>

            <div className="flex items-center gap-3">
              {/* <Button
                onClick={() => setShowAIAssistant(true)}
                className="glass-strong border-neon-cyan/40 hover:border-neon-cyan hover:bg-neon-cyan/10 hover:shadow-lg hover:shadow-neon-cyan/30 transition-all duration-300 hover:scale-105"
              >
                <Sparkles className="w-4 h-4 mr-2 text-neon-cyan" />
                <span className="bg-gradient-to-r from-neon-cyan to-neon-purple bg-clip-text text-transparent">AI Assistant</span>
              </Button> */}

              {user && isAuthenticated && (
                <Button
                  onClick={() => router.push("/jobs/posted")}
                  variant="outline"
                  className="glass border-muted/30 hover:border-muted/50 hover:bg-white/5 hover:shadow-md transition-all duration-200 rounded-xl px-4 py-2"
                >
                  <span className="font-medium text-foreground">Posted Jobs</span>
                </Button>
              )}

              {user && isAuthenticated && (
                <Button
                  className="gradient-animated text-white font-bold shadow-lg hover:shadow-xl hover:shadow-neon-purple/30 transition-all duration-300 hover:scale-105 border-0"
                  onClick={() => router.push("/jobs/create-job")}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Post Job
                </Button>
              )}

            </div>
          </div>

          {/* Search and Filters */}
          <div className="space-y-4">
            {/* NLP Search Component */}
            <NLPJobSearch filters={filters} setFilters={setFilters} query={query} setQuery={setQuery} onSearch={onSearch} />
          </div>

          {/* View Mode Tabs */}
          <div className="mt-6">
            <div className="glass-strong border-glass-border w-fit p-0.5 rounded-2xl flex space-x-1">
              {user && isAuthenticated && (
                <Button onClick={() => router.push("/jobs/smart_matches")} variant="outline" className={active_job_page === "smart_matches" ? "bg-neon-cyan/20 text-neon-cyan" : ""}>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Smart Matches
                </Button>
              )}
              <Button onClick={() => router.push("/jobs/all")} variant="outline" className={active_job_page === "all" ? "bg-neon-cyan/20 text-neon-cyan" : ""}>
                <Filter className="w-4 h-4 mr-2" />
                All Jobs
              </Button>
              {user && isAuthenticated && (
                <Button onClick={() => router.push("/jobs/my-jobs/saved")} variant="outline" className={active_job_page === "my-jobs" ? "bg-neon-purple/20 text-neon-purple relative" : ""}>
                  <Briefcase className="w-4 h-4 mr-2" />
                  My Jobs
                  <Badge variant="outline" className="ml-2 h-5 min-w-[20px] px-1.5 bg-neon-yellow/20 text-neon-yellow border-neon-yellow/30 text-xs">
                    5
                  </Badge>
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">{children}</div>

      {/* Compare Jobs Tray */}
      {comparedJobs && <CompareJobsTray jobs={comparedJobs} onRemoveJob={onRemoveFromCompare} onCompare={onCompare} onClear={onClearCompare} />}

      {/* AI Assistant Drawer */}
      <JobAIAssistantDrawer isOpen={showAIAssistant} onClose={() => setShowAIAssistant(false)} selectedJob={aiAssistantJob} jobs={jobs} />

    </div>
  );
};

export default Layout;
