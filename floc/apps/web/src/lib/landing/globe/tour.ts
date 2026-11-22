export const TOUR_REST_MS = 2000;

export function nextInHand(hand: number[], at: number): number {
  return hand[(hand.indexOf(at) + 1) % hand.length]!;
}

export function globeTour(go: () => void) {
  const holds = new Set<string>();
  let resting = false;
  let watched = true;
  let touring = false;
  let timer: ReturnType<typeof setTimeout> | null = null;

  function disarm() {
    if (timer !== null) clearTimeout(timer);
    timer = null;
  }

  function sync() {
    if (!resting || !watched || holds.size > 0) return disarm();
    timer ??= setTimeout(() => {
      timer = null;
      resting = false;
      touring = true;
      go();
    }, TOUR_REST_MS);
  }

  return {
    rest(next: boolean) {
      resting = next;
      sync();
    },
    seen(next: boolean) {
      watched = next;
      sync();
    },
    hold(why: string, on: boolean) {
      if (on) holds.add(why);
      else holds.delete(why);
      sync();
    },
    touring: () => touring,
    byPerson() {
      touring = false;
    },
    stop() {
      watched = false;
      disarm();
    },
  };
}
