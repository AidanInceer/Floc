export type LiveStatus = "live" | "opening" | "saving" | "offline";

export const LIVE_STATUS_WORDS: Record<LiveStatus, string> = {
  live: "Live",
  opening: "Opening",
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
  if (state.unsynced > 0) return "saving";
  return state.synced ? "live" : "opening";
}
