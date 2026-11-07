/**
 * Why: a read refused with 401 left every screen on "That didn't load" with no way back to sign-in.
 * A refusal while signed in ends the session once and leaves the sign-in screen a notice; a late
 * refusal after you signed out yourself says nothing.
 */
type Listener = () => void;

const listeners = new Set<Listener>();
let live = false;
let notice = false;

export function isUnauthorized(error: unknown): boolean {
  const data = (error as { data?: { code?: string; httpStatus?: number } } | null)?.data;
  return data?.code === "UNAUTHORIZED" || data?.httpStatus === 401;
}

export function onSessionEnded(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function reportSessionEnded(): void {
  if (!live) return;
  live = false;
  notice = true;
  listeners.forEach((listener) => listener());
}

export function sessionResumed(): void {
  live = true;
}

export function sessionClosed(): void {
  live = false;
  notice = false;
}

export function takeEndedNotice(): boolean {
  const shown = notice;
  notice = false;
  return shown;
}
