export type ParsedExperience = {
  company: string;
  title: string;
  start?: string;
  end?: string;
  is_current: boolean;
  description?: string;
};

export type ParsedEducation = {
  school: string;
  degree?: string;
  field?: string;
  start_year?: number;
  end_year?: number;
};

export type ParsedProfile = {
  name?: string;
  email?: string;
  phone?: string;
  location?: string;
  linkedin_url?: string;
  summary?: string;
  headline?: string;
  experiences: ParsedExperience[];
  educations: ParsedEducation[];
  skills: string[];
};

export type ResumeDraft = {
  profile: ParsedProfile;
  storageId?: string;
  filename?: string;
  reviewed: boolean;
};

const DRAFT_KEY = "qelsa.resumeDraft";

export function emptyParsedProfile(): ParsedProfile {
  return { experiences: [], educations: [], skills: [] };
}

export function readResumeDraft(): ResumeDraft | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as ResumeDraft;
  } catch {
    return null;
  }
}

export function writeResumeDraft(draft: ResumeDraft) {
  sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
}

export function clearResumeDraft() {
  sessionStorage.removeItem(DRAFT_KEY);
}
