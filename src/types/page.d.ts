import { Job } from "./job";
import { User } from "./user";

export type Page = {
  id?: number;
  name: string;
  type?: string;
  industry?: string;
  website?: string;
  tagline?: string;
  description?: string;
  logo?: string;
  linkedin_url?: string;
  twitter_url?: string;
  facebook_url?: string;
  instagram_url?: string;
  youtube_url?: string;
  can_manage?: boolean;
  owner?: User;
  jobs?: Job[];

  // Extended company profile fields
  slug?: string | null;
  heroImage?: string | null;
  companySize?: string | null;
  foundedYear?: number | string | null;
  headquarters?: string | null;
  primaryIndustry?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  tags?: string[];
  culture?: {
    tagline?: string | null;
    cultureStatement?: string | null;
    jobMatchingImportance?: string | null;
    attributes?: string[];
    values?: { id: string; title?: string; description?: string }[];
    highlights?: { id: string; text: string }[];
  } | null;
  socials?: Record<string, string> | null;
};
