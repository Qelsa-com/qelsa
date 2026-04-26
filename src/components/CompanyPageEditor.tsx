import { useAuth } from "@/contexts/AuthContext";
import { Page } from "@/types/page";
import { User as UserType } from "@/types/user";
import {
  AlertTriangle,
  ArrowLeft,
  Building,
  Camera,
  Check,
  CheckCircle,
  Clock,
  Crown,
  Eye,
  FileEdit,
  Globe,
  Heart,
  Image as ImageIcon,
  Linkedin,
  Loader2,
  Lock,
  MapPin,
  MoreVertical,
  Save,
  ShieldCheck,
  Sparkles,
  Trash2,
  Twitter,
  User,
  UserCheck,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Separator } from "./ui/separator";
import { Textarea } from "./ui/textarea";

const COMPANY_SIZES = ["1-10 employees", "11-50 employees", "51-200 employees", "201-1000 employees", "1000-5000 employees", "5000+ employees"];

const INDUSTRIES = [
  "Technology",
  "Software Development",
  "Artificial Intelligence",
  "Cloud Computing",
  "Financial Services",
  "Healthcare",
  "E-commerce",
  "Education",
  "Marketing",
  "Consulting",
  "Manufacturing",
  "Retail",
  "Other",
];

const ROLE_PERMISSIONS = {
  admin: { edit: true, publish: true, manageUsers: true, transferOwnership: false },
  user: { edit: false, publish: false, manageUsers: false, transferOwnership: false },
};

const ROLE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  owner: Crown,
  admin: ShieldCheck,
  editor: FileEdit,
  moderator: UserCheck,
  user: Eye,
};

export function CompanyPageEditor() {
  const [page, setPage] = useState<Page>();
  const [activeSection, setActiveSection] = useState<string>("about");
  const [isDraft, setIsDraft] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<UserType | null>(null);
  const [inviteRole, setInviteRole] = useState<UserType["role"]>("user");
  const [inviteMessage, setInviteMessage] = useState("");
  const [transferConfirmText, setTransferConfirmText] = useState("");
  const [selectedUserForTransfer, setSelectedUserForTransfer] = useState<string>("");
  const [aboutShortChars, setAboutShortChars] = useState(0);
  const [users, setUsers] = useState<UserType[]>([]);
  const { user: authUser } = useAuth();

  const permissions = ROLE_PERMISSIONS[authUser?.role];

  // Auto-save functionality
  useEffect(() => {
    const autoSaveTimer = setTimeout(() => {
      if (isDraft && permissions.edit) {
        handleAutoSave();
      }
    }, 10000); // 10 seconds

    return () => clearTimeout(autoSaveTimer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, isDraft]);

  const handleAutoSave = () => {
    setLastSaved(new Date());
    toast.success("Draft saved", {
      description: "Your changes have been automatically saved",
    });
  };

  const handleSaveDraft = () => {
    setIsDraft(false);
    setLastSaved(new Date());
    toast.success("Draft saved");
  };

  const handlePublish = () => {
    if (!permissions.publish) {
      toast.error("Permission denied", {
        description: "You need admin or owner permissions to publish changes",
      });
      return;
    }

    setIsDraft(false);
    toast.success("Page published successfully!", {
      description: "Your changes are now live",
    });
  };

  const handleInviteUsers = () => {
    if (!selectedUser) {
      toast.error("Please select a user");
      return;
    }

    // Check if user is already added
    const isAlreadyAdded = users.some((u) => u.id === selectedUser.id);
    if (isAlreadyAdded) {
      toast.error("User is already a member of this page");
      return;
    }

    setSearchQuery("");
    setSelectedUser(null);
    setInviteMessage("");
    setShowInviteModal(false);

    toast.success("User added successfully", {
      description: `${selectedUser.name} has been added as ${inviteRole}`,
    });
  };

  const handleChangeUserRole = (userId: string, newRole: UserType["role"]) => {
    if (newRole === "admin") {
      setSelectedUserForTransfer(userId);
      setShowTransferModal(true);
      return;
    }

    setUsers(users.map((u) => (u.id === userId ? { ...u, role: newRole } : u)));
    toast.success("Role updated");
  };

  const handleRemoveUser = (userId: string) => {
    setUsers(users.filter((u) => u.id !== userId));
    toast.success("User removed from page");
  };

  const handleTransferOwnership = () => {
    if (transferConfirmText !== String(page.id)) {
      toast.error("Confirmation text does not match");
      return;
    }

    // Transfer ownership
    // setUsers(
    //   users.map((u) => {
    //     if (u.id === selectedUserForTransfer) return { ...u, role: "owner" as const };
    //     if (u.userId === currentUser.id) return { ...u, role: "admin" as const };
    //     return u;
    //   })
    // );

    setShowTransferModal(false);
    setTransferConfirmText("");
    setSelectedUserForTransfer("");

    toast.success("Ownership transferred", {
      description: "Page ownership has been transferred successfully",
    });
  };

  const handleAddValue = () => {
    const newValue = {
      id: `value-${Date.now()}`,
      title: "",
      description: "",
    };
    setPage({
      ...page,
      // culture: {
      //   ...page.culture,
      //   values: [...page.culture.values, newValue],
      // },
    });
    setIsDraft(true);
  };

  const handleRemoveValue = (valueId: string) => {
    setPage({
      ...page,
      // culture: {
      //   ...page.culture,
      //   values: page.culture.values.filter((v) => v.id !== valueId),
      // },
    });
    setIsDraft(true);
  };

  const handleAddHighlight = () => {
    const newHighlight = {
      id: `highlight-${Date.now()}`,
      image: "",
      title: "",
      text: "",
    };
    setPage({
      ...page,
      // culture: {
      //   ...page.culture,
      //   highlights: [...page.culture.highlights, newHighlight],
      // },
    });
    setIsDraft(true);
  };

  const handleRemoveHighlight = (highlightId: string) => {
    setPage({
      ...page,
      // culture: {
      //   ...page.culture,
      //   highlights: page.culture.highlights.filter((h) => h.id !== highlightId),
      // },
    });
    setIsDraft(true);
  };

  const handleAIEnhanceAbout = async () => {
    setAiLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Mock AI enhancement
    // const enhanced = page.tagline
    //   ? page.tagline + " We are innovating at the intersection of technology and impact."
    //   : "We are a leading company innovating at the intersection of technology and impact.";

    // setPage({ ...page, aboutShort: enhanced.substring(0, 280) });
    // setAboutShortChars(enhanced.substring(0, 280).length);
    setIsDraft(true);
    setAiLoading(false);
    toast.success("Description enhanced by AI");
  };

  const sections = [
    { id: "about", label: "About", icon: Building },
    { id: "details", label: page.type === "institution" ? "Institution Details" : "Company Details", icon: MapPin },
    { id: "culture", label: "Culture & Values", icon: Heart },
    { id: "users", label: "User Management", icon: Users },
  ];

  if (!permissions.edit && activeSection !== "users") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900 p-6">
        <Card className="glass p-8 max-w-2xl mx-auto text-center">
          <Lock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Access Restricted</h2>
          <p className="text-muted-foreground mb-6">You don&apos;t have permission to edit this company page.</p>
          <Button>Go Back</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900">
      {/* Header */}
      <div className="glass border-b border-glass-border sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button className="p-2 hover:glass-strong rounded-lg transition-all">
                <ArrowLeft className="h-5 w-5 text-white" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-white">Edit Page — {page.name}</h1>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  {isDraft && (
                    <>
                      <Clock className="h-3 w-3" />
                      <span>Unsaved changes</span>
                    </>
                  )}
                  {lastSaved && !isDraft && (
                    <>
                      <CheckCircle className="h-3 w-3 text-neon-green" />
                      <span>Saved {lastSaved.toLocaleTimeString()}</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {permissions.edit && (
                <>
                  <Button variant="outline" onClick={() => setShowPreview(!showPreview)} className="border-glass-border">
                    <Eye className="h-4 w-4 mr-2" />
                    Preview
                  </Button>
                  <Button variant="outline" onClick={handleSaveDraft} disabled={!isDraft} className="border-glass-border">
                    <Save className="h-4 w-4 mr-2" />
                    Save Draft
                  </Button>
                </>
              )}
              {permissions.publish && (
                <Button onClick={handlePublish} className="bg-neon-cyan text-black hover:bg-neon-cyan/90">
                  <Check className="h-4 w-4 mr-2" />
                  Publish
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Section Navigation */}
      <div className="glass border-b border-glass-border sticky top-[73px] z-40">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex gap-1 overflow-x-auto">
            {sections.map((section) => {
              const Icon = section.icon;
              const isActive = activeSection === section.id;

              // Only show users tab if has permission
              if (section.id === "users" && !permissions.manageUsers && authUser?.role !== "user") {
                return null;
              }

              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`flex items-center gap-2 px-6 py-4 border-b-2 transition-all whitespace-nowrap ${
                    isActive ? "border-neon-cyan text-neon-cyan" : "border-transparent text-muted-foreground hover:text-white"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {section.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Editor Form */}
          <div className="lg:col-span-2">
            {/* Section 1: About */}
            {activeSection === "about" && (
              <Card className="glass p-8 rounded-2xl border border-glass-border">
                <div className="space-y-8">
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-2">About</h2>
                    <p className="text-muted-foreground">Tell the world about your company</p>
                  </div>

                  {/* Logo & Hero Image */}
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <Label className="text-white">Company Logo</Label>
                      <div className="relative aspect-square glass-strong rounded-xl border-2 border-dashed border-glass-border hover:border-neon-cyan transition-all group cursor-pointer overflow-hidden">
                        {page.logo ? (
                          <>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={page.logo} alt="Logo" className="w-full h-full object-cover" />
                            <button
                              onClick={() => {
                                setPage({ ...page, logo: "" });
                                setIsDraft(true);
                              }}
                              className="absolute top-2 right-2 p-1 bg-red-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="h-4 w-4 text-white" />
                            </button>
                          </>
                        ) : (
                          <div className="flex flex-col items-center justify-center h-full">
                            <Camera className="h-8 w-8 text-muted-foreground mb-2" />
                            <p className="text-sm text-muted-foreground">Upload logo</p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Label className="text-white">Hero Image</Label>
                      <div className="relative aspect-square glass-strong rounded-xl border-2 border-dashed border-glass-border hover:border-neon-cyan transition-all group cursor-pointer overflow-hidden">
                        {/* {page.heroImage ? (
                          <>
                            <img src={page.heroImage} alt="Hero" className="w-full h-full object-cover" />
                            <button
                              onClick={() => {
                                setPage({ ...page, heroImage: "" });
                                setIsDraft(true);
                              }}
                              className="absolute top-2 right-2 p-1 bg-red-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="h-4 w-4 text-white" />
                            </button>
                          </>
                        ) : (
                          <div className="flex flex-col items-center justify-center h-full">
                            <ImageIcon className="h-8 w-8 text-muted-foreground mb-2" />
                            <p className="text-sm text-muted-foreground">Upload hero</p>
                          </div>
                        )} */}
                      </div>
                    </div>
                  </div>

                  <Separator className="bg-glass-border" />

                  {/* Short Description */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-white">
                        Short Description <span className="text-destructive">*</span>
                      </Label>
                      <span className="text-xs text-muted-foreground">{aboutShortChars}/280</span>
                    </div>
                    <Textarea
                      value={page.tagline}
                      onChange={(e) => {
                        const value = e.target.value.substring(0, 280);
                        setPage({ ...page, tagline: value });
                        setAboutShortChars(value.length);
                        setIsDraft(true);
                      }}
                      placeholder="A brief overview of what your company does..."
                      maxLength={280}
                      rows={3}
                      className="glass border-glass-border focus:border-neon-cyan resize-none"
                    />
                    <Button variant="outline" size="sm" onClick={handleAIEnhanceAbout} disabled={aiLoading} className="border-neon-purple/30 text-neon-purple hover:bg-neon-purple/10">
                      {aiLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Enhancing...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4 mr-2" />
                          AI Enhance
                        </>
                      )}
                    </Button>
                  </div>

                  {/* Long Description */}
                  <div className="space-y-3">
                    <Label className="text-white">Detailed Description</Label>
                    <Textarea
                      value={page.description}
                      onChange={(e) => {
                        setPage({ ...page, description: e.target.value });
                        setIsDraft(true);
                      }}
                      placeholder="Tell your company's story... (supports rich text)"
                      rows={8}
                      className="glass border-glass-border focus:border-neon-cyan resize-none"
                    />
                    <p className="text-xs text-muted-foreground">Supports bold, italic, bullets, and links</p>
                  </div>

                  {/* Tags */}
                  <div className="space-y-3">
                    <Label className="text-white">Focus Areas / Tags</Label>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {page.tags.map((tag, index) => (
                        <Badge key={index} variant="outline" className="border-neon-cyan/30 text-neon-cyan bg-neon-cyan/10 pr-1">
                          {tag}
                          <button
                            onClick={() => {
                              setPage({
                                ...page,
                                tags: page.tags.filter((_, i) => i !== index),
                              });
                              setIsDraft(true);
                            }}
                            className="ml-2 hover:text-white"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                    <Input
                      placeholder="Type a tag and press Enter"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && e.currentTarget.value) {
                          setPage({
                            ...page,
                            tags: [...page.tags, e.currentTarget.value],
                          });
                          e.currentTarget.value = "";
                          setIsDraft(true);
                        }
                      }}
                      className="glass border-glass-border focus:border-neon-cyan"
                    />
                  </div>

                  {/* Primary Industry */}
                  <div className="space-y-3">
                    <Label className="text-white">Primary Industry</Label>
                    <select
                      value={page.primaryIndustry}
                      onChange={(e) => {
                        setPage({ ...page, primaryIndustry: e.target.value });
                        setIsDraft(true);
                      }}
                      className="w-full glass border border-glass-border rounded-lg px-3 py-2 focus:border-neon-cyan focus:outline-none bg-transparent text-white"
                    >
                      {INDUSTRIES.map((industry) => (
                        <option key={industry} value={industry} className="bg-gray-900">
                          {industry}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </Card>
            )}

            {/* Section 2: Company Details */}
            {activeSection === "details" && (
              <Card className="glass p-8 rounded-2xl border border-glass-border">
                <div className="space-y-8">
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-2">{page.type === "institution" ? "Institution Details" : "Company Details"}</h2>
                    <p className="text-muted-foreground">{page.type === "institution" ? "Structured information about your institution" : "Structured information about your company"}</p>
                  </div>

                  {/* Website */}
                  <div className="space-y-2">
                    <Label htmlFor="website" className="text-white">
                      Website <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="website"
                      type="url"
                      value={page.website}
                      onChange={(e) => {
                        setPage({ ...page, website: e.target.value });
                        setIsDraft(true);
                      }}
                      placeholder="https://company.com"
                      className="glass border-glass-border focus:border-neon-cyan"
                    />
                  </div>

                  {/* Industry & Company Size */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-white">Industry</Label>
                      <select
                        value={page.industry}
                        onChange={(e) => {
                          setPage({ ...page, industry: e.target.value });
                          setIsDraft(true);
                        }}
                        className="w-full glass border border-glass-border rounded-lg px-3 py-2 focus:border-neon-cyan focus:outline-none bg-transparent text-white"
                      >
                        {INDUSTRIES.map((industry) => (
                          <option key={industry} value={industry} className="bg-gray-900">
                            {industry}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-white">Company Size</Label>
                      <select
                        value={page.companySize}
                        onChange={(e) => {
                          setPage({ ...page, companySize: e.target.value });
                          setIsDraft(true);
                        }}
                        className="w-full glass border border-glass-border rounded-lg px-3 py-2 focus:border-neon-cyan focus:outline-none bg-transparent text-white"
                      >
                        {COMPANY_SIZES.map((size) => (
                          <option key={size} value={size} className="bg-gray-900">
                            {size}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <Separator className="bg-glass-border" />

                  {/* Headquarters & Founded Year */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="headquarters" className="text-white">
                        Headquarters
                      </Label>
                      <Input
                        id="headquarters"
                        value={page.headquarters}
                        onChange={(e) => {
                          setPage({ ...page, headquarters: e.target.value });
                          setIsDraft(true);
                        }}
                        placeholder="San Francisco, CA"
                        className="glass border-glass-border focus:border-neon-cyan"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="founded" className="text-white">
                        Founded Year
                      </Label>
                      <Input
                        id="founded"
                        type="number"
                        value={page.foundedYear}
                        onChange={(e) => {
                          setPage({ ...page, foundedYear: parseInt(e.target.value) || 0 });
                          setIsDraft(true);
                        }}
                        placeholder="2020"
                        min="1800"
                        max={new Date().getFullYear()}
                        className="glass border-glass-border focus:border-neon-cyan"
                      />
                    </div>
                  </div>

                  <Separator className="bg-glass-border" />

                  {/* Contact Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="contact-email" className="text-white">
                        Contact Email
                      </Label>
                      <Input
                        id="contact-email"
                        type="email"
                        value={page.contactEmail}
                        onChange={(e) => {
                          setPage({ ...page, contactEmail: e.target.value });
                          setIsDraft(true);
                        }}
                        placeholder="contact@company.com"
                        className="glass border-glass-border focus:border-neon-cyan"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="contact-phone" className="text-white">
                        Contact Phone (Optional)
                      </Label>
                      <Input
                        id="contact-phone"
                        type="tel"
                        value={page.contactPhone}
                        onChange={(e) => {
                          setPage({ ...page, contactPhone: e.target.value });
                          setIsDraft(true);
                        }}
                        placeholder="+1 (555) 000-0000"
                        className="glass border-glass-border focus:border-neon-cyan"
                      />
                    </div>
                  </div>

                  <Separator className="bg-glass-border" />

                  {/* Social Links */}
                  <div className="space-y-4">
                    <Label className="text-white">Social Links</Label>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                        <Linkedin className="h-4 w-4" />
                        <span>LinkedIn</span>
                      </div>
                      <Input
                        value={page.socials.linkedin}
                        onChange={(e) => {
                          setPage({
                            ...page,
                            socials: { ...page.socials, linkedin: e.target.value },
                          });
                          setIsDraft(true);
                        }}
                        placeholder="https://linkedin.com/company/..."
                        className="glass border-glass-border focus:border-neon-cyan"
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                        <Twitter className="h-4 w-4" />
                        <span>Twitter</span>
                      </div>
                      <Input
                        value={page.socials.twitter}
                        onChange={(e) => {
                          setPage({
                            ...page,
                            socials: { ...page.socials, twitter: e.target.value },
                          });
                          setIsDraft(true);
                        }}
                        placeholder="https://twitter.com/..."
                        className="glass border-glass-border focus:border-neon-cyan"
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                        <Globe className="h-4 w-4" />
                        <span>Glassdoor</span>
                      </div>
                      <Input
                        value={page.socials.glassdoor}
                        onChange={(e) => {
                          setPage({
                            ...page,
                            socials: { ...page.socials, glassdoor: e.target.value },
                          });
                          setIsDraft(true);
                        }}
                        placeholder="https://glassdoor.com/..."
                        className="glass border-glass-border focus:border-neon-cyan"
                      />
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {/* Section 3: Culture */}
            {/* {activeSection === "culture" && (
              <Card className="glass p-8 rounded-2xl border border-glass-border">
                <div className="space-y-8">
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-2">Culture & Values</h2>
                    <p className="text-muted-foreground">Define your work culture for better candidate matching</p>
                  </div>

                  <Separator className="bg-glass-border" />

                  <CulturePanel
                    data={{
                      attributes: page.culture.attributes,
                      cultureStatement: page.culture.cultureStatement,
                      jobMatchingImportance: page.culture.jobMatchingImportance,
                    }}
                    type={page.type || "company"}
                    onChange={(cultureData) => {
                      setPage({
                        ...page,
                        culture: {
                          ...page.culture,
                          attributes: cultureData.attributes,
                          cultureStatement: cultureData.cultureStatement,
                          jobMatchingImportance: cultureData.jobMatchingImportance,
                        },
                      });
                    }}
                    onDraftChange={() => setIsDraft(true)}
                  />
                </div>
              </Card>
            )} */}

            {/* Section 4: User Management */}
            {activeSection === "users" && (
              <Card className="glass p-8 rounded-2xl border border-glass-border">
                <div className="space-y-8">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-bold text-white mb-2">User Management</h2>
                      <p className="text-muted-foreground">Manage who can access and edit this page</p>
                    </div>
                    {permissions.manageUsers && (
                      <Button onClick={() => setShowInviteModal(true)} className="bg-neon-cyan text-black hover:bg-neon-cyan/90">
                        <UserPlus className="h-4 w-4 mr-2" />
                        Invite User
                      </Button>
                    )}
                  </div>

                  {/* Users List */}
                  <div className="space-y-3">
                    {users.map((user) => {
                      const RoleIcon = ROLE_ICONS[user.role];

                      return (
                        <div key={user.id} className="p-4 glass-strong rounded-xl border border-glass-border">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full glass-strong flex items-center justify-center">
                                {user.avatar ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img src={user.avatar} alt={user.name} className="w-full h-full rounded-full object-cover" />
                                ) : <User className="h-5 w-5 text-muted-foreground" />}
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <p className="font-medium text-white">{user.name}</p>
                                  {user.status === "pending" && (
                                    <Badge variant="outline" className="border-neon-yellow/30 text-neon-yellow bg-neon-yellow/10 text-xs">
                                      Pending
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-sm text-muted-foreground">{user.email}</p>
                              </div>
                            </div>

                            <div className="flex items-center gap-3">
                              <Badge
                                variant="outline"
                                className={`${
                                  user.role === "owner"
                                    ? "border-neon-cyan/30 text-neon-cyan bg-neon-cyan/10"
                                    : user.role === "admin"
                                    ? "border-neon-purple/30 text-neon-purple bg-neon-purple/10"
                                    : "border-glass-border text-muted-foreground"
                                }`}
                              >
                                <RoleIcon className="h-3 w-3 mr-1" />
                                {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                              </Badge>

                              {permissions.manageUsers && user.role !== "owner" && (
                                <div className="relative group">
                                  <button className="p-2 hover:glass-strong rounded-lg transition-all">
                                    <MoreVertical className="h-4 w-4 text-muted-foreground" />
                                  </button>
                                  <div className="absolute right-0 top-full mt-2 w-48 glass border border-glass-border rounded-xl p-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                                    <select
                                      onChange={(e) => {
                                        handleChangeUserRole(String(user.id), e.target.value as UserType["role"]);
                                        e.target.value = user.role;
                                      }}
                                      className="w-full glass border border-glass-border rounded-lg px-3 py-2 mb-2 focus:border-neon-cyan focus:outline-none bg-transparent text-white text-sm"
                                    >
                                      <option value="" disabled className="bg-gray-900">
                                        Change role...
                                      </option>
                                      <option value="admin" className="bg-gray-900">
                                        Admin
                                      </option>
                                      <option value="editor" className="bg-gray-900">
                                        Editor
                                      </option>
                                      <option value="moderator" className="bg-gray-900">
                                        Moderator
                                      </option>
                                      <option value="viewer" className="bg-gray-900">
                                        Viewer
                                      </option>
                                      {authUser?.role === "owner" && (
                                        <option value="owner" className="bg-gray-900">
                                          Transfer Ownership
                                        </option>
                                      )}
                                    </select>
                                    <button onClick={() => handleRemoveUser(String(user.id))} className="w-full px-3 py-2 text-left text-sm text-red-400 hover:bg-red-400/10 rounded-lg transition-colors">
                                      <Trash2 className="h-4 w-4 inline mr-2" />
                                      Remove
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>

                          {user.lastActiveAt && <p className="text-xs text-muted-foreground mt-2 ml-13">Last active: {new Date(user.lastActiveAt).toLocaleDateString()}</p>}
                        </div>
                      );
                    })}
                  </div>

                  {/* Role Descriptions */}
                  <div className="p-4 glass-strong rounded-xl border border-glass-border">
                    <h3 className="text-sm font-semibold text-white mb-3">Role Permissions</h3>
                    <div className="space-y-2 text-xs text-muted-foreground">
                      <div className="flex items-start gap-2">
                        <Crown className="h-4 w-4 text-neon-cyan flex-shrink-0 mt-0.5" />
                        <div>
                          <span className="text-neon-cyan font-medium">Owner</span> — Full access to all features, can transfer ownership
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <ShieldCheck className="h-4 w-4 text-neon-purple flex-shrink-0 mt-0.5" />
                        <div>
                          <span className="text-neon-purple font-medium">Admin</span> — Edit and publish content, manage users (except ownership transfer)
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <FileEdit className="h-4 w-4 text-white flex-shrink-0 mt-0.5" />
                        <div>
                          <span className="text-white font-medium">Editor</span> — Edit content and save drafts, changes require approval
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <UserCheck className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                        <div>
                          <span className="font-medium">Moderator</span> — Limited editing, changes require approval
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <Eye className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                        <div>
                          <span className="font-medium">Viewer</span> — View-only access, cannot edit
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            )}
          </div>

          {/* Preview Sidebar */}
          <div className="hidden lg:block">
            <div className="sticky top-32">
              <Card className="glass p-6 rounded-2xl border border-glass-border">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-white">Preview</h3>
                  <Badge variant="outline" className="border-neon-cyan/30 text-neon-cyan bg-neon-cyan/10 text-xs">
                    Live
                  </Badge>
                </div>

                {activeSection === "about" && (
                  <div className="space-y-4">
                    {page.logo && (
                      <div className="w-16 h-16 rounded-xl overflow-hidden">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={page.logo} alt="Logo" className="w-full h-full object-cover" />
                      </div>
                    )}
                    <div>
                      <h4 className="font-bold text-white mb-2">{page.name}</h4>
                      <p className="text-sm text-muted-foreground">{page.tagline || "No description yet..."}</p>
                    </div>
                    {page.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {page.tags.slice(0, 3).map((tag, i) => (
                          <Badge key={i} variant="outline" className="text-xs border-neon-cyan/30 text-neon-cyan">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {activeSection === "details" && (
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Globe className="h-4 w-4" />
                      <span>{page.website || "No website"}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Building className="h-4 w-4" />
                      <span>{page.industry || "No industry"}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Users className="h-4 w-4" />
                      <span>{page.companySize || "No size"}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span>{page.headquarters || "No location"}</span>
                    </div>
                  </div>
                )}

                {activeSection === "culture" && (
                  <div className="space-y-4">
                    {page.culture.tagline && <p className="text-sm italic text-muted-foreground">&quot;{page.culture.tagline}&quot;</p>}
                    {page.culture.values.length > 0 && (
                      <div>
                        <h5 className="text-xs font-semibold text-white mb-2">Core Values</h5>
                        <div className="space-y-2">
                          {page.culture.values.slice(0, 3).map((value) => (
                            <div key={value.id} className="text-xs">
                              <p className="font-medium text-neon-purple">{value.title || "Untitled"}</p>
                              <p className="text-muted-foreground">{value.description || "No description"}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {activeSection === "users" && (
                  <div className="space-y-3">
                    <div className="text-sm text-muted-foreground">
                      <p className="mb-2">
                        Total users: <span className="text-white font-semibold">{users.length}</span>
                      </p>
                      <div className="space-y-1">
                        <p>Owners: {users.filter((u) => u.role === "owner").length}</p>
                        <p>Admins: {users.filter((u) => u.role === "admin").length}</p>
                        <p>Editors: {users.filter((u) => u.role === "editor").length}</p>
                        <p>Pending: {users.filter((u) => u.status === "pending").length}</p>
                      </div>
                    </div>
                  </div>
                )}
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="glass p-6 rounded-2xl border border-glass-border max-w-md w-full">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">Invite Users</h3>
              <button onClick={() => setShowInviteModal(false)} className="p-2 hover:glass-strong rounded-lg transition-all">
                <X className="h-5 w-5 text-white" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-white">Search Qelsa Users</Label>
                <div className="relative">
                  <Input
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setSelectedUser(null);
                    }}
                    placeholder="Search by username or name..."
                    className="glass border-glass-border focus:border-neon-cyan"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => {
                        setSearchQuery("");
                        setSelectedUser(null);
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>

                {/* User Search Results */}
                {searchQuery && (
                  <div className="max-h-64 overflow-y-auto space-y-1 glass-strong p-2 rounded-lg border border-glass-border">
                    {users.filter(
                      (user) =>
                        user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        user.email.toLowerCase().includes(searchQuery.toLowerCase())
                    ).map((user) => (
                      <button
                        key={user.id}
                        onClick={() => {
                          setSelectedUser(user);
                          setSearchQuery(user.username);
                        }}
                        className={`w-full p-3 rounded-lg text-left transition-all ${selectedUser?.id === user.id ? "bg-neon-cyan/20 border border-neon-cyan/30" : "hover:bg-white/5"}`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
                            {user.avatar ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-neon-cyan to-neon-purple flex items-center justify-center text-white font-semibold">{user.name.charAt(0)}</div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-white truncate">{user.name}</p>
                              {user.isVerified && <CheckCircle className="h-4 w-4 text-neon-cyan flex-shrink-0" />}
                            </div>
                            <p className="text-xs text-neon-cyan">{user.username}</p>
                            {user.title && <p className="text-xs text-muted-foreground truncate">{user.title}</p>}
                          </div>
                        </div>
                      </button>
                    ))}
                    {users.filter(
                      (user) =>
                        user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        user.email.toLowerCase().includes(searchQuery.toLowerCase())
                    ).length === 0 && (
                      <div className="p-4 text-center text-muted-foreground">
                        <User className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No users found</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Selected User Preview */}
                {selectedUser && !searchQuery.includes(" ") && (
                  <div className="p-3 glass-strong rounded-lg border border-neon-cyan/30">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
                        {selectedUser.avatar ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={selectedUser.avatar} alt={selectedUser.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-neon-cyan to-neon-purple flex items-center justify-center text-white font-semibold">{selectedUser.name.charAt(0)}</div>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-white">{selectedUser.name}</p>
                          {selectedUser.isVerified && <CheckCircle className="h-4 w-4 text-neon-cyan" />}
                        </div>
                        <p className="text-xs text-neon-cyan">{selectedUser.username}</p>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedUser(null);
                          setSearchQuery("");
                        }}
                        className="text-muted-foreground hover:text-white"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-white">Role</Label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as UserType["role"])}
                  className="w-full glass border border-glass-border rounded-lg px-3 py-2 focus:border-neon-cyan focus:outline-none bg-transparent text-white"
                >
                  <option value="editor" className="bg-gray-900">
                    Editor
                  </option>
                  <option value="moderator" className="bg-gray-900">
                    Moderator
                  </option>
                  <option value="viewer" className="bg-gray-900">
                    Viewer
                  </option>
                  {authUser?.role === "owner" && (
                    <option value="admin" className="bg-gray-900">
                      Admin
                    </option>
                  )}
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowInviteModal(false);
                    setSearchQuery("");
                    setSelectedUser(null);
                  }}
                  className="flex-1 border-glass-border"
                >
                  Cancel
                </Button>
                <Button onClick={handleInviteUsers} disabled={!selectedUser} className="flex-1 bg-neon-cyan text-black hover:bg-neon-cyan/90 disabled:opacity-50 disabled:cursor-not-allowed">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add User
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Transfer Ownership Modal */}
      {showTransferModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="glass p-6 rounded-2xl border border-red-500/30 max-w-md w-full">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-400" />
                <h3 className="text-xl font-bold text-white">Transfer Ownership</h3>
              </div>
              <button
                onClick={() => {
                  setShowTransferModal(false);
                  setTransferConfirmText("");
                }}
                className="p-2 hover:glass-strong rounded-lg transition-all"
              >
                <X className="h-5 w-5 text-white" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
                <p className="text-sm text-muted-foreground">You are about to transfer ownership of this page. You will become an Admin and lose the ability to:</p>
                <ul className="text-sm text-muted-foreground mt-2 space-y-1 list-disc list-inside">
                  <li>Transfer ownership again</li>
                  <li>Remove the new owner</li>
                  <li>Access certain privileged settings</li>
                </ul>
              </div>

              <div className="space-y-2">
                <Label className="text-white">
                  Type <span className="text-neon-cyan font-mono">{page.slug}</span> to confirm
                </Label>
                <Input value={transferConfirmText} onChange={(e) => setTransferConfirmText(e.target.value)} placeholder={page.slug} className="glass border-glass-border focus:border-red-500" />
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowTransferModal(false);
                    setTransferConfirmText("");
                  }}
                  className="flex-1 border-glass-border"
                >
                  Cancel
                </Button>
                <Button onClick={handleTransferOwnership} disabled={transferConfirmText !== page.slug} className="flex-1 bg-red-500 text-white hover:bg-red-600">
                  Transfer Ownership
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
