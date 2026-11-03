// Variant switcher shared by the landing prototypes: ?variant= keeps your place; the list itself is the house panel.
import { mountVariants } from "/_house/variants.mjs";

export function variants(list, render) {
  const params = new URLSearchParams(location.search);
  mountVariants(list, {
    current: params.get("variant"),
    onPick: (key) => {
      const url = new URL(location.href);
      url.searchParams.set("variant", key);
      history.replaceState(null, "", url);
      render(key);
    },
  });
}

export const icon = {
  check: `<path d="M2.6 7.4 5.6 10.4 11.4 4"/>`,
  star: `<path d="M7 1.8l1.5 3.4 3.7.3-2.8 2.4.9 3.6L7 9.9 3.7 11.5l.9-3.6L1.8 5.5l3.7-.3Z"/>`,
  arrow: `<path d="M2.4 7h9.2M8 3.4 11.6 7 8 10.6"/>`,
  back: `<path d="M11.6 7H2.4M6 3.4 2.4 7 6 10.6"/>`,
  dates: `<rect x="1.8" y="2.8" width="10.4" height="9.4" rx="1.6"/><path d="M1.8 5.4h10.4M4.4 1.6v2.4M9.6 1.6v2.4"/>`,
  pin: `<path d="M7 12.4S2.8 8.6 2.8 5.8a4.2 4.2 0 0 1 8.4 0c0 2.8-4.2 6.6-4.2 6.6Z"/><circle cx="7" cy="5.7" r="1.4"/>`,
  money: `<circle cx="7" cy="7" r="5.2"/><path d="M8.6 5.2c-.4-.6-1-.9-1.7-.9-1 0-1.7.5-1.7 1.3 0 1.9 3.6.9 3.6 2.9 0 .8-.8 1.4-1.9 1.4-.8 0-1.5-.3-1.9-1M7 3.4v7.2"/>`,
  packing: `<rect x="1.8" y="4.4" width="10.4" height="7.8" rx="1.4"/><path d="M5 4.4V3.2a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v1.2M7 6.8v3"/>`,
  notes: `<path d="M3.2 1.8h5l2.6 2.6v7.8H3.2Z"/><path d="M8 1.8v2.8h2.8M5 7.4h4M5 9.4h2.6"/>`,
  files: `<path d="M1.8 4.2v6.4a1.2 1.2 0 0 0 1.2 1.2h8a1.2 1.2 0 0 0 1.2-1.2V5.4a1.2 1.2 0 0 0-1.2-1.2H6.9L5.7 2.6H3a1.2 1.2 0 0 0-1.2 1.2Z"/>`,
  flight: `<path d="M12.4 2.4 6.2 8.6M12.4 2.4l-4 9.8-2.2-3.6-3.6-2.2Z"/>`,
  weather: `<circle cx="5.1" cy="4.7" r="2"/><path d="M5.1 1.2v.8M5.1 7.4v.8M1.6 4.7h.8M7.8 4.7h.8"/><path d="M6.2 11.9a2.4 2.4 0 0 1 .3-4.8 3.1 3.1 0 0 1 5.8 1.2 1.9 1.9 0 0 1-.5 3.6Z"/>`,
  train: `<rect x="3" y="1.8" width="8" height="8.4" rx="1.8"/><path d="M3 6.4h8M5 12.2l1-2M9 12.2l-1-2"/>`,
  people: `<circle cx="5.2" cy="5" r="2"/><path d="M1.8 11.4c0-1.9 1.5-3 3.4-3s3.4 1.1 3.4 3"/><path d="M9.4 3.3a2 2 0 0 1 0 3.9M9.8 8.6c1.5.2 2.6 1.2 2.6 2.8"/>`,
  copy: `<rect x="4.4" y="4.4" width="7.8" height="7.8" rx="1.4"/><path d="M9.6 4.4V3a1.2 1.2 0 0 0-1.2-1.2H3A1.2 1.2 0 0 0 1.8 3v5.4A1.2 1.2 0 0 0 3 9.6h1.4"/>`,
};
export const ico = (name, cls = "ico") => `<svg class="${cls}" viewBox="0 0 14 14" aria-hidden="true">${icon[name]}</svg>`;

export const group = [
  { name: "Priya", tone: 1 }, { name: "Sam", tone: 4 }, { name: "Jo", tone: 2 },
  { name: "Alex", tone: 3 }, { name: "Maya", tone: 6 }, { name: "Kit", tone: 7 },
];
export const face = (p, size = 26) =>
  `<span class="avatar who-${p.tone}" style="width:${size}px;height:${size}px;font-size:${Math.round(size * 0.42)}px" title="${p.name}">${p.name[0]}</span>`;
