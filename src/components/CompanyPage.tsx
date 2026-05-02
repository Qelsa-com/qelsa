import { useAuth } from "@/contexts/AuthContext";
import { useGetJobsQuery } from "@/features/api/jobsApi";
import { Job } from "@/types/job";
import { useGetPageByIdQuery } from "@/features/api/pagesApi";
import { ArrowLeft, Briefcase, Building2, Calendar, CheckCircle, ChevronRight, Edit3, ExternalLink, MapPin, Share2, Star, Users } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Separator } from "./ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";

export function CompanyPage() {
  const router = useRouter();
  const params = useParams();
  const id = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const [isFollowing, setIsFollowing] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const { user } = useAuth();

  const handleFollowCompany = () => {
    setIsFollowing(!isFollowing);
  };

  const {
    data: pageData,
    isLoading,
    error,
  } = useGetPageByIdQuery(id ?? "", {
    skip: !id,
  });

  const { data: pageJobs } = useGetJobsQuery({ page_id: id }, { skip: !id });

  if (isLoading) return <div className="p-8 text-center text-muted-foreground">Loading page details...</div>;

  if (error) return <div className="p-8 text-center text-destructive">Failed to load page details.</div>;

  if (!pageData) return <div className="p-8 text-center text-muted-foreground">Page not found.</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-background">
      {/* Header */}
      <div className="glass-strong border-b border-glass-border sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <Button variant="ghost" size="sm" className="hover:bg-neon-cyan/10 hover:text-neon-cyan" onClick={() => router.push("/pages")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </div>
      </div>

      {/* Cover Image */}
      <div className="relative h-64 overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={"https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&h=300&fit=crop&crop=center"} alt={`${pageData.name} cover`} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
      </div>

      <div className="max-w-6xl mx-auto px-6 -mt-16 relative z-10">
        {/* Company Header Card */}
        <Card className="glass border-glass-border p-6 mb-6">
          <div className="flex items-start gap-6">
            {/* Company Logo */}
            <div className="relative flex-shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={pageData.logo} alt={pageData.name} className="w-24 h-24 rounded-xl object-cover border-2 border-glass-border bg-background" />
            </div>

            {/* Company Info */}
            <div className="flex-1">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-3xl font-bold mb-2">{pageData.name}</h1>
                  <p className="text-muted-foreground mb-3">{pageData.tagline}</p>
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-500 fill-current" />
                      {/* <span className="font-medium">{pageData.rating}</span>
                      <span className="text-muted-foreground">({pageData.totalReviews} reviews)</span> */}
                    </div>
                    <Separator orientation="vertical" className="h-4" />
                    {/* Follower Avatars and Stats */}
                    <div className="flex items-center gap-2">
                      {/* Overlapping Avatars */}
                      <div className="flex -space-x-2">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-neon-cyan to-neon-purple border-2 border-background overflow-hidden">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop" alt="Follower" className="w-full h-full object-cover" />
                        </div>
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-neon-purple to-neon-pink border-2 border-background overflow-hidden">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop" alt="Follower" className="w-full h-full object-cover" />
                        </div>
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-neon-pink to-neon-cyan border-2 border-background overflow-hidden">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop" alt="Follower" className="w-full h-full object-cover" />
                        </div>
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-neon-cyan to-neon-purple border-2 border-background overflow-hidden">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop" alt="Follower" className="w-full h-full object-cover" />
                        </div>
                        <div className="w-6 h-6 rounded-full glass border-2 border-background flex items-center justify-center">
                          <span className="text-[10px] font-medium text-muted-foreground">+1</span>
                        </div>
                      </div>

                      {/* Follower Stats */}
                      <div className="flex items-center gap-3">
                        {/* <span className="font-medium">{(pageData.followers / 1000).toFixed(1)}k Followers</span> */}
                        <span className="text-muted-foreground">·</span>
                        <Badge className="bg-neon-cyan/20 text-neon-cyan border-0 hover:bg-neon-cyan/30">3 Mutual</Badge>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2">
                  <Button onClick={handleFollowCompany} className={isFollowing ? "bg-white/10 hover:bg-white/20" : "bg-neon-cyan hover:bg-neon-cyan/90 text-black"}>
                    {isFollowing ? (
                      <>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Following
                      </>
                    ) : (
                      <>
                        <Users className="w-4 h-4 mr-2" />
                        Follow
                      </>
                    )}
                  </Button>
                  <Button variant="outline" className="border-glass-border hover:bg-white/5">
                    <Share2 className="w-4 h-4" />
                  </Button>
                  {pageData?.owner?.id == user?.id && (
                    <Button
                      onClick={() => {
                        router.push(`/pages/${pageData.id}/manage`);
                      }}
                      className="bg-neon-purple hover:bg-neon-purple/90 text-black"
                    >
                      <Edit3 className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                  )}
                </div>
              </div>

              {/* Quick Stats */}
              <div className="flex items-center gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-neon-cyan" />
                  <span>{pageData.industry}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-neon-purple" />
                  {/* <span>{pageData.companySize}</span> */}
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-neon-pink" />
                  {/* <span>{pageData.headquarters}</span> */}
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-neon-green" />
                  {/* <span>Founded {pageData.founded}</span> */}
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="glass border-glass-border">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="jobs">Jobs ({pageData.jobs.length || 0})</TabsTrigger>
            <TabsTrigger value="updates">Updates</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main Content */}
              <div className="lg:col-span-2 space-y-6">
                {/* About */}
                <Card className="glass border-glass-border p-6">
                  <h2 className="text-xl font-semibold mb-4">About {pageData.name}</h2>
                  <p className="text-muted-foreground leading-relaxed mb-4">{pageData.description}</p>
                  <div className="flex flex-wrap gap-2">
                    {/* {pageData.specialties.map((specialty, index) => (
                      <Badge key={index} variant="secondary" className="bg-white/5">
                        {specialty}
                      </Badge>
                    ))} */}
                  </div>
                </Card>

                {/* Company Culture Attributes */}
                {/* {pageData.cultureAttributes && pageData.cultureAttributes.length > 0 && (
                  <Card className="glass border-glass-border p-6">
                    <h2 className="text-xl font-semibold mb-2">Company Culture</h2>
                    {pageData.cultureStatement && <p className="text-muted-foreground mb-4 italic">&quot;{pageData.cultureStatement}&quot;</p>}
                    <div className="flex flex-wrap gap-2">
                      {pageData.cultureAttributes.map((attrKey: string) => {
                        const attr = CULTURE_ATTRIBUTES.find((a) => a.key === attrKey);
                        if (!attr) return null;
                        const AttrIcon = attr.icon;
                        return (
                          <Badge key={attrKey} variant="secondary" className="bg-neon-cyan/10 border border-neon-cyan/30 text-white px-3 py-1.5 flex items-center gap-2">
                            <AttrIcon className="h-3.5 w-3.5" />
                            {attr.name}
                          </Badge>
                        );
                      })}
                    </div>
                  </Card>
                )} */}

                {/* Company Stats */}
                <Card className="glass border-glass-border p-6">
                  <h2 className="text-xl font-semibold mb-6">Company Highlights</h2>
                  <div className="grid grid-cols-2 gap-6">
                    {/* {pageData.stats.map((stat, index) => (
                      <div key={index} className="text-center p-4 rounded-lg glass-strong">
                        <div className="text-2xl font-bold text-neon-cyan mb-1">{stat.value}</div>
                        <div className="font-medium mb-1">{stat.label}</div>
                        <div className="text-xs text-muted-foreground">{stat.subtitle}</div>
                      </div>
                    ))} */}
                  </div>
                </Card>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Company Details */}
                <Card className="glass border-glass-border p-6">
                  <h3 className="font-semibold mb-4">Company Details</h3>
                  <div className="space-y-4">
                    <div>
                      <div className="text-sm text-muted-foreground mb-1">Website</div>
                      <a href={pageData.website} target="_blank" rel="noopener noreferrer" className="text-sm text-neon-cyan hover:underline flex items-center gap-1">
                        {pageData.website?.replace("https://", "")}
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                    <Separator />
                    <div>
                      <div className="text-sm text-muted-foreground mb-1">Industry</div>
                      <div className="text-sm">{pageData.industry}</div>
                    </div>
                    <Separator />
                    <div>
                      <div className="text-sm text-muted-foreground mb-1">Company Size</div>
                      {/* <div className="text-sm">{pageData.companySize}</div> */}
                    </div>
                    <Separator />
                    <div>
                      <div className="text-sm text-muted-foreground mb-1">Headquarters</div>
                      {/* <div className="text-sm">{pageData.headquarters}</div> */}
                    </div>
                    <Separator />
                    <div>
                      <div className="text-sm text-muted-foreground mb-1">Founded</div>
                      {/* <div className="text-sm">{pageData.founded}</div> */}
                    </div>
                  </div>
                </Card>

                {/* Open Jobs CTA */}
                <Card className="glass border-glass-border p-6 bg-gradient-to-br from-neon-cyan/10 to-neon-purple/10">
                  <div className="text-center">
                    <Briefcase className="w-8 h-8 mx-auto mb-3 text-neon-cyan" />
                    <h3 className="font-semibold mb-2">{pageJobs?.length || 0} Open Positions</h3>
                    <p className="text-sm text-muted-foreground mb-4">Explore opportunities to join our team</p>
                    <Button onClick={() => setActiveTab("jobs")} className="w-full bg-neon-cyan hover:bg-neon-cyan/90 text-black">
                      View Jobs
                      <ChevronRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Jobs Tab */}
          <TabsContent value="jobs" className="space-y-4">
            <Card className="glass border-glass-border p-6">
              <h2 className="text-xl font-semibold mb-6">Open Positions at {pageData.name}</h2>
              <div className="space-y-4">
                {pageJobs?.map((job: Job) => (
                  <Card key={job.id} className="glass-strong border-glass-border hover:border-neon-cyan/30 transition-all cursor-pointer p-5" onClick={() => router.push(`/jobs/${job.id}`)}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="font-semibold mb-2 hover:text-neon-cyan transition-colors">{job.title}</h3>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                          <div className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            <span>{job.location}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Briefcase className="w-4 h-4" />
                            <span>{job.work_type}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            <span>Posted {new Date(job.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {job.job_skills?.slice(0, 4).map((skill, index) => (
                            <Badge key={index} variant="secondary" className="text-xs bg-white/5">
                              {skill.title}
                            </Badge>
                          ))}
                          {job.job_skills?.length > 4 && (
                            <Badge variant="secondary" className="text-xs bg-white/5">
                              +{job.job_skills.length - 4}
                            </Badge>
                          )}
                        </div>
                      </div>
                      {/* {job.fitScore && (
                        <div className="flex items-center gap-1.5 text-sm bg-neon-green/10 border border-neon-green/30 rounded-lg px-3 py-2">
                          <Target className="w-4 h-4 text-neon-green" />
                          <span className="text-neon-green font-medium">{job.fitScore}% fit</span>
                        </div>
                      )} */}
                    </div>
                  </Card>
                ))}
              </div>
            </Card>
          </TabsContent>

          {/* Updates Tab */}
          <TabsContent value="updates" className="space-y-4">
            {/* {pageData.recentUpdates.map((update) => (
              <Card key={update.id} className="glass border-glass-border p-6">
                <div className="flex items-start gap-4">
                  {update.image && <img src={update.image} alt={update.title} className="w-24 h-24 rounded-lg object-cover border border-glass-border" />}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold">{update.title}</h3>
                      <Badge variant="secondary" className="text-xs">
                        {new Date(update.date).toLocaleDateString()}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">{update.description}</p>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <button className="flex items-center gap-1 hover:text-neon-pink transition-colors">
                        <Heart className="w-4 h-4" />
                        <span>{update.likes}</span>
                      </button>
                      <button className="flex items-center gap-1 hover:text-neon-cyan transition-colors">
                        <MessageCircle className="w-4 h-4" />
                        <span>{update.comments}</span>
                      </button>
                      <button className="flex items-center gap-1 hover:text-neon-purple transition-colors">
                        <Share2 className="w-4 h-4" />
                        <span>Share</span>
                      </button>
                    </div>
                  </div>
                </div>
              </Card>
            ))} */}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
