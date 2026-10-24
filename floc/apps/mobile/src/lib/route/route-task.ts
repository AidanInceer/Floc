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
import { batches, enqueue, localDay, positionFrom, sent, stillOn, type Tracking } from "./route-queue";
import { readRoute, writeRoute } from "./route-store";

const TASK = "floc-route";

export type StartRefusal = "foreground" | "background";

let flushing: Promise<void> | null = null;

/** Sends what is queued; what fails stays for the next try. */
export function flushRoute(): Promise<void> {
  flushing ??= (async () => {
    try {
      for (const batch of batches((await readRoute()).queue)) {
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
  const stored = await readRoute();
  if (!stored.tracking) return;
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
  if ((await Location.requestForegroundPermissionsAsync()).status !== "granted") return "foreground";
  if ((await Location.requestBackgroundPermissionsAsync()).status !== "granted") return "background";
  await writeRoute({ ...(await readRoute()), tracking });
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
  await writeRoute({ ...(await readRoute()), tracking: null });
  if (await Location.hasStartedLocationUpdatesAsync(TASK).catch(() => false)) {
    await Location.stopLocationUpdatesAsync(TASK);
  }
}

/** Which trip this phone records, if any. */
export async function recordingTrip(): Promise<number | null> {
  const { tracking } = await readRoute();
  if (!tracking) return null;
  return (await Location.hasStartedLocationUpdatesAsync(TASK).catch(() => false)) ? tracking.tripId : null;
}
