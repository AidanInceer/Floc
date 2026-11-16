import { queryClient } from "./api";
import { signOut } from "./auth";
import { forgetCachedNotes } from "./notes/live-cache";
import { sessionClosed } from "./session/session-ended";

export async function signOutHere({ expired = false }: { expired?: boolean } = {}): Promise<void> {
  if (!expired) sessionClosed();
  forgetCachedNotes();
  queryClient.clear();
  await signOut();
}
