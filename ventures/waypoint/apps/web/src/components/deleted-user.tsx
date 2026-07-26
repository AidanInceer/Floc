/**
 * Consistent placeholder for a deleted account (ticket 06): content and
 * expense_split rows stay attributed to this label rather than disappearing
 * or showing a raw user id.
 */
export const DELETED_USER_NAME = "Deleted user";

export function DeletedUserName() {
  return <span className="italic text-ink-faint">{DELETED_USER_NAME}</span>;
}
