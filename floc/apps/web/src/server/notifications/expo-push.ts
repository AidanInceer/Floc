/** Expo Push Service, which hands each message to Google or Apple (#345). */
import "server-only";

import type { PushMessage, PushSender } from "@/server/notifications/push";

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";
const CHUNK = 100;
const TIMEOUT_MS = 10_000;

type Ticket = { status: "ok" | "error"; details?: { error?: string } };

async function sendChunk(chunk: PushMessage[]): Promise<Ticket[]> {
  const accessToken = process.env.EXPO_ACCESS_TOKEN;
  const response = await fetch(EXPO_PUSH_URL, {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      ...(accessToken ? { authorization: `Bearer ${accessToken}` } : {}),
    },
    body: JSON.stringify(chunk.map((m) => ({ ...m, sound: "default" }))),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!response.ok) throw new Error(`Expo push refused: ${response.status}`);
  const { data } = (await response.json()) as { data: Ticket[] };
  return data;
}

/** Why a failed chunk does not stop the rest: the chunks before it already went, and must not go twice. */
export const sendExpoPushes: PushSender = async (messages) => {
  const deadTokens: string[] = [];
  const failed: PushMessage[] = [];
  for (let i = 0; i < messages.length; i += CHUNK) {
    const chunk = messages.slice(i, i + CHUNK);
    let tickets: Ticket[];
    try {
      tickets = await sendChunk(chunk);
    } catch {
      failed.push(...chunk);
      continue;
    }
    tickets.forEach((ticket, j) => {
      if (ticket.details?.error === "DeviceNotRegistered") deadTokens.push(chunk[j].to);
    });
  }
  return { deadTokens, failed };
};
