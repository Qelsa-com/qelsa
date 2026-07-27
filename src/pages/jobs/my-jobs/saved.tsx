import { formatCity } from "@/constants/city";
import MyJobLayout from "@/components/job/MyJobLayout";
import { useLazyGetSavedJobsQuery, useToggleSaveJobMutation } from "@/features/api/jobsApi";
import Layout from "@/layout";
import { Box } from "@mui/material";
import { Archive, ArrowRight, Bell, DollarSign, Eye, MessageSquare, MoreVertical, Share2, Star, Target, Trash2, Zap } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "../../../components/ui/button";
import { Card } from "../../../components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "../../../components/ui/dropdown-menu";
import { SearchFilters } from "../smart_matches";

const Saved = () => {
  const [toggleSaveJob] = useToggleSaveJobMutation();
  const router = useRouter();

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

  const [triggerGetJobs, { data: jobsList, error, isLoading }] = useLazyGetSavedJobsQuery();

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

  return (
    <Layout activeSection={"jobs"}>
      <MyJobLayout active_page={"saved"} {...{ jobs, filters, setFilters, query, setQuery, onSearch }}>
        <Box className="space-y-4">
          {jobs?.map((job) => (
            <Card key={job.id} className="glass border-glass-border p-6 hover:border-neon-cyan/50 transition-all">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-semibold">{job.title}</h3>
                        {/* <Badge variant="outline" className={`text-xs ${getStatusColor(job.source.toLowerCase())}`}>
                          {job.source}
                        </Badge> */}
                        {/* {job.hasReminder && (
                          <Badge variant="outline" className="text-xs border-neon-yellow/30 text-neon-yellow">
                            <Bell className="w-3 h-3 mr-1" />
                            Reminder
                          </Badge>
                        )} */}
                      </div>
                      <p className="text-muted-foreground mb-3">
                        {job.page?.name || job.company_name} • {job.city && formatCity(job.city)}
                      </p>

                      {/* Auto-enriched highlights */}
                      <div className="flex flex-wrap items-center gap-3 mb-3">
                        {job.salary && (
                          <div className="flex items-center gap-1 text-sm">
                            <DollarSign className="w-4 h-4 text-neon-green" />
                            <span className="text-neon-green">{job.salary}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1 text-sm">
                          <Target className="w-4 h-4 text-neon-cyan" />
                          {/* <span className="text-neon-cyan">{job.matchScore}% Match</span> */}
                        </div>
                        <div className="flex items-center gap-1 text-sm">
                          {/* <Flag className={`w-4 h-4 ${getPriorityColor(job.priority)}`} />
                          <span className={getPriorityColor(job.priority)}>{job.priority} priority</span> */}
                        </div>
                      </div>

                      {/* Skills */}
                      {/* <div className="flex flex-wrap gap-2 mb-3">
                        {job.skills.map((skill, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs border-neon-purple/30 text-neon-purple">
                            {skill}
                          </Badge>
                        ))}
                      </div> */}

                      {/* Notes preview */}
                      {/* {job.notes && (
                        <div className="glass-strong rounded p-2 text-sm text-muted-foreground mb-3">
                          <MessageSquare className="w-3 h-3 inline mr-1" />
                          {job.notes}
                        </div>
                      )} */}

                      {/* <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Posted {job.postedDate}
                        </span>
                        {job.deadline && (
                          <span className="flex items-center gap-1 text-destructive">
                            <AlertCircle className="w-3 h-3" />
                            Deadline: {job.deadline}
                          </span>
                        )}
                      </div> */}
                    </div>
                  </div>

                  {/* One-tap actions */}
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" className="gradient-animated">
                      <Zap className="w-4 h-4 mr-2" />
                      Tailor Resume
                    </Button>
                    <Button size="sm" variant="outline" className="border-neon-purple/30 text-neon-purple">
                      <Star className="w-4 h-4 mr-2" />
                      Set Priority
                    </Button>
                    <Button size="sm" variant="outline" className="border-neon-cyan/30 text-neon-cyan">
                      <Bell className="w-4 h-4 mr-2" />
                      Set Reminder
                    </Button>
                    <Button size="sm" variant="outline" className="border-glass-border">
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Add Note
                    </Button>
                    <Button size="sm" variant="outline" className="border-glass-border" onClick={() => router.push(`/jobs/${job.id}`)}>
                      <ArrowRight className="w-4 h-4 mr-2" />
                      Apply Now
                    </Button>
                  </div>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="glass border-glass-border">
                    <DropdownMenuItem onClick={() => router.push(`/jobs/${job.id}`)}>
                      <Eye className="w-4 h-4 mr-2" />
                      View Details
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Share2 className="w-4 h-4 mr-2" />
                      Share
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Archive className="w-4 h-4 mr-2" />
                      Archive
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-destructive" onClick={() => toggleSaveJob(job.id)}>
                      <Trash2 className="w-4 h-4 mr-2" />
                      Remove
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </Card>
          ))}
        </Box>
      </MyJobLayout>
    </Layout>
  );
};

export default Saved;
