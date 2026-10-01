import type { PresetDetail } from "../../preset-detail-types";

export const COSTA_RICA_VOLCANO_AND_COAST: PresetDetail = {
  stops: [
    {
      place: "San José",
      summary: "One night to land and eat before the drive north.",
      days: [
        {
          title: "Land and settle",
          items: [
            { time: "14:30", text: "Airport to the hotel" },
            { time: "16:30", text: "Central Market for coffee and snacks" },
            { time: "19:00", text: "Dinner in Barrio Escalante" },
          ],
        },
      ],
    },
    {
      place: "La Fortuna",
      summary: "The volcano, the bridges and hot springs after dark.",
      days: [
        {
          title: "Drive to La Fortuna",
          highlight: "Hot springs at night",
          items: [
            { time: "08:30", text: "Drive from San José, about 3 hours" },
            { time: "12:30", text: "Lunch at a local soda" },
            { time: "14:30", text: "La Fortuna waterfall, a steep stair down" },
            { time: "19:00", text: "Hot springs after dark" },
          ],
        },
        {
          title: "Hanging bridges",
          highlight: "Arenal hanging bridges",
          items: [
            { time: "07:30", text: "Arenal hanging bridges, early for the birds" },
            { time: "11:30", text: "Lunch in town" },
            { time: "15:00", text: "Cacao farm tour" },
          ],
        },
        {
          title: "Volcano, then nothing",
          items: [
            { time: "09:00", text: "Walk the old lava fields in Arenal Volcano National Park" },
            { time: "12:30", text: "Lunch by Lake Arenal" },
            { time: "15:00", text: "Empty on purpose. The group splits up.", free: true },
          ],
        },
      ],
    },
    {
      place: "Manuel Antonio",
      summary: "A beach house, the park and boat trips.",
      days: [
        {
          title: "Drive to the coast",
          items: [
            { time: "08:30", text: "Drive from La Fortuna, about 4 hours" },
            { time: "11:30", text: "Stop at the Tarcoles bridge to look for crocodiles" },
            { time: "14:00", text: "Settle in at the beach house" },
            { time: "17:30", text: "Sunset on the beach" },
          ],
        },
        {
          title: "Manuel Antonio park walk",
          highlight: "Manuel Antonio park walk",
          items: [
            { time: "07:00", text: "Walk in the national park as it opens" },
            { time: "12:00", text: "Lunch outside the park" },
            { time: "17:00", text: "Sunset from a viewpoint on the hill" },
          ],
        },
        {
          title: "Beach day, then nothing",
          items: [
            { time: "09:00", text: "Espadilla beach" },
            { time: "12:30", text: "Lunch in town" },
            { time: "15:00", text: "Empty on purpose. The group splits up.", free: true },
          ],
        },
        {
          title: "Mangroves and a last dinner",
          items: [
            { time: "08:00", text: "Boat through the mangroves from Quepos" },
            { time: "12:00", text: "Lunch in Quepos" },
            { time: "18:30", text: "Last dinner together" },
          ],
        },
        {
          title: "Home from San José",
          items: [
            { time: "07:30", text: "Drive to San José airport, about 3 hours" },
            { time: "13:30", text: "Flight home" },
          ],
        },
      ],
    },
  ],
  inPlan: [
    { value: "8", label: "nights, all planned" },
    { value: "2", label: "drives" },
    { value: "26", label: "places, with times" },
    { value: "2", label: "empty afternoons" },
  ],
  advice: [
    {
      topic: "before",
      title: "Before you go",
      lines: ["Check the entry rules for your passport.", "Manuel Antonio park limits daily visitors and is closed one day a week. Book ahead."],
    },
    {
      topic: "money",
      title: "Money",
      lines: ["Cards work in most places. Carry some colones for sodas and small stalls.", "Check the bill before you pay."],
    },
    {
      topic: "transport",
      title: "Driving",
      lines: ["Roads are narrow, with many one-lane bridges. Give way when the sign says so.", "Do not drive after dark."],
    },
    {
      topic: "health",
      title: "Sun, insects and surf",
      lines: ["Pack repellent and sun cream.", "Rip currents are common on the Pacific beaches. Swim where others swim."],
    },
  ],
  goodToKnow: [
    { label: "Driving", text: "Three and four hours on the two long legs. Share the wheel." },
    { label: "Pace", text: "Easy. Two long drive days, the rest is short." },
  ],
};
