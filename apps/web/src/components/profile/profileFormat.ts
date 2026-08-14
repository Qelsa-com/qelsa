import { City } from "@/types/city";
import { Certification } from "@/types/certification";
import { Education } from "@/types/education";
import { Experience } from "@/types/experience";
import { User } from "@/types/user";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function toDate(value?: Date | string | null): Date | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** "Jan 2023" */
export function formatMonthYear(value?: Date | string | null): string {
  const date = toDate(value);
  return date ? `${MONTHS[date.getMonth()]} ${date.getFullYear()}` : "";
}

/** Whole months between two dates, never negative. */
export function monthsBetween(start: Date, end: Date): number {
  return Math.max(0, (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth()));
}

/** 30 -> "2 yrs 6 mos" */
export function formatDuration(months: number): string {
  const years = Math.floor(months / 12);
  const remainder = months % 12;
  const parts: string[] = [];
  if (years) parts.push(`${years} ${years === 1 ? "yr" : "yrs"}`);
  if (remainder || !years) parts.push(`${remainder} ${remainder === 1 ? "mo" : "mos"}`);
  return parts.join(" ");
}

/** "Bangalore, Karnataka" */
export function formatCity(city?: City | null): string {
  if (!city?.name) return "";
  return city.state?.name ? `${city.name}, ${city.state.name}` : city.name;
}

/** Months a single role lasted; open-ended roles run to today. */
export function experienceMonths(experience: Experience): number {
  const start = toDate(experience.start_date);
  if (!start) return 0;
  const end = experience.is_current ? new Date() : toDate(experience.end_date) ?? new Date();
  return monthsBetween(start, end);
}

/** "Jan 2023 - Present · 2 yrs 6 mos · Bangalore, India" */
export function experienceMeta(experience: Experience): string {
  const start = formatMonthYear(experience.start_date);
  const end = experience.is_current ? "Present" : formatMonthYear(experience.end_date);
  const range = [start, end].filter(Boolean).join(" - ");
  const months = experienceMonths(experience);
  return [range, months ? formatDuration(months) : "", formatCity(experience.city)].filter(Boolean).join(" · ");
}

/** Responsibilities first, then any impact metrics, as flat bullet copy. */
export function experienceBullets(experience: Experience): string[] {
  const responsibilities = (experience.responsibilities ?? []).map((item) => item.title).filter(Boolean);
  const impacts = (experience.impact_metrics ?? [])
    .map((metric) => metric.description || [metric.impact_type, metric.impact_value].filter(Boolean).join(" "))
    .filter(Boolean);
  return [...responsibilities, ...impacts];
}

/** "B.Tech in Computer Science" */
export function educationDegree(education: Education): string {
  const degree = education.degree?.abbreviation || education.degree?.name || "";
  const field = education.field_of_study?.name || "";
  if (degree && field) return `${degree} in ${field}`;
  return degree || field || "Education";
}

/** "2015 - 2019 • Mumbai, India"; a single-year course collapses to just "2020". */
export function educationMeta(education: Education): string {
  const { start_year: start, end_year: end } = education;
  const years = start && end && start !== end ? `${start} - ${end}` : String(start || end || "");
  return [years, formatCity(education.city)].filter(Boolean).join(" • ");
}

/** "Issued May 2022 • Exp. May 2025" */
export function certificationMeta(certification: Certification): string {
  const issued = formatMonthYear(certification.issue_date);
  const parts = issued ? [`Issued ${issued}`] : [];
  if (!certification.does_not_expire && certification.expiration_date) {
    parts.push(`Exp. ${formatMonthYear(certification.expiration_date)}`);
  }
  return parts.join(" • ");
}

/** The role the person holds right now, else the most recently started one. */
export function currentExperience(experiences: Experience[]): Experience | undefined {
  const current = experiences.filter((experience) => experience.is_current);
  const pool = current.length ? current : experiences;
  return [...pool].sort((a, b) => (toDate(b.start_date)?.getTime() ?? 0) - (toDate(a.start_date)?.getTime() ?? 0))[0];
}

/** "5+ years exp." — total time across every role, rounded down. */
export function totalExperienceSummary(experiences: Experience[]): string {
  const months = experiences.reduce((sum, experience) => sum + experienceMonths(experience), 0);
  if (months < 12) return months ? `${months} mos exp.` : "";
  return `${Math.floor(months / 12)}+ years exp.`;
}

/**
 * Rough profile strength, used by the completion bar on the owner's own view.
 * Each section carries equal weight so the number moves as the profile fills in.
 */
export function profileCompletion(
  user: User | null | undefined,
  sections: { experiences: number; educations: number; certifications: number; skills: number }
): number {
  const checks = [
    Boolean(user?.name),
    Boolean(user?.username),
    Boolean(user?.profile_image || user?.avatar),
    Boolean(user?.headline),
    Boolean(user?.about || user?.professional_summary),
    Boolean(user?.city?.name),
    sections.experiences > 0,
    sections.educations > 0,
    sections.certifications > 0,
    sections.skills > 0,
  ];
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}

/** "Alex Johnson" -> "AJ" */
export function initials(name?: string): string {
  if (!name) return "";
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

/** 1200 -> "1.2k" */
export function compactCount(value: number): string {
  if (value < 1000) return String(value);
  return `${(value / 1000).toFixed(1).replace(/\.0$/, "")}k`;
}
