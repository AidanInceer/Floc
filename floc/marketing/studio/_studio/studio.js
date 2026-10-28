// One clock drives every variant: each frame is a pure function of t, so seek(t) on all keeps them in step.
const $ = (id) => document.getElementById(id);
const q = new URLSearchParams(location.search);
const state = { posts: [], post: q.get("post"), t: 2, playing: false, speed: 1, size: 280, frames: new Map(), durations: new Map() };

const fmt = (t) => `${Math.floor(t / 60)}:${(t % 60).toFixed(1).padStart(4, "0")}`;
const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const STATUS = { exploring: "Exploring", chosen: "Chosen", parked: "Parked" };
// Why: sections are CSS order in one flex box; moving an iframe in the DOM would reload it and drop the clock.
const SECTION = { chosen: 0, exploring: 2, parked: 4 };
const current = () => state.posts.find((p) => p.post === state.post);
const longest = () => Math.max(1, ...state.durations.values());

async function load() {
  state.posts = await (await fetch("/_studio/list.json")).json();
  if (!current()) state.post = state.posts[0]?.post ?? null;
}

async function call(method, url, data) {
  const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: data ? JSON.stringify(data) : undefined });
  const out = await res.json();
  if (out.error) alert(out.error);
  await load();
  drawSide();
  drawCards();
}

const FOLDER = '<svg viewBox="0 0 14 14" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"><path d="M1.5 3.5h4l1.2 1.5h5.8v6.5h-11z"/></svg>';
const plural = (n, word) => `${n} ${word}${n === 1 ? "" : "s"}`;

function drawSide() {
  const types = [...new Set(state.posts.map((p) => p.type))].sort((a, b) => a.localeCompare(b));
  $("posts").innerHTML = types.map((type) => {
    const posts = state.posts.filter((p) => p.type === type);
    return `<details class="folder" open><summary>${FOLDER}<span>${esc(type)}s</span><span class="count mono">${posts.length}</span></summary>${posts.map((p) => {
      const notes = p.variants.reduce((n, v) => n + v.review.notes.length, 0);
      const open = p.post === state.post;
      return `<details class="post" ${open ? "open" : ""}><summary ${open ? 'aria-current="page"' : ""}>${FOLDER}<a href="?post=${encodeURIComponent(p.post)}">${esc(p.post)}</a><span class="count mono">${plural(p.variants.length, "variant")}${notes ? ` · ${plural(notes, "note")}` : ""}</span></summary>
        <ul>${[...p.variants].sort((a, b) => SECTION[a.review.status] - SECTION[b.review.status]).map((v) => `<li><a href="?post=${encodeURIComponent(p.post)}#${v.scene}" data-status="${v.review.status}"><b>${esc(v.key)}</b><span class="mono">${STATUS[v.review.status]}${v.review.notes.length ? ` · ${plural(v.review.notes.length, "note")}` : ""}</span></a></li>`).join("")}</ul></details>`;
    }).join("")}</details>`;
  }).join("") || '<p class="empty">No scenes in studio/scenes.</p>';
}

function buildGrid() {
  const post = current();
  $("title").textContent = post?.post ?? "No posts";
  document.title = `${post?.post ?? "Studio"} · Floc marketing studio`;
  state.frames.clear();
  state.durations.clear();
  $("grid").innerHTML = Object.entries(SECTION).map(([s, order]) => `<h2 class="section" data-section="${s}" style="order:${order}"></h2>`).join("");
  for (const v of post?.variants ?? []) {
    const card = document.createElement("article");
    card.className = "card";
    card.dataset.scene = v.scene;
    card.id = v.scene;
    card.innerHTML = `<div class="frame"><iframe title="${esc(v.key)}" src="/${v.scene}/index.html?t=0" tabindex="-1"></iframe></div><div class="info"></div>`;
    const iframe = card.querySelector("iframe");
    iframe.addEventListener("load", async () => {
      await iframe.contentWindow.promoReady;
      state.durations.set(v.scene, iframe.contentWindow.PROMO.DURATION);
      state.frames.set(v.scene, iframe);
      $("scrub").max = String(longest());
      seekAll();
    });
    $("grid").append(card);
  }
  sizeFrames();
  drawCards();
}

function drawCards() {
  const post = current();
  drawSections();
  for (const v of post?.variants ?? []) {
    const card = $("grid").querySelector(`[data-scene="${v.scene}"]`);
    if (!card) continue;
    const s = v.review.status;
    const draft = card.querySelector("textarea")?.value ?? "";
    card.dataset.status = s;
    card.style.order = String(SECTION[s] + 1);
    card.querySelector(".info").innerHTML = `
      <div class="row"><b class="key">${esc(v.key)}</b><span class="tag ${s}">${STATUS[s]}</span><span class="mono dim">${esc(v.scene)}</span></div>
      ${v.about ? `<p class="about">${esc(v.about)}</p>` : ""}
      ${v.pieces.length ? `<p class="mono dim">Rendered: ${v.pieces.map((p) => `${p.stage}/${esc(p.slug)}`).join(", ")}</p>` : ""}
      <div class="row actions">
        ${s !== "chosen" ? '<button type="button" class="btn pen" data-status="chosen">Pick</button>' : ""}
        ${s !== "parked" ? '<button type="button" class="btn" data-status="parked">Park</button>' : ""}
        ${s !== "exploring" ? '<button type="button" class="btn" data-status="exploring">Reopen</button>' : ""}
      </div>
      <ol class="notes">${v.review.notes.map((n) => `<li><button type="button" class="at mono" data-t="${n.t}">${fmt(n.t)}</button><span>${esc(n.text)}</span><button type="button" class="x" data-note="${n.id}" aria-label="Delete note"><svg viewBox="0 0 14 14" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"><path d="M3.5 3.5l7 7M10.5 3.5l-7 7"/></svg></button></li>`).join("")}</ol>
      <form class="add"><textarea rows="2" aria-label="Note on ${esc(v.key)}"></textarea><button type="submit" class="btn">Note at <span class="mono now">${fmt(state.t)}</span></button></form>`;
    card.querySelector("textarea").value = draft;
  }
}

function drawSections() {
  const post = current();
  let first = true;
  for (const h of $("grid").querySelectorAll(".section")) {
    const n = post?.variants.filter((v) => v.review.status === h.dataset.section).length ?? 0;
    h.hidden = n === 0;
    h.classList.toggle("first", first && n > 0);
    if (n > 0) first = false;
    h.innerHTML = `${STATUS[h.dataset.section]} <span class="mono">${n}</span>`;
  }
}

function sizeFrames() {
  const w = Math.min(state.size, window.innerWidth - 48);
  document.documentElement.style.setProperty("--w", `${w}px`);
  document.documentElement.style.setProperty("--s", String(w / 1080));
}

function seekAll() {
  for (const [scene, iframe] of state.frames) iframe.contentWindow.seek(Math.min(state.t, state.durations.get(scene)));
  $("scrub").value = String(state.t);
  $("clock").textContent = `${fmt(state.t)} / ${fmt(longest())}`;
  for (const n of document.querySelectorAll(".now")) n.textContent = fmt(state.t);
}

function setT(t) {
  state.t = Math.min(Math.max(0, t), longest());
  seekAll();
}

function setPlaying(on) {
  state.playing = on;
  $("play").textContent = on ? "Pause" : "Play";
}

let last = performance.now();
function tick(now) {
  if (state.playing) {
    state.t += ((now - last) / 1000) * state.speed;
    if (state.t > longest()) state.t = 0;
    seekAll();
  }
  last = now;
  requestAnimationFrame(tick);
}

function pick(group, attr, value) {
  for (const b of document.querySelectorAll(`[data-${attr}]`)) if (b.closest(".seg") === group) b.setAttribute("aria-pressed", String(b.dataset[attr] === value));
}

document.addEventListener("click", (e) => {
  const b = e.target.closest("button");
  if (!b) return;
  const card = b.closest(".card");
  if (b.id === "play") setPlaying(!state.playing);
  else if (b.id === "theme") {
    const dark = document.documentElement.dataset.theme !== "dark";
    document.documentElement.dataset.theme = dark ? "dark" : "light";
    b.textContent = dark ? "Light" : "Dark";
  } else if (b.dataset.speed) { state.speed = Number(b.dataset.speed); pick(b.closest(".seg"), "speed", b.dataset.speed); }
  else if (b.dataset.size) { state.size = Number(b.dataset.size); pick(b.closest(".seg"), "size", b.dataset.size); sizeFrames(); }
  else if (b.dataset.t) { setPlaying(false); setT(Number(b.dataset.t)); }
  else if (b.dataset.status && card) act("POST", `/_studio/scenes/${card.dataset.scene}/status`, { status: b.dataset.status });
  else if (b.dataset.note && card) act("DELETE", `/_studio/scenes/${card.dataset.scene}/notes/${b.dataset.note}`);
});

document.addEventListener("submit", (e) => {
  e.preventDefault();
  const card = e.target.closest(".card");
  const text = e.target.querySelector("textarea").value;
  e.target.querySelector("textarea").value = "";
  act("POST", `/_studio/scenes/${card.dataset.scene}/notes`, { t: state.t, text });
});

document.addEventListener("keydown", (e) => {
  if (e.target.closest("textarea, input:not([type=range])")) {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) e.target.form?.requestSubmit();
    return;
  }
  if (e.key === " ") { e.preventDefault(); setPlaying(!state.playing); }
  if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
    e.preventDefault();
    setPlaying(false);
    setT(state.t + (e.key === "ArrowLeft" ? -1 : 1) * (e.shiftKey ? 1 : 0.1));
  }
});

$("scrub").addEventListener("input", (e) => { setPlaying(false); setT(Number(e.target.value)); });
window.addEventListener("resize", sizeFrames);

load().then(() => { drawSide(); buildGrid(); requestAnimationFrame(tick); }).catch((error) => alert(error.message));
