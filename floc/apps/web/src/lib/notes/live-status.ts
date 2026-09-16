export type LiveStatus = "saved" | "saving" | "offline";

export function liveStatus(state: {
  connected: boolean;
  synced: boolean;
  unsynced: number;
  failed: boolean;
}): LiveStatus {
  if (state.failed || !state.connected) return "offline";
  return state.synced && state.unsynced === 0 ? "saved" : "saving";
}
