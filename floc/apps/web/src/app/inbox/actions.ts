"use server";

import { redirect } from "next/navigation";

import { requireUser } from "@/server/access";
import { refresh } from "@/server/freshness";
import {
  markAllRead,
  markInboxSeen,
  openNotification as markOpened,
} from "@/server/notifications/inbox";

export async function openNotification(formData: FormData): Promise<void> {
  const viewer = await requireUser("/inbox");
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id) || id <= 0) return;

  const href = await markOpened(viewer.id, id);
  refresh({ kind: "inbox" });
  redirect(href ?? "/inbox");
}

/** Landing on the page answers the bell, not the rows (#403). */
export async function seeInbox(): Promise<void> {
  const viewer = await requireUser("/inbox");
  await markInboxSeen(viewer.id);
  refresh({ kind: "bell" });
}

export async function readEverything(): Promise<void> {
  const viewer = await requireUser("/inbox");
  await markAllRead(viewer.id);
  refresh({ kind: "inbox" });
}
