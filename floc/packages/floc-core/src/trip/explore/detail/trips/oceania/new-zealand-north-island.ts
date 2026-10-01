import type { PresetDetail } from "../../preset-detail-types";

export const NEW_ZEALAND_NORTH_ISLAND: PresetDetail = {
  stops: [
    {
      place: "Auckland",
      summary: "A volcano at sunset, the harbour and a ferry across it.",
      days: [
        {
          title: "Land, then Mount Eden",
          items: [
            { time: "14:00", text: "Airport to the hotel" },
            { time: "17:30", text: "Mount Eden summit for the sunset" },
            { time: "19:30", text: "Dinner in Ponsonby" },
          ],
        },
        {
          title: "Domain and Devonport",
          items: [
            { time: "09:00", text: "Auckland Museum in the Domain" },
            { time: "12:30", text: "Ferry to Devonport, 12 minutes" },
            { time: "15:00", text: "Walk to North Head" },
          ],
        },
      ],
    },
    {
      place: "Rotorua",
      summary: "Glow worm caves on the way, then steam, forest and hot pools after dark.",
      days: [
        {
          title: "South by Waitomo",
          highlight: "Waitomo glow worms",
          items: [
            { time: "08:00", text: "Drive south from Auckland, 2 hours 30 to Waitomo" },
            { time: "10:30", text: "Waitomo glow worm caves" },
            { time: "13:00", text: "Drive on to Rotorua, about 2 hours" },
            { time: "17:30", text: "Kuirau Park, steam in the middle of town" },
          ],
        },
        {
          title: "Geothermal day, hot pools at night",
          highlight: "Hot pools at night",
          items: [
            { time: "09:00", text: "Wai-O-Tapu thermal area" },
            { time: "13:00", text: "Walk in the Redwoods forest" },
            { time: "15:30", text: "Empty on purpose. The group splits up.", free: true },
            { time: "20:00", text: "Lakeside hot pools after dark" },
          ],
        },
      ],
    },
    {
      place: "Taupō",
      summary: "The lake house, the falls and a long day on the volcano.",
      days: [
        {
          title: "To the lake, then nothing",
          items: [
            { time: "09:30", text: "Drive to Taupō, 1 hour" },
            { time: "11:30", text: "Huka Falls walk" },
            { time: "14:00", text: "Empty on purpose. Lake house, lake, nothing planned.", free: true },
          ],
        },
        {
          title: "Tongariro crossing",
          highlight: "Tongariro alpine crossing",
          items: [
            { time: "06:00", text: "Shuttle to the Mangatepopo start" },
            { time: "07:30", text: "Tongariro alpine crossing, 19 km, 6 to 8 hours" },
            { time: "15:30", text: "End at Ketetahi, shuttle back to Taupō" },
          ],
        },
        {
          title: "Rock carvings and craters",
          items: [
            { time: "10:00", text: "Boat to the Māori rock carvings at Mine Bay" },
            { time: "13:00", text: "Craters of the Moon walk" },
            { time: "18:30", text: "Last dinner at the lake house" },
          ],
        },
        {
          title: "Home from Auckland",
          items: [
            { time: "09:00", text: "Drive to Auckland airport, about 4 hours 30" },
            { time: "14:00", text: "Return the car" },
            { time: "16:30", text: "Flight home" },
          ],
        },
      ],
    },
  ],
  inPlan: [
    { value: "7", label: "nights, all planned" },
    { value: "2", label: "drives" },
    { value: "24", label: "places, with times" },
    { value: "2", label: "empty afternoons" },
  ],
  advice: [
    {
      topic: "before",
      title: "Before you go",
      lines: ["Check the entry rules for your passport.", "Book the Waitomo caves and the crossing shuttle early."],
    },
    {
      topic: "transport",
      title: "Driving",
      lines: ["New Zealand drives on the left. Share the driving on the long days.", "Roads are slower than the map suggests. Add time."],
    },
    {
      topic: "weather",
      title: "Mountain weather",
      lines: ["The crossing can shut in high wind or cloud. Keep a spare day.", "Bring a warm layer, a rain jacket and a hat, even in summer."],
    },
    {
      topic: "customs",
      title: "Biosecurity",
      lines: ["New Zealand checks food, boots and outdoor gear at the border.", "Clean your boots and declare anything you are unsure about."],
    },
  ],
  goodToKnow: [
    { label: "Pace", text: "Steady. Three stops in seven nights and two drives." },
    { label: "Walking", text: "One hard day: the crossing. The rest is easy." },
    { label: "Driving", text: "About 4 hours 30 on the first drive, 1 hour on the second." },
  ],
};
