"use client";

import { api } from "@/lib/convexApi";
import { useConvexQueryHook, withUnwrap } from "@/lib/convexHooks";
import { uploadFileToR2 } from "@/lib/r2Upload";
import { useMutation } from "convex/react";
import { useState } from "react";

export function useGetMyResumesQuery(_filters?: Record<string, string> | void, options?: { skip?: boolean }) {
  return useConvexQueryHook(api.resumes.listMine, {}, options);
}

export function useDeleteResumeMutation() {
  const remove = useMutation(api.resumes.remove);
  const [isLoading, setIsLoading] = useState(false);
  const run = (id: string | number) => {
    setIsLoading(true);
    const promise = Promise.resolve(remove({ id: String(id) as never })).finally(() => setIsLoading(false));
    return withUnwrap(promise);
  };
  return [run, { isLoading }] as const;
}

export function useCreateResumeMutation() {
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);
  const syncMetadata = useMutation(api.files.syncMetadata);
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
      const storageId = await uploadFileToR2(generateUploadUrl, syncMetadata, file);
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
