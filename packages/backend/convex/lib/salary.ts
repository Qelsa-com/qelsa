/**
 * Salary comparison in one currency.
 *
 * The browse "Highest salary" sort previously compared raw numbers, so a
 * ₹45,00,000 posting outranked a $850,000 one. Everything is converted to USD
 * before comparing or indexing.
 *
 * Rates are a small static table: this drives relative ordering on a job board,
 * not billing, so approximate and slowly-drifting is acceptable. Refresh when
 * they drift meaningfully.
 */
const USD_RATES: Record<string, number> = {
  USD: 1,
  INR: 0.012,
  EUR: 1.08,
  GBP: 1.27,
  CAD: 0.73,
  AUD: 0.66,
  SGD: 0.74,
  AED: 0.272,
  CHF: 1.12,
  JPY: 0.0067,
  BRL: 0.18,
  MXN: 0.058,
  PLN: 0.25,
  SEK: 0.095,
  ZAR: 0.055,
};

/** Missing currency is treated as USD, the convention most ATS feeds use. */
export function usdRateFor(currency?: string | null): number {
  if (!currency) return 1;
  return USD_RATES[currency.trim().toUpperCase()] ?? 1;
}

/** Convert an amount to USD. Returns null when there is nothing usable. */
export function toUsd(amount: number | null | undefined, currency?: string | null): number | null {
  if (typeof amount !== "number" || !Number.isFinite(amount) || amount <= 0) return null;
  return Math.round(amount * usdRateFor(currency));
}

/**
 * Upper bound of a posting's salary in USD, used for "Highest salary" ordering.
 * Falls back to the single `salary` figure when no range is published.
 */
export function jobSalaryUsd(job: {
  salary_max?: number | null;
  salary?: number | null;
  salary_currency?: string | null;
}): number | null {
  const amount = job.salary_max ?? job.salary ?? null;
  return toUsd(amount, job.salary_currency);
}
