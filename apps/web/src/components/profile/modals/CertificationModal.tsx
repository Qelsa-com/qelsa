"use client";

import { useCreateCertificationMutation, useUpdateCertificationMutation } from "@/features/api/certificationsApi";
import { useLazyGetCertificationCatalogQuery, useLazyGetIssuingBodiesQuery } from "@/features/api/seedApi";
import { toastUnknownError } from "@/lib/errors";
import { Certification } from "@/types/certification";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Autocomplete, AutocompleteOption } from "../../ui/autocomplete";
import { CheckboxRow, Field, MonthYearSelect, inputClass, monthValueToIso, toMonthValue } from "./fields";
import { GhostButton, GradientButton, ModalShell } from "./ModalShell";

interface CertificationModalProps {
  open: boolean;
  onClose: () => void;
  certification?: Certification | null;
}

/** The API returns both the catalog link and any free-text name the user typed. */
function certName(certification?: Certification | null): string {
  if (!certification) return "";
  return ((certification as unknown as { name?: string }).name ?? certification.certification?.name ?? "") as string;
}

function certIssuer(certification?: Certification | null): string {
  if (!certification) return "";
  return ((certification as unknown as { issuingOrganization?: string }).issuingOrganization ?? certification.issuing_body?.name ?? "") as string;
}

export function CertificationModal({ open, onClose, certification }: CertificationModalProps) {
  const isEdit = Boolean(certification?.id);

  const [name, setName] = useState<AutocompleteOption | null>(null);
  const [nameText, setNameText] = useState("");
  const [issuer, setIssuer] = useState<AutocompleteOption | null>(null);
  const [issuerText, setIssuerText] = useState("");
  const [issueDate, setIssueDate] = useState<string | null>(null);
  const [expirationDate, setExpirationDate] = useState<string | null>(null);
  const [noExpiration, setNoExpiration] = useState(false);
  const [credentialId, setCredentialId] = useState("");
  const [credentialUrl, setCredentialUrl] = useState("");
  const [saving, setSaving] = useState(false);

  const [searchCertifications, { data: certOptions = [] }] = useLazyGetCertificationCatalogQuery();
  const [searchIssuers, { data: issuerOptions = [] }] = useLazyGetIssuingBodiesQuery();
  const [createCertification] = useCreateCertificationMutation();
  const [updateCertification] = useUpdateCertificationMutation();

  useEffect(() => {
    if (!open) return;
    const n = certName(certification);
    const i = certIssuer(certification);
    setName(certification?.certification?.id ? { id: certification.certification.id, name: n } : null);
    setNameText(n);
    setIssuer(certification?.issuing_body?.id ? { id: certification.issuing_body.id, name: i } : null);
    setIssuerText(i);
    setIssueDate(toMonthValue(certification?.issue_date));
    setExpirationDate(certification?.does_not_expire ? null : toMonthValue(certification?.expiration_date));
    setNoExpiration(Boolean(certification?.does_not_expire));
    setCredentialId(certification?.credential_id ?? "");
    setCredentialUrl(certification?.credential_url ?? "");
  }, [open, certification]);

  if (!open) return null;

  const handleSubmit = async () => {
    const finalName = name?.name ?? nameText.trim();
    const finalIssuer = issuer?.name ?? issuerText.trim();
    if (!finalName) return toast.error("Certification name is required");
    if (!finalIssuer) return toast.error("Issuing organisation is required");
    if (!issueDate) return toast.error("Issue date is required");
    if (!noExpiration && !expirationDate) return toast.error("Expiration date is required (or mark as no expiration)");

    const payload = {
      certification_id: name?.id ?? undefined,
      name: name?.id ? undefined : finalName,
      issuing_body_id: issuer?.id ?? undefined,
      issuingOrganization: issuer?.id ? undefined : finalIssuer,
      issueDate: monthValueToIso(issueDate),
      expirationDate: noExpiration ? null : monthValueToIso(expirationDate),
      doesNotExpire: noExpiration,
      credentialId: credentialId.trim() || undefined,
      credentialUrl: credentialUrl.trim() || undefined,
    };

    setSaving(true);
    try {
      if (isEdit) {
        await updateCertification({ id: certification!.id, data: payload }).unwrap();
        toast.success("Certification updated");
      } else {
        await createCertification(payload).unwrap();
        toast.success("Certification added");
      }
      onClose();
    } catch (error) {
      toastUnknownError(error, "Could not save the certification. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalShell
      title={isEdit ? "Edit certification" : "Add certification"}
      onClose={onClose}
      footer={
        <>
          <GhostButton onClick={onClose} disabled={saving}>
            Cancel
          </GhostButton>
          <GradientButton onClick={handleSubmit} disabled={saving}>
            {saving ? "Saving…" : isEdit ? "Save changes" : "Add certification"}
          </GradientButton>
        </>
      }
    >
      <div className="flex flex-col gap-5">
        <Field label="Certification Name" required>
          <Autocomplete
            value={name}
            onChange={setName}
            onSearch={(q) => searchCertifications({ search: q })}
            options={certOptions as AutocompleteOption[]}
            placeholder="Enter certification name"
            allowFreeText
            onQueryChange={setNameText}
            minChars={1}
            inputClassName={inputClass}
          />
        </Field>

        <Field label="Issuing Organisation" required>
          <Autocomplete
            value={issuer}
            onChange={setIssuer}
            onSearch={(q) => searchIssuers({ search: q })}
            options={issuerOptions as AutocompleteOption[]}
            placeholder="Enter issuing organization"
            allowFreeText
            onQueryChange={setIssuerText}
            minChars={1}
            inputClassName={inputClass}
          />
        </Field>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Issue Date" required>
            <MonthYearSelect value={issueDate} onChange={setIssueDate} />
          </Field>
          <Field label="Expiration Date" required={!noExpiration}>
            <MonthYearSelect value={expirationDate} onChange={setExpirationDate} disabled={noExpiration} />
          </Field>
        </div>

        <CheckboxRow
          checked={noExpiration}
          onChange={(value) => {
            setNoExpiration(value);
            if (value) setExpirationDate(null);
          }}
          label="No Expiration"
        />

        <Field label="Credential ID">
          <input value={credentialId} onChange={(e) => setCredentialId(e.target.value)} placeholder="Enter credential ID (optional)" className={inputClass} />
        </Field>

        <Field label="Credential URL">
          <input value={credentialUrl} onChange={(e) => setCredentialUrl(e.target.value)} placeholder="Enter credential URL (optional)" type="url" className={inputClass} />
        </Field>
      </div>
    </ModalShell>
  );
}
