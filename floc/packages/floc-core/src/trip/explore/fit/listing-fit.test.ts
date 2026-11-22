import { describe, expect, it } from "vitest";

import { PRESET_TRIPS, type PresetTrip } from "../preset-trips";
import { FIT_WEIGHTS } from "./fit-weights";
import { listingFits } from "./listing-fit";
import { NO_TRAVEL, type PastTrip, type TravelProfile } from "./travel-profile";

const listing = (id: string, over: Partial<PresetTrip>): PresetTrip => ({
  ...PRESET_TRIPS[0],
  id,
  title: id,
  region: "Europe",
  country: "Portugal",
  legs: [{ kind: "base", place: id, nights: 10, lat: 0, lng: 0 }],
  nights: 10,
  priceFromMinor: 100000,
  currency: "GBP",
  interests: [],
  landscape: [],
  effort: "Easy",
  ...over,
});

const FOOD = listing("food", { interests: ["Food", "Cities"] });
const WALK = listing("walk", { interests: ["Hiking"], landscape: ["Mountains"], effort: "Tough" });
const who = (over: Partial<TravelProfile>): TravelProfile => ({ ...NO_TRAVEL, ...over });
const went = (over: Partial<PastTrip>): PastTrip => ({ nights: 10, countries: [], stops: 1, moves: [], spend: [], ...over });
const fits = (profile: TravelProfile, trips: PresetTrip[]) => listingFits(profile, trips, null);

describe("how well a listing fits a person", () => {
  it("weighs trip style most, then length and money alike", () => {
    expect(FIT_WEIGHTS.parts).toEqual({ style: 50, length: 25, money: 25 });
  });

  it("is nothing for someone with no travel style", () => {
    expect(fits(NO_TRAVEL, [FOOD, WALK])).toBeNull();
  });

  it("is a whole number from 0 to 100 for every listing", () => {
    const all = listingFits(who({ vibes: ["food first", "hiking"], stay: "mid", past: [went({ nights: 7 })] }), PRESET_TRIPS, null)!;
    expect(Object.keys(all)).toHaveLength(PRESET_TRIPS.length);
    for (const figure of Object.values(all)) {
      expect(Number.isInteger(figure)).toBe(true);
      expect(figure).toBeGreaterThanOrEqual(0);
      expect(figure).toBeLessThanOrEqual(100);
    }
  });

  it("gives a listing with all you like the full figure when style is all Floc knows", () => {
    const got = fits(who({ vibes: ["food first", "city breaks"] }), [FOOD, WALK])!;
    expect(got.food).toBe(100);
    expect(got.walk).toBe(0);
  });

  it("gives part of the figure to a listing with part of what you like", () => {
    const got = fits(who({ vibes: ["food first", "museums"] }), [FOOD])!;
    expect(got.food).toBe(50);
  });

  it("leaves out a part it has no data for", () => {
    const styleOnly = fits(who({ vibes: ["food first", "museums"] }), [FOOD])!;
    const withLength = fits(who({ vibes: ["food first", "museums"], past: [went({ nights: 10 })] }), [FOOD])!;
    expect(styleOnly.food).toBe(50);
    expect(withLength.food).toBe(78);
  });

  it("counts style at 50, length at 25 and money at 25 when it knows all three", () => {
    const profile = who({ vibes: ["food first", "city breaks"], past: [went({ nights: 2, spend: [{ currency: "GBP", minor: 40000 }] })] });
    const far = listing("far", { interests: ["Food", "Cities"], nights: 20, priceFromMinor: 200000 });
    expect(fits(profile, [far])!.far).toBe(75);
  });

  it("takes your usual length from the middle of your past trips", () => {
    const profile = who({ past: [went({ nights: 3 }), went({ nights: 7 }), went({ nights: 21 })] });
    const week = listing("week", { nights: 7 });
    const month = listing("month", { nights: 28 });
    const got = fits(profile, [week, month])!;
    expect(got.week).toBe(100);
    expect(got.month).toBe(67);
  });

  it("fits a listing that costs no more a night than you spent", () => {
    const profile = who({ past: [went({ nights: 10, spend: [{ currency: "GBP", minor: 150000 }] })] });
    const cheap = listing("cheap", { nights: 10, priceFromMinor: 100000 });
    const dear = listing("dear", { nights: 10, priceFromMinor: 300000 });
    const middle = listing("middle", { nights: 10, priceFromMinor: 225000 });
    const got = fits(profile, [cheap, dear, middle])!;
    expect(got.cheap).toBe(100);
    expect(got.dear).toBe(75);
    expect(got.middle).toBe(88);
  });

  it("compares prices in your home currency", () => {
    const profile = who({ past: [went({ nights: 10, spend: [{ currency: "EUR", minor: 200000 }] })] });
    const trip = listing("trip", { nights: 10, priceFromMinor: 150000, currency: "GBP" });
    const got = listingFits(profile, [trip], { home: "GBP", toHome: { EUR: 0.5 } })!;
    expect(got.trip).toBe(88);
  });

  it("reads your stay level against the cheaper and dearer listings", () => {
    const low = listing("low", { priceFromMinor: 50000 });
    const mid = listing("mid", { priceFromMinor: 150000 });
    const high = listing("high", { priceFromMinor: 400000 });
    const got = fits(who({ stay: "budget" }), [low, mid, high])!;
    expect(got.low).toBe(100);
    expect(got.mid).toBe(50);
    expect(got.high).toBe(0);
  });

  it("learns what you like from the listings you saved", () => {
    const hill = listing("hill", { interests: ["Hiking"], landscape: ["Mountains"], effort: "Tough" });
    const got = fits(who({ saved: ["walk"] }), [WALK, hill, FOOD])!;
    expect(got.hill).toBeGreaterThan(got.food);
  });

  it("reads your pace", () => {
    const calm = listing("calm", { legs: [{ kind: "base", place: "a", nights: 10, lat: 0, lng: 0 }] });
    const busy = listing("busy", {
      legs: [
        { kind: "base", place: "a", nights: 2, lat: 0, lng: 0 },
        { kind: "hop", place: "b", mode: "train", detail: "" },
        { kind: "base", place: "b", nights: 2, lat: 0, lng: 1 },
        { kind: "hop", place: "c", mode: "train", detail: "" },
        { kind: "base", place: "c", nights: 2, lat: 0, lng: 2 },
        { kind: "hop", place: "d", mode: "train", detail: "" },
        { kind: "base", place: "d", nights: 2, lat: 0, lng: 3 },
        { kind: "hop", place: "e", mode: "train", detail: "" },
        { kind: "base", place: "e", nights: 2, lat: 0, lng: 4 },
      ],
    });
    const got = fits(who({ pace: "easy" }), [calm, busy])!;
    expect(got.calm).toBeGreaterThan(got.busy);
  });

  it("reads how you travelled on past trips", () => {
    const rail = listing("rail", {
      legs: [
        { kind: "base", place: "a", nights: 4, lat: 0, lng: 0 },
        { kind: "hop", place: "b", mode: "train", detail: "" },
        { kind: "base", place: "b", nights: 3, lat: 0, lng: 1 },
        { kind: "hop", place: "c", mode: "train", detail: "" },
        { kind: "base", place: "c", nights: 3, lat: 0, lng: 2 },
      ],
    });
    const stay = listing("stay", { region: "Asia", country: "Japan" });
    const got = fits(who({ past: [went({ nights: 10, stops: 3, moves: ["train", "train"], countries: ["PT"] })] }), [rail, stay])!;
    expect(got.rail).toBeGreaterThan(got.stay);
  });

  it("lifts a listing in a country you want to go to", () => {
    const base = who({ vibes: ["food first", "museums"] });
    const plain = fits(base, [FOOD])!.food;
    const wanted = fits({ ...base, wantToGo: ["PT"] }, [FOOD])!.food;
    expect(plain).toBe(50);
    expect(wanted).toBe(63);
  });

  it("gives no figure from a want-to-go country alone", () => {
    expect(fits(who({ wantToGo: ["PT"] }), [FOOD])).toBeNull();
  });
});
