import { day } from "../../day";
import type { PresetDetail } from "../../preset-detail-types";

export const MEXICO_YUCATAN_LOOP: PresetDetail = {
  stops: [
    {
      place: "Tulum",
      summary: "Ruins on a cliff over the sea, and the first cenotes.",
      days: [
        day("Land and drive south", ["13:00 Cancún airport, pick up the car", "16:00 Drive to Tulum, about 2h", "19:30 Tacos in town"]),
        day("Ruins by the sea", ["08:00 Tulum ruins at opening", "11:00 Swim at Playa Paraíso", "16:00 Gran Cenote"], "Swimming in cenotes"),
        day("Cenotes and turtles", ["09:00 Snorkel with turtles at Akumal", "13:00 Cenote Dos Ojos", "17:00 ~ Free evening."]),
      ],
    },
    {
      place: "Valladolid",
      summary: "A colonial town, and Chichén Itzá before the coaches.",
      days: [
        day("Inland to Valladolid", ["10:00 Drive to Valladolid, about 2h", "13:00 Cenote Zací in the middle of town", "19:00 Dinner on the square"]),
        day("Chichén Itzá", ["07:30 Drive to Chichén Itzá", "08:00 The site at opening", "13:00 Cenote Ik Kil", "17:00 Back in Valladolid"], "Chichén Itzá at opening"),
      ],
    },
    {
      place: "Mérida",
      summary: "The Yucatán's capital, for the food and the Sunday market.",
      days: [
        day("To Mérida", ["10:00 Drive to Mérida, about 2h 30", "16:00 Paseo de Montejo", "20:00 Cochinita pibil"]),
        day("Uxmal", ["08:00 Drive to Uxmal", "09:00 The Puuc ruins", "15:00 ~ Free afternoon."]),
        day("Sunday market", ["09:00 The Sunday market on the main square", "13:00 Lunch at Lucas de Gálvez market", "19:00 Music in Santa Lucía park"], "Mérida's Sunday market"),
      ],
    },
    {
      place: "Bacalar",
      summary: "The lagoon of seven colours to end.",
      days: [
        day("South to the lagoon", ["08:00 Drive to Bacalar, about 5h", "15:00 Swim off the dock", "19:00 Dinner by the water"]),
        day("On the lagoon", ["09:00 Sailboat on the lagoon", "13:00 Cenote Azul", "16:00 ~ Free afternoon."], "The lagoon of seven colours"),
        day("Home from Cancún", ["07:00 Drive to Cancún airport, about 4h", "13:00 Flight home"]),
      ],
    },
  ],
  inPlan: [
    { value: "10", label: "nights, all planned" },
    { value: "4", label: "stops" },
    { value: "3", label: "Maya sites" },
    { value: "5", label: "cenotes" },
  ],
  advice: [
    { topic: "before", title: "Before you go", lines: ["Check the entry rules for your passport.", "Bring biodegradable sun cream. Cenotes ask for it."] },
    { topic: "money", title: "Money", lines: ["Carry pesos for cenotes and small places.", "Tip 10 to 15 percent in restaurants."] },
    { topic: "transport", title: "Driving", lines: ["Toll roads are quick and quiet. Slow down for the speed bumps in villages."] },
    { topic: "weather", title: "Weather", lines: ["December to April is dry. Hurricane season runs June to November."] },
  ],
  goodToKnow: [
    { label: "Pace", text: "Steady. One car, short drives except the last." },
    { label: "Early starts", text: "Ruins at opening, before the heat and the coaches." },
  ],
};
