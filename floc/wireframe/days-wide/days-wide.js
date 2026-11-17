import { variants } from "/_house/switcher.js";
import { tripFrame } from "/_house/kit/trip-frame.mjs";
import { state, reset, onChange } from "./shared.js";
import { calPicked, wireCal } from "./v-cal.js";

const LIST = [
  { key: "N2", name: "Monday to Sunday week on wide screens; three columns below 1024px", round: 5 },
];

document.getElementById("frame").innerHTML = tripFrame("days", { name: "Aidan", initial: "Ai", tone: 1 });
const page = document.getElementById("page");

function render() {
  page.dataset.variant = state.variant;
  page.innerHTML = calPicked();
  wireCal(page);
}
onChange(render);

const band = () => `${matchMedia("(max-width: 700px)").matches}${matchMedia("(max-width: 1023px)").matches}`;
let was = band();
addEventListener("resize", () => {
  const now = band();
  if (now !== was) { was = now; render(); }
});

variants(LIST, (key) => {
  reset();
  state.variant = key;
  render();
});
