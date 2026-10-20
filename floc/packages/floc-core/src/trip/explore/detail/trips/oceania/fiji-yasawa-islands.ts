import { day } from "../../day";
import type { PresetDetail } from "../../preset-detail-types";

export const FIJI_YASAWA_ISLANDS: PresetDetail = {
  stops: [
    {
      place: "Nadi",
      summary: "A night to land.",
      days: [day("Land in Nadi", ["14:00 Airport to the hotel", "17:00 Sri Siva Subramaniya temple", "19:00 Dinner by the pool"])],
    },
    {
      place: "Mamanuca islands",
      summary: "The first islands out from Port Denarau.",
      days: [
        day("Out to the Mamanucas", ["09:00 Boat from Port Denarau, 1h", "12:00 Lunch on the sand", "16:00 Snorkel the house reef"]),
        day("Cloud 9", ["10:00 Boat to the Cloud 9 platform", "15:00 ~ Free afternoon."]),
      ],
    },
    {
      place: "Yasawa islands",
      summary: "Four nights up the Yasawa chain: reef, villages and caves.",
      days: [
        day("Up the chain", ["09:30 Yasawa Flyer north, about 3h", "14:00 Check in on Nacula", "18:00 Sunset from the hill"]),
        day("Manta rays", ["08:00 * Snorkel with manta rays, in season", "13:00 Lunch", "15:00 ~ Free afternoon."], "Snorkelling with manta rays"),
        day("The village", ["10:00 Visit a Yasawa village with the chief's permission", "13:00 Kava ceremony", "19:00 * Lovo feast"], "A lovo feast in a Yasawa village"),
        day("Sawa-i-Lau caves", ["09:00 Boat to the Sawa-i-Lau caves", "11:00 Swim in the cave", "16:00 ~ Free evening."]),
      ],
    },
    {
      place: "Coral Coast",
      summary: "Back to the main island and the sand dunes of Sigatoka.",
      days: [
        day("South to the Coral Coast", ["08:30 Boat back to Port Denarau, then the road, about 5h", "16:00 Check in on the Coral Coast", "19:00 Dinner"]),
        day("Sigatoka", ["09:00 Walk the Sigatoka sand dunes", "13:00 Lunch", "15:00 ~ Free afternoon on the beach."]),
      ],
    },
    {
      place: "Pacific Harbour",
      summary: "Fiji's adventure town: sharks, rivers and rafting.",
      days: [
        day("To Pacific Harbour", ["10:00 Drive east, 1h 30", "14:00 River safari", "19:00 Dinner"]),
        day("Beqa lagoon", ["07:30 * Shark dive in Beqa lagoon", "13:00 Lunch", "15:00 ~ Free afternoon."], "Shark dive in Beqa lagoon"),
        day("Home from Nadi", ["07:00 Drive to Nadi airport, about 2h 30", "12:00 Flight home"]),
      ],
    },
  ],
  inPlan: [
    { value: "11", label: "nights, all planned" },
    { value: "5", label: "stops" },
    { value: "3", label: "boat rides" },
    { value: "4", label: "nights on the outer islands" },
  ],
  advice: [
    { topic: "before", title: "Before you go", lines: ["Check the entry rules for your passport.", "Bring cash for the outer islands. Few take cards."] },
    { topic: "customs", title: "Village visits", lines: ["Cover shoulders and knees, and take hats off in a village.", "Bring a gift of kava root for the chief. The guide will help."] },
    { topic: "weather", title: "Weather", lines: ["May to October is dry and cooler. Manta season is May to October."] },
    { topic: "health", title: "Sun and water", lines: ["Reef-safe sun cream. Drink bottled water on the islands."] },
  ],
  goodToKnow: [
    { label: "Pace", text: "Slow. Island time." },
    { label: "Boats", text: "The Yasawa Flyer runs once a day. Moves follow its timetable." },
  ],
};
