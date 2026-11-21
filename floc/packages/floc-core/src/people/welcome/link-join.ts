export const JOIN_ON_ARRIVAL_MS = 10 * 60 * 1000;

export function joinsOnArrival({ sessionStartedAt, now }: { sessionStartedAt: Date | null; now: Date }): boolean {
  if (!sessionStartedAt) return false;
  return now.getTime() - sessionStartedAt.getTime() <= JOIN_ON_ARRIVAL_MS;
}

const INVITE_PATH = /\/invite\/([A-Za-z0-9_.-]+)/;

export function readInviteLink(text: string): string | null {
  return INVITE_PATH.exec(text.trim())?.[1] ?? null;
}
