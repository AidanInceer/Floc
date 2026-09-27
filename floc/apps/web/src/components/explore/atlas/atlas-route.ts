import type * as Leaflet from "leaflet";

import { spread } from "@/components/explore/atlas/pin-spread";
import { routeAt, type Point } from "@/components/explore/atlas/route-draw";
import { visitsOf, type Visit } from "@/components/explore/atlas/route-visits";
import { placeTags, type Box } from "@/components/explore/atlas/tag-place";
import type { RouteMapStop } from "@/components/map/route-map";
import { routePin } from "@/components/map/route-pin";

const LEG_MS = 650;
const PIN_HALF = 13;
// Why: pins are 26px across; closer than this they touch.
const PIN_GAP = 30;

type Drawn = { pin: Leaflet.Marker; tag: HTMLElement; days: HTMLElement };

function drawVisit(L: typeof Leaflet, layer: Leaflet.LayerGroup, visit: Visit, at: Point): Drawn {
  const tag = document.createElement("div");
  tag.className = "route-tag";
  const name = document.createElement("em");
  name.textContent = visit.first.name;
  const days = document.createElement("b");
  days.className = "day-pill";
  tag.append(days, name);
  const pin = routePin(L, { ...visit.first, lat: at[0], lng: at[1] }, false)
    .on("add", (e) => (e.target as Leaflet.Marker).getElement()?.append(tag))
    .addTo(layer);
  return { pin, tag, days };
}

/** Draws a route along its line, one stop at a time, each tagged with its days and name. Returns what removes it. */
export function drawRoute(
  L: typeof Leaflet,
  map: Leaflet.Map,
  stops: RouteMapStop[],
  opts: { still: boolean; view: () => Box },
): () => void {
  const layer = L.layerGroup().addTo(map);
  const visits = visitsOf(stops);
  const visitOf = stops.map((_, i) => visits.findIndex((v) => v.stops.includes(i)));
  // className, not a colour option — var(--pen) doesn't resolve as an SVG attribute.
  const line = L.polyline([], { className: "route-line", weight: 2, dashArray: "6 5" }).addTo(layer);
  const total = opts.still ? 0 : (stops.length - 1) * LEG_MS;
  const start = performance.now();
  const drawn: Drawn[] = [];
  let pins: Leaflet.Point[] = [];
  let spots: Point[] = [];
  let shown = 0;
  let progress = 0;
  let frame = 0;

  // Why: at a zoom that shows a whole country, stops a few km apart land on the same pixels; they move apart just enough to read.
  const layout = () => {
    const moved = spread(visits.map((v) => map.latLngToContainerPoint([v.first.lat, v.first.lng])), PIN_GAP);
    pins = moved.map((p) => L.point(p.x, p.y));
    spots = pins.map((p) => {
      const at = map.containerPointToLatLng(p);
      return [at.lat, at.lng];
    });
  };
  const routePoints = () => visitOf.map((v) => spots[v] as Point);

  const place = () => {
    const sizes = drawn.map(({ tag }) => ({ width: tag.offsetWidth, height: tag.offsetHeight }));
    placeTags(pins, sizes, opts.view(), visitOf.map((v) => pins[v] as Leaflet.Point)).forEach((at, i) => {
      const { tag } = drawn[i] as Drawn;
      tag.style.left = `${PIN_HALF + at.x}px`;
      tag.style.top = `${PIN_HALF + at.y}px`;
    });
  };

  const show = (upTo: number) => {
    visitsOf(stops.slice(0, upTo)).forEach((visit, i) => {
      const d = drawn[i] ?? (drawn[i] = drawVisit(L, layer, visit, spots[i] as Point));
      d.days.textContent = visit.days;
      const number = d.pin.getElement()?.querySelector("span");
      if (number) number.textContent = visit.label;
      d.pin.getElement()?.classList.toggle("is-twice", visit.stops.length > 1);
    });
    place();
  };

  const tick = (now: number) => {
    progress = total > 0 ? (now - start) / total : 1;
    const at = routeAt(routePoints(), progress);
    line.setLatLngs(at.path);
    if (at.shown > shown) show((shown = at.shown));
    if (progress < 1) frame = requestAnimationFrame(tick);
  };

  const onZoom = () => {
    layout();
    drawn.forEach((d, i) => d.pin.setLatLng(spots[i] as Point));
    if (progress >= 1) line.setLatLngs(routePoints());
    place();
  };

  layout();
  tick(start);
  map.on("zoomend", onZoom);

  return () => {
    cancelAnimationFrame(frame);
    map.off("zoomend", onZoom);
    layer.remove();
  };
}
