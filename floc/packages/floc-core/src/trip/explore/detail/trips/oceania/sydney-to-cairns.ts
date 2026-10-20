import { day } from "../../day";
import type { PresetDetail } from "../../preset-detail-types";

export const SYDNEY_TO_CAIRNS: PresetDetail = {
  stops: [
    {
      place: "Sydney",
      summary: "The harbour, the coast walk and a day in the Blue Mountains.",
      days: [
        day("Land in Sydney", ["13:00 Train from the airport to Circular Quay", "16:00 The opera house and the botanic garden", "19:30 Dinner in The Rocks"]),
        day("Bondi to Coogee", ["08:00 Walk Bondi to Coogee", "13:00 Lunch by the sea", "17:00 Ferry to Manly for sunset"]),
        day("The Blue Mountains", ["08:00 Train to Katoomba, 2h", "11:00 The Three Sisters", "13:00 Walk the cliff top", "18:00 Back in Sydney"]),
      ],
    },
    {
      place: "Byron Bay",
      summary: "Surf, the lighthouse at dawn and a slower pace.",
      days: [
        day("Fly north", ["09:00 Flight to Ballina, 1h 30", "12:00 Drive to Byron Bay", "16:00 Surf lesson at the Pass"]),
        day("Cape Byron", ["05:45 * Sunrise at Cape Byron", "09:00 Breakfast in town", "12:00 ~ Free afternoon."], "Sunrise at Cape Byron"),
        day("Hinterland", ["10:00 Drive to the hinterland waterfalls", "13:00 Lunch in Bangalow", "17:00 Sunset drinks"]),
      ],
    },
    {
      place: "Noosa",
      summary: "The national park on the headland, and a day on K'gari.",
      days: [
        day("North to Noosa", ["09:00 Drive to Noosa, about 3h 30", "14:00 Walk the headland", "18:00 Dinner on Hastings street"]),
        day("K'gari", ["07:00 4x4 tour to K'gari", "11:00 Lake McKenzie", "15:00 Seventy-Five Mile beach", "19:00 Back in Noosa"]),
      ],
    },
    {
      place: "Airlie Beach",
      summary: "The gateway to the Whitsundays, and a sail to Whitehaven.",
      days: [
        day("Fly to the Whitsundays", ["10:00 Flight from the Sunshine Coast, 1h 45", "15:00 The lagoon", "18:00 Sunset on the marina"]),
        day("Whitehaven", ["08:00 * Sail to Whitehaven Beach", "11:00 Hill Inlet lookout", "16:00 Back in Airlie"], "Whitehaven Beach by boat"),
        day("Airlie, free", ["10:00 ~ Nothing planned.", "19:00 Dinner"]),
      ],
    },
    {
      place: "Cairns",
      summary: "The outer reef, the rainforest and the end of the line.",
      days: [
        day("Fly to Cairns", ["10:00 Flight, 1h 30", "15:00 The esplanade lagoon", "19:00 Dinner by the water"]),
        day("The outer reef", ["08:00 Boat to the outer reef", "11:00 * Snorkel or dive", "17:00 Back in Cairns"], "Snorkelling the outer reef"),
        day("Daintree", ["08:00 Drive to the Daintree", "12:00 River cruise for crocodiles", "15:00 Cape Tribulation"]),
        day("Kuranda", ["09:00 Scenic railway to Kuranda", "14:00 Skyrail back down", "17:00 ~ Free evening."]),
        day("Home from Cairns", ["09:00 Airport", "11:00 Flight home via Sydney"]),
      ],
    },
  ],
  inPlan: [
    { value: "15", label: "nights, all planned" },
    { value: "5", label: "stops" },
    { value: "3", label: "flights" },
    { value: "2", label: "days on the reef and the sea" },
  ],
  advice: [
    { topic: "before", title: "Before you go", lines: ["Most passports need an ETA or eVisitor visa before you fly.", "Book the reef boat and the Whitehaven sail ahead."] },
    { topic: "health", title: "Sun and sea", lines: ["The sun is strong. Hat, shirt, sun cream.", "Stinger season is November to May. Wear the stinger suit."] },
    { topic: "weather", title: "Weather", lines: ["The north is wet from December to March. Spring and autumn are best."] },
  ],
  goodToKnow: [
    { label: "Pace", text: "Steady. Five stops, three short flights." },
    { label: "Driving", text: "One car from Byron to Noosa. Flights do the long hops." },
  ],
};
