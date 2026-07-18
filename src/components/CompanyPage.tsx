import { useAuth } from "@/contexts/AuthContext";
import { useGetJobsQuery } from "@/features/api/jobsApi";
import { Job } from "@/types/job";
import { useGetPageByIdQuery } from "@/features/api/pagesApi";
import { ArrowLeft, Briefcase, Building2, Calendar, Check, CheckCircle, ChevronRight, Copy, Edit3, ExternalLink, MapPin, Share2, Star, Users } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Input } from "./ui/input";
import { Separator } from "./ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";

export function CompanyPage() {
  const router = useRouter();
  const params = useParams();
  const id = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const [isFollowing, setIsFollowing] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [showShareModal, setShowShareModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const { user } = useAuth();

  const handleFollowCompany = () => {
    setIsFollowing(!isFollowing);
  };

  const shareUrl = typeof window !== "undefined" ? window.location.href : "";

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success("Link copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy link");
    }
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
                  <Button variant="outline" onClick={() => setShowShareModal(true)} className="border-glass-border hover:bg-white/5">
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
                              {skill.skill.name}
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

      {/* Share Modal */}
      <Dialog open={showShareModal} onOpenChange={setShowShareModal}>
        <DialogContent className="glass-strong border-glass-border sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Share2 className="w-5 h-5 text-neon-cyan" />
              Share {pageData.name}
            </DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-3 gap-3 py-2">
            <a
              href={`https://wa.me/?text=${encodeURIComponent(`Check out ${pageData.name} on Qelsa ${shareUrl}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center gap-2 p-4 rounded-xl border border-glass-border hover:bg-white/5 transition-colors"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7 text-green-500">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              <span className="text-xs text-muted-foreground">WhatsApp</span>
            </a>
            <a
              href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center gap-2 p-4 rounded-xl border border-glass-border hover:bg-white/5 transition-colors"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7 text-blue-500">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
              </svg>
              <span className="text-xs text-muted-foreground">LinkedIn</span>
            </a>
            <a
              href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center gap-2 p-4 rounded-xl border border-glass-border hover:bg-white/5 transition-colors"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7 text-blue-600">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
              <span className="text-xs text-muted-foreground">Facebook</span>
            </a>
          </div>

          <Separator className="bg-glass-border" />

          <div className="space-y-2">
            <span className="text-sm text-muted-foreground">Or copy link</span>
            <div className="flex items-center gap-2">
              <Input value={shareUrl} readOnly className="glass border-glass-border text-sm" />
              <Button onClick={handleCopyLink} className="bg-neon-cyan text-black hover:bg-neon-cyan/90 flex-shrink-0">
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
