/**
 * Renewals, cancellations and refunds after the purchase. Either store retries
 * on anything but 2xx, so a body we cannot use is still acknowledged — only
 * "cannot check right now" asks for a retry.
 */
import "server-only";

import { readAppStoreNotification } from "./app-store";
import { isPubSubPush, readPlaySubscription } from "./play";
import { ownerOfStoreTransaction, recordStoreSubscription } from "./store-record";

export async function applyAppStoreNotification(body: unknown): Promise<number> {
  const signedPayload = (body as { signedPayload?: unknown } | null)?.signedPayload;
  if (typeof signedPayload !== "string") return 400;

  const read = await readAppStoreNotification(signedPayload);
  if (read === "unavailable") return 503;
  if (read === "refused") return 400;
  if (read === "ignored") return 200;

  // Why: a purchase nobody has claimed has no account yet; the app's claim writes it.
  const owner = await ownerOfStoreTransaction(read.storeTransactionId);
  if (owner) await recordStoreSubscription({ userId: owner, source: "app_store", facts: read });
  return 200;
}

function purchaseTokenOf(body: unknown): string | null {
  const data = (body as { message?: { data?: unknown } } | null)?.message?.data;
  if (typeof data !== "string") return null;
  try {
    const decoded = JSON.parse(Buffer.from(data, "base64").toString("utf8")) as {
      subscriptionNotification?: { purchaseToken?: unknown };
    };
    const token = decoded.subscriptionNotification?.purchaseToken;
    return typeof token === "string" ? token : null;
  } catch {
    return null;
  }
}

export async function applyPlayNotification(
  authorization: string | null,
  body: unknown,
): Promise<number> {
  if (!(await isPubSubPush(authorization))) return 401;

  const token = purchaseTokenOf(body);
  if (!token) return 200;

  const read = await readPlaySubscription(token);
  if (read === "unavailable") return 503;
  if (read === "refused") return 200;

  const owner =
    (await ownerOfStoreTransaction(token)) ??
    (read.replaces ? await ownerOfStoreTransaction(read.replaces) : null);
  if (owner) await recordStoreSubscription({ userId: owner, source: "play", ...read });
  return 200;
}
