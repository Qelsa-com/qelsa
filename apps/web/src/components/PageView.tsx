import { CompanyPageSkeleton } from "./pageSkeletons";
import { formatCity } from "@/constants/city";
import { useGetJobsQuery } from "@/features/api/jobsApi";
import { useGetPageByIdQuery } from "@/features/api/pagesApi";
import { ArrowLeft, Building2, CheckCircle2, Eye, Globe, Instagram, Linkedin, MapPin, MessageCircle, Send, Share2, Sparkles, Twitter, UserPlus, Users } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Input } from "./ui/input";
import { Separator } from "./ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";

export function PageView() {
  const router = useRouter();
  const params = useParams();

  // ✅ Normalize id (handle both string and array cases)
  const id = Array.isArray(params?.id) ? params.id[0] : params?.id;

  const [isFollowing, setIsFollowing] = useState(false);
  const [showAIChat, setShowAIChat] = useState(false);
  const [aiQuestion, setAiQuestion] = useState("");

  const {
    data: pageData,
    isLoading,
    error,
  } = useGetPageByIdQuery(id ?? "", {
    skip: !id,
  });
  console.log("🚀 ~ PageView ~ pageData:", pageData)

  const { data: pageJobs, isLoading: jobsLoading, error: jobsError } = useGetJobsQuery({ page_id: id });

  if (isLoading) return <CompanyPageSkeleton />;

  if (error) return <div className="p-8 text-center text-destructive">Failed to load page details.</div>;

  if (!pageData) return <div className="p-8 text-center text-muted-foreground">Page not found.</div>;

  const jobs = [];
  const updates = [];
  const projects = [];
  const teamMembers = [];

  const handleAIAsk = () => {
    console.log("AI Question:", aiQuestion);
    setAiQuestion("");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-background">
      {/* Banner */}
      <div className="relative h-64 bg-gradient-to-r from-neon-cyan/20 via-neon-purple/20 to-neon-pink/20 border-b border-glass-border">
        <div className="absolute top-6 left-6">
          <Button variant="ghost" className="glass-strong text-white hover:text-foreground" onClick={() => router.push("/pages")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </div>
        {pageData.can_manage && (
          <div className="absolute top-6 right-6">
            <Button onClick={() => router.push(`/pages/${id}/manage`)} className="gradient-animated">Edit Page</Button>
          </div>
        )}
      </div>

      {/* Header */}
      <div className="max-w-7xl mx-auto px-6 -mt-16">
        <div className="flex flex-col md:flex-row gap-6 items-start md:items-end">
          {/* Logo */}
          <div className="w-32 h-32 rounded-2xl gradient-animated flex items-center justify-center shadow-lg relative">
            <span className="text-5xl font-bold text-black">T</span>
          </div>

          {/* Info */}
          <div className="flex-1">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold mb-1">{pageData.name}</h1>
                <p className="text-lg text-muted-foreground mb-3">{pageData.tagline}</p>
                <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Building2 className="w-4 h-4" />
                    <span>{pageData.industry}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {/* <span>{pageData.location}</span> */}
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    {/* <span>{pageData.followers.toLocaleString()} followers</span> */}
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button variant={isFollowing ? "outline" : "default"} onClick={() => setIsFollowing(!isFollowing)} className={isFollowing ? "border-neon-cyan/30 text-neon-cyan" : "gradient-animated"}>
                  {isFollowing ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Following
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4 mr-2" />
                      Follow
                    </>
                  )}
                </Button>
                <Button variant="outline" className="border-glass-border">
                  <Share2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Links */}
        <div className="flex gap-3 mt-6">
          {pageData.website && (
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-neon-cyan">
              <Globe className="w-4 h-4 mr-2" />
              Website
            </Button>
          )}
          {pageData.linkedin_url && (
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-[#0077B5]">
              <Linkedin className="w-4 h-4" />
            </Button>
          )}
          {pageData.twitter_url && (
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-[#1DA1F2]">
              <Twitter className="w-4 h-4" />
            </Button>
          )}
          {pageData.instagram_url && (
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-[#E4405F]">
              <Instagram className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Tabs */}
            <Tabs defaultValue="about" className="w-full">
              <TabsList className="glass border-glass-border w-full grid grid-cols-4">
                <TabsTrigger value="about">About</TabsTrigger>
                <TabsTrigger value="jobs">Jobs ({pageJobs?.length || 0})</TabsTrigger>
                <TabsTrigger value="updates">Updates</TabsTrigger>
                <TabsTrigger value="projects">Projects</TabsTrigger>
              </TabsList>

              {/* About Tab */}
              <TabsContent value="about" className="space-y-6">
                <Card className="p-6 glass border-glass-border">
                  <h3 className="font-semibold mb-4">About Us</h3>
                  <p className="text-muted-foreground whitespace-pre-line">{pageData.description}</p>
                </Card>

                <Card className="p-6 glass border-glass-border">
                  <h3 className="font-semibold mb-4">Company Info</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Industry</span>
                      <span className="font-medium">{pageData.industry}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Company Size</span>
                      {/* <span className="font-medium">{pageData.size}</span> */}
                    </div>
                    <Separator />
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Founded</span>
                      {/* <span className="font-medium">{pageData.founded}</span> */}
                    </div>
                    <Separator />
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Location</span>
                      {/* <span className="font-medium">{pageData.location}</span> */}
                    </div>
                  </div>
                </Card>
              </TabsContent>

              {/* Jobs Tab */}
              <TabsContent value="jobs" className="space-y-4">
                {pageJobs?.map((job) => (
                  <Card onClick={() => router.push(`/jobs/${job.id}`)} key={job.id} className="p-6 glass border-glass-border hover:border-neon-cyan/50 transition-all cursor-pointer">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold mb-1">{job.title}</h3>
                        <p className="text-sm text-muted-foreground">{job.city && formatCity(job.city)}</p>
                      </div>
                      <Badge className="bg-neon-green/20 text-neon-green border-0">{job.salary}</Badge>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-3">
                      <Badge variant="secondary">{job.work_type}</Badge>
                      <Badge variant="secondary">{job.experience}</Badge>
                    </div>

                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{job.published_date}</span>
                      {/* <span>{job.applicants} applicants</span> */}
                    </div>
                  </Card>
                ))}
              </TabsContent>

              {/* Updates Tab */}
              <TabsContent value="updates" className="space-y-4">
                {updates.map((update) => (
                  <Card key={update.id} className="p-6 glass border-glass-border">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg gradient-animated flex items-center justify-center flex-shrink-0">
                        <Building2 className="w-5 h-5 text-black" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">{pageData.name}</span>
                          <span className="text-xs text-muted-foreground">• {update.date}</span>
                        </div>
                        <h4 className="font-semibold mb-2">{update.title}</h4>
                        <p className="text-sm text-muted-foreground mb-3">{update.content}</p>

                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <button className="flex items-center gap-1 hover:text-neon-pink transition-colors">
                            <Eye className="w-4 h-4" />
                            <span>{update.likes}</span>
                          </button>
                          <button className="flex items-center gap-1 hover:text-neon-cyan transition-colors">
                            <MessageCircle className="w-4 h-4" />
                            <span>{update.comments}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </TabsContent>

              {/* Projects Tab */}
              <TabsContent value="projects" className="space-y-4">
                {projects.map((project) => (
                  <Card key={project.id} className="p-6 glass border-glass-border hover:border-neon-purple/50 transition-all">
                    <h3 className="font-semibold mb-2">{project.title}</h3>
                    <p className="text-sm text-muted-foreground mb-3">{project.description}</p>
                    <div className="flex flex-wrap gap-2">
                      {project.tech.map((tech, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs">
                          {tech}
                        </Badge>
                      ))}
                    </div>
                  </Card>
                ))}
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* AI Assistant */}
            <Card className="p-6 glass border-glass-border">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-5 h-5 text-neon-purple" />
                <h3 className="font-semibold">AI Assistant</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-4">Ask me anything about our company, culture, hiring process, or benefits.</p>

              {showAIChat ? (
                <div className="space-y-3">
                  <Input
                    placeholder="Ask a question..."
                    value={aiQuestion}
                    onChange={(e) => setAiQuestion(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleAIAsk()}
                    className="glass border-glass-border"
                  />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleAIAsk} disabled={!aiQuestion.trim()} className="flex-1 gradient-animated">
                      <Send className="w-3 h-3 mr-1" />
                      Ask
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setShowAIChat(false)} className="border-glass-border">
                      Close
                    </Button>
                  </div>
                </div>
              ) : (
                <Button onClick={() => setShowAIChat(true)} className="w-full gradient-animated">
                  <Sparkles className="w-4 h-4 mr-2" />
                  Ask AI
                </Button>
              )}
            </Card>

            {/* Team Members */}
            <Card className="p-6 glass border-glass-border">
              <h3 className="font-semibold mb-4">Team Members</h3>
              <div className="space-y-3">
                {teamMembers.slice(0, 4).map((member) => (
                  <div key={member.id} className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-neon-cyan to-neon-purple flex items-center justify-center">
                      <span className="text-sm font-bold text-black">{member.name.charAt(0)}</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium">{member.name}</p>
                      <p className="text-xs text-muted-foreground">{member.role}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Stats */}
            <Card className="p-6 glass border-glass-border">
              <h3 className="font-semibold mb-4">Page Stats</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Followers</span>
                  {/* <span className="font-medium text-neon-cyan">{pageData.followers.toLocaleString()}</span> */}
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Active Jobs</span>
                  {/* <span className="font-medium text-neon-purple">{pageData.stats.activeJobs}</span> */}
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Total Updates</span>
                  {/* <span className="font-medium text-neon-green">{pageData.stats.totalUpdates}</span> */}
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
