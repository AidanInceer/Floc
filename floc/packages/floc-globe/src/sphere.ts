export type LatLng = { lat: number; lng: number };

export type Limb = { x: number; y: number } | { a: number };

const RAD = Math.PI / 180;
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

export const shortest = (deg: number) => (((deg % 360) + 540) % 360) - 180;

export const apart = (a: LatLng, b: LatLng) =>
  Math.hypot(shortest(a.lng - b.lng) * Math.cos(((a.lat + b.lat) / 2) * RAD), a.lat - b.lat);

export const facing = (p: LatLng): LatLng => ({ lng: p.lng - 18, lat: clamp(p.lat * 0.75 + 8, -50, 55) });

export const faced = (view: LatLng): LatLng => ({ lng: view.lng + 18, lat: (view.lat - 8) / 0.75 });

export const nearest =(view: LatLng, places: LatLng[]) =>
  places.reduce((best, p, i) => (apart(view, facing(p)) < apart(view, facing(places[best]!)) ? i : best), 0);

export function turn(from: LatLng, to: LatLng, turns = 0) {
  const by = { lng: shortest(to.lng - from.lng) + 360 * turns, lat: to.lat - from.lat };
  return (e: number): LatLng => ({ lat: from.lat + by.lat * e, lng: from.lng + by.lng * e });
}

export function project(view: LatLng, p: LatLng) {
  const [l, f, f0] = [(p.lng - view.lng) * RAD, p.lat * RAD, view.lat * RAD];
  let x = Math.cos(f) * Math.sin(l);
  let y = Math.cos(f0) * Math.sin(f) - Math.sin(f0) * Math.cos(f) * Math.cos(l);
  const z = Math.sin(f0) * Math.sin(f) + Math.cos(f0) * Math.cos(f) * Math.cos(l);
  if (z < 0) {
    const m = Math.hypot(x, y) || 1;
    x /= m;
    y /= m;
  }
  return { x, y, z };
}

export function unproject(view: LatLng, x: number, y: number): LatLng {
  const rho = Math.hypot(x, y);
  if (rho < 1e-12) return view;
  const c = Math.asin(Math.min(1, rho));
  const [f0, sc, cc] = [view.lat * RAD, Math.sin(c), Math.cos(c)];
  const lat = Math.asin(clamp(cc * Math.sin(f0) + (y * sc * Math.cos(f0)) / rho, -1, 1)) / RAD;
  const lng = view.lng + Math.atan2(x * sc, rho * cc * Math.cos(f0) - y * sc * Math.sin(f0)) / RAD;
  return { lat, lng: shortest(lng) };
}

const unit = ({ lat, lng }: LatLng) => [
  Math.cos(lat * RAD) * Math.cos(lng * RAD),
  Math.cos(lat * RAD) * Math.sin(lng * RAD),
  Math.sin(lat * RAD),
];

export function greatCircle(a: LatLng, b: LatLng, n = 72): LatLng[] {
  const [p, q] = [unit(a), unit(b)];
  const w = Math.acos(clamp(p[0]! * q[0]! + p[1]! * q[1]! + p[2]! * q[2]!, -1, 1));
  return Array.from({ length: n + 1 }, (_, i) => {
    const t = i / n;
    const [s0, s1] = [Math.sin((1 - t) * w) / Math.sin(w), Math.sin(t * w) / Math.sin(w)];
    const v = [0, 1, 2].map((k) => s0 * p[k]! + s1 * q[k]!);
    return { lat: Math.asin(v[2]!) / RAD, lng: Math.atan2(v[1]!, v[0]!) / RAD };
  });
}

export function limbRing(view: LatLng, ring: number[][]): Limb[] | null {
  const [f0, l0] = [view.lat * RAD, view.lng * RAD];
  const [s0, c0] = [Math.sin(f0), Math.cos(f0)];
  let any = false;
  const pts = ring.map(([lng, lat]) => {
    const [l, f] = [lng! * RAD - l0, lat! * RAD];
    const [cf, sf, cl] = [Math.cos(f), Math.sin(f), Math.cos(l)];
    const z = s0 * sf + c0 * cf * cl;
    if (z >= 0) any = true;
    return [cf * Math.sin(l), c0 * sf - s0 * cf * cl, z] as const;
  });
  if (!any) return null;
  const out: Limb[] = [];
  pts.forEach((q, k) => {
    const p = pts[(k + pts.length - 1) % pts.length]!;
    if (p[2] >= 0 !== q[2] >= 0) {
      const t = p[2] / (p[2] - q[2]);
      out.push({ a: Math.atan2(p[1] + (q[1] - p[1]) * t, p[0] + (q[0] - p[0]) * t) });
    }
    out.push(q[2] >= 0 ? { x: q[0], y: q[1] } : { a: Math.atan2(q[1], q[0]) });
  });
  return out;
}

const dot = (p: number[], q: number[]) => p[0]! * q[0]! + p[1]! * q[1]! + p[2]! * q[2]!;

export const arc = (a: LatLng, b: LatLng) => Math.acos(clamp(dot(unit(a), unit(b)), -1, 1)) / RAD;

export function capOf(ring: number[][]): { centre: LatLng; reach: number } {
  const points = ring.slice(0, -1).map(([lng, lat]) => ({ lng: lng!, lat: lat! }));
  const sum = [0, 0, 0];
  for (const v of points.map(unit)) [0, 1, 2].forEach((k) => (sum[k]! += v[k]!));
  const length = Math.hypot(sum[0]!, sum[1]!, sum[2]!);
  if (length < points.length * 1e-3) return { centre: { lat: 0, lng: 0 }, reach: 180 };
  const centre = { lat: Math.asin(sum[2]! / length) / RAD, lng: Math.atan2(sum[1]!, sum[0]!) / RAD };
  return { centre, reach: points.reduce((most, p) => Math.max(most, arc(centre, p)), 0) };
}

export const sightOf = (radius: number, far: number) => (far >= radius ? 90 : Math.asin(far / radius) / RAD);

export function middle(places: LatLng[]): LatLng {
  const sum = [0, 0, 0];
  for (const v of places.map(unit)) [0, 1, 2].forEach((k) => (sum[k]! += v[k]!));
  const length = Math.hypot(sum[0]!, sum[1]!, sum[2]!) || 1;
  return { lat: Math.asin(sum[2]! / length) / RAD, lng: Math.atan2(sum[1]!, sum[0]!) / RAD };
}
