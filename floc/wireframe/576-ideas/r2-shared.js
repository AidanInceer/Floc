import { esc } from "/_house/kit/trip-frame.mjs";
import { dayLabel, gl } from "./shared.js";

const ROUND_TWO = "L";
const SETTLE_MS = 200;
let renderedAt = 0;
let liveCtx = null;

export function meta(idea, ctx) {
  const parts = [];
  if (ctx.ui.cat === "all") parts.push(ctx.store.cat(idea.cat).label);
  if (idea.day) parts.push(`${dayLabel(idea.day)}${idea.time ? ` ${idea.time}` : ""}`);
  return parts.length ? `<small>${esc(parts.join(", "))}</small>` : "";
}

export function boxMenu(idea, ctx) {
  const open = ctx.ui.menu === idea.id;
  const pop = open
    ? `<span class="more-pop r-pop" role="menu"><button type="button" role="menuitem" data-a="r-edit" data-id="${idea.id}">Edit name</button><button type="button" role="menuitem" class="danger" data-a="remove" data-id="${idea.id}">Remove</button></span>`
    : "";
  return `<span class="more"><button type="button" class="r-more" data-a="menu" data-id="${idea.id}" aria-label="More for ${esc(idea.title)}" aria-haspopup="menu" aria-expanded="${open}">${gl("more")}</button>${pop}</span>`;
}

export const goBtn = (idea, label = "Add to Days") =>
  `<button type="button" class="r-go" data-a="place-open" data-id="${idea.id}" aria-label="Add ${esc(idea.title)} to Days"><span>${label}</span>${gl("arrow")}</button>`;

export const editRow = (idea) =>
  `<form class="r-rename" data-f="rename"><input type="hidden" name="id" value="${idea.id}"><input name="title" maxlength="80" value="${esc(idea.title)}" aria-label="Idea name" data-keep="rename-${idea.id}" autocomplete="off"><button type="submit" class="btn btn-primary">Save</button><button type="button" class="ibtn" data-a="r-edit-cancel" aria-label="Cancel editing">${gl("cross")}</button></form>`;

export const emptyRow = '<p class="r-empty">Nothing here yet</p>';

function pin(ctx) {
  liveCtx = ctx;
  renderedAt = performance.now();
  const pop = document.querySelector(".r-pop");
  if (!pop) return;
  const anchor = pop.parentElement.getBoundingClientRect();
  const below = anchor.bottom + 4 + pop.offsetHeight <= window.innerHeight;
  pop.style.position = "fixed";
  pop.style.right = `${document.documentElement.clientWidth - anchor.right}px`;
  pop.style.top = `${below ? anchor.bottom + 4 : anchor.top - pop.offsetHeight - 4}px`;
}

window.addEventListener("scroll", () => {
  if (!liveCtx?.ui.menu || !ROUND_TWO.includes(document.body.dataset.variant)) return;
  if (performance.now() - renderedAt > SETTLE_MS) liveCtx.set({ menu: null });
}, true);

function baseAct(a, d, ctx) {
  const id = Number(d.id);
  if (a === "open-ideas") {
    document.getElementById("ideas-box")?.scrollIntoView({ behavior: "smooth", block: "start" });
    return true;
  }
  if (a === "r-edit") {
    ctx.focus = `[data-keep="rename-${id}"]`;
    ctx.set({ editId: id, exp: null });
    return true;
  }
  if (a === "r-edit-cancel") { ctx.set({ editId: null }); return true; }
  return false;
}

export function roundTwo({ act, state = {}, ...spec }) {
  return {
    round: 2,
    ...spec,
    initial: () => ({ editId: null, exp: null, ...state }),
    after: pin,
    act(a, d, ctx) {
      return act?.(a, d, ctx) === true || baseAct(a, d, ctx);
    },
    submit(form, data, ctx) {
      if (form.dataset.f !== "rename") return;
      const title = String(data.get("title") ?? "").trim();
      if (title) ctx.store.idea(Number(data.get("id"))).title = title;
      ctx.set({ editId: null });
    },
    escape(ctx) {
      if (ctx.ui.editId) ctx.set({ editId: null });
      else if (ctx.ui.exp) ctx.set({ exp: null });
      else if (ctx.ui.adding) ctx.set({ adding: false });
    },
  };
}
