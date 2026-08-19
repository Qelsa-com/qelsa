"use client";

import type { ParsedEducation, ParsedExperience, ParsedProfile } from "@/lib/resumeDraft";
import { Briefcase, FileText, GraduationCap, Linkedin, Mail, MapPin, Phone, Plus, Tag, User, X } from "lucide-react";
import Image from "next/image";
import { useState, type ReactNode } from "react";
import { ArrowRightIcon } from "./OnboardingShell";
import { PRIMARY_BTN } from "./styles";

export function ResumeReview({
  profile,
  lockedEmail,
  onChange,
  onContinue,
  isSaving,
}: {
  profile: ParsedProfile;
  lockedEmail?: string;
  onChange: (profile: ParsedProfile) => void;
  onContinue: () => void;
  isSaving?: boolean;
}) {
  const email = lockedEmail || profile.email || "";
  const [skillDraft, setSkillDraft] = useState("");

  const patch = (partial: Partial<ParsedProfile>) => onChange({ ...profile, ...partial });

  const addSkill = () => {
    const name = skillDraft.trim();
    if (!name) return;
    if (!profile.skills.some((skill) => skill.toLowerCase() === name.toLowerCase())) {
      patch({ skills: [...profile.skills, name] });
    }
    setSkillDraft("");
  };

  return (
    <div className="min-h-screen px-4 pb-28 pt-8" style={{ background: "var(--background)" }}>
      <div className="mx-auto max-w-2xl">
        <header className="mb-8 flex items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <Image src="/qelsa-logo.svg" alt="Qelsa" width={91} height={29} unoptimized className="h-[21px] w-auto shrink-0" />
            <h1 className="truncate text-lg text-muted-foreground">Check your details</h1>
          </div>
          <p className="hidden shrink-0 text-sm text-muted-foreground sm:block">Click any field to edit.</p>
        </header>

        <Section icon={User} title="Contact">
          <Field
            value={profile.name ?? ""}
            placeholder="Your name"
            className="text-2xl font-semibold text-white"
            onChange={(name) => patch({ name })}
          />
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Labeled label="Email" icon={Mail}>
              <Field value={email} placeholder="you@email.com" disabled={Boolean(lockedEmail)} onChange={(value) => patch({ email: value })} />
            </Labeled>
            <Labeled label="Phone" icon={Phone}>
              <Field value={profile.phone ?? ""} placeholder="+1 (415) 555-0182" onChange={(phone) => patch({ phone })} />
            </Labeled>
            <Labeled label="Location" icon={MapPin}>
              <Field value={profile.location ?? ""} placeholder="San Francisco, CA" onChange={(location) => patch({ location })} />
            </Labeled>
            <Labeled label="LinkedIn" icon={Linkedin}>
              <Field value={profile.linkedin_url ?? ""} placeholder="linkedin.com/in/you" onChange={(linkedin_url) => patch({ linkedin_url })} />
            </Labeled>
          </div>
        </Section>

        <Section icon={FileText} title="Summary">
          <textarea
            value={profile.summary ?? ""}
            onChange={(event) => patch({ summary: event.target.value })}
            placeholder="A brief professional summary highlighting what makes you stand out..."
            rows={4}
            className="w-full resize-none bg-transparent text-[15px] leading-relaxed text-white outline-none placeholder:text-muted-foreground"
          />
        </Section>

        <Section
          icon={Briefcase}
          title="Work experience"
          action={
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
          }
        >
          <div className="space-y-8">
            {profile.experiences.map((row, index) => (
              <ExperienceEditor
                key={`exp-${index}`}
                row={row}
                onChange={(next) => {
                  const experiences = profile.experiences.slice();
                  experiences[index] = next;
                  patch({ experiences });
                }}
                onRemove={() => patch({ experiences: profile.experiences.filter((_, i) => i !== index) })}
              />
            ))}
            {profile.experiences.length === 0 ? (
              <p className="text-sm text-muted-foreground">No roles yet. Add one if you want it on your profile.</p>
            ) : null}
          </div>
        </Section>

        <Section
          icon={GraduationCap}
          title="Education"
          action={
            <button
              type="button"
              onClick={() => patch({ educations: [...profile.educations, { school: "" }] })}
              className="flex cursor-pointer items-center gap-1 text-sm text-neon-purple hover:text-white"
            >
              <Plus className="h-4 w-4" /> Add
            </button>
          }
        >
          <div className="space-y-6">
            {profile.educations.map((row, index) => (
              <EducationEditor
                key={`edu-${index}`}
                row={row}
                onChange={(next) => {
                  const educations = profile.educations.slice();
                  educations[index] = next;
                  patch({ educations });
                }}
                onRemove={() => patch({ educations: profile.educations.filter((_, i) => i !== index) })}
              />
            ))}
            {profile.educations.length === 0 ? (
              <p className="text-sm text-muted-foreground">No education yet.</p>
            ) : null}
          </div>
        </Section>

        <Section
          icon={Tag}
          title="Skills"
          action={
            <button type="button" onClick={addSkill} className="flex cursor-pointer items-center gap-1 text-sm text-neon-purple hover:text-white">
              <Plus className="h-4 w-4" /> Add
            </button>
          }
        >
          <div className="flex flex-wrap gap-2">
            {profile.skills.map((skill) => (
              <button
                key={skill}
                type="button"
                onClick={() => patch({ skills: profile.skills.filter((item) => item !== skill) })}
                className="flex cursor-pointer items-center gap-1 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-sm text-white hover:border-neon-pink/50"
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
              placeholder="+ Add skill"
              className="w-32 rounded-full border border-dashed border-white/15 bg-transparent px-3 py-1.5 text-sm text-white outline-none placeholder:text-muted-foreground"
            />
          </div>
        </Section>
      </div>

      <div className="fixed inset-x-0 bottom-0 bg-gradient-to-t from-background via-background/95 to-transparent px-4 py-4">
        <button type="button" onClick={onContinue} disabled={isSaving} className={`mx-auto max-w-2xl ${PRIMARY_BTN}`}>
          {isSaving ? "Saving…" : "Looks good, continue"}
          {!isSaving ? <ArrowRightIcon /> : null}
        </button>
      </div>
    </div>
  );
}

function Section({
  icon: Icon,
  title,
  action,
  children,
}: {
  icon: typeof User;
  title: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="mt-6 rounded-3xl border border-white/10 bg-white/[0.03] p-6">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium text-white">
          <Icon className="h-4 w-4 text-neon-purple" />
          {title}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function Labeled({ label, icon: Icon, children }: { label: string; icon: typeof Mail; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 flex items-center gap-1.5 text-xs text-muted-foreground">
        <Icon className="h-3 w-3" />
        {label}
      </span>
      {children}
    </label>
  );
}

function Field({
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
    <div className="relative border-l border-white/10 pl-4">
      <button type="button" onClick={onRemove} className="absolute right-0 top-0 cursor-pointer text-muted-foreground hover:text-white">
        <X className="h-4 w-4" />
      </button>
      <Field value={row.company} placeholder="Company" className="font-semibold" onChange={(company) => onChange({ ...row, company })} />
      <Field value={row.title} placeholder="Untitled role" className="mt-1" onChange={(title) => onChange({ ...row, title })} />
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
        value={row.description ?? ""}
        placeholder="What you worked on..."
        rows={3}
        onChange={(event) => onChange({ ...row, description: event.target.value })}
        className="mt-3 w-full resize-none bg-transparent text-sm leading-relaxed text-muted-foreground outline-none placeholder:text-white/25"
      />
      <textarea
        value={(row.responsibilities ?? []).join("\n")}
        placeholder="Highlights — one per line"
        rows={3}
        onChange={(event) =>
          onChange({
            ...row,
            responsibilities: event.target.value.split("\n"),
          })
        }
        className="mt-2 w-full resize-none bg-transparent text-sm leading-relaxed text-muted-foreground outline-none placeholder:text-white/25"
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
    <div className="relative">
      <button type="button" onClick={onRemove} className="absolute right-0 top-0 cursor-pointer text-muted-foreground hover:text-white">
        <X className="h-4 w-4" />
      </button>
      <Field
        value={row.degree ?? ""}
        placeholder="Degree"
        className="font-semibold"
        onChange={(degree) => onChange({ ...row, degree })}
      />
      <Field value={row.school} placeholder="School" className="mt-1" onChange={(school) => onChange({ ...row, school })} />
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
      <Field value={row.field ?? ""} placeholder="Field of study" className="mt-2 text-sm text-muted-foreground" onChange={(field) => onChange({ ...row, field })} />
    </div>
  );
}
