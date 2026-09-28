"use client";

import { EducationModal } from "@/components/profile/modals/EducationModal";
import { ExperienceModal } from "@/components/profile/modals/ExperienceModal";
import { SkillsModal } from "@/components/profile/modals/SkillsModal";
import type { ParsedEducation, ParsedExperience, ParsedProfile } from "@/lib/resumeDraft";
import type { Education } from "@/types/education";
import type { Experience } from "@/types/experience";
import { Briefcase, ChevronDown, ChevronUp, GraduationCap, Linkedin, Mail, MapPin, Pencil, Phone, Plus, X } from "lucide-react";
import Image from "next/image";
import { useState, type ReactNode } from "react";
import { ArrowRightIcon } from "./OnboardingShell";
import { PRIMARY_BTN } from "./styles";

/* ------------------------------------------------------------------ */
/*  Helpers for converting parsed items to modal types                */
/* ------------------------------------------------------------------ */

function toExperience(exp: ParsedExperience, index: number): Experience {
  return {
    id: `exp-${index}`,
    company: exp.company ? { id: "", name: exp.company } : undefined,
    job_title: exp.title ? { id: "", name: exp.title } : undefined,
    position: exp.title,
    start_date: exp.start,
    end_date: exp.end,
    is_current: exp.is_current,
    description: exp.description || (exp.responsibilities ?? []).join("\n"),
    responsibilities: (exp.responsibilities ?? []).map((r) => ({ title: r })),
    skills: (exp.tools ?? []).map((t) => ({ id: t, name: t })),
  } as unknown as Experience;
}

function toEducation(edu: ParsedEducation, index: number): Education {
  return {
    id: `edu-${index}`,
    college: edu.school ? { id: "", name: edu.school } : undefined,
    degree: edu.degree ? { id: "", name: edu.degree } : undefined,
    field_of_study: edu.field ? { id: "", name: edu.field } : undefined,
    start_year: edu.start_year,
    end_year: edu.end_year,
  } as unknown as Education;
}

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

  // Modal states for Work Experience, Education, and Skills
  const [expModalOpen, setExpModalOpen] = useState(false);
  const [activeExpIndex, setActiveExpIndex] = useState<number>(-1);

  const [eduModalOpen, setEduModalOpen] = useState(false);
  const [activeEduIndex, setActiveEduIndex] = useState<number>(-1);

  const [skillsModalOpen, setSkillsModalOpen] = useState(false);

  const patch = (partial: Partial<ParsedProfile>) => onChange({ ...profile, ...partial });

  const addSkill = () => {
    const name = skillDraft.trim();
    if (!name) return;
    if (!profile.skills.some((skill) => skill.toLowerCase() === name.toLowerCase())) {
      patch({ skills: [...profile.skills, name] });
    }
    setSkillDraft("");
  };

  /* Work Experience handlers */
  const handleOpenAddExp = () => {
    setActiveExpIndex(-1);
    setExpModalOpen(true);
  };

  const handleOpenEditExp = (index: number) => {
    setActiveExpIndex(index);
    setExpModalOpen(true);
  };

  const handleSaveExperience = (payload: {
    company: string;
    title: string;
    start?: string;
    end?: string;
    is_current: boolean;
    description?: string;
    responsibilities?: string[];
    tools?: string[];
  }) => {
    const nextExp: ParsedExperience = {
      company: payload.company,
      title: payload.title,
      start: payload.start,
      end: payload.end,
      is_current: payload.is_current,
      description: payload.description,
      responsibilities: payload.responsibilities,
      tools: payload.tools,
    };

    if (activeExpIndex >= 0 && activeExpIndex < profile.experiences.length) {
      const list = [...profile.experiences];
      list[activeExpIndex] = nextExp;
      patch({ experiences: list });
    } else {
      patch({ experiences: [...profile.experiences, nextExp] });
    }
    setExpModalOpen(false);
    setActiveExpIndex(-1);
  };

  const handleDeleteExperience = () => {
    if (activeExpIndex >= 0 && activeExpIndex < profile.experiences.length) {
      patch({ experiences: profile.experiences.filter((_, i) => i !== activeExpIndex) });
    }
    setExpModalOpen(false);
    setActiveExpIndex(-1);
  };

  /* Education handlers */
  const handleOpenAddEdu = () => {
    setActiveEduIndex(-1);
    setEduModalOpen(true);
  };

  const handleOpenEditEdu = (index: number) => {
    setActiveEduIndex(index);
    setEduModalOpen(true);
  };

  const handleSaveEducation = (payload: {
    school: string;
    degree?: string;
    field?: string;
    start_year?: number;
    end_year?: number;
  }) => {
    const nextEdu: ParsedEducation = {
      school: payload.school,
      degree: payload.degree,
      field: payload.field,
      start_year: payload.start_year,
      end_year: payload.end_year,
    };

    if (activeEduIndex >= 0 && activeEduIndex < profile.educations.length) {
      const list = [...profile.educations];
      list[activeEduIndex] = nextEdu;
      patch({ educations: list });
    } else {
      patch({ educations: [...profile.educations, nextEdu] });
    }
    setEduModalOpen(false);
    setActiveEduIndex(-1);
  };

  const handleDeleteEducation = () => {
    if (activeEduIndex >= 0 && activeEduIndex < profile.educations.length) {
      patch({ educations: profile.educations.filter((_, i) => i !== activeEduIndex) });
    }
    setEduModalOpen(false);
    setActiveEduIndex(-1);
  };

  /* Skills handler */
  const handleSaveSkills = (skills: string[]) => {
    patch({ skills });
    setSkillsModalOpen(false);
  };

  const currentExperienceItem =
    activeExpIndex >= 0 && activeExpIndex < profile.experiences.length
      ? toExperience(profile.experiences[activeExpIndex], activeExpIndex)
      : null;

  const currentEducationItem =
    activeEduIndex >= 0 && activeEduIndex < profile.educations.length
      ? toEducation(profile.educations[activeEduIndex], activeEduIndex)
      : null;

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
            <button
              type="button"
              onClick={handleOpenAddExp}
              className="flex cursor-pointer items-center gap-1 font-medium text-neon-cyan transition-opacity hover:opacity-80"
            >
              <span className="text-base leading-none">+</span>
              <span className="text-sm">Add</span>
            </button>
          }
        >
          <ExperienceReadView experiences={profile.experiences} onEdit={handleOpenEditExp} />
          {profile.experiences.length === 0 && (
            <p className="text-sm text-muted-foreground">No roles yet. Click + Add to add your work experience.</p>
          )}
        </CardSection>

        {/* ---- Skills & Expertise ---- */}
        <CardSection
          title="Skills & Expertise"
          action={
            <button
              type="button"
              onClick={() => setSkillsModalOpen(true)}
              className="flex cursor-pointer items-center gap-1 font-medium text-neon-cyan transition-opacity hover:opacity-80"
            >
              <span className="text-base leading-none">+</span>
              <span className="text-sm">Add</span>
            </button>
          }
        >
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
            <button
              type="button"
              onClick={handleOpenAddEdu}
              className="flex cursor-pointer items-center gap-1 font-medium text-neon-cyan transition-opacity hover:opacity-80"
            >
              <span className="text-base leading-none">+</span>
              <span className="text-sm">Add</span>
            </button>
          }
        >
          <EducationReadView educations={profile.educations} onEdit={handleOpenEditEdu} />
          {profile.educations.length === 0 && (
            <p className="text-sm text-muted-foreground">No education yet. Click + Add to add your education.</p>
          )}
        </CardSection>
      </div>

      {/* ---- Modals matching My Space / Profile edit ---- */}
      <ExperienceModal
        open={expModalOpen}
        onClose={() => {
          setExpModalOpen(false);
          setActiveExpIndex(-1);
        }}
        experience={currentExperienceItem}
        onCustomSave={handleSaveExperience}
        onCustomDelete={handleDeleteExperience}
      />

      <EducationModal
        open={eduModalOpen}
        onClose={() => {
          setEduModalOpen(false);
          setActiveEduIndex(-1);
        }}
        education={currentEducationItem}
        onCustomSave={handleSaveEducation}
        onCustomDelete={handleDeleteEducation}
      />

      <SkillsModal
        open={skillsModalOpen}
        onClose={() => setSkillsModalOpen(false)}
        initialSkills={profile.skills}
        onCustomSave={handleSaveSkills}
      />

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
/*  Experience — read-only view with Edit action                       */
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

function ExperienceReadView({
  experiences,
  onEdit,
}: {
  experiences: ParsedExperience[];
  onEdit: (originalIndex: number) => void;
}) {
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
                  <div key={rIdx} className="group relative pl-4">
                    {/* Timeline dot */}
                    <div className="absolute left-0 top-1.5 h-2 w-2 rounded-full bg-neon-purple" />
                    {/* Timeline line */}
                    {rIdx < group.roles.length - 1 && (
                      <div className="absolute bottom-0 left-[3px] top-4 w-px bg-white/10" />
                    )}
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-medium text-white">{role.title || "Untitled Role"}</span>
                        <button
                          type="button"
                          onClick={() => onEdit(role.originalIndex)}
                          title="Edit role"
                          className="flex size-7 shrink-0 items-center justify-center rounded-lg text-white/40 transition-colors hover:bg-white/10 hover:text-white"
                        >
                          <Pencil className="size-3.5" />
                        </button>
                      </div>
                      <div className="mt-0.5 text-xs text-white/45">
                        {dateStr}
                      </div>
                      <RoleBullets responsibilities={role.responsibilities ?? []} />
                      {(role.tools ?? []).length > 0 && (
                        <div className="mt-2.5 flex flex-wrap gap-1.5">
                          {role.tools?.map((tool) => (
                            <span
                              key={tool}
                              className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[11px] text-white/70"
                            >
                              {tool}
                            </span>
                          ))}
                        </div>
                      )}
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
/*  Education — read-only view with Edit action                        */
/* ------------------------------------------------------------------ */

function EducationReadView({
  educations,
  onEdit,
}: {
  educations: ParsedEducation[];
  onEdit: (index: number) => void;
}) {
  if (educations.length === 0) return null;

  return (
    <div className="space-y-5">
      {educations.map((edu, idx) => {
        const dateStr = [edu.start_year, edu.end_year].filter(Boolean).join(" – ");
        const degreeLine = [edu.degree, edu.field].filter(Boolean).join(" in ");

        return (
          <div key={idx} className="flex items-start justify-between gap-3">
            <div className="flex gap-3 min-w-0 flex-1">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.05]">
                <GraduationCap className="h-5 w-5 text-white/40" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="font-medium text-white">{degreeLine || "Degree"}</span>
                <div className="text-sm text-neon-purple">{edu.school || "School"}</div>
                {dateStr && <div className="mt-0.5 text-xs text-white/45">{dateStr}</div>}
              </div>
            </div>
            <button
              type="button"
              onClick={() => onEdit(idx)}
              title="Edit education"
              className="flex size-7 shrink-0 items-center justify-center rounded-lg text-white/40 transition-colors hover:bg-white/10 hover:text-white"
            >
              <Pencil className="size-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
