import { describe, expect, it } from "vitest";

import { airportLabel, airportPlace, chosenAirport, countryAirports, findAirport, loadAirports, parseAirports, searchAirports } from "./airports";

const LIST = parseAirports({
  GB: "LHR|London Heathrow|London|L;LGW|London Gatwick|London|L;MAN|Manchester|Manchester|L;INV|Inverness|Inverness",
  CA: "YXU|London International|London",
  ES: "AGP|Málaga-Costa del Sol|Málaga|L",
  US: "JFK|John F. Kennedy International|New York|L;LGA|LaGuardia|New York|L;GGG|East Texas Regional|Longview|L",
});

const codes = (query: string) => searchAirports(LIST, query).map((a) => a.code);

describe("searchAirports", () => {
  it("finds nothing until something is typed", () => {
    expect(codes("")).toEqual([]);
    expect(codes("   ")).toEqual([]);
  });

  it("puts the airport whose code you typed first, in any case", () => {
    expect(codes("man")[0]).toBe("MAN");
  });

  it("finds a name by its start, large airports before smaller ones", () => {
    expect(codes("london")).toEqual(["LGW", "LHR", "YXU"]);
  });

  it("puts a name that starts with the text before a city that does", () => {
    expect(codes("lon")).toEqual(["LGW", "LHR", "YXU", "GGG"]);
  });

  it("finds a word inside an airport's name", () => {
    expect(codes("heathrow")).toEqual(["LHR"]);
  });

  it("finds a city by its name", () => {
    expect(codes("new york")).toEqual(["JFK", "LGA"]);
  });

  it("ignores accents", () => {
    expect(codes("malaga")).toEqual(["AGP"]);
  });

  it("names a start before a match inside a name", () => {
    expect(codes("in")).toEqual(["INV", "JFK", "YXU"]);
  });

  it("shows at most the limit", () => {
    expect(searchAirports(LIST, "l", 2)).toHaveLength(2);
  });

  it("finds nothing for text no airport holds", () => {
    expect(codes("zzz")).toEqual([]);
  });
});

describe("findAirport", () => {
  it("finds an airport by its code in any case", () => {
    expect(findAirport(LIST, "inv")?.name).toBe("Inverness");
  });

  it("finds nothing for a code that is not in the list", () => {
    expect(findAirport(LIST, "XXX")).toBeNull();
    expect(findAirport(LIST, null)).toBeNull();
  });
});

describe("airportLabel", () => {
  it("names the airport and its code", () => {
    expect(airportLabel(findAirport(LIST, "LHR")!)).toBe("London Heathrow (LHR)");
  });
});

describe("airportPlace", () => {
  it("names the code, city and country, the country kept on the city's line", () => {
    expect(airportPlace(findAirport(LIST, "LHR")!)).toBe("LHR · London, GB");
    expect(airportPlace({ code: "ZZZ", city: "", country: "GB" })).toBe("ZZZ · GB");
  });
});

describe("chosenAirport", () => {
  it("names a saved code from the whole list", async () => {
    expect(await chosenAirport("inv")).toEqual({ code: "INV", label: "Inverness (INV)" });
  });

  it("keeps a code the list does not hold, and nothing for no code", async () => {
    expect(await chosenAirport("QQQ")).toEqual({ code: "QQQ", label: "QQQ" });
    expect(await chosenAirport(null)).toBeNull();
  });
});

describe("loadAirports", () => {
  it("loads Floc's whole list, once", async () => {
    const all = await loadAirports();
    expect(all.length).toBeGreaterThan(3000);
    expect(findAirport(all, "LHR")).toMatchObject({ name: "London Heathrow", city: "London", country: "GB" });
    expect(await loadAirports()).toBe(all);
  });

  it("keeps every city whole and every name short: brackets closed, no 'Airport', one name", async () => {
    const broken = (await loadAirports()).filter((a) => {
        const opens = a.city.split("(").length, closes = a.city.split(")").length;
        return opens !== closes || /\S\(/.test(a.city) || /aiurport/i.test(a.city) || / Airport\b| \/ /.test(a.name);
      }).map((a) => `${a.code} ${a.city}`);
    expect(broken).toEqual([]);
  });

  it("holds each code once", async () => {
    const all = await loadAirports();
    expect(new Set(all.map((a) => a.code)).size).toBe(all.length);
  });
});

describe("countryAirports (#707)", () => {
  const list = parseAirports({
    IE: "ORK|Cork International|Cork|L;DUB|Dublin|Dublin|L;CFN|Donegal|Donegal",
    GB: "LHR|Heathrow|London|L",
  });

  it("offers the large airports in the guessed country", () => {
    expect(countryAirports(list, "IE").map((a) => a.code)).toEqual(["ORK", "DUB"]);
  });

  it("offers nothing without a country, or for one it does not know", () => {
    expect(countryAirports(list, null)).toEqual([]);
    expect(countryAirports(list, "XX")).toEqual([]);
  });

  it("reads the country in any case and keeps to the limit", () => {
    expect(countryAirports(list, "ie", 1).map((a) => a.code)).toEqual(["ORK"]);
  });
});
