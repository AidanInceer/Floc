"use server";

import { redirect } from "next/navigation";

import { requireUser } from "@/server/access";
import { refresh } from "@/server/freshness";
import { openNotification as markOpened } from "@/server/notifications/inbox";

export async function openNotification(formData: FormData): Promise<void> {
  const viewer = await requireUser("/inbox");
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id) || id <= 0) return;

  const href = await markOpened(viewer.id, id);
  refresh({ kind: "inbox" });
  redirect(href ?? "/inbox");
}
