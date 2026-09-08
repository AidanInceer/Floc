/**
 * What an auth failure is called on screen (#no-ticket).
 *
 * Shared by all four doors — sign in, sign up, forgotten password, new
 * password — because they fail the same two ways and must not disagree about
 * the wording of either.
 *
 * NOTHING HERE NAMES AN ACCOUNT. Which of the address or the password was
 * wrong, and whether an address is registered at all, are the same question;
 * answering it would turn the sign-in screen into an account-enumerator.
 */
import { API_BASE_URL } from "./config";

export const OFFLINE = `Can't reach ${API_BASE_URL}. Check the server is running and the phone can see it.`;

/**
 * A request that never arrived carries no status, so Better Auth reports it the
 * same shape as a refusal. Telling the two apart matters most in development,
 * where a firewalled dev server otherwise reads as a wrong password.
 */
export function unreachable(error: { status?: number }): boolean {
  return !error.status;
}

export function explainSignIn(error: { status?: number }): string {
  return unreachable(error) ? OFFLINE : "That email and password don't match.";
}

export function explainSignUp(error: { status?: number; message?: string }): string {
  if (unreachable(error)) return OFFLINE;
  if (/already exists|already registered/i.test(error.message ?? "")) {
    return "An account with this email already exists — sign in instead.";
  }
  return error.message ?? "Something went wrong. Try again.";
}

export function explainGoogle(error: { status?: number; code?: string; message?: string }): string {
  if (unreachable(error)) return OFFLINE;
  if (error.code === "ACCOUNT_NOT_LINKED" || /not linked/i.test(error.message ?? "")) {
    return "This email already has an account here. Sign in with your password, then link Google from Settings.";
  }
  return "Google sign-in isn't available right now.";
}
