export type LiveStatus = "live" | "saving" | "offline";

export const LIVE_STATUS_WORDS: Record<LiveStatus, string> = {
  live: "Live",
  saving: "Saving",
  offline: "Offline",
};

export function liveStatus(state: {
  connected: boolean;
  synced: boolean;
  unsynced: number;
  failed: boolean;
}): LiveStatus {
  if (state.failed || !state.connected) return "offline";
  return state.synced && state.unsynced === 0 ? "live" : "saving";
}
