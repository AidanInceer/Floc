// When an open tab renews its signed session cookie. Timing only — the browser side lives in components/chrome/session-renewal.tsx.

/** Under the cookie's five minutes in `server/auth/auth.ts`, so a page always finds it fresh. */
export const RENEW_EVERY_MS = 4 * 60_000;

/** How often the tab asks whether a renewal is due; asking costs nothing. */
export const CHECK_EVERY_MS = 30_000;

export function sessionRenewal(renew: () => Promise<unknown>, now: () => number, every = RENEW_EVERY_MS) {
  let last = -Infinity;
  let busy = false;
  return {
    /** A timer tick or the tab coming back: renews once the last renewal is old enough. */
    async check(visible: boolean): Promise<void> {
      if (!visible || busy || now() - last < every) return;
      busy = true;
      try {
        await renew();
        last = now();
      } catch {
        // Offline or the server is down: the next check tries again.
      } finally {
        busy = false;
      }
    },
  };
}
