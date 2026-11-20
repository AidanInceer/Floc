const PREFIX = "trip:";
const AT = "@";
const WHOLE_TRIP = "trip";

export const TRIP_SIGNAL_WAIT_MS = 300;

const byName = (a: string, b: string) => a.localeCompare(b);

export type TripChange = { areas: string[]; sentAt: number };
export type TripView = { tab: string; renderedAt: number };

export function tripSignal(areas: readonly string[], sentAt?: number): string {
  const list = PREFIX + [...new Set(areas)].sort(byName).join(",");
  return sentAt ? `${list}${AT}${sentAt}` : list;
}

export function readTripChange(payload: unknown): TripChange | null {
  if (typeof payload !== "string" || !payload.startsWith(PREFIX)) return null;
  const [list, at] = payload.slice(PREFIX.length).split(AT);
  const sentAt = Number(at);
  return { areas: list.split(",").filter(Boolean), sentAt: Number.isSafeInteger(sentAt) && sentAt > 0 ? sentAt : 0 };
}

export function readTripSignal(payload: unknown): string[] | null {
  return readTripChange(payload)?.areas ?? null;
}

export function tripTabOf(pathname: string): string {
  const [, root, , tab] = pathname.split("/");
  return root === "trip" && tab ? tab : "overview";
}

export function refreshNeeded(change: TripChange, view: TripView): boolean {
  const touched = change.areas.includes(WHOLE_TRIP) || change.areas.includes(view.tab);
  if (!touched) return false;
  return change.sentAt === 0 || change.sentAt > view.renderedAt;
}

export function tripRefresh() {
  const waiting = new Set<string>();
  return {
    heard(change: TripChange, view: TripView): boolean {
      if (refreshNeeded(change, view)) {
        waiting.clear();
        return true;
      }
      if (!change.areas.includes(view.tab)) for (const area of change.areas) waiting.add(area);
      return false;
    },
    arrived(tab: string): boolean {
      if (!waiting.has(tab)) return false;
      waiting.clear();
      return true;
    },
  };
}

type SignalProvider = {
  on(event: "stateless", cb: (event: { payload: string }) => void): unknown;
  destroy(): void;
};

export type TripSignalSession = { close(): void };

export function openTripSignal(options: {
  connect: () => SignalProvider;
  onChange: (change: TripChange) => void;
}): TripSignalSession {
  const provider = options.connect();
  const pending = new Set<string>();
  let latest = 0;
  let timer: ReturnType<typeof setTimeout> | null = null;
  let closed = false;

  const flush = () => {
    timer = null;
    if (closed) return;
    const change = { areas: [...pending].sort(byName), sentAt: latest };
    pending.clear();
    latest = 0;
    options.onChange(change);
  };

  provider.on("stateless", ({ payload }) => {
    const change = readTripChange(payload);
    if (!change || closed) return;
    for (const area of change.areas) pending.add(area);
    latest = Math.max(latest, change.sentAt);
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
