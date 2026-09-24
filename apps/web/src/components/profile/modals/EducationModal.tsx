"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../../ui/alert-dialog";
import { Autocomplete, AutocompleteOption } from "../../ui/autocomplete";
import { Button } from "../../ui/button";
import { useCreateEducationMutation, useDeleteEducationMutation, useUpdateEducationMutation } from "@/features/api/educationsApi";
import { useLazyGetCollegesQuery, useLazyGetDegreeNamesQuery, useLazyGetFieldsOfStudyQuery, useLazySearchCitiesQuery } from "@/features/api/seedApi";
import { toastUnknownError } from "@/lib/errors";
import { City } from "@/types/city";
import { Education } from "@/types/education";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { CheckboxRow, Field, YearSelect, inputClass } from "./fields";
import { GhostButton, GradientButton, ModalShell } from "./ModalShell";

interface EducationModalProps {
  open: boolean;
  onClose: () => void;
  education?: Education | null;
}

export function EducationModal({ open, onClose, education }: EducationModalProps) {
  const educationId = (education?.id ?? (education as unknown as { _id?: string })?._id) as string | undefined;
  const isEdit = Boolean(educationId);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteEducation] = useDeleteEducationMutation();

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
    const currentYear = new Date().getFullYear();
    setStartYear(education?.start_year ?? null);
    setEndYear(education?.end_year ?? null);
    setStudying(Boolean(
      (education?.start_year && !education?.end_year) ||
      (education?.end_year && education.end_year > currentYear)
    ));
    setCity(education?.city ?? null);
    setGrade(education?.grade ?? "");
  }, [open, education]);

  if (!open) return null;

  const currentYear = new Date().getFullYear();

  const handleSubmit = async () => {
    const collegeName = college?.name ?? collegeText.trim();
    const degreeName = degree?.name ?? degreeText.trim();
    if (!collegeName) return toast.error("Institution is required");
    if (!degreeName) return toast.error("Degree / program is required");
    if (!startYear) return toast.error("Start year is required");
    if (startYear > currentYear + 1) return toast.error("Start year cannot be more than 1 year in the future");
    if (!studying && !endYear) return toast.error("End year is required (or mark as currently studying)");
    if (endYear && endYear > currentYear + 10) return toast.error("End year cannot exceed 10 years in the future");
    if (endYear && startYear && endYear < startYear) return toast.error("End year cannot be before the start year");

    const payload = {
      college: college?.id ? { id: college.id } : { name: collegeName },
      degree: degree?.id ? { id: degree.id } : { name: degreeName },
      field_of_study: field?.id ? { id: field.id } : fieldText.trim() ? { name: fieldText.trim() } : null,
      start_year: startYear,
      end_year: endYear ?? null,
      grade: grade.trim() || undefined,
      city: city ? { id: city.id } : null,
    };

    setSaving(true);
    try {
      if (isEdit) {
        await updateEducation({ id: educationId!, data: payload }).unwrap();
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

  const handleDelete = async () => {
    if (!educationId) return;
    setIsDeleting(true);
    try {
      await deleteEducation(educationId).unwrap();
      toast.success("Education deleted");
      setShowDeleteConfirm(false);
      onClose();
    } catch (error) {
      toastUnknownError(error, "Could not delete education. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <ModalShell
        title={isEdit ? "Edit education" : "Add education"}
        onClose={onClose}
        footer={
          <>
            {isEdit && (
              <button
                type="button"
                disabled={saving || isDeleting}
                onClick={() => setShowDeleteConfirm(true)}
                className="mr-auto inline-flex items-center gap-1 sm:gap-1.5 text-xs font-medium text-red-400 whitespace-nowrap shrink-0 transition-colors hover:text-red-300 disabled:opacity-50"
              >
                <Trash2 className="size-3.5 shrink-0" />
                <span className="hidden sm:inline">Delete education</span>
                <span className="sm:hidden">Delete</span>
              </button>
            )}
            <div className="flex items-center gap-2 sm:gap-3 ml-auto">
              <GhostButton onClick={onClose} disabled={saving || isDeleting}>
                Cancel
              </GhostButton>
              <GradientButton onClick={handleSubmit} disabled={saving || isDeleting}>
                {saving ? "Saving…" : isEdit ? "Save changes" : "Add education"}
              </GradientButton>
            </div>
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
              <YearSelect value={startYear} onChange={setStartYear} maxYear={currentYear + 1} />
            </Field>
            <Field label="End Year (or expected)" required={!studying}>
              <YearSelect
                value={endYear}
                onChange={(year) => {
                  setEndYear(year);
                  if (year && year > currentYear) {
                    setStudying(true);
                  }
                }}
                minYear={startYear ?? 1970}
                maxYear={currentYear + 10}
              />
            </Field>
          </div>

          <CheckboxRow
            checked={studying}
            onChange={(value) => {
              setStudying(value);
              if (value && endYear && endYear <= currentYear) {
                setEndYear(null);
              }
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

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent className="border border-white/12 bg-[#0c0c1a] text-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg font-semibold text-white">Delete education?</AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-white/60">
              Are you sure you want to delete this education? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting} className="border-white/12 bg-white/5 text-white hover:bg-white/10">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={isDeleting}
              onClick={handleDelete}
              className="bg-red-500 text-white hover:bg-red-600"
            >
              {isDeleting ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
