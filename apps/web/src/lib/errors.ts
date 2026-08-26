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

/** Short copy for toasts and section fallbacks — never surface Convex request IDs. */
export function userFacingErrorMessage(err: unknown, fallback: string) {
  const raw = errorText(err);
  if (isDisconnect(raw)) return "Connection lost. Check your network and try again.";
  if (/too many bytes read|too many documents read/i.test(raw)) {
    return "This list is too large to load at once. Please try again.";
  }
  return fallback;
}

export function toastUnknownError(err: unknown, fallback: string) {
  toast.error(userFacingErrorMessage(err, fallback));
}
