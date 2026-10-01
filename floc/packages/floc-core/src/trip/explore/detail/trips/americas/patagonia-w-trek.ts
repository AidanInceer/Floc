import type { PresetDetail } from "../../preset-detail-types";

export const PATAGONIA_W_TREK: PresetDetail = {
  stops: [
    {
      place: "Puerto Natales",
      summary: "Two days to arrive, check the kit and rest before the walk.",
      days: [
        {
          title: "Arrive in Natales",
          items: [
            { time: "12:00", text: "Bus from Punta Arenas airport, about 3 hours" },
            { time: "16:30", text: "Check in and walk the waterfront" },
            { time: "19:00", text: "Dinner in town" },
          ],
        },
        {
          title: "Kit check, then nothing",
          items: [
            { time: "09:30", text: "Pack check and last supplies" },
            { time: "12:00", text: "Drive to the Milodon cave, about 30 minutes" },
            { time: "15:00", text: "Empty on purpose. Rest your legs.", free: true },
          ],
        },
      ],
    },
    {
      place: "Refugios on the W",
      summary: "Four walking days along the W, a refugio bed each night.",
      days: [
        {
          title: "Into the park, to Chileno",
          items: [
            { time: "07:00", text: "Bus from Puerto Natales into the park" },
            { time: "10:30", text: "Park entry at Laguna Amarga" },
            { time: "12:00", text: "Walk from Las Torres to the Chileno refugio" },
            { time: "18:30", text: "Dinner at the refugio" },
          ],
        },
        {
          title: "The Towers at sunrise",
          highlight: "Base of the Towers at sunrise",
          items: [
            { time: "04:00", text: "Head-torch climb to the Base of the Towers" },
            { time: "06:00", text: "Sunrise on the three towers" },
            { time: "11:00", text: "Walk along Lago Nordenskjöld to Los Cuernos" },
            { time: "18:30", text: "Dinner at the refugio" },
          ],
        },
        {
          title: "Up the French valley",
          highlight: "French valley",
          items: [
            { time: "08:30", text: "Walk from Los Cuernos to Italiano camp" },
            { time: "11:30", text: "Up the French valley to the lookout" },
            { time: "15:30", text: "Along the lake to Paine Grande" },
            { time: "19:00", text: "Dinner at the refugio" },
          ],
        },
        {
          title: "Grey glacier and back",
          highlight: "Grey glacier lookout",
          items: [
            { time: "08:00", text: "Walk north along Lago Grey" },
            { time: "11:30", text: "Grey glacier lookout" },
            { time: "14:30", text: "Walk back to Paine Grande" },
          ],
        },
      ],
    },
    {
      place: "Puerto Natales",
      summary: "Hot showers, a rest day and a boat up Last Hope Sound.",
      days: [
        {
          title: "Out of the park",
          items: [
            { time: "09:30", text: "Catamaran across Lago Pehoé" },
            { time: "10:30", text: "Bus to Puerto Natales" },
            { time: "15:00", text: "Showers, then the town" },
            { time: "19:30", text: "Dinner in town" },
          ],
        },
        {
          title: "A slow day",
          items: [
            { time: "10:00", text: "Slow start and a waterfront walk" },
            { time: "13:00", text: "Lunch in town" },
            { time: "15:00", text: "Empty on purpose. The group splits up.", free: true },
          ],
        },
        {
          title: "Last Hope Sound by boat",
          items: [
            { time: "08:30", text: "Boat up Last Hope Sound to the Balmaceda glacier" },
            { time: "13:00", text: "Lunch on the shore and a short walk to the Serrano glacier" },
            { time: "16:30", text: "Back in Puerto Natales" },
          ],
        },
        {
          title: "Home from Punta Arenas",
          items: [
            { time: "08:00", text: "Bus to Punta Arenas airport, about 3 hours" },
            { time: "14:00", text: "Flight out of Punta Arenas" },
          ],
        },
      ],
    },
  ],
  inPlan: [
    { value: "9", label: "nights, all planned" },
    { value: "2", label: "rides" },
    { value: "31", label: "places, with times" },
    { value: "2", label: "empty afternoons" },
  ],
  advice: [
    {
      topic: "before",
      title: "Before you go",
      lines: ["Check the entry rules for your passport.", "Be honest about fitness. Train with a loaded pack."],
    },
    {
      topic: "money",
      title: "Money",
      lines: ["Cards work in Puerto Natales.", "Carry some cash for snacks and extras inside the park."],
    },
    {
      topic: "weather",
      title: "Wind and layers",
      lines: ["The wind is strong and the weather turns fast.", "Pack waterproofs, warm layers and a hat, even in summer."],
    },
    {
      topic: "customs",
      title: "Leave no trace",
      lines: ["Carry out all rubbish.", "Open fires are not allowed in the park."],
    },
  ],
  goodToKnow: [
    { label: "Pace", text: "Slow at the ends, hard in the middle. Four walking days." },
    { label: "Walking", text: "The longest day is Grey glacier out and back, about 22 km." },
  ],
};
