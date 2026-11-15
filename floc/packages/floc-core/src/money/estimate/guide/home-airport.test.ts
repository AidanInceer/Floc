import { describe, expect, it } from "vitest";

import { airportName, inferHomeAirport, isAirportCode } from "./home-airport";

describe("inferHomeAirport", () => {
  it("is nothing without flights", () => {
    expect(inferHomeAirport([])).toBeNull();
  });

  it("takes where each trip's first flight leaves from, the most common wins", () => {
    expect(
      inferHomeAirport([
        { tripId: 1, date: "2026-09-12", from: "LHR" },
        { tripId: 1, date: "2026-09-19", from: "OPO" },
        { tripId: 2, date: "2026-05-02", from: "LHR" },
        { tripId: 2, date: "2026-05-09", from: "BCN" },
        { tripId: 3, date: "2026-02-01", from: "MAN" },
      ]),
    ).toBe("LHR");
  });

  it("breaks a tie with the most recent trip", () => {
    expect(
      inferHomeAirport([
        { tripId: 1, date: "2026-02-01", from: "MAN" },
        { tripId: 2, date: "2026-09-12", from: "LGW" },
      ]),
    ).toBe("LGW");
  });

  it("skips flights with no airport or no date", () => {
    expect(inferHomeAirport([{ tripId: 1, date: null, from: "LHR" }, { tripId: 2, date: "2026-01-01", from: null }])).toBeNull();
  });
});

describe("airport codes", () => {
  it("accepts three letters, any case, and nothing else", () => {
    expect(isAirportCode("LHR")).toBe(true);
    expect(isAirportCode("lhr")).toBe(true);
    expect(isAirportCode("LH")).toBe(false);
    expect(isAirportCode("L1R")).toBe(false);
  });

  it("names the airports it knows, and gives the code for the rest", () => {
    expect(airportName("LHR")).toBe("London Heathrow");
    expect(airportName("XYZ")).toBe("XYZ");
  });
});
