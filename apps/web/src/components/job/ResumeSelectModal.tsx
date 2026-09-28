"use client";

import { useCreateResumeMutation } from "@/features/api/resumeApi";
import { toastUnknownError } from "@/lib/errors";
import { Loader2, Upload, X } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

export interface ResumeItem {
  id: string | number;
  title: string;
  file_url?: string;
  createdAt?: string;
  updatedAt?: string;
  description?: string;
}

interface ResumeSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  resumes: ResumeItem[];
  defaultResumeId?: string | number | null;
  matchedResumeIds?: (string | number)[];
  onMatch: (resumeId: string) => void;
  onViewMatch: (resumeId: string) => void;
}

function formatRelativeTime(dateStr?: string) {
  if (!dateStr) return "Recently";
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return "Recently";
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return "Just now";
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays}d ago`;
  const diffInWeeks = Math.floor(diffInDays / 7);
  if (diffInWeeks < 4) return `${diffInWeeks}w ago`;
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(date);
}

export function ResumeSelectModal({
  isOpen,
  onClose,
  resumes,
  defaultResumeId,
  matchedResumeIds = [],
  onMatch,
  onViewMatch,
}: ResumeSelectModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedResumeId, setSelectedResumeId] = useState<string | number | null>(() => {
    const matched = resumes.find((r) => String(r.id) === String(defaultResumeId));
    return matched?.id ?? resumes[0]?.id ?? null;
  });
  const [isUploading, setIsUploading] = useState(false);
  const [createResume] = useCreateResumeMutation();

  useEffect(() => {
    if (isOpen) {
      const matched = resumes.find((r) => String(r.id) === String(defaultResumeId));
      setSelectedResumeId(matched?.id ?? resumes[0]?.id ?? null);
    }
  }, [isOpen, resumes, defaultResumeId]);

  if (!isOpen) return null;

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const validTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    if (!validTypes.includes(file.type) && !file.name.match(/\.(pdf|doc|docx)$/i)) {
      toast.error("Please upload a PDF or DOCX file");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File size must be less than 10MB");
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("title", file.name);
      formData.append("file", file);
      const created = await createResume(formData as any).unwrap();
      const newId = created?.data?.id;
      if (newId != null) {
        setSelectedResumeId(newId);
      }
      toast.success("Resume uploaded successfully");
    } catch (error: unknown) {
      toastUnknownError(error, "Could not upload your resume. Please try again.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const matchedSet = new Set((matchedResumeIds ?? []).map((id) => String(id)));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity" onClick={onClose} />

      {/* Modal Card */}
      <div className="relative z-10 flex w-full max-w-[540px] flex-col rounded-[24px] border border-white/10 bg-[#0d0d1a] shadow-[0_24px_64px_rgba(0,0,0,0.6)]">
        {/* Header */}
        <div className="flex items-start justify-between p-6 pb-4">
          <div>
            <h3 className="text-xl font-bold text-white">Choose a resume to match</h3>
            <p className="mt-1 text-sm text-white/50">Select the resume Qelsa should compare with this job.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-white/45 transition-colors hover:bg-white/10 hover:text-white"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Content list */}
        <div className="max-h-[60vh] overflow-y-auto px-6 py-2">
          <div className="space-y-3">
            {resumes.map((resume) => {
              const isSelected = String(resume.id) === String(selectedResumeId);
              const hasMatch = matchedSet.has(String(resume.id));

              return (
                <div
                  key={resume.id}
                  onClick={() => setSelectedResumeId(resume.id)}
                  className={`group flex items-center justify-between rounded-2xl border p-4 transition-all cursor-pointer ${
                    isSelected
                      ? "border-[#00d4ff] bg-[#00d4ff]/[0.03] shadow-[0_0_24px_rgba(0,212,255,0.06)]"
                      : "border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]"
                  }`}
                >
                  <div className="flex min-w-0 flex-1 items-center gap-3.5">
                    {/* Radio indicator */}
                    <div
                      className={`flex size-5 shrink-0 items-center justify-center rounded-full border transition-colors ${
                        isSelected ? "border-[#00d4ff]" : "border-white/30 group-hover:border-white/50"
                      }`}
                    >
                      {isSelected && <div className="size-2.5 rounded-full bg-[#00d4ff]" />}
                    </div>

                    <div className="min-w-0 flex-1">
                      <h4 className="truncate text-sm font-semibold text-white">{resume.title || "Resume"}</h4>
                      <p className="mt-0.5 truncate text-xs text-white/45">
                        {resume.description
                          ? `${resume.description} • Updated ${formatRelativeTime(resume.updatedAt || resume.createdAt)}`
                          : `Updated ${formatRelativeTime(resume.updatedAt || resume.createdAt)}`}
                      </p>
                    </div>
                  </div>

                  {hasMatch && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onViewMatch(String(resume.id));
                      }}
                      className="ml-3 shrink-0 rounded-full border border-neon-cyan/50 bg-neon-cyan/10 px-3.5 py-1 text-xs font-semibold text-neon-cyan transition-colors hover:bg-neon-cyan/20"
                    >
                      View match
                    </button>
                  )}
                </div>
              );
            })}

            {/* Upload Box */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#00d4ff]/40 bg-transparent p-6 text-center cursor-pointer transition-colors hover:border-[#00d4ff] hover:bg-[#00d4ff]/[0.02]"
            >
              <div className="flex size-11 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-neon-cyan">
                {isUploading ? <Loader2 className="size-5 animate-spin" /> : <Upload className="size-5" />}
              </div>
              <span className="mt-3 text-sm font-semibold text-white">
                {isUploading ? "Uploading resume..." : "Upload a new resume"}
              </span>
              <span className="mt-0.5 text-xs text-white/45">PDF or DOCX · up to 10 MB</span>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.doc,.docx"
                className="hidden"
                disabled={isUploading}
                onChange={handleFileUpload}
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-white/10 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-white/15 bg-white/[0.04] px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-white/10"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!selectedResumeId || isUploading}
            onClick={() => selectedResumeId && onMatch(String(selectedResumeId))}
            className="rounded-full bg-gradient-to-r from-[#7c2ff3] to-[#d73e9d] px-6 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Match
          </button>
        </div>
      </div>
    </div>
  );
}
