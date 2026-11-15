/**
 * How a person's calendar import reads their events (ADR-031): every event, or all-day events
 * only. Remembered on the profile, so the choice holds on the web and the phone.
 */
import "server-only";

import { ensureProfile, getProfile, updateProfileFields } from "@/server/auth/profile";

export async function calendarAllDayOnly(userId: string): Promise<boolean> {
  return (await getProfile(userId))?.calendarAllDayOnly ?? false;
}

export async function setCalendarAllDayOnly(userId: string, on: boolean): Promise<void> {
  await ensureProfile(userId);
  await updateProfileFields(userId, { calendarAllDayOnly: on });
}
