"use client";

import { useCompleteHrOnboardingMutation, useGetCompanySizesQuery, useSearchOnboardingCompaniesQuery, type HiringRole } from "@/features/api/onboardingApi";
import { ChevronDown, Search } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { ArrowRightIcon, CheckIcon, OnboardingShell, StepProgress } from "./OnboardingShell";
import { ONBOARDING_CARD, PRIMARY_BTN } from "./styles";

const HIRING_ROLES: { value: HiringRole; label: string }[] = [
  { value: "founder_cxo", label: "Founder / CXO" },
  { value: "hr_ta", label: "HR / Talent Acquisition" },
  { value: "hiring_manager", label: "Hiring Manager" },
  { value: "recruitment_agency", label: "Recruitment Agency" },
];

const INDUSTRIES = [
  "Aerospace & Defense",
  "Biotechnology",
  "Consulting",
  "Consumer Goods",
  "Education",
  "Energy",
  "Financial Services",
  "Government",
  "Healthcare",
  "Hospitality",
  "Legal",
  "Manufacturing",
  "Media & Entertainment",
  "Nonprofit",
  "Real Estate",
  "Retail",
  "Software",
  "Technology",
  "Telecommunications",
  "Transportation & Logistics",
];

type Step = "company" | "seat" | "about" | "ready";

export function HrOnboarding({ onBack, onComplete }: { onBack: () => void; onComplete: () => void }) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("company");
  const [companyName, setCompanyName] = useState("");
  const [catalogCompanyId, setCatalogCompanyId] = useState<string | undefined>();
  const [hiringRole, setHiringRole] = useState<HiringRole | null>(null);
  const [industry, setIndustry] = useState("");
  const [industryQuery, setIndustryQuery] = useState("");
  const [industryOpen, setIndustryOpen] = useState(false);
  const [sizeId, setSizeId] = useState("");
  const [sizeOpen, setSizeOpen] = useState(false);

  const { data: sizes = [] } = useGetCompanySizesQuery();
  const { data: companies = [] } = useSearchOnboardingCompaniesQuery(companyName, {
    skip: companyName.trim().length === 0,
  });
  const [complete, { isLoading }] = useCompleteHrOnboardingMutation();

  const exactMatch = companies.find((row) => row.name.toLowerCase() === companyName.trim().toLowerCase());
  const isNewCompany = companyName.trim().length > 0 && !exactMatch;
  const selectedSize = sizes.find((row: { id: string }) => row.id === sizeId);

  const industryHits = useMemo(() => {
    const q = industryQuery.trim().toLowerCase();
    if (!q) return INDUSTRIES.slice(0, 8);
    return INDUSTRIES.filter((name) => name.toLowerCase().includes(q)).slice(0, 8);
  }, [industryQuery]);

  const handleCompanyContinue = () => {
    if (!companyName.trim()) return;
    if (exactMatch) setCatalogCompanyId(exactMatch.id);
    setStep("seat");
  };

  const handleFinish = async () => {
    const resolvedIndustry = industry.trim() || industryQuery.trim();
    if (!hiringRole || !resolvedIndustry || !sizeId) return;
    try {
      const result = await complete({
        company_name: companyName.trim(),
        catalog_company_id: catalogCompanyId,
        hiring_role: hiringRole,
        industry: resolvedIndustry,
        size_id: sizeId,
      }).unwrap();
      onComplete();
      setCompanyName(result.company_name);
      setStep("ready");
    } catch (err) {
      toast.error((err as Error)?.message || "Could not finish setup. Please try again.");
    }
  };

  const backForStep =
    step === "company"
      ? onBack
      : () => {
          if (step === "seat") setStep("company");
          if (step === "about") setStep("seat");
        };

  return (
    <OnboardingShell onBack={step === "ready" ? undefined : backForStep}>
      <AnimatePresence mode="wait">
      {step === "company" && (
        <motion.div
          key="company"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.25 }}
          className={ONBOARDING_CARD}
        >
          <StepProgress current={1} total={4} />
          <h2 className="mt-6 text-3xl font-bold text-white">Which company are you hiring for?</h2>
          <div className="mt-4 rounded-xl bg-white/[0.04] px-4 py-3 text-sm leading-relaxed text-muted-foreground">
            Search by name. If it&apos;s not listed, add it — no verification needed yet.
          </div>

          <label htmlFor="company-name" className="mt-6 block text-sm text-muted-foreground">
            Company name
          </label>
          <div className="relative mt-2">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              id="company-name"
              value={companyName}
              autoFocus
              autoComplete="off"
              placeholder="e.g. Acme Corp"
              onChange={(event) => {
                setCompanyName(event.target.value);
                setCatalogCompanyId(undefined);
              }}
              onKeyDown={(event) => event.key === "Enter" && handleCompanyContinue()}
              className="h-14 w-full rounded-full border border-neon-purple/70 bg-white/[0.04] pl-11 pr-5 text-[15px] text-white outline-none placeholder:text-muted-foreground focus:border-neon-purple"
            />
          </div>

          {companyName.trim() && companies.length > 0 && (
            <ul className="mt-3 max-h-56 overflow-y-auto rounded-2xl border border-white/10 bg-black/40 py-1">
              {companies.map((row) => {
                const selected = catalogCompanyId === row.id || exactMatch?.id === row.id;
                return (
                  <li key={row.id}>
                    <button
                      type="button"
                      onClick={() => {
                        setCompanyName(row.name);
                        setCatalogCompanyId(row.id);
                      }}
                      className={`flex w-full cursor-pointer items-center justify-between px-4 py-3 text-left text-[15px] text-white hover:bg-white/[0.06] ${
                        selected ? "bg-neon-purple/15" : ""
                      }`}
                    >
                      {row.name}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}

          {isNewCompany && (
            <p className="mt-3 text-sm text-muted-foreground">New company — we&apos;ll add it. You can verify ownership later.</p>
          )}

          {isNewCompany && (
            <p className="mt-4 text-sm text-muted-foreground">
              Add new: <span className="text-neon-purple">{companyName.trim()}</span>
            </p>
          )}

          <button type="button" onClick={handleCompanyContinue} disabled={!companyName.trim()} className={`mt-6 ${PRIMARY_BTN}`}>
            Continue
            <ArrowRightIcon />
          </button>
        </motion.div>
      )}

      {step === "seat" && (
        <motion.div
          key="seat"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.25 }}
          className={ONBOARDING_CARD}
        >
          <StepProgress current={2} total={4} />
          <h2 className="mt-6 text-3xl font-bold text-white">How do you fit into hiring?</h2>
          <p className="mt-2 text-[15px] text-muted-foreground">This shapes what you see — shortlists, upstream signal, or full pipeline.</p>

          <div className="mt-6 space-y-3">
            {HIRING_ROLES.map((role) => {
              const selected = hiringRole === role.value;
              return (
                <button
                  key={role.value}
                  type="button"
                  onClick={() => setHiringRole(role.value)}
                  aria-pressed={selected}
                  className={`flex h-14 w-full cursor-pointer items-center justify-between rounded-full border px-5 text-left text-[15px] text-white transition-colors ${
                    selected ? "border-neon-purple bg-neon-purple/10" : "border-white/10 bg-white/[0.02] hover:bg-white/[0.05]"
                  }`}
                >
                  {role.label}
                  {selected ? (
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-neon-purple">
                      <CheckIcon />
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>

          <button type="button" onClick={() => hiringRole && setStep("about")} disabled={!hiringRole} className={`mt-6 ${PRIMARY_BTN}`}>
            Continue
            <ArrowRightIcon />
          </button>
        </motion.div>
      )}

      {step === "about" && (
        <motion.div
          key="about"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.25 }}
          className={ONBOARDING_CARD}
        >
          <StepProgress current={3} total={4} />
          <h2 className="mt-6 text-3xl font-bold text-white">Tell us about the company.</h2>
          <p className="mt-2 text-[15px] text-muted-foreground">Candidates use this to assess fit before they apply.</p>

          <label htmlFor="industry" className="mt-6 block text-sm text-muted-foreground">
            Industry
          </label>
          <div className="relative mt-2">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              id="industry"
              value={industryOpen ? industryQuery : industry}
              placeholder="Search industry..."
              onFocus={() => {
                setIndustryOpen(true);
                setIndustryQuery(industry);
              }}
              onChange={(event) => {
                setIndustryQuery(event.target.value);
                setIndustry("");
              }}
              className="h-14 w-full rounded-full border border-white/12 bg-white/[0.04] pl-11 pr-5 text-[15px] text-white outline-none placeholder:text-muted-foreground focus:border-neon-purple"
            />
            {industryOpen && (
              <ul className="absolute z-10 mt-2 max-h-48 w-full overflow-y-auto rounded-2xl border border-white/10 bg-[#121218] py-1 shadow-xl">
                {industryHits.map((name) => (
                  <li key={name}>
                    <button
                      type="button"
                      onClick={() => {
                        setIndustry(name);
                        setIndustryQuery(name);
                        setIndustryOpen(false);
                      }}
                      className="flex w-full cursor-pointer px-4 py-3 text-left text-[15px] text-white hover:bg-white/[0.06]"
                    >
                      {name}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <label className="mt-5 block text-sm text-muted-foreground">Company size</label>
          <button
            type="button"
            onClick={() => setSizeOpen((open) => !open)}
            className="relative mt-2 flex h-14 w-full cursor-pointer items-center justify-between rounded-full border border-white/12 bg-white/[0.04] px-5 text-[15px] text-white"
          >
            <span className={selectedSize ? "text-white" : "text-muted-foreground"}>
              {selectedSize?.label ?? "Select headcount range"}
            </span>
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          </button>
          {sizeOpen && (
            <ul className="mt-2 overflow-hidden rounded-2xl border border-white/10 bg-[#121218]">
              {sizes.map((row: { id: string; label: string }) => (
                <li key={row.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setSizeId(row.id);
                      setSizeOpen(false);
                    }}
                    className="flex w-full cursor-pointer px-5 py-3 text-left text-[15px] text-white hover:bg-white/[0.06]"
                  >
                    {row.label}
                  </button>
                </li>
              ))}
            </ul>
          )}

          <button type="button" onClick={handleFinish} disabled={!(industry.trim() || industryQuery.trim()) || !sizeId || isLoading} className={`mt-6 ${PRIMARY_BTN}`}>
            {isLoading ? "Saving…" : "Continue"}
            {!isLoading ? <ArrowRightIcon /> : null}
          </button>
        </motion.div>
      )}

      {step === "ready" && (
        <motion.div
          key="ready"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.25 }}
          className={`${ONBOARDING_CARD} text-center`}
        >
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full gradient-primary">
            <CheckIcon />
          </div>
          <h2 className="mt-6 text-3xl font-bold text-white">You&apos;re ready to hire.</h2>
          <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
            Your pipeline for <span className="font-medium text-white">{companyName}</span> is live. Shortlists start appearing as candidates match your open roles.
          </p>
          <button type="button" onClick={() => router.push("/jobs/posted")} className={`mt-8 ${PRIMARY_BTN}`}>
            See my dashboard
            <SparkleIcon />
          </button>
          <p className="mt-5 text-sm text-muted-foreground">Account created. Check your email for a copy of your setup.</p>
        </motion.div>
      )}
      </AnimatePresence>
    </OnboardingShell>
  );
}

function SparkleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 2.5 13.4 8l5.6 1.4L13.4 10.8 12 16.5l-1.4-5.7L5 9.4 10.6 8 12 2.5Zm7 11 0.8 3.1 3.2.8-3.2.8-.8 3.1-.8-3.1-3.2-.8 3.2-.8.8-3.1Z" />
    </svg>
  );
}
