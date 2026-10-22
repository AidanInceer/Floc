import { day } from "../../day";
import { at, swap } from "../../ideas";
import type { PresetDetail } from "../../preset-detail-types";

export const CROATIA_AND_MONTENEGRO: PresetDetail = {
  stops: [
    {
      place: "Split",
      summary: "A palace town, and the waterfalls at Krka.",
      days: [
        day("Land in Split", ["13:00 Airport to the old town", "16:00 Diocletian's palace", "19:30 Dinner on the Riva"]),
        day("Krka", ["08:30 Drive to Krka national park", "10:00 * The boardwalks and the falls", "16:00 Back in Split for a swim"], "Krka's waterfalls"),
      ],
    },
    {
      place: "Hvar",
      summary: "Lavender, a fortress above the harbour and the Pakleni islands.",
      days: [
        day("Ferry to Hvar", ["10:00 * Fast ferry, 1h", "14:00 Climb to the fortress", "19:00 Dinner in the old town"], "Island to island by fast ferry"),
        day("The Pakleni islands", ["10:00 Water taxi to the Pakleni islands", "13:00 Lunch at a konoba on the beach", "17:00 ~ Free evening."]),
      ],
    },
    {
      place: "Korčula",
      summary: "A small walled town and the wine of the island.",
      days: [
        day("On to Korčula", ["11:00 Ferry, 1h 30", "15:00 Walk the walls", "19:00 Sunset from a tower bar"]),
        day("Bikes and wine", ["09:00 Bikes to Lumbarda", "12:00 Grk wine tasting", "15:00 Swim at Pržina beach"]),
      ],
    },
    {
      place: "Dubrovnik",
      summary: "The walls, the cable car and a day on the Elaphiti islands.",
      days: [
        day("Into Dubrovnik", ["10:00 Ferry, about 2h", "15:00 Check in", "18:00 * The walls at dusk"], "Dubrovnik's walls at dusk"),
        day("Kayak and cable car", ["09:00 Sea kayak round Lokrum", "14:00 ~ Free afternoon.", "18:30 Cable car up Mount Srđ"]),
        day("The Elaphiti islands", ["10:00 Boat to Koločep, Lopud and Šipan", "17:00 Back in Dubrovnik", "20:00 Last dinner in Croatia"]),
      ],
    },
    {
      place: "Kotor",
      summary: "Over the border to a fjord-like bay and a fortress on the hill.",
      days: [
        day("To the bay of Kotor", ["10:00 Drive to Kotor, about 2h 30", "14:00 Boat to Our Lady of the Rocks", "19:00 Dinner in the old town"]),
        day("The fortress", ["07:00 Climb to San Giovanni fortress", "11:00 Perast by the water", "16:00 ~ Free afternoon."]),
        day("Home from Tivat", ["09:00 Drive to Tivat airport", "11:00 Flight home"]),
      ],
    },
  ],
  inPlan: [
    { value: "11", label: "nights, all planned" },
    { value: "2", label: "countries" },
    { value: "3", label: "ferries" },
    { value: "2", label: "island days" },
  ],
  advice: [
    { topic: "before", title: "Before you go", lines: ["Book the summer ferries a few weeks ahead.", "Montenegro is outside the EU. Carry your passport at the border."] },
    { topic: "money", title: "Money", lines: ["Croatia and Montenegro both use the euro.", "Cards work in towns. Keep some cash for island konobas."] },
    { topic: "weather", title: "Sea and weather", lines: ["The sea is warm from June to September.", "Bring sandals for the stony beaches."] },
  ],
  goodToKnow: [
    { label: "Pace", text: "Steady. A boat every second day." },
    { label: "Walking", text: "Old towns are steep stone streets and steps." },
  ],
  ideas: {
    atStops: [
      at("Split", [
        ["Marjan hill", "Steady", "Free"],
        ["Krka waterfalls for the day", "Steady", "Mid"],
      ]),
      at("Hvar", [
        ["Water taxi to the Pakleni islands", "Relaxed", "Mid"],
        ["Lavender fields and Stari Grad", "Relaxed", "Low"],
      ]),
      at("Korčula", [
        ["Moreška sword dance", "Relaxed", "Low"],
        ["Cycle to the vineyards at Lumbarda", "Steady", "Low"],
      ]),
      at("Dubrovnik", [
        ["Sea kayak round Lokrum", "Active", "Mid"],
        ["Cable car up Mount Srđ", "Relaxed", "Mid"],
        ["Boat to Cavtat", "Relaxed", "Low"],
      ]),
      at("Kotor", [
        ["Climb the walls to San Giovanni fort", "Active", "Low"],
        ["Boat to Our Lady of the Rocks", "Relaxed", "Low"],
      ]),
    ],
    otherStops: [
      swap("Vis", 2, "Hvar", "A far island with the Blue Cave and quiet coves."),
      swap("Mostar", 1, "Kotor", "The old bridge and its divers, in Bosnia and Herzegovina."),
    ],
  },
};
