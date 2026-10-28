// Shared city display helper used by the profile editors and views.

import { City } from "@/types/city";

// "Bangalore, Karnataka, India" — falls back to the parts that are loaded.
export const formatCity = (city: City): string =>
  [city.name, city.state?.name, city.country].filter(Boolean).join(", ");

const foldDiacritics = (value: string) =>
  value.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

// "City, State" ref for persisting a picked place. The geo index spells names
// with diacritics (Kolhāpur) while the city catalog does not, so fold them here
// or every accented pick forks a duplicate city row.
export const cityRefName = (city: Pick<City, "name" | "state">): string => {
  const name = foldDiacritics(city.name);
  const state = city.state?.name ? foldDiacritics(city.state.name) : "";
  return state ? `${name}, ${state}` : name;
};
