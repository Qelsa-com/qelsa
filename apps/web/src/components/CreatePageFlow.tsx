import { useCreatePageMutation } from "@/features/api/pagesApi";
import { Page } from "@/types/page";
import { ArrowLeft, Building2, Check, Facebook, Instagram, Linkedin, Sparkles, Twitter, Upload, User, Users, Youtube } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Input } from "./ui/input";
import { Progress } from "./ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Separator } from "./ui/separator";
import { Textarea } from "./ui/textarea";

type Step = "type" | "basic" | "branding" | "social" | "review";

interface CreatePageFlowProps {}

export function CreatePageFlow({}: CreatePageFlowProps) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("type");
  const [isGenerating, setIsGenerating] = useState(false);
  const [createPage, { isLoading, error }] = useCreatePageMutation();

  const [pageData, setPageData] = useState<Page>({
    name: "",
    type: null,
    industry: "",
    website: "",
    tagline: "",
    description: "",
    logo: "",
    linkedin_url: "",
    twitter_url: "",
    facebook_url: "",
    instagram_url: "",
    youtube_url: "",
  });

  console.log("pageData ---->", pageData);

  const steps: Step[] = ["type", "basic", "branding", "social", "review"];
  const currentStepIndex = steps.indexOf(step);
  const progress = ((currentStepIndex + 1) / steps.length) * 100;

  const handleGenerateAIContent = () => {};

  const handleNext = () => {
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < steps.length) {
      setStep(steps[nextIndex]);
    }
  };

  const handlePrevious = () => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setStep(steps[prevIndex]);
    }
  };

  const handleComplete = async () => {
    try {
      const res = await createPage(pageData).unwrap();
      if (res.success && res.data?.id) {
        router.push(`/pages/${res.data.id}`);
      }
    } catch (err) {
      console.error("Error creating page:", err);
    }
  };

  const isStepValid = () => {
    switch (step) {
      case "type":
        return pageData.type !== null;
      case "basic":
        return pageData.name.trim() !== "" && pageData.industry?.trim() !== "";
      case "branding":
        return pageData.tagline.trim() !== "" && pageData.description?.trim() !== "";
      case "social":
        return true; // Optional
      case "review":
        return true;
      default:
        return false;
    }
  };

  // Step 1: Select Page Type
  if (step === "type") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-background">
        <div className="glass-strong border-b border-glass-border">
          <div className="max-w-5xl mx-auto px-6 py-6">
            <Button onClick={() => router.push("pages")} variant="ghost" className="mb-4 text-muted-foreground hover:text-foreground">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Pages
            </Button>

            <h1 className="text-3xl font-bold bg-gradient-to-r from-neon-cyan via-neon-purple to-neon-pink bg-clip-text text-transparent">Create a Page</h1>
            <p className="text-muted-foreground mt-2">Choose what type of page you want to create</p>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-6 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Company Page */}
            <Card
              className={`p-8 glass border-glass-border cursor-pointer transition-all duration-300 hover:-translate-y-1 ${
                pageData.type === "company" ? "border-neon-cyan shadow-lg shadow-neon-cyan/20" : "hover:border-neon-cyan/50"
              }`}
              onClick={() => setPageData((prev) => ({ ...prev, type: "company" }))}
            >
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-2xl bg-neon-cyan/20 border-2 border-neon-cyan/30 flex items-center justify-center mb-4">
                  <Building2 className="w-8 h-8 text-neon-cyan" />
                </div>

                <h3 className="text-xl font-semibold mb-2">Company Page</h3>
                <Badge className="mb-4 bg-neon-cyan/20 text-neon-cyan border-0 text-xs">Best for businesses</Badge>

                <p className="text-muted-foreground text-sm mb-6">Showcase your company brand, post jobs, share updates, and connect with potential employees and customers.</p>

                <div className="space-y-2 text-sm text-left w-full">
                  <div className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-neon-green mt-0.5 flex-shrink-0" />
                    <span className="text-muted-foreground">Post job openings</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-neon-green mt-0.5 flex-shrink-0" />
                    <span className="text-muted-foreground">Showcase projects</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-neon-green mt-0.5 flex-shrink-0" />
                    <span className="text-muted-foreground">Team management</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-neon-green mt-0.5 flex-shrink-0" />
                    <span className="text-muted-foreground">Company analytics</span>
                  </div>
                </div>
              </div>
            </Card>

            {/* Community Page */}
            <Card
              className={`p-8 glass border-glass-border cursor-pointer transition-all duration-300 hover:-translate-y-1 ${
                pageData.type === "community" ? "border-neon-purple shadow-lg shadow-neon-purple/20" : "hover:border-neon-purple/50"
              }`}
              onClick={() => setPageData((prev) => ({ ...prev, type: "community" }))}
            >
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-2xl bg-neon-purple/20 border-2 border-neon-purple/30 flex items-center justify-center mb-4">
                  <Users className="w-8 h-8 text-neon-purple" />
                </div>

                <h3 className="text-xl font-semibold mb-2">Community Page</h3>
                <Badge className="mb-4 bg-neon-purple/20 text-neon-purple border-0 text-xs">Best for groups</Badge>

                <p className="text-muted-foreground text-sm mb-6">Build and grow a community around shared interests, host events, and foster meaningful connections.</p>

                <div className="space-y-2 text-sm text-left w-full">
                  <div className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-neon-green mt-0.5 flex-shrink-0" />
                    <span className="text-muted-foreground">Member discussions</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-neon-green mt-0.5 flex-shrink-0" />
                    <span className="text-muted-foreground">Event hosting</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-neon-green mt-0.5 flex-shrink-0" />
                    <span className="text-muted-foreground">Resource sharing</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-neon-green mt-0.5 flex-shrink-0" />
                    <span className="text-muted-foreground">Community insights</span>
                  </div>
                </div>
              </div>
            </Card>

            {/* Personal Page */}
            <Card
              className={`p-8 glass border-glass-border cursor-pointer transition-all duration-300 hover:-translate-y-1 ${
                pageData.type === "personal" ? "border-neon-pink shadow-lg shadow-neon-pink/20" : "hover:border-neon-pink/50"
              }`}
              onClick={() => setPageData((prev) => ({ ...prev, type: "personal" }))}
            >
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-2xl bg-neon-pink/20 border-2 border-neon-pink/30 flex items-center justify-center mb-4">
                  <User className="w-8 h-8 text-neon-pink" />
                </div>

                <h3 className="text-xl font-semibold mb-2">Personal Page</h3>
                <Badge className="mb-4 bg-neon-pink/20 text-neon-pink border-0 text-xs">Coming soon</Badge>

                <p className="text-muted-foreground text-sm mb-6">Establish your personal brand, share your expertise, and build your professional presence.</p>

                <div className="space-y-2 text-sm text-left w-full">
                  <div className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-neon-green mt-0.5 flex-shrink-0" />
                    <span className="text-muted-foreground">Portfolio showcase</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-neon-green mt-0.5 flex-shrink-0" />
                    <span className="text-muted-foreground">Thought leadership</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-neon-green mt-0.5 flex-shrink-0" />
                    <span className="text-muted-foreground">Personal branding</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-neon-green mt-0.5 flex-shrink-0" />
                    <span className="text-muted-foreground">Audience analytics</span>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          <div className="flex justify-end mt-8">
            <Button onClick={handleNext} disabled={!isStepValid()} className="gradient-animated">
              Continue
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Steps 2-5: Form with progress
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-background">
      {/* Header */}
      <div className="glass-strong border-b border-glass-border">
        <div className="max-w-3xl mx-auto px-6 py-6">
          <Button variant="ghost" onClick={handlePrevious} className="mb-4 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          <div className="mb-4">
            <h1 className="text-2xl font-bold">Create {pageData.type === "company" ? "Company" : "Community"} Page</h1>
            <p className="text-muted-foreground">
              {step === "basic" && "Basic information"}
              {step === "branding" && "Branding & description"}
              {step === "social" && "Social links (optional)"}
              {step === "review" && "Review and create"}
            </p>
          </div>

          {/* Progress */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                Step {currentStepIndex + 1} of {steps.length}
              </span>
              <span className="text-neon-cyan font-medium">{Math.round(progress)}% Complete</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-8">
        <Card className="p-8 glass border-glass-border">
          {/* Step 2: Basic Info */}
          {step === "basic" && (
            <div className="space-y-6">
              <div>
                <label className="text-sm font-medium mb-2 block">{pageData.type === "company" ? "Company Name" : "Community Name"} *</label>
                <Input
                  placeholder={pageData.type === "company" ? "e.g., TechCorp Solutions" : "e.g., AI Developers Community"}
                  value={pageData.name}
                  onChange={(e) => setPageData((prev) => ({ ...prev, name: e.target.value }))}
                  className="glass border-glass-border"
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Industry/Domain *</label>
                <Select value={pageData.industry} onValueChange={(value) => setPageData((prev) => ({ ...prev, industry: value }))}>
                  <SelectTrigger className="glass border-glass-border">
                    <SelectValue placeholder="Select industry" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="technology">Technology</SelectItem>
                    <SelectItem value="finance">Finance</SelectItem>
                    <SelectItem value="healthcare">Healthcare</SelectItem>
                    <SelectItem value="education">Education</SelectItem>
                    <SelectItem value="ecommerce">E-commerce</SelectItem>
                    <SelectItem value="entertainment">Entertainment</SelectItem>
                    <SelectItem value="consulting">Consulting</SelectItem>
                    <SelectItem value="manufacturing">Manufacturing</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Website</label>
                <Input
                  placeholder="https://example.com"
                  value={pageData.website}
                  onChange={(e) => setPageData((prev) => ({ ...prev, website: e.target.value }))}
                  className="glass border-glass-border"
                />
              </div>
            </div>
          )}

          {/* Step 3: Branding */}
          {step === "branding" && (
            <div className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium">Tagline *</label>
                  <Button size="sm" variant="ghost" onClick={handleGenerateAIContent} disabled={isGenerating || !pageData.name} className="text-neon-purple text-xs">
                    <Sparkles className="w-3 h-3 mr-1" />
                    AI Generate
                  </Button>
                </div>
                <Input
                  placeholder="A brief, catchy tagline (max 60 characters)"
                  value={pageData.tagline}
                  onChange={(e) => setPageData((prev) => ({ ...prev, tagline: e.target.value }))}
                  className="glass border-glass-border"
                  maxLength={60}
                />
                <p className="text-xs text-muted-foreground mt-1">{pageData.tagline.length}/60 characters</p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium">Description *</label>
                  <Button size="sm" variant="ghost" onClick={handleGenerateAIContent} disabled={isGenerating || !pageData.name} className="text-neon-purple text-xs">
                    <Sparkles className="w-3 h-3 mr-1" />
                    AI Generate
                  </Button>
                </div>
                <Textarea
                  placeholder="Describe what your page is about, your mission, and what makes you unique..."
                  value={pageData.description}
                  onChange={(e) => setPageData((prev) => ({ ...prev, description: e.target.value }))}
                  className="glass border-glass-border min-h-48"
                />
                {isGenerating && (
                  <div className="flex items-center gap-2 mt-2 text-xs text-neon-purple">
                    <div className="w-3 h-3 border-2 border-neon-purple/30 border-t-neon-purple rounded-full animate-spin" />
                    Generating AI content...
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Logo</label>
                  <Button variant="outline" className="w-full border-glass-border">
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Logo
                  </Button>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Banner</label>
                  <Button variant="outline" className="w-full border-glass-border">
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Banner
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Social Links */}
          {step === "social" && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground mb-4">Add your social media links to make it easy for visitors to connect with you across platforms.</p>

              <div>
                <label className="text-sm font-medium mb-2 block flex items-center gap-2">
                  <Linkedin className="w-4 h-4 text-[#0077B5]" />
                  LinkedIn
                </label>
                <Input
                  placeholder="https://linkedin.com/company/..."
                  value={pageData.linkedin_url || ""}
                  onChange={(e) =>
                    setPageData((prev) => ({
                      ...prev,
                      linkedin_url: e.target.value,
                    }))
                  }
                  className="glass border-glass-border"
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block flex items-center gap-2">
                  <Twitter className="w-4 h-4 text-[#1DA1F2]" />
                  Twitter
                </label>
                <Input
                  placeholder="https://twitter.com/..."
                  value={pageData.twitter_url || ""}
                  onChange={(e) =>
                    setPageData((prev) => ({
                      ...prev,
                      twitter_url: e.target.value,
                    }))
                  }
                  className="glass border-glass-border"
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block flex items-center gap-2">
                  <Instagram className="w-4 h-4 text-[#E4405F]" />
                  Instagram
                </label>
                <Input
                  placeholder="https://instagram.com/..."
                  value={pageData.instagram_url || ""}
                  onChange={(e) =>
                    setPageData((prev) => ({
                      ...prev,
                      instagram_url: e.target.value,
                    }))
                  }
                  className="glass border-glass-border"
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block flex items-center gap-2">
                  <Facebook className="w-4 h-4 text-[#1877F2]" />
                  Facebook
                </label>
                <Input
                  placeholder="https://facebook.com/..."
                  value={pageData.facebook_url || ""}
                  onChange={(e) =>
                    setPageData((prev) => ({
                      ...prev,
                      facebook_url: e.target.value,
                    }))
                  }
                  className="glass border-glass-border"
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block flex items-center gap-2">
                  <Youtube className="w-4 h-4 text-[#FF0000]" />
                  YouTube
                </label>
                <Input
                  placeholder="https://youtube.com/@..."
                  value={pageData.youtube_url || ""}
                  onChange={(e) =>
                    setPageData((prev) => ({
                      ...prev,
                      youtube_url: e.target.value,
                    }))
                  }
                  className="glass border-glass-border"
                />
              </div>
            </div>
          )}

          {/* Step 5: Review */}
          {step === "review" && (
            <div className="space-y-6">
              <div className="p-4 rounded-lg bg-gradient-to-br from-neon-cyan/10 to-neon-purple/10 border border-glass-border">
                <h3 className="font-semibold mb-2">Page Preview</h3>
                <p className="text-sm text-muted-foreground">Review your page details before creating it. You can always edit these later.</p>
              </div>

              <Separator />

              <div>
                <p className="text-sm text-muted-foreground mb-1">Page Type</p>
                <Badge className={pageData.type === "company" ? "bg-neon-cyan/20 text-neon-cyan border-0" : "bg-neon-purple/20 text-neon-purple border-0"}>
                  {pageData.type === "company" ? <Building2 className="w-3 h-3 mr-1" /> : <Users className="w-3 h-3 mr-1" />}
                  {pageData.type === "company" ? "Company" : "Community"}
                </Badge>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-1">Name</p>
                <p className="font-semibold">{pageData.name}</p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-1">Tagline</p>
                <p>{pageData.tagline}</p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-1">Description</p>
                <p className="text-sm whitespace-pre-line">{pageData.description}</p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-1">Industry</p>
                <p className="capitalize">{pageData.industry}</p>
              </div>

              {pageData.website && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Website</p>
                  <p className="text-neon-cyan">{pageData.website}</p>
                </div>
              )}

              <div>
                <p className="text-sm text-muted-foreground mb-2">Social Links</p>
                <div className="flex gap-2">
                  {pageData.linkedin_url && <Badge variant="outline">LinkedIn</Badge>}
                  {pageData.twitter_url && <Badge variant="outline">Twitter</Badge>}
                  {pageData.instagram_url && <Badge variant="outline">Instagram</Badge>}
                  {pageData.facebook_url && <Badge variant="outline">Facebook</Badge>}
                  {pageData.youtube_url && <Badge variant="outline">YouTube</Badge>}
                </div>
              </div>
            </div>
          )}

          <Separator className="my-6" />

          {/* Navigation Buttons */}
          <div className="flex gap-3">
            <Button variant="outline" onClick={handlePrevious} className="flex-1 border-glass-border">
              Previous
            </Button>
            {step === "review" ? (
              <Button onClick={handleComplete} className="flex-1 gradient-animated">
                <Check className="w-4 h-4 mr-2" />
                Create Page
              </Button>
            ) : (
              <Button onClick={handleNext} disabled={!isStepValid()} className="flex-1 gradient-animated">
                Continue
              </Button>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
