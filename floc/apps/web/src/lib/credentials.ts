/**
 * Pure credential checks (ticket 149), shared by the auth form and its tests.
 * Client-side niceties only — the real guarantees are Better Auth's password
 * hashing and the verification gate, not these.
 */

/** Enough to reject an obvious typo; the real check is the verification mail. */
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

/** A reason the new password is too weak, or null if it's fine. */
export function passwordWeakness(password: string): string | null {
  if (password.length < 8) return "Use at least 8 characters.";
  if (!/[a-zA-Z]/.test(password)) return "Include at least one letter.";
  if (!/[0-9]/.test(password)) return "Include at least one number.";
  return null;
}
