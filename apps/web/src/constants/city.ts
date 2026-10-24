// Shared city display helper used by the profile editors and views.

import { City } from "@/types/city";

// "Bangalore, Karnataka, India" — falls back to the parts that are loaded.
export const formatCity = (city: City): string =>
  [city.name, city.state?.name, city.country].filter(Boolean).join(", ");
