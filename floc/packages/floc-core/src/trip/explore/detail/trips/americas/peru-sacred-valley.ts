import type { PresetDetail } from "../../preset-detail-types";

export const PERU_SACRED_VALLEY: PresetDetail = {
  stops: [
    {
      place: "Cusco",
      summary: "Three slow days to get used to the height.",
      days: [
        {
          title: "Land and rest",
          items: [
            { time: "10:00", text: "Flight into Cusco from Lima" },
            { time: "12:00", text: "Hotel, water and a slow lunch" },
            { time: "16:00", text: "Short walk around the main square" },
            { time: "19:00", text: "Early dinner" },
          ],
        },
        {
          title: "Old Cusco, then rest",
          items: [
            { time: "09:30", text: "Qorikancha, the Inca temple under the convent" },
            { time: "12:00", text: "San Pedro market" },
            { time: "14:30", text: "Empty on purpose. Rest at the hotel.", free: true },
          ],
        },
        {
          title: "Ruins above the city",
          items: [
            { time: "09:00", text: "Sacsayhuaman" },
            { time: "11:30", text: "Qenqo" },
            { time: "15:00", text: "Coffee and craft shops in San Blas" },
          ],
        },
      ],
    },
    {
      place: "Sacred Valley",
      summary: "A market, terraces, salt pans and an Inca fortress.",
      days: [
        {
          title: "Down to the valley",
          highlight: "Pisac market",
          items: [
            { time: "09:00", text: "Drive from Cusco to Pisac, about 45 minutes" },
            { time: "10:00", text: "Pisac market" },
            { time: "13:30", text: "Lunch in the valley" },
            { time: "16:00", text: "Settle in at the hotel" },
          ],
        },
        {
          title: "Moray and the salt pans",
          highlight: "Moray and the salt pans",
          items: [
            { time: "09:00", text: "Moray, the circular terraces" },
            { time: "11:30", text: "Maras salt pans" },
            { time: "14:00", text: "Empty on purpose. The group splits up.", free: true },
          ],
        },
        {
          title: "Ollantaytambo",
          items: [
            { time: "09:00", text: "Ollantaytambo fortress and terraces" },
            { time: "12:30", text: "Lunch in the old town" },
            { time: "17:00", text: "Pack a small bag for the train. Leave the rest at the hotel." },
          ],
        },
      ],
    },
    {
      place: "Aguas Calientes",
      summary: "One night below the citadel, then first entry.",
      days: [
        {
          title: "Train to Aguas Calientes",
          items: [
            { time: "10:00", text: "Train from Ollantaytambo, about 1h 45" },
            { time: "12:30", text: "Lunch in town" },
            { time: "15:00", text: "Walk by the river" },
            { time: "19:00", text: "Early dinner" },
          ],
        },
        {
          title: "Machu Picchu at first entry",
          highlight: "Machu Picchu first entry",
          items: [
            { time: "05:30", text: "Queue for the first bus up" },
            { time: "06:00", text: "Machu Picchu, first entry" },
            { time: "11:30", text: "Bus down to town" },
            { time: "14:30", text: "Train and road back to Cusco for the flight home" },
          ],
        },
      ],
    },
  ],
  inPlan: [
    { value: "7", label: "nights, all planned" },
    { value: "2", label: "rides between stops" },
    { value: "26", label: "places, with times" },
    { value: "2", label: "empty afternoons" },
  ],
  advice: [
    {
      topic: "before",
      title: "Before you go",
      lines: ["Check the entry rules for your passport.", "Machu Picchu tickets are timed and sell out. Buy them first, then the train."],
    },
    {
      topic: "health",
      title: "The height",
      lines: ["Cusco sits at about 3,400 m. Go slowly, drink water and skip alcohol on day one.", "Ask a doctor about altitude before you fly."],
    },
    {
      topic: "transport",
      title: "The train",
      lines: ["Bags on the train have a small weight limit.", "Take one small bag to Aguas Calientes and leave the rest."],
    },
    {
      topic: "weather",
      title: "Cold nights",
      lines: ["Dry season is sunny by day and cold at night.", "Pack layers, a rain jacket and sun cream."],
    },
  ],
  goodToKnow: [
    { label: "Altitude", text: "Cusco is about 3,400 m. The valley is lower, around 2,800 m." },
    { label: "Pace", text: "Gentle at first, then an early start on the last day." },
    { label: "Walking", text: "Steps and slopes at every ruin. Good shoes help." },
  ],
};
