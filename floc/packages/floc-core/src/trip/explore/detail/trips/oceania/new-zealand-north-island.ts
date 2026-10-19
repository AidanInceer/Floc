import { day } from "../../day";
import type { PresetDetail } from "../../preset-detail-types";

export const NEW_ZEALAND_NORTH_ISLAND: PresetDetail = {
  stops: [
    {
      place: "Auckland",
      summary: "The harbour city, and a ferry to Waiheke.",
      days: [
        day("Land in Auckland", ["14:00 Airport to the waterfront", "17:00 Sky Tower at sunset", "19:30 Dinner at the Viaduct"]),
        day("Waiheke", ["10:00 Ferry to Waiheke island", "12:30 Lunch at a vineyard", "17:00 Back in the city"]),
      ],
    },
    {
      place: "Bay of Islands",
      summary: "Boats among 144 islands, and Waitangi.",
      days: [
        day("North to the bay", ["09:00 Pick up the car, drive north, about 3h 30", "14:00 Waitangi treaty grounds", "18:00 Dinner in Paihia"]),
        day("The Hole in the Rock", ["09:00 Boat out to the Hole in the Rock", "14:00 Ferry to Russell", "17:00 ~ Free evening."]),
      ],
    },
    {
      place: "Coromandel",
      summary: "Cathedral Cove and a hot spring dug in the sand.",
      days: [
        day("Down to the Coromandel", ["09:00 Drive to Whitianga, about 5h", "16:00 Walk on Buffalo beach", "19:00 Fish and chips"]),
        day("Cove and hot beach", ["08:00 Walk to Cathedral Cove", "13:00 Hot Water Beach at low tide", "17:00 ~ Free evening."], "Hot Water Beach at low tide"),
      ],
    },
    {
      place: "Rotorua",
      summary: "Steam, mud pools, a hāngī, and the glow worms of Waitomo.",
      days: [
        day("To Rotorua", ["09:00 Drive to Rotorua, about 3h", "14:00 Wai-O-Tapu thermal park", "18:00 Hāngī and a Māori cultural evening"]),
        day("Waitomo", ["08:30 Drive to Waitomo, 2h", "11:00 Glow worm caves by boat", "17:00 Back in Rotorua, then the hot pools"], "Waitomo's glow worms"),
      ],
    },
    {
      place: "Tongariro",
      summary: "The alpine crossing over the volcanoes.",
      days: [
        day("To the volcanoes", ["09:00 Drive south by Lake Taupō, about 2h 30", "13:00 Huka falls", "18:00 Dinner in National Park village"]),
        day("The crossing", ["06:30 Shuttle to the start", "07:00 Walk the Tongariro alpine crossing, 19 km", "16:00 Pick-up at the far end"], "The Tongariro alpine crossing"),
      ],
    },
    {
      place: "Wellington",
      summary: "The capital: Te Papa, the waterfront and good coffee.",
      days: [
        day("South to Wellington", ["09:00 Drive south, about 4h 30", "15:00 Cable car up the hill", "19:00 Dinner on Cuba street"]),
        day("Te Papa", ["10:00 Te Papa museum", "14:00 ~ Free afternoon.", "18:00 Mount Victoria for sunset"]),
        day("Home from Wellington", ["09:00 Return the car", "11:00 Flight home via Auckland"]),
      ],
    },
  ],
  inPlan: [
    { value: "12", label: "nights, all planned" },
    { value: "6", label: "stops" },
    { value: "1", label: "alpine crossing" },
    { value: "2", label: "boat days" },
  ],
  advice: [
    { topic: "before", title: "Before you go", lines: ["Most passports need an NZeTA before you fly.", "Book the Tongariro shuttle. Check the weather the night before."] },
    { topic: "transport", title: "Driving", lines: ["Drive on the left. Roads are slower than the map says."] },
    { topic: "health", title: "The crossing", lines: ["Nineteen kilometres with a steep climb. Bring water, food and layers."] },
    { topic: "customs", title: "Biosecurity", lines: ["Declare food and clean your boots before you land."] },
  ],
  goodToKnow: [
    { label: "Pace", text: "Steady. Six stops, one long walk." },
    { label: "Tides", text: "Hot Water Beach works only at low tide. The plan follows it." },
  ],
};
