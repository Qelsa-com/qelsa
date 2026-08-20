import { toast } from "sonner";

function errorText(err: unknown): string {
  if (err instanceof Error && err.message) return err.message;
  if (typeof err === "string") return err;
  if (err && typeof err === "object" && "message" in err && typeof (err as { message: unknown }).message === "string") {
    return (err as { message: string }).message;
  }
  return "";
}

function isDisconnect(message: string) {
  return /connection lost|failed to fetch|networkerror|network request failed|offline|timed out|timeout|load failed|err_network|err_internet|socket/i.test(
    message,
  );
}

export function toastUnknownError(err: unknown, fallback: string) {
  const raw = errorText(err);
  if (isDisconnect(raw)) {
    toast.error("Connection lost. Check your network and try again.");
    return;
  }

  // Server errors can contain function names, stack traces, request IDs, and
  // implementation details. UI callers supply a short operation-specific copy.
  toast.error(fallback);
}
