// Rank number and label fonts on their own, against the chosen headings (W4, Red Hat Display 800) and text (Red Hat Text, as in W3 and W4).
// Left: drag to order. Right: the site drawn with the font under the pointer, and your current top pick for the other role.
// The order lives in localStorage so a reload keeps it.
import { PICKED_HEADING as HEAD, TEXT_POOL, MONO_POOL, poolQuery, loadFonts } from "./sets.js";
import { wordmark, hero, trip, days, money } from "./parts.js";

const STORE = "tf-rank-text-v1";
const ROLES = [{ key: "mono", label: "Numbers and labels", pool: MONO_POOL }];
const TEXT = TEXT_POOL.find((f) => f.name === "Red Hat Text");
const FONTS = { sans: [TEXT], mono: MONO_POOL };
const find = (role, name) => FONTS[role].find((f) => f.name === name);

function load() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORE));
    if (saved?.mono) return saved;
  } catch {}
  return { mono: [] };
}
const order = load();
const save = () => localStorage.setItem(STORE, JSON.stringify(order));

function ranked(role) {
  const names = FONTS[role].map((f) => f.name);
  const kept = order[role].filter((n) => names.includes(n));
  return [...kept, ...names.filter((n) => !kept.includes(n))];
}

const role = "mono";
let previewing = null;

function previewVars() {
  const pick = (r) => find(r, r === role && previewing ? previewing : ranked(r)[0]);
  const s = TEXT, m = pick("mono");
  return {
    s, m,
    style: `--display:${HEAD.css};--d-wt:${HEAD.d};--d-track:${HEAD.track};--wm-wt:${HEAD.wm};--wm-track:${HEAD.wmTrack};--d-stretch:100%;--sans:${s.css};--type:${m.css}`,
  };
}

function specimen(f) {
  if (role === "sans") return `<span class="rk-spec rk-spec-s" style='font-family:${f.css}'>Keep the destination, dates, route and costs in one place. Tom can’t make the first two days.</span>`;
  return `<span class="rk-spec rk-spec-m" style='font-family:${f.css}'>THU 3 SEP · 7 NIGHTS · £480.00 · €163.50 · 09:00–10:00</span>`;
}

const grip = `<svg viewBox="0 0 14 14" aria-hidden="true"><circle cx="5" cy="3.5" r=".9"/><circle cx="9" cy="3.5" r=".9"/><circle cx="5" cy="7" r=".9"/><circle cx="9" cy="7" r=".9"/><circle cx="5" cy="10.5" r=".9"/><circle cx="9" cy="10.5" r=".9"/></svg>`;
const up = `<svg viewBox="0 0 14 14" aria-hidden="true"><path d="M3.4 8.6 7 5l3.6 3.6"/></svg>`;
const down = `<svg viewBox="0 0 14 14" aria-hidden="true"><path d="M3.4 5.4 7 9l3.6-3.6"/></svg>`;
const lock = `<svg class="ico" viewBox="0 0 14 14" aria-hidden="true"><rect x="2.8" y="6.2" width="8.4" height="6" rx="1.4"/><path d="M4.8 6.2V4.6a2.2 2.2 0 0 1 4.4 0v1.6"/></svg>`;

function row(name, i) {
  return `
    <li class="rk-row" data-name="${name}" aria-current="${name === previewing}">
      <span class="rk-grip" aria-hidden="true">${grip}</span>
      <span class="rk-place nums">${i + 1}</span>
      <span class="rk-main">
        ${specimen(find(role, name))}
        <span class="rk-name"><b>${name}</b></span>
      </span>
      <span class="rk-move">
        <button type="button" data-move="-1" aria-label="Move ${name} up">${up}</button>
        <button type="button" data-move="1" aria-label="Move ${name} down">${down}</button>
      </span>
    </li>`;
}

function drawPreview(root) {
  const p = previewVars();
  const box = root.querySelector(".rk-preview");
  box.setAttribute("style", p.style);
  box.querySelector(".rk-now").innerHTML =
    `<span>${HEAD.display} ${HEAD.d}</span> · <span>${p.s.name}</span> · <span class="is-on">${p.m.name}</span>`;
}

function drawList(root) {
  root.querySelector(".rk-list").innerHTML = ranked(role).map(row).join("");
}

function summary() {
  return `Headings: ${HEAD.display} ${HEAD.d} (W4, chosen)\nText: ${TEXT.name} (as in W3 and W4, chosen)\n\n` +
    ROLES.map((r) => `${r.label}:\n` + ranked(r.key).map((n, i) => `${i + 1}. ${n}`).join("\n")).join("\n\n");
}

function setPreview(root, name) {
  if (previewing === name) return;
  previewing = name;
  root.querySelectorAll(".rk-row").forEach((li) => li.setAttribute("aria-current", String(li.dataset.name === name)));
  drawPreview(root);
}

function startDrag(root, li, e) {
  const list = root.querySelector(".rk-list");
  const startY = e.clientY + scrollY;
  const startTop = li.offsetTop;
  li.classList.add("is-dragging");
  setPreview(root, li.dataset.name);

  const move = (ev) => {
    const others = [...list.children].filter((x) => x !== li);
    const target = others.find((x) => {
      const r = x.getBoundingClientRect();
      return ev.clientY < r.top + r.height / 2;
    });
    if (target) { if (target !== li.nextElementSibling) list.insertBefore(li, target); }
    else if (li !== list.lastElementChild) list.appendChild(li);
    li.style.transform = `translateY(${ev.clientY + scrollY - startY - (li.offsetTop - startTop)}px)`;
    if (ev.clientY < 60) scrollBy(0, -12);
    if (ev.clientY > innerHeight - 60) scrollBy(0, 12);
  };
  const end = () => {
    removeEventListener("pointermove", move);
    removeEventListener("pointerup", end);
    removeEventListener("pointercancel", end);
    li.classList.remove("is-dragging");
    li.style.transform = "";
    order[role] = [...list.children].map((x) => x.dataset.name);
    save();
    drawList(root);
    drawPreview(root);
  };
  addEventListener("pointermove", move);
  addEventListener("pointerup", end);
  addEventListener("pointercancel", end);
}

export function renderRank(stage) {
  loadFonts(HEAD);
  loadFonts({ q: poolQuery(MONO_POOL) });
  stage.innerHTML = `
    <div class="rk">
      <section class="rk-left">
        <p class="rk-locked">${lock}<span>Headings</span><b style='font-family:${HEAD.css};font-weight:${HEAD.d};letter-spacing:${HEAD.track}'>${HEAD.display} ${HEAD.d}</b><span class="nums">W4, chosen</span></p>
        <p class="rk-locked">${lock}<span>Text</span><b style='font-family:${TEXT.css}'>${TEXT.name}</b><span class="nums">W3 and W4, chosen</span></p>
        <h2 class="rk-title">Numbers and labels <span class="nums">${MONO_POOL.length}</span></h2>
        <ol class="rk-list"></ol>
        <div class="rk-actions">
          <button type="button" class="tf-btn" data-act="reset">Reset order</button>
          <button type="button" class="tf-btn is-primary" data-act="copy">Copy ranking</button>
        </div>
      </section>
      <section class="rk-right">
        <div class="rk-preview">
          <p class="rk-now typed"></p>
          <div class="rk-logo">${wordmark("is-lg")}</div>
          ${hero().replace('<h2 class="tf-sec-head typed">Landing</h2>', "")}
          <div class="rk-cards">${trip()}${money()}${days()}</div>
        </div>
      </section>
    </div>`;
  drawList(stage);
  drawPreview(stage);

  const list = stage.querySelector(".rk-list");
  list.addEventListener("pointerover", (e) => {
    const li = e.target.closest(".rk-row");
    if (li && !list.querySelector(".is-dragging")) setPreview(stage, li.dataset.name);
  });
  list.addEventListener("pointerdown", (e) => {
    const li = e.target.closest(".rk-row");
    if (!li || e.target.closest("button") || e.button > 0) return;
    // Why: on touch only the grip drags, so a swipe on the row still scrolls the page.
    if (e.pointerType !== "mouse" && !e.target.closest(".rk-grip")) { setPreview(stage, li.dataset.name); return; }
    e.preventDefault();
    startDrag(stage, li, e);
  });

  stage.onclick = async (e) => {
    const t = e.target.closest("button");
    if (!t) return;
    if (t.dataset.act === "copy") {
      await navigator.clipboard.writeText(summary());
      t.textContent = "Copied";
      setTimeout(() => { t.textContent = "Copy ranking"; }, 1200);
      return;
    }
    if (t.dataset.act === "reset") {
      if (!confirm("Reset the order?")) return;
      order.mono = [];
      save(); drawList(stage); drawPreview(stage); return;
    }
    if (t.dataset.move) {
      const name = t.closest(".rk-row").dataset.name;
      const now = ranked(role);
      const i = now.indexOf(name);
      const j = i + Number(t.dataset.move);
      if (j < 0 || j >= now.length) return;
      [now[i], now[j]] = [now[j], now[i]];
      order[role] = now;
      save();
      previewing = name;
      drawList(stage);
      drawPreview(stage);
      stage.querySelector(`.rk-row[data-name="${name}"] [data-move="${t.dataset.move}"]`)?.focus();
    }
  };
}
