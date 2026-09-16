export type LiveStatus = "saved" | "saving" | "offline";

export const LIVE_STATUS_WORDS: Record<LiveStatus, string> = {
  saved: "Saved",
  saving: "Saving",
  offline: "Offline — changes kept",
};

export function liveStatus(state: {
  connected: boolean;
  synced: boolean;
  unsynced: number;
  failed: boolean;
}): LiveStatus {
  if (state.failed || !state.connected) return "offline";
  return state.synced && state.unsynced === 0 ? "saved" : "saving";
}
