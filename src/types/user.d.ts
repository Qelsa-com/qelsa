import { Education } from "./education";
import { Experience } from "./experience";
import { UserSkill } from "./userSkill";

export type User = {
  id?: number | string;
  name?: string;
  email: string;
  profile_image?: string;
  pronoun?: string;
  linkedin_url?: string;
  github_url?: string;
  twitter_url?: string;
  other_social_link?: string;
  show_contact_to_recruiters?: boolean;
  allow_profile_downloads?: boolean;
  profile_view_analytics?: boolean;
  profile_visibility?: string;
  headline?: string;
  expected_min_salary?: number;
  expected_max_salary?: number;
  expected_salary_currency?: string;
  nationality?: string;
  location?: string;
  phone?: string;
  username?: string;
  custom_profile_url?: string;
  want_to_relocate?: boolean;
  work_preference?: string;
  professional_summary?: string;
  preffer_full_time?: boolean;
  preffer_contract?: boolean;
  preffer_internship?: boolean;
  preffer_freelance?: boolean;
  role: "user" | "admin" | "owner" | "editor" | "moderator" | "viewer";
  website?: string;
  profile_type?: "student" | "professional" | "career-switcher";
  find_job?: boolean;
  explore_career?: boolean;
  upskill_and_learn?: boolean;
  prepare_interview?: boolean;
  password?: string;
  gender?: string;
  dob?: string;
  is_active?: boolean;
  about?: string;
  last_login_at?: string;
  city?: string;
  relocate_location?: string;
  show_phone_number?: boolean

  skills?: UserSkill[];
  educations?: Education[];
  experiences?: Experience[];

  // Extended UI fields
  avatar?: string | null;
  title?: string | null;
  status?: string | null;
  isVerified?: boolean;
  lastActiveAt?: string | null;
};
