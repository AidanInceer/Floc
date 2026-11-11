import { variants } from "/_house/switcher.js";
import { renderPostcard } from "./postcard.js";
import { renderConverge } from "./converge.js";

const RENDER = { H1: renderPostcard, H2: renderConverge };
const stage = document.getElementById("stage");
let live = null;
let current = "H1";

function show(key) {
  live?.stop();
  current = key;
  document.body.dataset.v = key;
  scrollTo(0, 0);
  live = RENDER[key](stage);
}

variants([
  { key: "H1", round: 4, name: "A postcard from Priya: the trip as an Explore postcard, its route in Explore's style; who, when and a line for you on the back" },
  { key: "H2", round: 4, name: "Everyone's way there: three from London, two from Barcelona meet in Sicily on the paper globe; Join draws yours from Manchester" },
], show);

document.getElementById("replay").addEventListener("click", () => show(current));

let lastW = innerWidth;
let rt;
addEventListener("resize", () => {
  if (innerWidth === lastW) return;
  lastW = innerWidth;
  clearTimeout(rt);
  rt = setTimeout(() => show(current), 200);
});
