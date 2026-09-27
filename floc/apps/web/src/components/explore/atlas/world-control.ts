import type * as Leaflet from "leaflet";

const GLOBE = `<svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" aria-hidden="true"><circle cx="7" cy="7" r="5.25"/><path d="M1.75 7h10.5M7 1.75c1.6 1.5 2.4 3.25 2.4 5.25S8.6 10.75 7 12.25M7 1.75C5.4 3.25 4.6 5 4.6 7s.8 3.75 2.4 5.25"/></svg>`;

/** "Every trip", drawn as one more button on the zoom bar so the map's controls stay in one narrow column. */
export function worldControl(L: typeof Leaflet, onClick: () => void): Leaflet.Control {
  const control = new L.Control({ position: "bottomleft" });
  control.onAdd = () => {
    const bar = L.DomUtil.create("div", "leaflet-bar");
    const button = L.DomUtil.create("a", "atlas-world", bar);
    button.href = "#";
    button.title = "Every trip";
    button.setAttribute("role", "button");
    button.setAttribute("aria-label", "Every trip");
    button.innerHTML = GLOBE;
    L.DomEvent.disableClickPropagation(bar);
    L.DomEvent.on(button, "click", (e) => {
      L.DomEvent.preventDefault(e);
      onClick();
    });
    return bar;
  };
  return control;
}
