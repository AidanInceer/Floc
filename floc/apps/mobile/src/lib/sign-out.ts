/**
 * Why one path: the phone may be handed to the next person, who must not see
 * the last account's trips from the query cache or its cached notes pages.
 */
import { queryClient } from "./api";
import { signOut } from "./auth";
import { forgetCachedNotes } from "./notes/live-cache";
import { sessionClosed } from "./session/session-ended";

/** `expired`: the server refused the session, so the sign-in screen keeps its notice. */
export async function signOutHere({ expired = false }: { expired?: boolean } = {}): Promise<void> {
  if (!expired) sessionClosed();
  forgetCachedNotes();
  queryClient.clear();
  await signOut();
}
