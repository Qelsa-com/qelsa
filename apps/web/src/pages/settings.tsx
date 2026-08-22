"use client";

import { useDeleteAccountMutation } from "@/features/api/authApi";
import { authClient } from "@/lib/auth-client";
import { toastUnknownError } from "@/lib/errors";
import { clearResumeDraft } from "@/lib/resumeDraft";
import { AlertTriangle, ChevronRight, Plug, Settings as SettingsIcon } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "../components/ui/alert-dialog";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import Layout from "../layout";

const DELETE_CONFIRMATION = "DELETE";

const Settings = () => {
  const [deleteAccount, { isLoading }] = useDeleteAccountMutation();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");

  const handleDelete = async () => {
    if (confirmText !== DELETE_CONFIRMATION || isLoading) return;
    try {
      await deleteAccount({}).unwrap();
      clearResumeDraft();
      await authClient.signOut().catch(() => undefined);
      window.location.replace("/jobs");
    } catch (err) {
      toastUnknownError(err, "Could not delete your account. Please try again.");
    }
  };

  return (
    <Layout activeSection="profile">
      <div className="mx-auto w-full max-w-[720px] px-6 py-8 text-white md:px-12">
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl glass border border-glass-border">
            <SettingsIcon className="h-5 w-5 text-neon-cyan" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Settings</h1>
            <p className="text-sm text-muted-foreground">Account preferences and data controls.</p>
          </div>
        </div>

        <Link href="/settings/integrations" className="mb-8 flex items-center justify-between rounded-2xl border border-glass-border glass p-6 transition-colors hover:bg-white/5">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-neon-purple/20">
              <Plug className="h-5 w-5 text-neon-purple" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Integrations</h2>
              <p className="mt-1 text-sm text-muted-foreground">Connect your ATS (Greenhouse, Zoho Recruit, Lever…) to sync job requisitions and route candidates into your hiring pipeline.</p>
            </div>
          </div>
          <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" />
        </Link>

        <section className="rounded-2xl border border-destructive/40 bg-destructive/5 p-6">
          <div className="mb-4 flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
            <div>
              <h2 className="text-lg font-semibold text-destructive">Delete account</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                This permanently removes your profile, resumes, applications, job-match chats, company pages, and any jobs you posted — including applications other people sent to those jobs. Catalog data like skills and companies is kept.
              </p>
            </div>
          </div>
          <Button
            variant="destructive"
            onClick={() => {
              setConfirmText("");
              setConfirmOpen(true);
            }}
          >
            Delete my account
          </Button>
        </section>
      </div>

      <AlertDialog
        open={confirmOpen}
        onOpenChange={(open) => {
          if (isLoading) return;
          setConfirmOpen(open);
          if (!open) setConfirmText("");
        }}
      >
        <AlertDialogContent className="glass-strong border-glass-border">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete your account?</AlertDialogTitle>
            <AlertDialogDescription>This cannot be undone. Type {DELETE_CONFIRMATION} to confirm.</AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2">
            <Label htmlFor="delete-account-confirm">Confirmation</Label>
            <Input id="delete-account-confirm" value={confirmText} onChange={(event) => setConfirmText(event.target.value)} placeholder={DELETE_CONFIRMATION} autoComplete="off" disabled={isLoading} />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
            <Button variant="destructive" disabled={confirmText !== DELETE_CONFIRMATION || isLoading} onClick={() => void handleDelete()}>
              {isLoading ? "Deleting…" : "Delete account"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
};

export default Settings;
