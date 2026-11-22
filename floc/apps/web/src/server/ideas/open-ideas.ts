import "server-only";

import { and, eq, isNull, notExists, or } from "drizzle-orm";

import { db } from "@/db";
import { day, dayEvent, idea } from "@/db/schema";

export const openIdeas = (tripId: number) =>
  and(
    eq(idea.tripId, tripId),
    isNull(idea.deletedAt),
    or(
      isNull(idea.dayEventId),
      notExists(
        db
          .select({ id: dayEvent.id })
          .from(dayEvent)
          .innerJoin(day, eq(day.id, dayEvent.dayId))
          .where(and(eq(dayEvent.id, idea.dayEventId), isNull(dayEvent.deletedAt), isNull(day.deletedAt))),
      ),
    ),
  );
