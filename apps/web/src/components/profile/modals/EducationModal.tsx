"use client";

import { useCreateEducationMutation, useUpdateEducationMutation } from "@/features/api/educationsApi";
import { useLazyGetDegreeNamesQuery, useLazyGetFieldsOfStudyQuery, useLazyGetCollegesQuery, useLazySearchCitiesQuery } from "@/features/api/seedApi";
import { toastUnknownError } from "@/lib/errors";
import { City } from "@/types/city";
import { Education } from "@/types/education";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Autocomplete, AutocompleteOption } from "../../ui/autocomplete";
import { CheckboxRow, Field, YearSelect, inputClass } from "./fields";
import { GradientButton, GhostButton, ModalShell } from "./ModalShell";

interface EducationModalProps {
  open: boolean;
  onClose: () => void;
  education?: Education | null;
}

export function EducationModal({ open, onClose, education }: EducationModalProps) {
  const isEdit = Boolean(education?.id);

  const [college, setCollege] = useState<AutocompleteOption | null>(null);
  const [collegeText, setCollegeText] = useState("");
  const [degree, setDegree] = useState<AutocompleteOption | null>(null);
  const [degreeText, setDegreeText] = useState("");
  const [field, setField] = useState<AutocompleteOption | null>(null);
  const [fieldText, setFieldText] = useState("");
  const [startYear, setStartYear] = useState<number | null>(null);
  const [endYear, setEndYear] = useState<number | null>(null);
  const [studying, setStudying] = useState(false);
  const [city, setCity] = useState<City | null>(null);
  const [grade, setGrade] = useState("");
  const [saving, setSaving] = useState(false);

  const [searchColleges, { data: collegeOptions = [] }] = useLazyGetCollegesQuery();
  const [searchDegrees, { data: degreeOptions = [] }] = useLazyGetDegreeNamesQuery();
  const [searchFields, { data: fieldOptions = [] }] = useLazyGetFieldsOfStudyQuery();
  const [searchCities, { data: cityOptions = [] }] = useLazySearchCitiesQuery();
  const [createEducation] = useCreateEducationMutation();
  const [updateEducation] = useUpdateEducationMutation();

  useEffect(() => {
    if (!open) return;
    setCollege(education?.college ? { id: education.college.id, name: education.college.name } : null);
    setCollegeText(education?.college?.name ?? "");
    setDegree(education?.degree ? { id: education.degree.id, name: education.degree.name } : null);
    setDegreeText(education?.degree?.name ?? "");
    setField(education?.field_of_study ? { id: education.field_of_study.id, name: education.field_of_study.name } : null);
    setFieldText(education?.field_of_study?.name ?? "");
    setStartYear(education?.start_year ?? null);
    setEndYear(education?.end_year ?? null);
    setStudying(Boolean(education?.start_year && !education?.end_year));
    setCity(education?.city ?? null);
    setGrade(education?.grade ?? "");
  }, [open, education]);

  if (!open) return null;

  const handleSubmit = async () => {
    const collegeName = college?.name ?? collegeText.trim();
    const degreeName = degree?.name ?? degreeText.trim();
    if (!collegeName) return toast.error("Institution is required");
    if (!degreeName) return toast.error("Degree / program is required");
    if (!startYear) return toast.error("Start year is required");
    if (!studying && !endYear) return toast.error("End year is required (or mark as currently studying)");
    if (endYear && startYear && endYear < startYear) return toast.error("End year cannot be before the start year");

    const payload = {
      college: college?.id ? { id: college.id } : { name: collegeName },
      degree: degree?.id ? { id: degree.id } : { name: degreeName },
      field_of_study: field?.id ? { id: field.id } : fieldText.trim() ? { name: fieldText.trim() } : undefined,
      start_year: startYear,
      end_year: studying ? undefined : (endYear ?? undefined),
      grade: grade.trim() || undefined,
      city: city ? { id: city.id } : undefined,
    };

    setSaving(true);
    try {
      if (isEdit) {
        await updateEducation({ id: education!.id!, data: payload }).unwrap();
        toast.success("Education updated");
      } else {
        await createEducation(payload).unwrap();
        toast.success("Education added");
      }
      onClose();
    } catch (error) {
      toastUnknownError(error, "Could not save the education. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalShell
      title={isEdit ? "Edit education" : "Add education"}
      onClose={onClose}
      footer={
        <>
          <GhostButton onClick={onClose} disabled={saving}>
            Cancel
          </GhostButton>
          <GradientButton onClick={handleSubmit} disabled={saving}>
            {saving ? "Saving…" : isEdit ? "Save changes" : "Add education"}
          </GradientButton>
        </>
      }
    >
      <div className="flex flex-col gap-5">
        <Field label="Institution" required>
          <Autocomplete
            value={college}
            onChange={setCollege}
            onSearch={(q) => searchColleges(q)}
            options={collegeOptions as AutocompleteOption[]}
            placeholder="Enter institution name"
            allowFreeText
            onQueryChange={setCollegeText}
            minChars={1}
            inputClassName={inputClass}
          />
        </Field>

        <Field label="Degree / Program" required>
          <Autocomplete
            value={degree}
            onChange={setDegree}
            onSearch={(q) => searchDegrees(q)}
            options={degreeOptions as AutocompleteOption[]}
            placeholder="Enter degree / program"
            allowFreeText
            onQueryChange={setDegreeText}
            minChars={1}
            inputClassName={inputClass}
          />
        </Field>

        <Field label="Major / Specialisation">
          <Autocomplete
            value={field}
            onChange={setField}
            onSearch={(q) => searchFields(q)}
            options={fieldOptions as AutocompleteOption[]}
            placeholder="Enter major / specialisation"
            allowFreeText
            onQueryChange={setFieldText}
            minChars={1}
            inputClassName={inputClass}
          />
        </Field>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Start Year" required>
            <YearSelect value={startYear} onChange={setStartYear} />
          </Field>
          <Field label="End Year" required={!studying}>
            <YearSelect value={studying ? null : endYear} onChange={setEndYear} disabled={studying} />
          </Field>
        </div>

        <CheckboxRow
          checked={studying}
          onChange={(value) => {
            setStudying(value);
            if (value) setEndYear(null);
          }}
          label="I currently study here"
        />

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

        <Field label="Grade / CGPA">
          <input value={grade} onChange={(e) => setGrade(e.target.value)} placeholder="Enter grade / CGPA (optional)" className={inputClass} />
        </Field>
      </div>
    </ModalShell>
  );
}
