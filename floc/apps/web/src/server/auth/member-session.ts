/**
 * A guest on an invite link holds a real Better Auth session (#442, ADR-029),
 * but is never signed in as a member. Every door that reads a session passes it
 * through here, so a guest's cookie opens nothing a signed-out visitor cannot.
 */
type AnySession = { user: { isAnonymous?: boolean | null } } | null | undefined;

export function memberSession<S extends AnySession>(session: S): S | null {
  if (!session?.user || session.user.isAnonymous) return null;
  return session;
}
