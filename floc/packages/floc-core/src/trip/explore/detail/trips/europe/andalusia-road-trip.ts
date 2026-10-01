import type { PresetDetail } from "../../preset-detail-types";

export const ANDALUSIA_ROAD_TRIP: PresetDetail = {
  stops: [
    {
      place: "Seville",
      summary: "Palace, cathedral and a late night of tapas across the river.",
      days: [
        {
          title: "Land, then Triana",
          highlight: "Tapas crawl in Triana",
          items: [
            { time: "14:00", text: "Airport to the hotel by taxi" },
            { time: "17:00", text: "Walk through Santa Cruz" },
            { time: "20:30", text: "Tapas crawl in Triana, a bar at a time" },
          ],
        },
        {
          title: "Alcázar and the cathedral",
          items: [
            { time: "09:30", text: "Real Alcázar" },
            { time: "12:30", text: "Cathedral and the climb up the Giralda" },
            { time: "16:00", text: "Plaza de España and the park behind it" },
          ],
        },
      ],
    },
    {
      place: "Córdoba",
      summary: "One night, the mosque-cathedral first thing and a quiet afternoon.",
      days: [
        {
          title: "Mezquita at opening time",
          highlight: "Mezquita at opening time",
          items: [
            { time: "07:30", text: "Collect the hire car" },
            { time: "08:00", text: "Drive to Córdoba, about 1h 30" },
            { time: "10:00", text: "The Mezquita when it opens" },
            { time: "15:00", text: "Empty on purpose. The group splits up.", free: true },
          ],
        },
      ],
    },
    {
      place: "Granada",
      summary: "The Alhambra at first light, the Albaicín at sunset and a slow last day.",
      days: [
        {
          title: "Drive in, then the Albaicín",
          items: [
            { time: "09:00", text: "Drive to Granada, about 2h 15" },
            { time: "13:30", text: "Lunch near the cathedral" },
            { time: "19:00", text: "Albaicín viewpoint at sunset" },
          ],
        },
        {
          title: "The Alhambra, first entry",
          highlight: "The Alhambra, first entry slot",
          items: [
            { time: "08:30", text: "Alhambra, first entry slot" },
            { time: "12:00", text: "Generalife gardens" },
            { time: "14:30", text: "Late lunch in the city" },
          ],
        },
        {
          title: "Old streets, then nothing",
          items: [
            { time: "10:00", text: "Royal Chapel and the old silk market" },
            { time: "12:30", text: "Tapas that come free with a drink" },
            { time: "15:00", text: "Empty on purpose. The group splits up.", free: true },
          ],
        },
        {
          title: "Home from Granada",
          items: [
            { time: "09:30", text: "Return the hire car" },
            { time: "11:30", text: "Airport transfer and flight home" },
          ],
        },
      ],
    },
  ],
  inPlan: [
    { value: "6", label: "nights, all planned" },
    { value: "2", label: "drives" },
    { value: "19", label: "places, with times" },
    { value: "2", label: "empty afternoons" },
  ],
  advice: [
    {
      topic: "before",
      title: "Book the Alhambra",
      lines: ["Check the entry rules for your passport.", "Alhambra tickets sell out months ahead. Book them first."],
    },
    {
      topic: "transport",
      title: "Driving",
      lines: ["Bring a full licence. Park at the edge of each old town and walk.", "Old centres restrict cars. Your hotel can tell you where to park."],
    },
    {
      topic: "customs",
      title: "Meal times",
      lines: ["Lunch is around 14:00 and dinner after 21:00.", "Many shops close in the afternoon."],
    },
    {
      topic: "weather",
      title: "Heat",
      lines: ["Sightsee early. Midday is hot even in spring.", "Carry water."],
    },
  ],
  goodToKnow: [
    { label: "Pace", text: "Steady. Three stops in six nights." },
    { label: "Driving", text: "Two drives, 1h 30 and 2h 15. No car needed in Seville." },
    { label: "Walking", text: "Cobbles and hills. Granada is the steepest." },
  ],
};
