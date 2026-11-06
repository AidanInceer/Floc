/**
 * Recording a member's route in the background (#329, ADR-026).
 *
 * Why a task, not a timer: a timer stops when the app is swiped away. The OS wakes this task about every
 * 5 minutes; on Android it runs as a foreground service with its own notification, so the member can
 * always see that it is on. Defined at module load, which the root layout makes happen on every start.
 */
import { POSITION_EVERY_MS } from "@floc/core/trip/route/route-track";
import * as Location from "expo-location";
import * as TaskManager from "expo-task-manager";

import { client } from "../api";
import { authClient } from "../auth";
import { batches, enqueue, localDay, positionFrom, sent, stillOn, type Tracking } from "./route-queue";
import { readRoute, writeRoute } from "./route-store";

const TASK = "floc-route";

export type StartRefusal = "foreground" | "background" | "session";

let flushing: Promise<void> | null = null;
let forgetting = false;
let generation = 0;

async function currentOwner(): Promise<string | null | undefined> {
  try {
    const session = await authClient.getSession();
    return session.error ? undefined : session.data?.user.id ?? null;
  } catch { return undefined; }
}

/** Sends what is queued; what fails stays for the next try. */
export function flushRoute(): Promise<void> {
  const started = generation;
  flushing ??= (async () => {
    try {
      const stored = await readRoute();
      const ownerId = await currentOwner();
      if (!ownerId || forgetting || started !== generation) return;
      if (stored.ownerId !== ownerId) {
        await stopRoute();
        await writeRoute({ tracking: null, queue: [] });
        return;
      }
      for (const batch of batches(stored.queue)) {
        if (forgetting || await currentOwner() !== ownerId || started !== generation) return;
        await client.route.record.mutate(batch);
        const now = await readRoute();
        await writeRoute({ ...now, queue: sent(now.queue, batch.tripId, batch.positions) });
      }
    } catch {
      // Offline or signed out: the queue keeps them.
    } finally {
      flushing = null;
    }
  })();
  return flushing;
}

TaskManager.defineTask<{ locations: Location.LocationObject[] }>(TASK, async ({ data, error }) => {
  if (error || !data) return;
  const started = generation;
  const stored = await readRoute();
  if (!stored.tracking || forgetting) return;
  const ownerId = await currentOwner();
  if (started !== generation || forgetting) return;
  if (!stored.ownerId || (ownerId !== undefined && ownerId !== stored.ownerId)) {
    await stopRoute();
    await writeRoute({ tracking: null, queue: [] });
    return;
  }
  if (!stillOn(stored.tracking, localDay(new Date()))) {
    await stopRoute();
    return;
  }
  const tripId = stored.tracking.tripId;
  await writeRoute({ ...stored, queue: enqueue(stored.queue, data.locations.map((l) => positionFrom(tripId, l))) });
  await flushRoute();
});

/** Null when it started. Asks "while using" first, then "always": Android refuses the second without the first. */
export async function startRoute(tracking: Tracking): Promise<StartRefusal | null> {
  const started = generation;
  const ownerId = await currentOwner();
  if (!ownerId) return "session";
  if ((await Location.requestForegroundPermissionsAsync()).status !== "granted") return "foreground";
  if ((await Location.requestBackgroundPermissionsAsync()).status !== "granted") return "background";
  if (started !== generation || await currentOwner() !== ownerId) return "session";
  const stored = await readRoute();
  await writeRoute({ tracking, ownerId, queue: stored.ownerId === ownerId ? stored.queue : [] });
  await Location.startLocationUpdatesAsync(TASK, {
    accuracy: Location.Accuracy.Balanced,
    timeInterval: POSITION_EVERY_MS,
    deferredUpdatesInterval: POSITION_EVERY_MS,
    distanceInterval: 0,
    pausesUpdatesAutomatically: false,
    showsBackgroundLocationIndicator: true,
    foregroundService: {
      notificationTitle: "Recording your route",
      notificationBody: "Floc saves where you are every 5 minutes, for this trip only.",
      killServiceOnDestroy: false,
    },
  });
  return null;
}

export async function stopRoute(): Promise<void> {
  generation++;
  await writeRoute({ ...(await readRoute()), tracking: null });
  if (await Location.hasStartedLocationUpdatesAsync(TASK).catch(() => false)) {
    await Location.stopLocationUpdatesAsync(TASK);
  }
}

export async function forgetRecordedRoute(): Promise<void> {
  forgetting = true;
  try {
    await stopRoute();
    await flushing;
    await writeRoute({ tracking: null, queue: [] });
  } finally { forgetting = false; }
}

/** Which trip this phone records, if any. */
export async function recordingTrip(): Promise<number | null> {
  const { tracking } = await readRoute();
  if (!tracking) return null;
  return (await Location.hasStartedLocationUpdatesAsync(TASK).catch(() => false)) ? tracking.tripId : null;
}
