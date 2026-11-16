export const RENEW_EVERY_MS = 4 * 60_000;

export const CHECK_EVERY_MS = 30_000;

export function sessionRenewal(renew: () => Promise<unknown>, now: () => number, every = RENEW_EVERY_MS) {
  let last = -Infinity;
  let busy = false;
  return {
    async check(visible: boolean): Promise<void> {
      if (!visible || busy || now() - last < every) return;
      busy = true;
      try {
        await renew();
        last = now();
      } catch {
      } finally {
        busy = false;
      }
    },
  };
}
