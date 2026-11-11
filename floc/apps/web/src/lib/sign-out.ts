import { clearNotesCopies } from "./storage/notes-copies";

export const SIGN_OUT_FAILED = "Could not sign out. Try again.";

export async function trySignOut(
  signOut: () => Promise<{ error: unknown }>,
  clearCopies: () => Promise<void> = clearNotesCopies,
): Promise<string | null> {
  const { error } = await signOut().catch(() => ({ error: true }));
  if (error) return SIGN_OUT_FAILED;
  await clearCopies();
  return null;
}
