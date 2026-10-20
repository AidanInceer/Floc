import { day } from "../../day";
import type { PresetDetail } from "../../preset-detail-types";

export const THAILAND_ANDAMAN_ISLANDS: PresetDetail = {
  stops: [
    {
      place: "Bangkok",
      summary: "Temples, the river, Chinatown, then the sleeper north.",
      days: [
        day("Land and Chinatown", ["14:00 Airport train to the hotel by the river", "17:30 Wat Arun at sunset", "19:30 * Street food on Yaowarat road"], "Street food in Chinatown"),
        day("Palace, then the sleeper", ["08:30 The Grand Palace and Wat Pho", "12:30 Boat up the Chao Phraya", "18:10 * Sleeper train north from Krung Thep Aphiwat"], "Sleeper train to Chiang Mai"),
      ],
    },
    {
      place: "Chiang Mai",
      summary: "The old city, the mountain temple and a morning with elephants that are not ridden.",
      days: [
        day("Off the train", ["07:00 Arrive in Chiang Mai", "10:00 Old city temples by bike", "18:00 Sunday walking street"]),
        day("Elephants, kindly", ["08:00 An elephant sanctuary, no riding", "15:00 Back for a massage", "19:00 Khao soi for dinner"]),
        day("Doi Suthep", ["08:00 Up to Wat Doi Suthep", "12:00 Nimman cafés", "14:00 ~ Free afternoon."]),
      ],
    },
    {
      place: "Railay",
      summary: "Cliffs, long-tails and no road in.",
      days: [
        day("South to the sea", ["10:00 Flight to Krabi, 2h", "14:00 Long-tail to Railay", "18:00 * Sunset from Railay west"], "Sunset from Railay west"),
        day("Four islands", ["09:00 * Long-tail to Poda, Chicken and Tup islands", "13:00 Lunch on the sand", "16:00 Back for a swim at Phra Nang"], "Four islands by long-tail"),
        day("Cliffs", ["08:00 Climbing lesson on the limestone", "13:00 ~ Free afternoon.", "19:00 Dinner on the beach"]),
      ],
    },
    {
      place: "Koh Phi Phi",
      summary: "Maya Bay by boat and a hike to the viewpoint.",
      days: [
        day("Ferry to Phi Phi", ["10:30 Ferry from Railay, 1h 30", "14:00 Walk to Long Beach", "17:30 Viewpoint for sunset"]),
        day("Maya Bay", ["07:00 Boat to Maya Bay before the crowds", "10:00 Snorkel at Pileh lagoon", "15:00 ~ Free afternoon."]),
      ],
    },
    {
      place: "Koh Lanta",
      summary: "The quiet island to finish: long beaches and nothing to do.",
      days: [
        day("Over to Lanta", ["11:00 Ferry to Koh Lanta, 1h 30", "15:00 Check in on Kantiang bay", "18:00 Sunset drinks"]),
        day("Mu Ko Lanta park", ["09:00 Scooter to the national park", "13:00 Lunch at Bamboo bay", "16:00 Swim"]),
        day("Lanta, free", ["10:00 ~ Nothing planned at all.", "19:00 Last dinner on the sand"]),
        day("Home", ["08:00 Minivan and ferry to Krabi airport", "13:00 Flight home via Bangkok"]),
      ],
    },
  ],
  inPlan: [
    { value: "13", label: "nights, all planned" },
    { value: "5", label: "stops" },
    { value: "3", label: "boat rides" },
    { value: "1", label: "night train" },
  ],
  advice: [
    { topic: "before", title: "Before you go", lines: ["Check the entry rules for your passport.", "Book the sleeper early. Lower berths go first."] },
    { topic: "customs", title: "Temples", lines: ["Cover shoulders and knees in the Grand Palace and Wat Pho.", "Shoes off before you enter a temple hall."] },
    { topic: "weather", title: "Sea and weather", lines: ["November to April is the dry season. Seas are calm.", "Boats can stop in rough weather. Keep a spare day."] },
    { topic: "health", title: "Sun and water", lines: ["Use reef-safe sun cream and drink bottled water.", "Check your travel insurance covers boats and climbing."] },
  ],
  goodToKnow: [
    { label: "Pace", text: "Busy in Bangkok and Chiang Mai, then slow on the islands." },
    { label: "Boats", text: "Railay has no road. Long-tails run in daylight." },
  ],
};
