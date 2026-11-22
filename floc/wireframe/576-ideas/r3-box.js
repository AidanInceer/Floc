import { esc } from "/_house/kit/trip-frame.mjs";
import { addField, gl, track, voteBtn } from "./shared.js";
import { boxMenu, editRow, emptyRow, goBtn, meta, roundTwo } from "./r2-shared.js";

function setOpen(ctx, open) {
  ctx.ui.open = open;
  const box = document.getElementById("ideas-box");
  if (!box) return;
  box.dataset.open = String(open);
  box.querySelector(".rk-toggle")?.setAttribute("aria-expanded", String(open));
  const fold = box.querySelector(".rk-fold");
  if (fold) fold.inert = !open;
  window.dispatchEvent(new Event("resize"));
}

function row(idea, ctx, voteFirst) {
  if (ctx.ui.editId === idea.id) return `<li class="r-row">${editRow(idea)}</li>`;
  const c = ctx.store.cat(idea.cat);
  const vote = voteBtn(idea, "vote-row");
  const name = `<span class="r-tile t-${c.type}">${gl(c.glyph)}</span><span class="r-t"><b>${esc(idea.title)}</b>${meta(idea, ctx)}</span>`;
  return voteFirst
    ? `<li class="r-row rk-row rk-first"><span class="rk-vote">${vote}</span>${name}<span class="rk-acts">${goBtn(idea)}</span>${boxMenu(idea, ctx)}</li>`
    : `<li class="r-row rk-row">${name}<span class="rk-acts">${vote}${goBtn(idea)}</span>${boxMenu(idea, ctx)}</li>`;
}

export function roundThree({ layout, voteFirst, ...spec }) {
  return roundTwo({
    round: 3,
    state: { open: false, planned: true },
    ...spec,
    belowHero(ctx) {
      const total = ctx.store.live().length;
      const list = ctx.store.live(ctx.ui.cat);
      return `<section class="rb rk rk-${layout}" id="ideas-box" data-open="${ctx.ui.open}">
        <header class="rk-head">
          <button type="button" class="rk-toggle" data-a="k-toggle" aria-expanded="${ctx.ui.open}" aria-controls="ideas-fold">${gl("chev", "rk-chev")}<h2>Ideas</h2><small class="nums">${total === 1 ? "1 idea" : `${total} ideas`}</small></button>
          <div class="rk-add">${addField(ctx, { key: layout, label: "New idea" })}</div>
          <div class="rk-filter">${track(ctx, layout === "centre" ? "ct-bare" : "")}</div>
        </header>
        <div class="rk-fold" id="ideas-fold"${ctx.ui.open ? "" : " inert"}><div class="rk-inner"><ul class="r-list" data-scroll="r-list">${list.map((i) => row(i, ctx, voteFirst)).join("") || `<li>${emptyRow}</li>`}</ul></div></div>
      </section>`;
    },
    protoExtra: (ctx) => `<div class="pknob" role="group" aria-label="Trip has dates and stops"><em>Dates and stops set</em><button type="button" data-a="k-plan" data-on="1" aria-pressed="${ctx.ui.planned}">Yes</button><button type="button" data-a="k-plan" data-on="0" aria-pressed="${!ctx.ui.planned}">No</button></div>`,
    ideaAdded(title, ctx) {
      if (!ctx.ui.open) ctx.toast(`Added ${title}`);
    },
    act(a, d, ctx) {
      if (a === "k-toggle") { setOpen(ctx, !ctx.ui.open); return true; }
      if (a === "open-ideas") {
        setOpen(ctx, true);
        document.getElementById("ideas-box")?.scrollIntoView({ behavior: "smooth", block: "start" });
        return true;
      }
      if (a === "k-plan") {
        const planned = d.on === "1";
        ctx.set({ planned, open: !planned });
        return true;
      }
      return false;
    },
  });
}
