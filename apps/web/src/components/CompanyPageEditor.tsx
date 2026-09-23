"use client";

import { useGetCompanySizesQuery } from "@/features/api/onboardingApi";
import { useGetPageByIdQuery, useUpdatePageMutation } from "@/features/api/pagesApi";
import { toastUnknownError } from "@/lib/errors";
import {
  ArrowLeft,
  Award,
  BarChart2,
  BookOpen,
  Briefcase,
  Building2,
  CheckSquare,
  Globe,
  Heart,
  HeartHandshake,
  Image as ImageIcon,
  Info,
  Layers,
  Linkedin,
  Loader2,
  Shield,
  Sliders,
  TrendingUp,
  Trash2,
  Twitter,
  Upload,
  Users,
  X,
  Zap,
} from "lucide-react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import React, { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { CompanyPageSkeleton } from "./pageSkeletons";

const CULTURE_PRESETS: Record<string, string[]> = {
  Startup: [
    "Fast-paced / Rapid iteration",
    "Autonomous / High ownership",
    "Flat / Low hierarchy",
    "Mission-driven / Impact-first",
  ],
  Enterprise: [
    "Structured / Process-oriented",
    "Clear career paths",
    "Collaborative / Team-first",
    "Data-driven / Metrics-first",
  ],
  "Remote-first": [
    "Remote-first / Distributed",
    "Autonomous / High ownership",
    "Work-life balance",
  ],
  Hybrid: [
    "Collaborative / Team-first",
    "Autonomous / High ownership",
    "Work-life balance",
  ],
  "Mission-driven": [
    "Mission-driven / Impact-first",
    "Collaborative / Team-first",
    "Diversity & Inclusion emphasis",
  ],
  "Work-life balanced": [
    "Work-life balance",
    "Learning-focused / Mentorship",
    "Flat / Low hierarchy",
  ],
};

const CULTURE_ATTRIBUTES_LIST = [
  { key: "Collaborative / Team-first", icon: Users },
  { key: "Autonomous / High ownership", icon: Shield },
  { key: "Fast-paced / Rapid iteration", icon: Zap },
  { key: "Structured / Process-oriented", icon: CheckSquare },
  { key: "Remote-first / Distributed", icon: Globe },
  { key: "Office-first / In-person", icon: Building2 },
  { key: "Flat / Low hierarchy", icon: Layers },
  { key: "Mission-driven / Impact-first", icon: TrendingUp },
  { key: "Work-life balance", icon: Heart },
  { key: "Learning-focused / Mentorship", icon: BookOpen },
  { key: "Data-driven / Metrics-first", icon: BarChart2 },
  { key: "Design-driven / UX-first", icon: Sliders },
  { key: "Diversity & Inclusion emphasis", icon: HeartHandshake },
  { key: "Clear career paths", icon: Award },
];

export function CompanyPageEditor() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const id = Array.isArray(params?.id) ? params.id[0] : params?.id;

  const [activeTab, setActiveTab] = useState<"about" | "details" | "culture">("about");
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form states
  const [logo, setLogo] = useState("");
  const [tagline, setTagline] = useState("");
  const [detailedDescription, setDetailedDescription] = useState("");
  const [specialties, setSpecialties] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");

  const [website, setWebsite] = useState("");
  const [industry, setIndustry] = useState("");
  const [sizeId, setSizeId] = useState("");
  const [headquarters, setHeadquarters] = useState("");
  const [foundedYear, setFoundedYear] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [twitterUrl, setTwitterUrl] = useState("");
  const [glassdoorUrl, setGlassdoorUrl] = useState("");

  const [selectedCultureTags, setSelectedCultureTags] = useState<string[]>([]);
  const [cultureStatement, setCultureStatement] = useState("");

  const { data: pageData, isLoading, error } = useGetPageByIdQuery(id ?? "", {
    skip: !id,
  });
  const { data: sizes = [] } = useGetCompanySizesQuery();
  const [updatePage] = useUpdatePageMutation();

  // Set initial tab from query param. Team lives on /pages/[id]/manage, not here.
  useEffect(() => {
    const tabParam = searchParams?.get("tab");
    if (tabParam === "team" && id) {
      router.replace(`/pages/${id}/manage`);
      return;
    }
    if (tabParam === "details") setActiveTab("details");
    else if (tabParam === "culture") setActiveTab("culture");
    else if (tabParam === "about") setActiveTab("about");
  }, [searchParams, id, router]);

  // Populate form values when pageData loads
  useEffect(() => {
    if (pageData) {
      setLogo(pageData.logo || "");
      setTagline(pageData.tagline || "");
      setDetailedDescription(pageData.detailed_description || pageData.description || "");
      setSpecialties(pageData.specialties || []);
      setWebsite(pageData.website || "");
      setIndustry(pageData.industry || "");
      setSizeId(pageData.size_id || "");
      setHeadquarters(pageData.headquarters || "");
      setFoundedYear(pageData.founded_year ? String(pageData.founded_year) : "");
      setContactEmail(pageData.contact_email || "");
      setContactPhone(pageData.contact_phone || "");
      setLinkedinUrl(pageData.linkedin_url || "");
      setTwitterUrl(pageData.twitter_url || "");
      setGlassdoorUrl(pageData.glassdoor_url || "");
      setSelectedCultureTags(pageData.culture_tags || []);
      setCultureStatement(pageData.culture_statement || "");
    }
  }, [pageData]);

  if (isLoading) return <CompanyPageSkeleton />;

  if (error || !pageData) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center p-8 text-center">
        <h2 className="text-xl font-bold text-white">Company page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">Could not load editor for this page.</p>
        <button
          type="button"
          onClick={() => router.push("/pages")}
          className="mt-4 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-white hover:bg-white/[0.08]"
        >
          Back to Pages
        </button>
      </div>
    );
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("File is too large. Maximum size is 5MB.");
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === "string") {
          setLogo(reader.result);
          toast.success("Logo preview updated");
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddSpecialty = () => {
    const val = tagInput.trim();
    if (val && !specialties.includes(val)) {
      setSpecialties([...specialties, val]);
      setTagInput("");
    }
  };

  const handleRemoveSpecialty = (tag: string) => {
    setSpecialties(specialties.filter((t) => t !== tag));
  };

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      handleAddSpecialty();
    }
  };

  const handleToggleCultureTag = (tag: string) => {
    if (selectedCultureTags.includes(tag)) {
      setSelectedCultureTags(selectedCultureTags.filter((t) => t !== tag));
    } else {
      setSelectedCultureTags([...selectedCultureTags, tag]);
    }
  };

  const handleApplyPreset = (presetName: string) => {
    const presetTags = CULTURE_PRESETS[presetName];
    if (presetTags) {
      const merged = Array.from(new Set([...selectedCultureTags, ...presetTags]));
      setSelectedCultureTags(merged);
      toast.success(`Applied ${presetName} preset attributes`);
    }
  };

  const handlePublish = async () => {
    if (!pageData?.id) return;
    try {
      setIsSaving(true);
      await updatePage({
        id: pageData.id,
        data: {
          logo: logo || undefined,
          tagline: tagline.trim() || undefined,
          detailed_description: detailedDescription.trim() || undefined,
          description: detailedDescription.trim() || tagline.trim() || undefined,
          specialties: specialties,
          website: website.trim() || undefined,
          industry: industry.trim() || undefined,
          size_id: sizeId || undefined,
          headquarters: headquarters.trim() || undefined,
          founded_year: foundedYear ? parseInt(foundedYear, 10) : undefined,
          contact_email: contactEmail.trim() || undefined,
          contact_phone: contactPhone.trim() || undefined,
          linkedin_url: linkedinUrl.trim() || undefined,
          twitter_url: twitterUrl.trim() || undefined,
          glassdoor_url: glassdoorUrl.trim() || undefined,
          culture_tags: selectedCultureTags,
          culture_statement: cultureStatement.trim() || undefined,
        },
      }).unwrap();
      toast.success("Page published successfully!", {
        description: "Your changes are now live.",
      });
      router.push(`/pages/${pageData.id}`);
    } catch (err) {
      toastUnknownError(err, "Failed to publish changes");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen pb-20 pt-8 sm:pt-10">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Back Link */}
        <button
          type="button"
          onClick={() => router.push(`/pages/${id}`)}
          className="flex items-center gap-2 text-sm text-white/70 hover:text-white transition-colors"
        >
          <ArrowLeft className="size-4" />
          <span>Back to profile</span>
        </button>

        {/* Tab Navigation */}
        <div className="mt-5 flex items-center gap-8 border-b border-white/[0.08]">
          <button
            type="button"
            onClick={() => setActiveTab("about")}
            className={`flex items-center gap-2 pb-3.5 text-sm font-semibold transition-colors relative ${
              activeTab === "about" ? "text-neon-cyan" : "text-white/60 hover:text-white"
            }`}
          >
            <Info className="size-4" />
            <span>About</span>
            {activeTab === "about" && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-neon-cyan" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("details")}
            className={`flex items-center gap-2 pb-3.5 text-sm font-semibold transition-colors relative ${
              activeTab === "details" ? "text-neon-cyan" : "text-white/60 hover:text-white"
            }`}
          >
            <Briefcase className="size-4" />
            <span>Company Details</span>
            {activeTab === "details" && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-neon-cyan" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("culture")}
            className={`flex items-center gap-2 pb-3.5 text-sm font-semibold transition-colors relative ${
              activeTab === "culture" ? "text-neon-cyan" : "text-white/60 hover:text-white"
            }`}
          >
            <Heart className="size-4" />
            <span>Culture</span>
            {activeTab === "culture" && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-neon-cyan" />
            )}
          </button>
        </div>

        {/* Title & Publish Header */}
        <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Edit Page - {pageData.name}
            </h1>
            <p className="mt-1 text-sm text-white/60">
              {activeTab === "about" && "Manage your company's about page content"}
              {activeTab === "details" && "Manage your company details"}
              {activeTab === "culture" && "Define your work culture for better candidate matching"}
            </p>
          </div>

          <button
            type="button"
            onClick={handlePublish}
            disabled={isSaving}
            className="flex items-center justify-center gap-2 rounded-full gradient-primary px-7 py-2.5 text-sm font-semibold text-white shadow-lg transition-all hover:opacity-95 disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                <span>Publishing…</span>
              </>
            ) : (
              <span>Publish</span>
            )}
          </button>
        </div>

        {/* Form Container Card */}
        <div className="mt-6 rounded-2xl border border-white/[0.08] bg-[#070712] p-8 shadow-xl">
            {/* TAB 1: ABOUT */}
            {activeTab === "about" && (
            <div className="space-y-8">
              {/* Media Section */}
              <div>
                <h3 className="text-base font-bold text-white mb-4">Media</h3>
                <div>
                  <h4 className="text-sm font-medium text-white/90">Company Logo</h4>
                  <p className="text-xs text-white/50 mt-0.5 mb-4">
                    JPG, PNG or GIF. Max 5MB. 1:1 ratio recommended.
                  </p>

                  <div className="flex items-center gap-5">
                    <div className="relative size-24 shrink-0 rounded-full border-2 border-dashed border-white/20 bg-white/[0.02] flex items-center justify-center overflow-hidden">
                      {logo ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img src={logo} alt="Company Logo" className="size-full object-cover" />
                      ) : (
                        <ImageIcon className="size-7 text-white/30" />
                      )}
                    </div>

                    <div className="flex items-center gap-3">
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept="image/*"
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/[0.08]"
                      >
                        <Upload className="size-4 text-white/70" />
                        <span>Upload Logo</span>
                      </button>
                      {logo && (
                        <button
                          type="button"
                          onClick={() => setLogo("")}
                          className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/[0.08]"
                        >
                          <Trash2 className="size-4 text-white/70" />
                          <span>Remove</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Description Section */}
              <div className="pt-8 border-t border-white/[0.06]">
                <h3 className="text-base font-bold text-white mb-4">Description</h3>
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-sm font-medium text-white/90">
                      Tagline <span className="text-pink-500">*</span>
                    </label>
                  </div>
                  <input
                    value={tagline}
                    maxLength={200}
                    onChange={(e) => setTagline(e.target.value)}
                    placeholder="A brief overview of what your company does..."
                    className="h-12 w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 text-sm text-white outline-none placeholder:text-white/30 focus:border-neon-cyan focus:ring-1 focus:ring-neon-cyan/40"
                  />
                  <div className="mt-1 text-right text-xs text-white/40">
                    {tagline.length}/200
                  </div>
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-medium text-white/90 mb-1.5">
                    Detailed Description
                  </label>
                  <textarea
                    rows={6}
                    value={detailedDescription}
                    onChange={(e) => setDetailedDescription(e.target.value)}
                    placeholder="Tell your company's story... (supports rich text)"
                    className="w-full rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm text-white outline-none placeholder:text-white/30 focus:border-neon-cyan focus:ring-1 focus:ring-neon-cyan/40 leading-relaxed"
                  />
                  <p className="mt-1.5 text-xs text-white/40">
                    Supports bold, italic, bullets, and links
                  </p>
                </div>
              </div>

              {/* Tags & Industry Section */}
              <div className="pt-8 border-t border-white/[0.06]">
                <h3 className="text-base font-bold text-white mb-4">Tags & Industry</h3>
                <label className="block text-sm font-medium text-white/90 mb-2">
                  Focus Areas / Tags
                </label>
                {specialties.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {specialties.map((tag) => (
                      <span
                        key={tag}
                        className="flex items-center gap-1.5 rounded-full border border-neon-cyan/40 bg-neon-cyan/15 px-3 py-1 text-xs font-medium text-neon-cyan"
                      >
                        <span>{tag}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveSpecialty(tag)}
                          className="text-neon-cyan/60 hover:text-neon-cyan"
                        >
                          <X className="size-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                <input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleTagKeyDown}
                  placeholder="Type a tag and press Enter"
                  className="h-12 w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 text-sm text-white outline-none placeholder:text-white/30 focus:border-neon-cyan focus:ring-1 focus:ring-neon-cyan/40"
                />
              </div>
            </div>
          )}

          {/* TAB 2: COMPANY DETAILS */}
          {activeTab === "details" && (
            <div className="space-y-6">
              {/* Website */}
              <div>
                <label className="block text-sm font-medium text-white/90 mb-1.5">
                  Website <span className="text-pink-500">*</span>
                </label>
                <input
                  type="url"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="https://techcorp-solutions.com"
                  className="h-12 w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 text-sm text-white outline-none placeholder:text-white/30 focus:border-neon-cyan focus:ring-1 focus:ring-neon-cyan/40"
                />
              </div>

              {/* Industry & Company Size */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-white/90 mb-1.5">
                    Industry
                  </label>
                  <input
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                    placeholder="Select an industry"
                    className="h-12 w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 text-sm text-white outline-none placeholder:text-white/30 focus:border-neon-cyan focus:ring-1 focus:ring-neon-cyan/40"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/90 mb-1.5">
                    Company Size
                  </label>
                  <select
                    value={sizeId}
                    onChange={(e) => setSizeId(e.target.value)}
                    className="h-12 w-full rounded-xl border border-white/10 bg-[#0e0e1a] px-4 text-sm text-white outline-none focus:border-neon-cyan focus:ring-1 focus:ring-neon-cyan/40"
                  >
                    <option value="" className="bg-[#0e0e1a] text-white/40">Select a company size</option>
                    {sizes.map((s: { id: string; label: string }) => (
                      <option key={s.id} value={s.id} className="bg-[#0e0e1a] text-white">
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Headquarters & Founded Year */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-white/90 mb-1.5">
                    Headquarters
                  </label>
                  <input
                    value={headquarters}
                    onChange={(e) => setHeadquarters(e.target.value)}
                    placeholder="San Francisco, CA"
                    className="h-12 w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 text-sm text-white outline-none placeholder:text-white/30 focus:border-neon-cyan focus:ring-1 focus:ring-neon-cyan/40"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/90 mb-1.5">
                    Founded Year
                  </label>
                  <input
                    type="number"
                    value={foundedYear}
                    onChange={(e) => setFoundedYear(e.target.value)}
                    placeholder="2015"
                    className="h-12 w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 text-sm text-white outline-none placeholder:text-white/30 focus:border-neon-cyan focus:ring-1 focus:ring-neon-cyan/40"
                  />
                </div>
              </div>

              {/* Contact Email & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-white/90 mb-1.5">
                    Contact Email
                  </label>
                  <input
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder="contact@techcorp-solutions.com"
                    className="h-12 w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 text-sm text-white outline-none placeholder:text-white/30 focus:border-neon-cyan focus:ring-1 focus:ring-neon-cyan/40"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/90 mb-1.5">
                    Contact Phone (Optional)
                  </label>
                  <input
                    type="tel"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    placeholder="+1 (555) 123-4567"
                    className="h-12 w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 text-sm text-white outline-none placeholder:text-white/30 focus:border-neon-cyan focus:ring-1 focus:ring-neon-cyan/40"
                  />
                </div>
              </div>

              {/* Social Links */}
              <div className="pt-4 border-t border-white/[0.06] space-y-4">
                <h4 className="text-sm font-bold text-white">Social Links</h4>

                <div>
                  <div className="flex items-center gap-1.5 text-xs text-white/70 mb-1.5">
                    <Linkedin className="size-3.5 text-white/60" />
                    <span>LinkedIn</span>
                  </div>
                  <input
                    value={linkedinUrl}
                    onChange={(e) => setLinkedinUrl(e.target.value)}
                    placeholder="https://linkedin.com/company/techcorp-solutions"
                    className="h-12 w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 text-sm text-white outline-none placeholder:text-white/30 focus:border-neon-cyan focus:ring-1 focus:ring-neon-cyan/40"
                  />
                </div>

                <div>
                  <div className="flex items-center gap-1.5 text-xs text-white/70 mb-1.5">
                    <Twitter className="size-3.5 text-white/60" />
                    <span>X.com</span>
                  </div>
                  <input
                    value={twitterUrl}
                    onChange={(e) => setTwitterUrl(e.target.value)}
                    placeholder="https://twitter.com/techcorpsol"
                    className="h-12 w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 text-sm text-white outline-none placeholder:text-white/30 focus:border-neon-cyan focus:ring-1 focus:ring-neon-cyan/40"
                  />
                </div>

                <div>
                  <div className="flex items-center gap-1.5 text-xs text-white/70 mb-1.5">
                    <Globe className="size-3.5 text-white/60" />
                    <span>Glassdoor</span>
                  </div>
                  <input
                    value={glassdoorUrl}
                    onChange={(e) => setGlassdoorUrl(e.target.value)}
                    placeholder="https://glassdoor.com/techcorp-solutions"
                    className="h-12 w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 text-sm text-white outline-none placeholder:text-white/30 focus:border-neon-cyan focus:ring-1 focus:ring-neon-cyan/40"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: CULTURE */}
          {activeTab === "culture" && (
            <div className="space-y-6">
              {/* Quick Presets */}
              <div>
                <h4 className="text-sm font-bold text-white mb-3">Quick Presets</h4>
                <div className="flex flex-wrap gap-2.5">
                  {Object.keys(CULTURE_PRESETS).map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => handleApplyPreset(preset)}
                      className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-medium text-white/80 transition-colors hover:bg-white/[0.08] hover:text-white"
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              {/* Culture Attributes */}
              <div>
                <h4 className="text-sm font-bold text-white mb-3">Culture Attributes</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {CULTURE_ATTRIBUTES_LIST.map((attr) => {
                    const isSelected = selectedCultureTags.includes(attr.key);
                    const Icon = attr.icon;
                    return (
                      <button
                        key={attr.key}
                        type="button"
                        onClick={() => handleToggleCultureTag(attr.key)}
                        className={`flex h-12 w-full items-center gap-3 rounded-full border px-5 text-left text-sm font-medium transition-all ${
                          isSelected
                            ? "border-neon-cyan/50 bg-neon-cyan/10 text-white"
                            : "border-white/10 bg-white/[0.02] text-white/70 hover:bg-white/[0.05] hover:text-white"
                        }`}
                      >
                        <Icon className={`size-4 shrink-0 ${isSelected ? "text-neon-cyan" : "text-white/40"}`} />
                        <span className="truncate">{attr.key}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Culture Statement */}
              <div className="pt-4 border-t border-white/[0.06]">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-bold text-white">
                    Culture Statement (Optional)
                  </label>
                  <span className="text-xs text-white/40">
                    {cultureStatement.length}/140
                  </span>
                </div>
                <textarea
                  rows={3}
                  maxLength={140}
                  value={cultureStatement}
                  onChange={(e) => setCultureStatement(e.target.value)}
                  placeholder="Describe your company culture in one sentence..."
                  className="w-full rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm text-white outline-none placeholder:text-white/30 focus:border-neon-cyan focus:ring-1 focus:ring-neon-cyan/40 leading-relaxed"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
