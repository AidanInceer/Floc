import "server-only";

import { eq, isNull } from "drizzle-orm";

import { db } from "@/db";
import { userNotificationSettings } from "@/db/schema";

export type AlertSettings = Pick<
  typeof userNotificationSettings.$inferSelect,
  "notifyPush" | "notifyEmail" | "notifyReminders" | "notifyNextTrip" | "marketingEmailConsentAt"
>;

const DEFAULT_ALERTS: AlertSettings = {
  notifyPush: true,
  notifyEmail: true,
  notifyReminders: true,
  notifyNextTrip: true,
  marketingEmailConsentAt: null,
};

export async function readAlertSettings(userId: string): Promise<AlertSettings> {
  const row = await db
    .select({
      notifyPush: userNotificationSettings.notifyPush,
      notifyEmail: userNotificationSettings.notifyEmail,
      notifyReminders: userNotificationSettings.notifyReminders,
      notifyNextTrip: userNotificationSettings.notifyNextTrip,
      marketingEmailConsentAt: userNotificationSettings.marketingEmailConsentAt,
    })
    .from(userNotificationSettings)
    .where(eq(userNotificationSettings.userId, userId))
    .get();
  return row ?? DEFAULT_ALERTS;
}

type Writer = Pick<typeof db, "insert">;

export async function saveAlertSettings(
  userId: string,
  patch: Partial<Omit<AlertSettings, "marketingEmailConsentAt">>,
  writer: Writer = db,
): Promise<void> {
  await writer
    .insert(userNotificationSettings)
    .values({ userId, ...patch })
    .onConflictDoUpdate({ target: userNotificationSettings.userId, set: { ...patch, lastModifiedAt: new Date() } });
}

export async function setMarketingEmailConsent(userId: string, on: boolean, now: Date, writer: Writer = db): Promise<void> {
  const insert = writer.insert(userNotificationSettings).values({ userId, marketingEmailConsentAt: on ? now : null });
  if (!on) {
    await insert.onConflictDoUpdate({
      target: userNotificationSettings.userId,
      set: { marketingEmailConsentAt: null, lastModifiedAt: now },
    });
    return;
  }
  await insert.onConflictDoUpdate({
    target: userNotificationSettings.userId,
    set: { marketingEmailConsentAt: now, lastModifiedAt: now },
    setWhere: isNull(userNotificationSettings.marketingEmailConsentAt),
  });
}
