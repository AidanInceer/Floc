import type { PresetDetail } from "../../preset-detail-types";

export const ZANZIBAR_SLOW_WEEK: PresetDetail = {
  stops: [
    {
      place: "Stone Town",
      summary: "Two days in the old town, with spices and a night market.",
      days: [
        {
          title: "Land and Forodhani",
          highlight: "Forodhani night market",
          items: [
            { time: "11:30", text: "Land at Zanzibar airport, 20 minutes to the old town" },
            { time: "14:30", text: "Walk the lanes, doors and courtyards of Stone Town" },
            { time: "19:00", text: "Forodhani night market on the waterfront" },
          ],
        },
        {
          title: "Spice farm morning",
          highlight: "Spice farm morning",
          items: [
            { time: "08:30", text: "Spice farm, tasting as you walk" },
            { time: "13:00", text: "Lunch in the old town" },
            { time: "15:30", text: "The old slave market site and the cathedral" },
          ],
        },
      ],
    },
    {
      place: "Nungwi",
      summary: "Five nights on the north coast, where the tide sets the plan.",
      days: [
        {
          title: "North to the beach",
          items: [
            { time: "09:30", text: "Drive to Nungwi, about 1h 30" },
            { time: "12:00", text: "Lunch and a first swim" },
            { time: "17:30", text: "Sunset on the beach" },
          ],
        },
        {
          title: "Sandbank day",
          highlight: "Sandbank snorkel trip",
          items: [
            { time: "09:00", text: "Boat out to a sandbank, timed to the tide" },
            { time: "10:30", text: "Snorkel on the reef" },
            { time: "12:30", text: "Picnic lunch on the sand" },
          ],
        },
        {
          title: "Turtles and boats",
          items: [
            { time: "09:30", text: "Turtle sanctuary at Mnarani" },
            { time: "12:30", text: "Lunch on the beach" },
            { time: "16:00", text: "Watch dhows being built on the shore" },
          ],
        },
        {
          title: "Low tide to Kendwa",
          items: [
            { time: "09:00", text: "Walk along the beach to Kendwa at low tide" },
            { time: "12:30", text: "Lunch in Kendwa" },
            { time: "14:30", text: "Empty on purpose. The group splits up.", free: true },
          ],
        },
        {
          title: "Slow day and a dhow",
          items: [
            { time: "10:00", text: "Slow morning, swim and read" },
            { time: "12:30", text: "Lunch at the hotel" },
            { time: "14:00", text: "Empty on purpose. Sleep or swim.", free: true },
            { time: "17:30", text: "Sunset sail on a dhow" },
          ],
        },
        {
          title: "Home from the island",
          items: [
            { time: "08:30", text: "Drive to the airport, about 1h 15" },
            { time: "12:00", text: "Flight home" },
          ],
        },
      ],
    },
  ],
  inPlan: [
    { value: "7", label: "nights, all planned" },
    { value: "1", label: "drive" },
    { value: "22", label: "places, with times" },
    { value: "2", label: "empty afternoons" },
  ],
  advice: [
    {
      topic: "before",
      title: "Before you go",
      lines: ["Check the entry rules for your passport.", "Ask a doctor about vaccines and malaria tablets."],
    },
    {
      topic: "customs",
      title: "Dress and manners",
      lines: ["Zanzibar is mostly Muslim. Cover shoulders and knees in Stone Town.", "Ask before you photograph people."],
    },
    {
      topic: "money",
      title: "Cash",
      lines: ["Carry cash for the market, spice farm and boat crews.", "Many beach hotels take cards, but not all."],
    },
    {
      topic: "weather",
      title: "Rains",
      lines: ["June to October is dry. January and February are hot and dry.", "Rains come in March to May, and shorter ones in November."],
    },
  ],
  goodToKnow: [
    { label: "Pace", text: "Slow. Two bases and one drive." },
    { label: "Tides", text: "The tide sets the boat trips and the beach walks. Ask your hotel for the times." },
  ],
};
