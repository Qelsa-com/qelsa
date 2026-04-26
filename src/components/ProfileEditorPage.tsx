import { useGetProfileQuery, useUpdateProfileMutation } from "@/features/api/authApi";
import { User as UserProfile } from "@/types/user";
import {
  AlertTriangle,
  ArrowLeft,
  BarChart3,
  Building,
  Camera,
  Check,
  CheckCircle,
  ChevronDown,
  Clock,
  Coffee,
  Download,
  Eye,
  EyeOff,
  FileText,
  Github,
  Globe,
  GraduationCap,
  Heart,
  History,
  Info,
  Layers,
  Linkedin,
  Link as LinkIcon,
  Loader2,
  Lock,
  Mail,
  MapPin,
  Palette,
  Plus,
  RefreshCw,
  Rocket,
  Save,
  Share2,
  Sparkles,
  Target,
  Target as TargetIcon,
  Trash2,
  TrendingUp as TrendingUpIcon,
  Twitter,
  Unlock,
  Upload,
  User,
  Users,
  Users2,
  XCircle,
  Zap,
} from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Separator } from "./ui/separator";
import { Textarea } from "./ui/textarea";

interface MediaLink {
  id: string;
  type: "portfolio" | "slides" | "video" | "certificate";
  title: string;
  url: string;
  thumbnail?: string;
}

const JOB_TYPES = [
  { value: "preffer_full_time", label: "Full-time" },
  { value: "preffer_contract", label: "Contract" },
  { value: "preffer_freelance", label: "Freelance" },
  { value: "preffer_internship", label: "Internship" },
];
const REMOTE_PREFERENCES = [
  { value: "onsite", label: "On-site" },
  { value: "hybrid", label: "Hybrid" },
  { value: "remote", label: "Remote" },
];
const CURRENCIES = ["INR", "USD", "EUR", "GBP"];
const SUMMARY_TEMPLATES = {
  concise: "Experienced [role] with [X] years in [industry]. Skilled in [key skills]. Proven track record of [achievement].",
  achievement: "Results-driven [role] who delivered [key metric] at [company]. Expert in [skills] with focus on [impact area].",
  story: "Passionate [role] who began journey in [year/context]. Since then, built [achievement] and led [team/project]. Now focused on [current goal].",
};
const TARGET_ROLES = ["Product Manager", "Data Analyst", "ML Product Manager", "Software Engineer", "Designer"];

const CULTURE_ATTRIBUTES = [
  { key: "collaborative", label: "Collaborative / Team-first", icon: Users2, tooltip: "You thrive working closely with cross-functional teams" },
  { key: "autonomous", label: "Autonomous / High ownership", icon: TargetIcon, tooltip: "You prefer owning projects end-to-end with limited oversight" },
  { key: "fast_paced", label: "Fast-paced / Rapid iteration", icon: Rocket, tooltip: "You excel in environments that move quickly and iterate often" },
  { key: "structured", label: "Structured / Process-oriented", icon: Layers, tooltip: "You value clear processes and well-defined workflows" },
  { key: "remote_first", label: "Remote-first / Distributed", icon: Globe, tooltip: "You prefer companies with strong remote-work culture" },
  { key: "office_first", label: "Office-first / In-person", icon: Building, tooltip: "You thrive in face-to-face collaborative environments" },
  { key: "flat_hierarchy", label: "Flat / Low hierarchy", icon: Users, tooltip: "You prefer minimal organizational layers and open communication" },
  { key: "career_paths", label: "Clear career paths", icon: TrendingUpIcon, tooltip: "You value transparent promotion criteria and growth opportunities" },
  { key: "mission_driven", label: "Mission-driven / Impact-first", icon: Heart, tooltip: "You want your work to make a meaningful difference" },
  { key: "work_life_balance", label: "Work–life balance", icon: Coffee, tooltip: "You prioritize flexible hours and sustainable workload" },
  { key: "learning_focused", label: "Learning-focused / Mentorship", icon: GraduationCap, tooltip: "You seek continuous learning and strong mentorship" },
  { key: "data_driven", label: "Data-driven / Metrics-first", icon: BarChart3, tooltip: "You prefer decisions backed by data and analytics" },
  { key: "design_driven", label: "Design-driven / UX-first", icon: Palette, tooltip: "You value great design and user experience" },
  { key: "diversity_inclusion", label: "Diversity & Inclusion emphasis", icon: Users2, tooltip: "You value diverse teams and inclusive practices" },
];

const CULTURE_PRESETS = [
  {
    key: "startup",
    label: "Startup (fast-paced)",
    attributes: ["fast_paced", "autonomous", "flat_hierarchy", "mission_driven"],
  },
  {
    key: "enterprise",
    label: "Enterprise (structured)",
    attributes: ["structured", "career_paths", "office_first", "data_driven"],
  },
  {
    key: "remote_first",
    label: "Remote-first",
    attributes: ["remote_first", "autonomous", "work_life_balance", "collaborative"],
  },
  {
    key: "hybrid",
    label: "Hybrid",
    attributes: ["office_first", "work_life_balance", "collaborative", "structured"],
  },
  {
    key: "mission_driven",
    label: "Mission-driven",
    attributes: ["mission_driven", "collaborative", "diversity_inclusion", "learning_focused"],
  },
  {
    key: "balanced",
    label: "Work–life balanced",
    attributes: ["work_life_balance", "structured", "career_paths", "collaborative"],
  },
];

const IMPORTANCE_LEVELS = [
  { value: 0, label: "Not selected" },
  { value: 1, label: "Nice-to-have" },
  { value: 2, label: "Important" },
  { value: 3, label: "Must-have" },
];

const initialUser: UserProfile = {
  name: "",
  email: "",
  profile_image: "",
  pronoun: "he/him",

  linkedin_url: "",
  github_url: "",
  twitter_url: "",
  other_social_link: "",
  show_contact_to_recruiters: true,
  allow_profile_downloads: true,
  profile_view_analytics: true,
  profile_visibility: "recruiters",
  headline: "",
  expected_min_salary: 2000000,
  expected_max_salary: 3500000,
  expected_salary_currency: "INR",
  nationality: "India",
  location: "Bangalore",
  phone: "",
  username: "",
  custom_profile_url: "",
  want_to_relocate: false,
  relocate_location: "",
  show_phone_number: false,
  work_preference: "hybrid",
  professional_summary: "",
  preffer_full_time: false,
  preffer_contract: false,
  preffer_internship: false,
  preffer_freelance: false,
  role: "user",
  website: "",

  // yearsOfExperience: 5,
  // currentCompany: "TechFlow Solutions",
  // currentTitle: "Senior Product Manager",
  // relocationRegions: [],
  // jobTypes: ["Full-time", "Contract"],
  // salaryVisible: false,
  // emailVerified: true,
  // phoneVisible: false,
  // resumeFile: "resume.pdf",
  // resumeLastUpdated: "Nov 20, 2024",
  // coverLetterTemplate: "",
  // mediaLinks: [],
};

export function ProfileEditorPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile>(initialUser);
  console.log("🚀 ~ ProfileEditorPage ~ profile:", profile);
  const [activeSection, setActiveSection] = useState<string>("identity");
  const [isDraft, setIsDraft] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewMode, setPreviewMode] = useState<"public" | "recruiter" | "self">("public");
  const [showImageCropper, setShowImageCropper] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);
  const [slugChecking, setSlugChecking] = useState(false);
  const [keywordHighlights, setKeywordHighlights] = useState<string[]>([]);
  const [readabilityScore, setReadabilityScore] = useState(0);
  const [showCulturePanel, setShowCulturePanel] = useState(false);
  const [cultureStatementChars, setCultureStatementChars] = useState(0);
  const [showDangerModal, setShowDangerModal] = useState(false);
  const [dangerAction, setDangerAction] = useState<string>("");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const resumeInputRef = useRef<HTMLInputElement>(null);

  const { data: user, isFetching } = useGetProfileQuery();
  const [updateProfile, { isLoading: isUpdating }] = useUpdateProfileMutation();

  useEffect(() => {
    if (user) {
      setProfile(user);
    }
  }, [user]);

  useEffect(() => {
    const autoSaveTimer = setTimeout(() => {
      if (isDraft) {
        handleAutoSave();
      }
    }, 10000); // 10 seconds

    return () => clearTimeout(autoSaveTimer);
  }, [profile, isDraft]);

  useEffect(() => {
    if (profile.professional_summary) {
      analyzeContent();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile.professional_summary]);

  const handleAutoSave = () => {
    setLastSaved(new Date());
    toast.success("Draft saved", {
      description: "Your changes have been automatically saved",
    });
  };

  const analyzeContent = () => {
    const words = profile.professional_summary
      .toLowerCase()
      .split(/\W+/)
      .filter((w) => w.length > 5);
    const frequency: { [key: string]: number } = {};
    words.forEach((word) => {
      frequency[word] = (frequency[word] || 0) + 1;
    });
    const topKeywords = Object.entries(frequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([word]) => word);
    setKeywordHighlights(topKeywords);

    // Mock readability score (0-100)
    const wordCount = words.length;
    const sentences = profile.professional_summary.split(/[.!?]+/).length;
    const avgWordsPerSentence = wordCount / sentences;
    const score = Math.min(100, Math.max(0, 100 - (avgWordsPerSentence - 15) * 5));
    setReadabilityScore(Math.round(score));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image too large", {
          description: "Please upload an image smaller than 5MB",
        });
        return;
      }
      if (!file.type.startsWith("image/")) {
        toast.error("Invalid file type", {
          description: "Please upload an image file",
        });
        return;
      }
      setImageFile(file);
      setShowImageCropper(true);

      // Mock: In real app, would show cropper modal
      const reader = new FileReader();
      reader.onload = (e) => {
        setProfile({ ...profile, profile_image: e.target?.result as string });
        setIsDraft(true);
        toast.success("Profile photo updated");
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSlugCheck = async (slug: string) => {
    setSlugChecking(true);
    // Mock API call
    setTimeout(() => {
      const taken = ["john-doe", "jane-smith", "alex-johnson"].includes(slug);
      setSlugAvailable(!taken);
      setSlugChecking(false);
    }, 500);
  };

  const handleAIRewriteSummary = async (targetRole: string) => {
    setAiLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const templates = [
      // `Experienced ${targetRole} with ${profile.yearsOfExperience}+ years driving product excellence and user growth. Led cross-functional teams to deliver innovative solutions that increased engagement by 40% and revenue by ₹2.5Cr. Expert in data-driven decision making, agile methodologies, and stakeholder management.`,
      // `Results-oriented ${targetRole} specializing in B2B/B2C product strategy and execution. Proven track record of building scalable solutions from 0 to 10K+ users. Passionate about leveraging AI/ML insights to create exceptional user experiences and drive business impact.`,
    ];

    setProfile({
      ...profile,
      professional_summary: templates[Math.floor(Math.random() * templates.length)],
    });
    setIsDraft(true);
    setAiLoading(false);
    toast.success("Summary rewritten with AI!");
  };

  const handleApplyTemplate = (template: keyof typeof SUMMARY_TEMPLATES) => {
    setProfile({
      ...profile,
      professional_summary: SUMMARY_TEMPLATES[template],
    });
    setIsDraft(true);
    toast.success("Template applied");
  };

  const handleAddMediaLink = () => {
    const newLink: MediaLink = {
      id: Date.now().toString(),
      type: "portfolio",
      title: "",
      url: "",
    };
    setProfile({
      ...profile,
      // mediaLinks: [...profile.mediaLinks, newLink],
    });
    setIsDraft(true);
  };

  const handleRemoveMediaLink = (id: string) => {
    setProfile({
      ...profile,
      // mediaLinks: profile.mediaLinks.filter((link) => link.id !== id),
    });
    setIsDraft(true);
  };

  const handleUpdateMediaLink = (id: string, field: keyof MediaLink, value: string) => {
    setProfile({
      ...profile,
      // mediaLinks: profile.mediaLinks.map((link) => (link.id === id ? { ...link, [field]: value } : link)),
    });
    setIsDraft(true);
  };

  const handleSaveProfile = async () => {
    try {
      await updateProfile(profile).unwrap();
      setLastSaved(new Date());
      toast.success("Profile published successfully!");
    } catch (error: any) {
      toast.error("Failed to save profile", {
        description: error?.data?.message || "An error occurred while saving your profile. Please try again.",
      });
      return;
    }

    setIsDraft(false);
    toast.success("Profile published successfully!");
  };

  const handleSaveDraft = () => {
    setIsDraft(false);
    setLastSaved(new Date());
    toast.success("Draft saved");
  };

  const handleDangerAction = (action: string) => {
    setDangerAction(action);
    setShowDangerModal(true);
  };

  const confirmDangerAction = () => {
    if (dangerAction === "remove-photo") {
      setProfile({ ...profile, profile_image: "" });
      toast.success("Profile photo removed");
    } else if (dangerAction === "public-visibility") {
      setProfile({ ...profile, profile_visibility: "public" });
      toast.success("Profile is now public");
    }
    setShowDangerModal(false);
    setDangerAction("");
    setIsDraft(true);
  };

  // Culture Preferences Helpers
  const handlePresetSelect = (presetKey: string) => {
    const preset = CULTURE_PRESETS.find((p) => p.key === presetKey);
    if (!preset) return;

    const newAttributes = preset.attributes.map((key) => ({
      key,
      importance: 2, // Default to "Important"
    }));

    setProfile({
      ...profile,
      // culturePreferences: {
      //   ...profile.culturePreferences,
      //   preset: presetKey,
      //   attributes: newAttributes,
      //   globalImportance: profile.culturePreferences?.globalImportance || 50,
      //   visibility: profile.culturePreferences?.visibility || { public: false, recruiters: false },
      // },
    });
    setIsDraft(true);
    toast.success("Preset applied", {
      description: `${preset.label} attributes selected. Adjust importance levels as needed.`,
    });
  };

  const handleAttributeToggle = (attributeKey: string) => {
    // const currentPrefs = profile.culturePreferences || {
    //   attributes: [],
    //   globalImportance: 50,
    //   visibility: { public: false, recruiters: false },
    // };
    // const existingIndex = currentPrefs.attributes.findIndex((a) => a.key === attributeKey);
    // let newAttributes;
    // if (existingIndex >= 0) {
    //   // Remove attribute
    //   newAttributes = currentPrefs.attributes.filter((a) => a.key !== attributeKey);
    // } else {
    //   // Add attribute with default importance
    //   newAttributes = [...currentPrefs.attributes, { key: attributeKey, importance: 2 }];
    // }
    // setProfile({
    //   ...profile,
    //   culturePreferences: {
    //     ...currentPrefs,
    //     attributes: newAttributes,
    //     updatedAt: new Date().toISOString(),
    //   },
    // });
    // setIsDraft(true);
  };

  const handleAttributeImportanceChange = (attributeKey: string, importance: number) => {
    // const currentPrefs = profile.culturePreferences;
    // if (!currentPrefs) return;
    // const newAttributes = currentPrefs.attributes.map((attr) => (attr.key === attributeKey ? { ...attr, importance } : attr));
    // setProfile({
    //   ...profile,
    //   culturePreferences: {
    //     ...currentPrefs,
    //     attributes: newAttributes,
    //     updatedAt: new Date().toISOString(),
    //   },
    // });
    // setIsDraft(true);
  };

  const handleCultureStatementChange = (statement: string) => {
    // if (statement.length > 140) return;
    // const currentPrefs = profile.culturePreferences || {
    //   attributes: [],
    //   globalImportance: 50,
    //   visibility: { public: false, recruiters: false },
    // };
    // setProfile({
    //   ...profile,
    //   culturePreferences: {
    //     ...currentPrefs,
    //     statement,
    //     updatedAt: new Date().toISOString(),
    //   },
    // });
    // setCultureStatementChars(statement.length);
    // setIsDraft(true);
  };

  const handleAIRewriteCultureStatement = async () => {
    // const currentStatement = profile.culturePreferences?.statement || "";
    // if (!currentStatement) {
    //   toast.error("Please write a statement first");
    //   return;
    // }
    // setAiLoading(true);
    // await new Promise((resolve) => setTimeout(resolve, 2000));
    // // Mock AI rewrite
    // const rewritten = currentStatement.length > 50 ? currentStatement.substring(0, 50) + "..." : "I thrive in collaborative environments that value rapid iteration and continuous learning.";
    // handleCultureStatementChange(rewritten);
    // setAiLoading(false);
    // toast.success("Statement rewritten by AI");
  };

  const sections = [
    { id: "identity", label: "Identity", icon: User },
    { id: "summary", label: "Headline & Summary", icon: FileText },
    { id: "location", label: "Location & Preferences", icon: MapPin },
    { id: "contact", label: "Contact & Social", icon: Mail },
    { id: "media", label: "Resume & Media", icon: Upload },
    { id: "visibility", label: "Visibility & Privacy", icon: Eye },
  ];

  return (
    <div className="min-h-screen relative">
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-neon-cyan/3 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/3 right-1/4 w-96 h-96 bg-neon-purple/3 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Button onClick={() => router.push("/")} variant="ghost" className="glass hover:glass-strong mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Profile
          </Button>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-r from-neon-cyan to-neon-purple flex items-center justify-center">
                <User className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold">
                  <span className="bg-gradient-to-r from-neon-cyan to-neon-purple bg-clip-text text-transparent">Edit Profile</span>
                </h1>
                <p className="text-muted-foreground mt-1 flex items-center gap-2">
                  {lastSaved && (
                    <>
                      <Clock className="h-4 w-4" />
                      Last saved: {lastSaved.toLocaleTimeString()}
                    </>
                  )}
                  {!lastSaved && "Make your profile stand out"}
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={handleSaveDraft} className="glass hover:glass-strong border-glass-border">
                <Save className="h-4 w-4 mr-2" />
                Save Draft
              </Button>
              <Button onClick={handleSaveProfile} className="bg-gradient-to-r from-neon-cyan to-neon-purple text-white hover:scale-105 transition-all">
                <Check className="h-4 w-4 mr-2" />
                Publish Changes
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <Card className="glass p-4 rounded-2xl border border-glass-border sticky top-8">
              <nav className="space-y-2">
                {sections.map((section) => {
                  const Icon = section.icon;
                  return (
                    <button
                      key={section.id}
                      onClick={() => setActiveSection(section.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                        activeSection === section.id ? "bg-gradient-to-r from-neon-cyan to-neon-purple text-white" : "text-muted-foreground hover:text-white hover:glass-strong"
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                      <span className="font-medium">{section.label}</span>
                    </button>
                  );
                })}
              </nav>

              <Separator className="my-4 bg-glass-border" />

              <div className="space-y-2">
                <Button variant="outline" size="sm" onClick={() => setShowPreview(true)} className="w-full glass hover:glass-strong border-glass-border">
                  <Eye className="h-4 w-4 mr-2" />
                  Preview Profile
                </Button>
              </div>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-8">
            {/* Section 1: Identity */}
            {activeSection === "identity" && (
              <Card className="glass p-8 rounded-2xl border border-glass-border">
                <div className="space-y-8">
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-2">Identity & Basic Info</h2>
                    <p className="text-muted-foreground">Your photo and basic professional details</p>
                  </div>

                  {/* Profile Photo */}
                  <div className="space-y-4">
                    <Label className="text-white">Profile Photo</Label>
                    <div className="flex items-start gap-6">
                      <div className="relative group">
                        <div className="w-32 h-32 rounded-full overflow-hidden ring-4 ring-neon-cyan/20 ring-offset-4 ring-offset-background">
                          {profile.profile_image ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={profile.profile_image} alt="Profile" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-r from-neon-cyan to-neon-purple flex items-center justify-center">
                              <User className="h-16 w-16 text-white" />
                            </div>
                          )}
                        </div>
                        <div className="absolute inset-0 rounded-full bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Camera className="h-8 w-8 text-white" />
                        </div>
                      </div>

                      <div className="flex-1 space-y-3">
                        <div className="flex gap-3">
                          <Button onClick={() => fileInputRef.current?.click()} className="glass hover:glass-strong border-neon-cyan/30 text-neon-cyan">
                            <Upload className="h-4 w-4 mr-2" />
                            Upload Photo
                          </Button>
                          {profile.profile_image && (
                            <Button variant="ghost" onClick={() => handleDangerAction("remove-photo")} className="text-destructive hover:text-destructive">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">JPG, PNG or GIF. Max 5MB. 1:1 ratio recommended.</p>
                        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                      </div>
                    </div>
                  </div>

                  <Separator className="bg-glass-border" />

                  {/* Basic Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-white">
                        Full Name <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="name"
                        value={profile.name}
                        onChange={(e) => {
                          setProfile({ ...profile, name: e.target.value });
                          setIsDraft(true);
                        }}
                        placeholder="Alex Johnson"
                        className="glass border-glass-border focus:border-neon-cyan"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="username" className="text-white">
                        Username
                      </Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">@</span>
                        <Input
                          id="username"
                          value={profile.username}
                          onChange={(e) => {
                            // Username validation: lowercase, alphanumeric, underscores, hyphens
                            const value = e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, "");
                            setProfile({ ...profile, username: value });
                            setIsDraft(true);
                          }}
                          placeholder="username"
                          className="glass border-glass-border focus:border-neon-cyan pl-8"
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">Your unique username for your Qelsa profile URL</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="pronoun" className="text-white">
                        Pronouns
                      </Label>
                      <select
                        id="pronoun"
                        value={profile.pronoun}
                        onChange={(e) => {
                          setProfile({ ...profile, pronoun: e.target.value });
                          setIsDraft(true);
                        }}
                        className="w-full glass border border-glass-border rounded-lg px-3 py-2 focus:border-neon-cyan focus:outline-none bg-transparent text-white"
                      >
                        <option value="" className="bg-gray-900">
                          Select...
                        </option>
                        <option value="he/him" className="bg-gray-900">
                          he/him
                        </option>
                        <option value="she/her" className="bg-gray-900">
                          she/her
                        </option>
                        <option value="they/them" className="bg-gray-900">
                          they/them
                        </option>
                        <option value="other" className="bg-gray-900">
                          Other
                        </option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="headline" className="text-white">
                        Professional Headline <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="headline"
                        value={profile.headline}
                        onChange={(e) => {
                          if (e.target.value.length <= 120) {
                            setProfile({ ...profile, headline: e.target.value });
                            setIsDraft(true);
                          }
                        }}
                        placeholder="Senior Product Manager"
                        className="glass border-glass-border focus:border-neon-cyan"
                      />
                      <p className="text-xs text-muted-foreground">{profile.headline?.length || 0}/120 characters</p>
                    </div>
                  </div>

                  {/* Current Role */}
                  <div className="p-4 glass rounded-xl space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-white">Current Position</Label>
                      <Button variant="link" size="sm" className="text-neon-cyan hover:text-neon-cyan" onClick={() => router.push("/profile/work-experience")}>
                        Manage Work Experience
                        <ArrowLeft className="h-4 w-4 ml-2 rotate-180" />
                      </Button>
                    </div>

                    {/* {work_experiences.filter((exp) => exp.isPresent).length > 0 ? (
                      <div className="space-y-3">
                        <Label htmlFor="currentPosition" className="text-white/80 text-sm">
                          Select from your current positions
                        </Label>
                        <select
                          id="currentPosition"
                          value={`${profile.currentTitle}|${profile.currentCompany}`}
                          onChange={(e) => {
                            if (e.target.value === "custom") {
                              setProfile({ ...profile, currentTitle: "", currentCompany: "" });
                            } else {
                              const [title, company] = e.target.value.split("|");
                              setProfile({ ...profile, currentTitle: title, currentCompany: company });
                            }
                            setIsDraft(true);
                          }}
                          className="w-full px-4 py-3 rounded-xl glass border border-glass-border focus:border-neon-cyan focus:outline-none focus:ring-2 focus:ring-neon-cyan/20 text-white bg-background/50"
                        >
                          <option value="custom" className="bg-background text-white">
                            Custom Position
                          </option>
                          {work_experiences
                            .filter((exp) => exp.isPresent)
                            .map((exp) => (
                              <option key={exp.id} value={`${exp.title}|${exp.company}`} className="bg-background text-white">
                                {exp.title} at {exp.company}
                              </option>
                            ))}
                        </select>

                        {profile.currentTitle && profile.currentCompany && (
                          <div className="p-3 glass rounded-lg border border-neon-cyan/30">
                            <div className="flex items-start gap-3">
                              <Briefcase className="h-5 w-5 text-neon-cyan mt-0.5" />
                              <div>
                                <p className="text-white font-medium">{profile.currentTitle}</p>
                                <p className="text-sm text-white/60">{profile.currentCompany}</p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="p-4 glass rounded-lg border border-yellow-500/30 bg-yellow-500/5">
                          <div className="flex items-start gap-3">
                            <AlertCircle className="h-5 w-5 text-yellow-500 mt-0.5" />
                            <div>
                              <p className="text-yellow-500 font-medium text-sm">No current positions found</p>
                              <p className="text-white/60 text-xs mt-1">Add your current work experience first, then select it here</p>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                          <div className="space-y-2">
                            <Label htmlFor="manualTitle" className="text-white/80 text-sm">
                              Current Title
                            </Label>
                            <Input
                              id="manualTitle"
                              value={profile.currentTitle}
                              onChange={(e) => {
                                setProfile({ ...profile, currentTitle: e.target.value });
                                setIsDraft(true);
                              }}
                              placeholder="e.g. Senior Product Manager"
                              className="glass border-glass-border focus:border-neon-cyan"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="manualCompany" className="text-white/80 text-sm">
                              Current Company
                            </Label>
                            <Input
                              id="manualCompany"
                              value={profile.currentCompany}
                              onChange={(e) => {
                                setProfile({ ...profile, currentCompany: e.target.value });
                                setIsDraft(true);
                              }}
                              placeholder="e.g. TechFlow Solutions"
                              className="glass border-glass-border focus:border-neon-cyan"
                            />
                          </div>
                        </div>
                      </div>
                    )} */}
                  </div>
                </div>
              </Card>
            )}

            {/* Section 2: Headline & Summary */}
            {activeSection === "summary" && (
              <Card className="glass p-8 rounded-2xl border border-glass-border">
                <div className="space-y-8">
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-2">Headline & Professional Summary</h2>
                    <p className="text-muted-foreground">Tell your professional story with impact</p>
                  </div>

                  {/* Quick Templates */}
                  <div className="space-y-3">
                    <Label className="text-white">Quick Framing Templates</Label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {Object.keys(SUMMARY_TEMPLATES).map((template) => (
                        <Button
                          key={template}
                          variant="outline"
                          onClick={() => handleApplyTemplate(template as keyof typeof SUMMARY_TEMPLATES)}
                          className="glass hover:glass-strong border-glass-border hover:border-neon-cyan justify-start h-auto py-3"
                        >
                          <div className="text-left">
                            <div className="font-medium text-white capitalize">{template}</div>
                            <div className="text-xs text-muted-foreground mt-1">
                              {template === "concise" && "Brief & to the point"}
                              {template === "achievement" && "Focus on results"}
                              {template === "story" && "Narrative approach"}
                            </div>
                          </div>
                        </Button>
                      ))}
                    </div>
                  </div>

                  <Separator className="bg-glass-border" />

                  {/* Summary Editor */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-white">Professional Summary</Label>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className={`${
                            readabilityScore >= 70 ? "border-neon-green text-neon-green" : readabilityScore >= 50 ? "border-yellow-500 text-yellow-500" : "border-destructive text-destructive"
                          }`}
                        >
                          Readability: {readabilityScore}%
                        </Badge>
                        <Badge variant="outline" className="border-neon-cyan text-neon-cyan">
                          {profile.professional_summary?.length || 0}/1000 chars
                        </Badge>
                      </div>
                    </div>

                    <Textarea
                      value={profile.professional_summary}
                      onChange={(e) => {
                        if (e.target.value.length <= 1000) {
                          setProfile({ ...profile, professional_summary: e.target.value });
                          setIsDraft(true);
                        }
                      }}
                      placeholder="Write a compelling summary of your professional experience, skills, and achievements..."
                      rows={8}
                      className="glass border-glass-border focus:border-neon-cyan"
                    />

                    {/* Keyword Highlights */}
                    {keywordHighlights.length > 0 && (
                      <div className="p-4 glass rounded-xl">
                        <div className="flex items-center gap-2 mb-3">
                          <Target className="h-4 w-4 text-neon-purple" />
                          <span className="text-sm font-medium text-white">Top Keywords</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {keywordHighlights.map((keyword, idx) => (
                            <Badge key={idx} variant="outline" className="border-neon-purple/30 text-neon-purple">
                              {keyword}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <Separator className="bg-glass-border" />

                  {/* AI Rewrite */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-neon-pink" />
                      <Label className="text-white">AI-Powered Rewrite</Label>
                    </div>
                    <div className="p-6 glass rounded-xl border border-neon-pink/20">
                      <p className="text-sm text-muted-foreground mb-4">Select your target role and let AI optimize your summary for maximum impact</p>
                      <div className="flex flex-wrap gap-3">
                        {TARGET_ROLES.map((role) => (
                          <Button
                            key={role}
                            onClick={() => handleAIRewriteSummary(role)}
                            disabled={aiLoading}
                            className="glass hover:glass-strong border border-neon-pink/30 text-neon-pink hover:text-neon-pink"
                          >
                            {aiLoading ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Rewriting...
                              </>
                            ) : (
                              <>
                                <Sparkles className="h-4 w-4 mr-2" />
                                {role}
                              </>
                            )}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {/* Section 3: Location & Preferences */}
            {activeSection === "location" && (
              <Card className="glass p-8 rounded-2xl border border-glass-border">
                <div className="space-y-8">
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-2">Location & Job Preferences</h2>
                    <p className="text-muted-foreground">Help us match you with the right opportunities</p>
                  </div>

                  {/* Location */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="city" className="text-white">
                        City <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="city"
                        value={profile.city}
                        onChange={(e) => {
                          setProfile({ ...profile, city: e.target.value });
                          setIsDraft(true);
                        }}
                        placeholder="Bangalore"
                        className="glass border-glass-border focus:border-neon-cyan"
                      />
                    </div>
                  </div>

                  {/* Remote Preference */}
                  <div className="space-y-3">
                    <Label className="text-white">Work Preference</Label>
                    <div className="grid grid-cols-3 gap-3">
                      {REMOTE_PREFERENCES.map((pref) => (
                        <button
                          key={pref.value}
                          onClick={() => {
                            setProfile({ ...profile, work_preference: pref.value as any });
                            setIsDraft(true);
                          }}
                          className={`p-4 rounded-xl border-2 transition-all ${
                            profile.work_preference === pref.value ? "border-neon-cyan bg-neon-cyan/10 text-neon-cyan" : "border-glass-border glass hover:glass-strong text-muted-foreground"
                          }`}
                        >
                          <div className="font-medium">{pref.label}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <Separator className="bg-glass-border" />

                  {/* Relocation */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-white">Willing to Relocate?</Label>
                      <button
                        onClick={() => {
                          setProfile({ ...profile, want_to_relocate: !profile.want_to_relocate });
                          setIsDraft(true);
                        }}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${profile.want_to_relocate ? "bg-neon-cyan" : "bg-glass-border"}`}
                      >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${profile.want_to_relocate ? "translate-x-6" : "translate-x-1"}`} />
                      </button>
                    </div>

                    {profile.want_to_relocate && (
                      <Input
                        value={profile.relocate_location}
                        onChange={(e) => {
                          setProfile({
                            ...profile,
                            relocate_location: e.target.value,
                          });
                          setIsDraft(true);
                        }}
                        placeholder="e.g., USA, Europe, Singapore"
                        className="glass border-glass-border focus:border-neon-cyan"
                      />
                    )}
                  </div>

                  {/* Job Types */}
                  <div className="space-y-3">
                    <Label className="text-white">Job Type Preferences</Label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {JOB_TYPES.map((type) => (
                        <button
                          key={type.label}
                          onClick={() => {
                            const current_value = profile[type.value];
                            setProfile({ ...profile, [type.value]: !current_value });
                            setIsDraft(true);
                          }}
                          className={`p-3 rounded-xl border-2 transition-all text-sm ${
                            profile[type.value] ? "border-neon-purple bg-neon-purple/10 text-neon-purple" : "border-glass-border glass hover:glass-strong text-muted-foreground"
                          }`}
                        >
                          {type.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <Separator className="bg-glass-border" />

                  {/* Salary Expectations */}
                  <div className="space-y-4">
                    {/* <div className="flex items-center justify-between">
                      <Label className="text-white">Salary Expectations (Optional)</Label>
                      <button
                        onClick={() => {
                          setProfile({ ...profile, salaryVisible: !profile.salaryVisible });
                          setIsDraft(true);
                        }}
                        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-white transition-colors"
                      >
                        {profile.salaryVisible ? (
                          <>
                            <Eye className="h-4 w-4" />
                            Visible
                          </>
                        ) : (
                          <>
                            <EyeOff className="h-4 w-4" />
                            Hidden
                          </>
                        )}
                      </button>
                    </div> */}

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label className="text-muted-foreground text-sm">Currency</Label>
                        <select
                          value={profile.expected_salary_currency}
                          onChange={(e) => {
                            setProfile({ ...profile, expected_salary_currency: e.target.value });
                            setIsDraft(true);
                          }}
                          className="w-full glass border border-glass-border rounded-lg px-3 py-2 focus:border-neon-cyan focus:outline-none bg-transparent text-white"
                        >
                          {CURRENCIES.map((currency) => (
                            <option key={currency} value={currency} className="bg-gray-900">
                              {currency}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-muted-foreground text-sm">Minimum</Label>
                        <Input
                          type="number"
                          value={profile.expected_min_salary}
                          onChange={(e) => {
                            setProfile({ ...profile, expected_min_salary: parseInt(e.target.value) || 0 });
                            setIsDraft(true);
                          }}
                          placeholder="Min"
                          className="glass border-glass-border focus:border-neon-cyan"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-muted-foreground text-sm">Maximum</Label>
                        <Input
                          type="number"
                          value={profile.expected_max_salary}
                          onChange={(e) => {
                            setProfile({ ...profile, expected_max_salary: parseInt(e.target.value) || 0 });
                            setIsDraft(true);
                          }}
                          placeholder="Max"
                          className="glass border-glass-border focus:border-neon-cyan"
                        />
                      </div>
                    </div>
                  </div>

                  <Separator className="bg-glass-border" />

                  {/* Cultural Preferences */}
                  <div className="space-y-4">
                    <button
                      onClick={() => setShowCulturePanel(!showCulturePanel)}
                      className="w-full flex items-center justify-between p-4 glass-strong rounded-xl border-2 border-glass-border hover:border-neon-purple/30 transition-all group"
                    >
                      <div className="flex items-center gap-3">
                        <Heart className="h-5 w-5 text-neon-purple" />
                        <div className="text-left">
                          <h3 className="font-semibold text-white">Cultural Preferences</h3>
                          <p className="text-sm text-muted-foreground">Match with companies that share your way of working</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {/* {profile.culturePreferences?.attributes && profile.culturePreferences.attributes.length > 0 && (
                          <Badge className="bg-neon-purple/20 text-neon-purple border-neon-purple/30">{profile.culturePreferences.attributes.length} selected</Badge>
                        )} */}
                        <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform ${showCulturePanel ? "rotate-180" : ""}`} />
                      </div>
                    </button>

                    {showCulturePanel && (
                      <div className="space-y-6 p-6 glass rounded-xl border border-glass-border">
                        {/* Preset Selection */}
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <Label className="text-white">Quick Presets</Label>
                            <button className="group relative">
                              <Info className="h-4 w-4 text-muted-foreground hover:text-white" />
                              <span className="absolute hidden group-hover:block bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 text-xs bg-gray-900 border border-glass-border rounded-lg whitespace-nowrap z-10">
                                Not sure? Pick a preset and tweak attributes
                              </span>
                            </button>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {CULTURE_PRESETS.map((preset) => (
                              <button
                                key={preset.key}
                                onClick={() => handlePresetSelect(preset.key)}
                                // className={`px-4 py-2 rounded-full text-sm border-2 transition-all ${
                                //   profile.culturePreferences?.preset === preset.key
                                //     ? "border-neon-purple bg-neon-purple/20 text-neon-purple"
                                //     : "border-glass-border glass hover:glass-strong text-muted-foreground hover:text-white"
                                // }`}
                              >
                                {preset.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        <Separator className="bg-glass-border" />

                        {/* Attribute Grid */}
                        {/* <div className="space-y-3">
                          <Label className="text-white">Culture Attributes</Label>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {CULTURE_ATTRIBUTES.map((attribute) => {
                              const Icon = attribute.icon;
                              const isSelected = profile.culturePreferences?.attributes?.some((a) => a.key === attribute.key);
                              const currentAttribute = profile.culturePreferences?.attributes?.find((a) => a.key === attribute.key);

                              return (
                                <div key={attribute.key} className="space-y-2">
                                  <button
                                    onClick={() => handleAttributeToggle(attribute.key)}
                                    className={`w-full p-3 rounded-xl border-2 transition-all text-left group relative ${
                                      isSelected ? "border-neon-cyan bg-neon-cyan/10 text-neon-cyan" : "border-glass-border glass hover:glass-strong text-muted-foreground hover:text-white"
                                    }`}
                                  >
                                    <div className="flex items-center gap-3">
                                      <Icon className="h-4 w-4 flex-shrink-0" />
                                      <span className="text-sm font-medium">{attribute.label}</span>
                                      {isSelected && <Check className="h-4 w-4 ml-auto" />}
                                    </div>

                                    <span className="absolute hidden group-hover:block bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 text-xs bg-gray-900 border border-glass-border rounded-lg whitespace-normal max-w-xs z-10 text-white">
                                      {attribute.tooltip}
                                    </span>
                                  </button>

                                  {isSelected && (
                                    <div className="pl-3">
                                      <select
                                        value={currentAttribute?.importance || 2}
                                        onChange={(e) => handleAttributeImportanceChange(attribute.key, parseInt(e.target.value))}
                                        className="w-full text-xs glass border border-glass-border rounded-lg px-2 py-1 focus:border-neon-cyan focus:outline-none bg-transparent text-white"
                                      >
                                        {IMPORTANCE_LEVELS.filter((l) => l.value > 0).map((level) => (
                                          <option key={level.value} value={level.value} className="bg-gray-900">
                                            {level.label}
                                          </option>
                                        ))}
                                      </select>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div> */}

                        <Separator className="bg-glass-border" />

                        {/* Global Importance Slider */}
                        {/* <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <Label className="text-white">Overall Importance in Job Matching</Label>
                            <span className="text-sm font-semibold text-neon-cyan">{profile.culturePreferences?.globalImportance || 50}%</span>
                          </div>
                          <Slider
                            value={[profile.culturePreferences?.globalImportance || 50]}
                            onValueChange={(value) => {
                              const currentPrefs = profile.culturePreferences || {
                                attributes: [],
                                globalImportance: 50,
                                visibility: { public: false, recruiters: false },
                              };
                              setProfile({
                                ...profile,
                                culturePreferences: {
                                  ...currentPrefs,
                                  globalImportance: value[0],
                                  updatedAt: new Date().toISOString(),
                                },
                              });
                              setIsDraft(true);
                            }}
                            max={100}
                            step={10}
                            className="w-full"
                          />
                          <p className="text-xs text-muted-foreground">This controls how much culture fit affects your job recommendations</p>
                        </div> */}

                        <Separator className="bg-glass-border" />

                        {/* Culture Statement */}
                        {/* <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <Label className="text-white">Culture Statement (Optional)</Label>
                            <span className="text-xs text-muted-foreground">{profile.culturePreferences?.statement?.length || 0}/140</span>
                          </div>
                          <Textarea
                            value={profile.culturePreferences?.statement || ""}
                            onChange={(e) => handleCultureStatementChange(e.target.value)}
                            placeholder="I thrive in small, cross-functional teams with rapid iteration cycles..."
                            maxLength={140}
                            rows={3}
                            className="glass border-glass-border focus:border-neon-cyan resize-none"
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleAIRewriteCultureStatement}
                            disabled={aiLoading || !profile.culturePreferences?.statement}
                            className="border-neon-purple/30 text-neon-purple hover:bg-neon-purple/10"
                          >
                            {aiLoading ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Rewriting...
                              </>
                            ) : (
                              <>
                                <Sparkles className="h-4 w-4 mr-2" />
                                AI Rewrite
                              </>
                            )}
                          </Button>
                        </div> */}

                        <Separator className="bg-glass-border" />

                        {/* Visibility Toggle */}
                        {/* <div className="space-y-4">
                          <Label className="text-white">Visibility</Label>

                          <div className="space-y-3">
                            <div className="flex items-center justify-between p-3 glass-strong rounded-lg">
                              <div className="flex items-center gap-3">
                                <Eye className="h-4 w-4 text-muted-foreground" />
                                <div>
                                  <p className="text-sm font-medium text-white">Show to Recruiters</p>
                                  <p className="text-xs text-muted-foreground">Let recruiters see your culture preferences</p>
                                </div>
                              </div>
                              <button
                                onClick={() => {
                                  const currentPrefs = profile.culturePreferences || {
                                    attributes: [],
                                    globalImportance: 50,
                                    visibility: { public: false, recruiters: false },
                                  };
                                  setProfile({
                                    ...profile,
                                    culturePreferences: {
                                      ...currentPrefs,
                                      visibility: {
                                        ...currentPrefs.visibility,
                                        recruiters: !currentPrefs.visibility.recruiters,
                                      },
                                      updatedAt: new Date().toISOString(),
                                    },
                                  });
                                  setIsDraft(true);
                                }}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                  profile.culturePreferences?.visibility?.recruiters ? "bg-neon-cyan" : "bg-glass-border"
                                }`}
                              >
                                <span
                                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                    profile.culturePreferences?.visibility?.recruiters ? "translate-x-6" : "translate-x-1"
                                  }`}
                                />
                              </button>
                            </div>
                          </div>

                          <div className="p-3 glass rounded-lg border border-neon-yellow/20">
                            <div className="flex items-start gap-2">
                              <Lock className="h-4 w-4 text-neon-yellow flex-shrink-0 mt-0.5" />
                              <p className="text-xs text-muted-foreground">Your preferences are always used for job matching, regardless of visibility settings. Privacy is our priority.</p>
                            </div>
                          </div>
                        </div> */}

                        {/* Preview Card */}
                        {/* {profile.culturePreferences?.attributes && profile.culturePreferences.attributes.length > 0 && (
                          <>
                            <Separator className="bg-glass-border" />
                            <div className="space-y-3">
                              <Label className="text-white">How this looks to employers</Label>
                              <div className="p-4 glass-strong rounded-xl border border-glass-border">
                                <div className="flex items-center gap-2 mb-3">
                                  <Heart className="h-4 w-4 text-neon-purple" />
                                  <span className="text-sm font-semibold text-white">Culture Preferences</span>
                                </div>
                                <div className="flex flex-wrap gap-2 mb-3">
                                  {profile.culturePreferences.attributes
                                    .filter((attr) => attr.importance > 0)
                                    .sort((a, b) => b.importance - a.importance)
                                    .map((attr) => {
                                      const attribute = CULTURE_ATTRIBUTES.find((a) => a.key === attr.key);
                                      if (!attribute) return null;
                                      const importanceLabel = IMPORTANCE_LEVELS.find((l) => l.value === attr.importance)?.label;

                                      return (
                                        <Badge
                                          key={attr.key}
                                          variant="outline"
                                          className={`text-xs ${
                                            attr.importance === 3
                                              ? "border-neon-green/30 text-neon-green bg-neon-green/10"
                                              : attr.importance === 2
                                              ? "border-neon-cyan/30 text-neon-cyan bg-neon-cyan/10"
                                              : "border-neon-purple/30 text-neon-purple bg-neon-purple/10"
                                          }`}
                                        >
                                          {attribute.label} • {importanceLabel}
                                        </Badge>
                                      );
                                    })}
                                </div>
                                {profile.culturePreferences.statement && <p className="text-sm text-muted-foreground italic">"{profile.culturePreferences.statement}"</p>}
                              </div>
                            </div>
                          </>
                        )} */}
                      </div>
                    )}
                  </div>

                  {/* Smart Suggestions */}
                  <div className="p-4 glass rounded-xl border border-neon-green/20">
                    <div className="flex items-start gap-3">
                      <Zap className="h-5 w-5 text-neon-green flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-white mb-2">Smart Job Matches</h4>
                        <p className="text-sm text-muted-foreground">
                          Based on your location and preferences, we found <strong className="text-neon-cyan">247 matching jobs</strong> in Bangalore with Remote/Hybrid options.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {/* Section 4: Contact & Social */}
            {activeSection === "contact" && (
              <Card className="glass p-8 rounded-2xl border border-glass-border">
                <div className="space-y-8">
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-2">Contact & Social Links</h2>
                    <p className="text-muted-foreground">How others can reach you</p>
                  </div>

                  {/* Email & Phone */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="email" className="text-white">
                          Email <span className="text-destructive">*</span>
                        </Label>
                        {/* {profile.emailVerified && (
                          <Badge className="bg-neon-green/20 text-neon-green border-neon-green/30">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Verified
                          </Badge>
                        )} */}
                      </div>
                      <Input
                        id="email"
                        type="email"
                        value={profile.email}
                        onChange={(e) => {
                          setProfile({ ...profile, email: e.target.value });
                          setIsDraft(true);
                        }}
                        placeholder="alex@example.com"
                        className="glass border-glass-border focus:border-neon-cyan"
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="phone" className="text-white">
                          Phone
                        </Label>
                        <button
                          onClick={() => {
                            setProfile({ ...profile, show_phone_number: !profile.show_phone_number });
                            setIsDraft(true);
                          }}
                          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-white transition-colors"
                        >
                          {profile.show_phone_number ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                          {profile.show_phone_number ? "Visible" : "Hidden"}
                        </button>
                      </div>
                      <Input
                        id="phone"
                        type="tel"
                        value={profile.phone}
                        onChange={(e) => {
                          setProfile({ ...profile, phone: e.target.value });
                          setIsDraft(true);
                        }}
                        placeholder="+91 98765 43210"
                        className="glass border-glass-border focus:border-neon-cyan"
                      />
                    </div>
                  </div>

                  <Separator className="bg-glass-border" />

                  {/* Website */}
                  <div className="space-y-2">
                    <Label htmlFor="website" className="text-white flex items-center gap-2">
                      <Globe className="h-4 w-4" />
                      Website / Portfolio
                    </Label>
                    <Input
                      id="website"
                      type="url"
                      value={profile.website}
                      onChange={(e) => {
                        setProfile({ ...profile, website: e.target.value });
                        setIsDraft(true);
                      }}
                      placeholder="https://alexjohnson.com"
                      className="glass border-glass-border focus:border-neon-cyan"
                    />
                  </div>

                  {/* Social Links */}
                  <div className="space-y-4">
                    <Label className="text-white">Social Profiles</Label>

                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-[#0077B5] flex items-center justify-center flex-shrink-0">
                          <Linkedin className="h-5 w-5 text-white" />
                        </div>
                        <Input
                          value={profile.linkedin_url}
                          onChange={(e) => {
                            setProfile({ ...profile, linkedin_url: e.target.value });
                            setIsDraft(true);
                          }}
                          placeholder="https://linkedin.com/in/alexjohnson"
                          className="glass border-glass-border focus:border-neon-cyan"
                        />
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-[#333] flex items-center justify-center flex-shrink-0">
                          <Github className="h-5 w-5 text-white" />
                        </div>
                        <Input
                          value={profile.github_url}
                          onChange={(e) => {
                            setProfile({ ...profile, github_url: e.target.value });
                            setIsDraft(true);
                          }}
                          placeholder="https://github.com/alexjohnson"
                          className="glass border-glass-border focus:border-neon-cyan"
                        />
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-[#1DA1F2] flex items-center justify-center flex-shrink-0">
                          <Twitter className="h-5 w-5 text-white" />
                        </div>
                        <Input
                          value={profile.twitter_url}
                          onChange={(e) => {
                            setProfile({ ...profile, twitter_url: e.target.value });
                            setIsDraft(true);
                          }}
                          placeholder="https://twitter.com/alexjohnson"
                          className="glass border-glass-border focus:border-neon-cyan"
                        />
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-neon-cyan to-neon-purple flex items-center justify-center flex-shrink-0">
                          <LinkIcon className="h-5 w-5 text-white" />
                        </div>
                        <Input
                          value={profile.other_social_link}
                          onChange={(e) => {
                            setProfile({ ...profile, other_social_link: e.target.value });
                            setIsDraft(true);
                          }}
                          placeholder="https://angel.co/alexjohnson"
                          className="glass border-glass-border focus:border-neon-cyan"
                        />
                      </div>
                    </div>
                  </div>

                  <Separator className="bg-glass-border" />

                  {/* Custom Profile URL */}
                  <div className="space-y-2">
                    <Label htmlFor="custom_profile_url" className="text-white">
                      Custom Profile URL
                    </Label>
                    <div className="flex gap-3">
                      <div className="flex-1 flex items-center glass rounded-lg border border-glass-border focus-within:border-neon-cyan">
                        <span className="px-3 text-muted-foreground">qelsa.com/</span>
                        <Input
                          id="custom_profile_url"
                          value={profile.custom_profile_url}
                          onChange={(e) => {
                            const slug = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "");
                            setProfile({ ...profile, custom_profile_url: slug });
                            setIsDraft(true);
                            if (slug.length >= 3) {
                              handleSlugCheck(slug);
                            }
                          }}
                          placeholder="alexjohnson"
                          className="border-0 bg-transparent focus:ring-0"
                        />
                      </div>
                      {slugChecking && <Loader2 className="h-10 w-10 p-2 animate-spin text-muted-foreground" />}
                      {!slugChecking && slugAvailable === true && (
                        <div className="h-10 w-10 rounded-lg bg-neon-green/20 flex items-center justify-center">
                          <CheckCircle className="h-5 w-5 text-neon-green" />
                        </div>
                      )}
                      {!slugChecking && slugAvailable === false && (
                        <div className="h-10 w-10 rounded-lg bg-destructive/20 flex items-center justify-center">
                          <XCircle className="h-5 w-5 text-destructive" />
                        </div>
                      )}
                    </div>
                    {slugAvailable === false && <p className="text-sm text-destructive">This URL is already taken</p>}
                    {slugAvailable === true && <p className="text-sm text-neon-green">This URL is available!</p>}
                  </div>
                </div>
              </Card>
            )}

            {/* Section 5: Resume & Media */}
            {activeSection === "media" && (
              <Card className="glass p-8 rounded-2xl border border-glass-border">
                <div className="space-y-8">
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-2">Resume & Media</h2>
                    <p className="text-muted-foreground">Showcase your work and credentials</p>
                  </div>

                  {/* Resume Upload */}
                  <div className="space-y-4">
                    <Label className="text-white flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Resume
                    </Label>

                    {/* {profile.resumeFile ? (
                      <div className="p-6 glass rounded-xl border border-neon-cyan/30">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-neon-cyan to-neon-purple flex items-center justify-center">
                            <FileText className="h-6 w-6 text-white" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium text-white">resume.pdf</h4>
                            <p className="text-sm text-muted-foreground">Last updated: {profile.resumeLastUpdated}</p>
                          </div>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" className="glass hover:glass-strong">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="sm" className="glass hover:glass-strong" onClick={() => resumeInputRef.current?.click()}>
                              <RefreshCw className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => resumeInputRef.current?.click()}
                        className="w-full p-8 glass rounded-xl border-2 border-dashed border-glass-border hover:border-neon-cyan transition-all group"
                      >
                        <div className="flex flex-col items-center gap-3">
                          <div className="w-16 h-16 rounded-full bg-glass-bg group-hover:bg-neon-cyan/10 flex items-center justify-center transition-colors">
                            <Upload className="h-8 w-8 text-neon-cyan" />
                          </div>
                          <div>
                            <p className="font-medium text-white mb-1">Upload Resume</p>
                            <p className="text-sm text-muted-foreground">PDF or DOCX, max 5MB</p>
                          </div>
                        </div>
                      </button>
                    )} */}

                    <input ref={resumeInputRef} type="file" accept=".pdf,.doc,.docx" className="hidden" />
                  </div>

                  {/* Regenerate Resume */}
                  <div className="p-4 glass rounded-xl border border-neon-purple/20">
                    <div className="flex items-start gap-3">
                      <Sparkles className="h-5 w-5 text-neon-purple flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <h4 className="font-medium text-white mb-2">AI Resume Generator</h4>
                        <p className="text-sm text-muted-foreground mb-3">Generate a professional resume from your profile data using AI</p>
                        <Button variant="outline" size="sm" className="glass hover:glass-strong border-neon-purple/30 text-neon-purple">
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Generate Resume
                        </Button>
                      </div>
                    </div>
                  </div>

                  <Separator className="bg-glass-border" />

                  {/* Media Links */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-white">Portfolio & Media</Label>
                      <Button onClick={handleAddMediaLink} variant="outline" size="sm" className="glass hover:glass-strong border-neon-cyan/30 text-neon-cyan">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Link
                      </Button>
                    </div>

                    <div className="space-y-3">
                      {/* {profile.mediaLinks.map((link) => (
                        <Card key={link.id} className="glass p-4">
                          <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                            <div className="md:col-span-3">
                              <select
                                value={link.type}
                                onChange={(e) => handleUpdateMediaLink(link.id, "type", e.target.value)}
                                className="w-full glass border border-glass-border rounded-lg px-3 py-2 focus:border-neon-cyan focus:outline-none bg-transparent text-white text-sm"
                              >
                                <option value="portfolio" className="bg-gray-900">
                                  Portfolio
                                </option>
                                <option value="slides" className="bg-gray-900">
                                  Slides
                                </option>
                                <option value="video" className="bg-gray-900">
                                  Video
                                </option>
                                <option value="certificate" className="bg-gray-900">
                                  Certificate
                                </option>
                              </select>
                            </div>
                            <div className="md:col-span-4">
                              <Input
                                value={link.title}
                                onChange={(e) => handleUpdateMediaLink(link.id, "title", e.target.value)}
                                placeholder="Title"
                                className="glass border-glass-border focus:border-neon-cyan"
                              />
                            </div>
                            <div className="md:col-span-4">
                              <Input
                                value={link.url}
                                onChange={(e) => handleUpdateMediaLink(link.id, "url", e.target.value)}
                                placeholder="https://..."
                                className="glass border-glass-border focus:border-neon-cyan"
                              />
                            </div>
                            <div className="md:col-span-1 flex items-center justify-center">
                              <Button variant="ghost" size="icon" onClick={() => handleRemoveMediaLink(link.id)} className="text-destructive hover:text-destructive">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </Card>
                      ))} */}
                    </div>

                    {/* {profile.mediaLinks.length === 0 && <p className="text-center text-muted-foreground text-sm py-8">No media links added yet. Click "Add Link" to showcase your work.</p>} */}
                  </div>
                </div>
              </Card>
            )}

            {/* Section 6: Visibility & Privacy */}
            {activeSection === "visibility" && (
              <Card className="glass p-8 rounded-2xl border border-glass-border">
                <div className="space-y-8">
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-2">Visibility & Privacy</h2>
                    <p className="text-muted-foreground">Control who can see your profile</p>
                  </div>

                  {/* Profile Visibility */}
                  <div className="space-y-4">
                    <Label className="text-white">Profile Visibility</Label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <button
                        onClick={() => handleDangerAction("public-visibility")}
                        className={`p-6 rounded-xl border-2 transition-all ${
                          profile.profile_visibility === "public" ? "border-neon-green bg-neon-green/10" : "border-glass-border glass hover:glass-strong"
                        }`}
                      >
                        <Unlock className="h-8 w-8 mb-3 mx-auto text-neon-green" />
                        <h4 className="font-medium text-white mb-1">Public</h4>
                        <p className="text-sm text-muted-foreground">Visible to everyone</p>
                      </button>

                      <button
                        onClick={() => {
                          setProfile({ ...profile, profile_visibility: "recruiters" });
                          setIsDraft(true);
                        }}
                        className={`p-6 rounded-xl border-2 transition-all ${
                          profile.profile_visibility === "recruiters" ? "border-neon-cyan bg-neon-cyan/10" : "border-glass-border glass hover:glass-strong"
                        }`}
                      >
                        <Users className="h-8 w-8 mb-3 mx-auto text-neon-cyan" />
                        <h4 className="font-medium text-white mb-1">Recruiters Only</h4>
                        <p className="text-sm text-muted-foreground">Only recruiters can view</p>
                      </button>

                      <button
                        onClick={() => {
                          setProfile({ ...profile, profile_visibility: "private" });
                          setIsDraft(true);
                        }}
                        className={`p-6 rounded-xl border-2 transition-all ${
                          profile.profile_visibility === "private" ? "border-destructive bg-destructive/10" : "border-glass-border glass hover:glass-strong"
                        }`}
                      >
                        <Lock className="h-8 w-8 mb-3 mx-auto text-destructive" />
                        <h4 className="font-medium text-white mb-1">Private</h4>
                        <p className="text-sm text-muted-foreground">Hidden from everyone</p>
                      </button>
                    </div>
                  </div>

                  <Separator className="bg-glass-border" />

                  {/* Privacy Toggles */}
                  <div className="space-y-4">
                    <Label className="text-white">Privacy Settings</Label>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 glass rounded-xl">
                        <div className="flex-1">
                          <h4 className="font-medium text-white mb-1">Show contact to recruiters</h4>
                          <p className="text-sm text-muted-foreground">Allow recruiters to see your email and phone</p>
                        </div>
                        <button
                          onClick={() => {
                            setProfile({ ...profile, show_contact_to_recruiters: !profile.show_contact_to_recruiters });
                            setIsDraft(true);
                          }}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${profile.show_contact_to_recruiters ? "bg-neon-cyan" : "bg-glass-border"}`}
                        >
                          <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${profile.show_contact_to_recruiters ? "translate-x-6" : "translate-x-1"}`} />
                        </button>
                      </div>

                      <div className="flex items-center justify-between p-4 glass rounded-xl">
                        <div className="flex-1">
                          <h4 className="font-medium text-white mb-1">Allow profile downloads</h4>
                          <p className="text-sm text-muted-foreground">Let others download your profile as PDF</p>
                        </div>
                        <button
                          onClick={() => {
                            setProfile({ ...profile, allow_profile_downloads: !profile.allow_profile_downloads });
                            setIsDraft(true);
                          }}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${profile.allow_profile_downloads ? "bg-neon-cyan" : "bg-glass-border"}`}
                        >
                          <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${profile.allow_profile_downloads ? "translate-x-6" : "translate-x-1"}`} />
                        </button>
                      </div>

                      <div className="flex items-center justify-between p-4 glass rounded-xl">
                        <div className="flex-1">
                          <h4 className="font-medium text-white mb-1">Profile view analytics</h4>
                          <p className="text-sm text-muted-foreground">Enable anonymous tracking of profile views</p>
                        </div>
                        <button
                          onClick={() => {
                            setProfile({ ...profile, profile_view_analytics: !profile.profile_view_analytics });
                            setIsDraft(true);
                          }}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${profile.profile_view_analytics ? "bg-neon-cyan" : "bg-glass-border"}`}
                        >
                          <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${profile.profile_view_analytics ? "translate-x-6" : "translate-x-1"}`} />
                        </button>
                      </div>
                    </div>
                  </div>

                  <Separator className="bg-glass-border" />

                  {/* Actions */}
                  <div className="space-y-3">
                    <Label className="text-white">Profile Actions</Label>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <Button variant="outline" className="glass hover:glass-strong border-glass-border hover:border-neon-cyan justify-start">
                        <Download className="h-4 w-4 mr-2" />
                        Download Resume
                      </Button>

                      <Button variant="outline" className="glass hover:glass-strong border-glass-border hover:border-neon-purple justify-start">
                        <Share2 className="h-4 w-4 mr-2" />
                        Share Profile
                      </Button>

                      <Button variant="outline" onClick={() => setShowPreview(true)} className="glass hover:glass-strong border-glass-border hover:border-neon-pink justify-start">
                        <Eye className="h-4 w-4 mr-2" />
                        Preview as Public
                      </Button>

                      <Button variant="outline" className="glass hover:glass-strong border-glass-border hover:border-neon-yellow justify-start">
                        <History className="h-4 w-4 mr-2" />
                        View History
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Danger Modal */}
      {showDangerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
          <Card className="glass p-8 rounded-2xl border border-destructive/30 max-w-md w-full">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 rounded-full bg-destructive/20 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="h-6 w-6 text-destructive" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white mb-2">Confirm Action</h3>
                <p className="text-muted-foreground">
                  {dangerAction === "remove-photo" && "Are you sure you want to remove your profile photo?"}
                  {dangerAction === "public-visibility" && "Making your profile public will allow anyone to view your information. Continue?"}
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setShowDangerModal(false)} className="flex-1 glass hover:glass-strong">
                Cancel
              </Button>
              <Button onClick={confirmDangerAction} className="flex-1 bg-destructive text-white hover:bg-destructive/90">
                Confirm
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
