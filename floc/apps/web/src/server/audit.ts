/**
 * The audit patch every write path merges into its `set`.
 *
 * `last_modified_at` is for debugging, never for optimistic locking (rule 7).
 */
import "server-only";

/** Bumped by every write path so `last_modified_at` stays useful for debugging. */
export function touch() {
  return { lastModifiedAt: new Date() };
}
