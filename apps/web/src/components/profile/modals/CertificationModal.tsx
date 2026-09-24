"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../../ui/alert-dialog";
import { Autocomplete, AutocompleteOption } from "../../ui/autocomplete";
import { Button } from "../../ui/button";
import { useCreateCertificationMutation, useDeleteCertificationMutation, useUpdateCertificationMutation } from "@/features/api/certificationsApi";
import { useLazyGetCertificationCatalogQuery, useLazyGetIssuingBodiesQuery } from "@/features/api/seedApi";
import { toastUnknownError } from "@/lib/errors";
import { Certification } from "@/types/certification";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
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
  const certId = (certification?.id ?? (certification as unknown as { _id?: string })?._id) as string | undefined;
  const isEdit = Boolean(certId);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteCertification] = useDeleteCertificationMutation();

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
    const issueIso = monthValueToIso(issueDate);
    if (issueIso && new Date(issueIso).getTime() > Date.now()) {
      return toast.error("Issue date cannot be in the future");
    }
    if (!noExpiration && !expirationDate) return toast.error("Expiration date is required (or mark as no expiration)");
    const expIso = !noExpiration && expirationDate ? monthValueToIso(expirationDate) : null;
    if (issueIso && expIso && new Date(expIso).getTime() < new Date(issueIso).getTime()) {
      return toast.error("Expiration date cannot be before issue date");
    }

    const payload = {
      certification_id: name?.id ?? undefined,
      name: name?.id ? undefined : finalName,
      issuing_body_id: issuer?.id ?? undefined,
      issuingOrganization: issuer?.id ? undefined : finalIssuer,
      issueDate: issueIso,
      expirationDate: expIso,
      doesNotExpire: noExpiration,
      credentialId: credentialId.trim() || undefined,
      credentialUrl: credentialUrl.trim() || undefined,
    };

    setSaving(true);
    try {
      if (isEdit) {
        await updateCertification({ id: certId!, data: payload }).unwrap();
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

  const handleDelete = async () => {
    if (!certId) return;
    setIsDeleting(true);
    try {
      await deleteCertification(certId).unwrap();
      toast.success("Certification deleted");
      setShowDeleteConfirm(false);
      onClose();
    } catch (error) {
      toastUnknownError(error, "Could not delete certification. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <ModalShell
        title={isEdit ? "Edit certification" : "Add certification"}
        onClose={onClose}
        footer={
          <>
            {isEdit && (
              <button
                type="button"
                disabled={saving || isDeleting}
                onClick={() => setShowDeleteConfirm(true)}
                className="mr-auto inline-flex items-center gap-1 sm:gap-1.5 text-xs font-medium text-red-400 whitespace-nowrap shrink-0 transition-colors hover:text-red-300 disabled:opacity-50"
              >
                <Trash2 className="size-3.5 shrink-0" />
                <span className="hidden sm:inline">Delete certification</span>
                <span className="sm:hidden">Delete</span>
              </button>
            )}
            <div className="flex items-center gap-2 sm:gap-3 ml-auto">
              <GhostButton onClick={onClose} disabled={saving || isDeleting}>
                Cancel
              </GhostButton>
              <GradientButton onClick={handleSubmit} disabled={saving || isDeleting}>
                {saving ? "Saving…" : isEdit ? "Save changes" : "Add certification"}
              </GradientButton>
            </div>
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
              <MonthYearSelect value={issueDate} onChange={setIssueDate} allowFuture={false} />
            </Field>
            <Field label="Expiration Date" required={!noExpiration}>
              <MonthYearSelect value={expirationDate} onChange={setExpirationDate} disabled={noExpiration} allowFuture={true} />
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

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent className="border border-white/12 bg-[#0c0c1a] text-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg font-semibold text-white">Delete certification?</AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-white/60">
              Are you sure you want to delete this certification? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting} className="border-white/12 bg-white/5 text-white hover:bg-white/10">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={isDeleting}
              onClick={handleDelete}
              className="bg-red-500 text-white hover:bg-red-600"
            >
              {isDeleting ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
