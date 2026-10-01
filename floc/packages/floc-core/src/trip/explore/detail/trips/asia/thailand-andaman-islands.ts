import type { PresetDetail } from "../../preset-detail-types";

export const THAILAND_ANDAMAN_ISLANDS: PresetDetail = {
  stops: [
    {
      place: "Bangkok",
      summary: "Street food, the river and the old palace before the islands.",
      days: [
        {
          title: "Land, then Chinatown",
          highlight: "Street food in Chinatown",
          items: [
            { time: "15:00", text: "Airport to the hotel" },
            { time: "17:00", text: "Chao Phraya river boat" },
            { time: "19:00", text: "Yaowarat, Chinatown street food stall to stall" },
          ],
        },
        {
          title: "Palace and temples",
          items: [
            { time: "08:30", text: "Grand Palace, early before the heat" },
            { time: "11:00", text: "Wat Pho and the reclining Buddha" },
            { time: "14:00", text: "Jim Thompson House" },
            { time: "19:30", text: "Dinner in the old town" },
          ],
        },
      ],
    },
    {
      place: "Railay",
      summary: "Limestone cliffs, a beach you reach only by boat and long days on the water.",
      days: [
        {
          title: "Fly south, then the boat",
          items: [
            { time: "08:30", text: "Flight from Bangkok to Krabi" },
            { time: "12:00", text: "Long-tail boat from Ao Nang to Railay" },
            { time: "16:00", text: "First swim at Phra Nang beach" },
          ],
        },
        {
          title: "Four islands by long-tail",
          highlight: "Four islands by long-tail",
          items: [
            { time: "09:00", text: "Hire a long-tail boat for the day" },
            { time: "11:00", text: "Snorkelling off the islands" },
            { time: "13:00", text: "Lunch on a beach" },
          ],
        },
        {
          title: "Viewpoint, then sunset",
          highlight: "Sunset from Railay west",
          items: [
            { time: "08:00", text: "Railay viewpoint, a short steep climb" },
            { time: "14:00", text: "Empty on purpose. The group splits up.", free: true },
            { time: "17:30", text: "Sunset on Railay West beach" },
          ],
        },
        {
          title: "Rock and water",
          items: [
            { time: "09:00", text: "Beginner climbing lesson on the cliffs" },
            { time: "12:30", text: "Lunch on Railay East" },
            { time: "15:00", text: "Kayaks from Railay West" },
          ],
        },
      ],
    },
    {
      place: "Koh Lanta",
      summary: "Long quiet beaches, an old fishing town and a day on the water.",
      days: [
        {
          title: "Boat to Koh Lanta",
          items: [
            { time: "10:00", text: "Boat from Railay to Koh Lanta" },
            { time: "13:30", text: "Lunch on the west coast" },
            { time: "16:00", text: "Swim at Klong Dao beach" },
          ],
        },
        {
          title: "Old Town",
          items: [
            { time: "09:30", text: "Lanta Old Town, the stilt houses on the water" },
            { time: "12:30", text: "Seafood lunch on the pier" },
            { time: "16:30", text: "Long Beach for sunset" },
          ],
        },
        {
          title: "Park and beach",
          items: [
            { time: "09:00", text: "Mu Ko Lanta national park and the lighthouse" },
            { time: "12:00", text: "Lunch near the park gate" },
            { time: "14:00", text: "Empty on purpose. The group splits up.", free: true },
          ],
        },
        {
          title: "Snorkelling day",
          items: [
            { time: "08:30", text: "Boat trip to the reefs south of the island" },
            { time: "12:30", text: "Lunch on board" },
            { time: "19:00", text: "Last dinner on the beach" },
          ],
        },
        {
          title: "Home from Krabi",
          items: [
            { time: "09:00", text: "Minivan to Krabi airport" },
            { time: "14:00", text: "Flight home" },
          ],
        },
      ],
    },
  ],
  inPlan: [
    { value: "10", label: "nights, all planned" },
    { value: "2", label: "rides" },
    { value: "31", label: "places, with times" },
    { value: "2", label: "empty afternoons" },
  ],
  advice: [
    {
      topic: "before",
      title: "Before you go",
      lines: ["Check the entry rules for your passport.", "Book the Krabi flight and the island boat for the same day."],
    },
    {
      topic: "customs",
      title: "Temples",
      lines: ["Cover shoulders and knees in the Grand Palace and Wat Pho.", "Shoes off before you enter a temple hall."],
    },
    {
      topic: "weather",
      title: "Sea and weather",
      lines: ["November to April is the dry season. Seas are calm.", "Boats can stop in rough weather. Keep a spare day."],
    },
    {
      topic: "health",
      title: "Sun and water",
      lines: ["Use reef-safe sun cream and drink bottled water.", "Check your travel insurance covers boats and climbing."],
    },
  ],
  goodToKnow: [
    { label: "Pace", text: "Slow after Bangkok. Two moves in ten nights." },
    { label: "Boats", text: "Railay has no road. Long-tails run in daylight." },
  ],
};
