/**
 * Why one path: the phone may be handed to the next person, who must not see
 * the last account's trips from the query cache or its cached notes pages.
 */
import { queryClient } from "./api";
import { signOut } from "./auth";
import { forgetCachedNotes } from "./notes/live-cache";

export async function signOutHere(): Promise<void> {
  forgetCachedNotes();
  queryClient.clear();
  await signOut();
}
