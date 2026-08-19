export async function uploadFileToR2(
  generateUploadUrl: () => Promise<{ url: string; key: string }>,
  syncMetadata: (args: { key: string }) => Promise<null>,
  file: File,
) {
  const { url, key } = await generateUploadUrl();
  const uploaded = await fetch(url, {
    method: "PUT",
    headers: { "Content-Type": file.type || "application/octet-stream" },
    body: file,
  });
  if (!uploaded.ok) throw new Error("Could not upload that file.");
  await syncMetadata({ key });
  return key;
}
