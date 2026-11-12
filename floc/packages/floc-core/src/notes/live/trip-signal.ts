/**
 * "This trip changed" (#577): one channel per trip on the Notes socket. A write names the areas it
 * touched, and every open page of that trip, web or phone, reads its data again. The message holds
 * the areas only — no content, no names.
 */
const PREFIX = "trip:";

/** Why: a write that touches four tables sends four signals; one read covers them all. */
export const TRIP_SIGNAL_WAIT_MS = 300;

const byName = (a: string, b: string) => a.localeCompare(b);

export function tripSignal(areas: readonly string[]): string {
  return PREFIX + [...new Set(areas)].sort(byName).join(",");
}

export function readTripSignal(payload: unknown): string[] | null {
  if (typeof payload !== "string" || !payload.startsWith(PREFIX)) return null;
  return payload.slice(PREFIX.length).split(",").filter(Boolean);
}

type SignalProvider = {
  on(event: "stateless", cb: (event: { payload: string }) => void): unknown;
  destroy(): void;
};

export type TripSignalSession = { close(): void };

export function openTripSignal(options: {
  connect: () => SignalProvider;
  onChange: (areas: string[]) => void;
}): TripSignalSession {
  const provider = options.connect();
  const pending = new Set<string>();
  let timer: ReturnType<typeof setTimeout> | null = null;
  let closed = false;

  const flush = () => {
    timer = null;
    if (closed) return;
    const areas = [...pending].sort(byName);
    pending.clear();
    options.onChange(areas);
  };

  provider.on("stateless", ({ payload }) => {
    const areas = readTripSignal(payload);
    if (!areas || closed) return;
    for (const area of areas) pending.add(area);
    timer ??= setTimeout(flush, TRIP_SIGNAL_WAIT_MS);
  });

  return {
    close() {
      closed = true;
      if (timer) clearTimeout(timer);
      provider.destroy();
    },
  };
}
