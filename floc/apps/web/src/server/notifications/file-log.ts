import "server-only";

import { db } from "@/db";
import { tripHref } from "@floc/core/notifications/notification-href";
import { recordActivity } from "@/server/notifications/activity";

export async function logFileAdded(file: { tripId: number; by: string; name: string; shared: boolean }): Promise<void> {
  if (!file.shared) return;
  await db.transaction((tx) =>
    recordActivity(
      tx,
      {
        kind: "file_added",
        tripId: file.tripId,
        actorId: file.by,
        subjectId: null,
        href: tripHref(file.tripId, "files"),
        affected: [],
        detail: file.name,
      },
      { fresh: true },
    ),
  );
}
