import { describe, expect, it } from "vitest";

import { readBoardingPass } from "./boarding-pass";
import {
  bookingCategory, bookingDates, bookingSummary, cleanBookingDetails,
  flightTitle, parseBookingDetails, storeBookingDetails,
} from "./booking-details";
import { tripForBooking } from "./booking-trip";
import { readSchemaOrg } from "./schema-org";

const jsonLd = (data: unknown) => `<html><body><script type="application/ld+json">${JSON.stringify(data)}</script></body></html>`;

const FLIGHT = {
  "@context": "http://schema.org",
  "@type": "FlightReservation",
  reservationNumber: "RJ3KLM",
  reservationFor: {
    "@type": "Flight",
    flightNumber: "1234",
    airline: { "@type": "Airline", iataCode: "FR" },
    departureAirport: { "@type": "Airport", iataCode: "STN" },
    arrivalAirport: { "@type": "Airport", iataCode: "OPO" },
    departureTime: "2027-03-04T06:25:00+00:00",
    arrivalTime: "2027-03-04T09:00:00+00:00",
  },
};

describe("booking details are checked before they are kept", () => {
  it("keeps a flight's real fields", () => {
    expect(
      cleanBookingDetails({ kind: "flight", flightNumber: "ba0175", date: "2027-03-04", from: "lhr", to: "JFK", departTime: "09:05", reference: "abc123" }),
    ).toEqual({
      kind: "flight", flightNumber: "BA 175", date: "2027-03-04", from: "LHR", to: "JFK",
      departTime: "09:05", arriveTime: null, reference: "ABC123",
    });
  });

  it("keeps a three-letter airline code whole", () => {
    expect(cleanBookingDetails({ kind: "flight", flightNumber: "EZY8471" })).toMatchObject({ flightNumber: "EZY 8471" });
  });

  it("drops a value that is not what its field holds", () => {
    expect(
      cleanBookingDetails({ kind: "flight", flightNumber: "<script>", date: "2027-02-31", from: "LONDON", to: "JFK", departTime: "25:00", reference: "a b" }),
    ).toBeNull();
  });

  it("strips markup and line breaks from a hotel name and caps it", () => {
    const details = cleanBookingDetails({ kind: "hotel", name: `<b>Casa\ndo Sol</b>${"x".repeat(200)}`, checkIn: "2027-03-04" });
    expect(details).toMatchObject({ kind: "hotel", checkIn: "2027-03-04" });
    expect(details?.kind === "hotel" && details.name).toMatch(/^b Casa do Sol \/b x+$/);
    expect(details?.kind === "hotel" && details.name?.length).toBeLessThanOrEqual(80);
  });

  it("drops a check-out that is not after the check-in", () => {
    expect(cleanBookingDetails({ kind: "hotel", name: "Casa", checkIn: "2027-03-04", checkOut: "2027-03-04" })).toMatchObject({ checkOut: null });
  });

  it("reads nothing from a value that is not a booking", () => {
    for (const raw of [null, "flight", [], { kind: "train" }, { kind: "hotel" }]) expect(cleanBookingDetails(raw)).toBeNull();
  });

  it("survives the stored column, and reads a broken or oversized one as nothing", () => {
    const details = cleanBookingDetails({ kind: "hotel", name: "Casa do Sol", checkIn: "2027-03-04", checkOut: "2027-03-07" });
    expect(parseBookingDetails(storeBookingDetails(details))).toEqual(details);
    expect(storeBookingDetails(null)).toBeNull();
    expect(parseBookingDetails("{not json")).toBeNull();
    expect(parseBookingDetails(null)).toBeNull();
    expect(parseBookingDetails(JSON.stringify({ kind: "hotel", name: "x".repeat(2000) }))).toBeNull();
  });
});

describe("what a booking says about itself", () => {
  const flight = cleanBookingDetails({ kind: "flight", flightNumber: "FR1234", date: "2027-03-04", from: "STN", to: "OPO" })!;
  const hotel = cleanBookingDetails({ kind: "hotel", name: "Casa do Sol", checkIn: "2027-03-04", checkOut: "2027-03-07" })!;

  it("files a flight under Travel and a stay under Hotel", () => {
    expect(bookingCategory(flight)).toBe("travel");
    expect(bookingCategory(hotel)).toBe("hotel");
  });

  it("gives the days it covers", () => {
    expect(bookingDates(flight)).toEqual({ start: "2027-03-04", end: "2027-03-04" });
    expect(bookingDates(hotel)).toEqual({ start: "2027-03-04", end: "2027-03-07" });
    expect(bookingDates(cleanBookingDetails({ kind: "flight", flightNumber: "FR1234" })!)).toBeNull();
    expect(bookingDates(cleanBookingDetails({ kind: "hotel", name: "Casa" })!)).toBeNull();
    expect(bookingDates(cleanBookingDetails({ kind: "hotel", checkIn: "2027-03-04" })!)).toEqual({ start: "2027-03-04", end: "2027-03-04" });
  });

  it("sums itself up in one line", () => {
    expect(bookingSummary(flight)).toBe("FR 1234 · STN → OPO");
    expect(bookingSummary(hotel)).toBe("Casa do Sol");
    expect(bookingSummary(cleanBookingDetails({ kind: "hotel", checkIn: "2027-03-04" })!)).toBe("Hotel booking");
    expect(bookingSummary(cleanBookingDetails({ kind: "flight", date: "2027-03-04" })!)).toBe("Flight");
    expect(flight.kind === "flight" && flightTitle(flight)).toBe("FR 1234 · STN to OPO");
    const bare = cleanBookingDetails({ kind: "flight", date: "2027-03-04" })!;
    expect(bare.kind === "flight" && flightTitle(bare)).toBe("Flight");
  });
});

describe("schema.org data in a booking mail", () => {
  it("reads a flight from JSON-LD, with the times as written", () => {
    expect(readSchemaOrg(jsonLd(FLIGHT))).toEqual({
      kind: "flight", flightNumber: "FR 1234", date: "2027-03-04", from: "STN", to: "OPO",
      departTime: "06:25", arriveTime: "09:00", reference: "RJ3KLM",
    });
  });

  it("reads a reservation inside a list or a graph", () => {
    expect(readSchemaOrg(jsonLd([{ "@type": "Organization" }, FLIGHT]))).toMatchObject({ flightNumber: "FR 1234" });
    expect(readSchemaOrg(jsonLd({ "@graph": [FLIGHT] }))).toMatchObject({ flightNumber: "FR 1234" });
  });

  it("reads a hotel stay", () => {
    const stay = {
      "@type": "LodgingReservation", reservationNumber: "4471.882",
      checkinDate: "2027-03-04T15:00:00", checkoutDate: "2027-03-07T11:00:00",
      reservationFor: { "@type": "LodgingBusiness", name: "Casa do Sol" },
    };
    expect(readSchemaOrg(jsonLd(stay))).toEqual({
      kind: "hotel", name: "Casa do Sol", checkIn: "2027-03-04", checkOut: "2027-03-07", reference: "4471.882",
    });
  });

  it("reads a flight from microdata", () => {
    const html = `
      <div itemscope itemtype="http://schema.org/FlightReservation">
        <meta itemprop="reservationNumber" content="RJ3KLM"/>
        <div itemprop="reservationFor" itemscope itemtype="http://schema.org/Flight">
          <span itemprop="flightNumber">1234</span>
          <div itemprop="airline" itemscope itemtype="http://schema.org/Airline"><meta itemprop="iataCode" content="FR"/></div>
          <div itemprop="departureAirport" itemscope itemtype="http://schema.org/Airport"><span itemprop="iataCode">STN</span></div>
          <div itemprop="arrivalAirport" itemscope itemtype="http://schema.org/Airport"><span itemprop="iataCode"><b>OPO</b></span></div>
          <time itemprop="departureTime" datetime="2027-03-04T06:25:00">6:25</time>
        </div>
      </div>`;
    expect(readSchemaOrg(html)).toEqual({
      kind: "flight", flightNumber: "FR 1234", date: "2027-03-04", from: "STN", to: "OPO",
      departTime: "06:25", arriveTime: null, reference: "RJ3KLM",
    });
  });

  it("skips a broken block and reads the next one", () => {
    const html = `<script type="application/ld+json">{broken</script>${jsonLd(FLIGHT)}`;
    expect(readSchemaOrg(html)).toMatchObject({ flightNumber: "FR 1234" });
  });

  it("gives up fast on a mail made of unclosed tags, so the server never stalls", () => {
    const started = Date.now();
    expect(readSchemaOrg("<script x ".repeat(60_000))).toBeNull();
    expect(readSchemaOrg(`itemscope ${"<a ".repeat(200_000)}`)).toBeNull();
    expect(readSchemaOrg(`<div itemscope itemtype="http://schema.org/FlightReservation"><span itemprop="x">${"<b".repeat(200_000)}`)).toBeNull();
    expect(Date.now() - started).toBeLessThan(1000);
  });

  it("keeps no markup or script from a hostile field", () => {
    const hostile = {
      ...FLIGHT,
      reservationNumber: "<img src=x onerror=alert(1)>",
      reservationFor: { ...FLIGHT.reservationFor, flightNumber: "javascript:alert(1)", departureAirport: { iataCode: "<svg>" } },
    };
    expect(readSchemaOrg(jsonLd(hostile))).toEqual({
      kind: "flight", flightNumber: null, date: "2027-03-04", from: null, to: "OPO",
      departTime: "06:25", arriveTime: "09:00", reference: null,
    });
  });

  it("reads nothing from a mail with no reservation, an oversized block, or a deep nest", () => {
    expect(readSchemaOrg("<p>Thanks for booking</p>")).toBeNull();
    expect(readSchemaOrg(null)).toBeNull();
    expect(readSchemaOrg(jsonLd({ ...FLIGHT, padding: "x".repeat(120_000) }))).toBeNull();
    let nested: unknown = FLIGHT;
    for (let i = 0; i < 30; i += 1) nested = [nested];
    expect(readSchemaOrg(jsonLd(nested))).toBeNull();
    expect(readSchemaOrg(`<div itemscope itemtype="http://schema.org/Thing"><span itemprop="name">x</span></div>`)).toBeNull();
  });
});

describe("a boarding pass barcode", () => {
  const PASS = "M1DESMARAIS/LUC       EABC123 YULFRAAC 0834 226F001A0025 100";

  it("gives the flight, the airports, the reference and the day", () => {
    expect(readBoardingPass(PASS, "2027-08-01")).toEqual({
      kind: "flight", flightNumber: "AC 834", date: "2027-08-14", from: "YUL", to: "FRA",
      departTime: null, arriveTime: null, reference: "ABC123",
    });
  });

  it("puts a January flight read in December into next year", () => {
    const january = PASS.replace("226F", "005F");
    expect(readBoardingPass(january, "2027-12-28")?.date).toBe("2028-01-05");
  });

  it("puts a day well past this year into next year, and keeps one just past", () => {
    expect(readBoardingPass(PASS, "2027-10-20")?.date).toBe("2028-08-13");
    expect(readBoardingPass(PASS, "2027-08-20")?.date).toBe("2027-08-14");
  });

  it("reads nothing from text that is not a boarding pass", () => {
    expect(readBoardingPass("https://example.com/ticket", "2027-08-01")).toBeNull();
    expect(readBoardingPass(PASS.replace("YUL", "1UL"), "2027-08-01")).toBeNull();
    expect(readBoardingPass(PASS.replace("226F", "999F"), "2027-08-01")?.date).toBeNull();
    expect(readBoardingPass(null, "2027-08-01")).toBeNull();
    expect(readBoardingPass(`M1${"x".repeat(800)}`, "2027-08-01")).toBeNull();
  });
});

describe("finding the trip a booking is for", () => {
  const porto = { id: 1, startDate: "2027-03-04", endDate: "2027-03-08" };
  const dolomites = { id: 2, startDate: "2027-06-10", endDate: "2027-06-17" };
  const undated = { id: 3, startDate: null, endDate: null };
  const flightOn = (date: string) => cleanBookingDetails({ kind: "flight", flightNumber: "FR1234", date });

  it("picks the one trip whose dates hold the booking", () => {
    expect(tripForBooking(flightOn("2027-03-05"), [porto, dolomites, undated])).toBe(1);
  });

  it("takes a flight the evening before the trip starts", () => {
    expect(tripForBooking(flightOn("2027-03-03"), [porto, dolomites])).toBe(1);
  });

  it("picks none when no trip, or more than one, holds it", () => {
    expect(tripForBooking(flightOn("2027-04-20"), [porto, dolomites])).toBeNull();
    expect(tripForBooking(flightOn("2027-03-05"), [porto, { ...dolomites, startDate: "2027-03-01" }])).toBeNull();
    expect(tripForBooking(flightOn("2027-03-05"), [undated])).toBeNull();
  });

  it("picks none for a booking with no date, or nothing read", () => {
    expect(tripForBooking(cleanBookingDetails({ kind: "flight", flightNumber: "FR1234" }), [porto])).toBeNull();
    expect(tripForBooking(null, [porto])).toBeNull();
  });

  it("holds a whole stay inside the trip", () => {
    const stay = cleanBookingDetails({ kind: "hotel", name: "Casa", checkIn: "2027-03-04", checkOut: "2027-03-12" });
    expect(tripForBooking(stay, [porto])).toBeNull();
  });
});
