import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Window } from "happy-dom";
import { describe, expect, it } from "vitest";

import type { TripForecast } from "@/server/itinerary/weather";

import { ForecastPanel } from "./forecast-panel";

const weather: TripForecast = {
  placeName: "Lisbon → Lagos",
  from: "2026-11-22",
  horizonEnd: "2026-11-30",
  nightPlaces: { "2026-11-22": "Lisbon, Portugal", "2026-11-23": "Lagos, Portugal" },
  days: [
    { date: "2026-11-22", placeName: "Lisbon, Portugal", condition: "cloud", label: "Cloudy", hi: 18, lo: 14 },
    { date: "2026-11-23", placeName: "Lagos, Portugal", condition: "rain", label: "Light rain", hi: 16, lo: 10 },
  ],
  hourly: {
    "2026-11-22": [{ hour: "00:00", condition: "cloud", temp: 16, rain: 0 }],
    "2026-11-23": [{ hour: "06:00", condition: "rain", temp: 11, rain: 0.4 }],
  },
};

function panel(selected: string | null) {
  const byDate = Object.fromEntries(weather.days.map((d) => [d.date, d]));
  return renderToStaticMarkup(
    createElement(ForecastPanel, { days: ["2026-11-22", "2026-11-23"], byDate, weather, selected, onSelect: () => {} }),
  );
}

function shown(html: string) {
  const doc = new Window().document;
  doc.body.innerHTML = html;
  for (const hidden of doc.querySelectorAll("[aria-hidden=\"true\"]")) hidden.remove();
  return doc.body.innerHTML;
}

describe("the forecast panel holds still (#714)", () => {
  it("keeps the day list and every day's hours in the panel, so opening a day never changes its height", () => {
    const html = panel("2026-11-22");
    expect(html).toContain("Lagos");
    expect(html).toContain("06:00");
    expect(html).toContain("00:00");
  });

  it("shows only the open day's hours, and hides the other views from sight and screen readers", () => {
    const html = shown(panel("2026-11-22"));
    expect(html).toContain("All days");
    expect(html).toContain("00:00");
    expect(html).not.toContain("06:00");
    expect(html).not.toContain("Mon 23");
  });

  it("shows only the day list when no day is open", () => {
    const html = shown(panel(null));
    expect(html).toContain("Mon 23");
    expect(html).not.toContain("All days");
  });
});
