"use client";

import { useAuth } from "@/contexts/AuthContext";
import {
  useAddPageMemberMutation,
  useCancelInviteMutation,
  useGetPageMembersQuery,
  useInviteMembersMutation,
  useRemovePageMemberMutation,
  useSearchUsersQuery,
  useTransferOwnershipMutation,
  useUpdateMemberRoleMutation,
} from "@/features/api/pageMembersApi";
import { toastUnknownError } from "@/lib/errors";
import {
  Check,
  ChevronDown,
  Crown,
  Loader2,
  Mail,
  PenLine,
  Search,
  ShieldCheck,
  Trash2,
  UserCheck,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import React, { useEffect, useId, useState } from "react";
import { toast } from "sonner";
import { UserManagementSkeleton } from "./pageSkeletons";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";

interface UserManagementProps {
  pageId: string;
  showHeader?: boolean;
}

interface UserCandidate {
  id: string;
  name: string;
  username: string;
  email: string;
  image?: string;
  headline?: string;
}

export function UserManagement({ pageId, showHeader = true }: UserManagementProps) {
  const { user } = useAuth();
  const searchInputId = useId();

  // Queries
  const {
    data: membersData,
    isLoading: isMembersLoading,
    error: membersError,
  } = useGetPageMembersQuery(pageId);

  // Mutations
  const [addMemberMutation, { isLoading: isAddingMember }] = useAddPageMemberMutation();
  const [inviteMembersMutation, { isLoading: isInvitingMembers }] = useInviteMembersMutation();
  const [cancelInviteMutation, { isLoading: isCancellingInvite }] = useCancelInviteMutation();
  const [updateRoleMutation, { isLoading: isUpdatingRole }] = useUpdateMemberRoleMutation();
  const [removeMemberMutation, { isLoading: isRemovingMember }] = useRemovePageMemberMutation();
  const [transferOwnershipMutation, { isLoading: isTransferring }] = useTransferOwnershipMutation();

  // Modal & Email invite states
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [emails, setEmails] = useState<string[]>([]);
  const [emailInput, setEmailInput] = useState("");
  const [selectedRole, setSelectedRole] = useState<"admin" | "editor" | "">("admin");
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);

  // Transfer Ownership state
  const [transferConfirmUserId, setTransferConfirmUserId] = useState<string | null>(null);


  const addEmailString = (raw: string) => {
    const parts = raw
      .split(/[\s,;]+/)
      .map((e) => e.trim().toLowerCase())
      .filter((e) => e.length > 0 && e.includes("@"));

    if (parts.length > 0) {
      setEmails((prev) => {
        const set = new Set(prev);
        for (const p of parts) {
          set.add(p);
        }
        return Array.from(set);
      });
      setEmailInput("");
    }
  };

  const handleEmailKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === "," || e.key === ";") {
      e.preventDefault();
      if (emailInput.trim()) {
        addEmailString(emailInput);
      }
    } else if (e.key === "Backspace" && !emailInput && emails.length > 0) {
      setEmails((prev) => prev.slice(0, -1));
    }
  };

  const handleEmailPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text");
    if (pasted) {
      addEmailString(pasted);
    }
  };

  const handleEmailBlur = () => {
    if (emailInput.trim()) {
      addEmailString(emailInput);
    }
  };

  const removeEmail = (indexToRemove: number) => {
    setEmails((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const members = membersData?.members ?? [];
  const pendingInvites = membersData?.pendingInvites ?? [];
  const invitedCount = membersData?.invitedCount ?? 0;
  const userRole = membersData?.userRole;
  const canManage = Boolean(membersData?.canManage || user?.role === "admin");
  const isOwner = userRole === "owner";

  const handleOpenInvite = () => {
    setEmails([]);
    setEmailInput("");
    setSelectedRole("admin");
    setRoleDropdownOpen(false);
    setIsInviteModalOpen(true);
  };

  const handleSendInvites = async () => {
    let finalEmails = [...emails];
    if (emailInput.trim() && emailInput.includes("@")) {
      const extra = emailInput.trim().toLowerCase();
      if (!finalEmails.includes(extra)) {
        finalEmails.push(extra);
      }
      setEmails(finalEmails);
      setEmailInput("");
    }

    if (finalEmails.length === 0) {
      toast.error("Please enter at least one valid email address");
      return;
    }

    if (!selectedRole) {
      toast.error("Please select a role");
      return;
    }

    try {
      const res = await inviteMembersMutation({
        pageId,
        emails: finalEmails,
        role: selectedRole,
      });

      if (res?.invited?.length) {
        toast.success(`Invite sent to ${res.invited.length} user${res.invited.length > 1 ? "s" : ""}`);
      }
      if (res?.skipped?.length) {
        const reasons = res.skipped.map((s: { email: string; reason: string }) => `${s.email} (${s.reason})`).join(", ");
        toast.info(`Skipped: ${reasons}`);
      }

      setIsInviteModalOpen(false);
      setEmails([]);
      setEmailInput("");
    } catch (err) {
      toastUnknownError(err, "Failed to send invitations");
    }
  };

  const handleCancelInvite = async (inviteId: string, email: string) => {
    if (!confirm(`Are you sure you want to cancel the invitation for ${email}?`)) {
      return;
    }
    try {
      await cancelInviteMutation({ pageId, inviteId });
      toast.success(`Invitation for ${email} cancelled`);
    } catch (err) {
      toastUnknownError(err, "Failed to cancel invitation");
    }
  };

  const handleUpdateRole = async (memberId: string, role: "admin" | "editor") => {
    try {
      await updateRoleMutation({ pageId, memberId, role });
      toast.success("Role updated successfully");
    } catch (err) {
      toastUnknownError(err, "Failed to update role");
    }
  };

  const handleRemoveMember = async (memberId: string, name: string) => {
    if (!confirm(`Are you sure you want to remove ${name} from the team?`)) {
      return;
    }
    try {
      await removeMemberMutation({ pageId, memberId });
      toast.success(`${name} removed from the team`);
    } catch (err) {
      toastUnknownError(err, "Failed to remove member");
    }
  };

  const handleTransferOwnership = async (newOwnerUserId: string, name: string) => {
    if (
      !confirm(
        `Are you sure you want to transfer ownership of this page to ${name}? You will become an Admin.`,
      )
    ) {
      return;
    }
    try {
      await transferOwnershipMutation({ pageId, newOwnerUserId });
      toast.success(`Ownership transferred to ${name}`);
      setTransferConfirmUserId(null);
    } catch (err) {
      toastUnknownError(err, "Failed to transfer ownership");
    }
  };

  return (
    <div className="w-full">
      {/* Header section (if standalone) */}
      {showHeader && (
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            User Management
          </h1>
          <p className="mt-1 text-sm sm:text-base text-white/60">
            Manage who can access and edit this account
          </p>
        </div>
      )}

      {/* Main Container Card */}
      <div className="rounded-2xl border border-white/10 bg-[#0d0d17]/80 p-6 sm:p-10 shadow-2xl backdrop-blur-xl">
        {isMembersLoading ? (
          <UserManagementSkeleton />
        ) : membersError ? (
          <div className="flex min-h-[300px] flex-col items-center justify-center p-6 text-center">
            <p className="text-base text-red-400">Failed to load team members.</p>
            <p className="mt-1 text-xs text-white/40">Please check your permissions or try again later.</p>
          </div>
        ) : (
          /* Populated or Owner-Only State */
          <div>
            {/* Action Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-white">
                  Team Members ({members.length})
                </h2>
                <p className="mt-1 text-xs sm:text-sm text-white/60">
                  {invitedCount === 0
                    ? "1 owner · No teammates invited yet"
                    : `${invitedCount} invited teammate${invitedCount === 1 ? "" : "s"} and 1 owner`}
                </p>
              </div>

              {canManage && (
                <button
                  type="button"
                  onClick={handleOpenInvite}
                  className="flex h-10 items-center justify-center gap-2 rounded-full gradient-primary px-5 text-sm font-semibold text-white shadow-md transition-all hover:opacity-90 active:scale-95 shrink-0"
                >
                  <Users className="size-4" />
                  <span>Invite a teammate</span>
                </button>
              )}
            </div>

            {/* Members List */}
            <div className="divide-y divide-white/[0.08]">
              {members.map((member) => {
                const isMemberOwner = member.role === "owner" || member.is_owner;
                return (
                  <div
                    key={member.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-5 transition-colors hover:bg-white/[0.01]"
                  >
                    {/* User Identity */}
                    <div className="flex items-center gap-3.5">
                      {member.image ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={member.image}
                          alt={member.name}
                          className="size-11 rounded-full border border-white/15 object-cover shrink-0"
                        />
                      ) : (
                        <div className="flex size-11 items-center justify-center rounded-full border border-white/15 bg-gradient-to-br from-neon-purple/40 to-neon-pink/40 text-base font-bold text-white shrink-0">
                          {member.name?.charAt(0).toUpperCase() || "U"}
                        </div>
                      )}

                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-white text-sm sm:text-base truncate">
                            {member.name}
                          </p>
                          {member.username && (
                            <span className="text-xs text-white/50">
                              @{member.username}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-white/60 truncate">{member.email}</p>
                        <p className="text-[11px] text-white/40 mt-0.5">
                          {isMemberOwner
                            ? "Page Creator & Owner"
                            : `Joined ${new Date(member.joined_at).toLocaleDateString()}`}
                        </p>
                      </div>
                    </div>

                    {/* Role & Actions */}
                    <div className="flex items-center gap-3 self-end sm:self-center shrink-0">
                      {/* Role Badge or Selector */}
                      {isMemberOwner ? (
                        <div className="flex items-center gap-1.5 rounded-full border border-neon-cyan/40 bg-neon-cyan/10 px-3 py-1 text-xs font-semibold text-neon-cyan">
                          <Crown className="size-3.5" />
                          <span>Owner</span>
                        </div>
                      ) : canManage ? (
                        <div className="relative">
                          <select
                            value={member.role}
                            onChange={(e) =>
                              handleUpdateRole(
                                member.id,
                                e.target.value as "admin" | "editor",
                              )
                            }
                            disabled={isUpdatingRole}
                            className="appearance-none rounded-full border border-white/15 bg-[#141422] pl-3.5 pr-8 py-1.5 text-xs font-medium text-white transition-colors hover:border-white/30 focus:border-neon-cyan focus:outline-none cursor-pointer"
                          >
                            <option value="admin">🛡️ Admin</option>
                            <option value="editor">📝 Editor</option>
                          </select>
                          <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 size-3.5 text-white/50" />
                        </div>
                      ) : (
                        <div
                          className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${
                            member.role === "admin"
                              ? "border-neon-purple/40 bg-neon-purple/10 text-neon-purple"
                              : "border-neon-pink/40 bg-neon-pink/10 text-neon-pink"
                          }`}
                        >
                          {member.role === "admin" ? (
                            <ShieldCheck className="size-3.5" />
                          ) : (
                            <PenLine className="size-3.5" />
                          )}
                          <span className="capitalize">{member.role}</span>
                        </div>
                      )}

                      {/* Owner Transfer Option */}
                      {isOwner && !isMemberOwner && (
                        <button
                          type="button"
                          onClick={() =>
                            handleTransferOwnership(member.user_id, member.name)
                          }
                          title="Transfer ownership to this user"
                          className="flex h-8 items-center gap-1 rounded-full border border-white/10 bg-white/[0.04] px-2.5 text-xs text-white/70 hover:border-neon-cyan/40 hover:text-neon-cyan transition-colors"
                        >
                          <Crown className="size-3" />
                          <span className="hidden md:inline">Make Owner</span>
                        </button>
                      )}

                      {/* Remove Teammate Button */}
                      {!isMemberOwner && canManage && (
                        <button
                          type="button"
                          onClick={() => handleRemoveMember(member.id, member.name)}
                          disabled={isRemovingMember}
                          title={`Remove ${member.name}`}
                          className="flex size-8 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-white/50 transition-colors hover:border-red-500/40 hover:bg-red-500/10 hover:text-red-400"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Pending Invites List */}
              {pendingInvites.map((invite: { id: string; email: string; role: "admin" | "editor"; joined_at: number }) => (
                <div
                  key={invite.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-5 transition-colors hover:bg-white/[0.01]"
                >
                  {/* Identity */}
                  <div className="flex items-center gap-3.5">
                    <div className="flex size-11 items-center justify-center rounded-full border border-dashed border-white/25 bg-white/[0.04] text-sm font-bold text-white/70 shrink-0">
                      <Mail className="size-4 text-neon-cyan" />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-white text-sm sm:text-base truncate">
                          {invite.email}
                        </p>
                        <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-[11px] font-medium text-amber-300">
                          Pending Invite
                        </span>
                      </div>
                      <p className="text-[11px] text-white/40 mt-0.5">
                        Invited {new Date(invite.joined_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {/* Role & Cancel */}
                  <div className="flex items-center gap-3 self-end sm:self-center shrink-0">
                    <div
                      className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${
                        invite.role === "admin"
                          ? "border-neon-purple/40 bg-neon-purple/10 text-neon-purple"
                          : "border-neon-pink/40 bg-neon-pink/10 text-neon-pink"
                      }`}
                    >
                      {invite.role === "admin" ? (
                        <ShieldCheck className="size-3.5" />
                      ) : (
                        <PenLine className="size-3.5" />
                      )}
                      <span className="capitalize">{invite.role}</span>
                    </div>

                    {canManage && (
                      <button
                        type="button"
                        onClick={() => handleCancelInvite(invite.id, invite.email)}
                        disabled={isCancellingInvite}
                        title={`Cancel invitation for ${invite.email}`}
                        className="flex size-8 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-white/50 transition-colors hover:border-red-500/40 hover:bg-red-500/10 hover:text-red-400"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Empty Teammates Callout (when invitedCount === 0) */}
            {invitedCount === 0 && (
              <div className="mt-8 rounded-2xl border border-dashed border-white/15 bg-white/[0.015] px-6 py-10 sm:py-12 text-center">
                <div className="mx-auto flex size-14 sm:size-16 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-white/70 shadow-inner">
                  <Users className="size-7 sm:size-8 stroke-[1.5]" />
                </div>
                <h3 className="mt-4 text-lg sm:text-xl font-bold text-white">
                  No teammates added yet
                </h3>
                <p className="mx-auto mt-2 max-w-md text-xs sm:text-sm text-white/60 leading-relaxed">
                  Invite colleagues to help manage your page. They&apos;ll be able to post jobs, reply to messages, and keep things running.
                </p>
                {canManage && (
                  <button
                    type="button"
                    onClick={handleOpenInvite}
                    className="mt-6 inline-flex h-10 items-center justify-center gap-2 rounded-full gradient-primary px-6 text-xs sm:text-sm font-semibold text-white shadow-[0_0_20px_rgba(236,72,153,0.3)] transition-all hover:opacity-95 hover:shadow-[0_0_30px_rgba(236,72,153,0.5)] active:scale-95"
                  >
                    <Users className="size-4" />
                    <span>Invite a teammate</span>
                  </button>
                )}
              </div>
            )}

            {/* Role Permissions Reference Box */}
            <div className="mt-10 rounded-xl border border-white/10 bg-white/[0.02] p-5 sm:p-6">
              <h3 className="text-sm font-semibold tracking-wide text-white/90">
                Role Permissions
              </h3>
              <div className="mt-4 space-y-3.5 text-xs sm:text-sm">
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                  <div className="flex items-center gap-1.5 font-semibold text-neon-cyan shrink-0">
                    <Crown className="size-4" />
                    <span>Owner</span>
                  </div>
                  <span className="hidden sm:inline text-white/30">-</span>
                  <span className="text-white/60">
                    Full access to all features, can transfer ownership
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                  <div className="flex items-center gap-1.5 font-semibold text-neon-purple shrink-0">
                    <ShieldCheck className="size-4" />
                    <span>Admin</span>
                  </div>
                  <span className="hidden sm:inline text-white/30">-</span>
                  <span className="text-white/60">
                    Edit and publish content, manage users (except ownership transfer)
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                  <div className="flex items-center gap-1.5 font-semibold text-neon-pink shrink-0">
                    <PenLine className="size-4" />
                    <span>Editor</span>
                  </div>
                  <span className="hidden sm:inline text-white/30">-</span>
                  <span className="text-white/60">
                    Edit content and save drafts, changes require approval
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Invite Users Modal (Image 5 & QEL-69 Figma Design) */}
      <Dialog open={isInviteModalOpen} onOpenChange={setIsInviteModalOpen}>
        <DialogContent className="sm:max-w-md border border-white/15 bg-[#0e0e18] p-6 text-white shadow-2xl backdrop-blur-2xl">
          <DialogHeader className="flex flex-row items-center justify-between border-b border-white/10 pb-4">
            <DialogTitle className="text-xl font-bold tracking-tight text-white">
              Invite Users
            </DialogTitle>
          </DialogHeader>

          <div className="mt-4 space-y-5">
            {/* Field 1: Invite by Email */}
            <div>
              <label
                htmlFor={searchInputId}
                className="block text-sm font-semibold text-white/90 mb-2"
              >
                Invite by Email
              </label>

              {/* Multi-chip email input container */}
              <div
                onClick={() => document.getElementById(searchInputId)?.focus()}
                className="flex flex-wrap items-center gap-2 min-h-[48px] w-full rounded-xl border border-white/15 bg-white/[0.04] p-2 transition-colors focus-within:border-neon-cyan focus-within:ring-1 focus-within:ring-neon-cyan cursor-text"
              >
                {emails.map((em, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-neon-cyan/40 bg-neon-cyan/15 px-2.5 py-1 text-xs font-medium text-neon-cyan"
                  >
                    <span>{em}</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeEmail(idx);
                      }}
                      className="rounded-full p-0.5 hover:bg-neon-cyan/30 text-neon-cyan/70 hover:text-white"
                    >
                      <X className="size-3" />
                    </button>
                  </span>
                ))}

                <input
                  id={searchInputId}
                  type="text"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  onKeyDown={handleEmailKeyDown}
                  onPaste={handleEmailPaste}
                  onBlur={handleEmailBlur}
                  placeholder={
                    emails.length === 0
                      ? "Enter email addresses, separated by commas..."
                      : "Add more emails..."
                  }
                  className="flex-1 min-w-[170px] bg-transparent py-1 px-1 text-sm text-white placeholder-white/40 focus:outline-none"
                  autoFocus
                />
              </div>

              <p className="mt-1.5 text-xs text-white/40">
                You can add multiple email addresses at once
              </p>
            </div>

            {/* Field 2: Role Select */}
            <div>
              <label className="block text-sm font-semibold text-white/90 mb-2">
                Role
              </label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setRoleDropdownOpen((prev) => !prev)}
                  className="flex w-full items-center justify-between rounded-xl border border-white/15 bg-white/[0.04] px-4 py-2.5 text-sm text-white transition-colors hover:border-white/30 focus:border-neon-cyan focus:outline-none"
                >
                  <span className={selectedRole ? "text-white font-medium" : "text-white/40"}>
                    {selectedRole === "admin"
                      ? "🛡️ Admin - Edit, publish & manage users"
                      : selectedRole === "editor"
                      ? "📝 Editor - Edit content and save drafts"
                      : "Select a role"}
                  </span>
                  <ChevronDown className="size-4 text-white/50" />
                </button>

                {roleDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 z-20 mt-1.5 rounded-xl border border-white/15 bg-[#141424] p-1.5 shadow-2xl">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedRole("admin");
                        setRoleDropdownOpen(false);
                      }}
                      className="flex w-full flex-col items-start rounded-lg p-2.5 text-left hover:bg-white/[0.06] transition-colors"
                    >
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-neon-purple">
                        <ShieldCheck className="size-3.5" />
                        <span>Admin</span>
                      </div>
                      <p className="mt-0.5 text-[11px] text-white/60">
                        Can edit & publish content, post jobs, and manage editors.
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedRole("editor");
                        setRoleDropdownOpen(false);
                      }}
                      className="flex w-full flex-col items-start rounded-lg p-2.5 text-left hover:bg-white/[0.06] transition-colors mt-1"
                    >
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-neon-pink">
                        <PenLine className="size-3.5" />
                        <span>Editor</span>
                      </div>
                      <p className="mt-0.5 text-[11px] text-white/60">
                        Can create and edit content and save drafts.
                      </p>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Actions: Cancel + Send Invites */}
            <div className="mt-6 flex items-center justify-end gap-3 pt-3 border-t border-white/10">
              <button
                type="button"
                onClick={() => setIsInviteModalOpen(false)}
                className="flex h-10 items-center justify-center rounded-full border border-neon-cyan/50 bg-transparent px-6 text-sm font-semibold text-neon-cyan transition-colors hover:bg-neon-cyan/10"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleSendInvites}
                disabled={
                  (emails.length === 0 && !emailInput.trim()) ||
                  !selectedRole ||
                  isInvitingMembers
                }
                className="flex h-10 items-center justify-center gap-2 rounded-full gradient-primary px-6 text-sm font-semibold text-white shadow-lg transition-all hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isInvitingMembers ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    <span>Sending Invites...</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="size-4" />
                    <span>Send Invites</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
