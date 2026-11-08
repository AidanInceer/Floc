import { describe, expect, it } from "vitest";

import { PRESET_TRIPS } from "../preset-trips";
import type { PresetTrip } from "../preset-trip-types";
import { checkTripKnow } from "./check-trip-know";
import type { KnowStage, TripKnow } from "./know-types";
import { TRIP_KNOWS, tripKnow } from "./trip-knows";

const trip: PresetTrip = {
  id: "two-towns",
  title: "Two towns",
  operator: "Floc editorial",
  region: "Europe",
  country: "Spain",
  nights: 3,
  groupSize: "2–4 people",
  priceFromMinor: 45000,
  currency: "EUR",
  summary: "Two towns by train.",
  legs: [
    { kind: "base", place: "Seville", nights: 2, lat: 37.39, lng: -5.99 },
    { kind: "hop", place: "Córdoba", mode: "train", detail: "45 min" },
    { kind: "base", place: "Córdoba", nights: 1, lat: 37.88, lng: -4.78 },
  ],
  highlights: [],
  bestMonths: "April, May",
  interests: ["Food"],
  landscape: ["Coast"],
  effort: "Easy",
};

const money: KnowStage = { stage: "Money", tips: [{ icon: "money", title: "Carry cash", text: "Cards fail in **5** places." }] };
const stops = {
  stage: "At the stops" as const,
  stops: [
    { place: "Seville", tips: [{ title: "Go early", text: "It is hot." }] },
    { place: "Córdoba", tips: [{ title: "Book the mosque", text: "It sells out." }] },
  ],
};
const good: TripKnow = { checked: "2026-11-07", advice: [{ country: "Spain", slug: "spain" }], stages: [money, stops] };
const withStages = (...stages: KnowStage[]): TripKnow => ({ ...good, stages });
const oneTip = (text: string, extra: object = {}): TripKnow =>
  withStages({ stage: "Money", tips: [{ icon: "money", title: "Carry cash", text, ...extra }] });

describe("checkTripKnow", () => {
  it("passes a Good to know that fits its listing", () => {
    expect(checkTripKnow(trip, good)).toEqual([]);
  });

  it("wants stages in order", () => {
    expect(checkTripKnow(trip, withStages(stops, money))).toEqual(['stage "Money" is out of order']);
  });

  it("rejects a stage written twice", () => {
    expect(checkTripKnow(trip, withStages(money, money))).toEqual(['stage "Money" is written twice']);
  });

  it("rejects a stage with no tips", () => {
    expect(checkTripKnow(trip, withStages({ stage: "Money", tips: [] }))).toEqual(["Money has no tips"]);
  });

  it("rejects a stop with no tips and a stage with no stops", () => {
    expect(checkTripKnow(trip, withStages({ stage: "At the stops", stops: [{ place: "Seville", tips: [] }] }))).toEqual(["At the stops: Seville has no tips"]);
    expect(checkTripKnow(trip, withStages({ stage: "At the stops", stops: [] }))).toEqual(["At the stops has no stops"]);
  });

  it("wants each stop to be a base of the listing", () => {
    const bad: KnowStage = { stage: "At the stops", stops: [{ place: "Granada", tips: [{ title: "a", text: "b" }] }] };
    expect(checkTripKnow(trip, withStages(bad))).toEqual(['At the stops: "Granada" is not a stop of the listing']);
  });

  it("wants stops in route order", () => {
    const bad: KnowStage = { stage: "At the stops", stops: [...stops.stops].reverse() };
    expect(checkTripKnow(trip, withStages(bad))).toEqual(['At the stops: "Seville" is out of route order']);
  });

  it("wants a title and text", () => {
    expect(checkTripKnow(trip, withStages({ stage: "Money", tips: [{ icon: "money", title: " ", text: "" }] }))).toEqual([
      "Money: has no title",
      "Money: has no text",
    ]);
  });

  it("wants balanced ** marks", () => {
    expect(checkTripKnow(trip, oneTip("Pay **5 now"))).toEqual(['Money: "Carry cash" has an unbalanced ** mark']);
  });

  it("wants https links", () => {
    expect(checkTripKnow(trip, oneTip("Fine.", { link: { label: "Site", href: "http://x.example" } }))).toEqual([
      'Money: "Carry cash" links to "http://x.example", wants https://',
    ]);
  });

  it("rejects an empty temporary reason", () => {
    expect(checkTripKnow(trip, oneTip("Fine.", { temporary: " " }))).toEqual(['Money: "Carry cash" has an empty temporary reason']);
  });

  it("wants checked as an ISO day", () => {
    expect(checkTripKnow(trip, { ...good, checked: "7 Nov 2026" })).toEqual(['checked "7 Nov 2026" is not YYYY-MM-DD']);
  });

  it("wants lowercase-hyphen advice slugs", () => {
    expect(checkTripKnow(trip, { ...good, advice: [{ country: "Sri Lanka", slug: "Sri_Lanka" }] })).toEqual(['advice slug "Sri_Lanka" is not lowercase-hyphen']);
  });

  it("bans FCDO", () => {
    expect(checkTripKnow(trip, oneTip("The FCDO says wait."))).toEqual(['Money: "Carry cash" uses FCDO, write "UK government"']);
  });

  it("flags a short form with no words in the tip", () => {
    expect(checkTripKnow(trip, oneTip("Get an ETA online."))).toEqual(['Money: "Carry cash" uses ETA without its words']);
  });

  it("accepts a short form whose words are in the same tip", () => {
    expect(checkTripKnow(trip, oneTip("Get an electronic travel authorisation (ETA) online."))).toEqual([]);
  });

  it("matches a plural short form", () => {
    expect(checkTripKnow(trip, oneTip("Get two ETAs online."))).toEqual(['Money: "Carry cash" uses ETAs without its words']);
  });

  it("flags mixed-case and hyphenated short forms", () => {
    expect(checkTripKnow(trip, oneTip("Buy an eSIM."))).toEqual(['Money: "Carry cash" uses eSIM without its words']);
    expect(checkTripKnow(trip, oneTip("Buy a digital SIM."))).toEqual([]);
    expect(checkTripKnow(trip, oneTip("Apply for a K-ETA."))).toEqual(['Money: "Carry cash" uses K-ETA without its words']);
    expect(checkTripKnow(trip, oneTip("Apply for a K-ETA, the Korea electronic travel authorisation."))).toEqual([]);
    expect(checkTripKnow(trip, oneTip("Hire a 4x4."))).toEqual(['Money: "Carry cash" uses 4x4 without its words']);
  });

  it("always flags ATM, ID and UV", () => {
    expect(checkTripKnow(trip, oneTip("Find an ATM."))).toEqual(['Money: "Carry cash" uses ATM, write "cash machine"']);
    expect(checkTripKnow(trip, oneTip("Find two ATMs."))).toEqual(['Money: "Carry cash" uses ATMs, write "cash machine"']);
    expect(checkTripKnow(trip, oneTip("Bring ID."))).toEqual(['Money: "Carry cash" uses ID, write "photo identity"']);
    expect(checkTripKnow(trip, oneTip("High UV."))).toEqual(['Money: "Carry cash" uses UV, write "sun strength"']);
  });

  it("allows the short allowlist and Roman numerals", () => {
    expect(checkTripKnow(trip, oneTip("A UK, US, USA or EU visitor sees a UNESCO site of Henry VIII."))).toEqual([]);
  });

  it("allows QR code as a phrase only", () => {
    expect(checkTripKnow(trip, oneTip("Show the QR code."))).toEqual([]);
    expect(checkTripKnow(trip, oneTip("Show the QR."))).toEqual(['Money: "Carry cash" uses QR, write "QR code"']);
  });

  it("flags an unknown short form", () => {
    expect(checkTripKnow(trip, oneTip("Take the XYZ bus."))).toEqual(['Money: "Carry cash" uses XYZ, spell it out']);
  });

  it("wants a figure inside every ** mark", () => {
    expect(checkTripKnow(trip, oneTip("Go **early**."))).toEqual(['Money: "Carry cash" marks "early" with ** but it holds no figure']);
  });

  it("rejects the same title twice in a stage", () => {
    const tip = (text: string) => ({ icon: "money" as const, title: "Carry cash", text });
    expect(checkTripKnow(trip, withStages({ stage: "Money", tips: [tip("a"), { ...tip("b"), title: "carry cash" }] }))).toEqual(['Money: "carry cash" is written twice']);
  });

  it("rejects the same title twice in a stop", () => {
    const twice = { stage: "At the stops" as const, stops: [{ place: "Seville", tips: [{ title: "Go", text: "a" }, { title: "Go", text: "b" }] }] };
    expect(checkTripKnow(trip, withStages(twice))).toEqual(['At the stops, Seville: "Go" is written twice']);
  });

  it("wants checked to be a real day", () => {
    expect(checkTripKnow(trip, { ...good, checked: "2026-13-45" })).toEqual(['checked "2026-13-45" is not a real day']);
  });

  it("wants a temporary tip to say until when", () => {
    expect(checkTripKnow(trip, oneTip("Fine.", { temporary: "Closed in May" }))).toEqual(['Money: "Carry cash" temporary "Closed in May" must start with "Until "']);
    expect(checkTripKnow(trip, oneTip("Fine.", { temporary: "Until May 2027" }))).toEqual([]);
  });

  it("rejects a blog link", () => {
    expect(checkTripKnow(trip, oneTip("Fine.", { link: { label: "Site", href: "https://x.example/blog/a" } }))).toEqual([
      'Money: "Carry cash" links to a blog, "https://x.example/blog/a"',
    ]);
  });

  it("lets a loop listing have tips for a revisited base", () => {
    const loop: PresetTrip = {
      ...trip,
      legs: [
        { kind: "base", place: "Seville", nights: 1, lat: 37.39, lng: -5.99 },
        { kind: "hop", place: "Córdoba", mode: "train", detail: "45 min" },
        { kind: "base", place: "Córdoba", nights: 1, lat: 37.88, lng: -4.78 },
        { kind: "hop", place: "Seville", mode: "train", detail: "45 min" },
        { kind: "base", place: "Seville", nights: 1, lat: 37.39, lng: -5.99 },
      ],
    };
    const again: KnowStage = {
      stage: "At the stops",
      stops: [
        { place: "Seville", tips: [{ title: "a", text: "a" }] },
        { place: "Córdoba", tips: [{ title: "b", text: "a" }] },
        { place: "Seville", tips: [{ title: "c", text: "a" }] },
      ],
    };
    expect(checkTripKnow(loop, withStages(again))).toEqual([]);
  });
});

describe("the trip-know map", () => {
  it("is keyed by real listing ids", () => {
    const ids = new Set(PRESET_TRIPS.map((t) => t.id));
    expect(Object.keys(TRIP_KNOWS).filter((id) => !ids.has(id))).toEqual([]);
  });
});

describe("every listing", () => {
  it.each(PRESET_TRIPS.map((t) => [t.id, t] as const))("%s has a clean Good to know", (id, listing) => {
    const know = tripKnow(id);
    expect(know, `${id} has no Good to know`).not.toBeNull();
    expect(checkTripKnow(listing, know as TripKnow)).toEqual([]);
  });
});
