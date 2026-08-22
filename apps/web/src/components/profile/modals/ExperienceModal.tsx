"use client";

import { useCreateExperienceMutation, useUpdateExperienceMutation } from "@/features/api/experiencesApi";
import { useLazySearchCitiesQuery, useLazySearchCompaniesQuery, useLazySearchJobTitlesQuery } from "@/features/api/seedApi";
import { toastUnknownError } from "@/lib/errors";
import { City } from "@/types/city";
import { Experience } from "@/types/experience";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Autocomplete, AutocompleteOption } from "../../ui/autocomplete";
import { CheckboxRow, Field, MonthYearSelect, Select, inputClass, monthValueToIso, toMonthValue } from "./fields";
import { GradientButton, GhostButton, ModalShell } from "./ModalShell";
import { PickedSkill, SkillPicker } from "./SkillPicker";

const EMPLOYMENT_TYPES = ["Full-time", "Part-time", "Contract", "Internship", "Freelance"];
const WORK_TYPES = ["On-site", "Hybrid", "Remote"];

interface ExperienceModalProps {
  open: boolean;
  onClose: () => void;
  /** When set, the modal edits this experience instead of creating a new one. */
  experience?: Experience | null;
}

function bulletsFromDescription(text: string) {
  return text
    .split("\n")
    .map((line) => line.replace(/^[-•*\d.)\s]+/, "").trim())
    .filter(Boolean)
    .map((title) => ({ title }));
}

function descriptionFromExperience(experience?: Experience | null) {
  if (!experience) return "";
  if (experience.description) return experience.description;
  return (experience.responsibilities ?? []).map((r) => `• ${r.title}`).join("\n");
}

export function ExperienceModal({ open, onClose, experience }: ExperienceModalProps) {
  const isEdit = Boolean(experience?.id);

  const [jobTitle, setJobTitle] = useState<AutocompleteOption | null>(null);
  const [jobTitleText, setJobTitleText] = useState("");
  const [company, setCompany] = useState<AutocompleteOption | null>(null);
  const [companyText, setCompanyText] = useState("");
  const [employmentType, setEmploymentType] = useState("");
  const [start, setStart] = useState<string | null>(null);
  const [end, setEnd] = useState<string | null>(null);
  const [isCurrent, setIsCurrent] = useState(false);
  const [city, setCity] = useState<City | null>(null);
  const [workType, setWorkType] = useState("");
  const [description, setDescription] = useState("");
  const [skills, setSkills] = useState<PickedSkill[]>([]);
  const [saving, setSaving] = useState(false);

  const [searchJobTitles, { data: jobTitleOptions = [] }] = useLazySearchJobTitlesQuery();
  const [searchCompanies, { data: companyOptions = [] }] = useLazySearchCompaniesQuery();
  const [searchCities, { data: cityOptions = [] }] = useLazySearchCitiesQuery();
  const [createExperience] = useCreateExperienceMutation();
  const [updateExperience] = useUpdateExperienceMutation();

  useEffect(() => {
    if (!open) return;
    setJobTitle(experience?.job_title ? { id: experience.job_title.id, name: experience.job_title.name } : null);
    setJobTitleText(experience?.job_title?.name ?? experience?.position ?? "");
    setCompany(experience?.company ? { id: experience.company.id, name: experience.company.name } : null);
    setCompanyText(experience?.company?.name ?? "");
    setEmploymentType(experience?.employment_type ?? "");
    setStart(toMonthValue(experience?.start_date));
    setEnd(experience?.is_current ? null : toMonthValue(experience?.end_date));
    setIsCurrent(Boolean(experience?.is_current));
    setCity(experience?.city ?? null);
    setWorkType(experience?.work_type ?? "");
    setDescription(descriptionFromExperience(experience));
    setSkills((experience?.skills ?? []).map((s) => ({ id: s.id, name: s.name })));
  }, [open, experience]);

  if (!open) return null;

  const handleSubmit = async () => {
    const titleName = jobTitle?.name ?? jobTitleText.trim();
    const companyName = company?.name ?? companyText.trim();
    if (!titleName) return toast.error("Job title is required");
    if (!companyName) return toast.error("Company name is required");
    if (!start) return toast.error("Start date is required");
    if (!isCurrent && !end) return toast.error("End date is required (or mark as current)");

    const payload = {
      job_title: jobTitle?.id ? { id: jobTitle.id } : { name: titleName },
      company: company?.id ? { id: company.id } : { name: companyName },
      employment_type: employmentType || undefined,
      start_date: monthValueToIso(start),
      end_date: isCurrent ? undefined : monthValueToIso(end),
      is_current: isCurrent,
      city: city ? { id: city.id } : undefined,
      work_type: workType || undefined,
      description: description.trim() || undefined,
      responsibilities: bulletsFromDescription(description),
      skills: skills.map((s) => ({ id: s.id })),
    };

    setSaving(true);
    try {
      if (isEdit) {
        await updateExperience({ id: experience!.id!, data: payload }).unwrap();
        toast.success("Experience updated");
      } else {
        await createExperience(payload).unwrap();
        toast.success("Experience added");
      }
      onClose();
    } catch (error) {
      toastUnknownError(error, "Could not save the experience. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalShell
      title={isEdit ? "Edit work experience" : "Add work experience"}
      onClose={onClose}
      footer={
        <>
          <GhostButton onClick={onClose} disabled={saving}>
            Cancel
          </GhostButton>
          <GradientButton onClick={handleSubmit} disabled={saving}>
            {saving ? "Saving…" : isEdit ? "Save changes" : "Add experience"}
          </GradientButton>
        </>
      }
    >
      <div className="flex flex-col gap-5">
        <Field label="Job Title" required>
          <Autocomplete
            value={jobTitle}
            onChange={setJobTitle}
            onSearch={(q) => searchJobTitles(q)}
            options={jobTitleOptions as AutocompleteOption[]}
            placeholder="Enter job title"
            allowFreeText
            onQueryChange={setJobTitleText}
            minChars={1}
            inputClassName={inputClass}
          />
        </Field>

        <Field label="Company Name" required>
          <Autocomplete
            value={company}
            onChange={setCompany}
            onSearch={(q) => searchCompanies(q)}
            options={companyOptions as AutocompleteOption[]}
            placeholder="Enter company name"
            allowFreeText
            onQueryChange={setCompanyText}
            minChars={1}
            inputClassName={inputClass}
          />
        </Field>

        <Field label="Employment Type">
          <Select value={employmentType} onChange={setEmploymentType} placeholder="Select type">
            {EMPLOYMENT_TYPES.map((type) => (
              <option key={type} value={type} className="bg-[#12122a]">
                {type}
              </option>
            ))}
          </Select>
        </Field>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Start Date" required>
            <MonthYearSelect value={start} onChange={setStart} />
          </Field>
          <Field label="End Date" required={!isCurrent}>
            {isCurrent ? <div className={`${inputClass} text-white/45`}>Present</div> : <MonthYearSelect value={end} onChange={setEnd} />}
          </Field>
        </div>

        <CheckboxRow
          checked={isCurrent}
          onChange={(value) => {
            setIsCurrent(value);
            if (value) setEnd(null);
          }}
          label="I currently work here"
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Location">
            <Autocomplete<City>
              value={city}
              onChange={setCity}
              onSearch={(q) => searchCities(q)}
              options={cityOptions as City[]}
              placeholder="Enter location"
              getInputLabel={(c) => (c.state?.name ? `${c.name}, ${c.state.name}` : c.name)}
              renderOption={(c) => (c.state?.name ? `${c.name}, ${c.state.name}` : c.name)}
              minChars={1}
              inputClassName={inputClass}
            />
          </Field>
          <Field label="Work Type">
            <Select value={workType} onChange={setWorkType}>
              {WORK_TYPES.map((type) => (
                <option key={type} value={type} className="bg-[#12122a]">
                  {type}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <Field label="Skills Used">
          <SkillPicker selected={skills} onChange={setSkills} />
        </Field>

        <Field label="Description">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe your role and responsibilities…"
            rows={4}
            className={`${inputClass} resize-none`}
          />
        </Field>
      </div>
    </ModalShell>
  );
}
