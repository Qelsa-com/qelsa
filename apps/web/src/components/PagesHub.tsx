"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Building2,
  Users,
  Briefcase,
  MapPin,
  Globe,
  Plus,
  Search,
  X,
  ExternalLink,
  Pencil,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Compass,
  Layers,
  ChevronRight,
  RotateCcw,
} from "lucide-react";
import { useGetDiscoverPagesQuery, useGetMyPagesQuery } from "@/features/api/pagesApi";
import { Page } from "@/types/page";
import { PagesHubGridSkeleton } from "./pageSkeletons";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

const AVATAR_GRADIENTS = [
  "from-violet-600 to-indigo-700",
  "from-cyan-500 to-blue-600",
  "from-fuchsia-600 to-pink-600",
  "from-emerald-500 to-teal-600",
  "from-amber-500 to-rose-600",
];

function getAvatarGradient(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % AVATAR_GRADIENTS.length;
  return AVATAR_GRADIENTS[index];
}

interface PageCardProps {
  page: Page;
  isOwner?: boolean;
}

function PageCard({ page, isOwner }: PageCardProps) {
  const router = useRouter();
  const pageId = page.id || (page as { _id?: string })._id;

  const jobsCount = page.jobs?.length || 0;
  const companySizeLabel = page.company_size?.label || page.companySize;
  const tags = (page.culture_tags || page.specialties || page.tags || []).slice(0, 3);
  const initials = page.name
    ? page.name
        .split(" ")
        .map((w) => w[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "CO";

  const handleCardClick = () => {
    if (pageId) {
      router.push(`/pages/${pageId}`);
    }
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (pageId) {
      router.push(`/pages/${pageId}/edit`);
    }
  };

  const handleWebsiteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (page.website) {
      const url = page.website.startsWith("http") ? page.website : `https://${page.website}`;
      window.open(url, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <div
      onClick={handleCardClick}
      className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0c0d18]/90 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-white/20 hover:shadow-xl hover:shadow-neon-cyan/5 cursor-pointer"
    >
      {/* Top Banner Accent */}
      <div className="relative h-24 sm:h-28 w-full overflow-hidden bg-gradient-to-r from-neon-purple/20 via-neon-cyan/15 to-white/[0.03]">
        {page.hero_image || page.heroImage ? (
          <img
            src={page.hero_image || page.heroImage || ""}
            alt={`${page.name} banner`}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(157,78,221,0.25),transparent_60%)]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0c0d18] via-transparent to-black/30" />

        {/* Top Floating Badges */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2 pointer-events-none">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-black/60 px-2.5 py-0.5 text-[11px] font-medium text-white/90 backdrop-blur-md border border-white/10 capitalize">
            <Building2 className="size-3 text-neon-cyan" />
            {page.type || "Company"}
          </span>

          {isOwner || page.can_manage ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-neon-purple/25 px-2.5 py-0.5 text-[11px] font-semibold text-neon-purple border border-neon-purple/40 backdrop-blur-md">
              <Sparkles className="size-3" />
              Owner
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full bg-black/60 px-2.5 py-0.5 text-[11px] font-medium text-white/80 border border-white/10 backdrop-blur-md">
              <CheckCircle2 className="size-3 text-neon-green" />
              Verified
            </span>
          )}
        </div>
      </div>

      {/* Main Body */}
      <div className="px-5 pb-5 flex-1 flex flex-col justify-between">
        <div>
          {/* Avatar / Logo overlapping banner */}
          <div className="-mt-9 mb-3 flex items-end justify-between">
            <div className="relative size-16 rounded-xl border-2 border-[#0c0d18] bg-[#141526] shadow-xl overflow-hidden flex items-center justify-center shrink-0">
              {page.logo ? (
                <img src={page.logo} alt={page.name} className="h-full w-full object-cover" />
              ) : (
                <div
                  className={`h-full w-full bg-gradient-to-br ${getAvatarGradient(
                    page.name
                  )} flex items-center justify-center text-white font-bold text-lg`}
                >
                  {initials}
                </div>
              )}
            </div>

            {page.website && (
              <button
                onClick={handleWebsiteClick}
                title="Open company website"
                className="rounded-lg p-2 text-white/40 transition-colors hover:bg-white/[0.06] hover:text-white"
              >
                <ExternalLink className="size-4" />
              </button>
            )}
          </div>

          {/* Title & Tagline */}
          <h3 className="text-base sm:text-lg font-bold text-white group-hover:text-neon-cyan transition-colors line-clamp-1">
            {page.name}
          </h3>
          <p className="mt-1 text-xs text-white/60 line-clamp-1">
            {page.tagline || page.description || "Building something exciting on Qelsa"}
          </p>

          {/* Quick Info Chips */}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {page.industry && (
              <span className="inline-flex items-center gap-1 rounded-md bg-white/[0.04] px-2 py-0.5 text-[11px] text-white/70 border border-white/[0.06]">
                <Briefcase className="size-3 text-neon-cyan/70" />
                {page.industry}
              </span>
            )}
            {page.headquarters && (
              <span className="inline-flex items-center gap-1 rounded-md bg-white/[0.04] px-2 py-0.5 text-[11px] text-white/70 border border-white/[0.06]">
                <MapPin className="size-3 text-neon-purple/70" />
                {page.headquarters}
              </span>
            )}
            {companySizeLabel && (
              <span className="inline-flex items-center gap-1 rounded-md bg-white/[0.04] px-2 py-0.5 text-[11px] text-white/70 border border-white/[0.06]">
                <Users className="size-3 text-neon-green/70" />
                {companySizeLabel}
              </span>
            )}
          </div>

          {/* Description snippet */}
          {(page.detailed_description || page.description) && (
            <p className="mt-3 text-xs leading-relaxed text-white/50 line-clamp-2">
              {page.detailed_description || page.description}
            </p>
          )}

          {/* Culture / Specialty Tags */}
          {tags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {tags.map((tag, idx) => (
                <span
                  key={idx}
                  className="rounded-full bg-white/[0.03] px-2 py-0.5 text-[10px] text-white/50 border border-white/[0.04]"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Card Footer */}
        <div className="mt-5 pt-3.5 border-t border-white/[0.06] flex items-center justify-between gap-3">
          <div className="flex items-center gap-1.5">
            {jobsCount > 0 ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-neon-green/10 px-2.5 py-0.5 text-[11px] font-semibold text-neon-green border border-neon-green/20">
                <span className="size-1.5 rounded-full bg-neon-green animate-pulse" />
                {jobsCount} {jobsCount === 1 ? "Open Role" : "Open Roles"}
              </span>
            ) : (
              <span className="text-[11px] text-white/40">No active roles</span>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            {isOwner || page.can_manage ? (
              <>
                <button
                  onClick={handleEditClick}
                  title="Edit page details"
                  className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-1.5 text-xs font-medium text-white/80 transition-colors hover:bg-white/[0.08] hover:text-white"
                >
                  <Pencil className="size-3" />
                  <span className="hidden sm:inline">Edit</span>
                </button>
                <button
                  onClick={handleCardClick}
                  className="inline-flex items-center gap-1 rounded-lg bg-neon-cyan/15 px-3 py-1.5 text-xs font-semibold text-neon-cyan border border-neon-cyan/30 transition-all hover:bg-neon-cyan/25"
                >
                  Manage
                  <ChevronRight className="size-3" />
                </button>
              </>
            ) : (
              <button
                onClick={handleCardClick}
                className="inline-flex items-center gap-1 rounded-lg bg-white/[0.06] px-3 py-1.5 text-xs font-medium text-white transition-all hover:bg-white/[0.1] hover:border-white/20 border border-white/10"
              >
                View Page
                <ArrowRight className="size-3 text-white/60" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function PagesHub() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"my-pages" | "discover">("my-pages");
  const [selectedIndustry, setSelectedIndustry] = useState<string>("all");

  const { data: mypages = [], isLoading: myLoading } = useGetMyPagesQuery();
  const { data: discoverPages = [], isLoading: discoverLoading } = useGetDiscoverPagesQuery();

  // Metrics
  const totalMyPages = mypages.length;
  const totalOpenRoles = useMemo(() => {
    return mypages.reduce((acc, p) => acc + (p.jobs?.length || 0), 0);
  }, [mypages]);
  const totalDiscoverPages = discoverPages.length;

  // Extract industries for active list
  const availableIndustries = useMemo(() => {
    const list = activeTab === "my-pages" ? mypages : discoverPages;
    const set = new Set<string>();
    list.forEach((p) => {
      if (p.industry?.trim()) set.add(p.industry.trim());
    });
    return Array.from(set).sort();
  }, [activeTab, mypages, discoverPages]);

  // Real-time filtering
  const filteredPages = useMemo(() => {
    const currentList = activeTab === "my-pages" ? mypages : discoverPages;
    const q = searchQuery.trim().toLowerCase();

    return currentList.filter((page) => {
      const matchesSearch =
        !q ||
        page.name?.toLowerCase().includes(q) ||
        page.tagline?.toLowerCase().includes(q) ||
        page.description?.toLowerCase().includes(q) ||
        page.detailed_description?.toLowerCase().includes(q) ||
        page.industry?.toLowerCase().includes(q) ||
        page.headquarters?.toLowerCase().includes(q) ||
        (page.culture_tags && page.culture_tags.some((t) => t.toLowerCase().includes(q))) ||
        (page.specialties && page.specialties.some((s) => s.toLowerCase().includes(q)));

      const matchesIndustry =
        selectedIndustry === "all" ||
        page.industry?.toLowerCase() === selectedIndustry.toLowerCase();

      return matchesSearch && matchesIndustry;
    });
  }, [activeTab, mypages, discoverPages, searchQuery, selectedIndustry]);

  const isLoading = activeTab === "my-pages" ? myLoading : discoverLoading;

  const handleResetFilters = () => {
    setSearchQuery("");
    setSelectedIndustry("all");
  };

  return (
    <div className="min-h-screen bg-[#06060f] text-foreground pb-20">
      {/* Top Hero Glow Section */}
      <div className="relative border-b border-white/[0.08] bg-gradient-to-b from-white/[0.03] to-transparent">
        <div className="pointer-events-none absolute -top-24 left-1/2 h-[340px] w-[700px] -translate-x-1/2 rounded-full bg-neon-cyan/[0.07] blur-[140px]" />
        <div className="pointer-events-none absolute top-10 right-10 h-[240px] w-[300px] rounded-full bg-neon-purple/[0.06] blur-[120px]" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.05] px-3 py-1 text-xs font-semibold uppercase tracking-wider text-neon-cyan border border-white/10 mb-3">
                <Layers className="size-3.5" />
                Company Directory & Hub
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white">
                Company Pages
              </h1>
              <p className="mt-1.5 text-sm text-white/60 max-w-2xl">
                Showcase your organization culture, manage hiring pipelines, and explore companies across the Qelsa ecosystem.
              </p>
            </div>

            {/* Create Page Primary CTA */}
            <div className="shrink-0">
              <Button
                onClick={() => router.push("/create-page")}
                className="w-full sm:w-auto bg-gradient-to-r from-neon-purple to-neon-pink hover:from-neon-purple/90 hover:to-neon-pink/90 text-white font-semibold shadow-lg shadow-neon-purple/25 hover:shadow-neon-purple/40 hover:scale-[1.02] active:scale-[0.98] transition-all px-5 py-2.5 rounded-xl border border-white/20"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Company Page
              </Button>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {/* Stat 1 */}
            <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0c0d18]/80 p-4.5 backdrop-blur-xl transition-all hover:border-white/20">
              <div className="flex items-center gap-3.5">
                <div className="flex size-11 items-center justify-center rounded-xl bg-neon-cyan/15 text-neon-cyan border border-neon-cyan/25 shrink-0">
                  <Building2 className="size-5" />
                </div>
                <div>
                  <p className="text-2xl font-black text-white">{totalMyPages}</p>
                  <p className="text-xs font-medium text-white/70">My Organizations</p>
                  <p className="text-[11px] text-white/40">Pages under your management</p>
                </div>
              </div>
            </div>

            {/* Stat 2 */}
            <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0c0d18]/80 p-4.5 backdrop-blur-xl transition-all hover:border-white/20">
              <div className="flex items-center gap-3.5">
                <div className="flex size-11 items-center justify-center rounded-xl bg-neon-purple/15 text-neon-purple border border-neon-purple/25 shrink-0">
                  <Briefcase className="size-5" />
                </div>
                <div>
                  <p className="text-2xl font-black text-white">{totalOpenRoles}</p>
                  <p className="text-xs font-medium text-white/70">Active Open Roles</p>
                  <p className="text-[11px] text-white/40">Across your managed pages</p>
                </div>
              </div>
            </div>

            {/* Stat 3 */}
            <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0c0d18]/80 p-4.5 backdrop-blur-xl transition-all hover:border-white/20">
              <div className="flex items-center gap-3.5">
                <div className="flex size-11 items-center justify-center rounded-xl bg-neon-green/15 text-neon-green border border-neon-green/25 shrink-0">
                  <Compass className="size-5" />
                </div>
                <div>
                  <p className="text-2xl font-black text-white">{totalDiscoverPages}</p>
                  <p className="text-xs font-medium text-white/70">Public Organizations</p>
                  <p className="text-[11px] text-white/40">Visible across Qelsa network</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-8">
        {/* Navigation & Controls Section */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Tab Switcher */}
            <div className="inline-flex rounded-xl bg-white/[0.04] p-1 border border-white/[0.08] w-fit">
              <button
                onClick={() => {
                  setActiveTab("my-pages");
                  setSelectedIndustry("all");
                }}
                className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs sm:text-sm font-semibold transition-all ${
                  activeTab === "my-pages"
                    ? "bg-white/[0.12] text-white shadow-sm border border-white/10"
                    : "text-white/60 hover:text-white hover:bg-white/[0.04]"
                }`}
              >
                <Building2 className="size-4" />
                My Pages
                <span
                  className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
                    activeTab === "my-pages"
                      ? "bg-neon-cyan/20 text-neon-cyan"
                      : "bg-white/[0.08] text-white/60"
                  }`}
                >
                  {totalMyPages}
                </span>
              </button>

              <button
                onClick={() => {
                  setActiveTab("discover");
                  setSelectedIndustry("all");
                }}
                className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs sm:text-sm font-semibold transition-all ${
                  activeTab === "discover"
                    ? "bg-white/[0.12] text-white shadow-sm border border-white/10"
                    : "text-white/60 hover:text-white hover:bg-white/[0.04]"
                }`}
              >
                <Compass className="size-4" />
                Discover
                <span
                  className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
                    activeTab === "discover"
                      ? "bg-neon-green/20 text-neon-green"
                      : "bg-white/[0.08] text-white/60"
                  }`}
                >
                  {totalDiscoverPages}
                </span>
              </button>
            </div>

            {/* Search Input Bar */}
            <div className="relative w-full md:w-80 lg:w-96">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-white/40" />
              <Input
                placeholder="Search by name, industry, location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-10 w-full pl-10 pr-9 rounded-xl border border-white/[0.08] bg-white/[0.03] text-sm text-white placeholder:text-white/40 focus-visible:border-neon-cyan/50 focus-visible:ring-1 focus-visible:ring-neon-cyan/30"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors"
                >
                  <X className="size-4" />
                </button>
              )}
            </div>
          </div>

          {/* Industry Pills Filter */}
          {availableIndustries.length > 0 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
              <span className="text-xs text-white/40 font-medium shrink-0 mr-1">Industry:</span>
              <button
                onClick={() => setSelectedIndustry("all")}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-all shrink-0 ${
                  selectedIndustry === "all"
                    ? "bg-white/[0.15] text-white border border-white/20"
                    : "bg-white/[0.04] text-white/60 hover:text-white hover:bg-white/[0.08] border border-white/[0.06]"
                }`}
              >
                All
              </button>
              {availableIndustries.map((ind) => (
                <button
                  key={ind}
                  onClick={() => setSelectedIndustry(ind)}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition-all shrink-0 ${
                    selectedIndustry.toLowerCase() === ind.toLowerCase()
                      ? "bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/40"
                      : "bg-white/[0.04] text-white/60 hover:text-white hover:bg-white/[0.08] border border-white/[0.06]"
                  }`}
                >
                  {ind}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Content Grid / Empty States */}
        <div className="mt-6">
          {isLoading ? (
            <PagesHubGridSkeleton count={6} />
          ) : filteredPages.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPages.map((page) => (
                <PageCard
                  key={page.id || (page as { _id?: string })._id}
                  page={page}
                  isOwner={activeTab === "my-pages"}
                />
              ))}
            </div>
          ) : searchQuery || selectedIndustry !== "all" ? (
            /* Search / Filter Empty State */
            <div className="rounded-2xl border border-white/[0.08] bg-[#0c0d18]/60 p-12 text-center backdrop-blur-xl">
              <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-white/[0.04] border border-white/10 text-white/40 mb-4">
                <Search className="size-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-1.5">No matching company pages</h3>
              <p className="text-sm text-white/50 max-w-md mx-auto mb-6">
                No organizations matched &ldquo;{searchQuery || selectedIndustry}&rdquo;. Try adjusting your search query or clear the active filters.
              </p>
              <Button
                onClick={handleResetFilters}
                variant="outline"
                className="border-white/10 bg-white/[0.04] hover:bg-white/[0.08] text-white text-xs gap-2"
              >
                <RotateCcw className="size-3.5" />
                Clear Filters
              </Button>
            </div>
          ) : activeTab === "my-pages" ? (
            /* My Pages Empty State */
            <div className="rounded-2xl border border-dashed border-white/15 bg-[#0c0d18]/60 p-12 text-center backdrop-blur-xl">
              <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br from-neon-purple/20 to-neon-cyan/20 border border-white/10 text-neon-cyan mb-4 shadow-lg shadow-neon-purple/10">
                <Building2 className="size-8" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">You haven&apos;t created any pages yet</h3>
              <p className="text-sm text-white/60 max-w-md mx-auto mb-6 leading-relaxed">
                Create a page to showcase your organization culture, list job vacancies, and manage applicant pipelines on Qelsa.
              </p>
              <Button
                onClick={() => router.push("/create-page")}
                className="bg-gradient-to-r from-neon-purple to-neon-pink hover:from-neon-purple/90 hover:to-neon-pink/90 text-white font-semibold px-6 py-2.5 rounded-xl shadow-lg shadow-neon-purple/20"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Page
              </Button>
            </div>
          ) : (
            /* Discover Empty State */
            <div className="rounded-2xl border border-white/[0.08] bg-[#0c0d18]/60 p-12 text-center backdrop-blur-xl">
              <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-white/[0.04] border border-white/10 text-white/40 mb-4">
                <Compass className="size-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-1.5">No public directory pages yet</h3>
              <p className="text-sm text-white/50 max-w-md mx-auto mb-6">
                Be the first to list an organization and invite candidates to explore your company brand!
              </p>
              <Button
                onClick={() => router.push("/create-page")}
                className="bg-gradient-to-r from-neon-purple to-neon-pink text-white font-semibold px-5 py-2 rounded-xl text-xs"
              >
                <Plus className="w-3.5 h-3.5 mr-1.5" />
                Create Page
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
