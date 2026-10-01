import type { PresetDetail } from "../../preset-detail-types";

export const GREAT_BARRIER_REEF_WEEK: PresetDetail = {
  stops: [
    {
      place: "Cairns",
      summary: "A full day on the reef, a train through the rainforest and an easy evening by the sea.",
      days: [
        {
          title: "Land, then the Esplanade",
          items: [
            { time: "14:00", text: "Airport to the hotel" },
            { time: "16:30", text: "Swim in the Esplanade lagoon" },
            { time: "19:00", text: "Dinner on the Esplanade" },
          ],
        },
        {
          title: "Out to the reef",
          highlight: "Outer reef snorkel",
          items: [
            { time: "08:00", text: "Boat from the marina to the outer reef, about 90 minutes" },
            { time: "10:30", text: "Snorkel the outer reef" },
            { time: "16:30", text: "Back at the marina" },
          ],
        },
        {
          title: "Up to Kuranda",
          items: [
            { time: "09:00", text: "Scenic railway up to Kuranda" },
            { time: "12:00", text: "Lunch and the markets in Kuranda" },
            { time: "15:00", text: "Empty on purpose. Back to the pool.", free: true },
          ],
        },
      ],
    },
    {
      place: "Port Douglas",
      summary: "The Daintree, a swim in the gorge and plenty of time by the pool.",
      days: [
        {
          title: "North along the coast",
          items: [
            { time: "09:30", text: "Drive to Port Douglas, 1 hour 20" },
            { time: "12:30", text: "Lunch on Macrossan Street" },
            { time: "15:00", text: "Four Mile Beach" },
          ],
        },
        {
          title: "Daintree river",
          highlight: "Daintree river cruise",
          items: [
            { time: "08:30", text: "Daintree river cruise, look for crocodiles and birds" },
            { time: "12:00", text: "Lunch in Daintree village" },
            { time: "15:00", text: "Back to the pool" },
          ],
        },
        {
          title: "Mossman Gorge, then nothing",
          highlight: "Mossman Gorge swim",
          items: [
            { time: "09:30", text: "Rainforest walk at Mossman Gorge" },
            { time: "12:00", text: "Swim in the river at the gorge" },
            { time: "15:00", text: "Empty on purpose. The group splits up.", free: true },
          ],
        },
        {
          title: "Lookout and a slow day",
          items: [
            { time: "09:00", text: "Walk up to Flagstaff Hill lookout" },
            { time: "11:00", text: "Four Mile Beach" },
            { time: "14:00", text: "Empty on purpose. Pool, books, nothing else.", free: true },
          ],
        },
        {
          title: "Home from Cairns",
          items: [
            { time: "08:30", text: "Drive to Cairns airport, 1 hour 20" },
            { time: "11:30", text: "Flight home" },
          ],
        },
      ],
    },
  ],
  inPlan: [
    { value: "7", label: "nights, all planned" },
    { value: "1", label: "drive" },
    { value: "20", label: "places, with times" },
    { value: "3", label: "empty afternoons" },
  ],
  advice: [
    {
      topic: "before",
      title: "Before you go",
      lines: ["Check the entry rules for your passport.", "Book the reef boat early. Good days sell out."],
    },
    {
      topic: "health",
      title: "Sun and water",
      lines: ["Wear a rash vest and reef-safe sunscreen.", "Never swim in rivers or the sea outside marked places. Crocodiles live here."],
    },
    {
      topic: "transport",
      title: "Driving",
      lines: ["Australians drive on the left.", "Hire a car for the whole stay. Buses north of Cairns are few."],
    },
    {
      topic: "weather",
      title: "Season",
      lines: ["May to October is the dry season, with cooler days and clear water.", "Stinger season runs from about November to May."],
    },
  ],
  goodToKnow: [
    { label: "Pace", text: "Slow. Two stops in seven nights, and the days are short." },
    { label: "Driving", text: "One drive of 1 hour 20 each way on a coastal road." },
  ],
};
