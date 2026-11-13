// The live Files page, drawn by eye from app/trip/[id]/files and components/documents/.
import { esc, glyph, button } from "./shared.mjs";

export const CATS = { travel: "Travel", hotel: "Hotel", tickets: "Tickets", admin: "Admin", other: "Other" };
export const INBOX = "trip-1-b35577ee6df3@in.floc.app";

export function filesData() {
  return {
    shared: [
      { id: 1, kind: "PDF", name: "TAP boarding passes.pdf", by: "Priya", size: "212 KB", cat: "travel", on: "Flight to Lisbon" },
      { id: 2, kind: "PDF", name: "Alfama flat booking.pdf", by: "You", size: "44 KB", cat: "hotel" },
      { id: 3, kind: "PDF", name: "CP train, Lisbon to Lagos.pdf", by: "Tom", size: "128 KB", cat: "travel" },
      { id: 4, kind: "PDF", name: "Lagos villa confirmation.pdf", by: "Sofia", size: "96 KB", cat: "hotel", on: "Check in, Lagos villa" },
      { id: 5, kind: "PNG", name: "Kayak tickets.png", by: "Sofia", size: "1.1 MB", cat: "tickets" },
      { id: 6, kind: "PDF", name: "Group travel insurance.pdf", by: "Priya", size: "380 KB", cat: "admin" },
    ],
    mine: [
      { id: 7, kind: "PDF", name: "EHIC card.pdf", by: "You", size: "160 KB", cat: "admin" },
      { id: 8, kind: "JPG", name: "Passport scan.jpg", by: "You", size: "2.4 MB", cat: "other" },
    ],
  };
}

const row = (d) =>
  `<li class="doc" data-doc="${d.id}"><span class="kind typed">${d.kind}</span>` +
  `<span class="doc-main"><a href="#" class="doc-name">${esc(d.name)}</a><span class="doc-by nums">${d.by} · ${d.size}${d.on ? ` · <a href="#">on ${esc(d.on)}</a>` : ""}</span></span>` +
  `<span class="menu-host"><button type="button" class="cat-chip cat-${d.cat}" data-menu="file" aria-haspopup="menu" aria-expanded="false" aria-label="File this under">${CATS[d.cat]}</button></span>` +
  `<span class="menu-host"><button type="button" class="ib" data-menu="more" aria-haspopup="menu" aria-expanded="false" aria-label="More for ${esc(d.name)}">${glyph("more")}</button></span></li>`;

const card = (title, note, docs) =>
  `<section class="file-card"><header><h2>${title}</h2><span>${note}</span></header><div class="card"><ul>${docs.map(row).join("")}</ul></div></section>`;

export function filesPage(data) {
  const all = [...data.shared, ...data.mine];
  const counts = Object.keys(CATS).map((c) => [c, all.filter((d) => d.cat === c).length]).filter(([, n]) => n > 0);
  return `<div class="files-top"><div class="pills"><a href="#" class="pill on">All</a>${counts.map(([c, n]) => `<a href="#" class="pill">${CATS[c]} · ${n}</a>`).join("")}</div>` +
    `<span class="files-acts"><span class="menu-host"><button type="button" class="b ghost pen-words" data-menu="forward" aria-haspopup="menu" aria-expanded="false"><span>Forward bookings</span></button></span>${button("Upload", { kind: "primary", icon: "upload" })}</span></div>` +
    `<div class="files-grid">${card("Shared", "Everyone on the trip", data.shared)}${card("Yours", "Only you can see these", data.mine)}</div>`;
}

/** The menu panel each trigger opens, as on the live page. */
export function menuPanel(kind, doc) {
  if (kind === "forward") {
    return `<div class="forward"><p>Forward a booking email to</p><p class="addr">${INBOX}</p><p class="hint">Its attachments land in Yours, and Floc reads the booking.</p>` +
      `<div class="row">${button("Copy address", { kind: "ghost" })}${button("Open mail", { kind: "ghost" })}</div></div>`;
  }
  if (kind === "file") {
    return Object.entries(CATS).map(([c, label]) => `<button type="button" role="menuitem" data-cat="${c}" ${c === doc.cat ? 'aria-current="true"' : ""}>${label}</button>`).join("");
  }
  const verbs = (doc.cat === "travel" || doc.cat === "hotel") && !doc.on ? ["Add to Days", "Rename", "Archive"] : ["Rename", "Archive"];
  return verbs.map((v) => `<button type="button" role="menuitem" data-verb="${v}">${v}</button>`).join("");
}
