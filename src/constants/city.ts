// Shared city display helper used by the profile editors and views.

import { City } from "@/types/city";

// "Bangalore, Karnataka" — falls back to just the city name when the state is not loaded.
export const formatCity = (city: City): string => (city.state?.name ? `${city.name}, ${city.state.name}` : city.name);
