import { variants } from "/_house/switcher.js";
import { renderTicket } from "./b-ticket.js";

const RENDER = { B: renderTicket };
const stage = document.getElementById("stage");
let stop = null;
let current = "B";

function show(key) {
  stop?.();
  current = key;
  document.body.dataset.v = key;
  stage.className = "hp";
  stop = RENDER[key](stage);
}

variants([
  { key: "B", round: 1, name: "One tall ticket: the hero is the ticket; it prints, the fields fill, it is stamped, and the stub is the way in" },
], show);

document.getElementById("replay").addEventListener("click", () => show(current));

let lastW = innerWidth;
let timer;
addEventListener("resize", () => {
  if (innerWidth === lastW) return;
  lastW = innerWidth;
  clearTimeout(timer);
  timer = setTimeout(() => show(current), 200);
});
