"use client";

import { api } from "@/lib/convexApi";
import { useMutation } from "convex/react";
import { useConvexQueryHook, withUnwrap } from "@/lib/convexHooks";
import { useState } from "react";

export function useGetMyResumesQuery(_filters?: Record<string, string> | void, options?: { skip?: boolean }) {
  return useConvexQueryHook(api.resumes.listMine, {}, options);
}

export function useCreateResumeMutation() {
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);
  const create = useMutation(api.resumes.create);
  const [isLoading, setIsLoading] = useState(false);
  const trigger = async (input: FormData | { title?: string; file?: File }) => {
    setIsLoading(true);
    try {
      let file: File | undefined;
      let title = "Resume";
      if (input instanceof FormData) {
        file = input.get("file") as File;
        title = (input.get("title") as string) || file?.name || "Resume";
      } else {
        file = input.file;
        title = input.title || file?.name || "Resume";
      }
      if (!file) throw new Error("Resume file is required");
      const postUrl = await generateUploadUrl();
      const result = await fetch(postUrl, { method: "POST", headers: { "Content-Type": file.type }, body: file });
      const { storageId } = await result.json();
      const created = (await create({ title, storageId })) as { resume?: { id: string }; id?: string };
      const id = created?.resume?.id ?? created?.id;
      return { data: { id } };
    } finally {
      setIsLoading(false);
    }
  };
  const run = (input: FormData | { title?: string; file?: File }) => withUnwrap(trigger(input));
  return [run, { isLoading }] as const;
}
