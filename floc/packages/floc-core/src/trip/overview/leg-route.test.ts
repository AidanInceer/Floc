import { describe, expect, it } from "vitest";

import { decodePolyline, legMarks, readRoute, routeRequest, stopPins } from "./leg-route";
import type { OverviewRoute } from "./route";

const LISBON = { lat: 38.72, lng: -9.14 };
const SEVILLE = { lat: 37.39, lng: -5.98 };
const at = (spot: { lat: number; lng: number }) => ({ location: { latLng: { latitude: spot.lat, longitude: spot.lng } } });

describe("routeRequest", () => {
  it("asks for a drive without live traffic for a car hop", () => {
    expect(routeRequest(LISBON, SEVILLE, "car")).toEqual({
      origin: at(LISBON),
      destination: at(SEVILLE),
      travelMode: "DRIVE",
      routingPreference: "TRAFFIC_UNAWARE",
    });
  });

  it("asks for rail only for a train hop", () => {
    expect(routeRequest(LISBON, SEVILLE, "train")).toEqual({
      origin: at(LISBON),
      destination: at(SEVILLE),
      travelMode: "TRANSIT",
      transitPreferences: { allowedTravelModes: ["RAIL"] },
    });
  });

  it.each(["flight", "ferry", "other", null] as const)("asks nothing for %s, which follows no road or rail", (mode) => {
    expect(routeRequest(LISBON, SEVILLE, mode)).toBeNull();
  });
});

describe("readRoute", () => {
  const body = { routes: [{ duration: "18180s", distanceMeters: 463012, polyline: { encodedPolyline: "_p~iF~ps|U" } }] };

  it("reads the first route's time, distance and line", () => {
    expect(readRoute(body)).toEqual({ path: "_p~iF~ps|U", seconds: 18180, metres: 463012 });
  });

  it("rounds a time given with a fraction of a second", () => {
    expect(readRoute({ routes: [{ ...body.routes[0], duration: "3.5s" }] })?.seconds).toBe(4);
  });

  it.each([
    ["no routes", {}],
    ["an empty list", { routes: [] }],
    ["a time that is not seconds", { routes: [{ ...body.routes[0], duration: "soon" }] }],
    ["no distance", { routes: [{ ...body.routes[0], distanceMeters: undefined }] }],
    ["no line", { routes: [{ ...body.routes[0], polyline: {} }] }],
    ["nothing at all", null],
  ])("reads nothing from an answer with %s", (_, answer) => {
    expect(readRoute(answer)).toBeNull();
  });
});

describe("decodePolyline", () => {
  it("turns an encoded line into its points", () => {
    expect(decodePolyline("_p~iF~ps|U_ulLnnqC_mqNvxq`@")).toEqual([
      { lat: 38.5, lng: -120.2 },
      { lat: 40.7, lng: -120.95 },
      { lat: 43.252, lng: -126.453 },
    ]);
  });

  it("gives no points for an empty line", () => {
    expect(decodePolyline("")).toEqual([]);
  });
});

describe("legMarks", () => {
  const route = (moves: OverviewRoute["moves"]): OverviewRoute => ({
    stops: [
      { place: "Lisbon", ...LISBON, nights: 3 },
      { place: "Seville", ...SEVILLE, nights: 4 },
    ],
    moves,
    countries: ["PT", "ES"],
    uncoded: [],
    missing: [],
  });
  const line = { path: "_p~iF~ps|U", seconds: 18180, metres: 463012 };

  it("keeps the length the group set on Days over an estimate", () => {
    const [mark] = legMarks(route([{ mode: "car", time: "4h 30" }]), [line]);
    expect(mark).toMatchObject({ from: LISBON, to: SEVILLE, mode: "car", text: "4h 30" });
  });

  it("says about how long the hop takes when Days gives no times", () => {
    expect(legMarks(route([{ mode: "car", time: "" }]), [line])[0].text).toBe("About 5h 03");
  });

  it("follows the road when there is a line and joins the stops when there is none", () => {
    expect(legMarks(route([{ mode: "car", time: "" }]), [line])[0].points).toEqual([{ lat: 38.5, lng: -120.2 }]);
    expect(legMarks(route([{ mode: "flight", time: "" }]), [null])[0]).toMatchObject({ points: null, text: "" });
  });

  it("puts the hop's label on the road, or halfway between the stops", () => {
    expect(legMarks(route([{ mode: "car", time: "" }]), [line])[0].mid).toEqual({ lat: 38.5, lng: -120.2 });
    const { mid } = legMarks(route([{ mode: "flight", time: "" }]), [null])[0];
    expect(mid.lat).toBeCloseTo(38.055);
    expect(mid.lng).toBeCloseTo(-7.56);
  });

  it("names the way of travel and the length for a reader who cannot see the glyph", () => {
    expect(legMarks(route([{ mode: "train", time: "4h 05" }]), [null])[0].label).toBe("Train, 4h 05");
    expect(legMarks(route([{ mode: "flight", time: "" }]), [null])[0].label).toBe("Flight");
    expect(legMarks(route([{ mode: null, time: "Not set" }]), [null])[0].label).toBe("Not set");
  });

  it("moves the label of a hop that goes back the way the group came, so the two do not meet", () => {
    const there = { place: "Lisbon", ...LISBON, nights: 1 };
    const back = { place: "Seville", ...SEVILLE, nights: 1 };
    const round: OverviewRoute = { stops: [there, back, there], moves: [{ mode: "flight", time: "" }, { mode: "flight", time: "" }], countries: [], uncoded: [], missing: [] };
    const [out, home] = legMarks(round, [null, null]);
    expect(out.mid.lat).toBeCloseTo(38.055);
    expect(home.mid.lat).toBeCloseTo(37.789);
  });

  it("still says a hop has no way of travel set", () => {
    expect(legMarks(route([{ mode: null, time: "Not set" }]), [])[0]).toMatchObject({ mode: null, text: "Not set", points: null });
  });
});

describe("stopPins", () => {
  it("draws one pin for a place the trip stops at twice, with both numbers", () => {
    const lisbon = { place: "Lisbon, Portugal", ...LISBON, nights: 1 };
    const seville = { place: "Seville, Spain", ...SEVILLE, nights: 1 };
    const round: OverviewRoute = { stops: [lisbon, seville, lisbon], moves: [], countries: [], uncoded: [], missing: [] };
    expect(stopPins(round)).toEqual([
      { ...LISBON, place: "Lisbon", nos: [1, 3] },
      { ...SEVILLE, place: "Seville", nos: [2] },
    ]);
  });
});
