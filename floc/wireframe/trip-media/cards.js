import { counted, draw, groups, thumb } from "./shared.js";

const more = (html, n) => (n > 0 ? html.replace("</button>", `<span class="th-more nums">+${n}</span></button>`) : html);

const tiles = (list, shown, cls) =>
  list.slice(0, shown).map((m, i) => (i === shown - 1 ? more(thumb(m, cls), list.length - shown) : thumb(m, cls))).join("");

export function rowsCard() {
  const rows = groups().map((g) =>
    `<li class="ph-row"><div class="ph-row-h"><button type="button" class="ph-name" data-group="${g.id}">${g.no ? `<span class="book-no">${g.no}</span>` : ""}<b>${g.name}</b><span class="nums">${g.list.length}</span></button><button type="button" class="frame small" data-add="${g.id === "trip" ? "" : g.id}" aria-label="Add to ${g.name}">${draw("upload")}</button></div>` +
    `<div class="ph-four">${tiles(g.list, 4, "th-square")}</div></li>`).join("");
  return `<section class="side-card"><header class="ph-head"><h3 class="typed side-title">Photos</h3><span class="nums ph-n">${counted()}</span></header><ul class="ph-rows">${rows}</ul></section>`;
}
