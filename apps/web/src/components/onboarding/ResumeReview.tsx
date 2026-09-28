"use client";

import type { ParsedEducation, ParsedExperience, ParsedProfile } from "@/lib/resumeDraft";
import { Briefcase, ChevronDown, ChevronUp, GraduationCap, Linkedin, Mail, MapPin, Pencil, Phone, Plus, X } from "lucide-react";
import Image from "next/image";
import { useState, type ReactNode } from "react";
import { ArrowRightIcon } from "./OnboardingShell";
import { PRIMARY_BTN } from "./styles";

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */

export function ResumeReview({
  profile,
  lockedEmail,
  onChange,
  onBack,
  onContinue,
  isSaving,
}: {
  profile: ParsedProfile;
  lockedEmail?: string;
  onChange: (profile: ParsedProfile) => void;
  onBack?: () => void;
  onContinue: () => void;
  isSaving?: boolean;
}) {
  const email = lockedEmail || profile.email || "";
  const [skillDraft, setSkillDraft] = useState("");
  const [editingSection, setEditingSection] = useState<string | null>(null);

  const patch = (partial: Partial<ParsedProfile>) => onChange({ ...profile, ...partial });

  const addSkill = () => {
    const name = skillDraft.trim();
    if (!name) return;
    if (!profile.skills.some((skill) => skill.toLowerCase() === name.toLowerCase())) {
      patch({ skills: [...profile.skills, name] });
    }
    setSkillDraft("");
  };

  const toggleEdit = (section: string) => {
    setEditingSection(editingSection === section ? null : section);
  };

  return (
    <div className="min-h-screen px-4 pb-28 pt-8" style={{ background: "var(--background)" }}>
      <div className="mx-auto max-w-2xl">
        <header className="mb-8 flex items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            {onBack ? (
              <button
                type="button"
                onClick={onBack}
                className="mr-2 text-sm text-muted-foreground transition-colors hover:text-white"
              >
                ← Back
              </button>
            ) : null}
            <Image src="/qelsa-logo.svg" alt="Qelsa" width={91} height={29} unoptimized className="h-[21px] w-auto shrink-0" />
            <h1 className="truncate text-lg text-muted-foreground">Check your details</h1>
          </div>
          <p className="hidden shrink-0 text-sm text-muted-foreground sm:block">Click any field to edit.</p>
        </header>

        {/* ---- Contact ---- */}
        <CardSection title="Contact">
          <div className="space-y-1">
            <span className="text-xs text-white/45">Full name</span>
            <EditableField
              value={profile.name ?? ""}
              placeholder="Your name"
              className="text-2xl font-semibold text-white"
              onChange={(name) => patch({ name })}
            />
          </div>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <LabeledField label="Email" icon={Mail}>
              <EditableField value={email} placeholder="you@email.com" disabled={Boolean(lockedEmail)} onChange={(value) => patch({ email: value })} />
            </LabeledField>
            <LabeledField label="Phone" icon={Phone}>
              <EditableField value={profile.phone ?? ""} placeholder="+1 (415) 555-0182" onChange={(phone) => patch({ phone })} />
            </LabeledField>
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <LabeledField label="Location" icon={MapPin}>
              <EditableField value={profile.location ?? ""} placeholder="San Francisco, CA" onChange={(location) => patch({ location })} />
            </LabeledField>
            <LabeledField label="LinkedIn" icon={Linkedin}>
              <EditableField value={profile.linkedin_url ?? ""} placeholder="linkedin.com/in/you" onChange={(linkedin_url) => patch({ linkedin_url })} />
            </LabeledField>
          </div>
        </CardSection>

        {/* ---- Summary ---- */}
        <CardSection title="Summary">
          <textarea
            value={profile.summary ?? ""}
            onChange={(event) => patch({ summary: event.target.value })}
            placeholder="A brief professional summary highlighting what makes you stand out..."
            rows={4}
            className="w-full resize-none rounded-xl border border-white/10 bg-white/[0.03] p-4 text-[15px] leading-relaxed text-white outline-none placeholder:text-muted-foreground focus:border-neon-purple/50"
          />
        </CardSection>

        {/* ---- Work Experience ---- */}
        <CardSection
          title="Work Experience"
          action={
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() =>
                  patch({
                    experiences: [...profile.experiences, { company: "", title: "", is_current: false, responsibilities: [], tools: [] }],
                  })
                }
                className="flex cursor-pointer items-center gap-1 text-sm text-neon-purple hover:text-white"
              >
                <Plus className="h-4 w-4" /> Add
              </button>
              {profile.experiences.length > 0 && (
                <button
                  type="button"
                  onClick={() => toggleEdit("experience")}
                  className="flex cursor-pointer items-center gap-1 text-sm text-neon-purple hover:text-white"
                >
                  <Pencil className="h-3.5 w-3.5" /> Edit
                </button>
              )}
            </div>
          }
        >
          {editingSection === "experience" ? (
            <div className="space-y-8">
              {profile.experiences.map((row, index) => (
                <ExperienceEditor
                  key={`exp-edit-${index}`}
                  row={row}
                  onChange={(next) => {
                    const experiences = profile.experiences.slice();
                    experiences[index] = next;
                    patch({ experiences });
                  }}
                  onRemove={() => patch({ experiences: profile.experiences.filter((_, i) => i !== index) })}
                />
              ))}
            </div>
          ) : (
            <ExperienceReadView experiences={profile.experiences} />
          )}
          {profile.experiences.length === 0 && (
            <p className="text-sm text-muted-foreground">No roles yet. Click + Add to add your work experience.</p>
          )}
        </CardSection>

        {/* ---- Skills & Expertise ---- */}
        <CardSection title="Skills & Expertise">
          <span className="mb-3 block text-xs font-medium uppercase tracking-wider text-white/45">Skills</span>
          <div className="flex flex-wrap gap-2">
            {profile.skills.map((skill) => (
              <button
                key={skill}
                type="button"
                onClick={() => patch({ skills: profile.skills.filter((item) => item !== skill) })}
                className="flex cursor-pointer items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-sm text-white transition-colors hover:border-neon-pink/50"
              >
                {skill}
                <X className="h-3 w-3 text-muted-foreground" />
              </button>
            ))}
            <input
              value={skillDraft}
              onChange={(event) => setSkillDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  addSkill();
                }
              }}
              placeholder="Add a skill..."
              className="w-32 rounded-full border border-dashed border-white/15 bg-transparent px-3 py-1.5 text-sm text-white outline-none placeholder:text-muted-foreground"
            />
          </div>
        </CardSection>

        {/* ---- Education ---- */}
        <CardSection
          title="Education"
          action={
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => patch({ educations: [...profile.educations, { school: "" }] })}
                className="flex cursor-pointer items-center gap-1 text-sm text-neon-purple hover:text-white"
              >
                <Plus className="h-4 w-4" /> Add
              </button>
              {profile.educations.length > 0 && (
                <button
                  type="button"
                  onClick={() => toggleEdit("education")}
                  className="flex cursor-pointer items-center gap-1 text-sm text-neon-purple hover:text-white"
                >
                  <Pencil className="h-3.5 w-3.5" /> Edit
                </button>
              )}
            </div>
          }
        >
          {editingSection === "education" ? (
            <div className="space-y-6">
              {profile.educations.map((row, index) => (
                <EducationEditor
                  key={`edu-edit-${index}`}
                  row={row}
                  onChange={(next) => {
                    const educations = profile.educations.slice();
                    educations[index] = next;
                    patch({ educations });
                  }}
                  onRemove={() => patch({ educations: profile.educations.filter((_, i) => i !== index) })}
                />
              ))}
            </div>
          ) : (
            <EducationReadView educations={profile.educations} />
          )}
          {profile.educations.length === 0 && (
            <p className="text-sm text-muted-foreground">No education yet. Click + Add to add your education.</p>
          )}
        </CardSection>
      </div>

      {/* ---- Sticky CTA ---- */}
      <div className="fixed inset-x-0 bottom-0 bg-gradient-to-t from-background via-background/95 to-transparent px-4 py-4">
        <button type="button" onClick={onContinue} disabled={isSaving} className={`mx-auto max-w-2xl ${PRIMARY_BTN}`}>
          {isSaving ? "Saving…" : "Looks good, continue"}
          {!isSaving ? <ArrowRightIcon /> : null}
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Card section wrapper (matches ProfileEditor's CardSection)         */
/* ------------------------------------------------------------------ */

function CardSection({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section className="mt-6 rounded-[20px] border border-white/10 bg-white/[0.03] p-5 sm:rounded-[24px] sm:p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold text-white">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Labeled field wrapper                                              */
/* ------------------------------------------------------------------ */

function LabeledField({ label, icon: Icon, children }: { label: string; icon: typeof Mail; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 flex items-center gap-1.5 text-xs text-white/45">
        {Icon && <Icon className="h-3 w-3" />}
        {label}
      </span>
      {children}
    </label>
  );
}

/* ------------------------------------------------------------------ */
/*  Editable field                                                     */
/* ------------------------------------------------------------------ */

function EditableField({
  value,
  onChange,
  placeholder,
  disabled,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <input
      value={value}
      disabled={disabled}
      placeholder={placeholder}
      onChange={(event) => onChange(event.target.value)}
      className={`w-full bg-transparent text-[15px] text-white outline-none placeholder:text-muted-foreground disabled:opacity-70 ${className ?? ""}`}
    />
  );
}

/* ------------------------------------------------------------------ */
/*  Experience — read-only view (profile-editor style)                 */
/* ------------------------------------------------------------------ */

type CompanyGroup = {
  company: string;
  roles: (ParsedExperience & { originalIndex: number })[];
  totalMonths: number;
};

function groupByCompany(experiences: ParsedExperience[]): CompanyGroup[] {
  const groups: Map<string, CompanyGroup> = new Map();
  experiences.forEach((exp, idx) => {
    const key = (exp.company || "Unknown Company").toLowerCase();
    if (!groups.has(key)) {
      groups.set(key, { company: exp.company || "Unknown Company", roles: [], totalMonths: 0 });
    }
    groups.get(key)!.roles.push({ ...exp, originalIndex: idx });
  });
  return Array.from(groups.values());
}

function formatDuration(months: number): string {
  const years = Math.floor(months / 12);
  const remaining = months % 12;
  if (years === 0) return `${remaining} mos`;
  if (remaining === 0) return `${years} yr${years > 1 ? "s" : ""}`;
  return `${years} yr${years > 1 ? "s" : ""} ${remaining} mos`;
}

function RoleBullets({ responsibilities }: { responsibilities: string[] }) {
  const [expanded, setExpanded] = useState(false);
  const bullets = responsibilities.filter((r) => r.trim());
  const visibleCount = 2;
  const shown = expanded ? bullets : bullets.slice(0, visibleCount);
  const hasMore = bullets.length > visibleCount;

  return (
    <div className="mt-2">
      {shown.map((bullet, i) => (
        <div key={i} className="flex items-start gap-2 py-0.5 text-sm text-white/70">
          <span className="mt-1.5 shrink-0 text-white/30">•</span>
          <span>{bullet}</span>
        </div>
      ))}
      {hasMore && (
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="mt-1 flex cursor-pointer items-center gap-1 text-xs text-neon-purple hover:text-white"
        >
          {expanded ? (
            <>Show less <ChevronUp className="h-3 w-3" /></>
          ) : (
            <>Show more <ChevronDown className="h-3 w-3" /></>
          )}
        </button>
      )}
    </div>
  );
}

function ExperienceReadView({ experiences }: { experiences: ParsedExperience[] }) {
  if (experiences.length === 0) return null;
  const groups = groupByCompany(experiences);

  return (
    <div className="space-y-6">
      {groups.map((group) => (
        <div key={group.company} className="flex gap-3">
          {/* Company icon */}
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.05]">
            <Briefcase className="h-5 w-5 text-white/40" />
          </div>

          <div className="min-w-0 flex-1">
            {/* Company name + total duration */}
            <div className="flex items-center gap-2">
              <span className="font-semibold text-white">{group.company}</span>
            </div>
            {group.roles.length > 1 && (
              <span className="text-xs text-white/45">
                {formatDuration(group.roles.length * 12)}
              </span>
            )}

            {/* Roles timeline */}
            <div className="mt-3 space-y-4">
              {group.roles.map((role, rIdx) => {
                const dateStr = [role.start, role.is_current ? "Present" : role.end].filter(Boolean).join(" – ");
                return (
                  <div key={rIdx} className="relative pl-4">
                    {/* Timeline dot */}
                    <div className="absolute left-0 top-1.5 h-2 w-2 rounded-full bg-neon-purple" />
                    {/* Timeline line */}
                    {rIdx < group.roles.length - 1 && (
                      <div className="absolute bottom-0 left-[3px] top-4 w-px bg-white/10" />
                    )}
                    <div>
                      <span className="font-medium text-white">{role.title || "Untitled Role"}</span>
                      <div className="mt-0.5 text-xs text-white/45">
                        {dateStr}
                      </div>
                      <RoleBullets responsibilities={role.responsibilities ?? []} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Experience — edit mode                                             */
/* ------------------------------------------------------------------ */

function experienceBody(row: ParsedExperience) {
  const bullets = (row.responsibilities ?? []).filter((item) => item.trim());
  if (bullets.length) return (row.responsibilities ?? []).join("\n");
  return row.description ?? "";
}

function ExperienceEditor({
  row,
  onChange,
  onRemove,
}: {
  row: ParsedExperience;
  onChange: (row: ParsedExperience) => void;
  onRemove: () => void;
}) {
  const [toolDraft, setToolDraft] = useState("");
  const addTool = () => {
    const name = toolDraft.trim();
    if (!name) return;
    const tools = row.tools ?? [];
    if (!tools.some((tool) => tool.toLowerCase() === name.toLowerCase())) {
      onChange({ ...row, tools: [...tools, name] });
    }
    setToolDraft("");
  };

  return (
    <div className="relative rounded-xl border border-white/10 bg-white/[0.02] p-4">
      <button type="button" onClick={onRemove} className="absolute right-3 top-3 cursor-pointer text-muted-foreground hover:text-white">
        <X className="h-4 w-4" />
      </button>
      <EditableField value={row.company} placeholder="Company" className="font-semibold" onChange={(company) => onChange({ ...row, company })} />
      <EditableField value={row.title} placeholder="Untitled role" className="mt-1" onChange={(title) => onChange({ ...row, title })} />
      <div className="mt-2 flex flex-wrap gap-2 text-sm text-muted-foreground">
        <input
          value={row.start ?? ""}
          placeholder="Start"
          onChange={(event) => onChange({ ...row, start: event.target.value })}
          className="w-28 bg-transparent outline-none"
        />
        <span>—</span>
        <input
          value={row.is_current ? "Present" : row.end ?? ""}
          placeholder="End"
          onChange={(event) => onChange({ ...row, end: event.target.value, is_current: event.target.value.toLowerCase() === "present" })}
          className="w-28 bg-transparent outline-none"
        />
      </div>
      <textarea
        value={experienceBody(row)}
        placeholder="What you worked on — one highlight per line"
        rows={Math.max(3, experienceBody(row).split("\n").length)}
        onChange={(event) =>
          onChange({
            ...row,
            description: undefined,
            responsibilities: event.target.value.split("\n"),
          })
        }
        className="mt-3 w-full resize-none bg-transparent text-sm leading-relaxed text-white outline-none placeholder:text-white/25"
      />
      <div className="mt-3 flex flex-wrap gap-2">
        {(row.tools ?? []).map((tool) => (
          <button
            key={tool}
            type="button"
            onClick={() => onChange({ ...row, tools: (row.tools ?? []).filter((item) => item !== tool) })}
            className="flex cursor-pointer items-center gap-1 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-xs text-white hover:border-neon-pink/50"
          >
            {tool}
            <X className="h-3 w-3 text-muted-foreground" />
          </button>
        ))}
        <input
          value={toolDraft}
          onChange={(event) => setToolDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              addTool();
            }
          }}
          placeholder="+ Tool"
          className="w-24 rounded-full border border-dashed border-white/15 bg-transparent px-2.5 py-1 text-xs text-white outline-none placeholder:text-muted-foreground"
        />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Education — read-only view                                         */
/* ------------------------------------------------------------------ */

function EducationReadView({ educations }: { educations: ParsedEducation[] }) {
  if (educations.length === 0) return null;

  return (
    <div className="space-y-5">
      {educations.map((edu, idx) => {
        const dateStr = [edu.start_year, edu.end_year].filter(Boolean).join(" – ");
        const degreeLine = [edu.degree, edu.field].filter(Boolean).join(" in ");

        return (
          <div key={idx} className="flex gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.05]">
              <GraduationCap className="h-5 w-5 text-white/40" />
            </div>
            <div className="min-w-0">
              <span className="font-medium text-white">{degreeLine || "Degree"}</span>
              <div className="text-sm text-neon-purple">{edu.school || "School"}</div>
              {dateStr && <div className="mt-0.5 text-xs text-white/45">{dateStr}</div>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Education — edit mode                                              */
/* ------------------------------------------------------------------ */

function EducationEditor({
  row,
  onChange,
  onRemove,
}: {
  row: ParsedEducation;
  onChange: (row: ParsedEducation) => void;
  onRemove: () => void;
}) {
  return (
    <div className="relative rounded-xl border border-white/10 bg-white/[0.02] p-4">
      <button type="button" onClick={onRemove} className="absolute right-3 top-3 cursor-pointer text-muted-foreground hover:text-white">
        <X className="h-4 w-4" />
      </button>
      <EditableField
        value={row.degree ?? ""}
        placeholder="Degree"
        className="font-semibold"
        onChange={(degree) => onChange({ ...row, degree })}
      />
      <EditableField value={row.school} placeholder="School" className="mt-1" onChange={(school) => onChange({ ...row, school })} />
      <EditableField value={row.field ?? ""} placeholder="Field of study" className="mt-1 text-sm text-muted-foreground" onChange={(field) => onChange({ ...row, field })} />
      <div className="mt-2 flex gap-3 text-sm text-muted-foreground">
        <input
          type="number"
          value={row.start_year ?? ""}
          placeholder="From"
          onChange={(event) => onChange({ ...row, start_year: event.target.value ? Number(event.target.value) : undefined })}
          className="w-24 bg-transparent outline-none"
        />
        <span>—</span>
        <input
          type="number"
          value={row.end_year ?? ""}
          placeholder="To"
          onChange={(event) => onChange({ ...row, end_year: event.target.value ? Number(event.target.value) : undefined })}
          className="w-24 bg-transparent outline-none"
        />
      </div>
    </div>
  );
}
