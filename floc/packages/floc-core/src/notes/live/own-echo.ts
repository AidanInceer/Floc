export type OwnChange = { done(ok: boolean): void };

const ECHO_GRACE_MS = 500;

type Waiting = { heard: boolean; closed: boolean };

export function ownEchoes(refresh: () => void, later: (run: () => void, ms: number) => void) {
  const waiting: Waiting[] = [];
  const drop = (w: Waiting) => {
    const at = waiting.indexOf(w);
    if (at >= 0) waiting.splice(at, 1);
  };

  return {
    begin(): OwnChange {
      const w: Waiting = { heard: false, closed: false };
      waiting.push(w);
      return {
        done(ok) {
          if (w.closed) return;
          w.closed = true;
          if (!ok) {
            drop(w);
            if (w.heard) refresh();
            return;
          }
          if (w.heard) drop(w);
          else later(() => { drop(w); }, ECHO_GRACE_MS);
        },
      };
    },
    heard() {
      const mine = waiting.find((w) => !w.heard);
      if (!mine) { refresh(); return; }
      mine.heard = true;
      if (mine.closed) drop(mine);
    },
  };
}
