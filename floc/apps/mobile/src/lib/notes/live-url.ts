import { LIVE_NOTES_PATH } from "@floc/core/notes/live/live-names";

export const liveNotesUrl = (base: string) => `${base.replace(/^http/, "ws")}${LIVE_NOTES_PATH}`;
