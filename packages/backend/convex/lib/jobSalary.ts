export type JobSalaryFields = {
  salary_min?: number;
  salary_max?: number;
  salary?: number;
  salary_currency?: string;
};

const CURRENCY_CODES = ["USD", "INR", "EUR", "GBP", "CAD", "AUD", "SGD", "CHF"];
const SYMBOL_TO_CURRENCY: Record<string, string> = { $: "USD", "₹": "INR", "£": "GBP", "€": "EUR" };

function isNum(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}

function hasSalary(fields: { salary_min?: number; salary_max?: number; salary?: number }) {
  return isNum(fields.salary_min) || isNum(fields.salary_max) || isNum(fields.salary);
}

export function compactSalary(fields: JobSalaryFields): JobSalaryFields {
  const min = isNum(fields.salary_min) ? Math.round(fields.salary_min) : undefined;
  const max = isNum(fields.salary_max) ? Math.round(fields.salary_max) : undefined;
  const orderedMin = min != null && max != null && max < min ? max : min;
  const orderedMax = min != null && max != null && max < min ? min : max;
  const mid = orderedMin != null && orderedMax != null ? Math.round((orderedMin + orderedMax) / 2) : orderedMin ?? orderedMax;
  const salary = isNum(fields.salary) ? Math.round(fields.salary) : mid;
  const out: JobSalaryFields = {};
  if (orderedMin != null) out.salary_min = orderedMin;
  if (orderedMax != null) out.salary_max = orderedMax;
  if (salary != null) out.salary = salary;
  const currency = fields.salary_currency?.trim().toUpperCase();
  if (currency && /^[A-Z]{3}$/.test(currency)) out.salary_currency = currency;
  return out;
}

/** ATS/API numbers win per field. JD text fills any missing min/max so a partial API range still becomes a real band. */
export function resolveJobSalary(args: {
  incoming?: { salary_min?: unknown; salary_max?: unknown; salary?: unknown; salary_currency?: unknown };
  existing?: { salary_min?: number; salary_max?: number; salary?: number; salary_currency?: string };
  description?: string;
}): JobSalaryFields {
  const incoming = compactSalary({
    salary_min: typeof args.incoming?.salary_min === "number" ? args.incoming.salary_min : undefined,
    salary_max: typeof args.incoming?.salary_max === "number" ? args.incoming.salary_max : undefined,
    salary: typeof args.incoming?.salary === "number" ? args.incoming.salary : undefined,
    salary_currency: typeof args.incoming?.salary_currency === "string" ? args.incoming.salary_currency : undefined,
  });
  const fromText = parseSalaryFromText(args.description);
  const existing = args.existing;
  return compactSalary({
    salary_min: incoming.salary_min ?? fromText?.salary_min ?? existing?.salary_min,
    salary_max: incoming.salary_max ?? fromText?.salary_max ?? existing?.salary_max,
    salary: incoming.salary ?? fromText?.salary ?? existing?.salary,
    salary_currency: incoming.salary_currency ?? fromText?.salary_currency ?? existing?.salary_currency,
  });
}

export function jobHasSalary(job: { salary_min?: number; salary_max?: number; salary?: number }) {
  return hasSalary(job);
}

/** Fill only empty salary fields — never overwrite ATS or a previously stored range. */
export function salaryFillPatch(
  job: { salary_min?: number; salary_max?: number; salary?: number; salary_currency?: string },
  incoming?: JobSalaryFields,
): JobSalaryFields | undefined {
  if (!incoming) return undefined;
  const compact = compactSalary(incoming);
  if (!hasSalary(compact)) return undefined;
  const merged = compactSalary({
    salary_min: job.salary_min ?? compact.salary_min,
    salary_max: job.salary_max ?? compact.salary_max,
    salary: job.salary ?? compact.salary,
    salary_currency: job.salary_currency ?? compact.salary_currency,
  });
  const changed =
    merged.salary_min !== job.salary_min || merged.salary_max !== job.salary_max || merged.salary !== job.salary || merged.salary_currency !== job.salary_currency;
  return changed && hasSalary(merged) ? merged : undefined;
}

function toNumber(raw: string) {
  const n = Number(raw.replace(/,/g, ""));
  return Number.isFinite(n) && n > 0 ? n : undefined;
}

function scaleAmount(n: number, unit?: string) {
  const u = (unit ?? "").toLowerCase();
  if (u === "k") return n * 1_000;
  if (u === "m" || u === "mn" || u === "million") return n * 1_000_000;
  if (u === "l" || u === "lpa" || u === "lakh" || u === "lakhs") return n * 100_000;
  if (u === "cr" || u === "crore" || u === "crores") return n * 10_000_000;
  return n;
}

function annualize(amount: number, period?: string) {
  const p = (period ?? "").toLowerCase();
  if (/(hour|hourly|\bhr\b)/.test(p)) return amount * 2080;
  if (/(month|monthly|\bmo\b)/.test(p)) return amount * 12;
  if (/(week|weekly)/.test(p)) return amount * 52;
  if (/(day|daily)/.test(p)) return amount * 260;
  return amount;
}

function plausibleAnnual(amount: number, currency: string) {
  if (currency === "INR") return amount >= 150_000 && amount <= 80_000_000;
  if (currency === "USD" || currency === "CAD" || currency === "AUD" || currency === "SGD") return amount >= 12_000 && amount <= 2_000_000;
  if (currency === "EUR" || currency === "GBP" || currency === "CHF") return amount >= 12_000 && amount <= 1_500_000;
  return amount >= 12_000 && amount <= 2_000_000;
}

function currencyFrom(symbol?: string, code?: string, nearby?: string) {
  const fromCode = (code ?? "").toUpperCase();
  if (CURRENCY_CODES.includes(fromCode)) return fromCode;
  if (symbol && SYMBOL_TO_CURRENCY[symbol]) return SYMBOL_TO_CURRENCY[symbol];
  const around = (nearby ?? "").toUpperCase();
  for (const codeName of CURRENCY_CODES) {
    if (around.includes(codeName)) return codeName;
  }
  if (/\b(lpa|lakh|lakhs|ctc|rupee)/i.test(nearby ?? "")) return "INR";
  return "USD";
}

function periodFrom(nearby: string) {
  if (/(per\s*hour|\/\s*h(?:ou)?r|hourly|\bhr\b)/i.test(nearby)) return "hourly";
  if (/(per\s*month|\/\s*mo(?:nth)?|monthly)/i.test(nearby)) return "monthly";
  if (/(per\s*week|weekly)/i.test(nearby)) return "weekly";
  if (/(per\s*day|daily)/i.test(nearby)) return "daily";
  return "annual";
}

function finalize(min: number | undefined, max: number | undefined, currency: string, period: string): JobSalaryFields | undefined {
  const annualMin = min != null ? annualize(min, period) : undefined;
  const annualMax = max != null ? annualize(max, period) : undefined;
  const check = annualMax ?? annualMin;
  if (check == null || !plausibleAnnual(check, currency)) return undefined;
  if (annualMin != null && !plausibleAnnual(annualMin, currency) && annualMax != null && plausibleAnnual(annualMax, currency)) {
    return compactSalary({ salary_max: annualMax, salary_currency: currency });
  }
  return compactSalary({ salary_min: annualMin, salary_max: annualMax, salary_currency: currency });
}

function decodePayEntities(text: string) {
  return text
    .replace(/&nbsp;|&#160;/gi, " ")
    .replace(/&mdash;|&#8212;|&#x2014;/gi, "-")
    .replace(/&ndash;|&#8211;|&#x2013;/gi, "-")
    .replace(/&minus;|&#8722;|&#x2212;/gi, "-")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCharCode(parseInt(code, 16)));
}

function normalizePayText(description: string) {
  return decodePayEntities(description)
    .replace(/<[^>]+>/g, " ")
    .replace(/[\u2010-\u2015\u2212]/g, "-")
    .replace(/\s+/g, " ");
}

/**
 * Fast, conservative parse of explicit pay from a JD. Returns undefined unless a
 * currency/unit and amount are actually present — no LLM, no guessing from "competitive".
 */
export function parseSalaryFromText(description?: string): JobSalaryFields | undefined {
  if (!description) return undefined;
  const text = normalizePayText(description);
  if (text.length < 8) return undefined;

  const unit = "(k|m|mn|million|lpa|lakh|lakhs|l|cr|crore|crores)";
  const amount = "(\\d{1,3}(?:,\\d{2,3})+|\\d+(?:\\.\\d+)?)";
  const currency = `(${CURRENCY_CODES.join("|")}|[$₹£€])`;
  const rangeSep = "(?:-|to)";
  const patterns = [
    new RegExp(`${currency}\\s*${amount}\\s*${unit}?\\s*${rangeSep}\\s*${currency}?\\s*${amount}\\s*${unit}?`, "ig"),
    new RegExp(`${amount}\\s*${unit}?\\s*${rangeSep}\\s*${amount}\\s*${unit}?\\s*(${CURRENCY_CODES.join("|")}|lpa|lakhs?|ctc)`, "ig"),
    new RegExp(`(?:up to|upto|from|starting at|starting)\\s*${currency}?\\s*${amount}\\s*${unit}?`, "ig"),
    new RegExp(`${currency}\\s*${amount}\\s*${unit}?`, "ig"),
    new RegExp(`${amount}\\s*(lpa|lakhs?|ctc)`, "ig"),
  ];

  for (const pattern of patterns) {
    for (const match of text.matchAll(pattern)) {
      const index = match.index ?? 0;
      const nearby = text.slice(Math.max(0, index - 40), index + match[0].length + 48);
      if (/\b(equity|bonus only|unpaid)\b/i.test(nearby) && !/\b(salary|compensation|base|ctc|lpa)\b/i.test(nearby)) continue;

      const groups = match.slice(1).filter((g) => g != null);
      const currencies: string[] = [];
      const numbers: number[] = [];
      for (let i = 0; i < groups.length; i++) {
        const g = groups[i];
        if (!g) continue;
        if (SYMBOL_TO_CURRENCY[g] || CURRENCY_CODES.includes(g.toUpperCase())) {
          currencies.push(SYMBOL_TO_CURRENCY[g] ?? g.toUpperCase());
          continue;
        }
        if (/^(k|m|mn|million|lpa|lakh|lakhs|l|cr|crore|crores|ctc)$/i.test(g)) continue;
        const n = toNumber(g);
        if (n == null) continue;
        const next = groups[i + 1];
        const scaled = scaleAmount(n, next && /^(k|m|mn|million|lpa|lakh|lakhs|l|cr|crore|crores)$/i.test(next) ? next : nearby.match(/\b(lpa|lakhs?|ctc)\b/i)?.[1]);
        numbers.push(scaled);
      }
      if (numbers.length === 0) continue;

      const currencyCode = currencyFrom(undefined, currencies[0], nearby);
      const period = periodFrom(nearby);
      const isUpTo = /^\s*(up to|upto)/i.test(match[0]);
      const min = isUpTo ? undefined : numbers[0];
      const max = isUpTo ? numbers[0] : numbers[1];
      const parsed = finalize(min, max, currencyCode, period);
      if (parsed) return parsed;
      if (isUpTo) {
        const onlyMax = finalize(undefined, numbers[0], currencyCode, period);
        if (onlyMax) return onlyMax;
      }
    }
  }
  return undefined;
}

export function salaryFromLlm(raw: unknown): JobSalaryFields | undefined {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return undefined;
  const row = raw as Record<string, unknown>;
  const min = typeof row.min === "number" ? row.min : typeof row.salary_min === "number" ? row.salary_min : undefined;
  const max = typeof row.max === "number" ? row.max : typeof row.salary_max === "number" ? row.salary_max : undefined;
  if (min == null && max == null) return undefined;
  const currency = typeof row.currency === "string" ? row.currency : typeof row.salary_currency === "string" ? row.salary_currency : "USD";
  const period = typeof row.period === "string" ? row.period : "annual";
  const unit = typeof row.unit === "string" ? row.unit : undefined;
  const currencyCode = currencyFrom(undefined, currency, unit);
  const scaledMin = min != null ? scaleAmount(min, unit) : undefined;
  const scaledMax = max != null ? scaleAmount(max, unit) : undefined;
  const inrLakhs = (n: number | undefined) =>
    n != null && currencyCode === "INR" && !unit && n < 1000 ? n * 100_000 : n;
  return finalize(inrLakhs(scaledMin), inrLakhs(scaledMax === scaledMin ? undefined : scaledMax), currencyCode, period);
}
