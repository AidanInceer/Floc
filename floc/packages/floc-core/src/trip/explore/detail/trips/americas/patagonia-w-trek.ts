import { day } from "../../day";
import type { PresetDetail } from "../../preset-detail-types";

export const PATAGONIA_W_TREK: PresetDetail = {
  stops: [
    {
      place: "El Calafate",
      summary: "The lake town, and the Perito Moreno glacier.",
      days: [
        day("Land in El Calafate", ["14:00 Airport to the town", "17:00 Walk to Laguna Nimez", "20:00 Patagonian lamb"]),
        day("Perito Moreno", ["08:30 Drive to the glacier", "10:00 * The walkways facing the ice", "13:00 Boat to the face", "17:00 Back in town"], "The Perito Moreno glacier"),
      ],
    },
    {
      place: "El Chaltén",
      summary: "Three days of walking under Fitz Roy.",
      days: [
        day("North to El Chaltén", ["09:00 Drive to El Chaltén, about 3h", "14:00 Walk to the condor viewpoint", "19:00 Dinner in the village"]),
        day("Laguna de los Tres", ["07:00 * Walk to Laguna de los Tres, about 10 hours", "18:00 Back in town"], "Laguna de los Tres under Fitz Roy"),
        day("Laguna Torre", ["09:00 Walk to Laguna Torre", "16:00 ~ Free evening."]),
      ],
    },
    {
      place: "Puerto Natales",
      summary: "Over the border to Chile, a night to pack for the W.",
      days: [day("Over the border", ["07:00 Bus to Puerto Natales, about 8h", "16:00 Arrive in Chile", "19:00 Briefing and dinner"])],
    },
    {
      place: "Refugios on the W",
      summary: "The W trek in Torres del Paine, refugio to refugio.",
      days: [
        day("Into the park", ["08:00 Bus to the park, 2h", "11:00 Catamaran across Lago Pehoé", "13:00 * Walk to Grey glacier"], "The W trek, refugio to refugio"),
        day("French valley", ["08:00 Walk up the French valley", "17:00 Refugio dinner"]),
        day("To the base of the towers", ["08:00 Walk east along Lago Nordenskjöld", "16:00 Refugio Chileno"]),
        day("The towers at dawn", ["04:30 Climb to the base of the towers for sunrise", "11:00 Down to the hotel Las Torres", "14:00 ~ Free afternoon."]),
      ],
    },
    {
      place: "Puerto Natales",
      summary: "Two nights to rest the legs.",
      days: [
        day("Out of the park", ["09:00 Boat and bus back, about 3h", "14:00 Hot shower, long lunch", "19:00 Dinner"]),
        day("Puerto Natales, free", ["10:00 ~ Nothing planned.", "19:00 Last dinner together"]),
        day("Home from Punta Arenas", ["07:00 Bus to Punta Arenas, about 3h", "13:00 Flight to Santiago, connect home"]),
      ],
    },
  ],
  inPlan: [
    { value: "12", label: "nights, all planned" },
    { value: "2", label: "countries" },
    { value: "4", label: "nights on the trail" },
    { value: "6", label: "walking days" },
  ],
  advice: [
    { topic: "before", title: "Before you go", lines: ["Refugios on the W are booked months ahead. They come with the trip.", "Bring broken-in boots and walking poles."] },
    { topic: "weather", title: "Weather", lines: ["Wind, sun and rain in one hour. Pack layers and a waterproof.", "November to March is the walking season."] },
    { topic: "money", title: "Money", lines: ["Argentina and Chile have their own pesos. Cards work in towns.", "Carry some cash for the refugios' bars."] },
    { topic: "health", title: "On the trail", lines: ["Long days. Train for eight to ten hours of walking before you go."] },
  ],
  goodToKnow: [
    { label: "Pace", text: "Hard. Six walking days, the longest about ten hours." },
    { label: "Sleep", text: "Refugios are shared rooms with bunks." },
  ],
};
