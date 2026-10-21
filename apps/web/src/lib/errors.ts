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

/** Server-side plan checks use this copy; keep the match broad so the modal opens after a race. */
export function isApplicationLimitError(err: unknown) {
  return /free plan includes \d+ application|application limit reached/i.test(errorText(err));
}

export function isAgentQuotaError(err: unknown) {
  return /qelsa agent messages|agent message limit|daily message limit/i.test(errorText(err));
}
