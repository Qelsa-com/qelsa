/**
 * Best-effort country hint for showing Dodo's localized price before checkout.
 * Dodo remains authoritative once the customer enters a billing address.
 *
 * India is matched by timezone because many Indian users keep an en-US browser
 * locale; other regions fall back to the locale region.
 */
export function detectPricingCountry(): string | undefined {
  if (typeof window === "undefined") return undefined;

  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  if (timeZone === "Asia/Kolkata" || timeZone === "Asia/Calcutta") return "IN";

  const languages = navigator.languages?.length ? navigator.languages : [navigator.language];
  for (const language of languages) {
    try {
      const region = new Intl.Locale(language).region;
      if (region && /^[A-Z]{2}$/.test(region)) return region;
    } catch {
      // Ignore browsers without Intl.Locale and fall through to the base price.
    }
  }
  return undefined;
}
