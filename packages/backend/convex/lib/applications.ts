/** Seeker-withdrawn applications use this status. Hidden from both lists. */
export const WITHDRAWN_STATUS = "cancelled" as const;

export function isWithdrawn(status: string) {
  return status === WITHDRAWN_STATUS;
}
