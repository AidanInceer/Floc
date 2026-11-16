type AnySession = { user: { isAnonymous?: boolean | null } } | null | undefined;

export function memberSession<S extends AnySession>(session: S): S | null {
  if (!session?.user || session.user.isAnonymous) return null;
  return session;
}
