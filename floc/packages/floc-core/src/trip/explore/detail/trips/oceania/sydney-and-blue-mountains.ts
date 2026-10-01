import type { PresetDetail } from "../../preset-detail-types";

export const SYDNEY_AND_BLUE_MOUNTAINS: PresetDetail = {
  stops: [
    {
      place: "Sydney",
      summary: "The harbour, the coast walk and a ferry to the beach, with one empty afternoon.",
      days: [
        {
          title: "Land, then the harbour",
          items: [
            { time: "14:00", text: "Airport to the hotel" },
            { time: "17:30", text: "Circular Quay and the Opera House at dusk" },
            { time: "19:30", text: "Dinner in The Rocks" },
          ],
        },
        {
          title: "Bondi to Coogee",
          highlight: "Bondi to Coogee walk",
          items: [
            { time: "09:00", text: "Coast walk from Bondi to Coogee, about 6 km" },
            { time: "13:00", text: "Lunch above the sea at Coogee" },
            { time: "15:30", text: "Swim between the flags" },
          ],
        },
        {
          title: "Ferry to Manly, then nothing",
          highlight: "Ferry to Manly",
          items: [
            { time: "09:30", text: "Ferry from Circular Quay to Manly, 30 minutes" },
            { time: "11:00", text: "Manly beach and the walk along the Corso" },
            { time: "14:00", text: "Empty on purpose. The group splits up.", free: true },
          ],
        },
        {
          title: "Gardens and a last harbour night",
          items: [
            { time: "10:00", text: "Royal Botanic Garden to Mrs Macquarie's Chair" },
            { time: "13:30", text: "Barangaroo waterfront walk" },
            { time: "19:00", text: "Dinner by the water" },
          ],
        },
      ],
    },
    {
      place: "Katoomba",
      summary: "Cliff lookouts, valley walks and a fire at night.",
      days: [
        {
          title: "Train up, then the Three Sisters",
          highlight: "Three Sisters lookout",
          items: [
            { time: "08:30", text: "Train from Central to Katoomba, a little over 2 hours" },
            { time: "12:00", text: "Lunch on the main street" },
            { time: "15:00", text: "Echo Point and the Three Sisters" },
            { time: "18:30", text: "Dinner, then a fire at the house" },
          ],
        },
        {
          title: "Waterfalls and Leura",
          items: [
            { time: "09:00", text: "Wentworth Falls lookout walk" },
            { time: "13:00", text: "Picnic lunch on the track" },
            { time: "15:30", text: "Leura village, coffee and shops" },
          ],
        },
        {
          title: "Blackheath, then nothing",
          items: [
            { time: "09:00", text: "Govetts Leap lookout at Blackheath" },
            { time: "12:30", text: "Lunch in Leura" },
            { time: "14:00", text: "Empty on purpose. The group splits up.", free: true },
          ],
        },
        {
          title: "Home from the mountains",
          items: [
            { time: "09:00", text: "Train from Katoomba to Central" },
            { time: "13:00", text: "Airport and flight home" },
          ],
        },
      ],
    },
  ],
  inPlan: [
    { value: "7", label: "nights, all planned" },
    { value: "1", label: "train ride" },
    { value: "22", label: "places, with times" },
    { value: "2", label: "empty afternoons" },
  ],
  advice: [
    {
      topic: "before",
      title: "Before you go",
      lines: ["Check the entry rules for your passport.", "Book the Katoomba house early for a weekend. It fills up."],
    },
    {
      topic: "weather",
      title: "Sun and swimming",
      lines: ["The sun is strong even in cool months. Wear a hat and sunscreen.", "Swim only between the red and yellow flags."],
    },
    {
      topic: "transport",
      title: "Getting around",
      lines: ["Use a contactless card or an Opal card on Sydney trains, buses and ferries.", "The mountains train runs about every hour."],
    },
    {
      topic: "customs",
      title: "Biosecurity",
      lines: ["Australia checks food, plants and outdoor gear at the border.", "Declare anything you are unsure about."],
    },
  ],
  goodToKnow: [
    { label: "Pace", text: "Easy. Two stops in seven nights and one train." },
    { label: "Walking", text: "Moderate. Coast and valley tracks, with some steps." },
  ],
};
