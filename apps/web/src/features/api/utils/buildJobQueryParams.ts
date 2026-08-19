export type JobFilters = {
  cities?: string[];
  departments?: string[];
  experience_levels?: string[];
  job_types?: string[];
  salary_min?: number;
  salary_max?: number;
  search?: string;
  sort_by?: string;
  city?: string;
  page_id?: string;
  /** on-site | remote | hybrid, multi-select. */
  workplace_types?: string[];
  posted_within?: "24h" | "week" | "month";
  /** Client clock; required with `posted_within` so the query stays deterministic. */
  now?: number;
};

export const buildJobQueryParams = (filters?: JobFilters | void) => {
  const params = new URLSearchParams();

  if (!filters) return params;

  const cleanArray = (arr?: string[]) => (Array.isArray(arr) ? arr.map((v) => (typeof v === "string" ? v.trim() : "")).filter((v) => v && v !== "undefined" && v !== "null") : []);

  const appendArray = (key: string, arr?: string[]) => {
    cleanArray(arr).forEach((v) => params.append(key, v));
  };

  appendArray("cities", filters.cities);
  appendArray("departments", filters.departments);
  appendArray("experience_levels", filters.experience_levels);
  appendArray("job_types", filters.job_types);

  if (filters.city) params.append("city", filters.city);
  if (filters.page_id) params.append("page_id", filters.page_id);

  // Sent as a list only. The listing ORs it across `workplace_type` and the
  // scraped rows' `has_remote` flag; adding a separate `remote=true` here would
  // AND with the list and drop Hybrid when both are picked.
  appendArray("workplace_types", filters.workplace_types);

  if (typeof filters.salary_min === "number") {
    params.append("salary_min", String(filters.salary_min));
  }

  if (typeof filters.salary_max === "number") {
    params.append("salary_max", String(filters.salary_max));
  }

  if (filters.search?.trim()) {
    params.append("search", filters.search.trim());
  }

  if (filters.sort_by?.trim()) {
    params.append("sort_by", filters.sort_by.trim());
  }

  return params;
};
