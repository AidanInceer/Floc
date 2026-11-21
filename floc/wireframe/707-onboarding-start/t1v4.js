import { startV, welcomeV } from "./r6.js";

export const meta = {
  key: "T1v4",
  round: 6,
  name: "T1v3 that fits its content, with the logo",
  idea: "T1v3 with no spare space: the modal is as tall as the step needs, and when the next step is taller or shorter it eases to the new height instead of jumping, so the buttons move with it. The welcome opens on the floc mark and Welcome to floc. in the wordmark, and the mark stays small in the corner on every question.",
};

export const welcome = () => welcomeV(4);
export const start = () => startV({ glide: true });
