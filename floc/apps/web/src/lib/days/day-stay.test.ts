import { describe, expect, it } from "vitest";

import { dayStay } from "./day-stay";

const day = (id: number, date: string, overnightPlaceId: number, overnightPlaceName: string) => ({
  id,
  date,
  overnightPlaceId,
  overnightPlaceName,
});

const days = [day(1, "2027-05-01", 10, "Hiroshima"), day(2, "2027-05-02", 10, "Hiroshima"), day(3, "2027-05-03", 20, "Osaka")];

describe("dayStay", () => {
  it("counts the night and the stop's nights", () => {
    expect(dayStay(days, 1, "2027-05-03")).toEqual({ night: 2, nights: 2 });
  });

  it("calls the trip's last day the day home", () => {
    expect(dayStay(days, 2, "2027-05-03")).toEqual({ night: null, nights: 0 });
  });

  it("keeps the last row's night when the trip ends the day after it", () => {
    expect(dayStay(days, 2, "2027-05-04")).toEqual({ night: 1, nights: 1 });
  });
});
