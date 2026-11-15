// B3d, the pick: one quiet row of Budget, Spent, Left and Estimate, a thin whole-trip bar, then each line against its plan.

const pct = (v, max) => Math.max(0, Math.min(100, (v / max) * 100));

function basedOn(c) {
  const s = c.state.style;
  const from = c.state.home ? "from London Heathrow" : `<button type="button" class="link" data-act="home">add your home airport</button>`;
  return `<button type="button" class="based" data-act="based"><span>${c.esc(s.cabin)} ${from}, ${c.esc(s.stay.toLowerCase())} stays, ${c.esc(s.pace.toLowerCase())} pace</span><span class="based-go">Change</span></button>`;
}

function status(c, l, sp) {
  if (!l.plan) return { word: "No guide", tone: "" };
  if (sp === 0) return { word: "Not started", tone: "" };
  if (sp > l.plan[1]) return { word: `Over by ${c.pounds(sp - l.plan[1])}`, tone: "over" };
  if (sp >= l.plan[0]) return { word: "In range", tone: "ok" };
  return { word: `${c.range([l.plan[0] - sp, l.plan[1] - sp])} to go`, tone: "" };
}

function meter(c, l) {
  const sp = c.SPENT[l.id], st = status(c, l, sp);
  if (!l.plan) return `<span class="b3-m"></span><span class="b3-st">${c.fitTag(st)}</span>`;
  const max = Math.max(l.plan[1], sp) * 1.1;
  return `<span class="b3-m"><span class="sc-band" style="left:${pct(l.plan[0], max)}%;width:${pct(l.plan[1] - l.plan[0], max)}%"></span><span class="sc-fill" style="width:${pct(sp, max)}%"></span></span>` +
    `<span class="b3-st"><span class="nums">${c.pounds(sp)} of ${c.range(l.plan)}</span>${c.fitTag(st)}</span>`;
}

export function fitFor(c, t) {
  const b = c.state.budget;
  if (b == null) return null;
  if (b >= t[1]) return { word: "Fits", tone: "ok" };
  if (b < t[0]) return { word: `Over by ${c.pounds(t[0] - b)}`, tone: "over" };
  return { word: `Tight · up to ${c.pounds(t[1] - b)} short`, tone: "mid" };
}

export function budgetView(c) {
  const t = c.total(), spent = c.spent(), b = c.state.budget;
  const max = Math.max(t[1], b ?? 0) * 1.08;
  const edit = `<button type="button" class="iconbtn" data-act="budget" aria-label="Change budget">${c.g("pencil")}</button>`;
  const fig = (label, value) => `<span class="q-fig"><span class="b3-lab">${label}</span><span class="nums">${value}</span></span>`;
  const row = `<div class="q-row">${fig("Budget", b == null ? `<button type="button" class="btn btn-quiet" data-act="budget">Set a budget</button>` : `${c.pounds(b)}${edit}`)}` +
    `${fig("Spent", c.pounds(spent))}${fig("Left", b == null ? "—" : c.pounds(b - spent))}${fig("Estimate", c.range(t))}<span class="q-fit">${c.fitTag(fitFor(c, t))}</span></div>`;
  const bar = `<div class="q-bar" role="img" aria-label="Spent ${c.pounds(spent)} of an estimated ${c.range(t)}${b == null ? "" : `, budget ${c.pounds(b)}`}"><span class="sc-band" style="left:${pct(t[0], max)}%;width:${pct(t[1] - t[0], max)}%"></span><span class="sc-fill" style="width:${pct(spent, max)}%"></span>${b == null ? "" : `<span class="sc-line" style="left:${pct(b, max)}%"></span>`}</div>`;
  const rows = c.lines().map((l) => `<li class="b3-row"><span class="line-ico">${c.ico(l.icon)}</span><span class="r2-name">${c.esc(l.label)}<small>${c.esc(l.detail)}</small></span>${meter(c, l)}<button type="button" class="iconbtn" data-edit="${l.id}" aria-label="Change ${c.esc(l.label)}">${c.g("pencil")}</button></li>`).join("");
  return `<section class="b3"><div class="q-sum">${row}${bar}</div><ul class="b3-list">${rows}</ul><div class="b3-foot">${basedOn(c)}</div></section>`;
}

export function basedSheet(c) {
  const s = c.state.style;
  const group = (k, label, opts) => `<div class="choose"><span class="typed">${label}</span><div class="seg" role="group" aria-label="${label}">${opts.map((o) => `<button type="button" data-choose="${k}:${o}" aria-pressed="${o === s[k]}">${o}</button>`).join("")}</div></div>`;
  const changed = Object.keys(c.PROFILE).some((k) => s[k] !== c.PROFILE[k]);
  return c.sheetHead("How you travel on this trip") + `<div class="sheet-body">` +
    group("cabin", "Cabin", Object.keys(c.CABIN)) + group("stay", "Stay", Object.keys(c.STAY)) + group("pace", "Pace", Object.keys(c.PACE)) +
    `<p class="hint">${changed ? `This trip only. <button type="button" class="link" data-act="reset">Use my profile</button>` : "From your profile. A change here is for this trip only."}</p>` +
    `<div class="sheet-foot"><button type="button" class="btn btn-primary" data-close>Done</button></div></div>`;
}
