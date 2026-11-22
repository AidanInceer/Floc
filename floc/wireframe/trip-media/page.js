import { variants } from "/_house/switcher.js";
import { addMedia, media, ME } from "./shared.js";
import { overview } from "./frame.js";
import { rowsCard } from "./cards.js";
import { tessGallery } from "./galleries.js";

const LIST = [
  { key: "G1E", label: "Tessellated, one top bar", note: "Rows that fill the width, by stop. On a photo, its controls take the place of the top bar, with close in the same spot.", round: 5 },
];

const stage = document.getElementById("stage");
const groupOf = (id) => media.find((m) => m.id === id)?.stop ?? "trip";

variants(LIST, () => {
  const paint = () => { stage.innerHTML = overview(ME, rowsCard()); };
  stage.className = "v-G1E";
  stage.onclick = (e) => {
    const add = e.target.closest("[data-add]");
    if (add) { addMedia(add.dataset.add || null); paint(); return; }
    const group = e.target.closest("[data-group]");
    if (group) { tessGallery(group.dataset.group, paint); return; }
    const t = e.target.closest("[data-m]");
    if (t) tessGallery(groupOf(t.dataset.m), paint);
  };
  paint();
});
