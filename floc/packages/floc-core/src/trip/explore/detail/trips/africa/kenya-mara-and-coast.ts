import type { PresetDetail } from "../../preset-detail-types";

export const KENYA_MARA_AND_COAST: PresetDetail = {
  stops: [
    {
      place: "Nairobi",
      summary: "One easy day to land, see giraffes and sleep before the early flight.",
      days: [
        {
          title: "Land and giraffes",
          items: [
            { time: "09:00", text: "Land at Jomo Kenyatta airport, transfer to the hotel" },
            { time: "12:00", text: "Giraffe Centre in Karen" },
            { time: "15:00", text: "Lunch and a slow afternoon in Karen" },
            { time: "18:30", text: "Early dinner, bags packed for the morning flight" },
          ],
        },
      ],
    },
    {
      place: "Masai Mara",
      summary: "Three days of game drives from one camp, the first and last starting before sunrise.",
      days: [
        {
          title: "Fly to the Mara",
          items: [
            { time: "07:30", text: "Light aircraft from Wilson airport to the Mara airstrip" },
            { time: "10:30", text: "Transfer to camp, lunch and a rest" },
            { time: "16:00", text: "First game drive as the heat drops" },
          ],
        },
        {
          title: "Dawn drive",
          highlight: "Dawn game drives",
          items: [
            { time: "06:00", text: "Dawn game drive, when the cats are still out" },
            { time: "12:00", text: "Lunch at camp" },
            { time: "16:00", text: "Afternoon drive along the Mara river" },
          ],
        },
        {
          title: "The river, then nothing",
          highlight: "A river crossing, if the herds agree",
          items: [
            { time: "06:00", text: "Drive to the crossing points on the Mara river" },
            { time: "10:00", text: "Wait for the herds. They may cross, or not." },
            { time: "14:00", text: "Empty on purpose. Rest at camp.", free: true },
          ],
        },
      ],
    },
    {
      place: "Diani",
      summary: "Four nights on the beach, with one boat day on the reef.",
      days: [
        {
          title: "Fly to the coast",
          items: [
            { time: "06:00", text: "A last short game drive" },
            { time: "10:00", text: "Flight from the Mara to Ukunda airstrip" },
            { time: "13:30", text: "Lunch on the beach, then swim" },
          ],
        },
        {
          title: "Reef by dhow",
          highlight: "Diani reef by dhow",
          items: [
            { time: "08:30", text: "Dhow out to the reef" },
            { time: "10:30", text: "Snorkel the reef" },
            { time: "13:00", text: "Seafood lunch back on the beach" },
          ],
        },
        {
          title: "Beach day",
          items: [
            { time: "09:30", text: "Breakfast and a long walk along the sand" },
            { time: "12:30", text: "Lunch at a beach cafe" },
            { time: "14:30", text: "Empty on purpose. The group splits up.", free: true },
          ],
        },
        {
          title: "Forest walk",
          items: [
            { time: "08:00", text: "Guided walk in the coastal forest behind the beach" },
            { time: "12:00", text: "Lunch in Diani" },
            { time: "17:30", text: "Last sunset on the sand" },
          ],
        },
        {
          title: "Home from Ukunda",
          items: [
            { time: "08:30", text: "Transfer to Ukunda airstrip" },
            { time: "11:00", text: "Flight to Nairobi, then home" },
          ],
        },
      ],
    },
  ],
  inPlan: [
    { value: "8", label: "nights, all planned" },
    { value: "2", label: "flights" },
    { value: "25", label: "places, with times" },
    { value: "2", label: "empty afternoons" },
  ],
  advice: [
    {
      topic: "before",
      title: "Before you go",
      lines: ["Check the entry rules for your passport.", "Book the camp and the flights early for July to October."],
    },
    {
      topic: "health",
      title: "Malaria and the sun",
      lines: ["Malaria is present in the Mara and on the coast. Ask a doctor about tablets.", "Use repellent at dusk and a hat on the beach."],
    },
    {
      topic: "transport",
      title: "Bush flights",
      lines: ["Light aircraft have a tight weight limit and need soft bags.", "Ask the camp for the limit before you pack."],
    },
    {
      topic: "weather",
      title: "Cold dawns",
      lines: ["Dawn drives are cold in an open vehicle. Bring a fleece and a windproof layer.", "The coast is hot and humid by comparison."],
    },
  ],
  goodToKnow: [
    { label: "Pace", text: "Early starts on the Mara days, then four slow days on the coast." },
    { label: "Walking", text: "Little. Game drives are in a vehicle. One short guided walk on the coast." },
  ],
};
