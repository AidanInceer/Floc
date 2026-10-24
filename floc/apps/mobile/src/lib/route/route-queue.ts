// Why: the phone keeps positions until the server has them, so a day without signal uploads when it comes back (#329).
import { MAX_BATCH, type Position } from "@floc/core/trip/route/route-track";

export type Queued = Position & { tripId: number };
export type Tracking = { tripId: number; endDate: string };

/** Two weeks offline at one every 5 minutes. Past it, the oldest go first. */
export const MAX_QUEUE = 4000;

const pad = (n: number) => String(n).padStart(2, "0");

/** The phone's own day, read from its clock: on the trip, that is the trip's day. */
export function localDay(at: Date): string {
  return `${at.getFullYear()}-${pad(at.getMonth() + 1)}-${pad(at.getDate())}`;
}

export function positionFrom(
  tripId: number,
  location: { coords: { latitude: number; longitude: number }; timestamp: number },
): Queued {
  return {
    tripId,
    lat: location.coords.latitude,
    lng: location.coords.longitude,
    date: localDay(new Date(location.timestamp)),
    recordedAt: location.timestamp,
  };
}

const key = (p: Queued) => `${p.tripId}:${p.recordedAt}`;

export function enqueue(queue: Queued[], fresh: Queued[]): Queued[] {
  const have = new Set(queue.map(key));
  const merged = [...queue, ...fresh.filter((p) => !have.has(key(p)))].sort((a, b) => a.recordedAt - b.recordedAt);
  return merged.slice(-MAX_QUEUE);
}

export function batches(queue: Queued[]): { tripId: number; positions: Queued[] }[] {
  const trips = [...new Set(queue.map((p) => p.tripId))];
  return trips.flatMap((tripId) => {
    const mine = queue.filter((p) => p.tripId === tripId);
    return Array.from({ length: Math.ceil(mine.length / MAX_BATCH) }, (_, i) => ({
      tripId,
      positions: mine.slice(i * MAX_BATCH, (i + 1) * MAX_BATCH),
    }));
  });
}

export function sent(queue: Queued[], tripId: number, uploaded: Queued[]): Queued[] {
  const gone = new Set(uploaded.map((p) => p.recordedAt));
  return queue.filter((p) => p.tripId !== tripId || !gone.has(p.recordedAt));
}

export function stillOn(tracking: Tracking, today: string): boolean {
  return today <= tracking.endDate;
}
