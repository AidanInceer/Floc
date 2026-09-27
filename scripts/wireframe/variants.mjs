// The variant list every prototype shares: all options in one panel on the right, grouped by round, newest round first.
// list: [{ key, name, code?, round? }]. code is what a person calls it ("H2", "I3a"); key is what the page renders.

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const STORE = "wf-variants-open";

// Why: the pick lives in the prototype's wf-status meta ("Shipped 0.157.0 as G2", "Chosen: C"), so the panel reads it rather than asking every page to repeat it.
function pickedCode() {
  const raw = document.querySelector('meta[name="wf-status"]')?.content || "";
  return raw.match(/(?:\bas|Chosen:|Liked:|Exploring:|Parked:)\s*([A-Z][0-9]?[a-z]?)\b/)?.[1] || "";
}

function rounds(list) {
  const out = [];
  list.forEach((v, i) => {
    const name = v.round ? `Round ${v.round}` : "";
    let g = out.find((r) => r.name === name);
    if (!g) out.push((g = { name, n: v.round || 0, items: [] }));
    g.items.push({ ...v, i });
  });
  return out.sort((a, b) => b.n - a.n);
}

export function mountVariants(list, { current, onPick }) {
  const picked = pickedCode();
  const panel = document.createElement("aside");
  panel.className = "wf-vars";
  panel.setAttribute("aria-label", "Variants");
  const saved = localStorage.getItem(STORE);
  const open = saved ? saved === "1" : matchMedia("(min-width: 821px)").matches;
  panel.dataset.open = String(open);

  const groups = rounds(list);
  panel.innerHTML =
    `<button type="button" class="wf-vars-head" aria-expanded="${open}"><span class="typed">Variants</span><span class="wf-vars-now"></span><span class="nums wf-vars-count"></span>` +
    `<svg viewBox="0 0 14 14" aria-hidden="true"><path d="M4.2 8.4 7 5.6l2.8 2.8"/></svg></button>` +
    `<div class="wf-vars-body">` +
    groups.map((g) =>
      (g.name ? `<p class="wf-vars-round typed">${esc(g.name)}</p>` : "") +
      `<ul>${g.items.map((v) => {
        const code = v.code || v.key;
        const isPick = picked && code === picked;
        return `<li><button type="button" data-i="${v.i}"><b class="nums">${esc(code)}</b><span>${esc(v.name)}</span>${isPick ? '<em class="typed">Picked</em>' : ""}</button></li>`;
      }).join("")}</ul>`).join("") +
    `<p class="wf-vars-keys typed">← → to step</p></div>`;
  document.body.appendChild(panel);

  const head = panel.querySelector(".wf-vars-head");
  const now = panel.querySelector(".wf-vars-now");
  const count = panel.querySelector(".wf-vars-count");
  const pickIndex = list.findIndex((v) => (v.code || v.key) === picked);
  let index = list.findIndex((v) => v.key === current);
  if (index < 0) index = pickIndex >= 0 ? pickIndex : groups[0].items[0].i;

  const show = (i, scroll) => {
    index = (i + list.length) % list.length;
    const v = list[index];
    panel.querySelectorAll("[data-i]").forEach((b) => b.setAttribute("aria-current", String(Number(b.dataset.i) === index)));
    now.textContent = v.code || v.key;
    count.textContent = `${index + 1}/${list.length}`;
    if (scroll) panel.querySelector(`[data-i="${index}"]`)?.scrollIntoView({ block: "nearest" });
    onPick(v.key);
  };
  const toggle = () => {
    const next = panel.dataset.open !== "true";
    panel.dataset.open = String(next);
    head.setAttribute("aria-expanded", String(next));
    localStorage.setItem(STORE, next ? "1" : "0");
  };

  head.addEventListener("click", toggle);
  panel.addEventListener("click", (e) => {
    const b = e.target.closest("[data-i]");
    if (b) show(Number(b.dataset.i));
  });
  document.addEventListener("keydown", (e) => {
    if (e.target.closest?.("input, textarea, [contenteditable], [data-own-keys]")) return;
    if (e.key === "ArrowLeft") show(index - 1, true);
    if (e.key === "ArrowRight") show(index + 1, true);
  });
  show(index, true);
  return { show: (key) => show(Math.max(0, list.findIndex((v) => v.key === key))) };
}
