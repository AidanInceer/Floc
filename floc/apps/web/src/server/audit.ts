/**
 * The audit patch every write path merges into its `set`.
 *
 * This is what is left of `server/unlocks.ts`, which also owned the sticky
 * per-tab unlock flags until ticket 126 removed them and with them the last of
 * v1's persisted lifecycle state. `touch` stayed because it is orthogonal:
 * `last_modified_at` is for debugging, never for optimistic locking (rule 7).
 */
import "server-only";

/** Bumped by every write path so `last_modified_at` stays useful for debugging. */
export function touch() {
  return { lastModifiedAt: new Date() };
}
