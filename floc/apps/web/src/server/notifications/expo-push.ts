/** Expo Push Service, which hands each message to Google or Apple (#345). */
import "server-only";

import type { PushMessage, PushSender } from "@/server/notifications/push";

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";
const CHUNK = 100;

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
  });
  if (!response.ok) throw new Error(`Expo push refused: ${response.status}`);
  const { data } = (await response.json()) as { data: Ticket[] };
  return data;
}

export const sendExpoPushes: PushSender = async (messages) => {
  const deadTokens: string[] = [];
  for (let i = 0; i < messages.length; i += CHUNK) {
    const chunk = messages.slice(i, i + CHUNK);
    const tickets = await sendChunk(chunk);
    tickets.forEach((ticket, j) => {
      if (ticket.details?.error === "DeviceNotRegistered") deadTokens.push(chunk[j].to);
    });
  }
  return { deadTokens };
};
