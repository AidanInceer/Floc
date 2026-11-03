export const SIGN_OUT_FAILED = "Could not sign out. Try again.";

export async function trySignOut(signOut: () => Promise<{ error: unknown }>): Promise<string | null> {
  const { error } = await signOut().catch(() => ({ error: true }));
  return error ? SIGN_OUT_FAILED : null;
}
