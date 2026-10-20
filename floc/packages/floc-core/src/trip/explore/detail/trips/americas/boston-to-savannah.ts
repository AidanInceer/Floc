import { day } from "../../day";
import type { PresetDetail } from "../../preset-detail-types";

export const BOSTON_TO_SAVANNAH: PresetDetail = {
  stops: [
    {
      place: "Boston",
      summary: "The Freedom Trail and the North End.",
      days: [
        day("Land in Boston", ["14:00 Airport to Back Bay", "17:00 The public garden and Beacon Hill", "19:30 Oysters at the market"]),
        day("Freedom Trail", ["09:30 Walk the Freedom Trail", "13:00 Cannoli in the North End", "16:00 Harvard Square"]),
      ],
    },
    {
      place: "Cape Cod",
      summary: "Dunes, lighthouses and lobster rolls.",
      days: [
        day("Out to the Cape", ["10:00 Pick up the car, drive to the Cape", "13:00 * Lobster rolls in Chatham", "17:00 Lighthouse beach"], "Lobster rolls on the Cape"),
        day("Provincetown", ["09:00 Drive to the tip of the Cape", "11:00 Whale watching", "16:00 ~ Free afternoon in Provincetown."]),
      ],
    },
    {
      place: "Newport",
      summary: "The mansions and the cliff walk.",
      days: [day("Mansions by the sea", ["10:00 Drive to Newport, about 2h", "13:00 The Breakers", "16:00 The cliff walk"])],
    },
    {
      place: "New York",
      summary: "A long weekend: the park, the museums, the bridges.",
      days: [
        day("Into the city", ["10:00 Drive to New York, about 3h 15", "14:00 Drop the car", "17:00 The High Line at dusk"]),
        day("The park and the Met", ["09:30 Central Park", "12:00 The Met", "19:00 Dinner in the West Village"]),
        day("Brooklyn", ["10:00 Walk the Brooklyn Bridge", "12:00 Dumbo and Brooklyn Bridge park", "15:00 ~ Free afternoon."]),
      ],
    },
    {
      place: "Philadelphia",
      summary: "The Liberty Bell and a cheesesteak.",
      days: [day("Train to Philadelphia", ["10:00 Train, 1h 20", "12:30 Independence Hall and the Liberty Bell", "18:00 Reading Terminal market"])],
    },
    {
      place: "Washington",
      summary: "The Mall and the Smithsonian.",
      days: [
        day("Train to Washington", ["10:00 Train, 2h", "14:00 The Mall, Lincoln to the Capitol", "19:00 Dinner in Georgetown"]),
        day("The museums", ["10:00 Air and Space museum", "13:00 The national gallery", "16:00 ~ Free afternoon."]),
      ],
    },
    {
      place: "Shenandoah",
      summary: "The Blue Ridge, by Skyline Drive.",
      days: [
        day("To the mountains", ["09:00 Pick up a car, drive west, about 2h", "13:00 Luray caverns", "17:00 Cabin in the hills"]),
        day("Skyline Drive", ["08:00 * Skyline Drive south", "11:00 Walk to Dark Hollow falls", "16:00 ~ Free evening."], "Skyline Drive through the Blue Ridge"),
      ],
    },
    {
      place: "Charleston",
      summary: "The long drive south, then porches, palmettos and low-country food.",
      days: [
        day("The long drive south", ["08:00 Drive south, about 8h, with a stop", "17:00 Arrive in Charleston", "19:30 Shrimp and grits"]),
        day("Charleston", ["09:00 Walk the battery and Rainbow Row", "13:00 Boat to Fort Sumter", "17:00 ~ Free evening."]),
      ],
    },
    {
      place: "Savannah",
      summary: "Squares under the oaks to finish.",
      days: [
        day("To Savannah", ["10:00 Drive to Savannah, about 2h", "14:00 * Walk the squares", "19:00 Dinner on River street"], "Savannah's squares under the oaks"),
        day("Savannah, slow", ["09:00 Bonaventure cemetery", "13:00 Lunch at a family table", "15:00 ~ Free afternoon."]),
        day("Home from Savannah", ["09:00 Return the car", "11:00 Flight home"]),
      ],
    },
  ],
  inPlan: [
    { value: "17", label: "nights, all planned" },
    { value: "9", label: "stops" },
    { value: "2", label: "train rides" },
    { value: "1", label: "long drive south" },
  ],
  advice: [
    { topic: "before", title: "Before you go", lines: ["Most passports need an ESTA before you fly. Apply online.", "One-way car hire has a drop fee. Two hires, either side of the cities, is cheaper."] },
    { topic: "money", title: "Money", lines: ["Tip 18 to 20 percent in restaurants.", "Prices are shown before tax."] },
    { topic: "transport", title: "Getting about", lines: ["No car in New York, Philadelphia or Washington. The train is quicker."] },
  ],
  goodToKnow: [
    { label: "Pace", text: "On the move. Nine stops, one long driving day." },
    { label: "Driving", text: "Most drives are two or three hours." },
  ],
};
