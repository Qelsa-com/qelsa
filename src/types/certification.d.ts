import { Skill } from "./userSkill";

// An entry from the open certification catalog (GET /api/seed/certifications)
export type CertificationCatalog = {
  id: number;
  name: string;
  abbreviation?: string | null;
  issuing_body?: IssuingBody | null;
};

// An entry from the issuing-body catalog (GET /api/seed/issuing-bodies)
export type IssuingBody = {
  id: number;
  name: string;
  website?: string | null;
  country?: string | null;
};

// A user's saved certification (GET/POST/PUT /api/certifications) — snake_case,
// with resolved nested objects rather than raw ids.
export type Certification = {
  id: number;
  issue_date: string;
  expiration_date?: string | null;
  does_not_expire: boolean;
  credential_id?: string | null;
  credential_url?: string | null;
  description?: string | null;
  certification: CertificationCatalog;
  issuing_body: IssuingBody;
  skills: Skill[];
};

// Payload accepted by POST/PUT /api/certifications (camelCase + resolved ids).
export type CertificationPayload = {
  certification_id?: number; // certification catalog id (resolved directly)
  name?: number | string; // alternative to certification_id: catalog id or exact name
  issuing_body_id?: number; // issuing-body id (resolved directly)
  issuingOrganization?: number | string; // alternative: issuing-body id or name (name auto-creates)
  issueDate?: string; // YYYY-MM-DD
  expirationDate?: string | null; // YYYY-MM-DD, null when doesNotExpire
  doesNotExpire?: boolean;
  credentialId?: string;
  credentialUrl?: string;
  skills?: number[]; // skill ids
  description?: string;
};
