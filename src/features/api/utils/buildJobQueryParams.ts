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
  /** Workplace-type filter. The listing reads it as `remote` (or `has_remote`). */
  remote?: boolean;
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

  // Only send it when it is on: the listing treats any present `remote` value as
  // an active filter, so `remote=false` would hide every remote job rather than
  // meaning "no preference".
  if (filters.remote) params.append("remote", "true");

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
