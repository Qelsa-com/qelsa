"use client";

import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useAdminAuth } from "@/contexts/AuthContext";
import {
  useGetUserQuery,
  useSetUserActiveMutation,
  useSetUserRoleMutation,
  useUpdateUserMutation,
} from "@/features/api/adminApi";
import { ArrowLeft, ShieldAlert } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

/**
 * Fields the admin can edit on a user. Mirrors ADMIN_USER_PATCH_KEYS in the
 * backend; the server drops anything not on its own allowlist.
 */
const EDITABLE_FIELDS = [
  { key: "name", label: "Name", type: "text" },
  { key: "username", label: "Username", type: "text" },
  { key: "headline", label: "Headline", type: "text" },
  { key: "phone", label: "Phone", type: "text" },
  { key: "linkedin_url", label: "LinkedIn URL", type: "text" },
  { key: "github_url", label: "GitHub URL", type: "text" },
  { key: "twitter_url", label: "Twitter URL", type: "text" },
  { key: "website", label: "Website", type: "text" },
  { key: "custom_profile_url", label: "Custom profile URL", type: "text" },
  { key: "nationality", label: "Nationality", type: "text" },
  { key: "expected_salary_currency", label: "Salary currency", type: "text" },
] as const;

export default function UserDetailPage() {
  const params = useParams<{ id: string }>();
  const userId = params?.id;
  const { user: adminUser } = useAdminAuth();

  const { data: user, isLoading } = useGetUserQuery(userId);
  const [updateUser, { isLoading: isSaving }] = useUpdateUserMutation();
  const [setUserRole, { isLoading: isChangingRole }] = useSetUserRoleMutation();
  const [setUserActive, { isLoading: isChangingStatus }] = useSetUserActiveMutation();

  const [draft, setDraft] = useState<Record<string, string>>({});
  const [about, setAbout] = useState("");
  const [summary, setSummary] = useState("");
  const [note, setNote] = useState("");

  // Seed the form once the record loads. Keyed on the user id so a background
  // query refresh does not overwrite an admin's in-progress edits.
  const [seededFor, setSeededFor] = useState<string | null>(null);
  useEffect(() => {
    if (!user || seededFor === user.id) return;
    const next: Record<string, string> = {};
    for (const field of EDITABLE_FIELDS) {
      const value = (user as Record<string, unknown>)[field.key];
      next[field.key] = value == null ? "" : String(value);
    }
    /* eslint-disable react-hooks/set-state-in-effect -- one-time form hydration from the loaded record */
    setDraft(next);
    setAbout(user.about ?? "");
    setSummary(user.professional_summary ?? "");
    setSeededFor(user.id);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [user, seededFor]);

  const handleSave = async () => {
    if (!userId || !user) return;
    const updates: Record<string, unknown> = {};
    for (const field of EDITABLE_FIELDS) {
      const value = draft[field.key]?.trim();
      if (value !== undefined) updates[field.key] = value;
    }
    if (about.trim()) updates.about = about.trim();
    if (summary.trim()) updates.professional_summary = summary.trim();

    const changed =
      Object.entries(updates).some(([key, value]) => {
        const current = (user as Record<string, unknown>)[key];
        return String(current ?? "") !== String(value ?? "");
      }) ||
      about !== (user.about ?? "") ||
      summary !== (user.professional_summary ?? "");
    if (!changed) {
      toast.info("Nothing changed.");
      return;
    }

    try {
      await updateUser({ userId, updates, note: note.trim() || undefined }).unwrap();
      toast.success("User details saved.");
      setNote("");
    } catch {
      toast.error("Could not save the user details.");
    }
  };

  const handleRoleChange = async (role: "user" | "admin") => {
    if (!userId || !user || role === user.role) return;
    if (
      !window.confirm(
        role === "admin"
          ? `Give ${user.email} full admin access? They will be able to manage users and jobs.`
          : `Remove admin access from ${user.email}?`,
      )
    ) {
      return;
    }
    try {
      await setUserRole({ userId, role, note: note.trim() || undefined }).unwrap();
      toast.success(`Role changed to ${role}.`);
      setNote("");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not change the role.");
    }
  };

  const handleStatusChange = async (isActive: boolean) => {
    if (!userId || !user || isActive === user.is_active) return;
    if (
      !isActive &&
      !window.confirm(`Suspend ${user.email}? They will be signed out and unable to access Qelsa.`)
    ) {
      return;
    }
    try {
      await setUserActive({ userId, isActive, note: note.trim() || undefined }).unwrap();
      toast.success(isActive ? "User reactivated." : "User suspended.");
      setNote("");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not change the status.");
    }
  };

  if (isLoading && !user) {
    return (
      <div className="space-y-4 px-5 py-6 md:px-8">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="px-5 py-6 md:px-8">
        <p className="text-sm text-muted-foreground">This user could not be loaded.</p>
      </div>
    );
  }

  const isSelf = user.id === adminUser?.id;

  return (
    <>
      <PageHeader
        title={user.name ?? user.email}
        description={`${user.email}${user.username ? ` · @${user.username}` : ""}`}
        actions={
          <Link
            href="/users"
            className="inline-flex items-center gap-2 rounded-full border border-glass-border px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-white/5"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to users
          </Link>
        }
      />

      <div className="grid gap-6 px-5 py-6 md:px-8 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <section className="rounded-2xl border border-glass-border glass p-5">
            <h2 className="text-sm font-semibold">Profile details</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Changes are recorded in the audit log.
            </p>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {EDITABLE_FIELDS.map((field) => (
                <div key={field.key} className="space-y-2">
                  <Label htmlFor={field.key}>{field.label}</Label>
                  <Input
                    id={field.key}
                    value={draft[field.key] ?? ""}
                    onChange={(event) =>
                      setDraft((current) => ({ ...current, [field.key]: event.target.value }))
                    }
                  />
                </div>
              ))}

              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="about">About</Label>
                <Textarea
                  id="about"
                  rows={4}
                  value={about}
                  onChange={(event) => setAbout(event.target.value)}
                />
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="professional_summary">Professional summary</Label>
                <Textarea
                  id="professional_summary"
                  rows={3}
                  value={summary}
                  onChange={(event) => setSummary(event.target.value)}
                />
              </div>
            </div>

            <div className="mt-5 space-y-2">
              <Label htmlFor="note">Audit note (optional)</Label>
              <Input
                id="note"
                value={note}
                onChange={(event) => setNote(event.target.value)}
                placeholder="Why is this change being made?"
              />
            </div>

            <Button
              onClick={() => void handleSave()}
              disabled={isSaving}
              className="mt-4 rounded-full bg-gradient-to-r from-neon-purple to-neon-pink text-white hover:opacity-90"
            >
              {isSaving ? "Saving…" : "Save changes"}
            </Button>
          </section>
        </div>

        <div className="space-y-6">
          <section className="rounded-2xl border border-glass-border glass p-5">
            <h2 className="text-sm font-semibold">Access</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Role and account status control what this user can reach.
            </p>

            <div className="mt-5 space-y-5">
              <div>
                <p className="mb-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
                  Role
                </p>
                <div className="flex gap-2">
                  {(["user", "admin"] as const).map((role) => (
                    <Button
                      key={role}
                      variant={user.role === role ? "default" : "outline"}
                      size="sm"
                      disabled={isChangingRole || isSelf || user.role === role}
                      onClick={() => void handleRoleChange(role)}
                      className={
                        user.role === role
                          ? "rounded-full bg-gradient-to-r from-neon-purple to-neon-pink text-white"
                          : "rounded-full border-glass-border bg-transparent text-white hover:bg-white/5"
                      }
                    >
                      {role === "admin" ? "Admin" : "User"}
                    </Button>
                  ))}
                </div>
                {isSelf && (
                  <p className="mt-2 text-xs text-amber-400/90">
                    You cannot change your own role.
                  </p>
                )}
              </div>

              <div>
                <p className="mb-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
                  Status
                </p>
                <div className="flex gap-2">
                  <Button
                    variant={user.is_active ? "outline" : "default"}
                    size="sm"
                    disabled={isChangingStatus || isSelf || user.is_active}
                    onClick={() => void handleStatusChange(true)}
                    className="rounded-full border-glass-border bg-transparent text-white hover:bg-white/5"
                  >
                    Reactivate
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    disabled={isChangingStatus || isSelf || !user.is_active}
                    onClick={() => void handleStatusChange(false)}
                    className="rounded-full"
                  >
                    Suspend
                  </Button>
                </div>
                {isSelf && (
                  <p className="mt-2 text-xs text-amber-400/90">
                    You cannot suspend your own account.
                  </p>
                )}
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-glass-border glass p-5">
            <h2 className="flex items-center gap-2 text-sm font-semibold">
              <ShieldAlert className="h-4 w-4 text-muted-foreground" />
              Account facts
            </h2>
            <dl className="mt-4 space-y-2.5 text-sm">
              {[
                ["Account type", user.account_type ?? "—"],
                ["Location", [user.city, user.state].filter(Boolean).join(", ") || "—"],
                ["Headline", user.headline ?? "—"],
                ["Job seeking status", user.job_seeking_status ?? "—"],
                ["Hiring role", user.hiring_role ?? "—"],
                ["Profile visibility", user.profile_visibility ?? "—"],
                ["Onboarding", user.onboarding_completed ? "Completed" : "Incomplete"],
                ["Joined", new Date(user.created_at).toLocaleDateString()],
                [
                  "Last login",
                  user.last_login_at ? new Date(user.last_login_at).toLocaleString() : "Never",
                ],
              ].map(([label, value]) => (
                <div key={label} className="flex items-start justify-between gap-3">
                  <dt className="shrink-0 text-muted-foreground">{label}</dt>
                  <dd className="truncate text-right text-white">{value}</dd>
                </div>
              ))}
            </dl>
          </section>
        </div>
      </div>
    </>
  );
}
