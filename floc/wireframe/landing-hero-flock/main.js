import { variants } from "/_house/switcher.js";
import { renderHorizon, renderVote, renderSpin } from "./globes.js";
import { renderYours } from "./weeks.js";

const RENDER = { I1: renderHorizon, I2: renderVote, I3: renderSpin, J2: renderYours };
const stage = document.getElementById("stage");
let live = null;
let current = "I1";

function show(key) {
  live?.stop();
  current = key;
  document.body.dataset.v = key;
  scrollTo(0, 0);
  live = RENDER[key](stage);
}

variants([
  { key: "I1", round: 4, name: "Globe, the horizon: the globe rises under the headline; each trip turns up onto the top" },
  { key: "I2", round: 4, name: "Globe, the vote: six friends vote on three places, two each; your vote decides" },
  { key: "I3", round: 4, name: "Globe, the spin: all six trips beside the globe; flick it or press Spin and it picks one" },
  { key: "J2", round: 4, name: "Week, your days: mark the days you cannot do and the week moves to the next one that fits" },
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
