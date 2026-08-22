"use client";

import { useGetProfileQuery, useUpdateProfileMutation } from "@/features/api/authApi";
import { useGetExperiencesQuery } from "@/features/api/experiencesApi";
import { useCreateResumeMutation, useDeleteResumeMutation, useGetMyResumesQuery } from "@/features/api/resumeApi";
import { useLazySearchCitiesQuery } from "@/features/api/seedApi";
import { api } from "@/lib/convexApi";
import { useConvexQueryHook } from "@/lib/convexHooks";
import { toastUnknownError } from "@/lib/errors";
import { uploadFileToR2 } from "@/lib/r2Upload";
import { City } from "@/types/city";
import { CulturePreference, User } from "@/types/user";
import { useConvex, useMutation } from "convex/react";
import { ArrowLeft, BadgeCheck, Building2, Check, Download, Dribbble, FileText, Globe, Link2, Linkedin, Loader2, Lock, MapPin, Paperclip, Plus, ShieldCheck, Sparkles, Trash2, Twitter, Upload, User as UserIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Autocomplete } from "../ui/autocomplete";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { ChoiceChip, Field, Select, TagChip, Toggle, inputClass } from "./modals/fields";
import { GradientButton } from "./modals/ModalShell";
import { initials } from "./profileFormat";

/* ------------------------------ constants -------------------------------- */

const PRONOUNS = ["he/him", "she/her", "they/them", "other"];
const CURRENCIES = ["INR", "USD", "EUR", "GBP"];
const COUNTRY_CODES = ["+91", "+1", "+44", "+61", "+971", "+65", "+81"];
const WORKPLACE_TYPES = [
  { value: "on-site", label: "On-site" },
  { value: "hybrid", label: "Hybrid" },
  { value: "remote", label: "Remote" },
];
const WORK_TYPE_CHIPS = [
  { key: "preffer_full_time", label: "Full-time" },
  { key: "preffer_part_time", label: "Part-time" },
  { key: "preffer_contract", label: "Contract" },
  { key: "preffer_internship", label: "Internship" },
] as const;

const CULTURE_PRESETS = [
  { key: "startup", label: "Startup (fast-paced)", attributes: ["fast_paced", "autonomous", "flat_hierarchy", "mission_driven"] },
  { key: "enterprise", label: "Enterprise (structured)", attributes: ["structured", "career_paths", "office_first", "data_driven"] },
  { key: "remote_first", label: "Remote-first", attributes: ["remote_first", "autonomous", "work_life_balance", "collaborative"] },
  { key: "hybrid", label: "Hybrid", attributes: ["office_first", "work_life_balance", "collaborative", "structured"] },
  { key: "mission_driven", label: "Mission-driven", attributes: ["mission_driven", "collaborative", "diversity_inclusion", "learning_focused"] },
  { key: "balanced", label: "Work-life balanced", attributes: ["work_life_balance", "structured", "career_paths", "collaborative"] },
];

const CULTURE_ATTRIBUTES = [
  { key: "collaborative", label: "Collaborative / Team-first" },
  { key: "autonomous", label: "Autonomous / High ownership" },
  { key: "fast_paced", label: "Fast-paced / Rapid iteration" },
  { key: "structured", label: "Structured / Process-oriented" },
  { key: "remote_first", label: "Remote-first / Distributed" },
  { key: "office_first", label: "Office-first / In-person" },
  { key: "flat_hierarchy", label: "Flat / Low hierarchy" },
  { key: "career_paths", label: "Clear career paths" },
  { key: "mission_driven", label: "Mission-driven / Impact-first" },
  { key: "work_life_balance", label: "Work life balance" },
  { key: "learning_focused", label: "Learning-focused / Mentorship" },
  { key: "data_driven", label: "Data driven / Metrics first" },
  { key: "design_driven", label: "Design-driven / UX first" },
  { key: "diversity_inclusion", label: "Diversity & Inclusion emphasis" },
];

const SECTIONS = [
  { id: "identity", label: "Identity", icon: UserIcon, title: "Edit Identity", subtitle: "Update your personal identity details" },
  { id: "summary", label: "Headline & Summary", icon: FileText, title: "Headline & Summary", subtitle: "Tell recruiters who you are and what you do" },
  { id: "location", label: "Location & Preferences", icon: MapPin, title: "Location & Preferences", subtitle: "Set your location and work preferences" },
  { id: "contact", label: "Contact & Social", icon: Link2, title: "Contact & Social", subtitle: "Manage your contact information and social links" },
  { id: "media", label: "Resume & Media", icon: Paperclip, title: "Resume & Media", subtitle: "Upload your resume and media files" },
  { id: "visibility", label: "Visibility & Privacy", icon: ShieldCheck, title: "Visibility & Privacy", subtitle: "Control who can see your profile" },
] as const;

type SectionId = (typeof SECTIONS)[number]["id"];

/* -------------------------------- helpers -------------------------------- */

const emptyCulture = (): CulturePreference => ({
  preset: null,
  attributes: [],
  global_importance: 50,
  statement: "",
  visibility: { public: false, recruiters: false },
});

function CardSection({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-[20px] border border-white/10 bg-white/[0.03] p-6 lg:p-7">
      <h2 className="text-lg font-bold text-white">{title}</h2>
      {subtitle && <p className="mt-1 text-sm text-white/50">{subtitle}</p>}
      <div className="mt-5">{children}</div>
    </section>
  );
}

/* --------------------------------- page ---------------------------------- */

export function ProfileEditor() {
  const router = useRouter();
  const convex = useConvex();
  const [activeSection, setActiveSection] = useState<SectionId>("identity");
  const [profile, setProfile] = useState<User | null>(null);
  const [saving, setSaving] = useState(false);

  const { data: user, isLoading } = useGetProfileQuery();
  const { data: experiences } = useGetExperiencesQuery();
  const { data: resumes } = useGetMyResumesQuery();
  const [updateProfile] = useUpdateProfileMutation();
  const [createResume, { isLoading: isUploadingResume }] = useCreateResumeMutation();
  const [deleteResume] = useDeleteResumeMutation();
  const [searchCities, { data: cityOptions = [] }] = useLazySearchCitiesQuery();

  const generateUploadUrl = useMutation(api.files.generateUploadUrl);
  const syncMetadata = useMutation(api.files.syncMetadata);

  const photoInputRef = useRef<HTMLInputElement>(null);
  const resumeInputRef = useRef<HTMLInputElement>(null);
  const [photoUploading, setPhotoUploading] = useState(false);

  useEffect(() => {
    if (user && !profile) setProfile(user);
  }, [user, profile]);

  const workplaceTypes = useMemo(
    () =>
      (profile?.work_preference ?? "")
        .split(",")
        .map((w) => w.trim())
        .filter(Boolean),
    [profile?.work_preference],
  );

  const matchArgs = useMemo(
    () => ({
      cities: [profile?.city?.name, ...(profile?.relocate_locations ?? []).map((l) => l.split(",")[0])].filter(Boolean) as string[],
      workplace_types: workplaceTypes,
    }),
    [profile?.city?.name, profile?.relocate_locations, workplaceTypes],
  );
  const { data: matchCount } = useConvexQueryHook(api.jobs.matchCount, matchArgs, { skip: !profile });

  if (isLoading || !profile) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="size-6 animate-spin text-white/40" />
      </div>
    );
  }

  const patch = (updates: Partial<User>) => setProfile((prev) => (prev ? { ...prev, ...updates } : prev));

  const culture = profile.culture_preference ?? emptyCulture();
  const patchCulture = (updates: Partial<CulturePreference>) => patch({ culture_preference: { ...culture, ...updates } });

  const toggleWorkplace = (value: string) => {
    const next = workplaceTypes.includes(value) ? workplaceTypes.filter((w) => w !== value) : [...workplaceTypes, value];
    patch({ work_preference: next.join(",") });
  };

  const toggleCultureAttribute = (key: string) => {
    const exists = culture.attributes.some((a) => a.key === key);
    patchCulture({
      attributes: exists ? culture.attributes.filter((a) => a.key !== key) : [...culture.attributes, { key, importance: 2 }],
      preset: exists ? culture.preset : culture.preset,
    });
  };

  const applyPreset = (presetKey: string) => {
    const preset = CULTURE_PRESETS.find((p) => p.key === presetKey);
    if (!preset) return;
    const merged = new Map(culture.attributes.map((a) => [a.key, a]));
    for (const key of preset.attributes) if (!merged.has(key)) merged.set(key, { key, importance: 2 });
    patchCulture({ preset: presetKey, attributes: Array.from(merged.values()) });
  };

  /* ------------------------------- photo ---------------------------------- */

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return toast.error("Please upload an image file");
    if (file.size > 5 * 1024 * 1024) return toast.error("Image must be smaller than 5MB");
    setPhotoUploading(true);
    try {
      const storageId = await uploadFileToR2(generateUploadUrl, syncMetadata, file);
      const url = await convex.query(api.files.getUrl, { key: storageId });
      patch({ profile_image: url, profile_image_storage_id: storageId } as Partial<User>);
      toast.success("Profile photo updated — publish to save");
    } catch (error) {
      toastUnknownError(error, "Could not upload the photo. Please try again.");
    } finally {
      setPhotoUploading(false);
      if (photoInputRef.current) photoInputRef.current.value = "";
    }
  };

  /* -------------------------------- resume --------------------------------- */

  const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      await createResume({ file, title: file.name }).unwrap();
      toast.success("Resume uploaded");
    } catch (error) {
      toastUnknownError(error, "Could not upload the resume. Please try again.");
    } finally {
      if (resumeInputRef.current) resumeInputRef.current.value = "";
    }
  };

  /* -------------------------------- publish -------------------------------- */

  const handlePublish = async () => {
    setSaving(true);
    try {
      const {
        id: _id,
        city,
        culture_preference,
        experiences: _experiences,
        educations: _educations,
        skills: _skills,
        avatar: _avatar,
        title: _title,
        status: _status,
        isVerified: _isVerified,
        lastActiveAt: _lastActiveAt,
        password: _password,
        email: _email,
        role: _role,
        ...fields
      } = profile;
      const payload: Record<string, unknown> = { ...fields };
      delete payload.resumes;
      delete payload._id;
      delete payload._creationTime;
      if (city?.id) payload.city_id = city.id;
      if (culture_preference) {
        const { id: _cultureId, user_id, created_at, updated_at, ...pref } = culture_preference;
        payload.culture_preference = pref;
      }
      await updateProfile(payload).unwrap();
      toast.success("Profile published successfully!");
    } catch (error) {
      toastUnknownError(error, "Could not save your profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const section = SECTIONS.find((s) => s.id === activeSection)!;
  const currentRoles = (experiences ?? []).filter((exp) => exp.is_current);

  return (
    <div className="min-h-screen bg-[#06060f] text-white">
      <div className="mx-auto w-full max-w-[1100px] px-4 py-8 lg:px-8">
        {/* Back link */}
        <button type="button" onClick={() => router.push("/profile")} className="mb-4 flex items-center gap-2 text-sm text-white/60 transition-colors hover:text-white">
          <ArrowLeft className="size-4" />
          Back to profile
        </button>

        {/* Header */}
        <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">{section.title}</h1>
            <p className="mt-1 text-sm text-white/50">{section.subtitle}</p>
          </div>
          <GradientButton onClick={handlePublish} disabled={saving}>
            {saving ? "Publishing…" : "Publish"}
          </GradientButton>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
          {/* Sidebar */}
          <nav className="flex h-fit flex-col gap-1 rounded-[20px] border border-white/10 bg-white/[0.03] p-3 lg:sticky lg:top-6">
            {SECTIONS.map((item) => {
              const Icon = item.icon;
              const active = item.id === activeSection;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveSection(item.id)}
                  className={`flex items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium transition-colors ${active ? "bg-neon-cyan/10 text-neon-cyan" : "text-white/55 hover:bg-white/[0.05] hover:text-white"}`}
                >
                  <Icon className="size-[18px] shrink-0" />
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Content */}
          <div className="flex min-w-0 flex-col gap-6">
            {activeSection === "identity" && (
              <CardSection title="Identity & basic info" subtitle="Your photo and basic professional details">
                <div className="flex flex-col gap-6">
                  {/* Photo */}
                  <div className="flex flex-col gap-4">
                    <p className="text-[13px] font-medium text-white/70">Profile Photo</p>
                    <div className="flex flex-wrap items-center gap-5">
                      <Avatar className="size-24 ring-2 ring-neon-cyan/30">
                        <AvatarImage src={profile.profile_image || undefined} alt={profile.name} className="object-cover" />
                        <AvatarFallback className="bg-white/10 text-xl font-bold text-white">{initials(profile.name)}</AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col gap-2">
                        <div className="flex gap-3">
                          <button
                            type="button"
                            onClick={() => photoInputRef.current?.click()}
                            disabled={photoUploading}
                            className="flex items-center gap-2 rounded-full border border-neon-cyan/50 bg-neon-cyan/10 px-4 py-2 text-sm font-medium text-neon-cyan transition-colors hover:bg-neon-cyan/20 disabled:opacity-50"
                          >
                            {photoUploading ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
                            Upload Photo
                          </button>
                          {profile.profile_image && (
                            <button
                              type="button"
                              onClick={() => patch({ profile_image: "", profile_image_storage_id: "" })}
                              className="flex items-center gap-2 rounded-full border border-[#d73e9d]/50 bg-[#d73e9d]/10 px-4 py-2 text-sm font-medium text-[#f27bb8] transition-colors hover:bg-[#d73e9d]/20"
                            >
                              <Trash2 className="size-4" />
                              Remove
                            </button>
                          )}
                        </div>
                        <p className="text-xs text-white/40">JPG, PNG or GIF. Max 5MB. 1:1 ratio recommended.</p>
                        <input ref={photoInputRef} type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                      </div>
                    </div>
                  </div>

                  <div className="h-px bg-white/8" />

                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                    <Field label="Full Name" required>
                      <input value={profile.name ?? ""} onChange={(e) => patch({ name: e.target.value })} placeholder="Enter your full name" className={inputClass} />
                    </Field>
                    <Field label="Pronouns">
                      <Select value={profile.pronoun ?? ""} onChange={(value) => patch({ pronoun: value })} placeholder="Select pronouns">
                        {PRONOUNS.map((p) => (
                          <option key={p} value={p} className="bg-[#12122a]">
                            {p}
                          </option>
                        ))}
                      </Select>
                    </Field>
                  </div>

                  <Field label="Username" hint="Your unique username for your Qelsa profile URL">
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40">@</span>
                      <input value={profile.username ?? ""} onChange={(e) => patch({ username: e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, "") })} placeholder="username" className={`${inputClass} pl-9`} />
                    </div>
                  </Field>

                  <Field label="Current Position">
                    <Select
                      value=""
                      onChange={(value) => {
                        if (value) patch({ headline: value });
                      }}
                      placeholder={profile.headline || "Select from your current positions"}
                    >
                      {currentRoles.map((exp) => {
                        const label = `${exp.job_title?.name ?? "Role"} at ${exp.company?.name ?? "Company"}`;
                        return (
                          <option key={String(exp.id)} value={label} className="bg-[#12122a]">
                            {label}
                          </option>
                        );
                      })}
                    </Select>
                  </Field>
                </div>
              </CardSection>
            )}

            {activeSection === "summary" && (
              <CardSection title="Headline & Summary" subtitle="A short headline plus a professional summary">
                <div className="flex flex-col gap-5">
                  <Field label="Professional Headline" required hint={`${profile.headline?.length ?? 0}/120 characters`}>
                    <input value={profile.headline ?? ""} onChange={(e) => e.target.value.length <= 120 && patch({ headline: e.target.value })} placeholder="Building products that make a difference | PM Lead" className={inputClass} />
                  </Field>
                  <Field label="Professional Summary">
                    <textarea
                      value={profile.professional_summary ?? ""}
                      onChange={(e) => patch({ professional_summary: e.target.value })}
                      placeholder="Summarize your experience, strengths and what you're looking for…"
                      rows={5}
                      className={`${inputClass} resize-none`}
                    />
                  </Field>
                  <Field label="About">
                    <textarea value={profile.about ?? ""} onChange={(e) => patch({ about: e.target.value })} placeholder="Anything else you want people to know…" rows={4} className={`${inputClass} resize-none`} />
                  </Field>
                </div>
              </CardSection>
            )}

            {activeSection === "location" && (
              <>
                <CardSection title="Location" subtitle="This helps recruiters understand your availability and preferred work locations.">
                  <div className="flex flex-col gap-5">
                    <Field label="Workplace type">
                      <div className="flex flex-wrap gap-2">
                        {WORKPLACE_TYPES.map((type) => (
                          <ChoiceChip key={type.value} selected={workplaceTypes.includes(type.value)} onClick={() => toggleWorkplace(type.value)}>
                            {type.label}
                          </ChoiceChip>
                        ))}
                      </div>
                    </Field>

                    <div className="flex items-center gap-3">
                      <span className="text-[13px] font-medium text-white/70">Willing to Relocate?</span>
                      <span className="text-sm text-white/50">{profile.want_to_relocate ? "Yes" : "No"}</span>
                      <Toggle checked={Boolean(profile.want_to_relocate)} onChange={(value) => patch({ want_to_relocate: value })} label="Willing to relocate" />
                    </div>

                    {profile.want_to_relocate && (
                      <Field label="Relocation destinations">
                        <Autocomplete<City>
                          value={null}
                          onChange={(city) => {
                            if (!city) return;
                            const label = city.state?.name ? `${city.name}, ${city.state.name}` : city.name;
                            const current = profile.relocate_locations ?? [];
                            if (!current.includes(label)) patch({ relocate_locations: [...current, label] });
                          }}
                          onSearch={(q) => searchCities(q)}
                          options={cityOptions as City[]}
                          placeholder="Search city or region…"
                          renderOption={(c) => (c.state?.name ? `${c.name}, ${c.state.name}` : c.name)}
                          minChars={1}
                          inputClassName={inputClass}
                        />
                        {(profile.relocate_locations ?? []).length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-2">
                            {(profile.relocate_locations ?? []).map((location) => (
                              <TagChip key={location} onRemove={() => patch({ relocate_locations: (profile.relocate_locations ?? []).filter((l) => l !== location) })}>
                                {location}
                              </TagChip>
                            ))}
                          </div>
                        )}
                      </Field>
                    )}
                  </div>
                </CardSection>

                <CardSection title="Work preferences" subtitle="These help us surface roles that align with your goals and availability.">
                  <div className="flex flex-col gap-5">
                    <Field label="Work type">
                      <div className="flex flex-wrap gap-2">
                        {WORK_TYPE_CHIPS.map((chip) => (
                          <ChoiceChip key={chip.key} selected={Boolean(profile[chip.key as keyof User])} onClick={() => patch({ [chip.key]: !profile[chip.key as keyof User] } as Partial<User>)}>
                            {chip.label}
                          </ChoiceChip>
                        ))}
                      </div>
                    </Field>

                    <Field label="Salary Expectations (Optional)">
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                        <div>
                          <p className="mb-1.5 text-xs text-white/45">Currency</p>
                          <Select value={profile.expected_salary_currency ?? "INR"} onChange={(value) => patch({ expected_salary_currency: value })}>
                            {CURRENCIES.map((currency) => (
                              <option key={currency} value={currency} className="bg-[#12122a]">
                                {currency}
                              </option>
                            ))}
                          </Select>
                        </div>
                        <div>
                          <p className="mb-1.5 text-xs text-white/45">Minimum</p>
                          <input type="number" value={profile.expected_min_salary ?? ""} onChange={(e) => patch({ expected_min_salary: e.target.value ? Number(e.target.value) : undefined })} placeholder="2000000" className={inputClass} />
                        </div>
                        <div>
                          <p className="mb-1.5 text-xs text-white/45">Maximum</p>
                          <input type="number" value={profile.expected_max_salary ?? ""} onChange={(e) => patch({ expected_max_salary: e.target.value ? Number(e.target.value) : undefined })} placeholder="3500000" className={inputClass} />
                        </div>
                      </div>
                    </Field>
                  </div>
                </CardSection>

                <CardSection title="Cultural Preferences" subtitle="Match with companies that share your way of working">
                  <div className="flex flex-col gap-5">
                    <Field label="Quick Presets">
                      <div className="flex flex-wrap gap-2">
                        {CULTURE_PRESETS.map((preset) => (
                          <ChoiceChip key={preset.key} selected={culture.preset === preset.key} onClick={() => applyPreset(preset.key)}>
                            {preset.label}
                          </ChoiceChip>
                        ))}
                      </div>
                    </Field>
                    <Field label="Culture Attributes">
                      <div className="flex flex-wrap gap-2">
                        {CULTURE_ATTRIBUTES.map((attribute) => (
                          <ChoiceChip key={attribute.key} selected={culture.attributes.some((a) => a.key === attribute.key)} onClick={() => toggleCultureAttribute(attribute.key)}>
                            {attribute.label}
                          </ChoiceChip>
                        ))}
                      </div>
                    </Field>
                  </div>
                </CardSection>

                {/* Smart matches callout */}
                <div className="flex items-start gap-3 rounded-[20px] border border-neon-cyan/25 bg-neon-cyan/[0.06] p-5">
                  <Sparkles className="mt-0.5 size-5 shrink-0 text-neon-cyan" />
                  <div>
                    <p className="text-sm font-semibold text-white">Smart Job Matches</p>
                    <p className="mt-1 text-sm text-white/60">
                      {typeof matchCount === "number"
                        ? `Based on your location and preferences, we found ${matchCount} matching jobs${workplaceTypes.length ? ` with ${workplaceTypes.map((w) => w[0].toUpperCase() + w.slice(1)).join("/")} options` : ""}.`
                        : "Set your preferences to see matching jobs."}
                    </p>
                  </div>
                </div>
              </>
            )}

            {activeSection === "contact" && (
              <CardSection title="Contact Information">
                <div className="flex flex-col gap-6">
                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                    <Field label="Email" required>
                      <div className="relative">
                        <input value={profile.email} readOnly className={`${inputClass} pr-24 opacity-80`} />
                        <span className="absolute right-3 top-1/2 flex -translate-y-1/2 items-center gap-1 rounded-full bg-neon-cyan/15 px-2.5 py-1 text-[11px] font-semibold text-neon-cyan">
                          <BadgeCheck className="size-3" />
                          Verified
                        </span>
                      </div>
                    </Field>
                    <Field label="Phone">
                      <div className="flex gap-2">
                        <div className="w-24 shrink-0">
                          <Select value={profile.phone_country_code ?? "+91"} onChange={(value) => patch({ phone_country_code: value })}>
                            {COUNTRY_CODES.map((code) => (
                              <option key={code} value={code} className="bg-[#12122a]">
                                {code}
                              </option>
                            ))}
                          </Select>
                        </div>
                        <input value={profile.phone ?? ""} onChange={(e) => patch({ phone: e.target.value.replace(/[^\d\s-]/g, "") })} placeholder="98765 43210" className={inputClass} />
                      </div>
                    </Field>
                  </div>

                  <div className="h-px bg-white/8" />

                  <div className="flex flex-col gap-4">
                    <p className="text-sm font-semibold text-white">Social Profiles</p>
                    {(
                      [
                        { key: "linkedin_url", icon: Linkedin, color: "bg-[#0a66c2]", placeholder: "https://linkedin.com/in/username" },
                        { key: "github_url", icon: null, color: "bg-[#24292f]", placeholder: "https://github.com/username" },
                        { key: "twitter_url", icon: Twitter, color: "bg-[#1d9bf0]", placeholder: "https://twitter.com/username" },
                        { key: "other_social_link", icon: Dribbble, color: "bg-[#ea4c89]", placeholder: "https://dribbble.com/username" },
                      ] as const
                    ).map(({ key, icon: Icon, color, placeholder }) => (
                      <div key={key} className="flex items-center gap-3">
                        <span className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${color}`}>
                          {Icon ? (
                            <Icon className="size-4 text-white" />
                          ) : (
                            <svg viewBox="0 0 24 24" className="size-4 text-white" fill="currentColor">
                              <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.6 0 12 0zm7.9 5.8-1.4 6.4c-.1.4-.5.7-.9.7H6.4c-.4 0-.7-.3-.9-.7L4.1 5.8c-.1-.4.1-.8.5-.9.4-.1.8.1.9.5l1.2 5.6h10.6l1.2-5.6c.1-.4.5-.6.9-.5.4.1.6.5.5.9z" />
                            </svg>
                          )}
                        </span>
                        <input value={(profile[key as keyof User] as string) ?? ""} onChange={(e) => patch({ [key]: e.target.value } as Partial<User>)} placeholder={placeholder} className={inputClass} />
                      </div>
                    ))}
                  </div>
                </div>
              </CardSection>
            )}

            {activeSection === "media" && (
              <>
                <CardSection title="Resume">
                  <div className="flex flex-col gap-3">
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => resumeInputRef.current?.click()}
                        disabled={isUploadingResume}
                        className="flex items-center gap-2 rounded-full border border-neon-cyan/50 bg-neon-cyan/10 px-4 py-2 text-sm font-medium text-neon-cyan transition-colors hover:bg-neon-cyan/20 disabled:opacity-50"
                      >
                        {isUploadingResume ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
                        Upload
                      </button>
                      <input ref={resumeInputRef} type="file" accept=".pdf,.doc,.docx" onChange={handleResumeUpload} className="hidden" />
                    </div>

                    {(resumes ?? []).map((resume) => {
                      const selected = profile.default_resume_id === String(resume.id);
                      return (
                        <div key={String(resume.id)} className="flex items-center gap-4 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
                          <button
                            type="button"
                            onClick={() => patch({ default_resume_id: String(resume.id) })}
                            aria-label="Use this resume for job applications"
                            className={`flex size-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${selected ? "border-neon-cyan bg-neon-cyan" : "border-white/25"}`}
                          >
                            {selected && <Check className="size-3 text-[#06060f]" />}
                          </button>
                          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#7c2ff3] to-[#d73e9d]">
                            <FileText className="size-4 text-white" />
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-white">{resume.title}</p>
                            <p className="text-xs text-white/45">Last updated: {resume.updatedAt ? new Date(resume.updatedAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) : "—"}</p>
                          </div>
                          {resume.file_url && (
                            <a
                              href={resume.file_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1.5 rounded-full border border-white/15 px-3 py-1.5 text-xs font-medium text-white/70 transition-colors hover:text-white"
                            >
                              <Download className="size-3.5" />
                              Download
                            </a>
                          )}
                          <button
                            type="button"
                            onClick={async () => {
                              try {
                                await deleteResume(resume.id).unwrap();
                                if (selected) patch({ default_resume_id: undefined });
                                toast.success("Resume deleted");
                              } catch (error) {
                                toastUnknownError(error, "Could not delete the resume.");
                              }
                            }}
                            className="flex items-center gap-1.5 rounded-full border border-[#d73e9d]/40 px-3 py-1.5 text-xs font-medium text-[#f27bb8] transition-colors hover:bg-[#d73e9d]/10"
                          >
                            <Trash2 className="size-3.5" />
                            Delete
                          </button>
                        </div>
                      );
                    })}
                    {(resumes ?? []).length === 0 && <p className="py-4 text-center text-sm text-white/40">No resumes uploaded yet</p>}

                    <p className="text-xs text-white/40">Selected resume will be used for job applications</p>
                  </div>
                </CardSection>

                <CardSection title="Portfolio & Media" subtitle="Add links to your portfolio, projects, or published work">
                  <div className="flex flex-col gap-4">
                    {(profile.portfolio_links ?? []).map((link, index) => (
                      <div key={index} className="relative flex flex-col gap-2 rounded-xl border border-white/10 bg-white/[0.02] p-4">
                        <button
                          type="button"
                          onClick={() => patch({ portfolio_links: (profile.portfolio_links ?? []).filter((_, i) => i !== index) })}
                          aria-label="Remove link"
                          className="absolute right-3 top-3 text-[#f27bb8]/70 transition-colors hover:text-[#f27bb8]"
                        >
                          <Trash2 className="size-4" />
                        </button>
                        <p className="text-xs font-medium text-white/50">Link entry</p>
                        <input value={link.title} onChange={(e) => patch({ portfolio_links: (profile.portfolio_links ?? []).map((l, i) => (i === index ? { ...l, title: e.target.value } : l)) })} placeholder="Title" className={inputClass} />
                        <input value={link.url} onChange={(e) => patch({ portfolio_links: (profile.portfolio_links ?? []).map((l, i) => (i === index ? { ...l, url: e.target.value } : l)) })} placeholder="URL" className={inputClass} />
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => patch({ portfolio_links: [...(profile.portfolio_links ?? []), { title: "", url: "" }] })}
                      className="flex w-fit items-center gap-2 rounded-full border border-white/15 bg-white/[0.03] px-4 py-2 text-sm font-medium text-white/75 transition-colors hover:bg-white/[0.08]"
                    >
                      <Plus className="size-4" />
                      Add Link
                    </button>
                  </div>
                </CardSection>
              </>
            )}

            {activeSection === "visibility" && (
              <CardSection title="Visibility & Privacy" subtitle="Control who can see your profile and manage your privacy settings.">
                <div className="flex flex-col gap-7">
                  <div>
                    <p className="mb-3 text-[13px] font-medium text-white/70">Profile Visibility</p>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                      {(
                        [
                          { value: "public", label: "Public", description: "Visible to everyone", icon: Globe },
                          { value: "recruiters", label: "Recruiters Only", description: "Only recruiters can view", icon: Building2 },
                          { value: "private", label: "Private", description: "Hidden from everyone", icon: Lock },
                        ] as const
                      ).map((option) => {
                        const Icon = option.icon;
                        const selected = (profile.profile_visibility ?? "recruiters") === option.value;
                        return (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => patch({ profile_visibility: option.value })}
                            className={`flex flex-col items-start gap-2 rounded-2xl border p-4 text-left transition-colors ${selected ? "border-[#a855f7]/70 bg-[#a855f7]/[0.08]" : "border-white/10 bg-white/[0.02] hover:border-white/20"}`}
                          >
                            <span className={`flex size-9 items-center justify-center rounded-lg ${selected ? "bg-[#a855f7]/20 text-[#c084fc]" : "bg-white/[0.06] text-white/60"}`}>
                              <Icon className="size-4" />
                            </span>
                            <span className="text-sm font-semibold text-white">{option.label}</span>
                            <span className="text-xs text-white/45">{option.description}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <p className="mb-3 text-[13px] font-medium text-white/70">Privacy Settings</p>
                    <div className="flex flex-col divide-y divide-white/8">
                      {(
                        [
                          {
                            key: "show_contact_to_recruiters",
                            title: "Show contact to recruiters",
                            description: "Allow recruiters to see your email and phone",
                          },
                          {
                            key: "allow_profile_downloads",
                            title: "Allow profile downloads",
                            description: "Let others download your profile as PDF",
                          },
                        ] as const
                      ).map((setting) => (
                        <div key={setting.key} className="flex items-center justify-between gap-4 py-4">
                          <div>
                            <p className="text-sm font-medium text-white">{setting.title}</p>
                            <p className="mt-0.5 text-xs text-white/45">{setting.description}</p>
                          </div>
                          <Toggle checked={Boolean(profile[setting.key as keyof User])} onChange={(value) => patch({ [setting.key]: value } as Partial<User>)} label={setting.title} />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardSection>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
